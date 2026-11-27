// Keyboard and mouse input for The Great Turkey Getaway.
// One job: turn keys and clicks into game intents (jump, duck, pause, restart).

function makeInput() {
  return {
    jumpQueued: false,
    duckHeld: false,
    restartQueued: false,
    pauseQueued: false,
    muteQueued: false,
    anyQueued: false,
  };
}

function bindInput(input, canvas, callbacks) {
  function queueJump() {
    input.jumpQueued = true;
    input.anyQueued = true;
  }

  function onKeyDown(event) {
    const code = event.code;
    if (code === "Space" || code === "ArrowUp" || code === "KeyW") {
      event.preventDefault();
      if (!event.repeat) queueJump();
    } else if (code === "ArrowDown" || code === "KeyS") {
      event.preventDefault();
      input.duckHeld = true;
    } else if (code === "KeyR") {
      input.restartQueued = true;
      input.anyQueued = true;
    } else if (code === "KeyP" || code === "Escape") {
      input.pauseQueued = true;
    } else if (code === "KeyM") {
      input.muteQueued = true;
    } else if (code === "Enter") {
      input.anyQueued = true;
    }
  }

  function onKeyUp(event) {
    const code = event.code;
    if (code === "ArrowDown" || code === "KeyS") input.duckHeld = false;
  }

  function onPointerDown(event) {
    event.preventDefault();
    queueJump();
    if (callbacks && callbacks.onPointer) callbacks.onPointer(event);
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("contextmenu", function (event) { event.preventDefault(); });
}

function consumeJump(input) {
  const queued = input.jumpQueued;
  input.jumpQueued = false;
  return queued;
}

function consumeAny(input) {
  const queued = input.anyQueued;
  input.anyQueued = false;
  input.restartQueued = false;
  return queued;
}

function consumeRestart(input) {
  const queued = input.restartQueued;
  input.restartQueued = false;
  return queued;
}

function consumePause(input) {
  const queued = input.pauseQueued;
  input.pauseQueued = false;
  return queued;
}

function consumeMute(input) {
  const queued = input.muteQueued;
  input.muteQueued = false;
  return queued;
}
