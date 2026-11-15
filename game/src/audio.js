// All sound is synthesised with WebAudio — no audio files, no network.
// Short oscillator blips for shots, coins and hits; a quiet pentatonic
// arpeggio drifts underneath while a wave is running. M toggles mute.

export class AudioSys {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicTimer = 0;
    this.musicStep = 0;
    this.notes = [220, 261.63, 293.66, 329.63, 392, 440, 523.25];
  }

  ensure() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      } catch (e) { this.ctx = null; }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  tone(freq, dur, type, vol, slideTo) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(vol || 0.08, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  shoot(kind) {
    if (kind === 'cannon') this.tone(160, 0.18, 'triangle', 0.10, 60);
    else if (kind === 'frost') this.tone(880, 0.12, 'sine', 0.05, 1320);
    else if (kind === 'spark') this.tone(1200, 0.08, 'sawtooth', 0.04, 300);
    else this.tone(660, 0.07, 'square', 0.035, 440);
  }

  hit() { this.tone(240, 0.06, 'triangle', 0.04, 140); }
  coin() { this.tone(990, 0.09, 'sine', 0.06, 1480); }
  leak() { this.tone(110, 0.35, 'sawtooth', 0.14, 55); }
  build() { this.tone(330, 0.12, 'triangle', 0.08, 660); }
  upgrade() { this.tone(523, 0.1, 'sine', 0.08, 784); this.tone(784, 0.14, 'sine', 0.06, 1046); }
  horn() { this.tone(196, 0.4, 'sawtooth', 0.09, 196); this.tone(294, 0.4, 'sawtooth', 0.06, 294); }
  victory() {
    [523, 659, 784, 1046].forEach((f, i) => {
      setTimeout(() => this.tone(f, 0.35, 'sine', 0.09), i * 140);
    });
  }
  defeat() {
    [392, 330, 262, 196].forEach((f, i) => {
      setTimeout(() => this.tone(f, 0.4, 'triangle', 0.09), i * 170);
    });
  }

  // One soft note every half second while waves run; volume stays low.
  musicTick(dt, playing) {
    if (!this.ctx || this.muted || !playing) return;
    this.musicTimer += dt;
    if (this.musicTimer < 0.55) return;
    this.musicTimer = 0;
    const seq = [0, 2, 4, 3, 5, 4, 2, 1];
    const n = this.notes[seq[this.musicStep % seq.length]];
    this.musicStep++;
    this.tone(n, 0.5, 'sine', 0.022);
  }
}
