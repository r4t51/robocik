import { createRequire } from "module";

const require = createRequire(import.meta.url);
const data = require("./data.js");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const save = data.freshSave();
assert(save.money === 0, "start broke");
assert(data.openRecipes({}).length === 4, "four starter dishes");
assert(data.openRecipes({ pierogi: true }).some((r) => r.id === "pierogi"), "pierogi unlock");

const stoves = data.emptyStoves({});
assert(stoves.length === 1, "one burner at start");
assert(data.emptyStoves({ burner2: true }).length === 2, "second burner");

const cooking = data.startCook(stoves, {}, "tea");
assert(cooking.ok, "tea starts");
data.tickStoves(stoves, 2500);
assert(stoves[0].ready, "tea finishes");

const guests = [
  { id: 1, recipeId: "tea", patience: 10, maxPatience: 12 },
  { id: 2, recipeId: "soup", patience: 10, maxPatience: 12 },
];
const served = data.serveCustomer(stoves, guests, {}, 1);
assert(served.ok && served.pay >= 3, "tea pays");
assert(served.customers.length === 1, "served guest leaves");

const noDish = data.serveCustomer(data.emptyStoves({}), guests, {}, 2);
assert(!noDish.ok && noDish.reason === "not-ready", "cannot serve missing plate");

const bought = data.buyUpgrade({ ...save, money: 18 }, "sign");
assert(bought.ok && bought.save.money === 0 && bought.save.owned.sign, "sign costs 18");
assert(data.buyUpgrade(bought.save, "sign").reason === "owned", "no double buy");
assert(data.payFor(data.recipeById("tea"), { tips: true }, 1) > data.payFor(data.recipeById("tea"), {}, 1), "tips pay more");

console.log("cook tests passed");
