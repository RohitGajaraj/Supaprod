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
 *   Dedup on the OBSERVATION, so a source that supplies no external_id cannot make
 *   one sentence look like thirteen. Added 2026-08-22, after it did exactly that:
 *   see restatement.ts, which holds the rule and the measurements behind it.
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
import {
  findRestatement,
  isFoldable,
  RESTATEMENT_WINDOW_MAX_ROWS,
  RESTATEMENT_WINDOW_MS,
  type StoredObservation,
} from "./restatement";
import type { SignalCandidate, SinkResult } from "./kinds";

// external_id / source_kind are not yet in the generated Database types; use the
// generic untyped client - same precedent as github-ingest.server.ts.
const db = supabaseAdmin as unknown as SupabaseClient;

/** A row that reached the sink already stored under a different wording. */
type FoldedRow = { ofId: string | null; rule: "text" | "vector"; similarity: number };

/**
 * Stand-in id for a row accepted earlier in this batch but not yet inserted.
 *
 * Never reaches the database or a FoldedRow: a match against one of these is rewritten
 * to `ofId: null` at the point it is recorded. It exists only so the within-batch
 * comparison can reuse the same StoredObservation shape as the stored window.
 */
const PENDING_INSERT = "";

/** What a row looks like once prepare + attachEmbeddings have run. */
type EmbeddedRow = {
  title: string;
  content: string;
  source: string;
  external_id: string | null;
  embedding?: string;
  embedding_model?: string;
};

/**
 * Drop the rows that restate something this workspace already holds.
 *
 * THE SCOPE IS THE ARGUMENT. Each clause is here because dropping it would make the
 * rule wrong in a specific way, not because it is cheap:
 *
 *   workspace_id + user_id - tenancy. `match_signals` and `match_themes` are both
 *   scoped by USER only (their WHERE clause has no workspace filter at all), and
 *   4 users on the live database hold signals in more than one workspace. This is
 *   the second sighting of KI-31; cluster.server.ts documents the first. A scoped
 *   query is used here rather than those RPCs partly for this reason, and partly
 *   because a top-K vector search can push the true near-duplicate out of the result
 *   set exactly when the window is busy - which is the case this exists for.
 *
 *   source - THE CORROBORATION GUARD. The same complaint arriving from `intercom`
 *   and from `agent` is two observers and must count twice; the same complaint
 *   arriving from `agent` twice is one voice repeating itself. Folding across
 *   sources would erase real second witnesses, which is worse than the bug.
 *
 *   external_id IS NULL, on BOTH sides - a stored row that named a distinct
 *   real-world item must never absorb a new observation, and a candidate that names
 *   one must never be folded. See isFoldable() for the full reasoning.
 *
 *   is_sample = false - a seeded demo row must not swallow a real customer's signal,
 *   and real evidence must not be attributed to a fixture. The sink never sets this
 *   column, so everything it writes is real by construction and compares like to like.
 *
 *   created_at inside the window - see RESTATEMENT_WINDOW_MS. Recurrence next week is
 *   evidence, not repetition.
 *
 * Rows are also compared against the ones EARLIER IN THIS BATCH. That path is not
 * reachable from `signals.log`, which files one candidate per call, but a connector
 * that pulls the same item under two ids in one page would otherwise walk straight
 * past a screen the stored-row path catches.
 */
async function screenRestatements(
  userId: string,
  workspaceId: string,
  rows: EmbeddedRow[],
): Promise<{ keep: EmbeddedRow[]; restated: FoldedRow[] }> {
  const foldable = rows.filter((r) => isFoldable({ externalId: r.external_id }));
  if (foldable.length === 0) return { keep: rows, restated: [] };

  const sources = [...new Set(foldable.map((r) => r.source))];
  const since = new Date(Date.now() - RESTATEMENT_WINDOW_MS).toISOString();

  const { data, error } = await db
    .from("signals")
    .select("id, title, content, embedding, embedding_model")
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId)
    .in("source", sources)
    .is("external_id", null)
    .eq("is_sample", false)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(RESTATEMENT_WINDOW_MAX_ROWS);

  // FAIL OPEN, LOUDLY. If the window cannot be read the sink stores everything, which
  // is exactly today's behaviour and therefore no worse than not having shipped this.
  // The opposite posture - refusing to store when the screen is unavailable - would
  // let a transient database error silently stop signal intake, and an outage that
  // eats evidence is a larger failure than the one being fixed here.
  if (error) {
    console.error("screenRestatements window read failed, storing unscreened:", error.message);
    return { keep: rows, restated: [] };
  }

  const window: StoredObservation[] = (
    (data ?? []) as Array<{
      id: string;
      title: string | null;
      content: string | null;
      embedding: unknown;
      embedding_model: string | null;
    }>
  ).map((r) => ({
    id: r.id,
    title: r.title,
    content: r.content,
    embedding: r.embedding,
    embeddingModel: r.embedding_model,
  }));

  const keep: EmbeddedRow[] = [];
  const restated: FoldedRow[] = [];
  // Rows accepted earlier in this same batch, so the second copy of a sentence that
  // arrives in one page is folded into the first rather than both being stored.
  const acceptedThisBatch: StoredObservation[] = [];

  for (const row of rows) {
    if (!isFoldable({ externalId: row.external_id })) {
      keep.push(row);
      continue;
    }
    const candidate = {
      title: row.title,
      content: row.content,
      embedding: row.embedding,
      embeddingModel: row.embedding_model ?? null,
    };
    const storedMatch = findRestatement(candidate, window);
    if (storedMatch) {
      restated.push(storedMatch);
      continue;
    }
    // A row earlier in THIS batch is not inserted yet, so it has no id to point at.
    // The fold is recorded with `ofId: null` rather than a placeholder: the count
    // stays right, and `recordRestatements` skips what it cannot attribute instead of
    // bumping a counter on the wrong row. Inventing an id here would be a lie no
    // reader downstream could detect.
    const batchMatch = findRestatement(candidate, acceptedThisBatch);
    if (batchMatch) {
      restated.push({ ...batchMatch, ofId: null });
      continue;
    }
    keep.push(row);
    acceptedThisBatch.push({
      id: PENDING_INSERT,
      title: row.title,
      content: row.content,
      embedding: row.embedding,
      embeddingModel: row.embedding_model ?? null,
    });
  }

  return { keep, restated };
}

/**
 * Record that an observation was said again.
 *
 * A SILENT DROP WOULD DESTROY REAL INFORMATION. "Said seven times in twenty minutes"
 * is a fact about the evidence, and it is the fact that would have made this incident
 * visible while it was happening rather than afterwards. What must NOT happen is that
 * the repetition counts as independent evidence, and a counter on the surviving row
 * cannot: there is no second row for any reader to count, and the number lives where
 * a human looking at the signal will see it.
 *
 * A LINK TABLE WAS THE ALTERNATIVE AND IS WORSE HERE. Storing each restatement as its
 * own row preserves the variant wording, but it re-creates the exact hazard being
 * fixed - N rows about one observation, one careless join away from being counted as
 * N units of evidence again. The wording it would preserve is, on the incident's own
 * rows, either a byte-identical copy or a 120-character truncation. That is not worth
 * re-opening the hole for.
 *
 * FAIL-OPEN, AND CURRENTLY INERT. `restated_count` does not exist on `public.signals`
 * yet; the migration adding it is written but deliberately unapplied. Until it is,
 * every call here fails and is swallowed, and the sink's behaviour is unchanged -
 * the fold itself needs no schema at all, because it works by not inserting a row.
 * This is the same posture `recordStageEvent` and `attachEmbeddings` already take in
 * this file: bookkeeping never breaks intake.
 */
async function recordRestatements(restated: FoldedRow[]): Promise<void> {
  if (restated.length === 0) return;
  const counts = new Map<string, number>();
  for (const r of restated) {
    if (!r.ofId) continue; // within-batch fold: the row it restates has no id yet
    counts.set(r.ofId, (counts.get(r.ofId) ?? 0) + 1);
  }
  for (const [id, n] of counts) {
    try {
      // An RPC rather than read-modify-write, so two ticks folding onto the same row
      // cannot both read N and both write N+1. The count is bookkeeping, but a
      // bookkeeping number that quietly loses increments is the kind of number this
      // repo has been burned by before.
      const { error } = await db.rpc("bump_signal_restatement", { p_signal_id: id, p_by: n });
      if (error) console.error("bump_signal_restatement failed:", error.message);
    } catch (e) {
      console.error("bump_signal_restatement threw:", e);
    }
  }
}

/**
 * Write a batch of candidates as signals for one workspace.
 * Idempotent via external_id; structural injections from untrusted sources are
 * dropped; a restatement of something already held is folded rather than stored;
 * tags/sentiment are derived when the producer omitted them.
 */
export async function writeSignals(
  userId: string,
  workspaceId: string,
  candidates: SignalCandidate[],
  opts?: { productId?: string | null },
): Promise<SinkResult> {
  if (candidates.length === 0)
    return { inserted: 0, skipped: 0, quarantined: 0, restated: 0, ids: [] };

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

  if (rows.length === 0) return { inserted: 0, skipped, quarantined, restated: 0, ids: [] };

  // Stamp the comparison vector on the way in so a freshly sensed signal is
  // dedupable and clusterable immediately rather than at the next sweep. This is a
  // latency optimisation only, it is fail-open, and `backfillSignalEmbeddings`
  // (driven by `embedding is null`) is what actually guarantees coverage, here and
  // for the write paths that never reach this sink. See signal-embedding.server.ts.
  //
  // THIS NOW RUNS BEFORE THE RESTATEMENT SCREEN, NOT AFTER THE INSERT, and the order
  // is load-bearing rather than incidental: the vector is what recognises a
  // restatement that is not a byte-for-byte copy, so it has to exist before the
  // screen can use it. The visible cost is that a row about to be folded still gets
  // embedded. That is one batched call for text already in hand, and the alternative
  // - embedding after the decision - is not an option, because then there is no
  // decision to make.
  const rowsWithVectors = await attachEmbeddings(rows, { supabase: db, userId });

  const { keep, restated } = await screenRestatements(userId, workspaceId, rowsWithVectors);
  if (keep.length === 0) {
    await recordRestatements(restated);
    return { inserted: 0, skipped, quarantined, restated: restated.length, ids: [] };
  }

  // .select("id") so each sensed signal can write its stage_events trail row.
  const { data: inserted, error } = await db.from("signals").insert(keep).select("id");
  if (error) throw new Error(`writeSignals insert failed: ${error.message}`);

  await recordRestatements(restated);

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
    inserted: keep.length,
    skipped,
    quarantined,
    restated: restated.length,
    ids: ((inserted ?? []) as Array<{ id: string }>).map((r) => r.id),
  };
}
