import { createFileRoute } from "@tanstack/react-router";

/**
 * `/health`. A LIVENESS PING, NOT A READINESS CHECK.
 *
 * P-58 (A-QUEUE.md). Hosting finding, measured 2026-09-04: the root answered
 * in 2.3s and a missing route in 3.9s after ten minutes idle; warm, the same
 * reads are under 400ms. The Worker's isolate cools between visitors, and the
 * first person to arrive after a gap pays for spinning it back up. A pg_cron
 * job pings this route every four minutes through pg_net to keep it warm.
 *
 * `@/routes/api/public/health.ts` ALREADY EXISTS, and it is deliberately not
 * this route. That one probes the database and the cron pulse -- it is a
 * READINESS check, correctly slow and correctly allowed to fail loud. Using
 * it as the keep-warm ping would mean a database round trip every four
 * minutes forever, purely to keep a Worker warm, which spends real DB load to
 * fix a CPU-cold-start problem. This route imports NOTHING that reaches a
 * database (a test reads this file's own imports, not a promise), so pinging
 * it warms the isolate and touches nothing else.
 *
 * `sha` is `CF_VERSION_METADATA_ID`, the same Worker-version identifier
 * `app-health.ts`'s own `release` field and the observability config already
 * read -- so a person watching this ping can tell a redeploy happened without
 * a second source of the same fact.
 */
export const Route = createFileRoute("/health")({
  server: {
    handlers: {
      GET: async () => {
        const sha = process.env.CF_VERSION_METADATA_ID?.trim() || null;
        return new Response(JSON.stringify({ ok: true, sha }), {
          status: 200,
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        });
      },
    },
  },
});
