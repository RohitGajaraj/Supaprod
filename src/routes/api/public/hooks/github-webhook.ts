import { createFileRoute } from "@tanstack/react-router";
import { runCiPollTick } from "./ci-poll-tick";

/**
 * GitHub webhook receiver (SW-7 founder-gated item 4, now built): reacts to
 * push/check/PR events within seconds instead of waiting for ci-poll-tick's
 * next 2-minute pg_cron tick. It does NOT replace that cron: this handler
 * fires runCiPollTick() without awaiting it to completion (the same
 * fire-and-forget shape chat.ts already uses for the orchestrator's first
 * planning call), because a Cloudflare Worker's execution can end the moment
 * this handler returns its response, and GitHub itself expects an ack within
 * seconds. If the Worker is recycled mid-sweep, the cron catches whatever
 * didn't finish; every step ci-poll-tick performs is already idempotent and
 * dedup-guarded per changeset, so a partial or duplicate run is harmless.
 *
 * Requires GITHUB_WEBHOOK_SECRET to be set, and the GitHub App's own webhook
 * URL + secret to be pointed at this route. Both are one-time, founder-level
 * GitHub App configuration steps (see docs/operations for the exact values);
 * this file is the receiving half, ready as soon as that is done. Until then
 * ci-poll-tick's own 2-minute poll keeps everything working exactly as it
 * does today; this is a pure latency improvement, not a dependency.
 */

const RELEVANT_EVENTS = new Set(["check_suite", "check_run", "pull_request", "status"]);

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function verifySignature(body: string, signatureHeader: string | null): Promise<boolean> {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return false;
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) return false;
  const provided = signatureHeader.slice("sha256=".length);

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const expected = Buffer.from(new Uint8Array(signed)).toString("hex");
  return timingSafeEqualHex(provided, expected);
}

function isActionable(eventType: string, payload: unknown): boolean {
  const action = (payload as { action?: string } | null)?.action;
  if (eventType === "check_suite" || eventType === "check_run") return action === "completed";
  if (eventType === "pull_request") {
    return action === "synchronize" || action === "opened" || action === "reopened";
  }
  if (eventType === "status") return true;
  return false;
}

export const Route = createFileRoute("/api/public/hooks/github-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.text();
        const ok = await verifySignature(body, request.headers.get("x-hub-signature-256"));
        if (!ok) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });

        const eventType = request.headers.get("x-github-event") ?? "";
        if (eventType === "ping") return Response.json({ ok: true, pong: true });

        let payload: unknown = null;
        try {
          payload = JSON.parse(body);
        } catch {
          return Response.json({ ok: false, error: "Bad JSON" }, { status: 400 });
        }

        const actionable = RELEVANT_EVENTS.has(eventType) && isActionable(eventType, payload);
        if (actionable) {
          // Deliberately not awaited to completion; see file header. A
          // synchronous throw here would otherwise surface as an unhandled
          // rejection with no caller to see it, so it is caught and logged.
          runCiPollTick().catch((e) => {
            console.error("github-webhook: runCiPollTick failed", e);
          });
        }

        return Response.json({ ok: true, eventType, actionable });
      },
    },
  },
});
