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
  const GUEST_HOMES = [
    { x: 200, y: 560 },
    { x: 1140, y: 900 },
    { x: 1460, y: 640 },
  ];

  const WARES = [
    { id: "flower", name: "Kwiat", cost: 3 },
    { id: "tree", name: "Drzewko", cost: 5 },
    { id: "lamp", name: "Latarnia", cost: 4 },
    { id: "rock", name: "Kamień", cost: 2 },
    { id: "rug", name: "Dywan", cost: 4 },
    { id: "pot", name: "Doniczka", cost: 4 },
  ];

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

  const VISITORS = [
    {
      name: "Ania",
      line: "Przyjechałam do hotelu. U ciebie jest tak ładnie.",
      home: "To już mój domek. Wpadnij, jak będziesz obok.",
    },
    {
      name: "Kuba",
      line: "Spałem w hotelu. Ta planeta jest cała twoja?",
      home: "Mam już swój dom. Dzięki, że gadamy.",
    },
    {
      name: "Maja",
      line: "Hotel jest spoko, ale chcę swój domek.",
      home: "Tu mieszkam. Posadź jeszcze kwiatki koło ścieżki.",
    },
    {
      name: "Tomek",
      line: "Przyszedłem, bo tu jest miło i cicho.",
      home: "Mój domek stoi. Zapraszam na herbatę.",
    },
  ];

  function emptyBag() {
    return { flower: 3, tree: 1, lamp: 0, rock: 1, rug: 1, pot: 0 };
  }

  function freshSave() {
    return {
      name: "",
      look: { hair: 0, hairColor: 1, skin: 0, shirt: 2 },
      placed: {},
      room: "out",
      money: 12,
      bag: emptyBag(),
      talked: {},
    };
  }

  function itemById(id) {
    return OUT_ITEMS.concat(IN_ITEMS).find((item) => item.id === id) || null;
  }

  function spotsFor(room) {
    return room === "in" ? IN_SPOTS : OUT_SPOTS;
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

  function visitorCount(nice) {
    if (nice >= 12) return 3;
    if (nice >= 8) return 2;
    if (nice >= 4) return 1;
    return 0;
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
    return room === "in" ? nearSpot(x, y, HOUSE_EXIT, 14) : nearSpot(x, y, HOUSE_DOOR, 90);
  }

  function tryPlace(x, y, room, held, placed, bag) {
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
    if (!ware) return { ok: false, reason: "missing", save };
    if (save.money < ware.cost) return { ok: false, reason: "poor", save };
    return {
      ok: true,
      reason: "",
      save: {
        ...save,
        money: save.money - ware.cost,
        bag: { ...save.bag, [id]: (save.bag[id] || 0) + 1 },
        look: { ...save.look },
        placed: { ...save.placed },
        talked: { ...save.talked },
      },
    };
  }

  function nearbyTown(x, y) {
    if (nearSpot(x, y, SHOP, 90)) return { kind: "shop" };
    if (nearSpot(x, y, HOTEL, 90)) return { kind: "hotel" };
    if (nearSpot(x, y, HOUSE_DOOR, 90)) return { kind: "home" };
    const index = GUEST_HOMES.findIndex((spot) => nearSpot(x, y, spot, 80));
    if (index >= 0) return { kind: "guest-home", index };
    return null;
  }

  function guestCamp(index, talked) {
    if (talked && GUEST_HOMES[index]) {
      const house = GUEST_HOMES[index];
      return { stay: "home", house, x: house.x - 46, y: house.y + 54 };
    }
    return { stay: "hotel", house: null, x: HOTEL.x - 56, y: HOTEL.y + 74 };
  }

  function tryEnter(x, y, room) {
    if (room !== "out") return { ok: false, reason: "inside", room };
    if (!atDoor(x, y, "out")) return { ok: false, reason: "far", room };
    return { ok: true, reason: "", room: "in", x: 50, y: 72 };
  }

  function tryExit(x, y, room) {
    if (room !== "in") return { ok: false, reason: "outside", room };
    if (!atDoor(x, y, "in")) return { ok: false, reason: "far", room };
    return { ok: true, reason: "", room: "out", x: 1180, y: 520 };
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
    GUEST_HOMES,
    WARES,
    WILD,
    VISITORS,
    emptyBag,
    freshSave,
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
    tryEnter,
    tryExit,
    nameOk,
  };
});
