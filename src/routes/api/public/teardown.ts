import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { checkPublicDecisionRateLimit } from "@/lib/decisions-ratelimit.server";
import { runPublicTeardown, TEARDOWN_MAX_INPUT_CHARS } from "@/lib/ai/public-teardown.server";

/**
 * RPT-03: Zero-connector first receipt (the public demo wedge / launch gate).
 *
 * Unauthenticated POST: a stranger with no signup and no connectors pastes a PRD
 * or a one-line product bet and gets a receipted Critic teardown. Follows the
 * ingest-signals.ts public-door shape (createFileRoute + server.handlers with a
 * permissive CORS OPTIONS preflight, supabaseAdmin, JSON responses).
 *
 * Safety, in order:
 *  1. Per-IP rate limit (anti-abuse / cost cap on a paid model call). Keyed by the
 *     client IP: cf-connecting-ip first (the edge sets it and a client cannot
 *     spoof it), x-forwarded-for / x-real-ip only as dev fallbacks. A tighter
 *     TEARDOWN_PER_IP_HOURLY cap is passed (a paid LLM call, not a cheap read).
 *     This is a real, enforcing limiter: `checkPublicDecisionRateLimit` keys on a `client_ip text`
 *     column and mirrors KI-10. (The KI-10 ingest limiter was NOT used here even
 *     though it looks similar: its `token_id` is a `uuid` FK to `ingest_tokens`, so a
 *     synthetic string key like "teardown:<ip>" throws an invalid-uuid error and the
 *     limiter fails OPEN, silently disabling the cap. The IP-keyed limiter is the
 *     honest primitive for an anonymous stranger.)
 *  2. Input cap + zod validation (1..8000 chars).
 *  3. Injection screen + untrusted-input fencing happens inside runPublicTeardown
 *     (quarantineUntrusted + a fenced <pasted_document> block), so a pasted document
 *     that tries to hijack the model is treated strictly as passive data.
 *
 * The platform runs the call on ITS OWN AI account, resolved from the app_settings
 * `public_teardown_user_id` row, no visitor, no BYO key. If unset, the door is 503
 * (dormant), never silently free.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });

const bodySchema = z.object({
  text: z.string().min(1).max(TEARDOWN_MAX_INPUT_CHARS),
});

/**
 * Resolve the caller's IP. On Cloudflare Workers, `cf-connecting-ip` is set by
 * the edge and cannot be spoofed by the client, so it is the trustworthy key and
 * MUST be checked first. `x-forwarded-for` (first hop) and `x-real-ip` are
 * dev / non-CF fallbacks a client CAN forge, so they come last. Mirrors the
 * canonical `getClientIp` in decisions-share.functions.ts. (Trusting XFF first
 * would let a single machine rotate a fake first hop on every request and slip
 * past the per-IP cap entirely, draining the whole daily budget from one curl.)
 */
function clientIp(request: Request): string {
  const cf = request.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;
  const xff = request.headers.get("x-forwarded-for");
  const firstHop = xff ? xff.split(",")[0].trim() : "";
  if (firstHop) return firstHop;
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

// A paid model call needs a much tighter per-IP cap than the shared 600/hr
// public-read default: a real human evaluating the demo does a handful of
// teardowns, not dozens. This is the per-actor fairness bound; the DAILY_CAP
// below is the absolute platform-wide spend ceiling.
const TEARDOWN_PER_IP_HOURLY = 20;

export const Route = createFileRoute("/api/public/teardown")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        try {
          // 1. Per-IP rate limit (fails open on a DB fault, by design).
          const ip = clientIp(request);
          const rl = await checkPublicDecisionRateLimit(
            supabaseAdmin,
            `teardown:${ip}`,
            TEARDOWN_PER_IP_HOURLY,
          );
          if (!rl.allowed) {
            return json(
              { error: "Rate limit exceeded", retryAfterSeconds: rl.retryAfterSeconds },
              429,
            );
          }

          // 2. Body: strict shape, bounded length.
          let raw: unknown;
          try {
            raw = await request.json();
          } catch {
            return json({ error: "invalid JSON body" }, 400);
          }
          const parsed = bodySchema.safeParse(raw);
          if (!parsed.success) {
            return json(
              { error: `expected { text: string } (1..${TEARDOWN_MAX_INPUT_CHARS} chars)` },
              400,
            );
          }

          // 3. Resolve the platform's own AI account (never a visitor / BYO key).
          const { data: settings } = await supabaseAdmin
            .from("app_settings")
            .select("value")
            .eq("key", "public_teardown_user_id")
            .maybeSingle();
          const rawVal = settings?.value;
          const platformUserId = typeof rawVal === "string" ? rawVal.trim() : "";
          if (!platformUserId) {
            return json({ error: "teardown not configured" }, 503);
          }

          // 3b. Global daily circuit breaker. The per-IP limit does not bound total
          // spend under IP rotation, so a public unauthenticated model call also needs
          // a hard platform-wide ceiling. Approximate on purpose (a racy counter is
          // fine for a cost cap); resets each UTC day. Counted BEFORE the call so a
          // burst cannot outrun the ceiling.
          const DAILY_CAP = 300;
          const today = new Date().toISOString().slice(0, 10);
          const { data: capRow } = await supabaseAdmin
            .from("app_settings")
            .select("value")
            .eq("key", "public_teardown_day")
            .maybeSingle();
          const cap = (capRow?.value ?? {}) as { date?: string; count?: number };
          const usedToday = cap.date === today ? (cap.count ?? 0) : 0;
          if (usedToday >= DAILY_CAP) {
            return json(
              {
                error: "Daily teardown limit reached, try again tomorrow",
                retryAfterSeconds: 3600,
              },
              429,
            );
          }
          await supabaseAdmin.from("app_settings").upsert(
            {
              key: "public_teardown_day",
              value: { date: today, count: usedToday + 1 },
              updated_at: new Date().toISOString(),
            },
            { onConflict: "key" },
          );

          // 4. Run the teardown. Screening + untrusted fencing happen inside.
          const teardown = await runPublicTeardown(supabaseAdmin, platformUserId, parsed.data.text);
          if (!teardown) {
            return json({ error: "could not generate a teardown, try again" }, 502);
          }

          return json({ teardown });
        } catch (e) {
          console.error("[public-teardown]", e);
          return json({ error: "internal error" }, 500);
        }
      },
    },
  },
});
