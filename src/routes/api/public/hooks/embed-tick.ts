import { createFileRoute } from "@tanstack/react-router";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { backfillSignalEmbeddings, EMBED_SWEEP_BATCH } from "@/lib/sources/signal-embedding.server";
import { backfillThemeEmbeddings, THEME_EMBED_BATCH } from "@/lib/brain/theme-embedding.server";
import { backfillMemoryEmbeddings, MEMORY_EMBED_BATCH } from "@/lib/brain/memory-embedding.server";
import {
  backfillEntityEmbeddings,
  ENTITY_EMBEDDING_SPECS,
  type EntityBackfillResult,
} from "@/lib/brain/entity-embedding.server";
import { withJobRun } from "@/lib/observability";
import { recordErrorEvent } from "@/lib/observability/errors";

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

          // Themes need the same treatment and for a sharper reason. On 2026-08-02
          // the live database held 181 themes and zero theme embeddings, because
          // computeNovelty fails open and writes a null vector when embedding fails.
          // match_themes filters on `embedding IS NOT NULL`, so with none of them
          // vectored, theme growth could never attach a single signal however well
          // the matching logic was written. This is what unblocks it.
          let themeScanned = 0,
            themeEmbedded = 0,
            themeFailed = 0;
          try {
            const t = await backfillThemeEmbeddings(supabaseAdmin, THEME_EMBED_BATCH);
            themeScanned = t.scanned;
            themeEmbedded = t.embedded;
            themeFailed = t.failed;
          } catch (e) {
            // Never let the theme sweep bury the signal sweep's result, and never
            // let it fail into a console instead of error_events.
            console.error("embed-tick theme backfill failed", e);
            void recordErrorEvent(e, {
              surface: "cron.embed-tick.themes",
              failure_kind: "sweep_failed",
            });
          }

          // Memories, for the same reason and with a sharper edge. match_agent_memory
          // filters on `embedding IS NOT NULL`, so an unembedded memory is not a weak
          // memory, it is one recall can never reach. On 2026-08-02, 249 of 421 had no
          // vector, and every single `note` and `precedent` row was among them: the
          // memories a HUMAN curated were exactly the ones the brain could not surface.
          let memScanned = 0,
            memEmbedded = 0,
            memFailed = 0;
          try {
            const m = await backfillMemoryEmbeddings(supabaseAdmin, MEMORY_EMBED_BATCH);
            memScanned = m.scanned;
            memEmbedded = m.embedded;
            memFailed = m.failed;
          } catch (e) {
            console.error("embed-tick memory backfill failed", e);
            void recordErrorEvent(e, {
              surface: "cron.embed-tick.memory",
              failure_kind: "sweep_failed",
            });
          }

          // The four entities that hold the judgment: opportunities, decisions, prds
          // and learnings. Until now none of them had an embedding column at all, so
          // the record a product team builds up was the one part of the brain that
          // semantic recall could not reach, and "have we thought about this before"
          // was answered by proxy through agent_memory instead of by the decision
          // that actually holds the answer. Table-driven, one helper, four specs:
          // see `lib/brain/entity-embedding.server.ts`.
          //
          // Each sweep gets its OWN try/catch so one failing table cannot bury the
          // other three, or the three sweeps above it. And each failure is REPORTED
          // to error_events under its own surface, not written to a console: today
          // the memory sweeper failed for hours while this route kept returning ok,
          // because a sweeper that has never once succeeded and a sweeper with
          // nothing to do look identical from the outside.
          const entities: Record<string, EntityBackfillResult> = {};
          for (const spec of ENTITY_EMBEDDING_SPECS) {
            try {
              entities[spec.table] = await backfillEntityEmbeddings(supabaseAdmin, spec);
            } catch (e) {
              console.error(`embed-tick ${spec.table} backfill failed`, e);
              void recordErrorEvent(e, {
                surface: spec.errorSurface,
                failure_kind: "sweep_failed",
                extras: { table: spec.table },
              });
              entities[spec.table] = {
                table: spec.table,
                scanned: 0,
                skipped: 0,
                embedded: 0,
                failed: 0,
              };
            }
          }

          return new Response(
            JSON.stringify({
              ok: true,
              batches,
              themeScanned,
              themeEmbedded,
              themeFailed,
              memScanned,
              memEmbedded,
              memFailed,
              entities,
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
