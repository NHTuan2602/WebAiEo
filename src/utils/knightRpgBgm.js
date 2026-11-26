// ==========================================
// PROCEDURAL WEB AUDIO RPG BACKGROUND MUSIC (BGM) ENGINE
// Distinct loopable fantasy soundtrack for Hub + Stages 1–4 + Secret Boss Warning & Battle
// Zero external audio downloads — crisp Web Audio synthesis, gentle volume under TTS
// ==========================================

const NOTE_FREQ = {
  // Octave 2
  A2: 110.0, Bb2: 116.54, B2: 123.47,
  // Octave 3
  C3: 130.81, Cs3: 138.59, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61,
  Fs3: 185.0, G3: 196.0, Gs3: 207.65, A3: 220.0, Bb3: 233.08, B3: 246.94,
  // Octave 4
  C4: 261.63, Cs4: 277.18, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23,
  Fs4: 369.99, G4: 392.0, Gs4: 415.3, A4: 440.0, Bb4: 466.16, B4: 493.88,
  // Octave 5
  C5: 523.25, Cs5: 554.37, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46,
  Fs5: 739.99, G5: 783.99, Gs5: 830.61, A5: 880.0, Bb5: 932.33, B5: 987.77,
  // Octave 6
  C6: 1046.5, Cs6: 1108.73, D6: 1174.66
};

export const KNIGHT_BGM_TRACKS = {
  hub: {
    label: 'Sảnh Lâu Đài',
    bpm: 96,
    leadWave: 'triangle',
    bassWave: 'sine',
    leadGain: 0.085,
    bassGain: 0.075,
    percussion: false,
    // Medieval harp-like D Dorian progression (16 steps = 2 bars of 8th notes)
    lead: ['D4', 'F4', 'A4', 'C5', 'A4', 'F4', 'G4', 'A4', 'C4', 'E4', 'G4', 'B4', 'A4', 'G4', 'E4', 'D4'],
    bass: ['D3', null, null, null, 'C3', null, null, null, 'Bb2', null, null, null, 'A2', null, null, null]
  },
  gacha: {
    label: 'Cầu Nguyện Sao Băng',
    bpm: 108,
    leadWave: 'sine',
    harmonyWave: 'triangle',
    bassWave: 'triangle',
    leadGain: 0.088,
    harmonyGain: 0.045,
    bassGain: 0.068,
    percussion: 'celestial',
    // Dreamy F Lydian / Starlight Celesta progression inside Gacha Page
    lead: ['C5', 'E5', 'G5', 'B5', 'C6', 'B5', 'G5', 'E5', 'A4', 'C5', 'E5', 'G5', 'Fs5', 'G5', 'B5', 'D6'],
    harmony: ['E4', null, 'B4', null, 'E5', null, 'B4', null, 'C4', null, 'G4', null, 'D4', null, 'Fs4', null],
    bass: ['F3', null, 'C3', null, 'F3', null, 'C3', null, 'D3', null, 'A2', null, 'G3', null, 'D3', null]
  },
  roster: {
    label: 'Sảnh Nhân Vật',
    bpm: 104,
    leadWave: 'triangle',
    harmonyWave: 'sine',
    bassWave: 'sine',
    leadGain: 0.086,
    harmonyGain: 0.048,
    bassGain: 0.072,
    percussion: 'showcase',
    // Proud, stylish E Major / Lydian hero gallery theme
    lead: ['E5', 'Gs5', 'B5', 'Fs5', 'Gs5', 'E5', 'Cs5', 'B4', 'A4', 'Cs5', 'E5', 'Gs5', 'Fs5', 'E5', 'Eb5', 'B4'],
    harmony: ['Gs4', null, 'E5', null, 'B4', null, 'Gs4', null, 'E4', null, 'A4', null, 'B4', null, 'Fs4', null],
    bass: ['E3', null, 'B2', null, 'Cs3', null, 'Gs2', null, 'A2', null, 'E3', null, 'B2', null, 'B2', null]
  },
  pvp_lobby: {
    label: 'Đấu Trường 1 vs 1',
    bpm: 122,
    leadWave: 'sawtooth',
    harmonyWave: 'triangle',
    bassWave: 'square',
    leadGain: 0.058,
    harmonyGain: 0.042,
    bassGain: 0.068,
    percussion: 'duel_drums',
    // Gladiator war-room D Phrygian Dominant tension ostinato
    lead: ['D4', 'A4', 'Bb4', 'A4', 'Fs4', 'G4', 'A4', null, 'D4', 'A4', 'C5', 'Bb4', 'A4', 'G4', 'Fs4', null],
    harmony: ['A3', null, 'D4', null, 'D4', null, 'Fs4', null, 'A3', null, 'Eb4', null, 'D4', null, 'A3', null],
    bass: ['D3', 'D3', null, 'A2', 'Bb2', null, 'A2', 'D3', 'D3', 'D3', null, 'G2', 'Bb2', null, 'A2', null]
  },
  pvp_battle: {
    label: 'Quyết Đấu 1 vs 1',
    bpm: 158,
    leadWave: 'sawtooth',
    harmonyWave: 'square',
    bassWave: 'sawtooth',
    leadGain: 0.072,
    harmonyGain: 0.036,
    bassGain: 0.074,
    percussion: 'duel_intense',
    // High-adrenaline E Minor / Phrygian duel battle theme
    lead: ['E5', 'E5', 'G5', 'A5', 'B5', 'A5', 'G5', 'Fs5', 'E5', 'B5', 'C6', 'B5', 'A5', 'G5', 'Fs5', 'Eb5'],
    harmony: ['B4', null, 'E5', null, 'G5', null, 'E5', null, 'G4', null, 'E5', null, 'Fs4', null, 'B4', null],
    bass: ['E3', 'E3', 'B2', 'E3', 'C3', 'C3', 'G2', 'C3', 'A2', 'A2', 'E3', 'A2', 'B2', 'B2', 'Eb3', 'B2']
  },
  stage1: {
    label: 'Ải 1: Rừng Slime',
    bpm: 126,
    leadWave: 'triangle',
    bassWave: 'triangle',
    leadGain: 0.095,
    bassGain: 0.08,
    percussion: 'light',
    // Upbeat adventurous RPG overworld theme (C Major)
    lead: ['C5', 'E5', 'G5', null, 'A5', 'G5', 'E5', 'D5', 'C5', 'D5', 'E5', 'G5', 'F5', 'E5', 'D5', null],
    bass: ['C3', null, 'G3', null, 'F3', null, 'C3', null, 'A3', null, 'E3', null, 'G3', null, 'G3', null]
  },
  stage2: {
    label: 'Ải 2: Pháo Đài Xương',
    bpm: 136,
    leadWave: 'square',
    bassWave: 'sawtooth',
    leadGain: 0.06,
    bassGain: 0.065,
    percussion: 'march',
    // Heroic fortress iron march (A Minor)
    lead: ['A4', null, 'A4', 'C5', 'E5', null, 'D5', 'C5', 'B4', null, 'G4', 'B4', 'C5', 'B4', 'A4', null],
    bass: ['A2', 'A2', 'E3', 'A2', 'F3', 'F3', 'C3', 'F3', 'G3', 'G3', 'D3', 'G3', 'E3', 'E3', 'A2', null]
  },
  stage3: {
    label: 'Ải 3: Tháp Pháp Sư',
    bpm: 142,
    leadWave: 'sine',
    bassWave: 'triangle',
    leadGain: 0.095,
    bassGain: 0.085,
    percussion: 'arcane',
    // Haunting arcane arpeggios (E Harmonic Minor)
    lead: ['E5', 'G5', 'B5', 'Eb5', 'E5', 'B4', 'G4', 'Fs4', 'E4', 'G4', 'B4', 'E5', 'Fs5', 'G5', 'Eb5', 'B4'],
    bass: ['E3', null, 'E3', 'B2', 'C3', null, 'C3', 'G2', 'A2', null, 'A2', 'E3', 'B2', null, 'B2', 'Eb3']
  },
  stage4: {
    label: 'Ải 4: Boss Rồng Hắc Ám',
    bpm: 156,
    leadWave: 'sawtooth',
    bassWave: 'square',
    leadGain: 0.065,
    bassGain: 0.065,
    percussion: 'boss',
    // Intense Dragon Boss galloping battle theme (D Minor)
    lead: ['D5', 'D5', 'F5', 'A5', 'Bb5', 'A5', 'G5', 'F5', 'E5', 'G5', 'Bb5', 'A5', 'G5', 'F5', 'E5', 'Cs5'],
    bass: ['D3', 'D3', 'D3', 'A2', 'Bb2', 'Bb2', 'Bb2', 'F3', 'G3', 'G3', 'G3', 'D3', 'A2', 'A2', 'Cs3', 'A2']
  },
  demon_warning: {
    label: 'Cảnh Báo Khẩn',
    bpm: 190,
    leadWave: 'square',
    bassWave: 'square',
    leadGain: 0.075,
    bassGain: 0.055,
    percussion: 'boss',
    // Retro Pac-Man / arcade urgent alarm sweep
    lead: ['B4', 'B5', 'Fs5', 'Eb5', 'B5', 'Fs5', 'Eb5', null, 'C5', 'C6', 'G5', 'E5', 'C6', 'G5', 'E5', null],
    bass: ['B2', null, 'Fs3', null, 'B2', null, 'Fs3', null, 'C3', null, 'G3', null, 'C3', null, 'G3', null]
  },
  stage5: {
    label: '??? (Trận Chiến Ẩn)',
    bpm: 168,
    leadWave: 'sawtooth',
    bassWave: 'sawtooth',
    leadGain: 0.072,
    bassGain: 0.07,
    percussion: 'boss',
    // Relentless abyssal C# Phrygian/Harmonic Minor secret final boss theme
    lead: ['Cs5', 'D5', 'F5', 'Gs5', 'A5', 'Gs5', 'F5', 'D5', 'Cs5', 'Gs5', 'Cs6', 'B5', 'A5', 'Gs5', 'F5', 'Gs5'],
    bass: ['Cs3', 'Cs3', 'Gs3', 'Cs3', 'D3', 'D3', 'A3', 'D3', 'Cs3', 'Cs3', 'F3', 'Gs3', 'A3', 'Gs3', 'F3', 'D3']
  }
};

class KnightRpgBgmController {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.filterNode = null;
    this.timerId = null;
    this.currentTrackId = null;
    this.stepIndex = 0;
    this.muted = false;
  }

  ensureContext() {
    if (typeof window === 'undefined') return false;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return false;
        this.ctx = new AudioCtx();
        this.filterNode = this.ctx.createBiquadFilter();
        this.filterNode.type = 'lowpass';
        this.filterNode.frequency.value = 2600;
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.muted ? 0 : 0.82;
        this.filterNode.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return true;
    } catch {
      return false;
    }
  }

  unlock() {
    if (this.muted) return;
    if (this.ensureContext() && this.currentTrackId && !this.timerId) {
      this.startLoop();
    }
  }

  setMuted(nextMuted) {
    this.muted = Boolean(nextMuted);
    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.82, this.ctx.currentTime, 0.04);
      } catch {}
    }
    if (this.muted) {
      this.stopTimer();
    } else if (this.currentTrackId) {
      this.ensureContext();
      this.startLoop();
    }
  }

  isMuted() {
    return this.muted;
  }

  stopTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  setTrack(trackId) {
    if (!trackId || !KNIGHT_BGM_TRACKS[trackId]) {
      this.stop();
      return;
    }
    if (this.currentTrackId === trackId && this.timerId) return;
    this.currentTrackId = trackId;
    this.stepIndex = 0;
    this.stopTimer();
    if (!this.muted) {
      this.ensureContext();
      this.startLoop();
    }
  }

  stop() {
    this.currentTrackId = null;
    this.stepIndex = 0;
    this.stopTimer();
  }

  playTone(freq, durationSec, waveType, peakGain, detuneCents = 0) {
    if (!this.ctx || !this.filterNode || !freq || this.ctx.state !== 'running') return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = waveType;
      osc.frequency.setValueAtTime(freq, now);
      if (detuneCents) osc.detune.setValueAtTime(detuneCents, now);

      env.gain.setValueAtTime(0.0001, now);
      env.gain.linearRampToValueAtTime(peakGain, now + 0.014);
      env.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(0.05, durationSec));

      osc.connect(env);
      env.connect(this.filterNode);
      osc.start(now);
      osc.stop(now + Math.max(0.06, durationSec) + 0.01);
    } catch {}
  }

  playKick(peakGain = 0.14) {
    if (!this.ctx || !this.masterGain || this.ctx.state !== 'running') return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(145, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.11);
      env.gain.setValueAtTime(peakGain, now);
      env.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc.connect(env);
      env.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch {}
  }

  playTickHat(peakGain = 0.03) {
    if (!this.ctx || !this.masterGain || this.ctx.state !== 'running') return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(4800, now);
      env.gain.setValueAtTime(peakGain, now);
      env.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);
      osc.connect(env);
      env.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.03);
    } catch {}
  }

  startLoop() {
    this.stopTimer();
    const track = KNIGHT_BGM_TRACKS[this.currentTrackId];
    if (!track || this.muted) return;

    // 8th-note step duration in ms
    const stepMs = Math.max(85, Math.round((60 / track.bpm / 2) * 1000));
    const stepSec = stepMs / 1000;

    const tick = () => {
      if (this.muted || !this.currentTrackId) return;
      if (typeof window !== 'undefined' && window.__lexiprepMuted) return;
      const activeTrack = KNIGHT_BGM_TRACKS[this.currentTrackId];
      if (!activeTrack) return;
      if (!this.ctx || this.ctx.state !== 'running') return;

      const idx = this.stepIndex % activeTrack.lead.length;
      const leadNote = activeTrack.lead[idx];
      const harmonyNote = Array.isArray(activeTrack.harmony) ? activeTrack.harmony[idx] : null;
      const bassNote = activeTrack.bass[idx];

      if (leadNote && NOTE_FREQ[leadNote]) {
        this.playTone(NOTE_FREQ[leadNote], stepSec * 0.92, activeTrack.leadWave, activeTrack.leadGain);
      }
      if (harmonyNote && NOTE_FREQ[harmonyNote]) {
        this.playTone(
          NOTE_FREQ[harmonyNote],
          stepSec * 1.1,
          activeTrack.harmonyWave || 'triangle',
          activeTrack.harmonyGain || 0.04,
          4
        );
      }
      if (bassNote && NOTE_FREQ[bassNote]) {
        this.playTone(NOTE_FREQ[bassNote], stepSec * 1.15, activeTrack.bassWave, activeTrack.bassGain);
      }

      if (activeTrack.percussion === 'celestial') {
        if (idx % 4 === 0) this.playTickHat(0.015);
      } else if (activeTrack.percussion === 'showcase') {
        if (idx % 8 === 0) this.playKick(0.065);
        if (idx % 4 === 2) this.playTickHat(0.018);
      } else if (activeTrack.percussion === 'duel_drums') {
        if (idx % 4 === 0 || idx % 8 === 3) this.playKick(0.125);
        if (idx % 2 === 1) this.playTickHat(0.026);
      } else if (activeTrack.percussion === 'duel_intense') {
        if (idx % 2 === 0) this.playKick(0.145);
        if (idx % 2 === 1) this.playTickHat(0.036);
      } else if (activeTrack.percussion === 'light') {
        if (idx % 4 === 0) this.playKick(0.08);
        if (idx % 2 === 1) this.playTickHat(0.018);
      } else if (activeTrack.percussion === 'march') {
        if (idx % 4 === 0 || idx % 4 === 2) this.playKick(0.11);
        if (idx % 2 === 1) this.playTickHat(0.024);
      } else if (activeTrack.percussion === 'arcane') {
        if (idx % 8 === 0) this.playKick(0.09);
        if (idx % 4 === 2) this.playTickHat(0.02);
      } else if (activeTrack.percussion === 'boss') {
        if (idx % 2 === 0) this.playKick(0.13);
        if (idx % 2 === 1) this.playTickHat(0.03);
      }

      this.stepIndex = (this.stepIndex + 1) % activeTrack.lead.length;
    };

    tick();
    this.timerId = setInterval(tick, stepMs);
  }
}

export const knightRpgBgm = new KnightRpgBgmController();
