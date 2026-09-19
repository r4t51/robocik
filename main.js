const {
  COLS,
  LEVELS,
  ROWS,
  TILE,
  circleHitsWall,
  circlesOverlap,
  hasLineOfSight,
  openDirections,
  parseLevel,
} = window.RoboMaze;

if (typeof CanvasRenderingContext2D !== "undefined" && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function roundRect(x, y, w, h) {
    this.rect(x, y, w, h);
  };
}

const PLAYER_RADIUS = 11;
const ENEMY_RADIUS = 12;
const PLAYER_SPEED = 158;
const JUMP_MS = 460;
const JUMP_COOLDOWN_MS = 160;
const INVINCIBLE_MS = 1300;
const WHITE_SPEED = 46;
const RED_SPEED = 108;
const MAX_LIVES = 3;

const canvas = document.getElementById("arena");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const toastEl = document.getElementById("toast");
const livesEl = document.getElementById("lives");
const levelEl = document.getElementById("level-name");
const jumpEl = document.getElementById("jump-meter");
const stickBase = document.getElementById("stick");
const stickKnob = document.getElementById("stick-knob");
const jumpBtn = document.getElementById("jump-btn");

canvas.width = COLS * TILE;
canvas.height = ROWS * TILE;

const keys = new Set();
const pointerMove = { x: 0, y: 0, active: false };
let audioCtx = null;

const game = {
  mode: "title",
  levelIndex: 0,
  lives: MAX_LIVES,
  grid: null,
  start: null,
  exit: null,
  player: null,
  robots: [],
  particles: [],
  shake: 0,
  toastUntil: 0,
  last: 0,
};

function bootAudio() {
  if (audioCtx) return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  audioCtx = new Ctx();
}

function tone(freq, ms, type = "square", gain = 0.04) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const amp = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  amp.gain.setValueAtTime(gain, audioCtx.currentTime);
  amp.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + ms / 1000);
  osc.connect(amp);
  amp.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + ms / 1000);
}

function showToast(text, ms = 900) {
  toastEl.textContent = text;
  toastEl.hidden = false;
  game.toastUntil = performance.now() + ms;
}

function hideToastIfDue(now) {
  if (!toastEl.hidden && now > game.toastUntil) {
    toastEl.hidden = true;
  }
}

function renderLives() {
  livesEl.replaceChildren();
  for (let i = 0; i < MAX_LIVES; i += 1) {
    const pip = document.createElement("span");
    pip.className = i < game.lives ? "life is-on" : "life";
    pip.setAttribute("aria-hidden", "true");
    livesEl.append(pip);
  }
  livesEl.setAttribute("aria-label", `Życia: ${game.lives} z ${MAX_LIVES}`);
}

function renderJump(ready) {
  jumpEl.classList.toggle("is-ready", ready);
  jumpEl.textContent = ready ? "SKOK" : "…";
}

function setOverlay(html, open) {
  overlay.innerHTML = html;
  overlay.hidden = !open;
  overlay.classList.toggle("is-open", open);
}

function titleScreen() {
  game.mode = "title";
  setOverlay(
    `<div class="card">
      <svg class="toy-face" viewBox="0 0 64 40" aria-hidden="true">
        <rect x="16" y="14" width="32" height="20" rx="6" fill="#2bb8aa"/>
        <rect x="20" y="6" width="24" height="16" rx="7" fill="#3ed6c6"/>
        <circle cx="28" cy="14" r="3" fill="#14323a"/>
        <circle cx="36" cy="14" r="3" fill="#14323a"/>
        <rect x="31" y="2" width="2" height="5" fill="#14665e"/>
        <circle cx="32" cy="2" r="2.2" fill="#ffd166"/>
      </svg>
      <h2>Robocik</h2>
      <p class="lead">Jesteś robocikiem. Przejdź labirynt i nie daj się złapać.</p>
      <ul class="rules">
        <li><b>Skok</b> przenosi cię nad ścianką.</li>
        <li><b>Ścianka</b> odsyła na start.</li>
        <li><b>Czerwone oczy</b> gonią szybko.</li>
        <li><b>Białe oczy</b> chodzą wolno.</li>
        <li>Dotknięcie robocika zabiera życie. Masz <b>3 życia</b>.</li>
      </ul>
      <button type="button" class="go" data-act="start">Graj</button>
    </div>`,
    true,
  );
}

function winScreen() {
  game.mode = "win";
  setOverlay(
    `<div class="card">
      <h2>Udało się</h2>
      <p class="lead">Trzy labirynty, zero ścianek na finiszu. Robocik doładowany.</p>
      <button type="button" class="go" data-act="start">Jeszcze raz</button>
    </div>`,
    true,
  );
}

function overScreen() {
  game.mode = "over";
  setOverlay(
    `<div class="card">
      <h2>Koniec żyć</h2>
      <p class="lead">Czerwone oczy były za szybkie. Weź trzy nowe życia i spróbuj od pracowni.</p>
      <button type="button" class="go" data-act="start">Od nowa</button>
    </div>`,
    true,
  );
}

function spawnPlayer() {
  game.player = {
    x: game.start.x,
    y: game.start.y,
    facing: { x: 1, y: 0 },
    jumpT: 0,
    jumpCool: 0,
    hurtT: 0,
    blink: 0,
  };
}

function loadLevel(index) {
  const spec = LEVELS[index];
  const parsed = parseLevel(spec.rows);
  game.levelIndex = index;
  game.grid = parsed.grid;
  game.start = parsed.start;
  game.exit = parsed.exit;
  game.robots = parsed.robots.map((robot) => ({
    ...robot,
    dir: { x: 1, y: 0 },
    think: 0,
  }));
  game.particles = [];
  spawnPlayer();
  levelEl.textContent = `${index + 1} · ${spec.name}`;
  renderLives();
}

function startRun() {
  bootAudio();
  tone(220, 80);
  tone(330, 120);
  game.lives = MAX_LIVES;
  game.mode = "play";
  overlay.hidden = true;
  overlay.classList.remove("is-open");
  loadLevel(0);
  showToast("Do zielonego pola");
}

function burst(x, y, color, count = 10) {
  for (let i = 0; i < count; i += 1) {
    const a = (Math.PI * 2 * i) / count;
    game.particles.push({
      x,
      y,
      vx: Math.cos(a) * (40 + Math.random() * 60),
      vy: Math.sin(a) * (40 + Math.random() * 60),
      life: 0.35 + Math.random() * 0.25,
      color,
    });
  }
}

function resetToStart(reason) {
  const player = game.player;
  burst(player.x, player.y, "#e7c27a", 14);
  player.x = game.start.x;
  player.y = game.start.y;
  player.jumpT = 0;
  game.shake = 10;
  tone(90, 180, "sawtooth", 0.05);
  showToast(reason);
}

function loseLife() {
  game.lives -= 1;
  game.player.hurtT = INVINCIBLE_MS;
  game.shake = 16;
  burst(game.player.x, game.player.y, "#ff4d4d", 16);
  renderLives();
  tone(70, 220, "square", 0.06);
  if (game.lives <= 0) {
    overScreen();
    return;
  }
  showToast("Au! Minus życie");
}

function tryJump() {
  const player = game.player;
  if (!player || game.mode !== "play") return;
  if (player.jumpT > 0 || player.jumpCool > 0) return;
  player.jumpT = JUMP_MS;
  tone(480, 70, "triangle", 0.045);
  burst(player.x, player.y, "#7ee0d0", 6);
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

function stepPlayer(dt) {
  const player = game.player;
  const move = moveVector();
  if (move.mag > 0.15) {
    player.facing = { x: move.x, y: move.y };
  }

  const speed = PLAYER_SPEED * (player.jumpT > 0 ? 1.12 : 1);
  player.x += move.x * speed * dt;
  player.y += move.y * speed * dt;
  player.x = Math.max(PLAYER_RADIUS, Math.min(canvas.width - PLAYER_RADIUS, player.x));
  player.y = Math.max(PLAYER_RADIUS, Math.min(canvas.height - PLAYER_RADIUS, player.y));

  if (player.jumpT > 0) {
    player.jumpT -= dt * 1000;
    if (player.jumpT <= 0) {
      player.jumpT = 0;
      player.jumpCool = JUMP_COOLDOWN_MS;
      if (circleHitsWall(game.grid, player.x, player.y, PLAYER_RADIUS)) {
        resetToStart("Lądowanie na ściance");
      }
    }
  } else if (circleHitsWall(game.grid, player.x, player.y, PLAYER_RADIUS)) {
    resetToStart("Aj, ścianka!");
  }

  if (player.jumpCool > 0) player.jumpCool -= dt * 1000;
  if (player.hurtT > 0) player.hurtT -= dt * 1000;
  player.blink += dt;

  const onExit = circlesOverlap(
    player.x,
    player.y,
    PLAYER_RADIUS,
    game.exit.x,
    game.exit.y,
    TILE * 0.34,
  );
  if (onExit && player.jumpT <= 0) {
    tone(520, 90, "triangle");
    tone(720, 140, "triangle");
    if (game.levelIndex >= LEVELS.length - 1) {
      winScreen();
    } else {
      loadLevel(game.levelIndex + 1);
      showToast("Następny labirynt");
    }
  }
}

function steerRobot(robot) {
  const player = game.player;
  if (
    robot.kind === "red" &&
    player.jumpT <= 0 &&
    hasLineOfSight(game.grid, robot.x, robot.y, player.x, player.y)
  ) {
    const dx = player.x - robot.x;
    const dy = player.y - robot.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      robot.dir = { x: Math.sign(dx) || 1, y: 0 };
    } else {
      robot.dir = { x: 0, y: Math.sign(dy) || 1 };
    }
    return;
  }

  const options = openDirections(game.grid, robot.x, robot.y, ENEMY_RADIUS);
  if (!options.length) return;
  const keep = options.find((dir) => dir.x === robot.dir.x && dir.y === robot.dir.y);
  robot.dir = keep && Math.random() > 0.18 ? keep : options[Math.floor(Math.random() * options.length)];
}

function stepRobots(dt) {
  const player = game.player;
  const airborne = player.jumpT > 0;
  game.robots.forEach((robot) => {
    robot.think -= dt;
    if (robot.think <= 0) {
      steerRobot(robot);
      robot.think = robot.kind === "red" ? 0.28 : 0.55;
    }

    const speed = robot.kind === "red" ? RED_SPEED : WHITE_SPEED;
    const nx = robot.x + robot.dir.x * speed * dt;
    const ny = robot.y + robot.dir.y * speed * dt;
    if (circleHitsWall(game.grid, nx, ny, ENEMY_RADIUS)) {
      robot.think = 0;
    } else {
      robot.x = nx;
      robot.y = ny;
    }

    if (
      !airborne &&
      player.hurtT <= 0 &&
      circlesOverlap(player.x, player.y, PLAYER_RADIUS, robot.x, robot.y, ENEMY_RADIUS)
    ) {
      loseLife();
    }
  });
}

function stepParticles(dt) {
  game.particles = game.particles.filter((p) => {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    return p.life > 0;
  });
  if (game.shake > 0) game.shake -= 40 * dt;
}

function hopHeight(player) {
  if (player.jumpT <= 0) return 0;
  const t = 1 - player.jumpT / JUMP_MS;
  return Math.sin(Math.PI * t);
}

function drawFloor() {
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const x = col * TILE;
      const y = row * TILE;
      const even = (col + row) % 2 === 0;
      ctx.fillStyle = even ? "#1b4332" : "#16382a";
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeStyle = "rgba(88, 129, 87, 0.18)";
      ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
    }
  }
}

function drawExit() {
  const { x, y } = game.exit;
  const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 220);
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = `rgba(95, 211, 141, ${0.22 + pulse * 0.2})`;
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#7bed9f";
  ctx.beginPath();
  ctx.moveTo(-7, 4);
  ctx.lineTo(0, -8);
  ctx.lineTo(7, 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawWalls() {
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      if (game.grid[row][col] !== 1) continue;
      const x = col * TILE;
      const y = row * TILE;
      ctx.fillStyle = "#8a6a3b";
      ctx.fillRect(x, y + 6, TILE, TILE - 6);
      ctx.fillStyle = "#e6c48a";
      ctx.fillRect(x, y, TILE, 14);
      ctx.fillStyle = "#c9a56a";
      ctx.fillRect(x, y, 5, TILE);
      ctx.strokeStyle = "rgba(72, 48, 24, 0.35)";
      ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
    }
  }
}

function drawRobot(bot, opts) {
  const hop = opts.hop || 0;
  const blink = opts.hurt ? Math.sin(performance.now() / 40) > 0 : false;
  if (blink) return;

  ctx.save();
  ctx.translate(bot.x, bot.y - hop * 16);
  ctx.scale(1 + hop * 0.08, 1 - hop * 0.12);

  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(0, 16 + hop * 10, 11 - hop * 3, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = opts.body;
  ctx.beginPath();
  ctx.roundRect(-11, -6, 22, 18, 5);
  ctx.fill();

  ctx.fillStyle = opts.head;
  ctx.beginPath();
  ctx.roundRect(-9, -18, 18, 14, 6);
  ctx.fill();

  ctx.strokeStyle = opts.metal;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(0, -24);
  ctx.stroke();
  ctx.fillStyle = opts.tip;
  ctx.beginPath();
  ctx.arc(0, -25, 2.4, 0, Math.PI * 2);
  ctx.fill();

  const eye = opts.eye;
  const glow = opts.glow;
  if (glow) {
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(-4, -12, 4.2, 0, Math.PI * 2);
    ctx.arc(4, -12, 4.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = eye;
  ctx.beginPath();
  ctx.arc(-4, -12, 2.5, 0, Math.PI * 2);
  ctx.arc(4, -12, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = opts.tread;
  ctx.fillRect(-10, 10, 8, 4);
  ctx.fillRect(2, 10, 8, 4);
  ctx.restore();
}

function drawActors() {
  const player = game.player;
  const hop = hopHeight(player);

  game.robots.forEach((robot) => {
    if (robot.kind === "red") {
      drawRobot(robot, {
        body: "#4c3648",
        head: "#6a4458",
        metal: "#2a1c24",
        tip: "#ff4d4d",
        eye: "#ff2a2a",
        glow: "rgba(255, 60, 60, 0.45)",
        tread: "#24141c",
      });
    } else {
      drawRobot(robot, {
        body: "#8d93a1",
        head: "#c8ccd4",
        metal: "#5d6370",
        tip: "#f6f1e8",
        eye: "#f7f4ee",
        glow: "rgba(255,255,255,0.28)",
        tread: "#5a6170",
      });
    }
  });

  drawRobot(player, {
    hop,
    hurt: player.hurtT > 0,
    body: "#2bb8aa",
    head: "#3ed6c6",
    metal: "#14665e",
    tip: "#ffd166",
    eye: "#14323a",
    glow: "rgba(255, 209, 102, 0.35)",
    tread: "#0f4c46",
  });
}

function drawParticles() {
  game.particles.forEach((p) => {
    ctx.globalAlpha = Math.max(0, p.life * 2);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    ctx.globalAlpha = 1;
  });
}

function draw() {
  ctx.save();
  if (game.shake > 0) {
    ctx.translate((Math.random() - 0.5) * game.shake, (Math.random() - 0.5) * game.shake);
  }
  ctx.fillStyle = "#10231c";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (game.grid) {
    drawFloor();
    drawExit();
    drawWalls();
    drawActors();
    drawParticles();
  }
  ctx.restore();
}

function frame(now) {
  const dt = Math.min(0.033, (now - game.last) / 1000 || 0.016);
  game.last = now;
  if (game.mode === "play") {
    stepPlayer(dt);
    if (game.mode === "play") {
      stepRobots(dt);
      stepParticles(dt);
    }
    renderJump(game.player.jumpT <= 0 && game.player.jumpCool <= 0);
  }
  hideToastIfDue(now);
  draw();
  requestAnimationFrame(frame);
}

function bindStick(el) {
  const update = (event) => {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const x = event.clientX - cx;
    const y = event.clientY - cy;
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
    if (!pointerMove.active && !el.hasPointerCapture(event.pointerId)) return;
    if (el.hasPointerCapture(event.pointerId)) update(event);
  });
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
    event.preventDefault();
  }
  keys.add(key);
  if (key === " " || key === "j") tryJump();
  if ((key === "enter" || key === " ") && game.mode !== "play") {
    startRun();
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

jumpBtn.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  bootAudio();
  tryJump();
});

overlay.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-act=start]");
  if (btn) startRun();
});

bindStick(stickBase);
titleScreen();
renderLives();
renderJump(true);
requestAnimationFrame(frame);
