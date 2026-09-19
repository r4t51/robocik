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
  held: "flower",
  visitors: [],
  toastUntil: 0,
  last: 0,
  facing: 1,
  pendingHome: null,
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
  if (game.pendingHome != null) {
    const guest = game.visitors[game.pendingHome];
    if (guest) parkGuest(guest, game.pendingHome);
    game.pendingHome = null;
  }
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
  niceEl.textContent = `Ładnie: ${nice} · ${game.save.money} zł`;
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

function hotelSvg() {
  return `<svg viewBox="0 0 88 80" width="108" height="98" aria-hidden="true">
    <rect x="16" y="18" width="56" height="50" fill="#e8d2a8"/>
    <rect x="12" y="12" width="64" height="10" fill="#2d4a7c"/>
    <rect x="38" y="46" width="12" height="22" fill="#1a1840"/>
    <rect x="22" y="26" width="10" height="10" fill="#7ec4d8"/>
    <rect x="56" y="26" width="10" height="10" fill="#7ec4d8"/>
    <rect x="22" y="42" width="10" height="10" fill="#7ec4d8"/>
    <rect x="56" y="42" width="10" height="10" fill="#7ec4d8"/>
  </svg>`;
}

function clinicSvg() {
  return `<svg viewBox="0 0 80 72" width="96" height="86" aria-hidden="true">
    <rect x="14" y="26" width="52" height="34" fill="#f7f1de"/>
    <path d="M10 28 H70 L62 14 H18Z" fill="#c45a3a"/>
    <rect x="34" y="40" width="12" height="20" fill="#2d4a7c"/>
    <rect x="32" y="22" width="16" height="16" fill="#c45a3a"/>
    <rect x="37" y="24" width="6" height="12" fill="#f7f1de"/>
    <rect x="34" y="27" width="12" height="6" fill="#f7f1de"/>
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
      <p class="lead">Wpisz imię i wybierz wygląd. Wejdź do hotelu — Zosia i Ania już tam są. Jest też lekarz. Gadaj z gośćmi, to biorą swój dom.</p>
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
      <a class="side" href="pizza/">Pizza u Kotka</a>
      <a class="side" href="labirynt/">Robocik · labirynt</a>
    </div>
  `;
}

function parkGuest(guest, index) {
  const camp = D.guestCamp(index, Boolean(game.save.talked[guest.name]));
  guest.stay = camp.stay;
  guest.x = camp.x + (camp.stay === "hotel" ? index * 36 : 0);
  guest.y = camp.y;
  guest.vx = camp.stay === "hotel" ? 22 + index * 6 : 0;
}

function syncVisitors() {
  const want = D.visitorCount(D.niceScore(game.save.placed));
  const before = game.visitors.length;
  while (game.visitors.length < want) {
    const index = game.visitors.length;
    const card = D.VISITORS[index % D.VISITORS.length];
    const guest = {
      name: card.name,
      line: card.line,
      home: card.home,
      look: {
        hair: index % D.HAIRS.length,
        hairColor: (index + 2) % D.HAIR_COLORS.length,
        skin: index % D.SKINS.length,
        shirt: (index + 1) % D.SHIRTS.length,
      },
      x: D.HOTEL.x,
      y: D.HOTEL.y,
      vx: 0,
      stay: "hotel",
    };
    parkGuest(guest, index);
    game.visitors.push(guest);
  }
  if (game.visitors.length > want) game.visitors = game.visitors.slice(0, want);
  game.visitors.forEach((guest, index) => parkGuest(guest, index));
  if (want > before) {
    const last = game.visitors[game.visitors.length - 1];
    showToast(before === 0 ? `${last.name} czeka w hotelu.` : `${last.name} jest w hotelu. Bo jest ładniej.`);
  }
}

function roomSkin(room) {
  if (room === "in") return "is-home";
  if (room === "hotel") return "is-hotel";
  if (room === "clinic") return "is-clinic";
  if (D.guestRoomIndex(room) >= 0) return "is-visit";
  return "is-planet";
}

function roomDecor(room) {
  if (room === "hotel") {
    return `<div class="furn desk"><span>Recepcja</span></div><div class="furn bed one"></div><div class="furn bed two"></div>`;
  }
  if (room === "clinic") {
    return `<div class="furn bench"></div><div class="furn cross"></div><p class="who-lives">Lekarz Olek</p>`;
  }
  const index = D.guestRoomIndex(room);
  if (index >= 0) {
    const guest = game.visitors[index];
    const who = guest ? guest.name : "Gość";
    const lived = guest && game.save.talked[guest.name];
    return `<div class="furn table"></div><div class="furn window"></div><p class="who-lives">${lived ? `Tu mieszka ${who}` : `${who} jeszcze w hotelu`}</p>`;
  }
  return "";
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
    if (!items.some((item) => item.id === game.held)) game.held = items[0].id;
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
              : `<div class="house" style="left:${D.HOUSE_DOOR.x}px;top:${D.HOUSE_DOOR.y}px">${houseSvg()}<span>Domek</span></div>
          <div class="town shop-house" data-town="shop" style="left:${D.SHOP.x}px;top:${D.SHOP.y}px">${shopSvg()}<span>Sklep</span></div>
          <div class="town hotel" data-town="hotel" style="left:${D.HOTEL.x}px;top:${D.HOTEL.y}px">${hotelSvg()}<span>Hotel</span></div>
          <div class="town clinic-house" data-town="clinic" style="left:${D.CLINIC.x}px;top:${D.CLINIC.y}px">${clinicSvg()}<span>Lekarz</span></div>
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
          <div class="you" id="you">${personSvg(game.save.look, { size: indoor ? 96 : 86 })}</div>
        </div>
      </div>
    </div>
  `;
  renderDock();
  paintRoom();
}

function renderDock() {
  const items = D.itemsFor(game.save.room);
  dock.innerHTML = items
    .map((item) => {
      const count = game.save.bag[item.id] || 0;
      return `<button type="button" class="dish ${game.held === item.id ? "is-on" : ""} ${count < 1 ? "is-empty" : ""}" data-act="hold" data-id="${item.id}">${decorSvg(item.id)}<span>${item.name} ×${count}</span></button>`;
    })
    .join("");
}

function renderShop() {
  if (!shopEl || !shopList || !shopCash) return;
  shopCash.textContent = `Masz ${game.save.money} zł`;
  shopList.innerHTML = D.WARES.map((ware) => {
    const count = game.save.bag[ware.id] || 0;
    const poor = game.save.money < ware.cost;
    return `<button type="button" class="ware ${poor ? "is-poor" : ""}" data-act="buy" data-id="${ware.id}">${decorSvg(ware.id)}<span>${ware.name}</span><b>${ware.cost} zł</b><em>masz ${count}</em></button>`;
  }).join("");
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
    homes.innerHTML = game.visitors
      .map((guest, index) => {
        const house = D.GUEST_HOMES[index];
        if (!house) return "";
        const lived = Boolean(game.save.talked[guest.name]);
        const nearHome = town && town.kind === "guest-home" && town.index === index;
        return `<div class="town guest-home ${lived ? "is-lived" : ""} ${nearHome ? "is-near" : ""}" data-home="${index}" style="left:${house.x}px;top:${house.y}px">${guestHouseSvg()}<span>${lived ? guest.name : "Domek"}</span></div>`;
      })
      .join("");
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
        return `<div class="guest" style="left:${indoor ? pose.x + "%" : pose.x + "px"};top:${indoor ? pose.y + "%" : pose.y + "px"}">${personSvg(person.look, { size: indoor ? 84 : 72 })}<b>${person.name}</b></div>`;
      })
      .join("");
  }

  const nearPerson = nearbyPerson();
  const nearPlot = D.closestSpot(game.player.x, game.player.y, D.spotsFor(game.save.room), range);
  if (shopEl && !shopEl.hidden) actBtn.textContent = "Wychodzę";
  else if (doorHot) actBtn.textContent = indoor ? "Wychodzę" : "Wejdź";
  else if (nearPerson) actBtn.textContent = "Gadam";
  else if (town && town.kind === "shop") actBtn.textContent = "Sklep";
  else if (town && (town.kind === "hotel" || town.kind === "clinic" || town.kind === "guest-home" || town.kind === "home")) {
    actBtn.textContent = "Wejdź";
  } else if (nearPlot && !game.save.placed[nearPlot.id]) actBtn.textContent = "Sadzę";
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
  const folk = D.folkIn(game.save.room).map((person) => ({ ...person, kind: "folk" }));
  const guests = game.visitors
    .filter((guest, index) => {
      if (game.save.room === "hotel") return guest.stay === "hotel";
      if (game.save.room === `guest-${index}`) return guest.stay === "home";
      return false;
    })
    .map((guest) => ({ ...guest, kind: "guest" }));
  return folk.concat(guests);
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
  showToast(`${game.save.name}, hotel, lekarz, sadź i gadaj.`);
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
  const before = D.visitorCount(D.niceScore(game.save.placed));
  game.save.placed = result.placed;
  game.save.bag = result.bag;
  persist();
  renderNice();
  renderDock();
  syncVisitors();
  const after = D.visitorCount(D.niceScore(game.save.placed));
  if (after === before) showToast("Ładniej");
  return true;
}

function talkWith(person) {
  if (person.kind === "folk") {
    const first = !game.save.talked[person.id];
    game.save.talked[person.id] = true;
    if (first && person.id === "doc") {
      game.save.bag.flower = (game.save.bag.flower || 0) + 1;
      renderDock();
    }
    persist();
    showTalk(person.name, first ? person.line : person.again);
    return;
  }
  const index = game.visitors.findIndex((guest) => guest.name === person.name);
  const first = !game.save.talked[person.name];
  game.save.talked[person.name] = true;
  if (first) game.save.money += 2;
  persist();
  renderNice();
  if (first) {
    game.pendingHome = index;
    showTalk(person.name, `${person.line} Biorę domek.`);
  } else {
    showTalk(person.name, person.home || person.line);
  }
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
  showToast(`Kupione: ${ware ? ware.name : id}`);
}

function enterToast(room) {
  if (room === "in") return "To twój dom";
  if (room === "hotel") return "Hotel. Zosia i goście są w środku.";
  if (room === "clinic") return "Gabinet lekarza";
  const index = D.guestRoomIndex(room);
  if (index >= 0 && game.visitors[index]) return `Domek ${game.visitors[index].name}`;
  return "W środku";
}

function doDoor() {
  if (game.save.room === "out") {
    const result = D.tryEnterTown(
      game.player.x,
      game.player.y,
      game.save.room,
      game.save.talked,
      game.visitors.length
    );
    if (!result.ok) {
      if (result.reason === "shop") {
        openShop();
        return true;
      }
      if (result.reason === "empty") {
        showToast("Ten domek jeszcze czeka");
        return false;
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
  if (near) {
    talkWith(near);
    paintRoom();
    return;
  }
  if (game.save.room === "out") {
    const result = D.tryEnterTown(
      game.player.x,
      game.player.y,
      game.save.room,
      game.save.talked,
      game.visitors.length
    );
    if (result.ok || result.reason === "empty" || result.reason === "shop") {
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
