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
assert(save.bag.house === 1, "start with one house kit");
assert(save.stock.syrup === 2, "start with cough syrup");
assert(data.visitorCount(save) === 1, "one sick person waits from the start");
assert(data.visitorCount({ homes: { Ania: 0 } }) === 2, "housing someone brings the next person");
assert(data.visitorCount({ homes: { Ania: 0, Kuba: 1 } }) === 3, "two houses bring a third person");

const miss = data.tryPlace(10, 10, "out", "flower", {});
assert(!miss.ok, "must walk to a plot");

const plant = data.tryPlace(360, 520, "out", "flower", {});
assert(plant.ok && plant.placed.o0 === "flower", "flower lands on the plot");

assert(!data.tryEnter(360, 520, "out").ok, "door is at the house");
const enter = data.tryEnter(1280, 420, "out");
assert(enter.ok && enter.room === "in", "walk into the house");

const leave = data.tryExit(50, 86, "in");
assert(leave.ok && leave.room === "out", "walk back out");

assert(data.nearbyTown(470, 520).kind === "shop", "shop door");
assert(!data.nearbyTown(800, 560) || data.nearbyTown(800, 560).kind !== "hotel", "there is no hotel");
assert(data.nearbyTown(1280, 420).kind === "home", "own house");
assert(data.nearbyTown(200, 560).kind === "guest-home", "empty house lot");

const locked = data.tryEnterTown(200, 560, "out", {});
assert(locked.reason === "empty", "cannot enter a lot before you build");

const ania = { name: "Ania", sick: true, need: "syrup" };
assert(data.tryHeal(null, ania).reason === "empty", "need a medicine in hand");
assert(data.tryHeal("pill", ania).reason === "wrong", "wrong medicine does nothing");
const heal = data.tryHeal("syrup", ania);
assert(heal.ok && heal.pay === 6, "right medicine heals and they pay");

const built = data.tryBuild(200, 560, save);
assert(built.ok && built.save.built[0] && built.save.bag.house === 0, "build a house on the lot");
assert(data.tryBuild(200, 560, built.save).reason === "taken", "lot already has a house");

const noKit = data.tryBuild(1140, 900, { ...save, bag: { ...save.bag, house: 0 } });
assert(noKit.reason === "none", "need a house kit from the shop");

const guestIn = data.tryEnterTown(200, 560, "out", built.save.built);
assert(guestIn.ok && guestIn.room === "guest-0", "walk into the house you built");
const guestOut = data.tryExit(50, 86, "guest-0");
assert(guestOut.ok && guestOut.room === "out", "leave the guest house");

const camp = data.guestCamp(0, save, "Ania");
assert(camp.stay === "camp", "without a house they sleep outside");
const home = data.guestCamp(0, { homes: { Ania: 0 } }, "Ania");
assert(home.stay === "home" && home.house.x === 200, "after a house they live there");

const buyMed = data.tryBuy({ ...save, money: 12 }, "plaster");
assert(buyMed.ok && buyMed.save.stock.plaster === 1, "shop sells plaster");

const buyHouse = data.tryBuy(save, "house");
assert(buyHouse.ok && buyHouse.save.bag.house === 2 && buyHouse.save.money === 6, "shop sells another house");

const buyFlower = data.tryBuy(save, "flower");
assert(buyFlower.ok && buyFlower.save.bag.flower === 4, "shop still sells flowers");

assert(!data.playing("hotel") && !data.playing("clinic"), "no hotel and no clinic rooms");
assert(data.playing("out") && data.playing("guest-0"), "planet and built homes are playable");

const need = data.makeNeed(0, save.stock);
assert(need.id === "syrup" && need.ailment === "Kaszel", "first sick person wants cough syrup");

console.log("planet tests passed");
