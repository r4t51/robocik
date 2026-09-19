(function (root, factory) {
  const api = factory();
  root.BarData = api;
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const SKINS = ["#f3c7a6", "#e0a07a", "#b56a43", "#7a3f24"];
  const HAIR_COLORS = ["#2a1c14", "#6b3a1f", "#c46a2d", "#d8b15a", "#3d2b55"];
  const SHIRTS = ["#d6452a", "#2f6f5e", "#2d4a7c", "#f0b429", "#6b3f6e"];
  const HAIR_STYLES = ["krótke", "grzywka", "kucyk", "lok", "kolce"];
  const EXTRAS = ["nic", "okulary", "chusta"];

  const RECIPES = [
    { id: "tea", name: "Herbata", cookMs: 2200, pay: 4, unlock: null },
    { id: "sandwich", name: "Kanapka", cookMs: 3200, pay: 6, unlock: null },
    { id: "soup", name: "Zupa", cookMs: 4000, pay: 8, unlock: null },
    { id: "pancake", name: "Naleśnik", cookMs: 5000, pay: 10, unlock: null },
    { id: "pierogi", name: "Pierogi", cookMs: 6200, pay: 14, unlock: "pierogi" },
  ];

  const UPGRADES = [
    { id: "sign", name: "Nowy szyld", blurb: "Bar wygląda dumniej.", cost: 18 },
    { id: "stove", name: "Szybkie nogi", blurb: "Chodzisz szybciej po kuchni.", cost: 24 },
    { id: "line", name: "Większa kolejka", blurb: "Trzeci klient może czekać.", cost: 32 },
    { id: "burner2", name: "Szersza lada", blurb: "Na ladzie mieszczą się dwa dania.", cost: 40 },
    { id: "pierogi", name: "Półka z pierogami", blurb: "Nowe danie, więcej monet.", cost: 28 },
    { id: "tips", name: "Słoik na napiwki", blurb: "Klienci płacą więcej.", cost: 45 },
  ];

  const STATION_SPOTS = {
    tea: { x: 16, y: 48 },
    sandwich: { x: 16, y: 74 },
    soup: { x: 84, y: 48 },
    pancake: { x: 84, y: 74 },
    pierogi: { x: 50, y: 86 },
  };

  const NAMES = ["Ola", "Janek", "Basia", "Tomek", "Maja", "Kuba", "Zosia", "Bartek"];

  function freshSave() {
    return {
      look: {
        skin: 0,
        hair: 2,
        hairColor: 1,
        shirt: 0,
        extra: 0,
      },
      money: 0,
      owned: {},
    };
  }

  function recipeById(id) {
    return RECIPES.find((recipe) => recipe.id === id) || null;
  }

  function upgradeById(id) {
    return UPGRADES.find((item) => item.id === id) || null;
  }

  function isUnlocked(owned, recipe) {
    return !recipe.unlock || Boolean(owned[recipe.unlock]);
  }

  function openRecipes(owned) {
    return RECIPES.filter((recipe) => isUnlocked(owned, recipe));
  }

  function lineLimit(owned) {
    return owned.line ? 3 : 2;
  }

  function walkSpeed(owned) {
    return owned.stove ? 54 : 38;
  }

  function plateLimit(owned) {
    return owned.burner2 ? 2 : 1;
  }

  function stationsFor(owned) {
    return openRecipes(owned).map((recipe) => ({
      recipeId: recipe.id,
      name: recipe.name,
      x: STATION_SPOTS[recipe.id].x,
      y: STATION_SPOTS[recipe.id].y,
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

  function closestStation(x, y, owned, range) {
    return (
      stationsFor(owned).find((spot) => nearSpot(x, y, spot, range)) || null
    );
  }

  function atCounter(y) {
    return y <= 34;
  }

  function tryPickup(x, y, held, owned) {
    if (held) return { ok: false, reason: "full", held };
    const spot = closestStation(x, y, owned, 13);
    if (!spot) return { ok: false, reason: "far", held };
    return { ok: true, reason: "", held: spot.recipeId, name: spot.name };
  }

  function tryPlace(y, held, plates, owned) {
    if (!held) return { ok: false, reason: "empty", held, plates };
    if (!atCounter(y)) return { ok: false, reason: "far", held, plates };
    if (plates.length >= plateLimit(owned)) return { ok: false, reason: "full", held, plates };
    return {
      ok: true,
      reason: "",
      held: null,
      plates: plates.concat([{ recipeId: held }]),
    };
  }

  function autoTake(plates, customers, owned) {
    for (let i = 0; i < customers.length; i += 1) {
      const guest = customers[i];
      const plateIndex = plates.findIndex((plate) => plate.recipeId === guest.recipeId);
      if (plateIndex === -1) continue;
      const recipe = recipeById(guest.recipeId);
      const pay = payFor(recipe, owned, guest.patience / guest.maxPatience);
      return {
        ok: true,
        pay,
        name: guest.name,
        dish: recipe.name,
        plates: plates.filter((_, index) => index !== plateIndex),
        customers: customers.filter((person) => person.id !== guest.id),
      };
    }
    return { ok: false, plates, customers };
  }

  function payFor(recipe, owned, patienceRatio) {
    const tip = owned.tips ? 1.25 : 1;
    const hurry = 0.75 + 0.35 * Math.max(0, Math.min(1, patienceRatio));
    return Math.max(1, Math.round(recipe.pay * tip * hurry));
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
    SKINS,
    HAIR_COLORS,
    SHIRTS,
    HAIR_STYLES,
    EXTRAS,
    RECIPES,
    UPGRADES,
    NAMES,
    STATION_SPOTS,
    freshSave,
    recipeById,
    upgradeById,
    isUnlocked,
    openRecipes,
    lineLimit,
    walkSpeed,
    plateLimit,
    stationsFor,
    nearSpot,
    closestStation,
    atCounter,
    tryPickup,
    tryPlace,
    autoTake,
    payFor,
    canBuy,
    buyUpgrade,
  };
});
