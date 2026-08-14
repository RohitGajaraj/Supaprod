import { createFileRoute } from "@tanstack/react-router";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { indexUserCorpus } from "@/lib/rag/indexer.server";
import { withJobRunHttp, recordErrorEvent } from "@/lib/observability";

/**
 * RAG indexer tick — chunks + embeds recently changed workspace content
 * (docs, PRDs, meetings, notes, signals) into `rag_chunks`. Runs hourly
 * across all users with content. Idempotent via per-chunk content hashes.
 *
 * WHY THE FAILURE HANDLING CHANGED (2026-08-14): this tick's only failure
 * signal was a `console.error` inside the per-user loop, and a console.error in
 * a Worker reaches nobody the founder can read. If indexUserCorpus threw for
 * every user (a revoked embedding key, a dead provider, a broken migration) the
 * tick returned `{ ok: true, processed: 0, indexed: 0 }`, wrote status='ok' to
 * job_runs, and the RAG index went permanently stale with no error row anywhere.
 * Only four of the thirty-eight ticks wrote a durable error record; this is now
 * the fifth, using the same recordErrorEvent floor as embed-tick, house-rules-
 * tick, liveness-tick and uptime-tick.
 *
 * Two distinct signals, because they are two distinct incidents:
 *   - one user failing is per-user noise (a corrupt doc) and is recorded, not
 *     thrown, so the other 199 users still get indexed;
 *   - EVERY user failing is a systemic fault and is thrown, so the ledger says
 *     'error' and the watchdog stops calling this job healthy.
 */
const SURFACE = "cron.indexer-tick";
const REQUEST_PATH = "/api/public/hooks/indexer-tick";

export const Route = createFileRoute("/api/public/hooks/indexer-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireHookCaller(request);
        if (unauth) return unauth;
        return withJobRunHttp(SURFACE, async () => {
          const started = Date.now();
          // supabase-js resolves a refused read as { data: null, error }. Left
          // unchecked, a denied read produced an empty user list and a tick that
          // reported ok for doing nothing.
          const { data: users, error: usersErr } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .limit(200);
          if (usersErr) throw new Error(`profiles read failed: ${usersErr.message}`);

          const candidates = (users ?? []) as { id: string }[];
          let indexed = 0,
            skipped = 0,
            processed = 0,
            failed = 0;
          let lastError: unknown = null;

          for (const u of candidates) {
            try {
              const r = await indexUserCorpus(supabaseAdmin, u.id, 50);
              indexed += r.indexed;
              skipped += r.skipped;
              processed++;
            } catch (e) {
              failed++;
              lastError = e;
              await recordErrorEvent(e, {
                surface: SURFACE,
                failure_kind: "tool_error",
                request_path: REQUEST_PATH,
                user_id: u.id,
              });
            }
          }

          // Every candidate failing is not a bad hour, it is a broken indexer.
          // Thrown so job_runs records 'error' rather than a cheerful zero.
          if (candidates.length > 0 && failed === candidates.length) {
            throw new Error(
              `indexUserCorpus failed for all ${failed} users; last error: ${
                lastError instanceof Error ? lastError.message : String(lastError)
              }`,
            );
          }

          return new Response(
            JSON.stringify({
              ok: true,
              processed,
              indexed,
              skipped,
              failed,
              ms: Date.now() - started,
            }),
            { headers: { "Content-Type": "application/json" } },
          );
        });
      },
    },
  },
});
