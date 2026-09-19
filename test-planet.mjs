import { createRequire } from "module";

const require = createRequire(import.meta.url);
const data = require("./data.js");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(!data.nameOk(""), "empty name");
assert(!data.nameOk("A"), "one letter is too short");
assert(data.nameOk("Ola"), "name ok");

const save = data.freshSave();
assert(save.room === "out", "start outside");
assert(data.niceScore({}) === 0, "bare planet");
assert(data.visitorCount(0) === 0, "nobody on a bare planet");
assert(data.visitorCount(4) === 1, "one guest when it is a bit nice");
assert(data.visitorCount(12) === 3, "three guests when it is very nice");

const miss = data.tryPlace(10, 10, "out", "flower", {});
assert(!miss.ok, "must walk to a plot");

const plant = data.tryPlace(22, 38, "out", "flower", {});
assert(plant.ok && plant.placed.o0 === "flower", "flower lands on the plot");
assert(data.niceScore(plant.placed) === 2, "flower adds nice");

const indoor = data.tryPlace(22, 38, "out", "rug", {});
assert(indoor.reason === "wrong-room", "rug stays in the house");

const taken = data.tryPlace(22, 38, "out", "tree", plant.placed);
assert(taken.reason === "taken", "plot already has a flower");

assert(!data.tryEnter(22, 38, "out").ok, "door is at the house");
const enter = data.tryEnter(80, 40, "out");
assert(enter.ok && enter.room === "in", "walk into the house");

const rug = data.tryPlace(28, 58, "in", "rug", {});
assert(rug.ok, "rug in the house");

const leave = data.tryExit(50, 86, "in");
assert(leave.ok && leave.room === "out", "walk back out");

console.log("planet tests passed");
