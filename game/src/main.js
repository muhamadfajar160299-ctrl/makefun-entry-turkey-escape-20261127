// Game state machine, loop and scoring for The Great Turkey Getaway.
// One job: own the run (title -> play -> caught / escaped) and drive it.

function makeGame(canvas) {
  const game = {
    canvas: canvas,
    ctx: canvas.getContext("2d"),
    state: "title",
    input: makeInput(),
    world: makeWorld(),
    farmer: makeFarmer(),
    turkey: makeTurkey(),
    score: 0,
    cornCount: 0,
    lives: CONFIG.startLives,
    hidden: false,
    paused: false,
    best: 0,
    time: 0,
    demoFreeze: false,
    overReason: "",
  };
  try {
    const saved = window.localStorage.getItem("turkey-getaway-best");
    if (saved) game.best = parseFloat(saved) || 0;
  } catch (e) {
    game.best = 0;
  }
  return game;
}

function saveBest(game) {
  const d = Math.floor(game.world.distance);
  if (d > game.best) {
    game.best = d;
    try {
      window.localStorage.setItem("turkey-getaway-best", String(d));
    } catch (e) {
      /* storage unavailable; best score stays in memory only */
    }
  }
}

function startRun(game) {
  resetWorld(game.world);
  resetFarmer(game.farmer);
  resetTurkey(game.turkey);
  game.score = 0;
  game.cornCount = 0;
  game.lives = CONFIG.startLives;
  game.hidden = false;
  game.paused = false;
  game.state = "play";
  game.overReason = "";
}

function endRun(game, escaped) {
  game.state = escaped ? "escaped" : "caught";
  saveBest(game);
  if (escaped) SoundBank.playEscaped();
  else SoundBank.playCaught();
}

function updatePlay(game, dt) {
  const input = game.input;
  if (consumePause(input)) game.paused = !game.paused;
  if (consumeMute(input)) SoundBank.toggleMute();
  if (game.paused) return;
  if (game.demoFreeze) return;

  updateTurkey(game.turkey, input, dt);
  updateWorld(game.world, dt, game.turkey);
  game.hidden = turkeyHiddenInHay(game.world, game.turkey);
  updateFarmer(game.farmer, dt, game);

  resolveCollisions(game.world, game.turkey, {
    onCorn: function () {
      game.cornCount++;
      game.score += CONFIG.cornScore;
      SoundBank.playCorn();
    },
    onStumble: function (kind) {
      farmerGain(game.farmer, CONFIG.stumbleGain);
      farmerTaunt(game.farmer, kind === "oven" ? "Watch the oven!" : "Ouch!");
      SoundBank.playStumble();
      game.turkey.flash = 0.3;
    },
    onHardHit: function (kind) {
      if (game.turkey.invulnerable > 0) return;
      game.lives--;
      game.turkey.invulnerable = CONFIG.invulnerableSeconds;
      farmerGain(game.farmer, CONFIG.hitGain);
      SoundBank.playHit();
      if (kind === "knife") SoundBank.playKnife();
      if (game.lives <= 0) {
        endRun(game, false);
        return;
      }
    },
  });

  game.score = game.cornCount * CONFIG.cornScore + Math.floor(game.world.distance);

  if (game.farmer.proximity > 0.7 && game.farmer.shoutTimer <= 0) {
    SoundBank.playAlarm();
    farmerTaunt(game.farmer, "Come back here!");
  }
  if (farmerCaught(game.farmer)) {
    endRun(game, false);
    return;
  }
  if (game.world.distance >= CONFIG.escapeDistance) {
    game.score += CONFIG.stageBonus;
    endRun(game, true);
  }
}

function updateTitle(game) {
  const input = game.input;
  if (consumeMute(input)) SoundBank.toggleMute();
  if (consumeAny(input)) {
    SoundBank.ensure();
    startRun(game);
  }
}

function updateEnd(game) {
  const input = game.input;
  if (consumeMute(input)) SoundBank.toggleMute();
  if (consumeRestart(input) || consumeAny(input)) startRun(game);
}

function updateGame(game, dt) {
  game.time += dt;
  if (game.state === "title") updateTitle(game);
  else if (game.state === "play") updatePlay(game, dt);
  else updateEnd(game);
}

function applyShot(game, shot) {
  if (!shot) return;
  game.demoFreeze = true;
  if (shot === "title") {
    game.state = "title";
  } else if (shot === "farm") {
    startRun(game);
    game.world.distance = 120;
    game.score = 130;
    game.cornCount = 3;
    game.farmer.proximity = 0.35;
    game.world.obstacles = [
      { kind: "fence", x: 620, y: CONFIG.groundY - 72, w: 26, h: 72, passed: false, flame: false, phase: 0 },
      { kind: "pumpkin", x: 780, y: CONFIG.groundY - 44, w: 52, h: 44, passed: false, flame: false, phase: 0 },
    ];
    game.world.corns = [
      { x: 420, y: CONFIG.groundY - 170, w: 22, h: 26, taken: false, bob: 0 },
      { x: 454, y: CONFIG.groundY - 190, w: 22, h: 26, taken: false, bob: 1 },
      { x: 488, y: CONFIG.groundY - 170, w: 22, h: 26, taken: false, bob: 2 },
    ];
  } else if (shot === "kitchen") {
    startRun(game);
    game.world.distance = 1050;
    game.world.stageIndex = 2;
    game.score = 1180;
    game.cornCount = 13;
    game.lives = 2;
    game.farmer.proximity = 0.78;
    game.world.obstacles = [
      { kind: "oven", x: 600, y: CONFIG.groundY - 110, w: 96, h: 110, passed: false, flame: true, phase: 0 },
      { kind: "knife", x: 760, y: CONFIG.groundY - 110, w: 54, h: 14, passed: false, flame: false, phase: 1 },
      { kind: "pot", x: 880, y: CONFIG.groundY - 52, w: 56, h: 52, passed: false, flame: false, phase: 0 },
    ];
    game.world.corns = [
      { x: 430, y: CONFIG.groundY - 160, w: 22, h: 26, taken: false, bob: 0 },
      { x: 464, y: CONFIG.groundY - 180, w: 22, h: 26, taken: false, bob: 1 },
    ];
  } else if (shot === "caught") {
    startRun(game);
    game.world.distance = 640;
    game.score = 690;
    game.cornCount = 5;
    game.lives = 0;
    endRun(game, false);
  } else if (shot === "escaped") {
    startRun(game);
    game.world.distance = 1400;
    game.score = 1650;
    game.cornCount = 15;
    endRun(game, true);
  }
}

function startGame() {
  const canvas = document.getElementById("game");
  const game = makeGame(canvas);
  bindInput(game.input, canvas, {});
  const params = new URLSearchParams(window.location.search);
  applyShot(game, params.get("shot"));
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!game.demoFreeze) updateGame(game, dt);
    drawFrame(game.ctx, game, game.time);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.__turkeyGame = game;
}

document.addEventListener("DOMContentLoaded", startGame);
