// Synthesized sound effects for The Great Turkey Getaway.
// One job: every noise the game makes, built with WebAudio oscillators.
// No audio files are loaded; everything is generated at run time.

const SoundBank = {
  ctx: null,
  muted: false,

  ensure() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      } catch (e) {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  },

  tone(freq, dur, type, vol, slideTo) {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
    gain.gain.setValueAtTime(vol || 0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur + 0.02);
  },

  playJump() {
    this.tone(320, 0.14, "sine", 0.12, 620);
  },

  playCorn() {
    this.tone(880, 0.09, "triangle", 0.12);
    const self = this;
    setTimeout(function () { self.tone(1320, 0.12, "triangle", 0.1); }, 60);
  },

  playStumble() {
    this.tone(180, 0.18, "sawtooth", 0.14, 70);
  },

  playHit() {
    this.tone(220, 0.25, "square", 0.14, 55);
  },

  playKnife() {
    this.tone(1400, 0.16, "sawtooth", 0.06, 500);
  },

  playAlarm() {
    this.tone(520, 0.12, "square", 0.09, 780);
    const self = this;
    setTimeout(function () { self.tone(780, 0.12, "square", 0.09, 520); }, 130);
  },

  playGobble() {
    const self = this;
    [0, 110, 220, 330].forEach(function (delay, i) {
      setTimeout(function () {
        self.tone(i % 2 ? 300 : 380, 0.09, "sawtooth", 0.11, 180);
      }, delay);
    });
  },

  playCaught() {
    this.tone(392, 0.2, "sawtooth", 0.13, 370);
    const self = this;
    setTimeout(function () { self.tone(370, 0.2, "sawtooth", 0.13, 330); }, 200);
    setTimeout(function () { self.tone(330, 0.45, "sawtooth", 0.13, 165); }, 400);
  },

  playEscaped() {
    const self = this;
    [523, 659, 784, 1047].forEach(function (freq, i) {
      setTimeout(function () { self.tone(freq, 0.22, "triangle", 0.12); }, i * 130);
    });
  },

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  },
};
