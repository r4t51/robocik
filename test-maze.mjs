import { createRequire } from "module";

const require = createRequire(import.meta.url);
const {
  LEVELS,
  TILE,
  parseLevel,
  circleHitsWall,
  hasLineOfSight,
  circlesOverlap,
  openDirections,
} = require("./maze.js");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(LEVELS.length === 10, "there are 10 labyrinths");

LEVELS.forEach((level, index) => {
  const parsed = parseLevel(level.rows);
  assert(parsed.start, `level ${index} has start`);
  assert(parsed.exit, `level ${index} has exit`);
  assert(!circleHitsWall(parsed.grid, parsed.start.x, parsed.start.y, 11), `start is open on ${level.name}`);
  assert(!circleHitsWall(parsed.grid, parsed.exit.x, parsed.exit.y, 11), `exit is open on ${level.name}`);
  parsed.robots.forEach((robot, robotIndex) => {
    assert(
      !circleHitsWall(parsed.grid, robot.x, robot.y, 12),
      `robot ${robotIndex} on ${level.name} is not in a wall`,
    );
  });
});

const first = parseLevel(LEVELS[0].rows);
assert(first.robots.some((robot) => robot.kind === "white"), "level 1 has a white robot");
assert(first.robots.some((robot) => robot.kind === "red"), "level 1 has a red robot");
assert(circleHitsWall(first.grid, 3 * TILE, 0.5 * TILE, 11), "top border wall hits");
assert(!circleHitsWall(first.grid, first.start.x, first.start.y, 11), "player spawn is safe");
assert(hasLineOfSight(first.grid, first.start.x, first.start.y, first.start.x + TILE, first.start.y), "open row has LOS");
assert(!hasLineOfSight(first.grid, 3 * TILE + 20, 4 * TILE + 20, 3 * TILE + 20, 8 * TILE + 20), "wall blocks LOS");
assert(circlesOverlap(0, 0, 10, 8, 0, 10), "close circles overlap");
assert(!circlesOverlap(0, 0, 10, 40, 0, 10), "far circles do not overlap");
assert(openDirections(first.grid, first.start.x, first.start.y, 11).length >= 2, "start has room to walk");

const walkSpeed = 158;
const jumpMs = 460;
const jumpDistance = walkSpeed * (jumpMs / 1000);
assert(jumpDistance > TILE, "a running jump clears one wall tile");

const second = parseLevel(LEVELS[1].rows);
assert(second.robots.some((robot) => robot.kind === "red"), "level 2 has a red robot");
assert(second.robots.some((robot) => robot.kind === "white"), "level 2 has a white robot");

const third = parseLevel(LEVELS[2].rows);
assert(third.robots.filter((robot) => robot.kind === "red").length === 2, "level 3 has two red robots");
assert(third.robots.filter((robot) => robot.kind === "white").length === 2, "level 3 has two white robots");

const last = parseLevel(LEVELS[9].rows);
assert(last.robots.filter((robot) => robot.kind === "red").length >= 3, "level 10 has several red robots");
assert(LEVELS[9].name === "Rdzeń", "last labyrinth is the core");

console.log("maze tests passed");
