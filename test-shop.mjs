import { createRequire } from "module";

const require = createRequire(import.meta.url);
const shop = require("./shop.js");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const start = shop.freshRun();
assert(start.coins === 0, "new run starts with 0 coins");
assert(start.lives === 3, "new run starts with 3 lives");

const afterOne = shop.awardLevel(start, 0);
assert(afterOne.reward === 8, "first level pays 8");
assert(afterOne.state.coins === 8, "coins are added");
assert(shop.coinsForLevel(9) === 32, "tenth level pays the most");

assert(shop.buy(afterOne.state, "missing").reason === "missing", "unknown item is rejected");
assert(shop.buy({ ...afterOne.state, coins: 5 }, "slow").reason === "poor", "too few coins");
const slow = shop.buy(afterOne.state, "slow");
assert(slow.ok, "8 coins buy slow robots");
assert(slow.state.coins === 0, "coins are spent");
assert(slow.state.owned.slow, "slow is owned");

const again = shop.buy(slow.state, "slow");
assert(!again.ok && again.reason === "owned", "one-time upgrade cannot be bought twice");

const rich = { ...shop.freshRun(), coins: 40, lives: 5 };
assert(shop.buy(rich, "life").reason === "full", "lives cap at 5");

const shieldBuy = shop.buy({ ...shop.freshRun(), coins: 16 }, "shield");
assert(shieldBuy.ok && shieldBuy.state.shields === 1, "shield stacks as a charge");

const lifeBuy = shop.buy({ ...shop.freshRun(), coins: 12, lives: 2 }, "life");
assert(lifeBuy.state.lives === 3, "life upgrade adds one life");

console.log("shop tests passed");
