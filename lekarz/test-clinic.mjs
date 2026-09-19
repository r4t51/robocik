import { createRequire } from "module";

const require = createRequire(import.meta.url);
const data = require("./data.js");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(!data.nameOk(""), "empty name");
assert(data.nameOk("Ola"), "name ok");
assert(data.freshSave().look.coat === 0, "doctor starts with a white coat");
assert(!("jailUntil" in data.freshSave()), "no jail in a new save");

const save = data.freshSave();
assert(save.money === 8, "start with a little cash");
assert(save.stock.syrup === 2 && save.stock.plaster == null, "starter bottles only");

const chairs = data.emptyChairs();
const guest = data.makeGuest(0, save.stock);
assert(guest.need === "syrup" && guest.say === "Kaszel", "first guest wants cough syrup");
chairs[0].guest = guest;

const empty = data.tryTreat(22, 36, null, chairs);
assert(empty.reason === "empty", "need a bottle in hand");

const wrong = data.tryTreat(22, 36, "pill", chairs);
assert(wrong.reason === "wrong" && !wrong.jail, "wrong medicine does not send you to jail");

const heal = data.tryTreat(22, 36, "syrup", chairs);
assert(heal.ok && heal.pay === 6, "patient pays for the right medicine");

const grab = data.tryGrab(18, 70, null, save.stock);
assert(grab.ok && grab.held === "syrup", "pick syrup from the shelf");

const dry = data.tryGrab(18, 70, null, { syrup: 0, drops: 2, salve: 2 });
assert(dry.reason === "none", "empty shelf cannot be taken");

const buy = data.tryBuy({ ...save, money: 12 }, "plaster");
assert(buy.ok && buy.save.stock.plaster === 1 && buy.save.money === 0, "buy a new plaster");

const poor = data.tryBuy({ ...save, money: 3, stock: data.starterStock() }, "elixir");
assert(poor.reason === "poor", "elixir costs more than 3");

const restock = data.tryBuy({ ...save, money: 10, stock: data.starterStock() }, "syrup");
assert(restock.ok && restock.save.stock.syrup === 3, "buy another bottle of syrup");

assert(data.shelfSpots(buy.save.stock).some((spot) => spot.id === "plaster"), "bought plaster sits on a shelf");

console.log("clinic tests passed");
