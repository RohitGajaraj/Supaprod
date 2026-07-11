// Pure helpers for the Flow-mode focus session: sound presets, timer math,
// resume-across-reload, and display formatting. Kept free of React and Web Audio
// so they are unit-testable (see session.test.ts); the provider composes them.

// Each non-off preset plays a real, looped recording from /public/soundscape/.
// Synthesized white noise (the first cut) sounded harsh; real audio is calmer.
// A set of soft, continuous textures (no hard strikes): ocean waves, a cozy
// fireplace, a Himalayan forest, monsoon rain with faint temple bells, a soft
// bansuri flute, and a bass-rich heartbeat. Generated via ElevenLabs sound
// effects.
export type SoundPreset =
  | "ocean"
  | "monsoon"
  | "bansuri"
  | "forest"
  | "heartbeat"
  | "fireplace"
  | "off";

// endsAt === null means an open-ended session (no timer). A finite endsAt is an
// epoch-millis deadline.
//
// PM Desk (founder goal 2026-07-09): a session now carries the PM's one-line
// intent plus enough shape (startedAt, plannedMin) to derive the phase of the
// block: past-half brightens the countdown, the closing stretch goes ember and
// fires one soft cue. All new fields are optional so a session stored by the
// previous build keeps resuming cleanly.
export type FlowSession = {
  endsAt: number | null;
  preset: SoundPreset;
  soundOn: boolean;
  /** The PM's one-line goal for the block ("close the spec review"). */
  intent?: string;
  /** Epoch ms the block started; needed for phase math + open-ended elapsed. */
  startedAt?: number;
  /** The chosen block length in minutes (0 = open-ended). */
  plannedMin?: number;
  /** The last-stretch sound cue already fired (survives a reload). */
  cued?: boolean;
};

export const SOUND_PRESETS: SoundPreset[] = [
  "ocean",
  "monsoon",
  "bansuri",
  "forest",
  "heartbeat",
  "fireplace",
  "off",
];

// The looped audio file for a preset, or null for "off". Files live in
// public/soundscape/<preset>.mp3 (mp3 for universal browser support, incl.
// Safari). See public/soundscape/README.md for sourcing + licensing.
export function presetSrc(preset: SoundPreset): string | null {
  return preset === "off" ? null : `/soundscape/${preset}.mp3`;
}

// Quick timer chips. 0 = open-ended (no countdown). Any custom value is allowed
// too via the widget's minutes input, clamped to [MIN, MAX].
export const TIMER_QUICK_MIN = [25, 50, 90] as const;
export const MIN_CUSTOM_MIN = 1;
export const MAX_CUSTOM_MIN = 240;

export function clampMinutes(n: number): number {
  if (!Number.isFinite(n)) return MIN_CUSTOM_MIN;
  return Math.max(MIN_CUSTOM_MIN, Math.min(MAX_CUSTOM_MIN, Math.round(n)));
}

export function endsAtFor(timerMin: number, now: number): number | null {
  return timerMin > 0 ? now + timerMin * 60_000 : null;
}

export function remainingMs(endsAt: number | null, now: number): number | null {
  if (endsAt === null) return null;
  return Math.max(0, endsAt - now);
}

export function isExpired(session: FlowSession | null, now: number): boolean {
  if (!session) return false;
  if (session.endsAt === null) return false; // open-ended never expires
  return session.endsAt <= now;
}

// A stored session can be resumed after a reload only if it still has time left
// (or is open-ended). Expired sessions are cleared on load.
export function isResumable(session: FlowSession | null, now: number): boolean {
  return Boolean(session) && !isExpired(session, now);
}

export function formatRemaining(ms: number | null): string {
  if (ms === null) return "";
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ---- Phase of the block (PM Desk) -----------------------------------------
//
// early: less than half the block is gone. past-half: the founder's 50% color
// shift. closing: the wrap-up window, ember + one soft cue. The closing window
// is the last 10% of the block with a 30-second floor, so a short block still
// gets a meaningful wrap-up stretch.

export type FocusPhase = "early" | "past-half" | "closing";

export function phaseOf(session: FlowSession | null, now: number): FocusPhase | null {
  if (!session || session.endsAt === null || session.startedAt === undefined) return null;
  const total = session.endsAt - session.startedAt;
  if (total <= 0) return null;
  const left = session.endsAt - now;
  if (left <= Math.max(total * 0.1, 30_000)) return "closing";
  if (now - session.startedAt >= total / 2) return "past-half";
  return "early";
}

// ---- Session history (PM Desk) --------------------------------------------
//
// A small local ledger of finished blocks, newest first, capped, so the Desk
// can say "2 blocks · 75 min today" and machine view can expose the trail.
// localStorage only; a durable focus_sessions table is a recorded follow-up.

export type FocusHistoryEntry = {
  intent: string | null;
  startedAt: number;
  endedAt: number;
  plannedMin: number;
  /** true when the block ran to its deadline; false when ended early. */
  completed: boolean;
};

export const HISTORY_KEY = "cadence.flow.history";
const HISTORY_CAP = 50;

/** The localStorage GETTER itself can throw (storage-denied browsers: blocked
 *  cookies, sandboxed iframes). Every flow call site reaches storage through
 *  this guard so the ledger nicety can never crash a route (review fix). */
export function safeLocalStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readFocusHistory(storage: Pick<Storage, "getItem"> | null): FocusHistoryEntry[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is FocusHistoryEntry =>
        typeof e === "object" &&
        e !== null &&
        typeof (e as FocusHistoryEntry).startedAt === "number" &&
        typeof (e as FocusHistoryEntry).endedAt === "number",
    );
  } catch {
    return [];
  }
}

export function appendFocusHistory(
  storage: Pick<Storage, "getItem" | "setItem"> | null,
  entry: FocusHistoryEntry,
): void {
  if (!storage) return;
  try {
    const next = [entry, ...readFocusHistory(storage)].slice(0, HISTORY_CAP);
    storage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // Storage denied: the ledger is a nicety, never a blocker.
  }
}

/** The entries whose block STARTED today (local time), for the Desk's tally. */
export function todaysFocusTally(
  entries: FocusHistoryEntry[],
  now: number,
): {
  blocks: number;
  minutes: number;
} {
  const day = new Date(now).toDateString();
  let blocks = 0;
  let minutes = 0;
  for (const e of entries) {
    if (new Date(e.startedAt).toDateString() !== day) continue;
    blocks += 1;
    minutes += Math.max(0, Math.round((e.endedAt - e.startedAt) / 60_000));
  }
  return { blocks, minutes };
}
