(function (root, factory) {
  const api = factory();
  root.RoboShop = api;
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const START_LIVES = 3;
  const MAX_LIVES = 5;

  const CATALOG = [
    {
      id: "life",
      name: "Życie",
      blurb: "+1 życie",
      cost: 6,
      once: false,
    },
    {
      id: "jump",
      name: "Długi skok",
      blurb: "Łatwiej przeskoczyć ściankę",
      cost: 7,
      once: true,
    },
    {
      id: "speed",
      name: "Szybkie nogi",
      blurb: "Chodzisz szybciej",
      cost: 7,
      once: true,
    },
    {
      id: "shield",
      name: "Tarcza",
      blurb: "Jeden cios za darmo",
      cost: 8,
      once: false,
    },
    {
      id: "slow",
      name: "Wolne roboty",
      blurb: "Wrogowie zwalniają",
      cost: 8,
      once: true,
    },
  ];

  function freshRun() {
    return {
      coins: 0,
      lives: START_LIVES,
      shields: 0,
      owned: {
        jump: false,
        speed: false,
        slow: false,
      },
    };
  }

  function coinsForLevel(levelIndex) {
    return [8, 12, 16][levelIndex] || 10;
  }

  function findItem(id) {
    return CATALOG.find((item) => item.id === id) || null;
  }

  function canBuy(state, id) {
    const item = findItem(id);
    if (!item) return { ok: false, reason: "missing" };
    if (item.once && state.owned[id]) return { ok: false, reason: "owned" };
    if (id === "life" && state.lives >= MAX_LIVES) return { ok: false, reason: "full" };
    if (state.coins < item.cost) return { ok: false, reason: "poor" };
    return { ok: true, reason: "" };
  }

  function buy(state, id) {
    const item = findItem(id);
    const check = canBuy(state, id);
    if (!item || !check.ok) {
      return { ok: false, reason: check.reason, state };
    }

    const next = {
      coins: state.coins - item.cost,
      lives: state.lives,
      shields: state.shields,
      owned: { ...state.owned },
    };

    if (id === "life") next.lives += 1;
    if (id === "shield") next.shields += 1;
    if (item.once) next.owned[id] = true;

    return { ok: true, reason: "", state: next, item };
  }

  function awardLevel(state, levelIndex) {
    const reward = coinsForLevel(levelIndex);
    return {
      reward,
      state: {
        ...state,
        coins: state.coins + reward,
        owned: { ...state.owned },
      },
    };
  }

  return {
    START_LIVES,
    MAX_LIVES,
    CATALOG,
    freshRun,
    coinsForLevel,
    findItem,
    canBuy,
    buy,
    awardLevel,
  };
});
