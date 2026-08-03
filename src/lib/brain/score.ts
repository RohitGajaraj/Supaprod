// SF-FOCUS (Signal Fabric Phase 1) — the pure theme-ranking score (no I/O, testable).
//
// Ranks themes for the one "Focus on this next" card by three factors a PM actually cares
// about: how big (severity × confidence), how fresh (recency), and how NEW it is vs what the
// team already knows/decided (novelty-vs-memory). nowMs is injected so it is deterministic
// and resume/test-safe (no Date.now() inside).

export function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

export type ScoreInputs = {
  severity: number; // 1..5
  confidence: number; // 0..1
  createdAt: string; // ISO
  lastSignalAt?: string | null; // ISO; falls back to createdAt
  novelty?: number | null; // 0..1; null → treat as fully novel (1)
  /**
   * How many signals actually back this theme. Optional so existing callers
   * compile, and treated as 1 when absent (one report, no corroboration).
   */
  frequency?: number | null;
};

/**
 * Recency half-life, in hours.
 *
 * WAS 72, WHICH RANKED THE WRONG THINGS FIRST. Observed live 2026-08-03: the top
 * of Discover was a single competitor blog post from 5 days ago, while 40
 * homeowners reporting the same support burden sat at #9. A 72 hour constant
 * puts a 5 day item at 0.19 and a 9 day item at 0.05, a near four-fold edge, and
 * since recency multiplies it cannot be answered by any other term.
 *
 * Seventy-two hours is an incident-feed constant: it assumes what matters is what
 * broke since yesterday. Discovery is not that surface. A pattern nine days old is
 * not stale, it is a pattern; the whole point of clustering is that repetition
 * over WEEKS is the signal. 336 hours (two weeks) puts 5 days at 0.70 and 9 days
 * at 0.53, so fresh still leads and settled evidence is no longer buried.
 */
const RECENCY_HALF_LIFE_HOURS = 336;

/**
 * Signals at which corroboration stops adding weight.
 *
 * Ten, matching the existing "watch this week" bar of three being clearly partway
 * up rather than at the top. Saturating matters: the difference between 1 and 10
 * reports is a different KIND of fact, while the difference between 40 and 400 is
 * the same fact louder, and a linear term would let one noisy integration outrank
 * everything a human ever said.
 */
const CORROBORATION_SATURATES_AT = 10;

/** PURE. severity × recency × corroboration × novelty-vs-memory → (0,1]. */
export function scoreTheme(t: ScoreInputs, nowMs: number): number {
  const severity = Math.min(5, Math.max(1, t.severity || 1));
  const confidence = clamp01(t.confidence ?? 0.5);
  const novelty = clamp01(t.novelty ?? 1);

  const magnitude = (severity / 5) * (0.6 + 0.4 * confidence); // (0,1]
  const refMs = Math.max(Date.parse(t.lastSignalAt ?? "") || 0, Date.parse(t.createdAt) || 0);
  const ageHours = Math.max(0, (nowMs - refMs) / 3_600_000);
  const recency = Math.exp(-ageHours / RECENCY_HALF_LIFE_HOURS); // (0,1]

  /**
   * HOW MANY PEOPLE SAID IT. This term did not exist before 2026-08-03, and its
   * absence was the single reason a one-signal item could top the queue: frequency
   * was used only as a tie-break AFTER the score, so it decided nothing unless two
   * themes scored identically, which floats never do.
   *
   * Log-scaled so it has diminishing returns, and floored at 0.45 rather than 0
   * so that a genuinely severe single report is discounted, never silenced. That
   * floor is the deliberate answer to the obvious failure mode of this change:
   * "one customer, catastrophic" must still be able to reach the top on severity.
   */
  const backing = Math.max(0, t.frequency ?? 1);
  const corroboration =
    0.45 + 0.55 * clamp01(Math.log1p(backing) / Math.log1p(CORROBORATION_SATURATES_AT));

  const noveltyMult = 0.25 + 0.75 * novelty; // [0.25,1]
  return magnitude * recency * corroboration * noveltyMult; // (0,1]
}
