// Web Audio API Synthesizer for high-tension competition stage effects

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function getSoundEnabled(): boolean {
  return soundEnabled;
}

function getAudioContext(): AudioContext | null {
  if (!soundEnabled) return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Click sound when selecting a score button
 */
export function playScoreClick(pitchMultiplier = 1) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(440 * pitchMultiplier, now);
  osc.frequency.exponentialRampToValueAtTime(880 * pitchMultiplier, now + 0.06);

  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.08);
}

/**
 * Suspense heartbeat pulse when waiting for judges
 */
export function playHeartbeat() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Double pulse (lub-dub)
  [0, 0.15].forEach((offset, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(idx === 0 ? 70 : 55, now + offset);
    osc.frequency.exponentialRampToValueAtTime(30, now + offset + 0.12);

    gain.gain.setValueAtTime(0.35, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + offset);
    osc.stop(now + offset + 0.12);
  });
}

/**
 * Dramatic Judge Reveal whoosh + chime when a judge locks in score
 */
export function playJudgeReveal() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // 1. Bass impact
  const subOsc = ctx.createOscillator();
  const subGain = ctx.createGain();
  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(140, now);
  subOsc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
  subGain.gain.setValueAtTime(0.4, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  subOsc.connect(subGain);
  subGain.connect(ctx.destination);
  subOsc.start(now);
  subOsc.stop(now + 0.4);

  // 2. High metallic chime chord
  const freqs = [523.25, 659.25, 783.99, 1046.5]; // C Major
  freqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + 0.05);

    gain.gain.setValueAtTime(0.18 / (idx + 1), now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6 + idx * 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + 0.05);
    osc.stop(now + 0.7 + idx * 0.1);
  });
}

/**
 * Rising tension buildup before the Grand Total reveals
 */
export function playTensionRiser() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const duration = 1.2;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(130, now);
  osc.frequency.exponentialRampToValueAtTime(587.33, now + duration); // Rises to D5

  gain.gain.setValueAtTime(0.05, now);
  gain.gain.linearRampToValueAtTime(0.3, now + duration - 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration);
}

/**
 * Grand Total Reveal Victory Fanfare!
 */
export function playGrandTotalFanfare() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // 1. Deep sub drop impact
  const sub = ctx.createOscillator();
  const subG = ctx.createGain();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(180, now);
  sub.frequency.exponentialRampToValueAtTime(35, now + 0.8);
  subG.gain.setValueAtTime(0.6, now);
  subG.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
  sub.connect(subG);
  subG.connect(ctx.destination);
  sub.start(now);
  sub.stop(now + 0.8);

  // 2. Brass-like fanfare arpeggio notes
  const notes = [
    { freq: 261.63, time: 0.0, dur: 0.4 }, // C4
    { freq: 329.63, time: 0.1, dur: 0.4 }, // E4
    { freq: 392.0, time: 0.2, dur: 0.4 }, // G4
    { freq: 523.25, time: 0.35, dur: 1.0 }, // C5
    { freq: 659.25, time: 0.4, dur: 1.1 }, // E5
    { freq: 783.99, time: 0.45, dur: 1.2 }, // G5
    { freq: 1046.5, time: 0.5, dur: 1.5 }, // C6 (High triumph)
  ];

  notes.forEach((note) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(note.freq, now + note.time);

    gain.gain.setValueAtTime(0.2, now + note.time);
    gain.gain.exponentialRampToValueAtTime(0.001, now + note.time + note.dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + note.time);
    osc.stop(now + note.time + note.dur);
  });
}

/**
 * Smooth swoosh for switching contestant / clearing
 */
export function playNextWhoosh() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(200, now + 0.25);

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.25);
}
