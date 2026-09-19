(function (root, factory) {
  const api = factory();
  root.PlanetData = api;
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const HAIRS = ["proste", "grzywka", "warkocz", "kucyk"];
  const HAIR_COLORS = ["#2a1a12", "#6b3f2a", "#c45a24", "#f4d35e", "#7a2e1b"];
  const SKINS = ["#f3c7a6", "#e0a07a", "#b56a43"];
  const SHIRTS = ["#3d6b4f", "#c45a3a", "#2d4a7c", "#d4a017"];

  const WORLD = { w: 1600, h: 1200 };
  const START = { x: 620, y: 640 };

  const OUT_ITEMS = [
    { id: "flower", name: "Kwiat", nice: 2 },
    { id: "tree", name: "Drzewko", nice: 3 },
    { id: "lamp", name: "Latarnia", nice: 2 },
    { id: "rock", name: "Kamień", nice: 1 },
  ];

  const IN_ITEMS = [
    { id: "rug", name: "Dywan", nice: 2 },
    { id: "pot", name: "Doniczka", nice: 2 },
  ];

  const OUT_SPOTS = [
    { id: "o0", x: 360, y: 520 },
    { id: "o1", x: 520, y: 700 },
    { id: "o2", x: 740, y: 480 },
    { id: "o3", x: 420, y: 880 },
    { id: "o4", x: 780, y: 860 },
    { id: "o5", x: 980, y: 640 },
    { id: "o6", x: 240, y: 740 },
    { id: "o7", x: 880, y: 360 },
  ];

  const IN_SPOTS = [
    { id: "i0", x: 28, y: 58 },
    { id: "i1", x: 50, y: 46 },
    { id: "i2", x: 72, y: 60 },
  ];

  const HOUSE_DOOR = { x: 1280, y: 420 };
  const HOUSE_EXIT = { x: 50, y: 86 };
  const PLAZA = { x: 640, y: 560 };
  const SHOP = { x: 470, y: 520, name: "Sklep" };
  const HOTEL = { x: 800, y: 560, name: "Hotel" };
  const CLINIC = { x: 640, y: 760, name: "Lekarz" };
  const GUEST_HOMES = [
    { x: 200, y: 560 },
    { x: 1140, y: 900 },
    { x: 1460, y: 640 },
  ];

  const WARES = [
    { id: "house", name: "Domek", cost: 10 },
    { id: "flower", name: "Kwiat", cost: 3 },
    { id: "tree", name: "Drzewko", cost: 5 },
    { id: "lamp", name: "Latarnia", cost: 4 },
    { id: "rock", name: "Kamień", cost: 2 },
    { id: "rug", name: "Dywan", cost: 4 },
    { id: "pot", name: "Doniczka", cost: 4 },
  ];

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

  const PATIENTS = ["Ola", "Janek", "Basia", "Tomek", "Maja", "Kuba", "Zosia", "Bartek"];

  const WILD = [
    { kind: "tree", x: 180, y: 280 },
    { kind: "tree", x: 300, y: 220 },
    { kind: "tree", x: 980, y: 240 },
    { kind: "tree", x: 1480, y: 260 },
    { kind: "tree", x: 160, y: 980 },
    { kind: "tree", x: 1420, y: 980 },
    { kind: "rock", x: 210, y: 430 },
    { kind: "flower", x: 860, y: 980 },
  ];

  const FOLK = [];

  const VISITORS = [
    {
      name: "Ania",
      sick: "Nie mam domu. Kaszel mnie męczy.",
      well: "Już mi lepiej. Tylko domu nie mam.",
      home: "Dzięki za domek. Tu mieszkam.",
    },
    {
      name: "Kuba",
      sick: "Śpię pod drzewem. Katar nie daje spać.",
      well: "Katar zszedł. Przydałby się dach.",
      home: "Mam już swój dom. Dzięki.",
    },
    {
      name: "Maja",
      sick: "Nie mam gdzie spać. I swędzi mnie ręka.",
      well: "Maść pomogła. Zbudujesz mi domek?",
      home: "Tu mieszkam. Jest ciepło.",
    },
    {
      name: "Tomek",
      sick: "Jestem chory. I nie mam domu.",
      well: "Głowa już nie boli. Szukam domu.",
      home: "Mój domek stoi. Zapraszam.",
    },
  ];

  function emptyBag() {
    return { house: 1, flower: 3, tree: 1, lamp: 0, rock: 1, rug: 1, pot: 0 };
  }

  function freshSave() {
    return {
      name: "",
      look: { hair: 0, hairColor: 1, skin: 0, shirt: 2 },
      placed: {},
      room: "out",
      money: 16,
      bag: emptyBag(),
      talked: {},
      stock: starterStock(),
      built: {},
      homes: {},
      healed: {},
    };
  }

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

  function unlockedMeds(stock) {
    const pack = stock || {};
    return MEDS.filter((med) => Number.isFinite(pack[med.id]));
  }

  function shelfSpots(stock) {
    const list = unlockedMeds(stock);
    return list.map((med, i) => ({
      id: med.id,
      x: 16 + (i % 2) * 68,
      y: 58 + Math.floor(i / 2) * 11,
    }));
  }

  function restockCost(med) {
    if (!med) return 4;
    if (med.cost > 0) return Math.max(5, Math.round(med.cost / 2));
    return 4;
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
      name: PATIENTS[index % PATIENTS.length],
      need: med.id,
      say: med.ailment,
      pay: med.pay,
      look: {
        skin: index % SKINS.length,
        shirt: index % SHIRTS.length,
      },
    };
  }

  function itemById(id) {
    return OUT_ITEMS.concat(IN_ITEMS).find((item) => item.id === id) || null;
  }

  function isIndoor(room) {
    return Boolean(room) && room !== "out";
  }

  function playing(room) {
    return room === "out" || room === "in" || String(room).startsWith("guest-");
  }

  function folkIn(room) {
    return FOLK.filter((person) => person.room === room);
  }

  function guestRoomIndex(room) {
    if (!String(room).startsWith("guest-")) return -1;
    const index = Number(String(room).slice(6));
    return Number.isInteger(index) ? index : -1;
  }

  function spotsFor(room) {
    return room === "in" ? IN_SPOTS : room === "out" ? OUT_SPOTS : [];
  }

  function itemsFor(room) {
    return room === "in" ? IN_ITEMS : OUT_ITEMS;
  }

  function niceScore(placed) {
    return Object.values(placed).reduce((sum, id) => {
      const item = itemById(id);
      return sum + (item ? item.nice : 0);
    }, 0);
  }

  function housedCount(homes) {
    return Object.keys(homes || {}).length;
  }

  function visitorCount(save) {
    return Math.min(3, housedCount(save && save.homes) + 1);
  }

  function claimedLots(save) {
    return new Set(Object.values((save && save.homes) || {}).map(Number));
  }

  function freeBuiltLot(save) {
    return GUEST_HOMES.findIndex((_, index) => save.built[index] && !claimedLots(save).has(index));
  }

  function makeNeed(index, stock) {
    const unlocked = unlockedMeds(stock);
    const list = unlocked.length ? unlocked : MEDS;
    return list[index % list.length];
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

  function atDoor(x, y, room) {
    if (isIndoor(room)) return nearSpot(x, y, HOUSE_EXIT, 14);
    return nearSpot(x, y, HOUSE_DOOR, 90);
  }

  function indoorGuest(index, room) {
    if (index < 0) return null;
    if (room === `guest-${index}`) return { x: 64, y: 48 };
    return null;
  }

  function tryPlace(x, y, room, held, placed, bag) {
    if (room !== "out" && room !== "in") return { ok: false, reason: "visit", placed, bag };
    if (!held) return { ok: false, reason: "empty", placed, bag };
    const item = itemById(held);
    if (!item) return { ok: false, reason: "missing", placed, bag };
    const pack = bag || { [held]: 1 };
    if ((pack[held] || 0) < 1) return { ok: false, reason: "none", placed, bag: pack };
    const indoor = IN_ITEMS.some((entry) => entry.id === held);
    if (indoor !== (room === "in")) return { ok: false, reason: "wrong-room", placed, bag: pack };
    const range = room === "in" ? 13 : 80;
    const spot = closestSpot(x, y, spotsFor(room), range);
    if (!spot) return { ok: false, reason: "far", placed, bag: pack };
    if (placed[spot.id]) return { ok: false, reason: "taken", placed, bag: pack };
    return {
      ok: true,
      reason: "",
      placed: { ...placed, [spot.id]: held },
      bag: { ...pack, [held]: pack[held] - 1 },
      spotId: spot.id,
    };
  }

  function tryBuy(save, id) {
    const ware = WARES.find((item) => item.id === id);
    if (ware) {
      if (save.money < ware.cost) return { ok: false, reason: "poor", save };
      return {
        ok: true,
        reason: "",
        kind: "ware",
        save: {
          ...save,
          money: save.money - ware.cost,
          bag: { ...save.bag, [id]: (save.bag[id] || 0) + 1 },
          stock: { ...(save.stock || starterStock()) },
          look: { ...save.look },
          placed: { ...save.placed },
          talked: { ...save.talked },
          built: { ...(save.built || {}) },
          homes: { ...(save.homes || {}) },
          healed: { ...(save.healed || {}) },
        },
      };
    }
    const med = medById(id);
    if (!med) return { ok: false, reason: "missing", save };
    const pack = save.stock || starterStock();
    const unlocked = Number.isFinite(pack[id]);
    const price = unlocked ? restockCost(med) : med.cost || 8;
    if (!unlocked && med.cost <= 0) return { ok: false, reason: "owned", save };
    if (save.money < price) return { ok: false, reason: "poor", save };
    return {
      ok: true,
      reason: "",
      kind: "med",
      price,
      save: {
        ...save,
        money: save.money - price,
        bag: { ...save.bag },
        stock: { ...pack, [id]: (pack[id] || 0) + 1 },
        look: { ...save.look },
        placed: { ...save.placed },
        talked: { ...save.talked },
        built: { ...(save.built || {}) },
        homes: { ...(save.homes || {}) },
        healed: { ...(save.healed || {}) },
      },
    };
  }

  function tryHeal(held, person) {
    if (!person) return { ok: false, reason: "far" };
    if (!person.sick) return { ok: false, reason: "well" };
    if (!held || !medById(held)) return { ok: false, reason: "empty" };
    if (held !== person.need) return { ok: false, reason: "wrong" };
    const med = medById(held);
    return { ok: true, reason: "", pay: med ? med.pay : 6 };
  }

  function tryBuild(x, y, save) {
    const index = GUEST_HOMES.findIndex((spot) => nearSpot(x, y, spot, 80));
    if (index < 0) return { ok: false, reason: "far", save };
    if (save.built && save.built[index]) return { ok: false, reason: "taken", save };
    if ((save.bag.house || 0) < 1) return { ok: false, reason: "none", save };
    return {
      ok: true,
      reason: "",
      index,
      save: {
        ...save,
        bag: { ...save.bag, house: save.bag.house - 1 },
        built: { ...(save.built || {}), [index]: true },
        homes: { ...(save.homes || {}) },
        healed: { ...(save.healed || {}) },
        stock: { ...(save.stock || starterStock()) },
        look: { ...save.look },
        placed: { ...save.placed },
        talked: { ...save.talked },
      },
    };
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
      return { ok: false, reason: "wrong", chairId: chair.id };
    }
    const med = medById(held);
    return { ok: true, reason: "", chairId: chair.id, pay: med ? med.pay : 6 };
  }

  function nearbyTown(x, y) {
    if (nearSpot(x, y, SHOP, 90)) return { kind: "shop" };
    if (nearSpot(x, y, HOUSE_DOOR, 90)) return { kind: "home" };
    const index = GUEST_HOMES.findIndex((spot) => nearSpot(x, y, spot, 80));
    if (index >= 0) return { kind: "guest-home", index };
    return null;
  }

  function guestCamp(index, save, name) {
    const lot = save && Number.isInteger(Number(save.homes && save.homes[name])) ? Number(save.homes[name]) : -1;
    if (lot >= 0 && GUEST_HOMES[lot]) {
      const house = GUEST_HOMES[lot];
      return { stay: "home", house, x: house.x - 46, y: house.y + 54 };
    }
    return { stay: "camp", house: null, x: PLAZA.x - 40 + index * 56, y: PLAZA.y + 90 };
  }

  function tryEnterTown(x, y, room, built) {
    if (room !== "out") return { ok: false, reason: "inside", room };
    const town = nearbyTown(x, y);
    if (!town) return { ok: false, reason: "far", room };
    if (town.kind === "shop") return { ok: false, reason: "shop", room };
    if (town.kind === "home") return { ok: true, reason: "", room: "in", x: 50, y: 72 };
    if (town.kind === "guest-home") {
      if (!built || !built[town.index]) return { ok: false, reason: "empty", room };
      return { ok: true, reason: "", room: `guest-${town.index}`, x: 50, y: 72 };
    }
    return { ok: false, reason: "far", room };
  }

  function tryEnter(x, y, room) {
    const result = tryEnterTown(x, y, room, {}, 0);
    if (result.ok && result.room === "in") return result;
    if (room !== "out") return { ok: false, reason: "inside", room };
    if (!atDoor(x, y, "out")) return { ok: false, reason: "far", room };
    return { ok: true, reason: "", room: "in", x: 50, y: 72 };
  }

  function tryExit(x, y, room) {
    if (!isIndoor(room)) return { ok: false, reason: "outside", room };
    if (!nearSpot(x, y, HOUSE_EXIT, 14)) return { ok: false, reason: "far", room };
    if (room === "in") return { ok: true, reason: "", room: "out", x: 1180, y: 520 };
    const index = guestRoomIndex(room);
    if (index >= 0 && GUEST_HOMES[index]) {
      const house = GUEST_HOMES[index];
      return { ok: true, reason: "", room: "out", x: house.x, y: house.y + 90 };
    }
    return { ok: false, reason: "outside", room };
  }

  function nameOk(name) {
    return String(name || "").trim().length >= 2;
  }

  return {
    HAIRS,
    HAIR_COLORS,
    SKINS,
    SHIRTS,
    WORLD,
    START,
    OUT_ITEMS,
    IN_ITEMS,
    OUT_SPOTS,
    IN_SPOTS,
    HOUSE_DOOR,
    HOUSE_EXIT,
    PLAZA,
    SHOP,
    HOTEL,
    CLINIC,
    GUEST_HOMES,
    WARES,
    MEDS,
    CHAIRS,
    PATIENTS,
    WILD,
    FOLK,
    VISITORS,
    emptyBag,
    freshSave,
    medById,
    starterStock,
    unlockedMeds,
    shelfSpots,
    restockCost,
    emptyChairs,
    makeGuest,
    makeNeed,
    housedCount,
    claimedLots,
    freeBuiltLot,
    tryHeal,
    tryBuild,
    tryGrab,
    tryTreat,
    isIndoor,
    playing,
    folkIn,
    guestRoomIndex,
    indoorGuest,
    itemById,
    spotsFor,
    itemsFor,
    niceScore,
    visitorCount,
    closestSpot,
    atDoor,
    tryPlace,
    tryBuy,
    nearbyTown,
    guestCamp,
    tryEnterTown,
    tryEnter,
    tryExit,
    nameOk,
  };
});
