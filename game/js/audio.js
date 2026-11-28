// The Great Turkey Escape — sound effects.
// Every sound is synthesized with the Web Audio API: no audio files,
// no network, nothing to load. All calls are safe before the first
// user gesture and when the browser has no audio device.

export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      return ctx;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch (err) {
      ctx = null;
    }
    return ctx;
  }

  function tone(freq, dur, type, gain, slideTo) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    try {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, ac.currentTime);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + dur);
      g.gain.setValueAtTime(gain || 0.12, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
      osc.connect(g).connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + dur);
    } catch (err) {
      // Sound is garnish; a failure here must never break the game.
    }
  }

  function noise(dur, gain, filterFreq) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    try {
      const len = Math.floor(ac.sampleRate * dur);
      const buf = ac.createBuffer(1, len, ac.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ac.createBufferSource();
      src.buffer = buf;
      const filter = ac.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = filterFreq || 1200;
      const g = ac.createGain();
      g.gain.setValueAtTime(gain || 0.15, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
      src.connect(filter).connect(g).connect(ac.destination);
      src.start();
    } catch (err) {
      // Sound is garnish; a failure here must never break the game.
    }
  }

  return {
    ensure,
    toggleMute() {
      muted = !muted;
      return muted;
    },
    get muted() {
      return muted;
    },
    click() {
      tone(660, 0.06, 'square', 0.06);
    },
    jump() {
      tone(280, 0.16, 'sine', 0.1, 620);
    },
    land() {
      noise(0.06, 0.08, 300);
    },
    corn() {
      tone(880, 0.08, 'sine', 0.1);
      setTimeout(() => tone(1320, 0.1, 'sine', 0.08), 55);
    },
    stumble() {
      tone(160, 0.2, 'sawtooth', 0.14, 70);
      noise(0.12, 0.12, 400);
    },
    knifeWhoosh() {
      noise(0.35, 0.16, 2400);
    },
    knifeGlint() {
      tone(1800, 0.12, 'sine', 0.06, 2600);
    },
    hide() {
      tone(520, 0.14, 'triangle', 0.1, 780);
    },
    lostHim() {
      tone(523, 0.12, 'sine', 0.1);
      setTimeout(() => tone(659, 0.12, 'sine', 0.1), 100);
      setTimeout(() => tone(784, 0.2, 'sine', 0.1), 200);
    },
    spotted() {
      tone(220, 0.25, 'square', 0.1, 110);
    },
    farmerGrunt() {
      tone(90, 0.18, 'sawtooth', 0.1, 60);
    },
    heatWave() {
      noise(0.3, 0.12, 900);
    },
    gobble() {
      // Two quick gobbles: a low wobble each.
      tone(180, 0.12, 'sawtooth', 0.12, 120);
      setTimeout(() => tone(170, 0.12, 'sawtooth', 0.12, 110), 140);
      setTimeout(() => tone(190, 0.16, 'sawtooth', 0.12, 120), 300);
    },
    caught() {
      tone(392, 0.25, 'sawtooth', 0.12, 196);
      setTimeout(() => tone(311, 0.3, 'sawtooth', 0.12, 155), 220);
      setTimeout(() => tone(233, 0.5, 'sawtooth', 0.12, 110), 480);
    },
    escaped() {
      const notes = [523, 659, 784, 1046];
      notes.forEach((n, i) => setTimeout(() => tone(n, 0.22, 'triangle', 0.11), i * 130));
    },
    stageUp() {
      tone(440, 0.1, 'triangle', 0.1);
      setTimeout(() => tone(587, 0.14, 'triangle', 0.1), 90);
      setTimeout(() => tone(880, 0.2, 'triangle', 0.1), 180);
    },
  };
}
