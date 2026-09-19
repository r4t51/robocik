const D = window.PlanetData;
const stage = document.getElementById("stage");
const toastEl = document.getElementById("toast");
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
  player: { x: 46, y: 58 },
  held: "flower",
  visitors: [],
  toastUntil: 0,
  last: 0,
  placedAt: null,
  enteredAt: false,
};

const keys = new Set();
const pointerMove = { x: 0, y: 0, active: false };

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return D.freshSave();
    const parsed = JSON.parse(raw);
    return {
      ...D.freshSave(),
      ...parsed,
      look: { ...D.freshSave().look, ...parsed.look },
      placed: { ...parsed.placed },
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

function renderNice() {
  const nice = D.niceScore(game.save.placed);
  niceEl.textContent = `Ładnie: ${nice}`;
}

function personSvg(look, opts) {
  const size = (opts && opts.size) || 72;
  const hair = D.HAIR_COLORS[look.hairColor] || D.HAIR_COLORS[0];
  const skin = D.SKINS[look.skin] || D.SKINS[0];
  const shirt = D.SHIRTS[look.shirt] || D.SHIRTS[0];
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

function setChrome(mode) {
  const play = mode === "out" || mode === "in";
  space.classList.toggle("is-play", play);
  deck.hidden = !play;
  dock.hidden = !play;
}

function createScreen() {
  game.mode = "create";
  setChrome("create");
  const look = game.save.look;
  const name = String(game.save.name || "").replace(/[<>&"]/g, "");
  stage.innerHTML = `
    <div class="sheet create">
      <h1>Jesteś człowieczkiem</h1>
      <p class="lead">Wpisz imię i wybierz wygląd. Potem cała planeta jest twoja. Masz domek. Jak zrobisz ładnie, przyjeżdżają ludzie.</p>
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

function syncVisitors() {
  const want = D.visitorCount(D.niceScore(game.save.placed));
  const before = game.visitors.length;
  while (game.visitors.length < want) {
    const card = D.VISITORS[game.visitors.length % D.VISITORS.length];
    game.visitors.push({
      name: card.name,
      line: card.line,
      look: {
        hair: game.visitors.length % D.HAIRS.length,
        hairColor: (game.visitors.length + 2) % D.HAIR_COLORS.length,
        skin: game.visitors.length % D.SKINS.length,
        shirt: (game.visitors.length + 1) % D.SHIRTS.length,
      },
      x: 30 + game.visitors.length * 16,
      y: 44 + (game.visitors.length % 2) * 10,
      vx: 8 + game.visitors.length * 2,
    });
  }
  if (game.visitors.length > want) game.visitors = game.visitors.slice(0, want);
  if (want > before) {
    const last = game.visitors[game.visitors.length - 1];
    showToast(`${last.name} przyleciał. Bo jest ładnie.`);
  }
}

function playScreen() {
  game.mode = game.save.room;
  setChrome(game.save.room);
  const indoor = game.save.room === "in";
  const spots = D.spotsFor(game.save.room);
  const items = D.itemsFor(game.save.room);
  if (!items.some((item) => item.id === game.held)) game.held = items[0].id;

  stage.innerHTML = `
    <div class="arena">
      <div class="room ${indoor ? "is-home" : "is-planet"}" id="room">
        ${
          indoor
            ? `<div class="door" style="left:${D.HOUSE_EXIT.x}%;top:${D.HOUSE_EXIT.y}%"><span>Wyjście</span></div>`
            : `<div class="house" style="left:${D.HOUSE_DOOR.x}%;top:${D.HOUSE_DOOR.y}%">${houseSvg()}<span>Domek</span></div>`
        }
        ${spots
          .map((spot) => `<div class="plot" data-plot="${spot.id}" style="left:${spot.x}%;top:${spot.y}%"></div>`)
          .join("")}
        ${
          indoor
            ? ""
            : `<div id="guests"></div>`
        }
        <div class="you" id="you">${personSvg(game.save.look, { size: 78 })}</div>
      </div>
    </div>
  `;
  dock.innerHTML = items
    .map(
      (item) =>
        `<button type="button" class="dish ${game.held === item.id ? "is-on" : ""}" data-act="hold" data-id="${item.id}">${decorSvg(item.id)}<span>${item.name}</span></button>`
    )
    .join("");
  paintRoom();
}

function paintRoom() {
  const you = document.getElementById("you");
  if (!you) return;
  you.style.left = `${game.player.x}%`;
  you.style.top = `${game.player.y}%`;

  const indoor = game.save.room === "in";
  const doorHot = D.atDoor(game.player.x, game.player.y, game.save.room);
  document.querySelector(".house")?.classList.toggle("is-near", !indoor && doorHot);
  document.querySelector(".door")?.classList.toggle("is-near", indoor && doorHot);

  D.spotsFor(game.save.room).forEach((spot) => {
    const node = document.querySelector(`[data-plot="${spot.id}"]`);
    if (!node) return;
    const near = D.closestSpot(game.player.x, game.player.y, [spot], 13);
    const item = game.save.placed[spot.id];
    node.classList.toggle("is-near", Boolean(near) && !item);
    node.classList.toggle("is-full", Boolean(item));
    node.innerHTML = item ? decorSvg(item) : `<span class="hole"></span>`;
  });

  const guests = document.getElementById("guests");
  if (guests) {
    guests.innerHTML = game.visitors
      .map(
        (guest) =>
          `<div class="guest" style="left:${guest.x}%;top:${guest.y}%">${personSvg(guest.look, { size: 56 })}<b>${guest.name}</b></div>`
      )
      .join("");
  }

  if (doorHot) actBtn.textContent = indoor ? "Wychodzę" : "Do domku";
  else if (D.closestSpot(game.player.x, game.player.y, D.spotsFor(game.save.room), 13)) {
    actBtn.textContent = "Stawiam";
  } else actBtn.textContent = "Idę";
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
  game.player = { x: 46, y: 58 };
  persist();
  syncVisitors();
  playScreen();
  showToast(`${game.save.name}, to twoja planeta.`);
}

function doPlace() {
  const result = D.tryPlace(game.player.x, game.player.y, game.save.room, game.held, game.save.placed);
  if (!result.ok) {
    if (result.reason === "taken") showToast("Tu już coś stoi");
    else if (result.reason === "wrong-room") showToast("To nie tu");
    else showToast("Podejdź do pustego miejsca");
    return false;
  }
  const before = D.visitorCount(D.niceScore(game.save.placed));
  game.save.placed = result.placed;
  persist();
  renderNice();
  syncVisitors();
  const after = D.visitorCount(D.niceScore(game.save.placed));
  if (after === before) showToast("Ładniej");
  return true;
}

function doDoor() {
  if (game.save.room === "out") {
    const result = D.tryEnter(game.player.x, game.player.y, game.save.room);
    if (!result.ok) return false;
    game.save.room = result.room;
    game.player = { x: result.x, y: result.y };
    persist();
    playScreen();
    showToast("To twój dom");
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
  if (game.mode !== "out" && game.mode !== "in") return;
  if (D.atDoor(game.player.x, game.player.y, game.save.room)) {
    doDoor();
    return;
  }
  const near = game.visitors.find((guest) => D.closestSpot(game.player.x, game.player.y, [guest], 12));
  if (near && game.save.room === "out") {
    showToast(`${near.name}: ${near.line}`);
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
  if (game.mode !== "out" && game.mode !== "in") return;
  const move = moveVector();
  if (move.mag > 0.12) {
    const speed = 42 * (dt / 1000);
    game.player.x = Math.max(12, Math.min(88, game.player.x + move.x * speed));
    game.player.y = Math.max(22, Math.min(86, game.player.y + move.y * speed));
  }

  if (D.atDoor(game.player.x, game.player.y, game.save.room)) {
    if (!game.enteredAt && doDoor()) game.enteredAt = true;
  } else game.enteredAt = false;

  const nearPlot = D.closestSpot(game.player.x, game.player.y, D.spotsFor(game.save.room), 12);
  if (nearPlot && !game.save.placed[nearPlot.id] && game.placedAt !== nearPlot.id) {
    if (doPlace()) game.placedAt = nearPlot.id;
  }
  if (!nearPlot) game.placedAt = null;

  if (game.save.room === "out") {
    game.visitors.forEach((guest) => {
      guest.x += (guest.vx * dt) / 1000;
      if (guest.x > 78 || guest.x < 18) guest.vx *= -1;
    });
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
  if ((key === " " || key === "e") && (game.mode === "out" || game.mode === "in")) doAction();
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
} else {
  createScreen();
}
renderNice();
requestAnimationFrame(frame);
