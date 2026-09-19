const D = window.BarData;
const stage = document.getElementById("stage");
const toastEl = document.getElementById("toast");
const moneyEl = document.getElementById("money");
const walletEl = document.getElementById("wallet");
const signEl = document.getElementById("sign");

const SAVE_KEY = "bar-mniam-save";

const game = {
  mode: "create",
  save: D.freshSave(),
  stoves: D.emptyStoves({}),
  customers: [],
  spawnIn: 900,
  nextId: 1,
  toastUntil: 0,
  last: 0,
};

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

function showToast(text, ms = 1100) {
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
    patience: 16000,
    maxPatience: 16000,
  });
  game.nextId += 1;
}

function createScreen() {
  game.mode = "create";
  const look = game.save.look;
  stage.innerHTML = `
    <div class="sheet create">
      <h1>Kim jesteś?</h1>
      <p class="lead">Wybierz fryzurę i ciuchy. Potem stawiasz się za ladą.</p>
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
      <button type="button" class="go" data-act="open-bar">Do baru</button>
      <a class="side" href="labirynt/">Albo labirynt Robocika</a>
    </div>
  `;
}

function playScreen() {
  game.mode = "play";
  const menu = D.openRecipes(game.save.owned);
  const matching = new Set(
    game.customers
      .filter((guest) => game.stoves.some((stove) => stove.ready && stove.recipeId === guest.recipeId))
      .map((guest) => guest.id),
  );

  stage.innerHTML = `
    <div class="sheet play">
      <div class="queue">
        ${
          game.customers.length
            ? game.customers
                .map((guest) => {
                  const recipe = D.recipeById(guest.recipeId);
                  const wait = Math.max(0, guest.patience / guest.maxPatience);
                  return `<button type="button" class="guest ${matching.has(guest.id) ? "is-ready" : ""}" data-act="serve" data-id="${guest.id}">
                    ${personSvg(guest.look, { size: 78, flip: true })}
                    <span class="guest-name">${guest.name}</span>
                    <span class="order">${dishSvg(recipe.id)}<b>${recipe.name}</b></span>
                    <span class="wait"><i style="width:${Math.round(wait * 100)}%"></i></span>
                  </button>`;
                })
                .join("")
            : `<p class="empty">Ulica jest cicha. Zaraz ktoś przyjdzie.</p>`
        }
      </div>
      <div class="counter">
        <div class="cook">${personSvg(game.save.look, { size: 110 })}</div>
        <div class="hobs">
          ${game.stoves
            .map((stove, index) => {
              if (!stove.recipeId) return `<div class="hob is-empty">Pusto</div>`;
              const recipe = D.recipeById(stove.recipeId);
              const total = recipe.cookMs * D.cookScale(game.save.owned);
              const done = stove.ready ? 1 : 1 - stove.left / total;
              return `<div class="hob ${stove.ready ? "is-hot" : ""}">
                ${dishSvg(recipe.id)}
                <b>${stove.ready ? "Gotowe" : recipe.name}</b>
                <span class="wait"><i style="width:${Math.round(done * 100)}%"></i></span>
              </div>`;
            })
            .join("")}
        </div>
      </div>
      <div class="dock">
        ${menu
          .map(
            (recipe) => `<button type="button" class="dish" data-act="cook" data-id="${recipe.id}">
              ${dishSvg(recipe.id)}
              <span>${recipe.name}</span>
            </button>`,
          )
          .join("")}
        <button type="button" class="dish is-shop" data-act="upgrades">Ulepsz bar</button>
      </div>
    </div>
  `;
}

function upgradeScreen() {
  game.mode = "upgrade";
  stage.innerHTML = `
    <div class="sheet shop">
      <h1>Ulepszenia</h1>
      <p class="lead">Masz ${game.save.money} monet. Kup coś do baru, potem wróć za ladę.</p>
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
      <button type="button" class="go" data-act="back-bar">Za ladę</button>
    </div>
  `;
}

function render() {
  renderMoney();
  if (game.mode === "create") createScreen();
  else if (game.mode === "upgrade") upgradeScreen();
  else playScreen();
}

function openBar() {
  game.stoves = D.emptyStoves(game.save.owned);
  game.customers = [];
  game.spawnIn = 400;
  persist();
  playScreen();
  showToast("Klienci idą. Gotuj to, o co proszą.");
}

function cookDish(id) {
  const result = D.startCook(game.stoves, game.save.owned, id);
  if (!result.ok) {
    showToast(result.reason === "busy" ? "Palnik zajęty" : "Najpierw kup przepis");
    return;
  }
  playScreen();
}

function tryServe(id) {
  const before = game.customers.find((guest) => guest.id === Number(id));
  const result = D.serveCustomer(game.stoves, game.customers, game.save.owned, Number(id));
  if (!result.ok) {
    showToast(before ? `Jeszcze nie ma: ${D.recipeById(before.recipeId).name}` : "Już wyszli");
    return;
  }
  game.customers = result.customers;
  game.save.money += result.pay;
  persist();
  playScreen();
  showToast(`+${result.pay} monet`);
}

function buyItem(id) {
  const result = D.buyUpgrade(game.save, id);
  if (!result.ok) {
    showToast(result.reason === "poor" ? "Za mało monet" : "To już masz");
    return;
  }
  game.save = result.save;
  if (id === "burner2") game.stoves = D.emptyStoves(game.save.owned);
  persist();
  upgradeScreen();
  showToast("Kupione");
}

function step(dt) {
  if (game.mode !== "play") return;
  D.tickStoves(game.stoves, dt);
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
    game.spawnIn = 4200 + Math.random() * 2200;
  }
}

let dirty = false;
function frame(now) {
  const dt = Math.min(40, now - (game.last || now));
  game.last = now;
  const readyBefore = game.stoves.filter((stove) => stove.ready).length;
  const guestHash = `${game.customers.length}:${game.customers.map((guest) => Math.round(guest.patience / 800)).join(",")}`;
  step(dt);
  if (toastEl.hidden === false && now > game.toastUntil) toastEl.hidden = true;
  if (game.mode === "play") {
    const readyAfter = game.stoves.filter((stove) => stove.ready).length;
    const guestHash2 = `${game.customers.length}:${game.customers.map((guest) => Math.round(guest.patience / 800)).join(",")}`;
    if (readyAfter !== readyBefore || guestHash2 !== guestHash || dirty) {
      playScreen();
      dirty = false;
    }
  }
  requestAnimationFrame(frame);
}

stage.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-act], .chip, .swatch");
  if (!btn) return;
  if (btn.dataset.act === "open-bar") {
    openBar();
    return;
  }
  if (btn.dataset.act === "cook") {
    cookDish(btn.dataset.id);
    return;
  }
  if (btn.dataset.act === "serve") {
    tryServe(btn.dataset.id);
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
