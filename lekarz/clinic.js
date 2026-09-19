const D = window.ClinicData;
const stage = document.getElementById("stage");
const toastEl = document.getElementById("toast");
const scoreEl = document.getElementById("score");
const shopBtn = document.getElementById("shop-btn");
const shopEl = document.getElementById("shop");
const shopCash = document.getElementById("shop-cash");
const shopList = document.getElementById("shop-list");
const ward = document.getElementById("ward");
const deck = document.getElementById("deck");
const stickBase = document.getElementById("stick");
const stickKnob = document.getElementById("stick-knob");
const actBtn = document.getElementById("act-btn");

const SAVE_KEY = "lekarz-save";

const game = {
  mode: "create",
  save: D.freshSave(),
  player: { x: 50, y: 58 },
  held: null,
  chairs: D.emptyChairs(),
  nextGuest: 0,
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
      name: String(parsed.name || ""),
      look: { ...fresh.look, ...(parsed.look || {}) },
      score: Number(parsed.score) || 0,
      money: Number.isFinite(parsed.money) ? parsed.money : fresh.money,
      stock: { ...fresh.stock, ...(parsed.stock || {}) },
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

function renderScore() {
  scoreEl.textContent = `${game.save.money} zł · ${game.save.score}`;
}

function doctorSvg(look, opts) {
  const size = (opts && opts.size) || 86;
  const hair = D.HAIR_COLORS[(look && look.hairColor) || 0] || D.HAIR_COLORS[0];
  const skin = D.SKINS[(look && look.skin) || 0] || D.SKINS[0];
  const coat = D.COATS[(look && look.coat) || 0] || D.COATS[0];
  const style = (look && look.hair) || 0;
  const bangs = style === 1 ? `<path d="M20 20 H44 V24 H20Z" fill="${hair}"/>` : "";
  const braid = style === 2 ? `<path d="M40 28 Q48 40 42 50" fill="none" stroke="${hair}" stroke-width="4"/>` : "";
  const tail = style === 3 ? `<path d="M42 22 Q54 18 50 32" fill="none" stroke="${hair}" stroke-width="5"/>` : "";
  return `<svg class="who" viewBox="0 0 64 72" width="${size}" height="${Math.round(size * 1.12)}" aria-hidden="true">
    <ellipse cx="32" cy="68" rx="12" ry="3" fill="rgba(15,61,62,0.25)"/>
    <path d="M18 40 Q32 34 46 40 L48 62 H16Z" fill="${coat}"/>
    <rect x="28" y="46" width="8" height="10" fill="#d7263d"/>
    <rect x="25" y="49" width="14" height="4" fill="#d7263d"/>
    <circle cx="32" cy="24" r="12" fill="${skin}"/>
    <path d="M20 20 Q32 8 44 20 L44 26 H20Z" fill="${hair}"/>
    ${bangs}${braid}${tail}
    <circle cx="27" cy="25" r="1.5" fill="#0f3d3e"/>
    <circle cx="37" cy="25" r="1.5" fill="#0f3d3e"/>
  </svg>`;
}

function setChrome(mode) {
  const play = mode === "play";
  ward.classList.toggle("is-play", play);
  deck.hidden = !play;
  if (shopBtn) shopBtn.hidden = !play;
  if (!play) hideShop();
}

function createScreen() {
  game.mode = "create";
  setChrome("create");
  const look = game.save.look;
  const name = String(game.save.name || "").replace(/[<>&"]/g, "");
  stage.innerHTML = `
    <div class="sheet create">
      <h1>Jesteś lekarzem</h1>
      <p class="lead">Wpisz imię i wybierz wygląd. Potem bierz lekarstwa z półek i dawaj pacjentom. Oni płacą. Złe lekarstwo po prostu nie działa.</p>
      <label class="name-box">Imię
        <input id="name-in" type="text" maxlength="12" value="${name}" placeholder="np. Ola" />
      </label>
      <div class="mirror">${doctorSvg(look, { size: 150 })}</div>
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
        <div class="swatches" data-key="coat">
          ${D.COATS.map((color, i) => `<button type="button" class="swatch ${look.coat === i ? "is-on" : ""}" data-i="${i}" style="background:${color}"></button>`).join("")}
        </div>
      </div>
      <button type="button" class="go" data-act="open-clinic">Idę do gabinetu</button>
      <a class="side" href="../">Robocik</a>
      <a class="side" href="../planeta/">Moja Planeta</a>
      <a class="side" href="../pizza/">Pizza u Kotka</a>
    </div>
  `;
}

function patientSvg(look) {
  const skin = D.SKINS[look.skin] || D.SKINS[0];
  const shirt = D.SHIRTS[look.shirt] || D.SHIRTS[0];
  return `<svg viewBox="0 0 48 56" width="58" height="68" aria-hidden="true">
    <path d="M14 30 Q24 26 34 30 L36 50 H12Z" fill="${shirt}"/>
    <circle cx="24" cy="18" r="9" fill="${skin}"/>
    <path d="M15 16 Q24 8 33 16 L33 20 H15Z" fill="#2a1a12"/>
    <circle cx="21" cy="19" r="1.2" fill="#0f3d3e"/>
    <circle cx="27" cy="19" r="1.2" fill="#0f3d3e"/>
  </svg>`;
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

function fillChairs() {
  game.chairs.forEach((chair) => {
    if (chair.guest) return;
    chair.guest = D.makeGuest(game.nextGuest, game.save.stock);
    game.nextGuest += 1;
  });
}

function hideShop() {
  if (shopEl) shopEl.hidden = true;
  ward.classList.remove("is-shop");
}

function renderShop() {
  if (!shopEl || !shopList || !shopCash) return;
  shopCash.textContent = `Masz ${game.save.money} zł`;
  shopList.innerHTML = D.MEDS.map((med) => {
    const unlocked = Number.isFinite(game.save.stock[med.id]);
    const price = unlocked ? D.restockCost(med) : med.cost || 8;
    const count = game.save.stock[med.id] || 0;
    const poor = game.save.money < price;
    const label = unlocked ? `dokup +1` : "nowe na półkę";
    return `<button type="button" class="ware ${poor ? "is-poor" : ""}" data-act="buy" data-id="${med.id}">${medSvg(med.id)}<span>${med.name}<br><em>${med.ailment} · ${label} · masz ${count}</em></span><b>${price} zł</b></button>`;
  }).join("");
}

function openShop() {
  if (game.mode !== "play") return;
  shopEl.hidden = false;
  ward.classList.add("is-shop");
  renderShop();
}

function playScreen() {
  game.mode = "play";
  setChrome("play");
  hideShop();
  fillChairs();
  const spots = D.shelfSpots(game.save.stock);
  stage.innerHTML = `
    <div class="arena">
      <div class="room" id="room">
        <div class="rack one"></div>
        <div class="rack two"></div>
        ${spots
          .map((spot) => {
            const med = D.medById(spot.id);
            const count = game.save.stock[spot.id] || 0;
            return `<div class="shelf ${count < 1 ? "is-empty" : ""}" data-med="${spot.id}" style="left:${spot.x}%;top:${spot.y}%">${medSvg(spot.id)}<b>${med.ailment}</b><em>×${count}</em></div>`;
          })
          .join("")}
        ${game.chairs
          .map((chair) => `<div class="chair" data-chair="${chair.id}" style="left:${chair.x}%;top:${chair.y}%"></div>`)
          .join("")}
        <div class="you" id="you">${doctorSvg(game.save.look)}<span class="held" id="held"></span></div>
      </div>
    </div>
  `;
  paintRoom();
}

function paintRoom() {
  const you = document.getElementById("you");
  if (!you) return;
  you.style.left = `${game.player.x}%`;
  you.style.top = `${game.player.y}%`;
  you.style.transform = `translate(-50%, -60%) scaleX(${game.facing})`;
  const held = document.getElementById("held");
  if (held) held.innerHTML = game.held ? medSvg(game.held) : "";

  const spots = D.shelfSpots(game.save.stock);
  const shelfHot = D.closestSpot(game.player.x, game.player.y, spots, 14);
  document.querySelectorAll("[data-med]").forEach((node) => {
    const count = game.save.stock[node.dataset.med] || 0;
    node.classList.toggle("is-near", Boolean(shelfHot) && shelfHot.id === node.dataset.med);
    node.classList.toggle("is-empty", count < 1);
    const tally = node.querySelector("em");
    if (tally) tally.textContent = `×${count}`;
  });

  const chairHot = D.closestSpot(game.player.x, game.player.y, game.chairs, 14);
  game.chairs.forEach((chair) => {
    const node = document.querySelector(`[data-chair="${chair.id}"]`);
    if (!node) return;
    node.classList.toggle("is-near", Boolean(chairHot) && chairHot.id === chair.id && Boolean(chair.guest));
    node.innerHTML = chair.guest
      ? `${patientSvg(chair.guest.look)}<span class="say">${chair.guest.say}</span><b>${chair.guest.name}</b>`
      : "";
  });

  if (shopEl && !shopEl.hidden) actBtn.textContent = "Wychodzę";
  else if (shelfHot) actBtn.textContent = "Weź";
  else if (chairHot && chairHot.guest) actBtn.textContent = "Daj";
  else actBtn.textContent = "A";
}

function openClinic() {
  const input = document.getElementById("name-in");
  const name = input ? input.value : game.save.name;
  if (!D.nameOk(name)) {
    showToast("Najpierw wpisz imię");
    return;
  }
  game.save.name = name.trim();
  persist();
  playScreen();
  showToast(`${game.save.name}, bierz z półki i dawaj.`);
}

function doBuy(id) {
  const result = D.tryBuy(game.save, id);
  if (!result.ok) {
    showToast(result.reason === "poor" ? "Za mało złotych" : "Nie ma tego");
    return;
  }
  game.save = result.save;
  persist();
  renderScore();
  renderShop();
  playScreen();
  openShop();
  const med = D.medById(id);
  showToast(`Na półkę: ${med ? med.name : id}`);
}

function doAction() {
  if (game.mode !== "play") return;
  if (shopEl && !shopEl.hidden) {
    hideShop();
    return;
  }
  const grab = D.tryGrab(game.player.x, game.player.y, game.held, game.save.stock);
  if (grab.ok) {
    game.held = grab.held;
    const med = D.medById(grab.held);
    showToast(med ? med.name : "Lekarstwo");
    paintRoom();
    return;
  }
  if (grab.reason === "none") {
    showToast("Pusto. Kup w sklepie.");
    return;
  }
  const treat = D.tryTreat(game.player.x, game.player.y, game.held, game.chairs);
  if (treat.reason === "empty") {
    showToast("Najpierw weź lekarstwo");
    return;
  }
  if (treat.reason === "wrong") {
    showToast("Złe lekarstwo. Weź inne.");
    return;
  }
  if (!treat.ok) {
    showToast("Podejdź do półki albo do pacjenta");
    return;
  }
  const chair = game.chairs.find((seat) => seat.id === treat.chairId);
  const name = chair && chair.guest ? chair.guest.name : "Pacjent";
  const pay = treat.pay || 6;
  if (chair) chair.guest = null;
  if (game.held) {
    game.save.stock[game.held] = Math.max(0, (game.save.stock[game.held] || 0) - 1);
  }
  game.held = null;
  game.save.score += 1;
  game.save.money += pay;
  persist();
  renderScore();
  fillChairs();
  showToast(`${name} płaci ${pay} zł`);
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
  if (game.mode !== "play") return;
  if (shopEl && !shopEl.hidden) return;
  const move = moveVector();
  if (move.mag > 0.12) {
    if (move.x !== 0) game.facing = move.x < 0 ? -1 : 1;
    const speed = 48 * (dt / 1000);
    game.player.x = Math.max(10, Math.min(90, game.player.x + move.x * speed));
    game.player.y = Math.max(26, Math.min(88, game.player.y + move.y * speed));
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
  if (btn.dataset.act === "open-clinic") {
    openClinic();
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

shopBtn.addEventListener("click", () => {
  if (shopEl && !shopEl.hidden) hideShop();
  else openShop();
});

shopEl?.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-act]");
  if (!btn) return;
  if (btn.dataset.act === "leave-shop") hideShop();
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
  if ((key === " " || key === "e") && game.mode === "play") doAction();
  if (key === "enter" && game.mode === "create") openClinic();
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

bindStick(stickBase);
game.save = loadSave();
renderScore();
if (new URLSearchParams(location.search).has("play") && D.nameOk(game.save.name || "Ola")) {
  if (!D.nameOk(game.save.name)) game.save.name = "Ola";
  playScreen();
} else {
  createScreen();
}
requestAnimationFrame(frame);
