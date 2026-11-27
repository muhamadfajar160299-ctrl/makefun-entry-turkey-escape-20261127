// The turkey: the player.
// One job: the turkey's body, jumps, ducks and hurt state.

function makeTurkey() {
  return {
    x: 180,
    y: CONFIG.groundY - 56,
    w: 64,
    h: 56,
    vy: 0,
    grounded: true,
    ducking: false,
    runPhase: 0,
    invulnerable: 0,
    flash: 0,
  };
}

function updateTurkey(turkey, input, dt) {
  turkey.ducking = input.duckHeld && turkey.grounded;
  if (input.jumpQueued && turkey.grounded) {
    turkey.vy = CONFIG.jumpVelocity;
    turkey.grounded = false;
    turkey.ducking = false;
    SoundBank.playJump();
  }
  input.jumpQueued = false;
  if (!turkey.grounded) {
    turkey.vy += CONFIG.gravity * dt;
    turkey.y += turkey.vy * dt;
    if (turkey.y >= CONFIG.groundY - turkey.h) {
      turkey.y = CONFIG.groundY - turkey.h;
      turkey.vy = 0;
      turkey.grounded = true;
    }
  }
  turkey.runPhase += dt * 11;
  if (turkey.invulnerable > 0) turkey.invulnerable -= dt;
  if (turkey.flash > 0) turkey.flash -= dt;
}

function resetTurkey(turkey) {
  turkey.x = 180;
  turkey.y = CONFIG.groundY - 56;
  turkey.vy = 0;
  turkey.grounded = true;
  turkey.ducking = false;
  turkey.runPhase = 0;
  turkey.invulnerable = 0;
  turkey.flash = 0;
}
