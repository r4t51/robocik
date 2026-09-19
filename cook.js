const D = window.BarData;
const stage = document.getElementById("stage");
const toastEl = document.getElementById("toast");
const moneyEl = document.getElementById("money");
const walletEl = document.getElementById("wallet");
const signEl = document.getElementById("sign");
const deck = document.getElementById("deck");
const stickBase = document.getElementById("stick");
const stickKnob = document.getElementById("stick-knob");
const actBtn = document.getElementById("act-btn");

const SAVE_KEY = "bar-mniam-save";

const game = {
  mode: "create",
  save: D.freshSave(),
  player: { x: 50, y: 58 },
  held: null,
  plates: [],
  customers: [],
  spawnIn: 700,
  nextId: 1,
  toastUntil: 0,
  last: 0,
  placedOnce: false,
};

const keys = new Set();
const pointerMove = { x: 0, y: 0, active: false };

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return D.freshSave();
    const parsed = JSON.parse(raw);
    return {
      look: { ...D.freshSave().look, ...parsed.look },
      money: Number(parsed.money) || 0,
      owned: { ...parsed.owned },
    };
  } catch (err) {
    return D.freshSave();
  }
}

function persist() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(game.save));
}

function showToast(text, ms = 1200) {
  toastEl.textContent = text;
  toastEl.hidden = false;
  game.toastUntil = performance.now() + ms;
}

function renderMoney() {
  moneyEl.textContent = String(game.save.money);
  walletEl.setAttribute("aria-label", `Monety: ${game.save.money}`);
  signEl.classList.toggle("is-fancy", Boolean(game.save.owned.sign));
}

function personSvg(look, opts) {
  const skin = D.SKINS[look.skin] || D.SKINS[0];
  const hair = D.HAIR_COLORS[look.hairColor] || D.HAIR_COLORS[0];
  const shirt = D.SHIRTS[look.shirt] || D.SHIRTS[0];
  const hairCut = look.hair || 0;
  const extra = look.extra || 0;
  const flip = opts && opts.flip ? 'transform="translate(64,0) scale(-1,1)"' : "";
  const size = (opts && opts.size) || 64;

  let hairShape = `<path d="M18 22 C18 10 46 10 46 22 V28 H18Z" fill="${hair}"/>`;
  if (hairCut === 1) {
    hairShape = `<path d="M16 20 C18 8 46 8 48 22 L48 30 H16Z" fill="${hair}"/><path d="M18 22 H46 V28 H18Z" fill="${hair}"/>`;
  } else if (hairCut === 2) {
    hairShape = `<path d="M18 20 C18 9 46 9 46 22 V27 H18Z" fill="${hair}"/><ellipse cx="50" cy="34" rx="6" ry="10" fill="${hair}"/>`;
  } else if (hairCut === 3) {
    hairShape = `<circle cx="22" cy="18" r="8" fill="${hair}"/><circle cx="42" cy="18" r="8" fill="${hair}"/><path d="M18 22 H46 V28 H18Z" fill="${hair}"/>`;
  } else if (hairCut === 4) {
    hairShape = `<path d="M18 26 L22 8 L28 24 L32 6 L38 24 L42 8 L46 26 Z" fill="${hair}"/>`;
  }

  const glasses =
    extra === 1
      ? `<g fill="none" stroke="#1b1410" stroke-width="2"><circle cx="26" cy="30" r="5"/><circle cx="38" cy="30" r="5"/><path d="M31 30 H33"/></g>`
      : "";
  const scarf =
    extra === 2
      ? `<path d="M22 46 Q32 54 42 46 L40 58 L32 52 L24 58Z" fill="#f4d35e"/>`
      : "";

  return `<svg class="who" viewBox="0 0 64 72" width="${size}" height="${Math.round((size * 72) / 64)}" aria-hidden="true">
    <g ${flip}>
      <ellipse cx="32" cy="68" rx="14" ry="3" fill="rgba(0,0,0,0.18)"/>
      <path d="M20 48 Q32 44 44 48 L46 68 H18Z" fill="${shirt}"/>
      <rect x="22" y="50" width="20" height="8" fill="#f3efe4"/>
      <circle cx="32" cy="30" r="14" fill="${skin}"/>
      ${hairShape}
      <circle cx="27" cy="31" r="1.7" fill="#1b1410"/>
      <circle cx="37" cy="31" r="1.7" fill="#1b1410"/>
      <path d="M28 37 Q32 40 36 37" fill="none" stroke="#1b1410" stroke-width="1.4"/>
      ${glasses}${scarf}
    </g>
  </svg>`;
}

function dishSvg(id) {
  if (id === "tea") {
    return `<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="22" cy="34" rx="12" ry="5" fill="#c9a56a"/><path d="M12 20 H32 V32 Q22 36 12 32Z" fill="#f4f0e4" stroke="#5a3a22" stroke-width="2"/><path d="M32 22 Q40 24 32 30" fill="none" stroke="#5a3a22" stroke-width="2"/><ellipse cx="22" cy="20" rx="10" ry="3" fill="#7a3f1d"/></svg>`;
  }
  if (id === "sandwich") {
    return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 28 L24 14 L40 28 L24 34Z" fill="#e7c27a"/><path d="M10 26 L24 16 L38 26 L24 30Z" fill="#6fad4f"/><path d="M10 30 L24 20 L38 30 L24 36Z" fill="#d9a15b"/></svg>`;
  }
  if (id === "soup") {
    return `<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="34" rx="14" ry="6" fill="#8a5a28"/><path d="M10 22 H38 L34 34 H14Z" fill="#c45a24"/><ellipse cx="24" cy="22" rx="14" ry="5" fill="#e07a3d"/><path d="M18 12 Q20 18 16 20" fill="none" stroke="#dfe8e4" stroke-width="2"/></svg>`;
  }
  if (id === "pancake") {
    return `<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="30" rx="16" ry="8" fill="#e8b15a"/><path d="M10 28 Q24 10 38 28 Q24 22 10 28Z" fill="#f4c56d"/><path d="M28 16 Q34 10 36 18" fill="#c6452a"/></svg>`;
  }
  return `<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="16" cy="30" rx="8" ry="6" fill="#f0d7a0" stroke="#8a5a28" stroke-width="2"/><ellipse cx="28" cy="26" rx="8" ry="6" fill="#f0d7a0" stroke="#8a5a28" stroke-width="2"/><ellipse cx="22" cy="34" rx="8" ry="6" fill="#f0d7a0" stroke="#8a5a28" stroke-width="2"/></svg>`;
}

function randomGuestLook() {
  return {
    skin: Math.floor(Math.random() * D.SKINS.length),
    hair: Math.floor(Math.random() * D.HAIR_STYLES.length),
    hairColor: Math.floor(Math.random() * D.HAIR_COLORS.length),
    shirt: Math.floor(Math.random() * D.SHIRTS.length),
    extra: Math.random() > 0.7 ? 1 : 0,
  };
}

function spawnCustomer() {
  const menu = D.openRecipes(game.save.owned);
  const recipe = menu[Math.floor(Math.random() * menu.length)];
  game.customers.push({
    id: game.nextId,
    name: D.NAMES[game.nextId % D.NAMES.length],
    recipeId: recipe.id,
    look: randomGuestLook(),
    patience: 18000,
    maxPatience: 18000,
  });
  game.nextId += 1;
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

function createScreen() {
  game.mode = "create";
  deck.hidden = true;
  const look = game.save.look;
  stage.innerHTML = `
    <div class="sheet create">
      <h1>Najpierw wygląd</h1>
      <p class="lead">To git. Potem już chodzisz: podchodzisz do jedzenia, bierzesz, nosisz na ladę. Klient sam to zgarnia.</p>
      <div class="mirror">${personSvg(look, { size: 150 })}</div>
      <div class="picks">
        <div class="pick-row" data-key="hair">
          ${D.HAIR_STYLES.map((name, i) => `<button type="button" class="chip ${look.hair === i ? "is-on" : ""}" data-i="${i}">${name}</button>`).join("")}
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
        <div class="pick-row" data-key="extra">
          ${D.EXTRAS.map((name, i) => `<button type="button" class="chip ${look.extra === i ? "is-on" : ""}" data-i="${i}">${name}</button>`).join("")}
        </div>
      </div>
      <button type="button" class="go" data-act="open-bar">Chodzę po kuchni</button>
      <a class="side" href="labirynt/">Albo labirynt Robocika</a>
    </div>
  `;
}

function playScreen() {
  game.mode = "play";
  deck.hidden = false;
  const stations = D.stationsFor(game.save.owned);
  stage.innerHTML = `
    <div class="sheet play">
      <p class="how">Podejdź do jedzenia, weź je, zanieś do lady. Klient sam bierze.</p>
      <div class="room" id="room">
        <div class="queue" id="queue"></div>
        <div class="counter-top" id="plates"></div>
        ${stations
          .map(
            (spot) => `<div class="shelf" data-shelf="${spot.recipeId}" style="left:${spot.x}%;top:${spot.y}%">
              ${dishSvg(spot.recipeId)}
              <span>${spot.name}</span>
            </div>`,
          )
          .join("")}
        <div class="you" id="you">${personSvg(game.save.look, { size: 72 })}<span id="carry" class="carry" hidden></span></div>
      </div>
      <button type="button" class="go slim" data-act="upgrades">Ulepsz bar</button>
    </div>
  `;
  paintRoom();
}

function paintRoom() {
  const you = document.getElementById("you");
  const carry = document.getElementById("carry");
  const queue = document.getElementById("queue");
  const plates = document.getElementById("plates");
  if (!you || !queue || !plates) return;

  you.style.left = `${game.player.x}%`;
  you.style.top = `${game.player.y}%`;

  const near = D.closestStation(game.player.x, game.player.y, game.save.owned, 13);
  document.querySelectorAll(".shelf").forEach((node) => {
    node.classList.toggle("is-near", Boolean(near) && near.recipeId === node.dataset.shelf);
  });
  document.querySelector(".counter-top")?.classList.toggle("is-near", D.atCounter(game.player.y));

  if (game.held) {
    carry.hidden = false;
    carry.innerHTML = `${dishSvg(game.held)}`;
  } else {
    carry.hidden = true;
    carry.innerHTML = "";
  }

  const wanted = new Set(game.plates.map((plate) => plate.recipeId));
  queue.innerHTML = game.customers.length
    ? game.customers
        .map((guest) => {
          const recipe = D.recipeById(guest.recipeId);
          const wait = Math.max(0, guest.patience / guest.maxPatience);
          return `<div class="guest ${wanted.has(guest.recipeId) ? "is-ready" : ""}">
            ${personSvg(guest.look, { size: 62, flip: true })}
            <span class="guest-name">${guest.name}</span>
            <span class="order">${dishSvg(recipe.id)}<b>${recipe.name}</b></span>
            <span class="wait"><i style="width:${Math.round(wait * 100)}%"></i></span>
          </div>`;
        })
        .join("")
    : `<p class="empty">Zaraz ktoś przyjdzie.</p>`;

  plates.innerHTML = game.plates.length
    ? game.plates
        .map((plate) => `<div class="plate">${dishSvg(plate.recipeId)}<span>${D.recipeById(plate.recipeId).name}</span></div>`)
        .join("")
    : `<p class="empty">Lada pusta</p>`;

  if (game.held) {
    actBtn.textContent = D.recipeById(game.held).name;
  } else if (near) {
    actBtn.textContent = `Weź ${near.name}`;
  } else {
    actBtn.textContent = "Weź";
  }
}

function upgradeScreen() {
  toastEl.hidden = true;
  game.mode = "upgrade";
  deck.hidden = true;
  stage.innerHTML = `
    <div class="sheet shop">
      <h1>Ulepszenia</h1>
      <p class="lead">Masz ${game.save.money} monet. Kup coś do baru, potem wróć i noś dalej.</p>
      <div class="wares">
        ${D.UPGRADES.map((item) => {
          const check = D.canBuy(game.save, item.id);
          const owned = Boolean(game.save.owned[item.id]);
          return `<div class="ware">
            <div>
              <strong>${item.name}</strong>
              <p>${item.blurb}</p>
            </div>
            <button type="button" class="buy" data-act="buy" data-id="${item.id}" ${owned || !check.ok ? "disabled" : ""}>
              ${owned ? "Masz" : item.cost}
            </button>
          </div>`;
        }).join("")}
      </div>
      <button type="button" class="go" data-act="back-bar">Wracam</button>
    </div>
  `;
}

function openBar() {
  game.player = { x: 50, y: 58 };
  game.held = null;
  game.plates = [];
  game.customers = [];
  game.spawnIn = 500;
  game.placedOnce = false;
  persist();
  playScreen();
  showToast("Podejdź, weź, zanieś do lady.");
}

function doPickup() {
  const result = D.tryPickup(game.player.x, game.player.y, game.held, game.save.owned);
  if (!result.ok) {
    if (result.reason === "full") showToast("Najpierw zanieś to na ladę");
    else showToast("Podejdź bliżej półki");
    return false;
  }
  game.held = result.held;
  showToast(`Bierzesz: ${result.name}`);
  return true;
}

function doPlace() {
  const result = D.tryPlace(game.player.y, game.held, game.plates, game.save.owned);
  if (!result.ok) return false;
  game.held = result.held;
  game.plates = result.plates;
  showToast("Samo się kładzie na ladzie");
  return true;
}

function doAction() {
  if (game.mode !== "play") return;
  if (!game.held) doPickup();
  else if (D.atCounter(game.player.y)) doPlace();
  else showToast("Zanieś to do lady na górze");
  paintRoom();
}

function buyItem(id) {
  const result = D.buyUpgrade(game.save, id);
  if (!result.ok) {
    showToast(result.reason === "poor" ? "Za mało monet" : "To już masz");
    return;
  }
  game.save = result.save;
  persist();
  upgradeScreen();
  showToast("Kupione");
}

function step(dt) {
  if (game.mode !== "play") return;
  const move = moveVector();
  if (move.mag > 0.12) {
    const speed = D.walkSpeed(game.save.owned) * (dt / 1000);
    game.player.x = Math.max(12, Math.min(88, game.player.x + move.x * speed));
    game.player.y = Math.max(28, Math.min(88, game.player.y + move.y * speed));
  }

  if (!game.held && D.closestStation(game.player.x, game.player.y, game.save.owned, 11)) {
    const grabbed = D.tryPickup(game.player.x, game.player.y, game.held, game.save.owned);
    if (grabbed.ok) {
      game.held = grabbed.held;
      showToast(`Bierzesz: ${grabbed.name}`);
    }
  }

  if (game.held && D.atCounter(game.player.y) && !game.placedOnce) {
    if (doPlace()) game.placedOnce = true;
  }
  if (!D.atCounter(game.player.y)) game.placedOnce = false;

  const taken = D.autoTake(game.plates, game.customers, game.save.owned);
  if (taken.ok) {
    game.plates = taken.plates;
    game.customers = taken.customers;
    game.save.money += taken.pay;
    persist();
    renderMoney();
    showToast(`${taken.name} bierze ${taken.dish}. +${taken.pay}`);
  }

  game.customers.forEach((guest) => {
    guest.patience -= dt;
  });
  const leaving = game.customers.filter((guest) => guest.patience <= 0);
  if (leaving.length) {
    game.customers = game.customers.filter((guest) => guest.patience > 0);
    showToast(`${leaving[0].name} wyszedł. Za długo.`);
  }

  game.spawnIn -= dt;
  if (game.customers.length < D.lineLimit(game.save.owned) && game.spawnIn <= 0) {
    spawnCustomer();
    game.spawnIn = 3800 + Math.random() * 2400;
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
  if (btn.dataset.act === "open-bar") {
    openBar();
    return;
  }
  if (btn.dataset.act === "upgrades") {
    upgradeScreen();
    return;
  }
  if (btn.dataset.act === "back-bar") {
    playScreen();
    return;
  }
  if (btn.dataset.act === "buy") {
    buyItem(btn.dataset.id);
    return;
  }
  const row = btn.closest("[data-key]");
  if (row) {
    game.save.look[row.dataset.key] = Number(btn.dataset.i);
    persist();
    createScreen();
  }
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
  if (key === " " || key === "e") doAction();
  if ((key === "enter" || key === " ") && (game.mode === "title" || game.mode === "create")) {
    if (game.mode === "create" && key === "enter") openBar();
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

bindStick(stickBase);
game.save = loadSave();
if (new URLSearchParams(location.search).has("play")) {
  openBar();
} else if (new URLSearchParams(location.search).has("shop")) {
  openBar();
  game.save.money = Math.max(game.save.money, 80);
  upgradeScreen();
} else {
  createScreen();
}
renderMoney();
requestAnimationFrame(frame);
