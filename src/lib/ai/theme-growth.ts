/**
 * Theme growth, the pure core.
 *
 * Clustering as originally built could only ever CREATE themes: `clusterSignalsCore`
 * reads unclustered signals, asks the model for groups, and INSERTs each one. There
 * was no path by which a new signal could join a theme that already existed. Three
 * things followed from that, all of them wrong:
 *
 *  1. The same complaint arriving next week produced a second, near-identical theme
 *     instead of making the first one heavier, so frequency (the strongest evidence
 *     a pattern is real) never accumulated.
 *  2. A theme the PM dismissed could never come back, because coming back requires
 *     growing, and nothing could grow it. `discovery.functions.ts` already promised
 *     the opposite in prose: "a dismissed cluster is still corroboration if the same
 *     complaint returns louder later". Nothing implemented it.
 *  3. "Decline until it escalates", the disposition a PM actually wants for a real
 *     but not-yet-urgent pattern, was impossible to express.
 *
 * This module is the decision layer for both attachment and escalation. It is pure
 * and fully unit tested, because the cost of getting it wrong is asymmetric: a wrong
 * attach silently buries a signal inside a theme nobody reads it under, which is
 * strictly worse than creating one extra theme a human can merge in one keystroke.
 * The thresholds are therefore deliberately conservative.
 */

/**
 * Cosine similarity above which a signal is considered to BELONG to an existing theme.
 *
 * Calibration note: `brain/novelty.server.ts` treats ~0.5 as the floor where a pair
 * stops being noise and starts being "seen before". That floor is far too low to
 * move a signal into a theme; at 0.5 two texts merely share a subject area. 0.80
 * is the "this is the same complaint" band, and anything below it falls through to
 * the model, which is the safe direction to fail.
 */
export const THEME_ATTACH_THRESHOLD = 0.8;

/**
 * A dismissed theme comes back when it has grown BOTH multiplicatively and
 * absolutely since the moment it was dismissed.
 *
 * Two conditions, not one, and each covers the other's blind spot. The multiple
 * alone would re-raise a theme dismissed at 1 signal the moment it reached 2, which
 * is noise. The absolute alone would never re-raise a theme dismissed at 40 until it
 * hit 43, which is far too late. Requiring both means a small dismissal needs real
 * repetition and a large dismissal needs proportionate growth.
 */
export const ESCALATION_MULTIPLE = 2;
export const ESCALATION_ABSOLUTE = 3;

/**
 * Read a pgvector value into numbers.
 *
 * supabase-js hands `vector` columns back as the raw Postgres text form, "[0.1,0.2]",
 * not as an array, so a caller that treats the column as `number[]` silently gets a
 * string and every similarity computes as NaN. Both shapes are accepted here so this
 * cannot become a live-only bug that unit tests never see.
 */
export function parseVector(value: unknown): number[] | null {
  if (Array.isArray(value)) {
    return value.every((n) => typeof n === "number" && Number.isFinite(n))
      ? (value as number[])
      : null;
  }
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) return null;
  const inner = trimmed.slice(1, -1).trim();
  if (inner === "") return null;
  const out: number[] = [];
  for (const part of inner.split(",")) {
    const n = Number(part);
    if (!Number.isFinite(n)) return null;
    out.push(n);
  }
  return out;
}

/** Cosine similarity of two equal-length vectors. Returns null when incomparable. */
export function cosineSimilarity(a: number[], b: number[]): number | null {
  if (a.length === 0 || a.length !== b.length) return null;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return null;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export type ThemeVector = { id: string; embedding: unknown };
export type ThemeMatch = { themeId: string; similarity: number };

/**
 * The single closest theme to a signal vector, or null when nothing clears the bar.
 *
 * Themes whose embedding is missing or malformed are skipped rather than treated as
 * distance zero, so an unembedded theme can never swallow every incoming signal.
 */
export function nearestTheme(
  signalVector: number[],
  themes: readonly ThemeVector[],
  threshold: number = THEME_ATTACH_THRESHOLD,
): ThemeMatch | null {
  let best: ThemeMatch | null = null;
  for (const t of themes) {
    const vec = parseVector(t.embedding);
    if (!vec) continue;
    const sim = cosineSimilarity(signalVector, vec);
    if (sim === null) continue;
    if (sim >= threshold && (best === null || sim > best.similarity)) {
      best = { themeId: t.id, similarity: sim };
    }
  }
  return best;
}

/**
 * Should a dismissed theme return to triage?
 *
 * `dismissedAtFrequency` is the size the theme was when the human said no. A theme
 * dismissed before that column existed has null, and is treated as never escalating:
 * re-raising every historical dismissal at once the day this ships would bury the
 * user under decisions they already made, which is the opposite of the point.
 */
export function shouldEscalate(
  dismissedAtFrequency: number | null | undefined,
  currentFrequency: number,
): boolean {
  if (dismissedAtFrequency === null || dismissedAtFrequency === undefined) return false;
  if (dismissedAtFrequency < 0 || currentFrequency <= dismissedAtFrequency) return false;
  return (
    currentFrequency >= dismissedAtFrequency * ESCALATION_MULTIPLE &&
    currentFrequency >= dismissedAtFrequency + ESCALATION_ABSOLUTE
  );
}

/**
 * The sentence shown when a declined theme comes back.
 *
 * Written here, next to the rule that produces it, so the number in the copy can
 * never drift from the number in the decision.
 */
export function escalationNote(dismissedAtFrequency: number, currentFrequency: number): string {
  return `You declined this at ${dismissedAtFrequency} ${
    dismissedAtFrequency === 1 ? "signal" : "signals"
  }. It is now at ${currentFrequency}.`;
}
