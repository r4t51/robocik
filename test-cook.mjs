import { createRequire } from "module";

const require = createRequire(import.meta.url);
const data = require("./data.js");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const save = data.freshSave();
assert(save.money === 0, "start broke");
assert(data.openRecipes({}).length === 4, "four starter dishes");
assert(data.stationsFor({}).every((spot) => spot.x && spot.y), "stations have places");
assert(data.stationsFor({}).every((spot) => spot.recipeId !== "pierogi"), "pierogi hidden");
assert(data.stationsFor({ pierogi: true }).some((spot) => spot.recipeId === "pierogi"), "pierogi shelf");

const far = data.tryPickup(50, 50, null, {});
assert(!far.ok && far.reason === "far", "cannot grab from the middle");

const grab = data.tryPickup(16, 48, null, {});
assert(grab.ok && grab.held === "tea", "walk to tea and take it");

const handsFull = data.tryPickup(16, 48, "tea", {});
assert(!handsFull.ok && handsFull.reason === "full", "one thing at a time");

const notYet = data.tryPlace(70, "tea", [], {});
assert(!notYet.ok && notYet.reason === "far", "must walk to the counter");

const laid = data.tryPlace(30, "tea", [], {});
assert(laid.ok && laid.held === null && laid.plates[0].recipeId === "tea", "counter takes the dish");

const crowded = data.tryPlace(30, "soup", [{ recipeId: "tea" }], {});
assert(!crowded.ok && crowded.reason === "full", "one plate until wider counter");
assert(data.tryPlace(30, "soup", [{ recipeId: "tea" }], { burner2: true }).ok, "wider counter holds two");

const guests = [
  { id: 1, recipeId: "tea", patience: 10, maxPatience: 12 },
  { id: 2, recipeId: "soup", patience: 10, maxPatience: 12 },
];
const taken = data.autoTake([{ recipeId: "tea" }], guests, {});
assert(taken.ok && taken.pay >= 3, "customer takes their dish");
assert(taken.customers.length === 1, "that guest leaves");
assert(taken.plates.length === 0, "plate is gone");

const ignored = data.autoTake([{ recipeId: "pancake" }], guests, {});
assert(!ignored.ok, "nobody takes the wrong dish");

const bought = data.buyUpgrade({ ...save, money: 18 }, "sign");
assert(bought.ok && bought.save.owned.sign, "sign costs 18");
assert(data.walkSpeed({ stove: true }) > data.walkSpeed({}), "legs upgrade is faster");

console.log("cook tests passed");
