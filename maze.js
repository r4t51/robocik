(function (root, factory) {
  const api = factory();
  root.RoboMaze = api;
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const TILE = 40;
  const COLS = 21;
  const ROWS = 15;

  const LEVELS = [
    {
      name: "Pracownia",
      rows: [
        "#####################",
        "#...................#",
        "#..S................#",
        "#...................#",
        "######.........######",
        "#...................#",
        "#.........W.........#",
        "#...................#",
        "######.........######",
        "#...................#",
        "#................E..#",
        "#...................#",
        "#..R................#",
        "#...................#",
        "#####################",
      ],
    },
    {
      name: "Korytarze",
      rows: [
        "#####################",
        "#S....#.........#E..#",
        "#.....#.........#...#",
        "#.....#...###...#...#",
        "#...........W.......#",
        "###.#####.....###.###",
        "#.....#.............#",
        "#.....#......R......#",
        "#.....#.............#",
        "###.###.....#####.###",
        "#...................#",
        "#...###.............#",
        "#...............#...#",
        "#...............#...#",
        "#####################",
      ],
    },
    {
      name: "Piwnica",
      rows: [
        "#####################",
        "#S..#.....#.....#..E#",
        "#...#.....#.....#...#",
        "#.......#...#.......#",
        "###.#####.W.#####.###",
        "#...................#",
        "#...R...........R...#",
        "#...................#",
        "###.#####...#####.###",
        "#.......#...#.......#",
        "#...#.....#.....#...#",
        "#...#....W#.....#...#",
        "#...................#",
        "#...................#",
        "#####################",
      ],
    },
  ];

  function inBounds(col, row) {
    return col >= 0 && row >= 0 && col < COLS && row < ROWS;
  }

  function parseLevel(rows) {
    if (rows.length !== ROWS) {
      throw new Error(`Level must have ${ROWS} rows`);
    }
    const grid = [];
    const robots = [];
    let start = null;
    let exit = null;

    rows.forEach((line, row) => {
      if (line.length !== COLS) {
        throw new Error(`Row ${row} must have ${COLS} columns`);
      }
      const cells = [];
      for (let col = 0; col < line.length; col += 1) {
        const ch = line[col];
        if (ch === "#") {
          cells.push(1);
        } else {
          cells.push(0);
          const x = col * TILE + TILE / 2;
          const y = row * TILE + TILE / 2;
          if (ch === "S") start = { x, y, col, row };
          if (ch === "E") exit = { x, y, col, row };
          if (ch === "R") robots.push({ x, y, kind: "red" });
          if (ch === "W") robots.push({ x, y, kind: "white" });
        }
      }
      grid.push(cells);
    });

    if (!start || !exit) {
      throw new Error("Level needs a start and an exit");
    }

    return { grid, start, exit, robots };
  }

  function isWall(grid, col, row) {
    if (!inBounds(col, row)) return true;
    return grid[row][col] === 1;
  }

  function circleRectOverlap(cx, cy, radius, rx, ry, rw, rh) {
    const nearestX = Math.max(rx, Math.min(cx, rx + rw));
    const nearestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    return dx * dx + dy * dy < radius * radius;
  }

  function circleHitsWall(grid, x, y, radius, inset = 3) {
    const minCol = Math.floor((x - radius) / TILE);
    const maxCol = Math.floor((x + radius) / TILE);
    const minRow = Math.floor((y - radius) / TILE);
    const maxRow = Math.floor((y + radius) / TILE);

    for (let row = minRow; row <= maxRow; row += 1) {
      for (let col = minCol; col <= maxCol; col += 1) {
        if (!isWall(grid, col, row)) continue;
        const rx = col * TILE + inset;
        const ry = row * TILE + inset;
        const size = TILE - inset * 2;
        if (circleRectOverlap(x, y, radius, rx, ry, size, size)) {
          return true;
        }
      }
    }
    return false;
  }

  function hasLineOfSight(grid, ax, ay, bx, by) {
    const ac = Math.floor(ax / TILE);
    const ar = Math.floor(ay / TILE);
    const bc = Math.floor(bx / TILE);
    const br = Math.floor(by / TILE);
    if (ac !== bc && ar !== br) return false;

    const minC = Math.min(ac, bc);
    const maxC = Math.max(ac, bc);
    const minR = Math.min(ar, br);
    const maxR = Math.max(ar, br);

    for (let col = minC; col <= maxC; col += 1) {
      for (let row = minR; row <= maxR; row += 1) {
        if (isWall(grid, col, row)) return false;
      }
    }
    return true;
  }

  function openDirections(grid, x, y, radius) {
    const dirs = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ];
    return dirs.filter((dir) => {
      const nx = x + dir.x * (radius + 4);
      const ny = y + dir.y * (radius + 4);
      return !circleHitsWall(grid, nx, ny, radius);
    });
  }

  function circlesOverlap(ax, ay, ar, bx, by, br) {
    const dx = ax - bx;
    const dy = ay - by;
    const range = ar + br;
    return dx * dx + dy * dy < range * range;
  }

  return {
    TILE,
    COLS,
    ROWS,
    LEVELS,
    inBounds,
    parseLevel,
    isWall,
    circleRectOverlap,
    circleHitsWall,
    hasLineOfSight,
    openDirections,
    circlesOverlap,
  };
});
