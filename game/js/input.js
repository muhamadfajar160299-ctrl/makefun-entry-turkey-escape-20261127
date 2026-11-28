// The Great Turkey Escape — keyboard, mouse and touch input.
// The game reads edges (a press that happened this frame) and held
// state (duck). Edges are consumed by the game and cleared each frame,
// so one keypress can never fire twice.

export function createInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  let jumpQueued = false;

  function actionFor(code) {
    if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW' || code === 'Enter') return 'jump';
    if (code === 'ArrowDown' || code === 'KeyS') return 'duck';
    if (code === 'KeyP' || code === 'Escape') return 'pause';
    if (code === 'KeyM') return 'mute';
    if (code === 'KeyR') return 'restart';
    return null;
  }

  function onKeyDown(ev) {
    const action = actionFor(ev.code);
    if (!action) return;
    if (ev.code === 'Space' || ev.code === 'ArrowUp' || ev.code === 'ArrowDown') {
      ev.preventDefault();
    }
    if (ev.repeat) return;
    held.add(action);
    pressed.add(action);
    if (action === 'jump') jumpQueued = true;
  }

  function onKeyUp(ev) {
    const action = actionFor(ev.code);
    if (!action) return;
    held.delete(action);
  }

  function onPointerDown(ev) {
    ev.preventDefault();
    held.add('jump');
    pressed.add('jump');
    pressed.add('click');
    jumpQueued = true;
  }

  function onPointerUp() {
    held.delete('jump');
  }

  function onBlur() {
    held.clear();
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('mousedown', onPointerDown);
  canvas.addEventListener('mouseup', onPointerUp);
  canvas.addEventListener('touchstart', onPointerDown, { passive: false });
  canvas.addEventListener('touchend', onPointerUp);

  return {
    // True while the duck key (or touch hold) is down.
    get duckHeld() {
      return held.has('duck');
    },
    // True if a jump was pressed since the last frame; clears on read.
    takeJump() {
      const q = jumpQueued;
      jumpQueued = false;
      return q;
    },
    // True once if the action was pressed since the last frame.
    take(name) {
      if (!pressed.has(name)) return false;
      pressed.delete(name);
      return true;
    },
    // True if anything at all was pressed since the last frame.
    takeAny() {
      if (pressed.size === 0) return false;
      pressed.clear();
      jumpQueued = false;
      return true;
    },
    // Drop edges left unread at the end of a frame.
    endFrame() {
      pressed.clear();
      jumpQueued = false;
    },
  };
}
