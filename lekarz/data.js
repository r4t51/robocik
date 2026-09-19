(function (root, factory) {
  const api = factory();
  root.ClinicData = api;
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const JAIL_MS = 3 * 60 * 1000;

  const MEDS = [
    { id: "syrup", name: "Jagodowy syrop", ailment: "Kaszel", color: "#6b2a7c" },
    { id: "drops", name: "Miętowe krople", ailment: "Katar", color: "#1f8a72" },
    { id: "salve", name: "Złota maść", ailment: "Swędzenie", color: "#d4a017" },
    { id: "pill", name: "Słoneczna tabletka", ailment: "Ból głowy", color: "#e07a2a" },
    { id: "elixir", name: "Zielony eliksir", ailment: "Ból brzucha", color: "#2f6b3a" },
  ];

  const SHELF = [
    { id: "syrup", x: 16, y: 84 },
    { id: "drops", x: 33, y: 84 },
    { id: "salve", x: 50, y: 84 },
    { id: "pill", x: 67, y: 84 },
    { id: "elixir", x: 84, y: 84 },
  ];

  const CHAIRS = [
    { id: 0, x: 22, y: 40 },
    { id: 1, x: 50, y: 36 },
    { id: 2, x: 74, y: 40 },
  ];

  const NAMES = ["Ola", "Janek", "Basia", "Tomek", "Maja", "Kuba", "Zosia", "Bartek"];
  const SHIRTS = ["#c45a3a", "#2d4a7c", "#d4a017", "#3d6b4f", "#6b2a7c"];
  const SKINS = ["#f3c7a6", "#e0a07a", "#b56a43"];

  function medById(id) {
    return MEDS.find((med) => med.id === id) || null;
  }

  function freshSave() {
    return { score: 0, jailUntil: 0 };
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

  function makeGuest(index) {
    const med = MEDS[index % MEDS.length];
    return {
      name: NAMES[index % NAMES.length],
      need: med.id,
      say: med.ailment,
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

  function nearSpot(x, y, spot, range) {
    return dist2(x, y, spot.x, spot.y) <= range * range;
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

  function tryGrab(x, y, held) {
    const spot = closestSpot(x, y, SHELF, 14);
    if (!spot) return { ok: false, reason: "far", held };
    return { ok: true, reason: "", held: spot.id };
  }

  function tryTreat(x, y, held, chairs) {
    const chair = closestSpot(x, y, chairs, 14);
    if (!chair || !chair.guest) return { ok: false, reason: "far" };
    if (!held) return { ok: false, reason: "empty" };
    if (held !== chair.guest.need) return { ok: false, reason: "wrong", jail: true, chairId: chair.id };
    return { ok: true, reason: "", chairId: chair.id };
  }

  return {
    JAIL_MS,
    MEDS,
    SHELF,
    CHAIRS,
    NAMES,
    SHIRTS,
    SKINS,
    medById,
    freshSave,
    jailLeft,
    inJail,
    lockJail,
    jailClock,
    emptyChairs,
    makeGuest,
    closestSpot,
    tryGrab,
    tryTreat,
  };
});
