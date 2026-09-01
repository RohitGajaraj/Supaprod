/**
 * RETRY POLICY FOR THE MODEL CHOKEPOINT.
 *
 * WHY THIS FILE EXISTS. Measured in production on 2026-08-21: the `sense` surface
 * lost 32 calls to "AI rate limit reached" between 2026-08-19 19:28 and
 * 2026-08-21 06:25, 35 hours without a break, while roughly 70% of calls in the
 * same hours succeeded. Successes and failures interleaved every hour, so the
 * gateway key is throttled per minute rather than out of quota.
 *
 * Both retry loops in `runtime.server.ts` did retry a 429. They could not help:
 *
 *   1. The backoff was `400 * (i + 1)`, so all three attempts finished inside
 *      about 1.2 seconds. Against a per-minute limiter that is one attempt
 *      wearing a disguise.
 *   2. `Retry-After` was never read anywhere in `src/lib/ai/`. The gateway was
 *      presumably saying how long to wait and nothing looked.
 *   3. The model fallback chain cannot substitute for waiting: the 2026-08-20
 *      test in the audit register switched `gemini-3-flash-preview` to
 *      `gemini-2.5-flash-lite` and got the IDENTICAL limit, because the limit is
 *      on the gateway KEY and not on the model.
 *
 * Only elapsed time clears a per-key limit, so the fix is to wait properly.
 *
 * THE ONE IDEA WORTH KEEPING. How long a caller may wait is not a property of the
 * error, it is a property of who is waiting. A background tick can sit out a
 * per-minute window; a person watching a chat stream cannot. So the budget is per
 * SURFACE, and an unknown surface is treated as interactive -- a new surface fails
 * fast by default rather than silently inheriting patience nobody chose.
 *
 * PURE ON PURPOSE. No fetch, no clock, no I/O, so the policy is testable without
 * a gateway. `random` is injectable for the same reason.
 */

export type RetryCode = "RATE_LIMIT" | "SERVER_ERROR" | (string & {});

/** Surfaces driven by a tick or a batch, where no one is watching a spinner. */
const BACKGROUND_SURFACES = new Set(["sense", "judge", "eval", "embed", "agent"]);

/** A person is watching. Enough to clear a short burst, not enough to feel hung. */
export const INTERACTIVE_RATE_LIMIT_BUDGET_MS = 6_000;
/** No one is watching. Long enough to sit out a per-minute window. */
export const BACKGROUND_RATE_LIMIT_BUDGET_MS = 45_000;
/** Never honour a `Retry-After` longer than this in one wait. */
export const MAX_SINGLE_WAIT_MS = 20_000;

const BASE_RATE_LIMIT_DELAY_MS = 1_000;
const SERVER_ERROR_STEP_MS = 400;

export function isBackgroundSurface(surface: string | undefined): boolean {
  return surface !== undefined && BACKGROUND_SURFACES.has(surface);
}

/** Total time this call may spend WAITING on rate limits, excluding the requests. */
export function rateLimitBudgetMs(surface: string | undefined, override?: number): number {
  if (override !== undefined) return Math.max(0, override);
  return isBackgroundSurface(surface)
    ? BACKGROUND_RATE_LIMIT_BUDGET_MS
    : INTERACTIVE_RATE_LIMIT_BUDGET_MS;
}

/**
 * Total attempts including the first. An explicit `maxRetries` from a caller wins
 * outright, because a caller that set it meant it. Otherwise a rate-limited
 * background call gets more attempts, since waiting is the only thing that works
 * and it has the budget to do it.
 */
export function maxAttemptsFor(
  code: RetryCode,
  surface: string | undefined,
  optsMaxRetries?: number,
): number {
  if (optsMaxRetries !== undefined) return Math.max(1, optsMaxRetries + 1);
  if (code === "RATE_LIMIT" && isBackgroundSurface(surface)) return 6;
  return 3;
}

/**
 * Parse an HTTP `Retry-After`. The header is either delta-seconds ("120") or an
 * HTTP-date, and both are legal, so both are handled. Returns ms, or null when
 * absent or unparseable. Never returns negative: a date already in the past means
 * wait zero, not travel backwards.
 */
export function parseRetryAfterMs(header: string | null | undefined, nowMs: number): number | null {
  if (header === null || header === undefined) return null;
  const raw = header.trim();
  if (raw === "") return null;

  if (/^\d+$/.test(raw)) return Number(raw) * 1_000;
  // A signed integer is not a legal Retry-After. Reject it here rather than let
  // Date.parse guess: "-5" is not NaN in every engine, and a date parser quietly
  // inventing a value is exactly how a wrong wait would get shipped.
  if (/^[+-]\d+$/.test(raw)) return null;

  const when = Date.parse(raw);
  if (Number.isNaN(when)) return null;
  return Math.max(0, when - nowMs);
}

/**
 * How long to wait before the next attempt, or null to stop retrying.
 *
 * Null means stop for one of three reasons, and they are deliberately not
 * distinguished here: the code is not retryable, the attempts are spent, or the
 * budget cannot cover the wait. A half-wait that then fails is strictly worse
 * than failing now, so a delay that would overrun the budget stops instead.
 */
export function nextRetryDelayMs(args: {
  /** 0-based index of the attempt that just failed. */
  attempt: number;
  code: RetryCode;
  /** From the response's `Retry-After`, when the gateway sent one. */
  retryAfterMs?: number | null;
  /** Total already spent waiting on this call. */
  spentMs: number;
  budgetMs: number;
  maxAttempts: number;
  random?: () => number;
}): number | null {
  const { attempt, code, retryAfterMs, spentMs, budgetMs, maxAttempts } = args;

  if (code !== "RATE_LIMIT" && code !== "SERVER_ERROR") return null;
  if (attempt + 1 >= maxAttempts) return null;

  if (code === "SERVER_ERROR") {
    // Unchanged from the behaviour this file replaced. A 5xx is a blip and a
    // fast retry is the right answer; it is the rate limit that needed the fix.
    return SERVER_ERROR_STEP_MS * (attempt + 1);
  }

  const remaining = budgetMs - spentMs;
  if (remaining <= 0) return null;

  let delay: number;
  if (retryAfterMs !== null && retryAfterMs !== undefined) {
    // The gateway said how long. Believe it, but never block longer than the cap
    // in a single wait even if the budget would allow it.
    delay = Math.min(retryAfterMs, MAX_SINGLE_WAIT_MS);
  } else {
    // Equal jitter: half the backoff, plus a random half. Full jitter can return
    // a near-zero delay, which is the failure this whole file exists to stop;
    // equal jitter still decorrelates callers, and the 13 `sense` call sites fire
    // together, so decorrelation is not decoration.
    const ceiling = Math.min(BASE_RATE_LIMIT_DELAY_MS * 2 ** attempt, MAX_SINGLE_WAIT_MS);
    const rnd = args.random ?? Math.random;
    delay = Math.round(ceiling / 2 + rnd() * (ceiling / 2));
  }

  if (delay > remaining) return null;
  return delay;
}
