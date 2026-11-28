// The Great Turkey Escape — the world: stages, scenery, obstacles,
// corn, haystacks, the oven and the carving knife.
// The world scrolls left past the turkey; everything the turkey meets
// is spawned here, and the farm and the kitchen are drawn here too.

import { CFG, COLORS } from './constants.js';

// A small seeded random so one run's spawns feel the same every time.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Deterministic scenery: a hash of the segment index, stable per run.
function segHash(seg, salt) {
  const n = Math.sin(seg * 127.1 + salt * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

export function createWorld() {
  const w = {
    stage: 'farmyard',
    obstacles: [],
    corns: [],
    stacks: [],
    knives: [],
    ovens: [],
    waves: [],
    parts: [],
    obstacleT: 1.2,
    cornT: 1.6,
    hayT: 5,
    knifeT: 2.5,
    ovenT: 6,
    // Hazard turn-taking: after a knife or a heat wave, no obstacle
    // spawns for a beat, so the player faces one threat at a time.
    quietT: 0,
    rng: mulberry32(20261128),
  };

  w.reset = function () {
    w.stage = 'farmyard';
    w.obstacles = [];
    w.corns = [];
    w.stacks = [];
    w.knives = [];
    w.ovens = [];
    w.waves = [];
    w.parts = [];
    w.obstacleT = 1.2;
    w.cornT = 1.6;
    w.hayT = 5;
    w.knifeT = 2.5;
    w.ovenT = 6;
    w.quietT = 0;
    w.rng = mulberry32(20261128);
  };

  w.rand = function (a, b) {
    return a + w.rng() * (b - a);
  };

  w.stageFor = function (distance) {
    if (distance >= CFG.kitchenEnd) return 'forest';
    if (distance >= CFG.farmEnd) return 'kitchen';
    return 'farmyard';
  };

  // ---- spawning ------------------------------------------------------

  w.spawnObstacle = function (difficulty) {
    const farmKinds = ['fence', 'bale', 'pumpkin'];
    const kitchenKinds = ['pin', 'pot', 'pin', 'pot', 'fence'];
    const kinds = w.stage === 'kitchen' ? kitchenKinds : farmKinds;
    const kind = kinds[Math.floor(w.rng() * kinds.length)];
    const sizes = {
      fence: { w: 56, h: 72 },
      bale: { w: 84, h: 62 },
      pumpkin: { w: 66, h: 56 },
      pin: { w: 96, h: 42 },
      pot: { w: 72, h: 62 },
    };
    const s = sizes[kind];
    w.obstacles.push({
      kind,
      x: CFG.width + 60,
      w: s.w,
      h: s.h,
      y: CFG.groundY - s.h,
      passed: false,
      roll: 0,
    });
    void difficulty;
  };

  w.spawnCorn = function () {
    const high = w.rng() > 0.45;
    const baseY = high ? CFG.groundY - 150 : CFG.groundY - 70;
    const x0 = CFG.width + 60;
    for (let i = 0; i < 3; i++) {
      w.corns.push({
        x: x0 + i * 46,
        y: baseY - Math.sin((i / 2) * Math.PI) * 46,
        r: 13,
        taken: false,
        bob: w.rng() * 6,
      });
    }
  };

  w.spawnHay = function () {
    w.stacks.push({
      x: CFG.width + 80,
      w: 180,
      h: 96,
      y: CFG.groundY - 96,
      used: false,
    });
  };

  w.spawnKnife = function () {
    // A knife claims the next beat: no obstacle spawns while it flies.
    w.quietT = 1.4;
    w.knives.push({
      state: 'tele',
      t: 0.7,
      // On screen at the right edge, glinting, so the player sees the
      // telegraph before the throw.
      x: CFG.width - 60,
      y: 150,
      vx: 0,
      vy: 0,
      angle: -0.5,
      r: 26,
      targetY: CFG.groundY - 80,
    });
  };

  w.spawnOven = function () {
    w.ovens.push({
      x: CFG.width + 80,
      w: 200,
      h: 238,
      y: CFG.groundY - 238,
      waveT: 1.1,
      glow: 0,
    });
  };

  w.burst = function (x, y, color, n, speed) {
    for (let i = 0; i < n; i++) {
      const a = w.rng() * Math.PI * 2;
      const v = (speed || 160) * (0.4 + w.rng() * 0.8);
      w.parts.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 80,
        life: 0.5 + w.rng() * 0.4,
        maxLife: 0.9,
        color,
        size: 3 + w.rng() * 5,
        grav: 500,
      });
    }
  };

  w.dust = function (x, y, n) {
    for (let i = 0; i < n; i++) {
      w.parts.push({
        x: x + w.rand(-8, 8),
        y: y - w.rand(0, 4),
        vx: -60 - w.rand(0, 60),
        vy: -w.rand(10, 50),
        life: 0.4,
        maxLife: 0.4,
        color: '#c9a06a',
        size: 3 + w.rng() * 3,
        grav: -40,
      });
    }
  };

  // ---- update ---------------------------------------------------------

  w.update = function (dt, speed, distance, game) {
    const difficulty = Math.min(1, distance / CFG.kitchenEnd);
    w.stage = w.stageFor(distance);
    const move = speed * dt;

    for (const o of w.obstacles) {
      o.x -= move;
      if (o.kind === 'pin') o.roll += dt * 9;
    }
    for (const c of w.corns) c.x -= move;
    for (const s of w.stacks) s.x -= move;
    for (const v of w.waves) v.x -= 430 * dt;
    for (const o of w.ovens) {
      o.x -= move;
      o.glow = Math.max(0, o.glow - dt);
      o.waveT -= dt;
      if (o.waveT <= 0 && o.x > 80 && o.x < CFG.width - 100) {
        if (w.obstacles.some((ob) => ob.x > 180 && ob.x < 780)) {
          // An obstacle is already in play; the wave waits its turn.
          o.waveT = 0.5;
        } else {
          o.waveT = 3.2;
          o.glow = 1;
          game.audio.heatWave();
          w.quietT = 1.4;
          w.waves.push({
            x: o.x - 60,
            w: 72,
            h: 58,
            y: CFG.groundY - 58,
          });
        }
      }
      // Chimney smoke.
      if (Math.random() < dt * 6) {
        w.parts.push({
          x: o.x + o.w - 26,
          y: o.y - 34,
          vx: -30 - Math.random() * 20,
          vy: -46 - Math.random() * 20,
          life: 1.1,
          maxLife: 1.1,
          color: 'rgba(200,200,200,0.55)',
          size: 7 + Math.random() * 6,
          grav: -30,
        });
      }
    }
    for (const k of w.knives) {
      if (k.state === 'tele') {
        k.t -= dt;
        if (k.t <= 0) {
          k.state = 'fly';
          const tx = game.turkey.x;
          const ty = k.targetY;
          // A slow, readable arc that crosses the turkey's x at head
          // height: it hits a standing turkey and misses a ducked one.
          // The vy term cancels gravity over the flight so the knife
          // arrives exactly at targetY.
          const flight = 1.1;
          k.vx = (tx - k.x) / flight;
          k.vy = (ty - k.y) / flight - 0.5 * 900 * flight;
          game.audio.knifeWhoosh();
        }
      } else if (k.state === 'fly') {
        k.vy += 900 * dt;
        k.x += k.vx * dt;
        k.y += k.vy * dt;
        k.angle = Math.atan2(k.vy, k.vx);
        if (k.x < -80 || k.y > CFG.groundY + 30) k.state = 'gone';
      }
    }

    for (const p of w.parts) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.grav * dt;
    }

    w.obstacles = w.obstacles.filter((o) => o.x + o.w > -80);
    w.corns = w.corns.filter((c) => c.x > -40 && !c.taken);
    w.stacks = w.stacks.filter((s) => s.x + s.w > -80);
    w.knives = w.knives.filter((k) => k.state !== 'gone');
    w.ovens = w.ovens.filter((o) => o.x + o.w > -80);
    w.waves = w.waves.filter((v) => v.x + v.w > -80);
    w.parts = w.parts.filter((p) => p.life > 0);

    // Spawning. While the world is frozen (the turkey hiding), nothing
    // new arrives: a pile-up at the right edge would greet the emerge.
    if (speed > 0) {
      w.quietT = Math.max(0, w.quietT - dt);
      const threatNear = w.obstacles.some((o) => o.x > 180 && o.x < 780);
      w.obstacleT -= dt;
      if (w.obstacleT <= 0) {
        if (w.quietT > 0) {
          // A knife or wave owns this beat; try again right after.
          w.obstacleT = 0.15;
        } else {
          w.spawnObstacle(difficulty);
          const every =
            CFG.obstacleEvery[0] +
            (CFG.obstacleEvery[1] - CFG.obstacleEvery[0]) * difficulty;
          w.obstacleT = every * w.rand(0.85, 1.3);
        }
      }
      w.cornT -= dt;
      if (w.cornT <= 0) {
        w.spawnCorn();
        w.cornT = CFG.cornEvery * w.rand(0.8, 1.3);
      }
      w.hayT -= dt;
      if (w.hayT <= 0) {
        w.spawnHay();
        const span = w.stage === 'kitchen' ? CFG.hayEveryKitchen : CFG.hayEveryFarm;
        w.hayT = w.rand(span[0], span[1]);
      }
      if (w.stage === 'kitchen') {
        w.knifeT -= dt;
        if (w.knifeT <= 0) {
          if (threatNear) {
            // An obstacle is already in play; the knife waits its turn.
            w.knifeT = 0.4;
          } else {
            w.spawnKnife();
            game.audio.knifeGlint();
            w.knifeT = CFG.knifeEvery * w.rand(0.85, 1.25);
          }
        }
        w.ovenT -= dt;
        if (w.ovenT <= 0) {
          w.spawnOven();
          w.ovenT = CFG.ovenEvery * w.rand(0.9, 1.2);
        }
      }
    }
  };

  // ---- background -----------------------------------------------------

  w.drawBack = function (ctx, distance, now) {
    const px = distance * CFG.pxPerMeter;
    if (w.stage === 'kitchen') {
      drawKitchenBack(ctx, px, now);
    } else {
      drawFarmBack(ctx, px, now);
    }
  };

  function drawFarmBack(ctx, px, now) {
    const g = ctx.createLinearGradient(0, 0, 0, CFG.height);
    g.addColorStop(0, COLORS.skyFarmTop);
    g.addColorStop(1, COLORS.skyFarmBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CFG.width, CFG.height);

    // Sun.
    ctx.fillStyle = '#fff2c0';
    ctx.beginPath();
    ctx.arc(1120, 92, 46, 0, Math.PI * 2);
    ctx.fill();

    // Clouds, slow parallax.
    ctx.fillStyle = 'rgba(255, 250, 235, 0.92)';
    for (let i = 0; i < 6; i++) {
      const cx = ((i * 430 - px * 0.12) % 1500 + 1500) % 1500 - 110;
      const cy = 56 + (i % 3) * 52;
      cloud(ctx, cx, cy, 0.9 + (i % 2) * 0.3);
    }
    // Birds.
    ctx.strokeStyle = 'rgba(90, 50, 20, 0.7)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const bx = ((i * 520 - px * 0.25 + now * 24) % 1400 + 1400) % 1400 - 60;
      const by = 120 + i * 36 + Math.sin(now * 2 + i) * 6;
      ctx.beginPath();
      ctx.moveTo(bx - 12, by);
      ctx.quadraticCurveTo(bx, by - 8, bx + 12, by);
      ctx.stroke();
    }

    // Far hills, high enough that the sky is a band, not a void.
    ctx.fillStyle = COLORS.hillFar;
    ctx.beginPath();
    ctx.moveTo(0, CFG.groundY - 195);
    for (let x = 0; x <= CFG.width; x += 40) {
      ctx.lineTo(x, CFG.groundY - 195 + Math.sin((x + px * 0.4) * 0.006) * 26);
    }
    ctx.lineTo(CFG.width, CFG.groundY);
    ctx.lineTo(0, CFG.groundY);
    ctx.closePath();
    ctx.fill();

    // A windmill on the far hill, one per long segment.
    const wsegW = 1900;
    const wseg = Math.floor((px * 0.4) / wsegW);
    for (let s = wseg - 1; s <= wseg + 1; s++) {
      if (segHash(s, 21) < 0.5) continue;
      const wx = s * wsegW - px * 0.4 + 420;
      if (wx < -60 || wx > CFG.width + 60) continue;
      drawWindmill(ctx, wx, CFG.groundY - 168, now);
    }

    // Distant barn, one per long segment.
    const segW = 1500;
    const seg = Math.floor((px * 0.5) / segW);
    for (let s = seg - 1; s <= seg + 1; s++) {
      const bx = s * segW - px * 0.5 + 260;
      if (bx < -260 || bx > CFG.width + 60) continue;
      drawBarn(ctx, bx, CFG.groundY - 148);
    }

    // Near hill.
    ctx.fillStyle = COLORS.hillNear;
    ctx.beginPath();
    ctx.moveTo(0, CFG.groundY - 60);
    for (let x = 0; x <= CFG.width; x += 40) {
      ctx.lineTo(x, CFG.groundY - 60 + Math.sin((x + px * 0.7) * 0.008 + 2) * 18);
    }
    ctx.lineTo(CFG.width, CFG.groundY);
    ctx.lineTo(0, CFG.groundY);
    ctx.closePath();
    ctx.fill();

    // Trees and bushes, one per segment.
    const tsegW = 420;
    const tseg = Math.floor((px * 0.85) / tsegW);
    for (let s = tseg - 1; s <= tseg + 3; s++) {
      const tx = s * tsegW - px * 0.85 + segHash(s, 3) * 200;
      if (tx < -80 || tx > CFG.width + 80) continue;
      if (segHash(s, 7) > 0.45) drawTree(ctx, tx, CFG.groundY - 58, 0.8 + segHash(s, 9) * 0.5);
      else drawBush(ctx, tx, CFG.groundY - 30);
    }

    // Fence posts along the ground.
    ctx.fillStyle = COLORS.fence;
    const fsegW = 96;
    const fseg = Math.floor(px / fsegW);
    for (let s = fseg - 1; s <= fseg + 14; s++) {
      const fx = s * fsegW - px;
      if (fx < -10 || fx > CFG.width + 10) continue;
      ctx.fillRect(fx - 3, CFG.groundY - 44, 6, 44);
    }
    ctx.fillRect(0, CFG.groundY - 40, CFG.width, 5);
    ctx.fillRect(0, CFG.groundY - 26, CFG.width, 5);

    // Ground: grass strip, then dirt.
    ctx.fillStyle = COLORS.grass;
    ctx.fillRect(0, CFG.groundY, CFG.width, 14);
    ctx.fillStyle = COLORS.groundFarm;
    ctx.fillRect(0, CFG.groundY + 14, CFG.width, CFG.height - CFG.groundY - 14);
    ctx.fillStyle = COLORS.groundFarmDark;
    for (let x = 0; x < CFG.width; x += 90) {
      const dx = x - (px % 90);
      ctx.fillRect(dx, CFG.groundY + 34, 34, 5);
      ctx.fillRect(dx + 44, CFG.groundY + 62, 26, 5);
    }
    // Grass tufts.
    ctx.strokeStyle = COLORS.grass;
    ctx.lineWidth = 3;
    for (let x = 0; x < CFG.width; x += 130) {
      const dx = x - (px % 130);
      ctx.beginPath();
      ctx.moveTo(dx, CFG.groundY);
      ctx.lineTo(dx + 5, CFG.groundY - 10);
      ctx.moveTo(dx + 8, CFG.groundY);
      ctx.lineTo(dx + 12, CFG.groundY - 12);
      ctx.stroke();
    }
  }

  function drawKitchenBack(ctx, px, now) {
    const g = ctx.createLinearGradient(0, 0, 0, CFG.height);
    g.addColorStop(0, COLORS.skyKitchenTop);
    g.addColorStop(1, COLORS.skyKitchenBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CFG.width, CFG.height);

    // Tile wall.
    ctx.fillStyle = COLORS.tileWall;
    ctx.fillRect(0, 0, CFG.width, CFG.groundY - 120);
    ctx.strokeStyle = 'rgba(255, 220, 180, 0.25)';
    ctx.lineWidth = 2;
    for (let y = 0; y < CFG.groundY - 120; y += 56) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CFG.width, y);
      ctx.stroke();
    }
    for (let x = 0; x < CFG.width; x += 56) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CFG.groundY - 120);
      ctx.stroke();
    }
    // A darker tile row here and there.
    ctx.fillStyle = COLORS.tileDark;
    for (let x = 0; x < CFG.width; x += 224) {
      const dx = x - (px % 224);
      ctx.fillRect(dx, 112, 56, 56);
      ctx.fillRect(dx + 112, 280, 56, 56);
    }

    // Window with an autumn view.
    const wx = 880 - (px * 0.1 % 200);
    ctx.fillStyle = '#7a4a21';
    ctx.fillRect(wx, 70, 220, 170);
    ctx.fillStyle = '#fbd786';
    ctx.fillRect(wx + 10, 80, 200, 150);
    ctx.fillStyle = COLORS.leafOrange;
    ctx.beginPath();
    ctx.arc(wx + 60, 190, 26, 0, Math.PI * 2);
    ctx.arc(wx + 150, 200, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.trunk;
    ctx.fillRect(wx + 145, 200, 10, 30);
    ctx.strokeStyle = '#7a4a21';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(wx + 110, 80);
    ctx.lineTo(wx + 110, 230);
    ctx.moveTo(wx + 10, 155);
    ctx.lineTo(wx + 210, 155);
    ctx.stroke();

    // Hanging pots and pans.
    for (let i = 0; i < 5; i++) {
      const hx = 60 + i * 130 - ((px * 0.15) % 130);
      ctx.strokeStyle = '#4a2c14';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(hx, 0);
      ctx.lineTo(hx, 46);
      ctx.stroke();
      ctx.fillStyle = i % 2 === 0 ? '#3d3d3d' : '#6b6b6b';
      ctx.beginPath();
      ctx.arc(hx, 74, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(hx, 74, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shelf with jars.
    ctx.fillStyle = COLORS.counter;
    ctx.fillRect(0, 380, CFG.width, 12);
    const jarColors = ['#e8a13a', '#c0392b', '#5da24a', '#e67e22'];
    for (let i = 0; i < 8; i++) {
      const jx = 40 + i * 150 - ((px * 0.2) % 150);
      ctx.fillStyle = jarColors[i % 4];
      ctx.fillRect(jx, 344, 34, 36);
      ctx.fillStyle = '#f2e3c6';
      ctx.fillRect(jx + 8, 336, 18, 8);
    }

    // Wooden counter and checker floor.
    ctx.fillStyle = COLORS.counterTop;
    ctx.fillRect(0, CFG.groundY - 120, CFG.width, 16);
    ctx.fillStyle = COLORS.counter;
    ctx.fillRect(0, CFG.groundY - 104, CFG.width, 104);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let x = 0; x < CFG.width; x += 180) {
      ctx.fillRect(x, CFG.groundY - 104, 4, 104);
    }
    // Floor tiles.
    for (let x = 0; x < CFG.width; x += 80) {
      const dx = x - (px % 80);
      ctx.fillStyle = (Math.floor((x + px) / 80) % 2 === 0) ? '#b07a45' : '#96682f';
      ctx.fillRect(dx, CFG.groundY, 80, CFG.height - CFG.groundY);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(0, CFG.groundY, CFG.width, 4);
    void now;
  }

  function cloud(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.ellipse(0, 0, 52, 18, 0, 0, Math.PI * 2);
    ctx.ellipse(-34, 6, 34, 14, 0, 0, Math.PI * 2);
    ctx.ellipse(36, 6, 36, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawWindmill(ctx, x, y, now) {
    // A small silhouette on the far hill: tower, cap and slow blades.
    ctx.fillStyle = '#8a6a3b';
    ctx.beginPath();
    ctx.moveTo(x - 16, y + 78);
    ctx.lineTo(x - 8, y);
    ctx.lineTo(x + 8, y);
    ctx.lineTo(x + 16, y + 78);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#6b4423';
    ctx.beginPath();
    ctx.moveTo(x - 10, y);
    ctx.lineTo(x, y - 14);
    ctx.lineTo(x + 10, y);
    ctx.closePath();
    ctx.fill();
    const ang = now * 0.5;
    ctx.strokeStyle = '#6b4423';
    ctx.lineWidth = 4;
    for (let i = 0; i < 4; i++) {
      const a = ang + (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(x, y - 4);
      ctx.lineTo(x + Math.cos(a) * 34, y - 4 + Math.sin(a) * 34);
      ctx.stroke();
    }
  }

  function drawBarn(ctx, x, y) {
    ctx.fillStyle = COLORS.barnRed;
    ctx.fillRect(x, y, 170, 110);
    ctx.fillStyle = COLORS.barnRoof;
    ctx.beginPath();
    ctx.moveTo(x - 12, y);
    ctx.lineTo(x + 85, y - 58);
    ctx.lineTo(x + 182, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f2e3c6';
    ctx.fillRect(x + 62, y + 52, 46, 58);
    ctx.strokeStyle = '#7c2a20';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 62, y + 52);
    ctx.lineTo(x + 108, y + 110);
    ctx.moveTo(x + 108, y + 52);
    ctx.lineTo(x + 62, y + 110);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 22, y + 22, 26, 26);
    ctx.fillRect(x + 122, y + 22, 26, 26);
  }

  function drawTree(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = COLORS.trunk;
    ctx.fillRect(-7, -70, 14, 70);
    const cols = [COLORS.leafOrange, COLORS.leafRed, COLORS.leafYellow];
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = cols[i % 3];
      ctx.beginPath();
      ctx.arc(-26 + i * 26, -84 + (i % 2) * 10, 26, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = cols[0];
    ctx.beginPath();
    ctx.arc(0, -108, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawBush(ctx, x, y) {
    ctx.fillStyle = '#4e7d3a';
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.arc(x + 24, y + 4, 20, 0, Math.PI * 2);
    ctx.arc(x - 24, y + 4, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.leafRed;
    ctx.beginPath();
    ctx.arc(x - 8, y - 10, 4, 0, Math.PI * 2);
    ctx.arc(x + 12, y - 4, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- entities -------------------------------------------------------

  w.drawOvens = function (ctx, now) {
    for (const o of w.ovens) {
      drawOven(ctx, o, now);
    }
  };

  function drawOven(ctx, o, now) {
    const flick = 0.75 + Math.sin(now * 9 + o.x) * 0.25;
    // Chimney with smoke.
    ctx.fillStyle = COLORS.ovenDark;
    ctx.fillRect(o.x + o.w - 44, o.y - 34, 26, 40);
    // Body: unmistakably an oven, steel with a glowing door.
    ctx.fillStyle = COLORS.ovenSteel;
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.fillStyle = COLORS.ovenDark;
    ctx.fillRect(o.x, o.y, o.w, 26);
    // Control knobs.
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = '#2d3436';
      ctx.beginPath();
      ctx.arc(o.x + 34 + i * 30, o.y + 13, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    // Glowing door window.
    const glow = o.glow > 0 ? 1 : 0.55;
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(o.x + 22, o.y + 44, o.w - 44, 120);
    ctx.fillStyle = `rgba(255, ${Math.floor(110 + 90 * flick)}, 20, ${glow})`;
    ctx.fillRect(o.x + 30, o.y + 52, o.w - 60, 104);
    // Flames licking inside the door.
    ctx.fillStyle = COLORS.flame;
    for (let i = 0; i < 4; i++) {
      const fx = o.x + 44 + i * 36;
      const fh = 34 + Math.sin(now * 11 + i * 2) * 10;
      ctx.beginPath();
      ctx.moveTo(fx, o.y + 150);
      ctx.quadraticCurveTo(fx + 8, o.y + 150 - fh, fx + 16, o.y + 150);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = COLORS.flameCore;
    for (let i = 0; i < 3; i++) {
      const fx = o.x + 56 + i * 40;
      ctx.beginPath();
      ctx.ellipse(fx, o.y + 148, 8, 12 + Math.sin(now * 13 + i) * 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Flames on top, and the oven's feet.
    ctx.fillStyle = COLORS.flame;
    for (let i = 0; i < 3; i++) {
      const fx = o.x + 30 + i * 62;
      const fh = 20 + Math.sin(now * 8 + i * 3) * 7;
      ctx.beginPath();
      ctx.moveTo(fx, o.y);
      ctx.quadraticCurveTo(fx + 10, o.y - fh, fx + 20, o.y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(o.x + 8, o.y + o.h - 6, o.w - 16, 6);
    ctx.fillRect(o.x, o.y + o.h, 14, 10);
    ctx.fillRect(o.x + o.w - 14, o.y + o.h, 14, 10);
  }

  w.drawStacks = function (ctx, now) {
    for (const s of w.stacks) {
      drawHaystack(ctx, s, now);
    }
  };

  function drawHaystack(ctx, s, now) {
    void now;
    ctx.fillStyle = COLORS.hay;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y + s.h);
    ctx.quadraticCurveTo(s.x + s.w / 2, s.y - 34, s.x + s.w, s.y + s.h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = COLORS.hayDark;
    ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      const hx = s.x + 14 + i * 18;
      ctx.beginPath();
      ctx.moveTo(hx, s.y + s.h - 8);
      ctx.quadraticCurveTo(hx + 6, s.y + s.h / 2, hx + 2, s.y + 18);
      ctx.stroke();
    }
    ctx.fillStyle = COLORS.hayDark;
    ctx.beginPath();
    ctx.ellipse(s.x + s.w / 2, s.y + 6, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  w.drawObstacles = function (ctx, now) {
    for (const o of w.obstacles) {
      if (o.kind === 'fence') drawFence(ctx, o);
      else if (o.kind === 'bale') drawBale(ctx, o);
      else if (o.kind === 'pumpkin') drawPumpkin(ctx, o, now);
      else if (o.kind === 'pin') drawPin(ctx, o);
      else if (o.kind === 'pot') drawPot(ctx, o);
    }
  };

  function drawFence(ctx, o) {
    ctx.fillStyle = COLORS.fence;
    ctx.fillRect(o.x, o.y, 8, o.h);
    ctx.fillRect(o.x + o.w - 8, o.y, 8, o.h);
    ctx.fillRect(o.x - 4, o.y + 8, o.w + 8, 8);
    ctx.fillRect(o.x - 4, o.y + 32, o.w + 8, 8);
    ctx.fillStyle = '#a06a35';
    ctx.beginPath();
    ctx.moveTo(o.x - 2, o.y - 8);
    ctx.lineTo(o.x + 6, o.y - 8);
    ctx.lineTo(o.x + 2, o.y);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(o.x + o.w - 6, o.y - 8);
    ctx.lineTo(o.x + o.w + 2, o.y - 8);
    ctx.lineTo(o.x + o.w - 2, o.y);
    ctx.closePath();
    ctx.fill();
  }

  function drawBale(ctx, o) {
    ctx.fillStyle = COLORS.hay;
    ctx.beginPath();
    ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.hayDark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2 - 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawPumpkin(ctx, o, now) {
    const bob = Math.sin(now * 3 + o.x) * 2;
    ctx.fillStyle = COLORS.pumpkin;
    ctx.beginPath();
    ctx.ellipse(o.x + o.w / 2, o.y + o.h / 2 + bob, o.w / 2, o.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c85a10';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(o.x + o.w / 2, o.y + o.h / 2 + bob, o.w / 4, o.h / 2 - 2, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#4e7d3a';
    ctx.fillRect(o.x + o.w / 2 - 3, o.y - 4 + bob, 6, 12);
  }

  function drawPin(ctx, o) {
    ctx.save();
    ctx.translate(o.x + o.w / 2, o.y + o.h / 2);
    ctx.rotate(o.roll);
    ctx.fillStyle = '#d9b380';
    ctx.fillRect(-o.w / 2, -o.h / 2, o.w, o.h);
    ctx.fillStyle = '#8a5a2b';
    ctx.beginPath();
    ctx.arc(-o.w / 2 + 4, 0, 8, 0, Math.PI * 2);
    ctx.arc(o.w / 2 - 4, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPot(ctx, o) {
    ctx.fillStyle = '#3d3d3d';
    ctx.fillRect(o.x, o.y + 6, o.w, o.h - 6);
    ctx.fillStyle = '#555';
    ctx.fillRect(o.x - 6, o.y, o.w + 12, 12);
    ctx.fillStyle = '#e8a13a';
    ctx.beginPath();
    ctx.ellipse(o.x + o.w / 2, o.y + 4, o.w / 3, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  w.drawCorn = function (ctx, now) {
    for (const c of w.corns) {
      if (c.taken) continue;
      const bobY = Math.sin(now * 4 + c.bob) * 3;
      ctx.fillStyle = '#f2c14e';
      ctx.beginPath();
      ctx.ellipse(c.x, c.y + bobY, 10, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d9a441';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(c.x - 5, c.y + bobY - 8);
      ctx.lineTo(c.x - 5, c.y + bobY + 8);
      ctx.moveTo(c.x, c.y + bobY - 10);
      ctx.lineTo(c.x, c.y + bobY + 10);
      ctx.moveTo(c.x + 5, c.y + bobY - 8);
      ctx.lineTo(c.x + 5, c.y + bobY + 8);
      ctx.stroke();
      ctx.fillStyle = '#4e7d3a';
      ctx.fillRect(c.x - 2, c.y + bobY + 12, 4, 8);
    }
  };

  w.drawKnives = function (ctx, now) {
    for (const k of w.knives) {
      drawKnife(ctx, k, now);
    }
  };

  // A BIG carving knife: it must read as a threat at a glance.
  function drawKnife(ctx, k, now) {
    ctx.save();
    ctx.translate(k.x, k.y);
    if (k.state === 'tele') {
      // Telegraph: glinting at the right edge with a warning mark.
      const pulse = 0.6 + Math.sin(now * 16) * 0.4;
      ctx.globalAlpha = pulse;
      ctx.rotate(-0.5);
      drawKnifeShape(ctx, 1);
      ctx.globalAlpha = 1;
      ctx.font = 'bold 40px Trebuchet MS, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = COLORS.warnRed;
      ctx.fillText('!', 0, -86);
      ctx.restore();
      return;
    }
    // Motion streaks behind the flying blade.
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 4;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-k.vx * 0.03 * i - 40, -k.vy * 0.03 * i + i * 10 - 20);
      ctx.lineTo(-k.vx * 0.03 * i - 90, -k.vy * 0.03 * i + i * 10 - 20);
      ctx.stroke();
    }
    ctx.rotate(k.angle);
    drawKnifeShape(ctx, 1);
    ctx.restore();
  }

  function drawKnifeShape(ctx, s) {
    ctx.scale(s, s);
    // Blade: long, silver, with a glint line.
    ctx.fillStyle = COLORS.knifeBlade;
    ctx.beginPath();
    ctx.moveTo(-30, -10);
    ctx.lineTo(88, -10);
    ctx.lineTo(108, 0);
    ctx.lineTo(88, 10);
    ctx.lineTo(-30, 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#8a979e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-24, -4);
    ctx.lineTo(80, -4);
    ctx.stroke();
    // Handle.
    ctx.fillStyle = COLORS.knifeHandle;
    ctx.beginPath();
    ctx.roundRect(-84, -11, 54, 22, 8);
    ctx.fill();
    ctx.fillStyle = '#d9c9a8';
    ctx.beginPath();
    ctx.arc(-72, 0, 3, 0, Math.PI * 2);
    ctx.arc(-48, 0, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  w.drawWaves = function (ctx, now) {
    for (const v of w.waves) {
      const flick = Math.sin(now * 14 + v.x) * 6;
      ctx.fillStyle = COLORS.ovenGlow;
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) {
        const fx = v.x + (v.w / 6) * i;
        const fh = v.h + Math.sin(now * 12 + i * 1.7) * 8 + flick * 0.4;
        if (i === 0) ctx.moveTo(fx, v.y + v.h);
        else ctx.lineTo(fx, v.y + v.h - fh);
      }
      ctx.lineTo(v.x + v.w, v.y + v.h);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = COLORS.flameCore;
      ctx.beginPath();
      ctx.ellipse(v.x + v.w / 2, v.y + v.h - 12, v.w / 3, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  w.drawParts = function (ctx) {
    for (const p of w.parts) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  return w;
}
