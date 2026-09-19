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
    { id: "o0", x: 22, y: 38 },
    { id: "o1", x: 40, y: 52 },
    { id: "o2", x: 58, y: 36 },
    { id: "o3", x: 28, y: 70 },
    { id: "o4", x: 52, y: 72 },
    { id: "o5", x: 70, y: 64 },
  ];

  const IN_SPOTS = [
    { id: "i0", x: 28, y: 58 },
    { id: "i1", x: 50, y: 46 },
    { id: "i2", x: 72, y: 60 },
  ];

  const HOUSE_DOOR = { x: 80, y: 40 };
  const HOUSE_EXIT = { x: 50, y: 86 };

  const VISITORS = [
    { name: "Ania", line: "U ciebie jest tak ładnie." },
    { name: "Kuba", line: "Ta planeta jest cała twoja? Super." },
    { name: "Maja", line: "Lubię twój domek." },
    { name: "Tomek", line: "Przyleciałem, bo tu jest miło." },
  ];

  function freshSave() {
    return {
      name: "",
      look: { hair: 0, hairColor: 1, skin: 0, shirt: 0 },
      placed: {},
      room: "out",
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
    return spots.find((spot) => nearSpot(x, y, spot, range)) || null;
  }

  function atDoor(x, y, room) {
    return room === "in" ? nearSpot(x, y, HOUSE_EXIT, 14) : nearSpot(x, y, HOUSE_DOOR, 14);
  }

  function tryPlace(x, y, room, held, placed) {
    if (!held) return { ok: false, reason: "empty", placed };
    const item = itemById(held);
    if (!item) return { ok: false, reason: "missing", placed };
    const indoor = IN_ITEMS.some((entry) => entry.id === held);
    if (indoor !== (room === "in")) return { ok: false, reason: "wrong-room", placed };
    const spot = closestSpot(x, y, spotsFor(room), 13);
    if (!spot) return { ok: false, reason: "far", placed };
    if (placed[spot.id]) return { ok: false, reason: "taken", placed };
    return {
      ok: true,
      reason: "",
      placed: { ...placed, [spot.id]: held },
      spotId: spot.id,
    };
  }

  function tryEnter(x, y, room) {
    if (room !== "out") return { ok: false, reason: "inside", room };
    if (!atDoor(x, y, "out")) return { ok: false, reason: "far", room };
    return { ok: true, reason: "", room: "in", x: 50, y: 72 };
  }

  function tryExit(x, y, room) {
    if (room !== "in") return { ok: false, reason: "outside", room };
    if (!atDoor(x, y, "in")) return { ok: false, reason: "far", room };
    return { ok: true, reason: "", room: "out", x: 68, y: 48 };
  }

  function nameOk(name) {
    return String(name || "").trim().length >= 2;
  }

  return {
    HAIRS,
    HAIR_COLORS,
    SKINS,
    SHIRTS,
    OUT_ITEMS,
    IN_ITEMS,
    OUT_SPOTS,
    IN_SPOTS,
    HOUSE_DOOR,
    HOUSE_EXIT,
    VISITORS,
    freshSave,
    itemById,
    spotsFor,
    itemsFor,
    niceScore,
    visitorCount,
    closestSpot,
    atDoor,
    tryPlace,
    tryEnter,
    tryExit,
    nameOk,
  };
});
