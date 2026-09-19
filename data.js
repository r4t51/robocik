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
    { id: "stove", name: "Szybka kuchenka", blurb: "Dania schodzą szybciej.", cost: 24 },
    { id: "line", name: "Większa kolejka", blurb: "Trzeci klient może czekać.", cost: 32 },
    { id: "burner2", name: "Drugi palnik", blurb: "Gotujesz dwa dania naraz.", cost: 40 },
    { id: "pierogi", name: "Przepis na pierogi", blurb: "Nowe danie, więcej monet.", cost: 28 },
    { id: "tips", name: "Słoik na napiwki", blurb: "Klienci płacą więcej.", cost: 45 },
  ];

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

  function stoveCount(owned) {
    return owned.burner2 ? 2 : 1;
  }

  function lineLimit(owned) {
    return owned.line ? 3 : 2;
  }

  function cookScale(owned) {
    return owned.stove ? 0.72 : 1;
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

  function emptyStoves(owned) {
    return Array.from({ length: stoveCount(owned) }, () => ({
      recipeId: null,
      left: 0,
      ready: false,
    }));
  }

  function startCook(stoves, owned, recipeId) {
    const recipe = recipeById(recipeId);
    if (!recipe || !isUnlocked(owned, recipe)) return { ok: false, reason: "locked", stoves };
    const slot = stoves.find((stove) => !stove.recipeId);
    if (!slot) return { ok: false, reason: "busy", stoves };
    slot.recipeId = recipeId;
    slot.left = recipe.cookMs * cookScale(owned);
    slot.ready = false;
    return { ok: true, reason: "", stoves };
  }

  function tickStoves(stoves, dtMs) {
    stoves.forEach((stove) => {
      if (!stove.recipeId || stove.ready) return;
      stove.left -= dtMs;
      if (stove.left <= 0) {
        stove.left = 0;
        stove.ready = true;
      }
    });
    return stoves;
  }

  function serveCustomer(stoves, customers, owned, customerId) {
    const customer = customers.find((person) => person.id === customerId);
    if (!customer) return { ok: false, reason: "gone" };
    const stove = stoves.find((slot) => slot.ready && slot.recipeId === customer.recipeId);
    if (!stove) return { ok: false, reason: "not-ready" };
    const recipe = recipeById(customer.recipeId);
    const pay = payFor(recipe, owned, customer.patience / customer.maxPatience);
    stove.recipeId = null;
    stove.left = 0;
    stove.ready = false;
    return {
      ok: true,
      reason: "",
      pay,
      customers: customers.filter((person) => person.id !== customerId),
      stoves,
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
    freshSave,
    recipeById,
    upgradeById,
    isUnlocked,
    openRecipes,
    stoveCount,
    lineLimit,
    cookScale,
    payFor,
    canBuy,
    buyUpgrade,
    emptyStoves,
    startCook,
    tickStoves,
    serveCustomer,
  };
});
