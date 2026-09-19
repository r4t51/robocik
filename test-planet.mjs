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

const plant = data.tryPlace(360, 520, "out", "flower", {});
assert(plant.ok && plant.placed.o0 === "flower", "flower lands on the plot");
assert(data.niceScore(plant.placed) === 2, "flower adds nice");

const indoor = data.tryPlace(360, 520, "out", "rug", {});
assert(indoor.reason === "wrong-room", "rug stays in the house");

const taken = data.tryPlace(360, 520, "out", "tree", plant.placed);
assert(taken.reason === "taken", "plot already has a flower");

assert(!data.tryEnter(360, 520, "out").ok, "door is at the house");
const enter = data.tryEnter(1280, 420, "out");
assert(enter.ok && enter.room === "in", "walk into the house");

const rug = data.tryPlace(28, 58, "in", "rug", {});
assert(rug.ok, "rug in the house");

const leave = data.tryExit(50, 86, "in");
assert(leave.ok && leave.room === "out", "walk back out");

const none = data.tryPlace(360, 520, "out", "flower", {}, { flower: 0 });
assert(none.reason === "none", "empty bag cannot plant");

const spent = data.tryPlace(360, 520, "out", "flower", {}, { flower: 2 });
assert(spent.ok && spent.bag.flower === 1, "planting uses the bag");

const buy = data.tryBuy(save, "flower");
assert(buy.ok && buy.save.money === 9 && buy.save.bag.flower === 4, "shop sells a flower");

const broke = data.tryBuy({ ...save, money: 1, bag: data.emptyBag() }, "tree");
assert(broke.reason === "poor", "tree costs more than 1");

assert(data.nearbyTown(470, 520).kind === "shop", "shop door");
assert(data.nearbyTown(800, 560).kind === "hotel", "hotel door");
assert(data.nearbyTown(1280, 420).kind === "home", "own house");
assert(data.nearbyTown(200, 560).kind === "guest-home", "guest house lot");

const hotelStay = data.guestCamp(0, false);
assert(hotelStay.stay === "hotel", "new guest sleeps in the hotel");
const homeStay = data.guestCamp(0, true);
assert(homeStay.stay === "home" && homeStay.house.x === 200, "after talk they get a house");

const hotelIn = data.tryEnterTown(800, 560, "out", {}, 1);
assert(hotelIn.ok && hotelIn.room === "hotel", "walk into the hotel");
const hotelOut = data.tryExit(50, 86, "hotel");
assert(hotelOut.ok && hotelOut.room === "out", "leave the hotel");

const locked = data.tryEnterTown(200, 560, "out", {}, 0);
assert(locked.reason === "empty", "no house before a guest arrives");
const guestIn = data.tryEnterTown(200, 560, "out", {}, 1);
assert(guestIn.ok && guestIn.room === "guest-0", "walk into a guest house");
const guestOut = data.tryExit(50, 86, "guest-0");
assert(guestOut.ok && guestOut.room === "out", "leave the guest house");

const visit = data.tryPlace(50, 50, "hotel", "flower", {}, { flower: 1 });
assert(visit.reason === "visit", "do not plant in the hotel");

assert(data.isIndoor("hotel") && data.playing("guest-1"), "hotel and guest rooms are playable");
assert(data.indoorGuest(0, "hotel").x === 26, "guest stands in the lobby");

console.log("planet tests passed");
