/**
 * RPT-50 increment 2: the PURE governance seam for the self-improvement engine's
 * spend + autonomy mode. No DB, no AI, no clock beyond an injected `now` -- so the
 * three real decisions (is the scheduled pass due, is the engine going stale, may a
 * flag auto-apply) are unit-testable in isolation. The tick and the server fns are
 * thin wrappers that read/write rows and call these.
 */

export type SelfImproveMode = "auto" | "scheduled" | "off";

/**
 * The mode a row actually holds, or the default. The column carries no CHECK,
 * so its value is whatever was written; reading it as `(row.mode as
 * SelfImproveMode) ?? "scheduled"` was a claim rather than a check, and `??`
 * guards only null, so any other string arrived typed as a mode and was handed
 * to the surface that renders it (2026-09-09, the census Lane 1's sourceMark
 * find prompted). The consequence here was mild, because `mayAutoApply`
 * demands `mode === "auto"` and an unknown value fails closed, which is the
 * safe direction; it is narrowed anyway, because a value that reaches a
 * surface should be one the type admits, and the next reader may not be
 * asking the safe question.
 *
 * The list is the type's own, so adding a mode cannot leave the check behind.
 */
export function asSelfImproveMode(value: unknown, fallback: SelfImproveMode): SelfImproveMode {
  return typeof value === "string" && (SELF_IMPROVE_MODES as readonly string[]).includes(value)
    ? (value as SelfImproveMode)
    : fallback;
}

export const SELF_IMPROVE_MODES: readonly SelfImproveMode[] = ["auto", "scheduled", "off"];

/** Scheduled mode enriches open flags no more often than this. Bounds AI spend. */
export const SCHEDULED_INTERVAL_MS = 7 * 24 * 3600_000;

/**
 * How long the engine may sit in `off` (with unaddressed flags) before we nudge.
 * Only `off` goes stale -- auto/scheduled keep themselves warm. Two weeks is long
 * enough not to nag, short enough that the feature does not silently die.
 */
export const STALENESS_MS = 14 * 24 * 3600_000;

function msSince(iso: string | null | undefined, now: number): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return now - t;
}

/**
 * Scheduled mode: is an auto-enrich pass due? Due when never run, or the last auto
 * run is older than the interval. Only meaningful for `scheduled`/`auto`; `off`
 * never runs the tick's AI pass.
 */
export function isAutoPassDue(
  mode: SelfImproveMode,
  lastAutoRunAt: string | null | undefined,
  now: number,
): boolean {
  if (mode === "off") return false;
  const since = msSince(lastAutoRunAt, now);
  if (since === null) return true; // never run
  return since >= SCHEDULED_INTERVAL_MS;
}

export type StalenessNudge = {
  stale: boolean;
  daysSinceTouch: number | null;
  /** User-facing nudge copy, only set when stale. */
  message: string | null;
};

/**
 * The staleness nudge. Fires ONLY when the engine is `off`, there are open flags
 * going unaddressed, and no human has driven it within the window (or ever). In
 * `auto`/`scheduled` the engine addresses its own flags, so it never goes stale.
 * A workspace with no open flags is healthy-quiet, not stale -- no nudge.
 */
export function computeStaleness(params: {
  mode: SelfImproveMode;
  lastHumanTouchAt: string | null | undefined;
  openFlagCount: number;
  now: number;
}): StalenessNudge {
  const { mode, lastHumanTouchAt, openFlagCount, now } = params;
  const sinceMs = msSince(lastHumanTouchAt, now);
  const daysSinceTouch = sinceMs === null ? null : Math.floor(sinceMs / (24 * 3600_000));

  if (mode !== "off" || openFlagCount <= 0) {
    return { stale: false, daysSinceTouch, message: null };
  }
  const longEnough = sinceMs === null || sinceMs >= STALENESS_MS;
  if (!longEnough) {
    return { stale: false, daysSinceTouch, message: null };
  }
  const flagWord = openFlagCount === 1 ? "flag is" : "flags are";
  const message = `${openFlagCount} open ${flagWord} waiting and self-improvement has been off for a while. Turn it on, or clear the flags, so the engine keeps learning.`;
  return { stale: true, daysSinceTouch, message };
}

/**
 * The autonomy gate for the tick. Auto mode is the only mode that applies fixes
 * unattended; even then it only applies a flag that carries a grounded suggested
 * fix (real evidence behind it). The apply primitive still runs the injection
 * screen and every applied change stays reversible + receipted -- this is the
 * cheap pre-filter that decides which flags are even eligible for an auto pass.
 */
export function mayAutoApply(params: {
  mode: SelfImproveMode;
  grounded_on: number | null | undefined;
  alreadyApplied: boolean;
}): boolean {
  if (params.mode !== "auto") return false;
  if (params.alreadyApplied) return false;
  return (params.grounded_on ?? 0) > 0;
}
