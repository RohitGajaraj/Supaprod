// Shared bearer-token validation + rate-limiting for MCP and A2A routes.
// Extracted so both transports use identical auth without code duplication.
import crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** The mcp_tokens columns this module needs.
 *
 *  KEPT HAND-WRITTEN ON PURPOSE, unlike every other row shape touched in this
 *  pass. validateToken selects a COLUMN LIST THAT VARIES AT RUNTIME: it asks for
 *  `scopes` first and, on a PostgREST 42703 undefined_column, re-asks without
 *  it, which is the split-deploy path documented on validateToken. A shape
 *  derived from Database would assert `scopes` is present on a row the second
 *  query deliberately does not select, so the type would be wrong in exactly
 *  the case the fallback exists to survive. `scopes` is therefore optional-by-
 *  null here and read through Array.isArray below. */
interface TokenRow {
  id: string;
  workspace_id: string;
  user_id: string;
  rate_limit_per_min: number;
  revoked_at: string | null;
  scopes: string[] | null;
}

export interface TokenValidationResult {
  valid: boolean;
  token_id?: string;
  workspace_id?: string;
  user_id?: string;
  rate_limit_per_min?: number;
  scopes?: string[];
  error?: string;
}

/**
 * Parse a bearer token from an Authorization header (format: "Bearer slug:secret").
 * Returns { slug, secretHash } on success, null on malformed input.
 */
export function parseBearerToken(
  authHeader: string | null,
): { slug: string; secretHash: string } | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const raw = authHeader.slice(7).trim();
  const colonIdx = raw.indexOf(":");
  if (colonIdx < 1) return null;
  const slug = raw.slice(0, colonIdx);
  const secret = raw.slice(colonIdx + 1);
  if (!slug || !secret) return null;
  const secretHash = crypto.createHash("sha256").update(secret).digest("hex");
  return { slug, secretHash };
}

/**
 * Validate an MCP/A2A bearer token against the mcp_tokens table.
 * Degrades gracefully when the `scopes` column is absent (split-deploy safety):
 * if PostgREST returns a 42703 undefined_column error, re-selects without
 * `scopes` and defaults to read-only (scopes = []).
 */
// All four exported entry points below took `supabase: any`, which is what let
// `.from("mcp_tokens")`, `.from("api_calls")` and `.rpc("interop_write_enabled")`
// go unchecked on the path that decides whether an outside caller may write at
// all. All three exist in the generated types (checked 2026-09-01;
// interop_write_enabled is at types.ts:10003 with Returns: boolean), so naming
// the schema costs nothing and turns the table, column and RPC-name checks back
// on for the auth path.
export async function validateToken(
  supabase: SupabaseClient<Database>,
  slug: string,
  secretHash: string,
): Promise<TokenValidationResult> {
  const selectToken = (cols: string) =>
    supabase
      .from("mcp_tokens")
      .select(cols)
      .eq("slug", slug)
      .eq("secret_hash", secretHash)
      .is("revoked_at", null)
      .maybeSingle();
  try {
    let { data: token, error } = await selectToken(
      "id, workspace_id, user_id, rate_limit_per_min, revoked_at, scopes",
    );
    if (error && (error.code === "42703" || /scopes/i.test(error.message ?? ""))) {
      ({ data: token, error } = await selectToken(
        "id, workspace_id, user_id, rate_limit_per_min, revoked_at",
      ));
    }
    if (error) return { valid: false, error: "Token lookup failed" };
    const tokenRow = token as TokenRow | null;
    if (!tokenRow) return { valid: false, error: "Invalid token" };
    return {
      valid: true,
      token_id: tokenRow.id,
      workspace_id: tokenRow.workspace_id,
      user_id: tokenRow.user_id,
      rate_limit_per_min: tokenRow.rate_limit_per_min,
      scopes: Array.isArray(tokenRow.scopes) ? tokenRow.scopes : [],
    };
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Check if a token has exceeded its per-minute rate limit.
 * Fails closed on DB error (security over availability): returns false to
 * deny access if we cannot verify the rate limit. This prevents DoS or
 * abuse during database outages. Caller can retry with exponential backoff
 * or fallback to a degraded service mode.
 */
/** The rate-limit window, in milliseconds. One place, because the retry hint
 *  below is derived from it and a second copy would make the two disagree. */
const RATE_WINDOW_MS = 60_000;

/**
 * Is this token inside its per-minute budget, and if not, WHEN may it try again?
 *
 * THE RETRY HINT IS COMPUTED, NOT GUESSED. This is a sliding window over
 * `api_calls`, so the moment capacity returns is the moment the OLDEST call in
 * the window falls out of it. A flat "wait 60 seconds" would be wrong almost
 * always and wrong in the expensive direction: an agent told to wait a minute
 * when a slot frees in three seconds sits idle for fifty-seven, and one told to
 * retry immediately hammers a closed door. The extra read only happens on the
 * throttled path, which is the rare one.
 *
 * FAIL-CLOSED KEEPS ITS FULL WINDOW. When the check itself errors this denies the
 * request, and it must not then invite an immediate retry: we do not know the
 * count, so the honest hint is the whole window rather than a number implying we
 * measured something.
 */
export async function checkRateLimit(
  supabase: SupabaseClient<Database>,
  token_id: string,
  rate_limit: number,
): Promise<{ allowed: boolean; current_count: number; retryAfterSeconds: number }> {
  const fullWindow = Math.ceil(RATE_WINDOW_MS / 1000);
  try {
    const windowStart = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
    const { count, error } = await supabase
      .from("api_calls")
      .select("*", { count: "exact", head: true })
      .eq("token_id", token_id)
      .gte("created_at", windowStart);
    if (error) {
      console.error("Rate limit check failed:", error);
      // Fail closed: deny the request rather than blindly allowing unlimited access
      return { allowed: false, current_count: 0, retryAfterSeconds: fullWindow };
    }
    const current = count || 0;
    if (current < rate_limit)
      return { allowed: true, current_count: current, retryAfterSeconds: 0 };
    return {
      allowed: false,
      current_count: current,
      retryAfterSeconds: await secondsUntilCapacity(supabase, token_id, windowStart, fullWindow),
    };
  } catch (err) {
    console.error("Rate limit check exception:", err);
    // Fail closed: deny the request on unexpected errors
    return { allowed: false, current_count: 0, retryAfterSeconds: fullWindow };
  }
}

/**
 * How long until the oldest call in the window ages out of it.
 *
 * Clamped to at least one second, because a `Retry-After: 0` is an invitation to
 * retry inside the same window and get refused again, and to at most the full
 * window, since nothing in a sliding window can take longer than that to clear.
 * Falls back to the whole window on any failure, which is the cautious direction.
 */
async function secondsUntilCapacity(
  supabase: SupabaseClient<Database>,
  token_id: string,
  windowStart: string,
  fullWindow: number,
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from("api_calls")
      .select("created_at")
      .eq("token_id", token_id)
      .gte("created_at", windowStart)
      .order("created_at", { ascending: true })
      .limit(1);
    const oldest = (data as Array<{ created_at: string }> | null)?.[0]?.created_at;
    if (error || !oldest) return fullWindow;
    const agedMs = Date.now() - new Date(oldest).getTime();
    const remaining = Math.ceil((RATE_WINDOW_MS - agedMs) / 1000);
    return Math.min(fullWindow, Math.max(1, remaining));
  } catch {
    return fullWindow;
  }
}

/**
 * Resolve the global outward-write gate. Fails CLOSED so a DB error never
 * accidentally enables writes.
 */
export async function resolveWriteEnabled(supabase: SupabaseClient<Database>): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("interop_write_enabled");
    if (error) return false;
    return data === true;
  } catch {
    return false;
  }
}
