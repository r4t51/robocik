const D = window.ClinicData;
const stage = document.getElementById("stage");
const toastEl = document.getElementById("toast");
const scoreEl = document.getElementById("score");
const ward = document.getElementById("ward");
const deck = document.getElementById("deck");
const stickBase = document.getElementById("stick");
const stickKnob = document.getElementById("stick-knob");
const actBtn = document.getElementById("act-btn");

const SAVE_KEY = "lekarz-save";

const game = {
  mode: "play",
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
    return {
      ...D.freshSave(),
      score: Number(parsed.score) || 0,
      jailUntil: Number(parsed.jailUntil) || 0,
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
  scoreEl.textContent = `Wyleczeni: ${game.save.score}`;
}

function doctorSvg() {
  return `<svg class="who" viewBox="0 0 64 72" width="86" height="96" aria-hidden="true">
    <ellipse cx="32" cy="68" rx="12" ry="3" fill="rgba(15,61,62,0.25)"/>
    <path d="M18 40 Q32 34 46 40 L48 62 H16Z" fill="#fff6e8"/>
    <rect x="28" y="46" width="8" height="10" fill="#d7263d"/>
    <rect x="25" y="49" width="14" height="4" fill="#d7263d"/>
    <circle cx="32" cy="24" r="12" fill="#e0a07a"/>
    <path d="M20 20 Q32 8 44 20 L44 26 H20Z" fill="#2a1a12"/>
    <circle cx="27" cy="25" r="1.5" fill="#0f3d3e"/>
    <circle cx="37" cy="25" r="1.5" fill="#0f3d3e"/>
  </svg>`;
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
  if (id === "drops") {
    return `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 8 L28 28 H12Z" fill="${color}"/><circle cx="20" cy="30" r="4" fill="#fff6e8"/></svg>`;
  }
  return `<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="14" y="8" width="12" height="8" fill="#0f3d3e"/><rect x="12" y="16" width="16" height="16" fill="${color}"/></svg>`;
}

function fillChairs() {
  game.chairs.forEach((chair) => {
    if (chair.guest) return;
    chair.guest = D.makeGuest(game.nextGuest);
    game.nextGuest += 1;
  });
}

function jailScreen() {
  game.mode = "jail";
  ward.classList.add("is-jail");
  deck.hidden = true;
  toastEl.hidden = true;
  const left = D.jailLeft(Date.now(), game.save.jailUntil);
  stage.innerHTML = `
    <div class="jail">
      <h1>Więzienie</h1>
      <p>Podałeś złe lekarstwo. Siedzę tu 3 minuty.</p>
      <p class="clock" id="jail-clock">${D.jailClock(left)}</p>
      <p class="note">Zabawa. To nie prawdziwe leki.</p>
      <a class="side" href="../">Moja Planeta</a>
    </div>
  `;
}

function playScreen() {
  game.mode = "play";
  ward.classList.remove("is-jail");
  deck.hidden = false;
  fillChairs();
  stage.innerHTML = `
    <div class="arena">
      <div class="room" id="room">
        ${D.SHELF.map((spot) => {
          const med = D.medById(spot.id);
          return `<div class="shelf" data-med="${spot.id}" style="left:${spot.x}%;top:${spot.y}%">${medSvg(spot.id)}<b>${med.ailment}</b></div>`;
        }).join("")}
        ${game.chairs
          .map((chair) => `<div class="chair" data-chair="${chair.id}" style="left:${chair.x}%;top:${chair.y}%"></div>`)
          .join("")}
        <div class="you" id="you">${doctorSvg()}<span class="held" id="held"></span></div>
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

  const shelfHot = D.closestSpot(game.player.x, game.player.y, D.SHELF, 14);
  document.querySelectorAll("[data-med]").forEach((node) => {
    node.classList.toggle("is-near", Boolean(shelfHot) && shelfHot.id === node.dataset.med);
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

  if (shelfHot) actBtn.textContent = "Weź";
  else if (chairHot && chairHot.guest) actBtn.textContent = "Daj";
  else actBtn.textContent = "A";
}

function goToJail() {
  game.save.jailUntil = D.lockJail(Date.now());
  persist();
  jailScreen();
}

function doAction() {
  if (game.mode !== "play") return;
  const grab = D.tryGrab(game.player.x, game.player.y, game.held);
  if (grab.ok) {
    game.held = grab.held;
    const med = D.medById(grab.held);
    showToast(med ? med.name : "Lekarstwo");
    paintRoom();
    return;
  }
  const treat = D.tryTreat(game.player.x, game.player.y, game.held, game.chairs);
  if (treat.reason === "empty") {
    showToast("Najpierw weź lekarstwo");
    return;
  }
  if (treat.reason === "wrong") {
    showToast("Złe lekarstwo");
    goToJail();
    return;
  }
  if (!treat.ok) {
    showToast("Podejdź do półki albo do pacjenta");
    return;
  }
  const chair = game.chairs.find((seat) => seat.id === treat.chairId);
  const name = chair && chair.guest ? chair.guest.name : "Pacjent";
  if (chair) chair.guest = null;
  game.held = null;
  game.save.score += 1;
  persist();
  renderScore();
  fillChairs();
  showToast(`${name} już zdrowy`);
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
  if (game.mode === "jail") {
    const left = D.jailLeft(Date.now(), game.save.jailUntil);
    const clock = document.getElementById("jail-clock");
    if (clock) clock.textContent = D.jailClock(left);
    if (left <= 0) {
      game.save.jailUntil = 0;
      persist();
      playScreen();
      showToast("Wychodzę. Tym razem dobre lekarstwo.");
    }
    return;
  }
  if (game.mode !== "play") return;
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
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

bindStick(stickBase);
game.save = loadSave();
renderScore();
if (D.inJail(Date.now(), game.save.jailUntil)) jailScreen();
else playScreen();
requestAnimationFrame(frame);
