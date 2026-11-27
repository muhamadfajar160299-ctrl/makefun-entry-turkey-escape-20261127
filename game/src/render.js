// All drawing for The Great Turkey Getaway.
// One job: paint every screen (title, run, caught, escaped) on the canvas.

function drawBackground(ctx, game) {
  const stage = stageFor(game.world.distance);
  const w = CONFIG.canvasWidth;
  const h = CONFIG.canvasHeight;
  const sky = ctx.createLinearGradient(0, 0, 0, CONFIG.groundY);
  sky.addColorStop(0, stage.skyTop);
  sky.addColorStop(1, stage.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, CONFIG.groundY);

  if (stage.key === "kitchen") {
    ctx.fillStyle = "#ffd23e";
    ctx.beginPath();
    ctx.arc(830, 110, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#20242a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(830, 0);
    ctx.lineTo(830, 88);
    ctx.stroke();
  } else {
    ctx.fillStyle = "rgba(255, 244, 200, 0.9)";
    ctx.beginPath();
    ctx.arc(830, 70, 34, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.85)";
    for (const c of game.world.clouds) {
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, 46 * c.s, 16 * c.s, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x + 30 * c.s, c.y + 6 * c.s, 34 * c.s, 13 * c.s, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = stage.hill;
  if (stage.key === "kitchen") {
    ctx.fillStyle = "#6e3a28";
    ctx.fillRect(0, CONFIG.groundY - 64, w, 64);
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2;
    for (let x = 0; x < w; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, CONFIG.groundY - 64);
      ctx.lineTo(x, CONFIG.groundY);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(0, CONFIG.groundY - 32);
    ctx.lineTo(w, CONFIG.groundY - 32);
    ctx.stroke();
    ctx.fillStyle = "#8a5a34";
    ctx.fillRect(0, CONFIG.groundY - 8, w, 8);
  } else {
    ctx.beginPath();
    ctx.moveTo(0, CONFIG.groundY);
    ctx.quadraticCurveTo(240, CONFIG.groundY - 90, 480, CONFIG.groundY - 20);
    ctx.quadraticCurveTo(720, CONFIG.groundY - 80, w, CONFIG.groundY - 10);
    ctx.lineTo(w, CONFIG.groundY);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = stage.ground;
  ctx.fillRect(0, CONFIG.groundY, w, h - CONFIG.groundY);
  ctx.fillStyle = stage.grass;
  ctx.fillRect(0, CONFIG.groundY, w, 10);

  ctx.strokeStyle = "rgba(0,0,0,0.15)";
  ctx.lineWidth = 2;
  for (let x = -((game.world.distance * 24) % 48); x < w; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, CONFIG.groundY + 22);
    ctx.lineTo(x + 24, CONFIG.groundY + 22);
    ctx.stroke();
  }
}

function drawTurkeyShape(ctx, x, y, w, h, runPhase, ducking, invulnerable, time) {
  if (invulnerable > 0 && Math.floor(time * 14) % 2 === 0) return;
  const bodyY = ducking ? y + 20 : y;
  const bodyH = ducking ? h - 20 : h;
  ctx.save();
  ctx.translate(x + w / 2, bodyY + bodyH / 2);

  ctx.fillStyle = "#8a5a2b";
  for (let i = -2; i <= 2; i++) {
    ctx.save();
    ctx.rotate(i * 0.42);
    ctx.beginPath();
    ctx.ellipse(-w * 0.42, -bodyH * 0.18, 13, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = "#a06a35";
  ctx.beginPath();
  ctx.ellipse(0, 2, w * 0.42, bodyH * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();

  const wingSwing = Math.sin(runPhase) * 6;
  ctx.fillStyle = "#7a4e24";
  ctx.beginPath();
  ctx.ellipse(-4, 2 + wingSwing * 0.3, 16, 11, -0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#c98a4a";
  ctx.beginPath();
  ctx.arc(w * 0.34, -bodyH * 0.34, 13, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e8912d";
  ctx.beginPath();
  ctx.moveTo(w * 0.34 + 10, -bodyH * 0.36);
  ctx.lineTo(w * 0.34 + 24, -bodyH * 0.32);
  ctx.lineTo(w * 0.34 + 10, -bodyH * 0.28);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#d23b2e";
  ctx.beginPath();
  ctx.ellipse(w * 0.34 + 13, -bodyH * 0.26, 4, 7, 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#20242a";
  ctx.beginPath();
  ctx.arc(w * 0.34 + 4, -bodyH * 0.38, 2.6, 0, Math.PI * 2);
  ctx.fill();

  const legSwing = Math.sin(runPhase) * 7;
  ctx.strokeStyle = "#e8912d";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-6, bodyH * 0.4);
  ctx.lineTo(-6 + legSwing, bodyH * 0.52);
  ctx.moveTo(8, bodyH * 0.4);
  ctx.lineTo(8 - legSwing, bodyH * 0.52);
  ctx.stroke();
  ctx.restore();
}

function drawFarmerShape(ctx, farmer, time) {
  const x = farmerScreenX(farmer);
  if (x < -80) return;
  const groundY = CONFIG.groundY;
  const bob = Math.abs(Math.sin(farmer.stepPhase)) * 4;
  ctx.save();
  ctx.translate(x + 40, groundY - bob);

  ctx.strokeStyle = "#5e3a1a";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(26, -118);
  ctx.lineTo(44, -58);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(36, -100);
  ctx.lineTo(24, -92);
  ctx.moveTo(36, -100);
  ctx.lineTo(48, -92);
  ctx.stroke();

  ctx.fillStyle = "#3b5bdb";
  ctx.fillRect(-14, -72, 52, 34);
  ctx.fillStyle = "#2f4fb8";
  ctx.fillRect(-14, -72, 52, 10);
  ctx.fillStyle = "#31437a";
  ctx.fillRect(-10, -40, 16, 40);
  ctx.fillRect(22, -40, 16, 40);

  ctx.fillStyle = "#e8b98a";
  ctx.beginPath();
  ctx.arc(12, -86, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#8a5a2b";
  ctx.beginPath();
  ctx.arc(12, -94, 15, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#6b4423";
  ctx.fillRect(-8, -102, 40, 8);
  ctx.fillRect(2, -116, 20, 16);

  ctx.fillStyle = "#20242a";
  ctx.beginPath();
  ctx.arc(17, -88, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#7a3b2e";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(6, -78);
  ctx.lineTo(18, -78);
  ctx.stroke();

  ctx.fillStyle = "#e8b98a";
  ctx.beginPath();
  ctx.arc(40, -58, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (farmer.searching) {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText("?", x + 66, groundY - 128);
  }
  if (farmer.shoutTimer > 0 && farmer.shout) {
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#20242a";
    ctx.lineWidth = 3;
    ctx.font = "bold 17px sans-serif";
    const tw = ctx.measureText(farmer.shout).width;
    ctx.fillRect(x + 30, groundY - 168, tw + 18, 30);
    ctx.strokeRect(x + 30, groundY - 168, tw + 18, 30);
    ctx.fillStyle = "#20242a";
    ctx.fillText(farmer.shout, x + 39, groundY - 147);
  }
}

function drawObstacle(ctx, o, time) {
  const x = o.x;
  const y = o.y;
  if (o.kind === "fence") {
    ctx.fillStyle = "#7a4e24";
    ctx.fillRect(x, y, 8, o.h);
    ctx.fillRect(x + o.w - 8, y, 8, o.h);
    ctx.fillStyle = "#96683a";
    ctx.fillRect(x - 4, y + 12, o.w + 8, 9);
    ctx.fillRect(x - 4, y + 34, o.w + 8, 9);
  } else if (o.kind === "pumpkin") {
    ctx.fillStyle = "#e07820";
    ctx.beginPath();
    ctx.ellipse(x + o.w / 2, y + o.h / 2 + 4, o.w / 2, o.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#b85c10";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + o.w / 2, y + 4);
    ctx.quadraticCurveTo(x + o.w / 2 - 8, y + o.h / 2, x + o.w / 2, y + o.h);
    ctx.stroke();
    ctx.fillStyle = "#4d7a2e";
    ctx.fillRect(x + o.w / 2 - 3, y - 6, 6, 10);
  } else if (o.kind === "haybale") {
    ctx.fillStyle = "#d9a83e";
    ctx.beginPath();
    ctx.arc(x + o.w / 2, y + o.h / 2, o.w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#b8892a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + o.w / 2, y + o.h / 2, o.w / 2 - 10, 0, Math.PI * 2);
    ctx.stroke();
  } else if (o.kind === "pin") {
    ctx.save();
    ctx.translate(x + o.w / 2, y + o.h / 2);
    ctx.rotate(Math.sin(time * 3 + o.phase) * 0.25);
    ctx.fillStyle = "#c9a06a";
    ctx.fillRect(-o.w / 2, -9, o.w, 18);
    ctx.fillStyle = "#8a6a42";
    ctx.beginPath();
    ctx.arc(-o.w / 2 - 4, 0, 6, 0, Math.PI * 2);
    ctx.arc(o.w / 2 + 4, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (o.kind === "knife") {
    ctx.save();
    ctx.translate(x + o.w / 2, y + o.h / 2);
    ctx.rotate(-0.25 + Math.sin(time * 6 + o.phase) * 0.06);
    ctx.fillStyle = "#dfe6ee";
    ctx.beginPath();
    ctx.moveTo(-o.w / 2, -5);
    ctx.lineTo(o.w / 2 - 12, -6);
    ctx.lineTo(o.w / 2, 0);
    ctx.lineTo(o.w / 2 - 12, 6);
    ctx.lineTo(-o.w / 2, 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#5e3a1a";
    ctx.fillRect(-o.w / 2 - 12, -5, 12, 10);
    ctx.restore();
  } else if (o.kind === "oven") {
    ctx.fillStyle = "#3c3f46";
    ctx.fillRect(x, y, o.w, o.h);
    ctx.fillStyle = "#20242a";
    ctx.fillRect(x + 10, y + 14, o.w - 20, o.h - 30);
    if (o.flame) {
      ctx.fillStyle = "#ff7b24";
      ctx.beginPath();
      ctx.moveTo(x + 18, y + 14);
      ctx.quadraticCurveTo(x + 30, y - 26, x + 42, y + 14);
      ctx.quadraticCurveTo(x + 54, y - 18, x + 66, y + 14);
      ctx.quadraticCurveTo(x + 78, y - 22, x + o.w - 14, y + 14);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ffd23e";
      ctx.beginPath();
      ctx.moveTo(x + 32, y + 14);
      ctx.quadraticCurveTo(x + 44, y - 8, x + 56, y + 14);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = "#ff9a3d";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText("HOT!", x + 30, y + 30);
    }
    ctx.fillStyle = "#c9ced6";
    ctx.fillRect(x + 14, y + o.h - 12, o.w - 28, 5);
  } else if (o.kind === "pot") {
    ctx.fillStyle = "#2e3138";
    ctx.beginPath();
    ctx.ellipse(x + o.w / 2, y + 14, o.w / 2, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x, y + 12, o.w, o.h - 18);
    ctx.fillStyle = "#ffcf5c";
    ctx.beginPath();
    ctx.ellipse(x + o.w / 2, y + 8, o.w / 2 - 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCorn(ctx, c, time) {
  const bobY = Math.sin(time * 4 + c.bob) * 3;
  ctx.fillStyle = "#ffd23e";
  ctx.beginPath();
  ctx.ellipse(c.x + c.w / 2, c.y + c.h / 2 + bobY, 9, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e8a91c";
  ctx.beginPath();
  ctx.ellipse(c.x + c.w / 2, c.y + c.h / 2 + bobY, 9, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#c98f0e";
  ctx.lineWidth = 1.5;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(c.x + c.w / 2 + i * 5, c.y + 2 + bobY);
    ctx.lineTo(c.x + c.w / 2 + i * 5, c.y + c.h - 2 + bobY);
    ctx.stroke();
  }
  ctx.fillStyle = "#4d7a2e";
  ctx.fillRect(c.x + c.w / 2 - 2, c.y + c.h - 2 + bobY, 4, 8);
}

function drawHaystack(ctx, h) {
  ctx.fillStyle = "#e0b64a";
  ctx.beginPath();
  ctx.moveTo(h.x, h.y + h.h);
  ctx.quadraticCurveTo(h.x + h.w / 2, h.y - 14, h.x + h.w, h.y + h.h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#b8892a";
  ctx.lineWidth = 2;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(h.x + (h.w * i) / 4, h.y + 18);
    ctx.lineTo(h.x + (h.w * i) / 4, h.y + h.h - 6);
    ctx.stroke();
  }
}

function drawHud(ctx, game) {
  const w = CONFIG.canvasWidth;
  ctx.fillStyle = "rgba(20, 14, 8, 0.55)";
  ctx.fillRect(0, 0, w, 52);
  ctx.fillStyle = "#ffe9b0";
  ctx.font = "bold 20px sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText("SCORE " + game.score, 16, 26);
  const stage = stageFor(game.world.distance);
  ctx.fillText(stage.name, 300, 26);
  ctx.fillText(Math.floor(game.world.distance) + " m", 560, 26);

  for (let i = 0; i < CONFIG.startLives; i++) {
    const hx = 700 + i * 30;
    ctx.fillStyle = i < game.lives ? "#e23b3b" : "rgba(255,255,255,0.25)";
    ctx.beginPath();
    ctx.moveTo(hx, 32);
    ctx.bezierCurveTo(hx - 9, 22, hx - 18, 30, hx, 42);
    ctx.bezierCurveTo(hx + 18, 30, hx + 9, 22, hx, 32);
    ctx.fill();
  }

  const fx = 800;
  const fw = 140;
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillRect(fx, 16, fw, 14);
  const danger = game.farmer.proximity;
  ctx.fillStyle = danger > 0.7 ? "#e23b3b" : danger > 0.4 ? "#ff9a3d" : "#7da23f";
  ctx.fillRect(fx, 16, fw * danger, 14);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 12px sans-serif";
  ctx.fillText("FARMER", fx, 40);

  if (game.world.stageFlash > 0) {
    ctx.fillStyle = "rgba(20, 14, 8," + Math.min(0.7, game.world.stageFlash) + ")";
    ctx.fillRect(0, 200, w, 70);
    ctx.fillStyle = "#ffe9b0";
    ctx.font = "bold 34px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(stage.name, w / 2, 232);
    ctx.font = "18px sans-serif";
    ctx.fillText(stage.hint, w / 2, 260);
    ctx.textAlign = "left";
  }
  ctx.textBaseline = "alphabetic";
}

function drawTitle(ctx, game, time) {
  drawBackground(ctx, game);
  ctx.fillStyle = "rgba(20, 14, 8, 0.28)";
  ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);

  drawTurkeyShape(ctx, 70, 330, 120, 104, time * 2, false, 0, time);
  drawFarmerShape(ctx, { proximity: 0.3, searching: false, searchTimer: 0, stepPhase: time * 4, shoutTimer: 0, shout: "" }, time);

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffe9b0";
  ctx.font = "bold 58px sans-serif";
  ctx.fillText("THE GREAT", CONFIG.canvasWidth / 2, 120);
  ctx.fillStyle = "#ff9a3d";
  ctx.font = "bold 64px sans-serif";
  ctx.fillText("TURKEY GETAWAY", CONFIG.canvasWidth / 2, 185);
  ctx.fillStyle = "#fff";
  ctx.font = "20px sans-serif";
  ctx.fillText("Thanksgiving is coming. The farmer is coming faster.", CONFIG.canvasWidth / 2, 225);
  ctx.fillText("Run, jump, duck — and do NOT become dinner.", CONFIG.canvasWidth / 2, 252);

  const pulse = 0.6 + Math.sin(time * 4) * 0.4;
  ctx.fillStyle = "rgba(255, 233, 176," + pulse + ")";
  ctx.font = "bold 26px sans-serif";
  ctx.fillText("SPACE / CLICK to start", CONFIG.canvasWidth / 2, 330);

  ctx.fillStyle = "#ffe9b0";
  ctx.font = "18px sans-serif";
  ctx.fillText("Jump: SPACE / W / ↑ / click      Duck & hide: ↓ / S      Pause: P      Mute: M", CONFIG.canvasWidth / 2, 380);
  ctx.fillText("Grab corn for points. Duck inside a haystack to lose the farmer.", CONFIG.canvasWidth / 2, 408);
  ctx.fillText("Reach the forest gate at 1400 m to escape!", CONFIG.canvasWidth / 2, 436);
  if (game.best > 0) {
    ctx.fillStyle = "#ffd23e";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("Best escape: " + Math.floor(game.best) + " m", CONFIG.canvasWidth / 2, 478);
  }
  ctx.textAlign = "left";
}

function drawForest(ctx) {
  const w = CONFIG.canvasWidth;
  const h = CONFIG.canvasHeight;
  const sky = ctx.createLinearGradient(0, 0, 0, CONFIG.groundY);
  sky.addColorStop(0, "#2e7d32");
  sky.addColorStop(1, "#a5d6a7");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, CONFIG.groundY);
  ctx.fillStyle = "rgba(255, 244, 200, 0.9)";
  ctx.beginPath();
  ctx.arc(830, 70, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1b5e20";
  for (let x = 20; x < w; x += 110) {
    ctx.beginPath();
    ctx.moveTo(x, CONFIG.groundY);
    ctx.lineTo(x + 35, CONFIG.groundY - 150);
    ctx.lineTo(x + 70, CONFIG.groundY);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(x + 28, CONFIG.groundY - 18, 14, 18);
  }
  ctx.fillStyle = "#4a7c2f";
  ctx.fillRect(0, CONFIG.groundY, w, h - CONFIG.groundY);
  ctx.fillStyle = "#6aa84f";
  ctx.fillRect(0, CONFIG.groundY, w, 10);
}

function drawEnd(ctx, game, time) {
  if (game.state === "escaped") drawForest(ctx);
  else drawBackground(ctx, game);
  ctx.fillStyle = "rgba(20, 14, 8, 0.55)";
  ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
  ctx.textAlign = "center";
  if (game.state === "caught") {
    ctx.fillStyle = "#ff6b5e";
    ctx.font = "bold 62px sans-serif";
    ctx.fillText("CAUGHT!", CONFIG.canvasWidth / 2, 150);
    ctx.fillStyle = "#fff";
    ctx.font = "22px sans-serif";
    ctx.fillText("The farmer got you. Thanksgiving dinner is served...", CONFIG.canvasWidth / 2, 195);
    drawFarmerShape(ctx, { proximity: 1, searching: false, searchTimer: 0, stepPhase: 0, shoutTimer: 0, shout: "" }, time);
    drawTurkeyShape(ctx, 640, 380, 110, 96, 0, false, 0, time);
  } else {
    ctx.fillStyle = "#8be26b";
    ctx.font = "bold 62px sans-serif";
    ctx.fillText("ESCAPED!", CONFIG.canvasWidth / 2, 150);
    ctx.fillStyle = "#fff";
    ctx.font = "22px sans-serif";
    ctx.fillText("You made it to the forest. No dinner table for you!", CONFIG.canvasWidth / 2, 195);
    drawTurkeyShape(ctx, 690, 330, 130, 112, time * 3, false, 0, time);
  }
  ctx.fillStyle = "#ffe9b0";
  ctx.font = "bold 26px sans-serif";
  ctx.fillText("Score: " + game.score + "    Distance: " + Math.floor(game.world.distance) + " m    Corn: " + game.cornCount, CONFIG.canvasWidth / 2, 300);
  if (game.best > 0) {
    ctx.font = "20px sans-serif";
    ctx.fillText("Best escape: " + Math.floor(game.best) + " m", CONFIG.canvasWidth / 2, 336);
  }
  const pulse = 0.6 + Math.sin(time * 4) * 0.4;
  ctx.fillStyle = "rgba(255, 233, 176," + pulse + ")";
  ctx.font = "bold 26px sans-serif";
  ctx.fillText("Press R or click to run again", CONFIG.canvasWidth / 2, 400);
  ctx.textAlign = "left";
}

function drawPlay(ctx, game, time) {
  drawBackground(ctx, game);
  for (const h of game.world.haystacks) drawHaystack(ctx, h);
  for (const c of game.world.corns) drawCorn(ctx, c, time);
  for (const o of game.world.obstacles) drawObstacle(ctx, o, time);
  drawFarmerShape(ctx, game.farmer, time);
  drawTurkeyShape(ctx, game.turkey.x, game.turkey.y, game.turkey.w, game.turkey.h, game.turkey.runPhase, game.turkey.ducking, game.turkey.invulnerable, time);
  if (game.hidden) {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText("HIDDEN!", game.turkey.x + 10, game.turkey.y - 14);
  }
  if (game.farmer.proximity > 0.7) {
    const blink = Math.floor(time * 6) % 2 === 0;
    if (blink) {
      ctx.fillStyle = "#e23b3b";
      ctx.font = "bold 26px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("HE'S RIGHT BEHIND YOU!", CONFIG.canvasWidth / 2, 90);
      ctx.textAlign = "left";
    }
  }
  drawHud(ctx, game);
  if (game.paused) {
    ctx.fillStyle = "rgba(20, 14, 8, 0.6)";
    ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
    ctx.fillStyle = "#ffe9b0";
    ctx.font = "bold 48px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", CONFIG.canvasWidth / 2, 270);
    ctx.font = "20px sans-serif";
    ctx.fillText("Press P to keep running", CONFIG.canvasWidth / 2, 310);
    ctx.textAlign = "left";
  }
}

function drawFrame(ctx, game, time) {
  if (game.state === "title") drawTitle(ctx, game, time);
  else if (game.state === "play") drawPlay(ctx, game, time);
  else drawEnd(ctx, game, time);
}
