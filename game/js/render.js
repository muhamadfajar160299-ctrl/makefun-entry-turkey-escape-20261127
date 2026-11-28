// The Great Turkey Escape — rendering.
// One place owns the canvas: the background, the entities in depth
// order, the HUD, the banners and the title, caught and escaped
// screens. Every screen must read at a glance when shrunk small.

import { CFG, COLORS } from './constants.js';

export function drawGame(ctx, g) {
  const now = g.now;
  ctx.clearRect(0, 0, CFG.width, CFG.height);

  if (g.mode === 'title') {
    drawTitle(ctx, g, now);
    return;
  }
  if (g.mode === 'escaped') {
    drawEscaped(ctx, g, now);
    return;
  }
  if (g.mode === 'caught') {
    drawCaught(ctx, g, now);
    return;
  }

  // Playing or paused: the world, then the actors in depth order.
  g.world.drawBack(ctx, g.distance, now);
  g.world.drawOvens(ctx, now);
  g.world.drawStacks(ctx, now);
  g.world.drawObstacles(ctx, now);
  g.world.drawWaves(ctx, now);
  g.world.drawCorn(ctx, now);
  g.turkey.draw(ctx, now);
  g.farmer.draw(ctx, now);
  g.world.drawKnives(ctx, now);
  g.world.drawParts(ctx);

  drawHud(ctx, g);
  drawBanners(ctx, g, now);

  if (g.mode === 'paused') {
    ctx.fillStyle = 'rgba(20, 10, 4, 0.55)';
    ctx.fillRect(0, 0, CFG.width, CFG.height);
    centerText(ctx, 'PAUSED', CFG.width / 2, 300, 'bold 84px Trebuchet MS, sans-serif', COLORS.hudText);
    centerText(ctx, 'Press P or click to keep running', CFG.width / 2, 380, '28px Trebuchet MS, sans-serif', '#fff');
  }

  // Danger vignette when the farmer is close.
  const gap = g.farmer.gap(g.turkey.x);
  if (gap < CFG.gapWarn && g.mode === 'playing') {
    const a = (1 - gap / CFG.gapWarn) * (0.22 + Math.sin(now * 6) * 0.07);
    const vg = ctx.createRadialGradient(
      CFG.width / 2, CFG.height / 2, CFG.height * 0.42,
      CFG.width / 2, CFG.height / 2, CFG.height * 0.85
    );
    vg.addColorStop(0, 'rgba(255,0,0,0)');
    vg.addColorStop(1, `rgba(255,0,0,${a})`);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, CFG.width, CFG.height);
  }
}

function centerText(ctx, text, x, y, font, color) {
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawHud(ctx, g) {
  ctx.fillStyle = COLORS.hudBar;
  ctx.fillRect(0, 0, CFG.width, 64);

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = 'bold 30px Trebuchet MS, sans-serif';
  ctx.fillStyle = COLORS.hudText;
  ctx.fillText(`SCORE ${Math.floor(g.score)}`, 24, 33);

  ctx.textAlign = 'center';
  ctx.font = 'bold 28px Trebuchet MS, sans-serif';
  ctx.fillText(g.stageName(), CFG.width / 2 - 120, 33);

  ctx.textAlign = 'left';
  ctx.font = 'bold 30px Trebuchet MS, sans-serif';
  ctx.fillText(`${Math.floor(g.distance)} m`, CFG.width / 2 + 30, 33);

  // Lives.
  for (let i = 0; i < CFG.lives; i++) {
    const hx = 830 + i * 40;
    ctx.fillStyle = i < g.lives ? COLORS.heart : COLORS.heartEmpty;
    drawHeart(ctx, hx, 32, 15);
  }

  // Corn count.
  ctx.fillStyle = '#f2c14e';
  ctx.beginPath();
  ctx.ellipse(972, 32, 9, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 26px Trebuchet MS, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${g.corn}`, 988, 33);

  // Farmer proximity: the gap as a bar that fills as he closes in.
  const gap = Math.max(0, g.farmer.gap(g.turkey.x));
  const frac = 1 - gap / CFG.gapMax;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(1040, 20, 180, 16);
  ctx.fillStyle = frac > 0.66 ? COLORS.warnRed : frac > 0.4 ? '#ff9d00' : '#5da24a';
  ctx.fillRect(1040, 20, 180 * Math.min(1, frac), 16);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1040, 20, 180, 16);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 18px Trebuchet MS, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('FARMER', 1040, 50);

  if (gap < CFG.gapWarn && g.mode === 'playing' && !g.turkey.hidden) {
    centerText(
      ctx, "HE'S RIGHT BEHIND YOU!", CFG.width / 2, 108,
      'bold 34px Trebuchet MS, sans-serif', COLORS.warnRed
    );
  }
}

function drawHeart(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s / 10, s / 10);
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.bezierCurveTo(-12, -2, -7, -10, 0, -4);
  ctx.bezierCurveTo(7, -10, 12, -2, 0, 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawBanners(ctx, g, now) {
  void now;
  let y = 150;
  for (const b of g.banners) {
    const a = Math.min(1, b.life / 0.6);
    ctx.globalAlpha = a;
    centerText(ctx, b.text, CFG.width / 2, y, b.big ? 'bold 52px Trebuchet MS, sans-serif' : 'bold 36px Trebuchet MS, sans-serif', b.color || '#fff');
    ctx.globalAlpha = 1;
    y += b.big ? 66 : 48;
  }
}

// ---- screens ----------------------------------------------------------

function drawTitle(ctx, g, now) {
  // Warm farm morning behind the title.
  const px = now * 22;
  g.world.stage = 'farmyard';
  g.world.drawBack(ctx, px / CFG.pxPerMeter, now);

  // A light veil so the title stays legible over the bright sky.
  ctx.fillStyle = 'rgba(40, 20, 8, 0.25)';
  ctx.fillRect(0, 0, CFG.width, CFG.height);

  centerText(ctx, 'THE GREAT', CFG.width / 2, 138, 'bold 64px Trebuchet MS, sans-serif', '#ffe9b0');
  centerText(ctx, 'TURKEY ESCAPE', CFG.width / 2, 222, 'bold 92px Trebuchet MS, sans-serif', '#ff9d00');
  centerText(ctx, 'Thanksgiving is coming. The farmer is coming faster.', CFG.width / 2, 300, '30px Trebuchet MS, sans-serif', '#fff');
  centerText(ctx, 'Run, jump, duck — and do NOT become dinner.', CFG.width / 2, 340, '30px Trebuchet MS, sans-serif', '#fff');

  // The two actors flank the text, clear of it: the farmer reaching on
  // the left, the turkey big and mid-stride on the right.
  const savedFx = g.farmer.x;
  g.farmer.x = 150;
  g.farmer.state = 'lunge';
  g.farmer.bob = now * 8;
  g.farmer.draw(ctx, now);
  g.farmer.x = savedFx;
  g.farmer.state = 'chase';

  const savedX = g.turkey.x;
  const savedY = g.turkey.y;
  g.turkey.x = 1090;
  g.turkey.y = CFG.groundY;
  g.turkey.runPhase = now * 8;
  ctx.save();
  ctx.translate(1090, CFG.groundY);
  ctx.scale(1.35, 1.35);
  ctx.translate(-1090, -CFG.groundY);
  g.turkey.draw(ctx, now);
  ctx.restore();
  g.turkey.x = savedX;
  g.turkey.y = savedY;

  const blink = 0.65 + Math.sin(now * 4) * 0.35;
  ctx.globalAlpha = blink;
  centerText(ctx, 'SPACE / CLICK to start', CFG.width / 2, 470, 'bold 38px Trebuchet MS, sans-serif', '#ffe9b0');
  ctx.globalAlpha = 1;
  centerText(ctx, 'Jump: SPACE / W / ↑ / click      Duck & hide: ↓ / S      Pause: P      Mute: M', CFG.width / 2, 536, '24px Trebuchet MS, sans-serif', '#fff');
  centerText(ctx, 'Grab corn for points. Duck inside a haystack to lose the farmer.', CFG.width / 2, 572, '24px Trebuchet MS, sans-serif', '#fff');
  centerText(ctx, 'Reach the forest gate at 1200 m to escape!', CFG.width / 2, 606, 'bold 26px Trebuchet MS, sans-serif', '#ffe9b0');
  if (g.best > 0) {
    centerText(ctx, `Best escape: ${Math.floor(g.best)} m`, CFG.width / 2, 648, '24px Trebuchet MS, sans-serif', '#fff');
  }
}

function drawEscaped(ctx, g, now) {
  // Forest dusk.
  const grad = ctx.createLinearGradient(0, 0, 0, CFG.height);
  grad.addColorStop(0, COLORS.skyForestTop);
  grad.addColorStop(1, COLORS.skyForestBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CFG.width, CFG.height);

  // Moon and pines.
  ctx.fillStyle = '#e8e4c9';
  ctx.beginPath();
  ctx.arc(1080, 100, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1d3524';
  for (let i = 0; i < 9; i++) {
    const px = 30 + i * 142 + (i % 2) * 30;
    const ph = 190 + (i % 3) * 46;
    ctx.beginPath();
    ctx.moveTo(px, CFG.groundY);
    ctx.lineTo(px + 46, CFG.groundY - ph);
    ctx.lineTo(px + 92, CFG.groundY);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#22442a';
  ctx.fillRect(0, CFG.groundY, CFG.width, CFG.height - CFG.groundY);

  // The turkey, free and celebrating, big in the frame.
  const savedX = g.turkey.x;
  const savedY = g.turkey.y;
  g.turkey.x = 960;
  g.turkey.y = CFG.groundY;
  g.turkey.runPhase = now * 6;
  ctx.save();
  ctx.translate(960, CFG.groundY);
  ctx.scale(1.3, 1.3);
  ctx.translate(-960, -CFG.groundY);
  g.turkey.draw(ctx, now);
  ctx.restore();
  g.turkey.x = savedX;
  g.turkey.y = savedY;

  centerText(ctx, 'ESCAPED!', CFG.width / 2, 150, 'bold 96px Trebuchet MS, sans-serif', '#8dff6a');
  centerText(ctx, 'You made it to the forest. No dinner table for you!', CFG.width / 2, 226, '30px Trebuchet MS, sans-serif', '#fff');
  centerText(
    ctx,
    `Score: ${Math.floor(g.score)}    Distance: ${Math.floor(g.distance)} m    Corn: ${g.corn}`,
    CFG.width / 2, 330, 'bold 34px Trebuchet MS, sans-serif', '#ffe9b0'
  );
  centerText(ctx, `Best escape: ${Math.floor(g.best)} m`, CFG.width / 2, 386, '28px Trebuchet MS, sans-serif', '#fff');
  const blink = 0.65 + Math.sin(now * 4) * 0.35;
  ctx.globalAlpha = blink;
  centerText(ctx, 'Press R or click to run again', CFG.width / 2, 470, 'bold 34px Trebuchet MS, sans-serif', '#ffe9b0');
  ctx.globalAlpha = 1;
}

function drawCaught(ctx, g, now) {
  // The farm at dusk, the farmer holding his prize.
  const grad = ctx.createLinearGradient(0, 0, 0, CFG.height);
  grad.addColorStop(0, '#7c4a21');
  grad.addColorStop(1, '#3d2410');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CFG.width, CFG.height);

  ctx.fillStyle = '#5d3a1a';
  ctx.fillRect(0, CFG.groundY, CFG.width, CFG.height - CFG.groundY);

  // Farmer with the turkey tucked under his arm.
  const savedFx = g.farmer.x;
  g.farmer.x = 760;
  g.farmer.state = 'chase';
  g.farmer.bob = 0;
  g.farmer.draw(ctx, now);
  g.farmer.x = savedFx;

  centerText(ctx, 'CAUGHT!', CFG.width / 2, 150, 'bold 96px Trebuchet MS, sans-serif', COLORS.warnRed);
  centerText(ctx, 'Dinner is served... and it is you.', CFG.width / 2, 226, '30px Trebuchet MS, sans-serif', '#fff');
  centerText(
    ctx,
    `Score: ${Math.floor(g.score)}    Distance: ${Math.floor(g.distance)} m    Corn: ${g.corn}`,
    CFG.width / 2, 330, 'bold 34px Trebuchet MS, sans-serif', '#ffe9b0'
  );
  centerText(ctx, `Best escape: ${Math.floor(g.best)} m`, CFG.width / 2, 386, '28px Trebuchet MS, sans-serif', '#fff');
  const blink = 0.65 + Math.sin(now * 4) * 0.35;
  ctx.globalAlpha = blink;
  centerText(ctx, 'Press R or click to run again', CFG.width / 2, 470, 'bold 34px Trebuchet MS, sans-serif', '#ffe9b0');
  ctx.globalAlpha = 1;
}
