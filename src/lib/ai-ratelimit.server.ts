/**
 * SW-6 (mission 3.12, tenant safety): per-user rolling-window rate limit for
 * the authenticated AI chat surface (/api/chat).
 *
 * Audit finding: budgets are the only cost brake and they are day-granularity;
 * a burst can burn a full day's cap in seconds and hammer provider quotas
 * shared by all tenants. Per-token limiters exist for MCP/A2A and public
 * ingest, but nothing throttled a logged-in browser user.
 *
 * Mirrors decisions-ratelimit.server.ts (pure policy + thin DB wrapper) keyed
 * on user_id instead of client IP. 60 requests / 10-minute rolling window
 * (~6/min sustained): invisible to a human conversing, a wall for a script.
 *
 * Fails OPEN on DB error: the daily/monthly budget caps (seeded fail-closed
 * for every user by 20260707195000) remain the hard spend gate; this limiter
 * is burst protection, and its outage must not brick chat for everyone.
 * The pinned AI runtime is untouched.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { decidePublicReadRateLimit, type RateLimitDecision } from "./decisions-ratelimit.server";

export const AI_LIMIT_PER_WINDOW = 60;
export const AI_WINDOW_DURATION_MS = 10 * 60 * 1000; // 10 minutes

type RateLimitRow = { id: string; request_count: number; window_start: string };

/**
 * The sentence a person reads when this trips (P-76): what happened, what to
 * do, when it lifts. Both callers (`/api/chat`, `/api/plan-gate`) carried
 * the same literal string with no "when it lifts" half at all --
 * `retryAfterSeconds` rode along in the JSON body unread by anything on the
 * client, so a person who hit this had no way to know whether to wait five
 * seconds or five minutes. Composed once here so both callers say the same
 * true thing rather than two copies free to drift.
 */
export function aiRateLimitSentence(retryAfterSeconds: number): string {
  const when =
    retryAfterSeconds < 60
      ? "in under a minute"
      : `in about ${Math.ceil(retryAfterSeconds / 60)} minute${Math.ceil(retryAfterSeconds / 60) === 1 ? "" : "s"}`;
  return `You're sending requests too quickly. Give it a short breather -- this opens up again ${when}.`;
}

/** Pure policy, delegated to the tested decidePublicReadRateLimit with AI-surface bounds. */
export function decideUserAiRateLimit(row: RateLimitRow | null, nowMs: number): RateLimitDecision {
  return decidePublicReadRateLimit(row, nowMs, AI_LIMIT_PER_WINDOW, AI_WINDOW_DURATION_MS);
}

/**
 * Enforce the per-user cap. Returns { allowed: true } within budget, or
 * { allowed: false, retryAfterSeconds } when the user exceeded the window.
 * `db` must be a service-role client (the table is service-role only).
 */
export async function checkUserAiRateLimit(
  db: SupabaseClient,
  userId: string,
): Promise<{ allowed: true } | { allowed: false; retryAfterSeconds: number }> {
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  try {
    const { data: row, error: getError } = await db
      .from("user_ai_rate_limits")
      .select("id,request_count,window_start")
      .eq("user_id", userId)
      .maybeSingle();
    if (getError) throw new Error(getError.message);

    const decision = decideUserAiRateLimit((row as RateLimitRow | null) ?? null, nowMs);

    if (decision.kind === "block") {
      return { allowed: false, retryAfterSeconds: decision.retryAfterSeconds };
    }

    if (decision.kind === "reset") {
      const { error } = await db
        .from("user_ai_rate_limits")
        .upsert(
          { user_id: userId, request_count: 1, window_start: nowIso, updated_at: nowIso },
          { onConflict: "user_id" },
        );
      if (error) throw new Error(error.message);
      return { allowed: true };
    }

    const { error } = await db
      .from("user_ai_rate_limits")
      .update({ request_count: decision.nextCount, updated_at: nowIso })
      .eq("id", decision.id);
    if (error) throw new Error(error.message);
    return { allowed: true };
  } catch (error) {
    console.warn(
      "[ai-ratelimit] DB error, allowing request (budget caps remain the hard gate):",
      error instanceof Error ? error.message : error,
    );
    return { allowed: true };
  }
}
