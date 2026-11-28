// The Great Turkey Escape — the game itself.
// State machine, main loop, collisions, scoring, difficulty and the
// screenshot staging hook. Everything the other files draw or move is
// owned and driven from here.

import { CFG } from './constants.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { createTurkey } from './turkey.js';
import { createFarmer } from './farmer.js';
import { createWorld } from './world.js';
import { drawGame } from './render.js';

export function createGame(canvas) {
  const ctx = canvas.getContext('2d');
  const audio = createAudio();
  const input = createInput(canvas);
  const turkey = createTurkey();
  const farmer = createFarmer();
  const world = createWorld();

  const g = {
    mode: 'title', // title | playing | paused | caught | escaped
    now: 0,
    distance: 0,
    score: 0,
    corn: 0,
    lives: CFG.lives,
    best: 0,
    speed: CFG.baseSpeed,
    stage: 'farmyard',
    banners: [],
    shake: 0,
    startedAt: 0,
    turkey,
    farmer,
    world,
    input,
    audio,
  };

  try {
    g.best = Number(window.localStorage.getItem('turkeyEscapeBest') || 0) || 0;
  } catch (err) {
    g.best = 0;
  }

  g.stageName = function () {
    if (g.stage === 'kitchen') return 'THE KITCHEN';
    if (g.stage === 'forest') return 'THE FOREST';
    return 'THE FARMYARD';
  };

  g.saveBest = function () {
    const d = Math.floor(g.distance);
    if (d > g.best) {
      g.best = d;
      try {
        window.localStorage.setItem('turkeyEscapeBest', String(d));
      } catch (err) {
        // Best score is a nicety; losing it must not break the game.
      }
    }
  };

  g.banner = function (text, big, color, life) {
    g.banners.push({ text, big: !!big, color: color || '#fff', life: life || 2.2 });
  };

  g.resetRun = function () {
    g.distance = 0;
    g.score = 0;
    g.corn = 0;
    g.lives = CFG.lives;
    g.speed = CFG.baseSpeed;
    g.stage = 'farmyard';
    g.banners = [];
    g.shake = 0;
    turkey.reset();
    farmer.reset();
    world.reset();
  };

  g.startRun = function () {
    audio.ensure();
    audio.gobble();
    g.resetRun();
    g.mode = 'playing';
    g.startedAt = g.now;
    g.banner('RUN!', true, '#ffe9b0', 1.4);
  };

  g.endRun = function (escaped) {
    g.saveBest();
    g.mode = escaped ? 'escaped' : 'caught';
    if (escaped) {
      g.score += CFG.escapeBonus;
      audio.escaped();
    } else {
      audio.caught();
    }
  };

  g.togglePause = function () {
    if (g.mode === 'playing') {
      g.mode = 'paused';
      audio.click();
    } else if (g.mode === 'paused') {
      g.mode = 'playing';
      audio.click();
    }
  };

  // ---- hits -----------------------------------------------------------

  g.hit = function (kind) {
    if (turkey.invuln > 0 || turkey.hidden) return;
    g.lives -= 1;
    turkey.invuln = CFG.invulnTime;
    farmer.x += CFG.gapHitSurge;
    g.shake = 0.35;
    audio.stumble();
    world.burst(turkey.x, turkey.y - 50, '#e8c39a', 14, 200);
    if (g.lives <= 0) {
      g.endRun(false);
    }
  };

  g.stumble = function () {
    if (turkey.invuln > 0) return;
    g.lives -= 1;
    turkey.invuln = CFG.invulnTime;
    farmer.x += CFG.gapStumble;
    g.shake = 0.3;
    audio.stumble();
    world.burst(turkey.x, turkey.y - 40, '#c9a06a', 10, 160);
    if (g.lives <= 0) {
      g.endRun(false);
    }
  };

  // ---- update -----------------------------------------------------------

  function speedFor(distance) {
    const t = Math.min(1, distance / CFG.kitchenEnd);
    return CFG.baseSpeed + (CFG.maxSpeed - CFG.baseSpeed) * t;
  }

  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  g.update = function (dt) {
    for (const b of g.banners) b.life -= dt;
    g.banners = g.banners.filter((b) => b.life > 0);
    if (g.shake > 0) g.shake -= dt;

    if (g.mode === 'title') {
      turkey.runPhase += dt * 8;
      return;
    }
    if (g.mode !== 'playing') return;

    g.speed = speedFor(g.distance);
    // While the turkey hides in a haystack it is not running, so the
    // world stands still: the haystack stays under the turkey and the
    // farmer walks past it on foot. Hiding costs distance, not safety.
    const scrollSpeed = turkey.hidden ? 0 : g.speed;
    g.distance += (scrollSpeed * dt) / CFG.pxPerMeter;
    g.score += (scrollSpeed * dt) / CFG.pxPerMeter;

    const prevStage = g.stage;
    g.stage = world.stageFor(g.distance);
    if (g.stage !== prevStage) {
      if (g.stage === 'kitchen') {
        // The farmer has to squeeze through the kitchen door, so the
        // turkey gains 110 px of breathing room on entering.
        farmer.x = turkey.x - Math.min(farmer.gap(turkey.x) + 110, CFG.gapMax);
        g.banner('THE KITCHEN — 700 m', true, '#ffb347', 2.6);
        g.banner("He's hungrier now. Watch the knives!", false, '#fff', 2.6);
        audio.stageUp();
      } else if (g.stage === 'forest') {
        g.endRun(true);
        return;
      }
    }

    const fx = {
      onJump() {
        audio.jump();
        world.dust(turkey.x, turkey.y, 5);
      },
      onLand() {
        audio.land();
        world.dust(turkey.x, turkey.y, 4);
      },
    };
    turkey.update(dt, input, fx);
    farmer.update(dt, g);
    world.update(dt, scrollSpeed, g.distance, g);

    // Hiding: ducking while overlapping a haystack tucks the turkey in.
    if (!turkey.hidden && turkey.ducking && turkey.grounded) {
      const tb = turkey.bounds();
      for (const s of world.stacks) {
        if (s.used) continue;
        const sb = { x: s.x, y: s.y, w: s.w, h: s.h };
        if (tb && overlap(tb, sb) && farmer.gap(turkey.x) < 190) {
          s.used = true;
          turkey.hideIn(s);
          audio.hide();
          g.banner('HIDDEN!', true, '#8dff6a', 1.6);
          break;
        }
      }
    }

    // Emerging: the farmer walked back far enough to give up, or the
    // player jumped out early (risky: the farmer is still close).
    if (turkey.hidden) {
      const gaveUp = farmer.gap(turkey.x) > 250;
      const jumpedOut = input.takeJump();
      if (gaveUp || jumpedOut) {
        turkey.emerge();
        if (gaveUp) {
          g.score += CFG.hidePoints;
          g.banner(`LOST HIM! +${CFG.hidePoints}`, true, '#8dff6a', 1.8);
          audio.lostHim();
        } else {
          audio.spotted();
        }
      }
    }

    // Corn.
    const tb = turkey.bounds();
    if (tb) {
      for (const c of world.corns) {
        if (c.taken) continue;
        const dx = c.x - (tb.x + tb.w / 2);
        const dy = c.y - (tb.y + tb.h / 2);
        if (dx * dx + dy * dy < 34 * 34) {
          c.taken = true;
          g.corn += 1;
          g.score += CFG.cornPoints;
          audio.corn();
          world.burst(c.x, c.y, '#f2c14e', 6, 90);
        }
      }
    }

    // Obstacles: jump them or stumble.
    if (tb) {
      for (const o of world.obstacles) {
        if (o.passed) continue;
        const ob = { x: o.x, y: o.y, w: o.w, h: o.h };
        if (overlap(tb, ob)) {
          o.passed = true;
          g.stumble();
        } else if (o.x + o.w < tb.x) {
          o.passed = true;
        }
      }
    }

    // The big knife: duck (or jump) or it hits.
    if (tb) {
      for (const k of world.knives) {
        if (k.state !== 'fly') continue;
        const dx = k.x - (tb.x + tb.w / 2);
        const dy = k.y - (tb.y + tb.h / 2);
        if (dx * dx + dy * dy < 46 * 46) {
          k.state = 'gone';
          g.hit('knife');
        }
      }
    }

    // Oven heat waves: jump them.
    if (tb) {
      for (const v of world.waves) {
        const vb = { x: v.x, y: v.y, w: v.w, h: v.h };
        if (overlap(tb, vb)) {
          g.hit('wave');
        }
      }
    }

    // Caught by the farmer — never while hidden: he cannot catch what
    // he cannot see.
    if (!turkey.hidden && farmer.gap(turkey.x) <= CFG.gapCatch) {
      g.endRun(false);
    }
  };

  // ---- input routing ----------------------------------------------------

  g.handleInput = function () {
    if (input.take('mute')) {
      const m = audio.toggleMute();
      g.banner(m ? 'Muted' : 'Sound on', false, '#fff', 1);
    }
    if (g.mode === 'title') {
      if (input.takeAny()) g.startRun();
      return;
    }
    if (g.mode === 'paused') {
      if (input.take('pause') || input.take('click')) g.togglePause();
      input.endFrame();
      return;
    }
    if (g.mode === 'caught' || g.mode === 'escaped') {
      if (input.take('restart') || input.take('click') || input.take('jump')) {
        g.startRun();
      }
      input.endFrame();
      return;
    }
    if (g.mode === 'playing') {
      if (input.take('pause')) g.togglePause();
    }
  };

  // ---- loop ---------------------------------------------------------------

  let last = 0;
  function frame(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016);
    last = ts;
    g.now = ts / 1000;
    g.handleInput();
    g.update(dt);
    input.endFrame();
    ctx.save();
    if (g.shake > 0) {
      ctx.translate((Math.random() - 0.5) * g.shake * 22, (Math.random() - 0.5) * g.shake * 22);
    }
    drawGame(ctx, g);
    ctx.restore();
    requestAnimationFrame(frame);
  }

  // ---- screenshot staging -------------------------------------------------
  // ?shot= picks starting conditions for a real render of the running
  // game (title, farm, kitchen, escaped). The loop, the physics and the
  // drawing are the real game; only the opening state is staged.
  g.applyShot = function (name) {
    if (name === 'farm') {
      g.resetRun();
      g.distance = 350;
      g.score = 420;
      g.corn = 6;
      g.mode = 'playing';
      g.stage = 'farmyard';
      // The turkey, ducked inside a haystack; the farmer searches past.
      const stack = { x: turkey.x - 40, w: 180, h: 96, y: CFG.groundY - 96, used: true };
      world.stacks.push(stack);
      turkey.hideIn(stack);
      turkey.runPhase = 2;
      // The farmer searches right beside the haystack, "?" overhead.
      farmer.x = stack.x - 30;
      farmer.state = 'search';
      farmer.searchT = 2.5;
      world.corns.push(
        { x: 620, y: CFG.groundY - 150, r: 13, taken: false, bob: 1 },
        { x: 666, y: CFG.groundY - 190, r: 13, taken: false, bob: 2 },
        { x: 712, y: CFG.groundY - 150, r: 13, taken: false, bob: 3 }
      );
      world.obstacles.push(
        { kind: 'fence', x: 880, w: 56, h: 72, y: CFG.groundY - 72, passed: false, roll: 0 },
        { kind: 'bale', x: 1080, w: 84, h: 62, y: CFG.groundY - 62, passed: false, roll: 0 }
      );
      g.banner('HIDDEN!', true, '#8dff6a', 30);
    } else if (name === 'kitchen') {
      g.resetRun();
      g.distance = 1050;
      g.score = 1180;
      g.corn = 11;
      g.lives = 2;
      g.mode = 'playing';
      g.stage = 'kitchen';
      // The oven, big and glowing, mid-screen; a large knife arcing in.
      // Positions are staged so that ~1.2 s after load (when the
      // screenshot is taken) the oven is centre-screen and the knife is
      // right at the turkey, a near miss.
      world.ovens.push({
        x: 1150, w: 200, h: 238, y: CFG.groundY - 238, waveT: 1.6, glow: 1,
      });
      world.knives.push({
        state: 'fly', t: 0,
        x: 640, y: 300, vx: -300, vy: -350,
        angle: 0.5, r: 26, targetY: CFG.groundY - 78,
      });
      world.obstacles.push(
        { kind: 'pin', x: 1060, w: 96, h: 42, y: CFG.groundY - 42, passed: false, roll: 0.6 }
      );
      world.corns.push(
        { x: 980, y: CFG.groundY - 150, r: 13, taken: false, bob: 1 },
        { x: 1026, y: CFG.groundY - 190, r: 13, taken: false, bob: 2 }
      );
      farmer.x = turkey.x - 68;
      farmer.state = 'lunge';
      turkey.runPhase = 3;
    } else if (name === 'escaped') {
      g.resetRun();
      g.distance = 1200;
      g.score = 1420;
      g.corn = 17;
      g.best = 1200;
      g.mode = 'escaped';
    } else if (name === 'caught') {
      g.resetRun();
      g.distance = 820;
      g.score = 940;
      g.corn = 9;
      g.mode = 'caught';
    }
    // 'title' and anything else: leave the title screen as it is.
  };

  g.start = function () {
    const params = new URLSearchParams(window.location.search);
    const shot = params.get('shot');
    if (shot) g.applyShot(shot);
    requestAnimationFrame((ts) => {
      last = ts;
      requestAnimationFrame(frame);
    });
  };

  // A small handle for play-testing: state, never cheats.
  window.__turkeyGame = g;

  return g;
}
