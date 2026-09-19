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

const SAVE_KEY = "kot-pizza-save";

const game = {
  mode: "create",
  save: D.freshSave(),
  player: { x: 50, y: 50 },
  held: null,
  tables: [],
  spawnIn: 400,
  nextId: 1,
  toastUntil: 0,
  last: 0,
  placedAt: null,
  eatIn: 0,
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

function catSvg(look, opts) {
  const fur = D.FURS[look.fur] || D.FURS[0];
  const mark = look.mark || 0;
  const extra = look.extra || 0;
  const size = (opts && opts.size) || 72;
  const flip = opts && opts.flip ? 'transform="translate(64,0) scale(-1,1)"' : "";
  const belly = mark === 1 ? "#fff4e0" : fur;
  const stripes =
    mark === 2
      ? `<path d="M20 34 H44" stroke="#2a2118" stroke-width="2"/><path d="M22 40 H42" stroke="#2a2118" stroke-width="2"/>`
      : "";
  const spots =
    mark === 1
      ? `<circle cx="22" cy="36" r="3" fill="#2a2118"/><circle cx="40" cy="42" r="2.4" fill="#2a2118"/>`
      : "";
  const bow = extra === 1 ? `<path d="M26 46 L32 50 L38 46 L32 52Z" fill="#d6452a"/>` : "";
  const bell = extra === 2 ? `<circle cx="32" cy="52" r="3.2" fill="#f4d35e"/>` : "";

  return `<svg class="who" viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true">
    <g ${flip}>
      <ellipse cx="32" cy="60" rx="13" ry="3" fill="rgba(0,0,0,0.18)"/>
      <ellipse cx="32" cy="42" rx="16" ry="13" fill="${fur}"/>
      <ellipse cx="32" cy="44" rx="9" ry="8" fill="${belly}"/>
      ${stripes}${spots}
      <path d="M16 22 L22 8 L26 24Z" fill="${fur}"/>
      <path d="M48 22 L42 8 L38 24Z" fill="${fur}"/>
      <circle cx="32" cy="26" r="12" fill="${fur}"/>
      <circle cx="27" cy="26" r="1.6" fill="#1b1410"/>
      <circle cx="37" cy="26" r="1.6" fill="#1b1410"/>
      <path d="M32 28 L30 31 L34 31Z" fill="#e07a9a"/>
      <path d="M18 44 Q10 50 16 56" fill="none" stroke="${fur}" stroke-width="4"/>
      ${bow}${bell}
    </g>
  </svg>`;
}

function guestSvg(look) {
  const skin = ["#f3c7a6", "#e0a07a", "#b56a43"][look.skin % 3];
  const shirt = ["#2d4a7c", "#d6452a", "#2f6f5e", "#6b3f6e"][look.shirt % 4];
  return `<svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true">
    <circle cx="24" cy="16" r="8" fill="${skin}"/>
    <path d="M14 28 Q24 24 34 28 L36 44 H12Z" fill="${shirt}"/>
    <circle cx="21" cy="16" r="1.2" fill="#1b1410"/>
    <circle cx="27" cy="16" r="1.2" fill="#1b1410"/>
  </svg>`;
}

function pizzaSvg() {
  return `<svg viewBox="0 0 48 48" aria-hidden="true">
    <path d="M24 8 L42 38 H6Z" fill="#e8b15a"/>
    <path d="M24 14 L36 34 H12Z" fill="#d6452a"/>
    <circle cx="20" cy="26" r="2.2" fill="#8a6a3b"/>
    <circle cx="27" cy="30" r="2.2" fill="#8a6a3b"/>
    <circle cx="24" cy="22" r="1.8" fill="#6b5344"/>
  </svg>`;
}

function trashSvg() {
  return `<svg viewBox="0 0 48 48" aria-hidden="true">
    <ellipse cx="24" cy="30" rx="12" ry="5" fill="#8a6a3b"/>
    <path d="M16 18 L32 16 L30 32 H18Z" fill="#c9b59a"/>
    <path d="M14 22 L20 20 L18 28Z" fill="#6b5344"/>
  </svg>`;
}

function randomGuestLook() {
  return {
    skin: Math.floor(Math.random() * 3),
    shirt: Math.floor(Math.random() * 4),
  };
}

function spawnCustomer() {
  const guest = {
    id: game.nextId,
    name: D.NAMES[game.nextId % D.NAMES.length],
    look: randomGuestLook(),
    patience: 17000,
    maxPatience: 17000,
  };
  const seated = D.seatGuest(game.tables, guest);
  if (seated.ok) game.nextId += 1;
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
      <h1>Jesteś kotkiem</h1>
      <p class="lead">Wybierz futro. Potem nosisz tylko pizzę z grzybami na stoliki. Śmieci zostają. Nie sprzątasz.</p>
      <div class="mirror">${catSvg(look, { size: 160 })}</div>
      <div class="picks">
        <div class="swatches" data-key="fur">
          ${D.FURS.map((color, i) => `<button type="button" class="swatch ${look.fur === i ? "is-on" : ""}" data-i="${i}" style="background:${color}"></button>`).join("")}
        </div>
        <div class="pick-row" data-key="mark">
          ${D.MARKS.map((name, i) => `<button type="button" class="chip ${look.mark === i ? "is-on" : ""}" data-i="${i}">${name}</button>`).join("")}
        </div>
        <div class="pick-row" data-key="extra">
          ${D.EXTRAS.map((name, i) => `<button type="button" class="chip ${look.extra === i ? "is-on" : ""}" data-i="${i}">${name}</button>`).join("")}
        </div>
      </div>
      <button type="button" class="go" data-act="open-bar">Biegam z pizzą</button>
      <a class="side" href="labirynt/">Robocik · labirynt</a>
    </div>
  `;
}

function playScreen() {
  game.mode = "play";
  deck.hidden = false;
  if (game.tables.length !== D.tableCount(game.save.owned)) {
    const old = game.tables;
    game.tables = D.emptyTables(game.save.owned);
    old.forEach((table, i) => {
      if (game.tables[i]) Object.assign(game.tables[i], { guest: table.guest, pizza: table.pizza, trash: table.trash });
    });
  }
  stage.innerHTML = `
    <div class="sheet play">
      <p class="how">Weź pizzę z pieca. Zanieś na stolik. Klient je. Śmieci zostają.</p>
      <div class="room is-cat" id="room">
        <div class="oven" style="left:${D.OVEN.x}%;top:${D.OVEN.y}%">${pizzaSvg()}<span>Pizza z grzybami</span></div>
        ${game.tables
          .map((table) => `<div class="table" data-table="${table.id}" style="left:${table.x}%;top:${table.y}%"></div>`)
          .join("")}
        <div class="you" id="you">${catSvg(game.save.look, { size: 76 })}<span id="carry" class="carry" hidden></span></div>
      </div>
      <button type="button" class="go slim" data-act="upgrades">Ulepsz pizzerię</button>
    </div>
  `;
  paintRoom();
}

function paintRoom() {
  const you = document.getElementById("you");
  const carry = document.getElementById("carry");
  if (!you) return;
  you.style.left = `${game.player.x}%`;
  you.style.top = `${game.player.y}%`;

  const ovenHot = D.atOven(game.player.x, game.player.y);
  document.querySelector(".oven")?.classList.toggle("is-near", ovenHot);

  game.tables.forEach((table) => {
    const node = document.querySelector(`[data-table="${table.id}"]`);
    if (!node) return;
    const near = D.closestTable(game.player.x, game.player.y, [table], 14);
    node.classList.toggle("is-near", Boolean(near));
    node.classList.toggle("is-dirty", table.trash);
    node.classList.toggle("is-empty", !table.guest && !table.trash);
    const wait = table.guest ? Math.max(0, table.guest.patience / table.guest.maxPatience) : 0;
    node.innerHTML = `
      <span class="table-top"></span>
      ${table.guest ? `<span class="sitter">${guestSvg(table.guest.look)}<b>${table.guest.name}</b></span>` : ""}
      ${table.pizza ? `<span class="on-table">${pizzaSvg()}</span>` : ""}
      ${table.trash ? `<span class="junk">${trashSvg()}</span>` : ""}
      ${table.guest ? `<span class="wait"><i style="width:${Math.round(wait * 100)}%"></i></span>` : ""}
    `;
  });

  if (game.held === "pizza") {
    carry.hidden = false;
    carry.innerHTML = pizzaSvg();
    actBtn.textContent = "Pizza";
  } else if (ovenHot) {
    carry.hidden = true;
    actBtn.textContent = "Weź pizzę";
  } else {
    carry.hidden = true;
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
      <p class="lead">Masz ${game.save.money} monet. Śmieci i tak zostają.</p>
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
  game.player = { x: 50, y: 50 };
  game.held = null;
  game.tables = D.emptyTables(game.save.owned);
  game.spawnIn = 350;
  game.placedAt = null;
  game.eatIn = 0;
  persist();
  playScreen();
  showToast("Jesteś kotkiem. Tylko pizza z grzybami.");
}

function doPickup() {
  const result = D.tryPickup(game.player.x, game.player.y, game.held);
  if (!result.ok) {
    if (result.reason === "full") showToast("Masz już pizzę. Na stolik.");
    else showToast("Podejdź do pieca");
    return false;
  }
  game.held = result.held;
  showToast("Pizza z grzybami");
  return true;
}

function doPlace() {
  const result = D.tryPlaceOnTable(game.player.x, game.player.y, game.held, game.tables);
  if (!result.ok) return false;
  game.held = result.held;
  game.eatIn = 700;
  showToast("Pizza sama ląduje na stoliku");
  return true;
}

function doAction() {
  if (game.mode !== "play") return;
  const table = D.closestTable(game.player.x, game.player.y, game.tables, 14);
  if (table && table.trash && !game.held) {
    showToast("Śmieci zostają. Kotek nie sprząta.");
    return;
  }
  if (!game.held) doPickup();
  else if (table) doPlace();
  else showToast("Zanieś pizzę na stolik");
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
    game.player.y = Math.max(18, Math.min(88, game.player.y + move.y * speed));
  }

  if (!game.held && D.atOven(game.player.x, game.player.y)) {
    const grabbed = D.tryPickup(game.player.x, game.player.y, game.held);
    if (grabbed.ok) {
      game.held = grabbed.held;
      showToast("Bierzesz pizzę z grzybami");
    }
  }

  const nearTable = D.closestTable(game.player.x, game.player.y, game.tables, 13);
  if (game.held && nearTable && game.placedAt !== nearTable.id) {
    if (doPlace()) game.placedAt = nearTable.id;
  }
  if (!nearTable) game.placedAt = null;

  if (game.eatIn > 0) {
    game.eatIn -= dt;
    if (game.eatIn <= 0) {
      const eaten = D.eatAtReadyTables(game.tables, game.save.owned);
      if (eaten.ok) {
        game.save.money += eaten.pay;
        persist();
        renderMoney();
        showToast(`${eaten.name} zjadł. Śmieci zostają. +${eaten.pay}`);
        if (game.tables.some((table) => table.guest && table.pizza)) {
          game.eatIn = 450;
        }
      }
    }
  }

  game.tables.forEach((table) => {
    if (table.guest) table.guest.patience -= dt;
  });
  game.tables.forEach((table) => {
    if (table.guest && table.guest.patience <= 0) {
      showToast(`${table.guest.name} wyszedł. Bez pizzy.`);
      table.guest = null;
    }
  });

  game.spawnIn -= dt;
  if (game.tables.some((table) => !table.guest) && game.spawnIn <= 0) {
    spawnCustomer();
    game.spawnIn = 3200 + Math.random() * 2200;
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
  if ((key === " " || key === "e") && game.mode === "play") doAction();
  if (key === "enter" && game.mode === "create") openBar();
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
