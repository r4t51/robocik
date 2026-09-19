(function (root, factory) {
  const api = factory();
  root.BarData = api;
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const FURS = ["#d9b48a", "#f4d35e", "#c45a24", "#6b5344", "#2a2118"];
  const MARKS = ["gładki", "łaty", "paski"];
  const EXTRAS = ["nic", "kokarda", "dzwonek"];

  const PIZZA = { id: "pizza", name: "Pizza z grzybami", pay: 8 };
  const OVEN = { x: 50, y: 86, recipeId: "pizza", name: "Pizza z grzybami" };

  const TABLE_SPOTS = [
    { id: 0, x: 24, y: 38 },
    { id: 1, x: 70, y: 38 },
    { id: 2, x: 48, y: 60 },
    { id: 3, x: 26, y: 74 },
  ];

  const UPGRADES = [
    { id: "sign", name: "Nowy szyld", blurb: "Pizzeria kota wygląda dumniej.", cost: 16 },
    { id: "stove", name: "Szybkie łapki", blurb: "Kotek biega szybciej.", cost: 22 },
    { id: "line", name: "Czwarty stolik", blurb: "Jeszcze jeden stół na sali.", cost: 30 },
    { id: "tips", name: "Większe kawałki", blurb: "Klienci płacą więcej za pizzę.", cost: 36 },
  ];

  const NAMES = ["Ola", "Janek", "Basia", "Tomek", "Maja", "Kuba", "Zosia", "Bartek"];

  function freshSave() {
    return {
      look: { fur: 0, mark: 1, extra: 1 },
      money: 0,
      owned: {},
    };
  }

  function upgradeById(id) {
    return UPGRADES.find((item) => item.id === id) || null;
  }

  function tableCount(owned) {
    return owned.line ? 4 : 3;
  }

  function walkSpeed(owned) {
    return owned.stove ? 56 : 40;
  }

  function emptyTables(owned) {
    return TABLE_SPOTS.slice(0, tableCount(owned)).map((spot) => ({
      id: spot.id,
      x: spot.x,
      y: spot.y,
      guest: null,
      pizza: false,
      trash: false,
    }));
  }

  function dist2(ax, ay, bx, by) {
    const dx = ax - bx;
    const dy = ay - by;
    return dx * dx + dy * dy;
  }

  function nearSpot(x, y, spot, range) {
    return dist2(x, y, spot.x, spot.y) <= range * range;
  }

  function atOven(x, y) {
    return nearSpot(x, y, OVEN, 14);
  }

  function closestTable(x, y, tables, range) {
    return tables.find((table) => nearSpot(x, y, table, range)) || null;
  }

  function tryPickup(x, y, held) {
    if (held) return { ok: false, reason: "full", held };
    if (!atOven(x, y)) return { ok: false, reason: "far", held };
    return { ok: true, reason: "", held: "pizza", name: PIZZA.name };
  }

  function tryPlaceOnTable(x, y, held, tables) {
    if (held !== "pizza") return { ok: false, reason: "empty", tables };
    const table = closestTable(x, y, tables, 14);
    if (!table) return { ok: false, reason: "far", tables };
    if (!table.guest) return { ok: false, reason: "empty-table", tables };
    if (table.pizza) return { ok: false, reason: "has-pizza", tables };
    table.pizza = true;
    return { ok: true, reason: "", held: null, tables, tableId: table.id };
  }

  function payFor(owned, patienceRatio) {
    const tip = owned.tips ? 1.3 : 1;
    const hurry = 0.8 + 0.3 * Math.max(0, Math.min(1, patienceRatio));
    return Math.max(2, Math.round(PIZZA.pay * tip * hurry));
  }

  function eatAtReadyTables(tables, owned) {
    const ready = tables.find((table) => table.guest && table.pizza);
    if (!ready) return { ok: false, tables };
    const guest = ready.guest;
    const pay = payFor(owned, guest.patience / guest.maxPatience);
    ready.pizza = false;
    ready.trash = true;
    ready.guest = null;
    return { ok: true, pay, name: guest.name, tables };
  }

  function tryTakeTrash() {
    return { ok: false, reason: "no-trash-job" };
  }

  function seatGuest(tables, guest) {
    const free = tables.find((table) => !table.guest);
    if (!free) return { ok: false, tables };
    free.guest = guest;
    return { ok: true, tables, tableId: free.id };
  }

  function canBuy(save, id) {
    const item = upgradeById(id);
    if (!item) return { ok: false, reason: "missing" };
    if (save.owned[id]) return { ok: false, reason: "owned" };
    if (save.money < item.cost) return { ok: false, reason: "poor" };
    return { ok: true, reason: "" };
  }

  function buyUpgrade(save, id) {
    const item = upgradeById(id);
    const check = canBuy(save, id);
    if (!item || !check.ok) return { ok: false, reason: check.reason, save };
    return {
      ok: true,
      reason: "",
      save: {
        ...save,
        money: save.money - item.cost,
        owned: { ...save.owned, [id]: true },
        look: { ...save.look },
      },
    };
  }

  return {
    FURS,
    MARKS,
    EXTRAS,
    PIZZA,
    OVEN,
    TABLE_SPOTS,
    UPGRADES,
    NAMES,
    freshSave,
    upgradeById,
    tableCount,
    walkSpeed,
    emptyTables,
    atOven,
    closestTable,
    tryPickup,
    tryPlaceOnTable,
    eatAtReadyTables,
    tryTakeTrash,
    seatGuest,
    payFor,
    canBuy,
    buyUpgrade,
  };
});
