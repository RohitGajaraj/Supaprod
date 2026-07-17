// The Interaction-Feel Law (DESIGN-LOOM dim 16 companion): ONE shared feedback
// module so motion + sound + haptics stay consistent and mutable, never per
// component ad hoc. Sound is SYNTHESIZED (Web Audio, no audio files) so it is
// weightless and crisp. Everything is preference-gated and SSR-safe.
//
// Calibration (Rauno's frequency/novelty rule): callers pick the KIND, which
// encodes how expressive the feedback is. High-frequency actions should use
// "tap" (a whisper) or nothing at all; only novel/consequential moments use
// "success". Never fire a heavy kind on a per-keystroke path.

export type FeedbackKind = "tap" | "select" | "toggle" | "open" | "close" | "success" | "error";

export type FeedbackPrefs = {
  /** Synthesized UI sound. Default OFF: sound-by-default in a web app is
   *  intrusive and often unwanted; the user opts in from Settings. */
  sound: boolean;
  /** Haptic tick on supported (mostly mobile) devices. Default ON and subtle;
   *  a no-op on desktop where navigator.vibrate is absent. */
  haptics: boolean;
};

const PREF_KEY = "supaprod.feedback.prefs.v1";
const DEFAULT_PREFS: FeedbackPrefs = { sound: false, haptics: true };

const isBrowser = typeof window !== "undefined";

let prefs: FeedbackPrefs = DEFAULT_PREFS;
if (isBrowser) {
  try {
    const raw = window.localStorage.getItem(PREF_KEY);
    if (raw) prefs = { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<FeedbackPrefs>) };
  } catch {
    // Corrupt or blocked storage: fall back to defaults, never throw.
  }
}

type Listener = (p: FeedbackPrefs) => void;
const listeners = new Set<Listener>();

export function getFeedbackPrefs(): FeedbackPrefs {
  return prefs;
}

export function setFeedbackPrefs(next: Partial<FeedbackPrefs>): FeedbackPrefs {
  prefs = { ...prefs, ...next };
  if (isBrowser) {
    try {
      window.localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
    } catch {
      // Storage may be unavailable (private mode); the in-memory value still applies.
    }
  }
  for (const l of listeners) l(prefs);
  return prefs;
}

export function subscribeFeedbackPrefs(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

// --- Web Audio: one lazily-created context, resumed on the first user gesture.
let audioCtx: AudioContext | null = null;

function ensureAudio(): AudioContext | null {
  if (!isBrowser) return null;
  try {
    if (!audioCtx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      audioCtx = new Ctor();
    }
    if (audioCtx.state === "suspended") void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

/** One short synthesized blip with a fast attack + exponential release, so it
 *  reads as a soft "tick" rather than a beep. Peak gain is kept low on purpose. */
function blip(freq: number, durationMs: number, peak: number, type: OscillatorType = "sine") {
  const ctx = ensureAudio();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peak, now + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + durationMs / 1000 + 0.02);
}

type SoundSpec = { freq: number; dur: number; peak: number; type?: OscillatorType };

// Subtle, tasteful. Frequent kinds are the quietest; success is the one that
// gets a two-note lift.
const SOUND: Record<FeedbackKind, SoundSpec[]> = {
  tap: [{ freq: 660, dur: 22, peak: 0.025 }],
  select: [{ freq: 760, dur: 28, peak: 0.03 }],
  toggle: [{ freq: 560, dur: 26, peak: 0.028 }],
  open: [{ freq: 520, dur: 40, peak: 0.03 }],
  close: [{ freq: 420, dur: 40, peak: 0.028 }],
  success: [
    { freq: 660, dur: 60, peak: 0.035 },
    { freq: 990, dur: 90, peak: 0.03 },
  ],
  error: [{ freq: 180, dur: 120, peak: 0.04, type: "triangle" }],
};

const HAPTIC: Record<FeedbackKind, number | number[]> = {
  tap: 8,
  select: 10,
  toggle: 10,
  open: 12,
  close: 8,
  success: [12, 30, 14],
  error: [22, 44, 22],
};

function playSound(kind: FeedbackKind) {
  const specs = SOUND[kind];
  const ctx = ensureAudio();
  if (!ctx) return;
  specs.forEach((s, i) => {
    // Sequence multi-note kinds slightly so they read as a phrase, not a chord.
    window.setTimeout(() => blip(s.freq, s.dur, s.peak, s.type), i * 70);
  });
}

function vibrate(kind: FeedbackKind) {
  if (!isBrowser) return;
  const nav = window.navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
  if (typeof nav.vibrate !== "function") return;
  try {
    nav.vibrate(HAPTIC[kind]);
  } catch {
    // Some browsers throw if called outside a user gesture; ignore.
  }
}

/**
 * Fire feedback for a user action. Call from a real user-gesture handler
 * (pointerdown/click) so the AudioContext is allowed to start. Motion is NOT
 * handled here (it lives in CSS/`loom-press`); this is the sound+haptic layer.
 */
export function fireFeedback(kind: FeedbackKind) {
  if (!isBrowser) return;
  if (prefs.haptics) vibrate(kind);
  if (prefs.sound) playSound(kind);
}
