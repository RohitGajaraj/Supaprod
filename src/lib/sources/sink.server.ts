/**
 * Signal Fabric - the single write path into public.signals.
 *
 * Every source (connectors, the Scout, MCP sources, webhook, manual) funnels its
 * SignalCandidate[] through here. The sink fetches the external_ids already stored
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
  if (candidates.length === 0) return { inserted: 0, skipped: 0, quarantined: 0 };

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

  if (rows.length === 0) return { inserted: 0, skipped, quarantined };

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

  return { inserted: rows.length, skipped, quarantined };
}
