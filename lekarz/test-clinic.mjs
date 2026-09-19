import { createRequire } from "module";

const require = createRequire(import.meta.url);
const data = require("./data.js");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(data.JAIL_MS === 180000, "jail is three minutes");
assert(data.jailClock(180000) === "3:00", "full jail clock");
assert(data.jailClock(59000) === "0:59", "under a minute");
assert(data.inJail(1000, 2000), "still locked");
assert(!data.inJail(3000, 2000), "free after time");
assert(data.lockJail(1000) === 181000, "lock adds three minutes");

const chairs = data.emptyChairs();
assert(chairs.length === 3 && !chairs[0].guest, "three empty chairs");

const guest = data.makeGuest(0);
assert(guest.need === "syrup" && guest.say === "Kaszel", "first guest wants cough syrup");
chairs[0].guest = guest;

const miss = data.tryTreat(10, 10, "syrup", chairs);
assert(miss.reason === "far", "must walk to the chair");

const empty = data.tryTreat(22, 40, null, chairs);
assert(empty.reason === "empty", "need a bottle in hand");

const wrong = data.tryTreat(22, 40, "pill", chairs);
assert(wrong.reason === "wrong" && wrong.jail, "wrong medicine sends you to jail");

const heal = data.tryTreat(22, 40, "syrup", chairs);
assert(heal.ok && heal.chairId === 0, "right medicine heals");

const grabFar = data.tryGrab(50, 30, null);
assert(!grabFar.ok, "shelf is on the wall");

const grab = data.tryGrab(16, 84, null);
assert(grab.ok && grab.held === "syrup", "pick syrup from the shelf");

console.log("clinic tests passed");
