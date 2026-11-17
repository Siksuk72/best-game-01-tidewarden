// WebAudio: all SFX are synthesized oscillators / filtered noise — no audio files, no network.
// Music is a quiet minor-key arpeggio loop scheduled from the game loop.

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.musicOn = true;
    this.musicTimer = 0;
    this.musicStep = 0;
    // A-minor harbour arpeggio: A2 C3 E3 A3 C4 E4 A4 E4 ...
    this.melody = [110, 130.81, 164.81, 220, 261.63, 329.63, 440, 329.63, 261.63, 220, 164.81, 130.81];
    this.musicStepDur = 0.34;
  }

  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);
    } catch { /* audio unavailable: game stays silent */ }
  }

  setMuted(m) {
    this.muted = m;
    if (this.master && this.ctx) this.master.gain.setValueAtTime(m ? 0 : 0.5, this.ctx.currentTime);
  }

  tone(freq, dur, type, vol, slideTo, delay = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(this.master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }

  noise(dur, vol, filterFreq, delay = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = filterFreq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t0);
  }

  shoot() { this.tone(720, 0.07, 'square', 0.05, 320); }
  cannon() { this.noise(0.22, 0.16, 500); this.tone(120, 0.18, 'sine', 0.14, 45); }
  zap() { this.tone(1400, 0.12, 'sawtooth', 0.07, 180); this.noise(0.08, 0.05, 4000); }
  frost() { this.tone(980, 0.16, 'sine', 0.04, 1400); }
  hit() { this.tone(220, 0.05, 'triangle', 0.05, 140); }
  coin() { this.tone(880, 0.09, 'sine', 0.07); this.tone(1320, 0.12, 'sine', 0.06, null, 0.07); }
  leak() { this.tone(196, 0.4, 'sawtooth', 0.12, 65); this.noise(0.3, 0.1, 300); }
  build() { this.tone(330, 0.1, 'triangle', 0.09); this.tone(495, 0.14, 'triangle', 0.09, null, 0.08); }
  upgrade() { this.tone(392, 0.1, 'triangle', 0.09); this.tone(523, 0.1, 'triangle', 0.09, null, 0.07); this.tone(659, 0.16, 'triangle', 0.09, null, 0.14); }
  sell() { this.tone(523, 0.1, 'sine', 0.08, 330); }
  waveHorn() { this.tone(146.83, 0.5, 'sawtooth', 0.08, 146.83); this.tone(220, 0.5, 'sawtooth', 0.06, 220, 0.05); }
  surge() { this.noise(0.6, 0.12, 900); this.tone(180, 0.6, 'sine', 0.08, 420); }
  flare() { this.noise(0.35, 0.14, 2500); this.tone(1046, 0.2, 'sine', 0.07, 523); }
  roar() { this.tone(70, 0.9, 'sawtooth', 0.16, 38); this.noise(0.8, 0.14, 250); }
  victory() { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.09, null, i * 0.14)); }
  defeat() { [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.4, 'triangle', 0.09, null, i * 0.18)); }

  // Called from the game loop with dt; schedules one quiet pluck per step.
  updateMusic(dt) {
    if (!this.ctx || this.muted || !this.musicOn) return;
    this.musicTimer -= dt;
    if (this.musicTimer > 0) return;
    this.musicTimer = this.musicStepDur;
    const f = this.melody[this.musicStep % this.melody.length];
    this.musicStep += 1;
    this.tone(f, 0.5, 'triangle', 0.035);
    if (this.musicStep % 4 === 0) this.tone(f / 2, 0.9, 'sine', 0.03);
  }
}
