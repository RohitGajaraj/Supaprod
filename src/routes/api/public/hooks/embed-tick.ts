import { createFileRoute } from "@tanstack/react-router";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  backfillSignalEmbeddings,
  EMBED_SWEEP_BATCH,
} from "@/lib/sources/signal-embedding.server";
import { withJobRun } from "@/lib/observability";

/**
 * Signal embedding sweeper, stamps the comparison vector on any signal that does
 * not have one yet.
 *
 * This is the correctness guarantee for `signals.embedding`, and therefore for the
 * `match_signals` RPC, near-duplicate detection, and theme growth. It is driven by
 * TABLE STATE (`embedding is null`), not by call sites, which matters because
 * twelve modules insert into `public.signals` and only the connector sink stamps a
 * vector inline. Anything the sink misses, onboarding, meetings, audio, analytics,
 * MCP, pulse, the sense/steward ticks, the public ingest route, manual capture, and
 * any write path added in future, is caught here on the next pass. It also drains
 * the rows written before signal embeddings existed, with no separate backfill script.
 *
 * Bounded: at most MAX_BATCHES batches per tick so one run stays well inside the
 * Worker CPU budget. A large backlog drains over several ticks, oldest first.
 */
const MAX_BATCHES = 4;

export const Route = createFileRoute("/api/public/hooks/embed-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireHookCaller(request);
        if (unauth) return unauth;
        return withJobRun("cron.embed-tick", async () => {
          const started = Date.now();
          let scanned = 0,
            embedded = 0,
            failed = 0,
            batches = 0;

          for (let i = 0; i < MAX_BATCHES; i++) {
            const r = await backfillSignalEmbeddings(supabaseAdmin, EMBED_SWEEP_BATCH);
            scanned += r.scanned;
            embedded += r.embedded;
            failed += r.failed;
            batches++;
            // Nothing left to do, or the whole batch failed (provider down), either
            // way, stop burning the tick and let the next one retry.
            if (r.scanned === 0 || r.embedded === 0) break;
          }

          return new Response(
            JSON.stringify({
              ok: true,
              batches,
              scanned,
              embedded,
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
