// The running world: obstacles, corn, haystacks and stage hazards.
// One job: build the course the turkey runs through and move it.

const OBSTACLE_DEFS = {
  fence:    { w: 26, h: 72,  jumpable: true,  duckable: false, score: 0 },
  pumpkin:  { w: 52, h: 44,  jumpable: true,  duckable: false, score: 0 },
  haybale:  { w: 64, h: 62,  jumpable: true,  duckable: false, score: 0 },
  pin:      { w: 58, h: 26,  jumpable: true,  duckable: false, score: 0 },
  knife:    { w: 54, h: 14,  jumpable: false, duckable: true,  score: 0, flies: true },
  oven:     { w: 96, h: 110, jumpable: true,  duckable: false, score: 0, hot: true },
  pot:      { w: 56, h: 52,  jumpable: true,  duckable: false, score: 0 },
};

function makeWorld() {
  const world = {
    distance: 0,
    speed: CONFIG.baseSpeed,
    spawnTimer: 0.8,
    obstacles: [],
    corns: [],
    haystacks: [],
    clouds: [
      { x: 120, y: 60, s: 1 },
      { x: 380, y: 110, s: 0.8 },
      { x: 620, y: 50, s: 1.1 },
      { x: 840, y: 130, s: 0.7 },
    ],
    stageIndex: 0,
    stageFlash: 0,
    flameTimer: 0,
    seed: 1234567,
  };
  return world;
}

function nextRandom(world) {
  world.seed = (world.seed * 1103515245 + 12345) & 0x7fffffff;
  return world.seed / 0x7fffffff;
}

function obstacleKindsFor(stageKey) {
  if (stageKey === "farmyard") return ["fence", "pumpkin", "fence", "pumpkin"];
  if (stageKey === "barn") return ["haybale", "pin", "fence", "pumpkin", "pin"];
  return ["oven", "knife", "pot", "knife", "oven", "pin"];
}

function spawnObstacle(world, stage) {
  const kinds = obstacleKindsFor(stage.key);
  const kind = kinds[Math.floor(nextRandom(world) * kinds.length)];
  const def = OBSTACLE_DEFS[kind];
  const obstacle = {
    kind: kind,
    x: CONFIG.canvasWidth + 40,
    y: CONFIG.groundY - def.h,
    w: def.w,
    h: def.h,
    passed: false,
    flame: false,
    phase: nextRandom(world) * 6.28,
  };
  if (kind === "knife") {
    obstacle.y = CONFIG.groundY - 96 - nextRandom(world) * 40;
    obstacle.vx = -140;
  }
  if (kind === "oven") obstacle.flame = false;
  world.obstacles.push(obstacle);
  if (stage.key === "barn" && nextRandom(world) < 0.4) {
    world.haystacks.push({
      x: CONFIG.canvasWidth + 220,
      y: CONFIG.groundY - 92,
      w: 84,
      h: 92,
    });
  }
}

function spawnCorn(world, x) {
  const baseY = CONFIG.groundY - 150;
  const n = 3 + Math.floor(nextRandom(world) * 3);
  for (let i = 0; i < n; i++) {
    world.corns.push({
      x: x + i * 34,
      y: baseY - Math.sin((i / Math.max(1, n - 1)) * Math.PI) * 46,
      w: 22,
      h: 26,
      taken: false,
      bob: nextRandom(world) * 6.28,
    });
  }
}

function updateWorld(world, dt, turkey) {
  world.distance += (world.speed * dt) / 12;
  world.speed = speedFor(world.distance);
  const stage = stageFor(world.distance);
  const index = stageIndexFor(world.distance);
  if (index !== world.stageIndex) {
    world.stageIndex = index;
    world.stageFlash = 2.2;
  }
  if (world.stageFlash > 0) world.stageFlash -= dt;
  world.flameTimer += dt;

  world.spawnTimer -= dt;
  if (world.spawnTimer <= 0) {
    spawnObstacle(world, stage);
    if (nextRandom(world) < 0.55) spawnCorn(world, CONFIG.canvasWidth + 130);
    world.spawnTimer = spawnGapFor(world.distance) * (0.85 + nextRandom(world) * 0.5);
  }

  const move = world.speed * dt;
  for (const o of world.obstacles) {
    o.x -= move;
    if (o.kind === "knife") o.x += o.vx * dt;
    if (o.kind === "oven") o.flame = Math.sin(world.flameTimer * 2.4 + o.phase) > 0.35;
  }
  for (const c of world.corns) c.x -= move;
  for (const h of world.haystacks) h.x -= move;

  world.obstacles = world.obstacles.filter(function (o) { return o.x + o.w > -80; });
  world.corns = world.corns.filter(function (c) { return c.x + c.w > -40 && !c.taken; });
  world.haystacks = world.haystacks.filter(function (h) { return h.x + h.w > -80; });

  for (const c of world.clouds) {
    c.x -= world.speed * 0.12 * dt;
    if (c.x < -140) {
      c.x = CONFIG.canvasWidth + 60;
      c.y = 30 + nextRandom(world) * 130;
    }
  }
  if (world.clouds.length < 5) {
    for (let i = world.clouds.length; i < 5; i++) {
      world.clouds.push({
        x: nextRandom(world) * CONFIG.canvasWidth,
        y: 30 + nextRandom(world) * 130,
        s: 0.7 + nextRandom(world) * 0.8,
      });
    }
  }
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function turkeyHitbox(turkey) {
  if (turkey.ducking) return { x: turkey.x + 4, y: turkey.y + 22, w: turkey.w - 8, h: turkey.h - 22 };
  return { x: turkey.x + 6, y: turkey.y + 4, w: turkey.w - 12, h: turkey.h - 4 };
}

function resolveCollisions(world, turkey, game) {
  const box = turkeyHitbox(turkey);
  for (const o of world.obstacles) {
    if (o.passed) continue;
    const ob = { x: o.x + 4, y: o.y + 4, w: o.w - 8, h: o.h - 8 };
    if (o.kind === "knife") {
      ob.y = o.y;
      ob.h = o.h;
    }
    if (rectsOverlap(box, ob)) {
      if (o.kind === "knife" || (o.kind === "oven" && o.flame)) {
        o.passed = true;
        game.onHardHit(o.kind);
      } else if (o.kind === "oven") {
        o.passed = true;
        game.onStumble(o.kind);
      } else {
        o.passed = true;
        game.onStumble(o.kind);
      }
    } else if (o.x + o.w < turkey.x && !o.passed) {
      o.passed = true;
    }
  }
  for (const c of world.corns) {
    if (!c.taken && rectsOverlap(box, { x: c.x, y: c.y, w: c.w, h: c.h })) {
      c.taken = true;
      game.onCorn();
    }
  }
}

function turkeyHiddenInHay(world, turkey) {
  if (!turkey.ducking) return false;
  const box = turkeyHitbox(turkey);
  for (const h of world.haystacks) {
    if (rectsOverlap(box, h)) return true;
  }
  return false;
}

function resetWorld(world) {
  world.distance = 0;
  world.speed = CONFIG.baseSpeed;
  world.spawnTimer = 0.9;
  world.obstacles = [];
  world.corns = [];
  world.haystacks = [];
  world.stageIndex = 0;
  world.stageFlash = 0;
  world.flameTimer = 0;
  world.seed = 1234567;
}
