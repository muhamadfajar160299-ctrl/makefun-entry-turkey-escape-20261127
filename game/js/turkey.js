// The Great Turkey Escape — the turkey.
// Physics, jumping, ducking and hiding live here; the drawing is the
// turkey's own flat-vector art, drawn facing right, mid-stride.

import { CFG, COLORS } from './constants.js';

export function createTurkey() {
  const t = {
    x: CFG.turkeyX,
    // y is the feet position; the turkey stands on the ground line.
    y: CFG.groundY,
    vy: 0,
    grounded: true,
    ducking: false,
    hidden: false,
    hideStack: null,
    invuln: 0,
    runPhase: 0,
    coyote: 0,
    jumpBuffer: 0,
    w: CFG.turkeyW,
    h: CFG.turkeyH,
    flap: 0,
  };

  t.reset = function () {
    t.y = CFG.groundY;
    t.vy = 0;
    t.grounded = true;
    t.ducking = false;
    t.hidden = false;
    t.hideStack = null;
    t.invuln = 0;
    t.runPhase = 0;
    t.coyote = 0;
    t.jumpBuffer = 0;
    t.flap = 0;
  };

  // The turkey's collision box: shorter while ducking, none while hidden.
  t.bounds = function () {
    if (t.hidden) return null;
    const h = t.ducking ? CFG.turkeyDuckH : CFG.turkeyH;
    return { x: t.x - t.w / 2 + 6, y: t.y - h, w: t.w - 12, h };
  };

  t.update = function (dt, input, fx) {
    if (t.invuln > 0) t.invuln -= dt;
    if (t.coyote > 0) t.coyote -= dt;
    if (t.jumpBuffer > 0) t.jumpBuffer -= dt;

    // Hidden inside a haystack: the turkey waits, the farmer searches.
    if (t.hidden) {
      t.runPhase += dt * 2;
      return;
    }

    t.ducking = input.duckHeld && t.grounded;
    if (input.takeJump()) t.jumpBuffer = CFG.jumpBuffer;

    if (t.jumpBuffer > 0 && (t.grounded || t.coyote > 0)) {
      t.vy = -CFG.jumpVelocity;
      t.grounded = false;
      t.coyote = 0;
      t.jumpBuffer = 0;
      t.flap = 0.28;
      fx.onJump();
    }

    if (!t.grounded) {
      t.vy += CFG.gravity * dt;
      t.y += t.vy * dt;
      if (t.y >= CFG.groundY) {
        t.y = CFG.groundY;
        t.vy = 0;
        t.grounded = true;
        t.coyote = CFG.coyoteTime;
        fx.onLand();
      }
    } else {
      t.coyote = CFG.coyoteTime;
    }

    t.runPhase += dt * (t.grounded ? 11 : 4);
    if (t.flap > 0) t.flap -= dt;
  };

  t.hideIn = function (stack) {
    t.hidden = true;
    t.hideStack = stack;
    t.vy = 0;
    t.grounded = true;
  };

  t.emerge = function () {
    t.hidden = false;
    t.hideStack = null;
    t.invuln = Math.max(t.invuln, 0.8);
  };

  t.draw = function (ctx, now) {
    // Flash while invulnerable after a hit.
    if (t.invuln > 0 && Math.floor(now * 14) % 2 === 0) return;
    const bob = t.grounded && !t.ducking ? Math.sin(t.runPhase * 2) * 2 : 0;
    const x = t.x;
    const y = t.y - bob;
    const legSwing = t.grounded ? Math.sin(t.runPhase) * 14 : 6;

    if (t.hidden && t.hideStack) {
      // Only the head and the tail fan poke out of the hay, big and
      // clearly sitting on the mound so the hide reads at a glance.
      const s = t.hideStack;
      drawTailFan(ctx, x - 32, s.y - 6, 1.0, now);
      drawHead(ctx, x + 24, s.y - 26, 1.5);
      return;
    }

    ctx.save();
    ctx.translate(x, y);
    if (t.ducking) ctx.scale(1.15, 0.72);

    // Legs, mid-stride.
    ctx.strokeStyle = COLORS.leg;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-8, -14);
    ctx.lineTo(-8 + legSwing, 0);
    ctx.moveTo(8, -14);
    ctx.lineTo(8 - legSwing, 0);
    ctx.stroke();

    // Tail fan, layered feathers.
    drawTailFan(ctx, -30, -58, 1, now);

    // Body.
    ctx.fillStyle = COLORS.turkeyBody;
    ctx.beginPath();
    ctx.ellipse(0, -40, 34, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    // Belly patch.
    ctx.fillStyle = COLORS.turkeyDark;
    ctx.beginPath();
    ctx.ellipse(2, -30, 20, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wing, flapping on a jump.
    const wingLift = t.flap > 0 ? -14 : Math.sin(t.runPhase * 2) * 3;
    ctx.fillStyle = COLORS.turkeyDark;
    ctx.beginPath();
    ctx.ellipse(-4, -42 + wingLift, 18, 11, -0.4, 0, Math.PI * 2);
    ctx.fill();

    drawHead(ctx, 28, -66, 1);
    ctx.restore();
  };

  return t;
}

// A fanned tail: five overlapping feathers, warm browns.
function drawTailFan(ctx, x, y, s, now) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const sway = Math.sin(now * 2.2) * 0.03;
  for (let i = 0; i < 5; i++) {
    const ang = -1.15 + i * 0.5 + sway;
    ctx.save();
    ctx.rotate(ang);
    ctx.fillStyle = i % 2 === 0 ? COLORS.turkeyTail : COLORS.turkeyTailDark;
    ctx.beginPath();
    ctx.ellipse(0, -26, 9, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.turkeyDark;
    ctx.beginPath();
    ctx.ellipse(0, -40, 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// Head, beak and wattle, facing right.
function drawHead(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = COLORS.turkeyHead;
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.beak;
  ctx.beginPath();
  ctx.moveTo(10, -3);
  ctx.lineTo(24, 2);
  ctx.lineTo(10, 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = COLORS.wattle;
  ctx.beginPath();
  ctx.ellipse(12, 8, 4, 7, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1d1d1d';
  ctx.beginPath();
  ctx.arc(4, -4, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(5, -5, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
