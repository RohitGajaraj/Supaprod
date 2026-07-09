// A short, soft two-note chime for when a focus block finishes. Self-contained
// Web Audio: builds a throwaway context, plays a gentle interval, and closes.

import { hasAudio } from "./soundscape";

// A soft rising two-note for the moment a block STARTS (PM Desk, founder ask:
// activating a focus feature deserves a felt cue). G4 to C5, quieter than the
// completion chime — the door closing gently, not a fanfare.
export function playStart(volume = 0.15): void {
  if (!hasAudio()) return;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  const start = ctx.currentTime;
  const notes = [392.0, 523.25]; // G4 then C5: a calm rising fourth

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const t = start + i * 0.14;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.45);
  });

  window.setTimeout(() => {
    void ctx.close().catch(() => {});
  }, 1000);
}

// One soft single note for the block's closing stretch (the last-10% cue,
// PM Desk). Deliberately quieter and shorter than the completion chime: a
// nudge, not an alarm. Same throwaway-context pattern as playChime.
export function playCue(volume = 0.18): void {
  if (!hasAudio()) return;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 659.25; // E5: sits above the ambient beds, below the chime
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(volume, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.45);
  window.setTimeout(() => {
    void ctx.close().catch(() => {});
  }, 900);
}

export function playChime(volume = 0.25): void {
  if (!hasAudio()) return;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  const start = ctx.currentTime;
  const notes = [523.25, 783.99]; // C5 then G5: a calm rising fifth

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const t = start + i * 0.18;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.55);
  });

  window.setTimeout(() => {
    void ctx.close().catch(() => {});
  }, 1200);
}
