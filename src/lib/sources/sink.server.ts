/**
 * Signal Fabric - the write path every source SHOULD funnel through.
 *
 * IT IS NOT THE ONLY ONE, and this header claimed it was until 2026-08-15. That
 * claim mattered because it is the kind a reader believes: seventeen code paths
 * insert into `public.signals` and, at the time of writing, seven reach this
 * function. The eleven that did not were each missing everything below, and the
 * omission was invisible precisely because the header said it could not happen.
 *
 * WHAT A BYPASS COSTS, in the order it hurts:
 *
 *   THE TRAIL ROW. `stage_events` with `to_stage='sensed'` is the first link of the
 *   record chain, and `loop-state.functions.ts` renders "New signals came in" from
 *   exactly that row. A signal written around this function is invisible to the
 *   surface that reports where the loop stands. `signals.log` -- the tool
 *   Discover's entire crew is told to call -- was one of those bypasses, so the
 *   autonomous spine's own evidence did not register as Discover having happened.
 *   It now files through here.
 *
 *   `source_kind`, which every read that filters the fabric by lane depends on.
 *   A row without it belongs to no lane.
 *
 *   Dedup on `external_id`, so a re-run of the same source is a no-op.
 *
 *   The injection screen, for text arriving from outside.
 *
 *   The inline embedding, so a signal is clusterable on the tick it lands rather
 *   than at the next backfill sweep.
 *
 * THE REMAINING BYPASSES ARE NAMED RATHER THAN LEFT AS A SURPRISE. The public
 * ingest webhook and the MCP `ingest_signal` tool both screen their own input and
 * insert directly; the demo feed, onboarding, meetings, audio, support triage and
 * pulse each build their own row. Some are defensible and some are debt, but a
 * reader deciding whether to add the eighteenth door should know which they are
 * joining, not be told the door does not exist.
 *
 * Every source that DOES come through here (connectors, the Scout, MCP sources,
 * the webhook token path, manual capture, and the agent's own signals.log) hands
 * over a SignalCandidate[] rather than a row. The sink fetches the external_ids already stored
 * for this (user, workspace), runs the pure prepare core (screen + dedup + normalize
 * + stamp source_kind), and inserts. This is the one place dedup, injection-screening,
 * and the source_kind discriminator live, so a new source inherits all three by
 * construction. Server-only.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { recordStageEvent } from "@/lib/stage-events.server";
import { prepareSignalRows } from "./prepare";
import { attachEmbeddings } from "./signal-embedding.server";
import type { SignalCandidate, SinkResult } from "./kinds";

// external_id / source_kind are not yet in the generated Database types; use the
// generic untyped client - same precedent as github-ingest.server.ts.
const db = supabaseAdmin as unknown as SupabaseClient;

/**
 * Write a batch of candidates as signals for one workspace.
 * Idempotent via external_id; structural injections from untrusted sources are
 * dropped; tags/sentiment are derived when the producer omitted them.
 */
export async function writeSignals(
  userId: string,
  workspaceId: string,
  candidates: SignalCandidate[],
  opts?: { productId?: string | null },
): Promise<SinkResult> {
  if (candidates.length === 0) return { inserted: 0, skipped: 0, quarantined: 0, ids: [] };

  // Fetch already-seen external_ids for this workspace to skip them cheaply.
  const extIds = candidates.map((c) => c.externalId).filter((id): id is string => Boolean(id));
  let seen = new Set<string>();
  if (extIds.length > 0) {
    const { data: existing } = await db
      .from("signals")
      .select("external_id")
      .eq("user_id", userId)
      .eq("workspace_id", workspaceId)
      .in("external_id", extIds);
    seen = new Set((existing ?? []).map((r) => r.external_id as string));
  }

  const { rows, skipped, quarantined } = prepareSignalRows(
    userId,
    workspaceId,
    candidates,
    seen,
    opts,
  );

  if (rows.length === 0) return { inserted: 0, skipped, quarantined, ids: [] };

  // Stamp the comparison vector on the way in so a freshly sensed signal is
  // dedupable and clusterable immediately rather than at the next sweep. This is a
  // latency optimisation only, it is fail-open, and `backfillSignalEmbeddings`
  // (driven by `embedding is null`) is what actually guarantees coverage, here and
  // for the write paths that never reach this sink. See signal-embedding.server.ts.
  const rowsWithVectors = await attachEmbeddings(rows, { supabase: db, userId });

  // .select("id") so each sensed signal can write its stage_events trail row.
  const { data: inserted, error } = await db.from("signals").insert(rowsWithVectors).select("id");
  if (error) throw new Error(`writeSignals insert failed: ${error.message}`);

  // SW-5 deliverable C: every sensed signal gets a visible trail row
  // (entity_type='signal', to_stage='sensed'), the DONE-WHEN "SIG trace ref +
  // stage_events row" and the first link of the Trust Ledger chain. Because the
  // sink is the single write path, EVERY source (GitHub, Scout, MCP, webhook,
  // manual) inherits the trail. recordStageEvent is fail-safe (swallows errors),
  // so a trail miss never breaks the signal write.
  for (const row of (inserted ?? []) as Array<{ id: string }>) {
    await recordStageEvent(db, {
      entityType: "signal",
      entityId: row.id,
      to: "sensed",
      actor: "system",
      workspaceId,
      userId,
    });
  }

  // The ids come off the same `.select("id")` the trail loop above already reads,
  // so this reports what the database actually accepted rather than what was sent.
  return {
    inserted: rows.length,
    skipped,
    quarantined,
    ids: ((inserted ?? []) as Array<{ id: string }>).map((r) => r.id),
  };
}
