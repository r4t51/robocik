const D = window.PlanetData;
const stage = document.getElementById("stage");
const toastEl = document.getElementById("toast");
const talkEl = document.getElementById("talk");
const talkName = document.getElementById("talk-name");
const talkLine = document.getElementById("talk-line");
const shopEl = document.getElementById("shop");
const shopCash = document.getElementById("shop-cash");
const shopList = document.getElementById("shop-list");
const niceEl = document.getElementById("nice");
const space = document.getElementById("space");
const dock = document.getElementById("dock");
const deck = document.getElementById("deck");
const stickBase = document.getElementById("stick");
const stickKnob = document.getElementById("stick-knob");
const actBtn = document.getElementById("act-btn");

const SAVE_KEY = "planeta-dom-save";

const game = {
  mode: "create",
  save: D.freshSave(),
  player: { x: D.START.x, y: D.START.y },
  held: "syrup",
  visitors: [],
  toastUntil: 0,
  last: 0,
  facing: 1,
};

const keys = new Set();
const pointerMove = { x: 0, y: 0, active: false };

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return D.freshSave();
    const parsed = JSON.parse(raw);
    const fresh = D.freshSave();
    return {
      ...fresh,
      ...parsed,
      look: { ...fresh.look, ...parsed.look },
      placed: { ...parsed.placed },
      bag: { ...fresh.bag, ...(parsed.bag || {}) },
      talked: { ...(parsed.talked || {}) },
      stock: { ...fresh.stock, ...(parsed.stock || {}) },
      built: { ...(parsed.built || {}) },
      homes: { ...(parsed.homes || {}) },
      healed: { ...(parsed.healed || {}) },
      money: Number.isFinite(parsed.money) ? parsed.money : fresh.money,
    };
  } catch (err) {
    return D.freshSave();
  }
}

function persist() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(game.save));
}

function showToast(text, ms = 1400) {
  toastEl.textContent = text;
  toastEl.hidden = false;
  game.toastUntil = performance.now() + ms;
}

function hideTalk() {
  talkEl.hidden = true;
}

function hideShop() {
  if (shopEl) shopEl.hidden = true;
}

function showTalk(name, line) {
  hideShop();
  talkName.textContent = name;
  talkLine.textContent = line;
  talkEl.hidden = false;
  toastEl.hidden = true;
}

function renderNice() {
  const nice = D.niceScore(game.save.placed);
  const homes = D.housedCount(game.save.homes);
  niceEl.textContent = `Domy: ${homes} · ${nice} ładnie · ${game.save.money} zł`;
}

function personSvg(look, opts) {
  const size = (opts && opts.size) || 72;
  const hair = D.HAIR_COLORS[look.hairColor] || D.HAIR_COLORS[0];
  const skin = D.SKINS[look.skin] || D.SKINS[0];
  const shirt = look.shirtColor || D.SHIRTS[look.shirt] || D.SHIRTS[0];
  const style = look.hair || 0;
  const bangs = style === 1 ? `<path d="M20 20 H44 V24 H20Z" fill="${hair}"/>` : "";
  const braid = style === 2 ? `<path d="M40 28 Q48 40 42 50" fill="none" stroke="${hair}" stroke-width="4"/>` : "";
  const tail = style === 3 ? `<path d="M42 22 Q54 18 50 32" fill="none" stroke="${hair}" stroke-width="5"/>` : "";
  return `<svg class="who" viewBox="0 0 64 72" width="${size}" height="${Math.round(size * 1.12)}" aria-hidden="true">
    <ellipse cx="32" cy="68" rx="12" ry="3" fill="rgba(0,0,0,0.18)"/>
    <path d="M20 40 Q32 34 44 40 L46 62 H18Z" fill="${shirt}"/>
    <circle cx="32" cy="24" r="12" fill="${skin}"/>
    <path d="M20 20 Q32 8 44 20 L44 26 H20Z" fill="${hair}"/>
    ${bangs}${braid}${tail}
    <circle cx="27" cy="25" r="1.5" fill="#1a1840"/>
    <circle cx="37" cy="25" r="1.5" fill="#1a1840"/>
  </svg>`;
}

function decorSvg(id) {
  if (id === "flower") {
    return `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="18" r="7" fill="#c45a3a"/><circle cx="24" cy="18" r="3" fill="#f4d35e"/><path d="M24 24 V38" stroke="#3d6b4f" stroke-width="3"/></svg>`;
  }
  if (id === "tree") {
    return `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="21" y="28" width="6" height="12" fill="#6b3f2a"/><circle cx="24" cy="22" r="11" fill="#3d6b4f"/><circle cx="18" cy="20" r="6" fill="#4f8a4a"/></svg>`;
  }
  if (id === "lamp") {
    return `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="22" y="18" width="4" height="20" fill="#2a1a12"/><circle cx="24" cy="16" r="7" fill="#f4d35e"/></svg>`;
  }
  if (id === "rock") {
    return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M12 34 L20 18 L34 20 L38 34Z" fill="#7a7468"/></svg>`;
  }
  if (id === "rug") {
    return `<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="28" rx="16" ry="8" fill="#c45a3a"/><ellipse cx="24" cy="28" rx="10" ry="4" fill="#f4d35e"/></svg>`;
  }
  if (id === "house") {
    return `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="12" y="22" width="24" height="16" fill="#2d4a7c"/><path d="M10 22 L24 10 L38 22Z" fill="#3d6b4f"/><rect x="20" y="26" width="8" height="12" fill="#f4d35e"/></svg>`;
  }
  return `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="16" y="20" width="16" height="16" fill="#3d6b4f"/><circle cx="24" cy="18" r="6" fill="#8fbf6a"/></svg>`;
}

function houseSvg() {
  return `<svg viewBox="0 0 72 72" width="88" height="88" aria-hidden="true">
    <rect x="16" y="30" width="40" height="28" fill="#c45a3a"/>
    <path d="M12 32 L36 12 L60 32Z" fill="#8a3324"/>
    <rect x="30" y="40" width="12" height="18" fill="#1a1840"/>
    <rect x="20" y="38" width="8" height="8" fill="#f4d35e"/>
  </svg>`;
}

function shopSvg() {
  return `<svg viewBox="0 0 80 72" width="96" height="86" aria-hidden="true">
    <rect x="14" y="28" width="52" height="30" fill="#f7f1de"/>
    <path d="M10 28 H70 L64 16 H16Z" fill="#c45a3a"/>
    <rect x="34" y="38" width="12" height="20" fill="#2d4a7c"/>
    <rect x="20" y="36" width="10" height="10" fill="#f4d35e"/>
    <rect x="50" y="36" width="10" height="10" fill="#f4d35e"/>
  </svg>`;
}

function guestHouseSvg() {
  return `<svg viewBox="0 0 64 64" width="74" height="74" aria-hidden="true">
    <rect x="14" y="28" width="36" height="24" fill="#2d4a7c"/>
    <path d="M10 30 L32 12 L54 30Z" fill="#3d6b4f"/>
    <rect x="27" y="36" width="10" height="16" fill="#f4d35e"/>
  </svg>`;
}

function setChrome(mode) {
  const play = D.playing(mode);
  space.classList.toggle("is-play", play);
  deck.hidden = !play;
  dock.hidden = !(mode === "out" || mode === "in");
  if (!play) {
    hideTalk();
    hideShop();
  }
}

function createScreen() {
  game.mode = "create";
  setChrome("create");
  const look = game.save.look;
  const name = String(game.save.name || "").replace(/[<>&"]/g, "");
  stage.innerHTML = `
    <div class="sheet create">
      <h1>Jesteś człowieczkiem</h1>
      <p class="lead">Wpisz imię i wybierz wygląd. Ludzie nie mają domu i są chorzy. W sklepie kupujesz lekarstwa i domki. Dajesz im lekarstwo i budujesz im dom.</p>
      <label class="name-box">Imię
        <input id="name-in" type="text" maxlength="12" value="${name}" placeholder="np. Ola" />
      </label>
      <div class="mirror">${personSvg(look, { size: 150 })}</div>
      <div class="picks">
        <div class="pick-row" data-key="hair">
          ${D.HAIRS.map((label, i) => `<button type="button" class="chip ${look.hair === i ? "is-on" : ""}" data-i="${i}">${label}</button>`).join("")}
        </div>
        <div class="swatches" data-key="hairColor">
          ${D.HAIR_COLORS.map((color, i) => `<button type="button" class="swatch ${look.hairColor === i ? "is-on" : ""}" data-i="${i}" style="background:${color}"></button>`).join("")}
        </div>
        <div class="swatches" data-key="skin">
          ${D.SKINS.map((color, i) => `<button type="button" class="swatch ${look.skin === i ? "is-on" : ""}" data-i="${i}" style="background:${color}"></button>`).join("")}
        </div>
        <div class="swatches" data-key="shirt">
          ${D.SHIRTS.map((color, i) => `<button type="button" class="swatch ${look.shirt === i ? "is-on" : ""}" data-i="${i}" style="background:${color}"></button>`).join("")}
        </div>
      </div>
      <button type="button" class="go" data-act="open-world">Idę na planetę</button>
      <a class="side" href="../lekarz/">Lekarz · gabinet</a>
      <a class="side" href="../pizza/">Pizza u Kotka</a>
      <a class="side" href="../">Robocik · labirynt</a>
    </div>
  `;
}

function parkGuest(guest, index) {
  const camp = D.guestCamp(index, game.save, guest.name);
  guest.stay = camp.stay;
  guest.x = camp.x;
  guest.y = camp.y;
}

function syncVisitors() {
  const want = D.visitorCount(game.save);
  const before = game.visitors.length;
  while (game.visitors.length < want) {
    const index = game.visitors.length;
    const card = D.VISITORS[index % D.VISITORS.length];
    const need = D.makeNeed(index, game.save.stock);
    const guest = {
      name: card.name,
      sickLine: card.sick,
      wellLine: card.well,
      home: card.home,
      need: need.id,
      say: need.ailment,
      sick: !game.save.healed[card.name],
      look: {
        hair: index % D.HAIRS.length,
        hairColor: (index + 2) % D.HAIR_COLORS.length,
        skin: index % D.SKINS.length,
        shirt: (index + 1) % D.SHIRTS.length,
      },
      x: D.PLAZA.x,
      y: D.PLAZA.y,
      stay: "camp",
    };
    parkGuest(guest, index);
    game.visitors.push(guest);
  }
  if (game.visitors.length > want) game.visitors = game.visitors.slice(0, want);
  game.visitors.forEach((guest, index) => {
    guest.sick = !game.save.healed[guest.name];
    parkGuest(guest, index);
  });
  if (want > before) {
    const last = game.visitors[game.visitors.length - 1];
    showToast(before === 0 ? `${last.name} nie ma domu i jest chora.` : `${last.name} też nie ma domu.`);
  }
}

function roomSkin(room) {
  if (room === "in") return "is-home";
  if (D.guestRoomIndex(room) >= 0) return "is-visit";
  return "is-planet";
}

function roomDecor(room) {
  const index = D.guestRoomIndex(room);
  if (index >= 0) {
    const who = Object.entries(game.save.homes).find(([, lot]) => Number(lot) === index);
    const name = who ? who[0] : "Gość";
    return `<div class="furn table"></div><div class="furn window"></div><p class="who-lives">Tu mieszka ${name}</p>`;
  }
  return "";
}

function medSvg(id) {
  const med = D.medById(id);
  const color = med ? med.color : "#888";
  if (id === "pill") {
    return `<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="8" y="16" width="24" height="10" rx="5" fill="${color}"/><rect x="20" y="16" width="12" height="10" rx="5" fill="#fff6e8"/></svg>`;
  }
  if (id === "salve") {
    return `<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="12" y="14" width="16" height="16" fill="${color}"/><rect x="14" y="10" width="12" height="6" fill="#0f3d3e"/></svg>`;
  }
  if (id === "plaster") {
    return `<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="6" y="15" width="28" height="10" rx="3" fill="${color}"/><rect x="16" y="17" width="8" height="6" fill="#fff6e8"/></svg>`;
  }
  if (id === "drops") {
    return `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 8 L28 28 H12Z" fill="${color}"/><circle cx="20" cy="30" r="4" fill="#fff6e8"/></svg>`;
  }
  return `<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="14" y="8" width="12" height="8" fill="#0f3d3e"/><rect x="12" y="16" width="16" height="16" fill="${color}"/></svg>`;
}

function patientSvg(look) {
  const skin = D.SKINS[look.skin] || D.SKINS[0];
  const shirt = D.SHIRTS[look.shirt] || D.SHIRTS[0];
  return `<svg viewBox="0 0 48 56" width="58" height="68" aria-hidden="true">
    <path d="M14 30 Q24 26 34 30 L36 50 H12Z" fill="${shirt}"/>
    <circle cx="24" cy="18" r="9" fill="${skin}"/>
    <path d="M15 16 Q24 8 33 16 L33 20 H15Z" fill="#2a1a12"/>
    <circle cx="21" cy="19" r="1.2" fill="#1a1840"/>
    <circle cx="27" cy="19" r="1.2" fill="#1a1840"/>
  </svg>`;
}

function playScreen() {
  game.mode = game.save.room;
  setChrome(game.save.room);
  hideTalk();
  const indoor = D.isIndoor(game.save.room);
  const own = game.save.room === "in";
  const spots = D.spotsFor(game.save.room);
  if (game.save.room === "out" || own) {
    const items = D.itemsFor(game.save.room);
    const okHold = items.some((item) => item.id === game.held) || D.medById(game.held) || game.held === "house";
    if (!okHold) game.held = game.save.room === "out" ? "syrup" : items[0].id;
  }

  const wild = indoor
    ? ""
    : D.WILD.map(
        (bit) =>
          `<div class="wild" style="left:${bit.x}px;top:${bit.y}px">${decorSvg(bit.kind)}</div>`
      ).join("");

  stage.innerHTML = `
    <div class="arena">
      <div class="room ${roomSkin(game.save.room)}" id="room">
        <div class="land" id="land" style="${indoor ? "" : `width:${D.WORLD.w}px;height:${D.WORLD.h}px`}">
          ${indoor ? roomDecor(game.save.room) : `<div class="path"></div><div class="pond"></div>`}
          ${
            indoor
              ? `<div class="door" style="left:${D.HOUSE_EXIT.x}%;top:${D.HOUSE_EXIT.y}%"><span>Wyjście</span></div>`
              : `<div class="house" style="left:${D.HOUSE_DOOR.x}px;top:${D.HOUSE_DOOR.y}px">${houseSvg()}<span>Twój dom</span></div>
          <div class="town shop-house" data-town="shop" style="left:${D.SHOP.x}px;top:${D.SHOP.y}px">${shopSvg()}<span>Sklep</span></div>
          <div id="guest-homes"></div>`
          }
          ${spots
            .map(
              (spot) =>
                `<div class="plot" data-plot="${spot.id}" style="left:${indoor ? spot.x + "%" : spot.x + "px"};top:${indoor ? spot.y + "%" : spot.y + "px"}"></div>`
            )
            .join("")}
          ${wild}
          <div id="guests"></div>
          <div class="you" id="you">${personSvg(game.save.look, { size: indoor ? 96 : 86 })}<span class="held" id="held"></span></div>
        </div>
      </div>
    </div>
  `;
  renderDock();
  paintRoom();
}

function renderDock() {
  const meds = game.save.room === "out"
    ? D.unlockedMeds(game.save.stock).map((med) => {
        const count = game.save.stock[med.id] || 0;
        return `<button type="button" class="dish ${game.held === med.id ? "is-on" : ""} ${count < 1 ? "is-empty" : ""}" data-act="hold" data-id="${med.id}">${medSvg(med.id)}<span>${med.ailment} ×${count}</span></button>`;
      })
    : [];
  const extras = game.save.room === "out"
    ? [`<button type="button" class="dish ${game.held === "house" ? "is-on" : ""} ${(game.save.bag.house || 0) < 1 ? "is-empty" : ""}" data-act="hold" data-id="house">${decorSvg("house")}<span>Domek ×${game.save.bag.house || 0}</span></button>`]
    : [];
  const items = D.itemsFor(game.save.room).map((item) => {
    const count = game.save.bag[item.id] || 0;
    return `<button type="button" class="dish ${game.held === item.id ? "is-on" : ""} ${count < 1 ? "is-empty" : ""}" data-act="hold" data-id="${item.id}">${decorSvg(item.id)}<span>${item.name} ×${count}</span></button>`;
  });
  dock.innerHTML = meds.concat(extras, items).join("");
}

function renderShop() {
  if (!shopEl || !shopList || !shopCash) return;
  shopCash.textContent = `Masz ${game.save.money} zł`;
  const plants = D.WARES.map((ware) => {
    const count = game.save.bag[ware.id] || 0;
    const poor = game.save.money < ware.cost;
    return `<button type="button" class="ware ${poor ? "is-poor" : ""}" data-act="buy" data-id="${ware.id}">${decorSvg(ware.id)}<span>${ware.name}</span><b>${ware.cost} zł</b><em>masz ${count}</em></button>`;
  }).join("");
  const meds = D.MEDS.map((med) => {
    const unlocked = Number.isFinite(game.save.stock[med.id]);
    const price = unlocked ? D.restockCost(med) : med.cost || 8;
    const count = game.save.stock[med.id] || 0;
    const poor = game.save.money < price;
    const label = unlocked ? `${med.ailment} · masz ${count}` : `nowe · ${med.ailment}`;
    return `<button type="button" class="ware ${poor ? "is-poor" : ""}" data-act="buy" data-id="${med.id}">${medSvg(med.id)}<span>${med.name}</span><b>${price} zł</b><em>${label}</em></button>`;
  }).join("");
  shopList.innerHTML = `<p class="ware-head">Lekarstwa dla chorych</p>${meds}<p class="ware-head">Domki i ozdoby</p>${plants}`;
}

function openShop() {
  hideTalk();
  shopEl.hidden = false;
  renderShop();
}

function camera() {
  const room = document.getElementById("room");
  const land = document.getElementById("land");
  if (!room || !land || D.isIndoor(game.save.room)) {
    if (land) land.style.transform = "";
    return;
  }
  const viewW = room.clientWidth || 390;
  const viewH = room.clientHeight || 420;
  const midX = viewW / 2;
  const midY = viewH / 2;
  const x = Math.min(0, Math.max(viewW - D.WORLD.w, midX - game.player.x));
  const y = Math.min(0, Math.max(viewH - D.WORLD.h, midY - game.player.y));
  land.style.transform = `translate(${x}px, ${y}px)`;
}

function paintRoom() {
  const you = document.getElementById("you");
  if (!you) return;
  const indoor = D.isIndoor(game.save.room);
  you.style.left = indoor ? `${game.player.x}%` : `${game.player.x}px`;
  you.style.top = indoor ? `${game.player.y}%` : `${game.player.y}px`;
  you.style.transform = `translate(-50%, -60%) scaleX(${game.facing})`;
  camera();

  const doorHot = D.atDoor(game.player.x, game.player.y, game.save.room);
  const town = indoor ? null : D.nearbyTown(game.player.x, game.player.y);
  document.querySelector(".house")?.classList.toggle("is-near", !indoor && doorHot);
  document.querySelector(".door")?.classList.toggle("is-near", indoor && doorHot);
  document.querySelectorAll("[data-town]").forEach((node) => {
    node.classList.toggle("is-near", Boolean(town) && town.kind === node.dataset.town);
  });

  const homes = document.getElementById("guest-homes");
  if (homes) {
    homes.innerHTML = D.GUEST_HOMES.map((house, index) => {
      const built = Boolean(game.save.built[index]);
      const who = Object.entries(game.save.homes).find(([, lot]) => Number(lot) === index);
      const nearHome = town && town.kind === "guest-home" && town.index === index;
      if (!built) {
        return `<div class="town guest-lot ${nearHome ? "is-near" : ""}" data-home="${index}" style="left:${house.x}px;top:${house.y}px"><span class="lot-pad"></span><span>Działka</span></div>`;
      }
      return `<div class="town guest-home ${who ? "is-lived" : ""} ${nearHome ? "is-near" : ""}" data-home="${index}" style="left:${house.x}px;top:${house.y}px">${guestHouseSvg()}<span>${who ? who[0] : "Domek"}</span></div>`;
    }).join("");
  }

  const range = indoor ? 13 : 80;
  D.spotsFor(game.save.room).forEach((spot) => {
    const node = document.querySelector(`[data-plot="${spot.id}"]`);
    if (!node) return;
    const near = D.closestSpot(game.player.x, game.player.y, [spot], range);
    const item = game.save.placed[spot.id];
    node.classList.toggle("is-near", Boolean(near) && !item);
    node.classList.toggle("is-full", Boolean(item));
    node.innerHTML = item ? decorSvg(item) : `<span class="hole"></span>`;
  });

  const guests = document.getElementById("guests");
  if (guests) {
    guests.innerHTML = visiblePeople()
      .map((person) => {
        const pose = personPose(person);
        return `<div class="guest ${person.sick ? "is-sick" : ""}" style="left:${indoor ? pose.x + "%" : pose.x + "px"};top:${indoor ? pose.y + "%" : pose.y + "px"}">${personSvg(person.look, { size: indoor ? 84 : 72 })}${person.sick ? `<span class="say">${person.say}</span>` : ""}<b>${person.name}</b></div>`;
      })
      .join("");
  }

  const held = document.getElementById("held");
  if (held) held.innerHTML = D.medById(game.held) ? medSvg(game.held) : game.held === "house" ? decorSvg("house") : "";

  const nearPerson = nearbyPerson();
  const nearPlot = D.closestSpot(game.player.x, game.player.y, D.spotsFor(game.save.room), range);
  const emptyLot = town && town.kind === "guest-home" && !game.save.built[town.index];
  if (shopEl && !shopEl.hidden) actBtn.textContent = "Wychodzę";
  else if (doorHot) actBtn.textContent = indoor ? "Wychodzę" : "Wejdź";
  else if (nearPerson && nearPerson.sick) actBtn.textContent = "Daj";
  else if (nearPerson) actBtn.textContent = "Gadam";
  else if (town && town.kind === "shop") actBtn.textContent = "Sklep";
  else if (emptyLot) actBtn.textContent = "Buduję";
  else if (town && (town.kind === "guest-home" || town.kind === "home")) actBtn.textContent = "Wejdź";
  else if (nearPlot && !game.save.placed[nearPlot.id]) actBtn.textContent = "Sadzę";
  else actBtn.textContent = "A";
}

function personPose(person) {
  if (person.kind === "folk") return { x: person.x, y: person.y };
  const index = game.visitors.findIndex((guest) => guest.name === person.name);
  const inside = index >= 0 ? D.indoorGuest(index, game.save.room) : null;
  if (inside) return inside;
  return { x: person.x, y: person.y };
}

function visiblePeople() {
  if (game.save.room === "out") {
    return game.visitors.map((guest) => ({ ...guest, kind: "guest" }));
  }
  const index = D.guestRoomIndex(game.save.room);
  if (index < 0) return [];
  return game.visitors
    .filter((guest) => Number(game.save.homes[guest.name]) === index)
    .map((guest) => ({ ...guest, kind: "guest" }));
}

function nearbyPerson() {
  const range = D.isIndoor(game.save.room) ? 18 : 70;
  return visiblePeople().find((person) => D.closestSpot(game.player.x, game.player.y, [personPose(person)], range)) || null;
}

function openWorld() {
  const input = document.getElementById("name-in");
  const name = input ? input.value : game.save.name;
  if (!D.nameOk(name)) {
    showToast("Najpierw wpisz imię");
    return;
  }
  game.save.name = name.trim();
  game.save.room = "out";
  game.player = { x: D.START.x, y: D.START.y };
  persist();
  syncVisitors();
  playScreen();
  showToast(`${game.save.name}, dawaj lekarstwa i buduj domy.`);
}

function doPlace() {
  const result = D.tryPlace(
    game.player.x,
    game.player.y,
    game.save.room,
    game.held,
    game.save.placed,
    game.save.bag
  );
  if (!result.ok) {
    if (result.reason === "taken") showToast("Tu już coś stoi");
    else if (result.reason === "wrong-room") showToast("To nie tu");
    else if (result.reason === "none") showToast("Nie masz tego. Idź do sklepu.");
    else showToast("Podejdź do pustego miejsca");
    return false;
  }
  game.save.placed = result.placed;
  game.save.bag = result.bag;
  persist();
  renderNice();
  renderDock();
  showToast("Ładniej");
  return true;
}

function talkWith(person) {
  const housed = Number.isInteger(Number(game.save.homes[person.name]));
  if (person.sick) {
    showTalk(person.name, person.sickLine || "Jestem chory i nie mam domu.");
    return;
  }
  if (!housed) {
    showTalk(person.name, person.wellLine || "Już mi lepiej. Tylko domu nie mam.");
    return;
  }
  showTalk(person.name, person.home || "Dzięki za domek.");
}

function settleHomes() {
  game.visitors.forEach((guest) => {
    if (guest.sick) return;
    if (Number.isInteger(Number(game.save.homes[guest.name]))) return;
    const lot = D.freeBuiltLot(game.save);
    if (lot < 0) return;
    game.save.homes[guest.name] = lot;
    parkGuest(guest, game.visitors.indexOf(guest));
  });
}

function doHeal(person) {
  const heal = D.tryHeal(game.held, person);
  if (heal.reason === "empty") {
    showToast("Weź lekarstwo ze sklepu");
    return true;
  }
  if (heal.reason === "wrong") {
    showToast("Złe lekarstwo. Weź inne.");
    return true;
  }
  if (!heal.ok) return false;
  if ((game.save.stock[game.held] || 0) < 1) {
    showToast("Pusto. Kup w sklepie.");
    return true;
  }
  game.save.stock[game.held] = Math.max(0, (game.save.stock[game.held] || 0) - 1);
  game.save.healed[person.name] = true;
  person.sick = false;
  const pay = heal.pay || 6;
  game.save.money += pay;
  settleHomes();
  persist();
  renderNice();
  renderDock();
  syncVisitors();
  showToast(`${person.name} płaci ${pay} zł. ${Number.isInteger(Number(game.save.homes[person.name])) ? "Idzie do domku." : "Nie ma jeszcze domu."}`);
  return true;
}

function doBuild() {
  const result = D.tryBuild(game.player.x, game.player.y, game.save);
  if (!result.ok) {
    if (result.reason === "none") showToast("Nie masz domku. Kup w sklepie.");
    else if (result.reason === "taken") showToast("Tu już stoi domek");
    return result.reason === "none" || result.reason === "taken";
  }
  game.save = result.save;
  settleHomes();
  persist();
  renderNice();
  renderDock();
  syncVisitors();
  const who = Object.entries(game.save.homes).find(([, lot]) => Number(lot) === result.index);
  showToast(who ? `${who[0]} ma już domek` : "Domek stoi. Czeka na kogoś zdrowego.");
  return true;
}

function doBuy(id) {
  const result = D.tryBuy(game.save, id);
  if (!result.ok) {
    showToast(result.reason === "poor" ? "Za mało złotych" : "Nie ma tego");
    return;
  }
  game.save = result.save;
  persist();
  renderNice();
  renderDock();
  renderShop();
  const ware = D.WARES.find((item) => item.id === id);
  const med = D.medById(id);
  showToast(`Kupione: ${ware ? ware.name : med ? med.name : id}`);
}

function enterToast(room) {
  if (room === "in") return "To twój dom";
  const index = D.guestRoomIndex(room);
  if (index >= 0) {
    const who = Object.entries(game.save.homes).find(([, lot]) => Number(lot) === index);
    return who ? `Domek ${who[0]}` : "Pusty domek";
  }
  return "W środku";
}

function doDoor() {
  if (game.save.room === "out") {
    const result = D.tryEnterTown(game.player.x, game.player.y, game.save.room, game.save.built);
    if (!result.ok) {
      if (result.reason === "shop") {
        openShop();
        return true;
      }
      if (result.reason === "empty") {
        return doBuild();
      }
      return false;
    }
    game.save.room = result.room;
    game.player = { x: result.x, y: result.y };
    persist();
    playScreen();
    showToast(enterToast(result.room));
    return true;
  }
  const result = D.tryExit(game.player.x, game.player.y, game.save.room);
  if (!result.ok) return false;
  game.save.room = result.room;
  game.player = { x: result.x, y: result.y };
  persist();
  playScreen();
  showToast("Znowu twoja planeta");
  return true;
}

function doAction() {
  if (!D.playing(game.mode)) return;
  if (shopEl && !shopEl.hidden) {
    hideShop();
    return;
  }
  if (!talkEl.hidden) {
    hideTalk();
    return;
  }
  if (D.atDoor(game.player.x, game.player.y, game.save.room)) {
    doDoor();
    return;
  }
  const near = nearbyPerson();
  if (near && near.sick) {
    doHeal(near);
    paintRoom();
    return;
  }
  if (near) {
    talkWith(near);
    paintRoom();
    return;
  }
  if (game.save.room === "out") {
    const town = D.nearbyTown(game.player.x, game.player.y);
    if (town && town.kind === "guest-home" && !game.save.built[town.index]) {
      doBuild();
      paintRoom();
      return;
    }
    const result = D.tryEnterTown(game.player.x, game.player.y, game.save.room, game.save.built);
    if (result.ok || result.reason === "shop") {
      doDoor();
      return;
    }
  }
  if (D.isIndoor(game.save.room) && game.save.room !== "in") {
    showToast("Podejdź do gościa albo do drzwi");
    return;
  }
  doPlace();
  paintRoom();
}

function moveVector() {
  let x = pointerMove.active ? pointerMove.x : 0;
  let y = pointerMove.active ? pointerMove.y : 0;
  if (keys.has("arrowleft") || keys.has("a")) x -= 1;
  if (keys.has("arrowright") || keys.has("d")) x += 1;
  if (keys.has("arrowup") || keys.has("w")) y -= 1;
  if (keys.has("arrowdown") || keys.has("s")) y += 1;
  const mag = Math.hypot(x, y);
  if (mag > 1) {
    x /= mag;
    y /= mag;
  }
  return { x, y, mag };
}

function step(dt) {
  if (!D.playing(game.mode)) return;
  if (shopEl && !shopEl.hidden) return;
  const move = moveVector();
  if (move.mag > 0.12) {
    hideTalk();
    if (move.x !== 0) game.facing = move.x < 0 ? -1 : 1;
    const indoor = D.isIndoor(game.save.room);
    const speed = (indoor ? 46 : 210) * (dt / 1000);
    if (indoor) {
      game.player.x = Math.max(14, Math.min(86, game.player.x + move.x * speed));
      game.player.y = Math.max(28, Math.min(86, game.player.y + move.y * speed));
    } else {
      game.player.x = Math.max(80, Math.min(D.WORLD.w - 80, game.player.x + move.x * speed));
      game.player.y = Math.max(80, Math.min(D.WORLD.h - 80, game.player.y + move.y * speed));
    }
  }

  paintRoom();
}

function frame(now) {
  const dt = Math.min(40, now - (game.last || now));
  game.last = now;
  step(dt);
  if (toastEl.hidden === false && now > game.toastUntil) toastEl.hidden = true;
  requestAnimationFrame(frame);
}

function bindStick(el) {
  const update = (event) => {
    const rect = el.getBoundingClientRect();
    const x = event.clientX - (rect.left + rect.width / 2);
    const y = event.clientY - (rect.top + rect.height / 2);
    const max = rect.width * 0.32;
    const mag = Math.hypot(x, y);
    const clamped = mag > max ? max / mag : 1;
    pointerMove.x = (x * clamped) / max;
    pointerMove.y = (y * clamped) / max;
    pointerMove.active = true;
    stickKnob.style.transform = `translate(calc(-50% + ${x * clamped}px), calc(-50% + ${y * clamped}px))`;
  };
  const end = () => {
    pointerMove.x = 0;
    pointerMove.y = 0;
    pointerMove.active = false;
    stickKnob.style.transform = "translate(-50%, -50%)";
  };
  el.addEventListener("pointerdown", (event) => {
    el.setPointerCapture(event.pointerId);
    update(event);
  });
  el.addEventListener("pointermove", (event) => {
    if (el.hasPointerCapture(event.pointerId)) update(event);
  });
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
}

stage.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-act], .chip, .swatch");
  if (!btn) return;
  if (btn.dataset.act === "open-world") {
    openWorld();
    return;
  }
  if (btn.dataset.act === "leave-shop") {
    hideShop();
    return;
  }
  if (btn.dataset.act === "buy") {
    doBuy(btn.dataset.id);
    return;
  }
  const row = btn.closest("[data-key]");
  if (row) {
    const input = document.getElementById("name-in");
    if (input) game.save.name = input.value;
    game.save.look[row.dataset.key] = Number(btn.dataset.i);
    persist();
    createScreen();
  }
});

dock.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-act=hold]");
  if (!btn) return;
  game.held = btn.dataset.id;
  dock.querySelectorAll(".dish").forEach((node) => node.classList.toggle("is-on", node.dataset.id === game.held));
});

talkEl.addEventListener("click", hideTalk);

shopEl?.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-act]");
  if (!btn) return;
  if (btn.dataset.act === "leave-shop") {
    hideShop();
    return;
  }
  if (btn.dataset.act === "buy") doBuy(btn.dataset.id);
});

actBtn.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  doAction();
});

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
    event.preventDefault();
  }
  keys.add(key);
  if ((key === " " || key === "e") && D.playing(game.mode)) doAction();
  if (key === "enter" && game.mode === "create") openWorld();
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

bindStick(stickBase);
game.save = loadSave();
if (new URLSearchParams(location.search).has("play") && D.nameOk(game.save.name || "Ola")) {
  if (!D.nameOk(game.save.name)) game.save.name = "Ola";
  openWorld();
  const inside = new URLSearchParams(location.search).get("inside");
  if (inside && D.playing(inside) && inside !== "out") {
    game.save.room = inside;
    game.player = { x: 50, y: 72 };
    playScreen();
  }
} else {
  createScreen();
}
renderNice();
requestAnimationFrame(frame);
