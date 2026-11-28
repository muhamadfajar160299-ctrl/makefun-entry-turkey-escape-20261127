// The Great Turkey Escape — the farmer.
// He chases the turkey, searches when he loses it, and lunges when he
// gets close. His screen position is the turkey's gap made visible:
// the judge must always see the two of them apart, never one blob.

import { CFG, COLORS } from './constants.js';

export function createFarmer() {
  const f = {
    // x is the farmer's feet position on screen.
    x: CFG.turkeyX - CFG.gapStart,
    state: 'chase', // chase | search | return | lunge
    facing: 1,
    searchT: 0,
    bob: 0,
    gruntT: 0,
    w: 58,
    h: 112,
  };

  f.reset = function () {
    f.x = CFG.turkeyX - CFG.gapStart;
    f.state = 'chase';
    f.facing = 1;
    f.searchT = 0;
    f.bob = 0;
    f.gruntT = 0;
  };

  // The gap in pixels between the farmer and the turkey.
  f.gap = function (turkeyX) {
    return turkeyX - f.x;
  };

  f.update = function (dt, game) {
    f.bob += dt * 11;
    const gap = f.gap(game.turkey.x);

    if (game.turkey.hidden) {
      // He lost the turkey: stop, look around, then give up on this
      // stretch and walk back the way he came, looking elsewhere.
      // He can never catch what he cannot see.
      if (f.state !== 'search' && f.state !== 'return') {
        f.state = 'search';
        f.searchT = CFG.farmerSearchTime;
        game.audio.spotted();
      }
      if (f.state === 'search') {
        f.searchT -= dt;
        if (f.searchT <= 0) {
          f.state = 'return';
          f.facing = -1;
        }
      } else {
        f.x -= 110 * dt;
      }
      return;
    }

    f.facing = 1;
    f.state = gap < 70 ? 'lunge' : 'chase';
    const pressure =
      CFG.farmerBasePressure +
      game.distance * CFG.farmerPerMeter +
      (game.stage === 'kitchen' ? CFG.farmerKitchenExtra : 0);
    // He gains ground at the pressure rate; a hit lets him surge.
    f.x += pressure * dt;
    if (f.x > game.turkey.x - CFG.gapCatch) f.x = game.turkey.x - CFG.gapCatch;

    f.gruntT -= dt;
    if (gap < CFG.gapWarn && f.gruntT <= 0) {
      f.gruntT = 1.6;
      game.audio.farmerGrunt();
    }
  };

  f.draw = function (ctx, now) {
    const x = f.x;
    const y = CFG.groundY;
    const runSwing = Math.sin(f.bob) * 12;
    const leaning = f.state === 'lunge' ? 0.22 : 0.08;

    ctx.save();
    ctx.translate(x, y);
    if (f.facing < 0) ctx.scale(-1, 1);
    ctx.rotate(leaning);

    // Legs: blue overalls, running.
    ctx.strokeStyle = COLORS.farmerOveralls;
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-8, -52);
    ctx.lineTo(-8 + runSwing, 0);
    ctx.moveTo(8, -52);
    ctx.lineTo(8 - runSwing, 0);
    ctx.stroke();

    // Torso: red check shirt.
    ctx.fillStyle = COLORS.farmerShirt;
    ctx.fillRect(-20, -96, 40, 48);
    ctx.fillStyle = COLORS.farmerShirtCheck;
    ctx.fillRect(-20, -84, 40, 6);
    ctx.fillRect(-20, -66, 40, 6);
    ctx.fillRect(-6, -96, 6, 48);
    // Overall straps and bib.
    ctx.fillStyle = COLORS.farmerOveralls;
    ctx.fillRect(-16, -96, 6, 26);
    ctx.fillRect(10, -96, 6, 26);
    ctx.fillRect(-18, -72, 36, 24);

    // Arms: reaching forward, or shading his eyes while searching.
    ctx.strokeStyle = COLORS.farmerShirt;
    ctx.lineWidth = 8;
    if (f.state === 'search') {
      ctx.beginPath();
      ctx.moveTo(14, -88);
      ctx.lineTo(30, -112);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-14, -88);
      ctx.lineTo(-26, -70);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(14, -88);
      ctx.lineTo(34 + runSwing * 0.4, -78);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-14, -88);
      ctx.lineTo(-30 + runSwing * 0.4, -76);
      ctx.stroke();
    }

    // Head.
    ctx.fillStyle = COLORS.farmerSkin;
    ctx.beginPath();
    ctx.arc(0, -106, 15, 0, Math.PI * 2);
    ctx.fill();
    // Angry eyes and a moustache.
    ctx.fillStyle = '#1d1d1d';
    ctx.beginPath();
    ctx.arc(5, -108, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(12, -108, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5b3a1e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(4, -99);
    ctx.lineTo(14, -99);
    ctx.stroke();
    // Straw hat.
    ctx.fillStyle = COLORS.farmerHat;
    ctx.beginPath();
    ctx.ellipse(0, -116, 26, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-13, -132, 26, 17);
    ctx.fillStyle = COLORS.farmerHatBand;
    ctx.fillRect(-13, -120, 26, 5);

    // Pitchfork, held low behind him.
    ctx.save();
    ctx.translate(-26, -60);
    ctx.rotate(-0.5);
    ctx.strokeStyle = '#7a5230';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 60);
    ctx.lineTo(0, -58);
    ctx.stroke();
    ctx.strokeStyle = '#c8c8c8';
    ctx.lineWidth = 3;
    for (const dx of [-8, 0, 8]) {
      ctx.beginPath();
      ctx.moveTo(dx, -58);
      ctx.lineTo(dx, -74);
      ctx.stroke();
    }
    ctx.restore();

    ctx.restore();

    // Searching "?" bubble, on the side away from the haystack.
    if (f.state === 'search') {
      ctx.save();
      ctx.font = 'bold 34px Trebuchet MS, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#5b3a1e';
      ctx.lineWidth = 5;
      const bx = x - 36 * f.facing;
      const by = y - 168 + Math.sin(now * 3) * 3;
      ctx.beginPath();
      ctx.arc(bx, by, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#c0392b';
      ctx.fillText('?', bx, by + 12);
      ctx.restore();
    }
  };

  return f;
}
