(function (root, factory) {
  const api = factory();
  root.ClinicData = api;
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const JAIL_MS = 3 * 60 * 1000;

  const MEDS = [
    { id: "syrup", name: "Jagodowy syrop", ailment: "Kaszel", color: "#6b2a7c", pay: 6, cost: 0, start: 2 },
    { id: "drops", name: "Miętowe krople", ailment: "Katar", color: "#1f8a72", pay: 6, cost: 0, start: 2 },
    { id: "salve", name: "Złota maść", ailment: "Swędzenie", color: "#d4a017", pay: 7, cost: 0, start: 2 },
    { id: "plaster", name: "Niebieski plaster", ailment: "Skaleczenie", color: "#3d7ad6", pay: 8, cost: 12, start: 0 },
    { id: "pill", name: "Słoneczna tabletka", ailment: "Ból głowy", color: "#e07a2a", pay: 8, cost: 16, start: 0 },
    { id: "elixir", name: "Zielony eliksir", ailment: "Ból brzucha", color: "#2f6b3a", pay: 10, cost: 20, start: 0 },
  ];

  const CHAIRS = [
    { id: 0, x: 22, y: 36 },
    { id: 1, x: 50, y: 32 },
    { id: 2, x: 74, y: 36 },
  ];

  const NAMES = ["Ola", "Janek", "Basia", "Tomek", "Maja", "Kuba", "Zosia", "Bartek"];
  const SHIRTS = ["#c45a3a", "#2d4a7c", "#d4a017", "#3d6b4f", "#6b2a7c"];
  const SKINS = ["#f3c7a6", "#e0a07a", "#b56a43"];

  function medById(id) {
    return MEDS.find((med) => med.id === id) || null;
  }

  function starterStock() {
    const stock = {};
    MEDS.forEach((med) => {
      if (med.start > 0) stock[med.id] = med.start;
    });
    return stock;
  }

  function freshSave() {
    return { score: 0, money: 8, jailUntil: 0, stock: starterStock() };
  }

  function unlockedMeds(stock) {
    const pack = stock || {};
    return MEDS.filter((med) => Number.isFinite(pack[med.id]));
  }

  function shelfSpots(stock) {
    const list = unlockedMeds(stock);
    return list.map((med, i) => ({
      id: med.id,
      x: 18 + (i % 3) * 32,
      y: i < 3 ? 70 : 86,
    }));
  }

  function restockCost(med) {
    if (!med) return 4;
    if (med.cost > 0) return Math.max(5, Math.round(med.cost / 2));
    return 4;
  }

  function jailLeft(now, jailUntil) {
    return Math.max(0, Number(jailUntil) - Number(now));
  }

  function inJail(now, jailUntil) {
    return jailLeft(now, jailUntil) > 0;
  }

  function lockJail(now) {
    return Number(now) + JAIL_MS;
  }

  function jailClock(ms) {
    const total = Math.max(0, Math.ceil(Number(ms) / 1000));
    const min = Math.floor(total / 60);
    const sec = total % 60;
    return `${min}:${String(sec).padStart(2, "0")}`;
  }

  function emptyChairs() {
    return CHAIRS.map((spot) => ({ id: spot.id, x: spot.x, y: spot.y, guest: null }));
  }

  function makeGuest(index, stock) {
    const unlocked = unlockedMeds(stock);
    const pool = unlocked.filter((med) => (stock[med.id] || 0) > 0);
    const list = pool.length ? pool : unlocked.length ? unlocked : MEDS;
    const med = list[index % list.length];
    return {
      name: NAMES[index % NAMES.length],
      need: med.id,
      say: med.ailment,
      pay: med.pay,
      look: {
        skin: index % SKINS.length,
        shirt: index % SHIRTS.length,
      },
    };
  }

  function dist2(ax, ay, bx, by) {
    const dx = ax - bx;
    const dy = ay - by;
    return dx * dx + dy * dy;
  }

  function closestSpot(x, y, spots, range) {
    let best = null;
    let bestD = range * range;
    spots.forEach((spot) => {
      const d = dist2(x, y, spot.x, spot.y);
      if (d <= bestD) {
        bestD = d;
        best = spot;
      }
    });
    return best;
  }

  function tryGrab(x, y, held, stock) {
    const pack = stock || starterStock();
    const spot = closestSpot(x, y, shelfSpots(pack), 14);
    if (!spot) return { ok: false, reason: "far", held };
    if ((pack[spot.id] || 0) < 1) return { ok: false, reason: "none", held };
    return { ok: true, reason: "", held: spot.id };
  }

  function tryTreat(x, y, held, chairs) {
    const chair = closestSpot(x, y, chairs, 14);
    if (!chair || !chair.guest) return { ok: false, reason: "far" };
    if (!held) return { ok: false, reason: "empty" };
    if (held !== chair.guest.need) {
      return { ok: false, reason: "wrong", jail: true, chairId: chair.id };
    }
    const med = medById(held);
    return { ok: true, reason: "", chairId: chair.id, pay: med ? med.pay : 6 };
  }

  function tryBuy(save, id) {
    const med = medById(id);
    if (!med) return { ok: false, reason: "missing", save };
    const unlocked = Number.isFinite(save.stock[id]);
    const price = unlocked ? restockCost(med) : med.cost || 8;
    if (!unlocked && med.cost <= 0) return { ok: false, reason: "owned", save };
    if (save.money < price) return { ok: false, reason: "poor", save };
    return {
      ok: true,
      reason: "",
      price,
      save: {
        ...save,
        money: save.money - price,
        stock: { ...save.stock, [id]: (save.stock[id] || 0) + 1 },
        jailUntil: save.jailUntil,
      },
    };
  }

  return {
    JAIL_MS,
    MEDS,
    CHAIRS,
    NAMES,
    SHIRTS,
    SKINS,
    medById,
    starterStock,
    freshSave,
    unlockedMeds,
    shelfSpots,
    restockCost,
    jailLeft,
    inJail,
    lockJail,
    jailClock,
    emptyChairs,
    makeGuest,
    closestSpot,
    tryGrab,
    tryTreat,
    tryBuy,
  };
});
