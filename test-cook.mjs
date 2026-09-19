import { createRequire } from "module";

const require = createRequire(import.meta.url);
const data = require("./data.js");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const save = data.freshSave();
assert(save.look.fur === 0, "cat look");
assert(data.emptyTables({}).length === 3, "three tables");
assert(data.emptyTables({ line: true }).length === 4, "fourth table");

const miss = data.tryPickup(10, 10, null);
assert(!miss.ok, "cannot grab pizza from far away");
const grab = data.tryPickup(50, 86, null);
assert(grab.ok && grab.held === "pizza", "oven gives mushroom pizza");
assert(data.tryPickup(50, 86, "pizza").reason === "full", "one pizza in paws");

const tables = data.emptyTables({});
const guest = { id: 1, name: "Ola", patience: 10, maxPatience: 10 };
assert(data.seatGuest(tables, guest).ok, "guest sits");
assert(!data.tryPlaceOnTable(50, 86, "pizza", tables).ok, "must walk to the table");
assert(data.tryPlaceOnTable(24, 36, "pizza", tables).ok, "pizza lands on the table");
assert(tables[0].pizza, "table has pizza");

const eaten = data.eatAtReadyTables(tables, {});
assert(eaten.ok && eaten.pay >= 2, "they pay");
assert(tables[0].trash, "trash stays");
assert(!tables[0].guest, "guest left");
assert(!tables[0].pizza, "pizza is gone");
assert(data.tryTakeTrash().reason === "no-trash-job", "cat does not take trash");

const next = { id: 2, name: "Janek", patience: 10, maxPatience: 10 };
assert(data.seatGuest(tables, next).ok, "next guest can sit on a messy table");
assert(tables[0].trash, "trash is still there");

console.log("cook tests passed");
