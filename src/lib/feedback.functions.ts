import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * RF-03 — the behavioral consumer for `ai_feedback`: a rating is also a
 * verdict on whichever memories fed the run that produced the rated event
 * (`memory_recall_log`, written at recall time by `logMemoryRecall` in
 * `src/lib/ai/memory.server.ts`, keyed by trace_id since one recall serves
 * every callModel call in a run). Upgrades those rows from the default
 * 'ignored' to 'used' (rating > 0) or 'contradicted' (rating < 0), and nudges
 * the memory's own `importance` +/-1 (clamped 1..5, via the `bump_memory_importance`
 * RPC — see the migration for why this has to be an atomic SQL statement, not
 * app-level read-then-write) so the signal feeds RF-02's `match_agent_memory`
 * ranking through the importance term it already reads.
 *
 * The claim itself is a single `UPDATE ... WHERE outcome = 'ignored'` — not a
 * SELECT followed by an UPDATE — so "first vote counts" is enforced by
 * Postgres row locking, not just probably true: a second concurrent call for
 * the same trace only ever claims whatever the first call's UPDATE didn't
 * already flip away from 'ignored'. Best-effort: never throws.
 */
async function applyRetrievalFeedback(
  supabase: SupabaseClient,
  eventId: string,
  rating: number,
): Promise<void> {
  if (rating === 0) return;
  const { data: event } = await supabase
    .from("ai_events")
    .select("trace_id")
    .eq("id", eventId)
    .maybeSingle();
  const traceId = (event as { trace_id?: string | null } | null)?.trace_id;
  if (!traceId) return;

  const outcome = rating > 0 ? "used" : "contradicted";
  const { data: claimed } = await supabase
    .from("memory_recall_log")
    .update({ outcome })
    .eq("trace_id", traceId)
    .eq("outcome", "ignored")
    .select("memory_id");
  const rows = (claimed ?? []) as Array<{ memory_id: string }>;
  if (!rows.length) return;

  const delta = rating > 0 ? 1 : -1;
  // Parallelize RPC calls: bump all memory IDs concurrently
  await Promise.all(
    Array.from(new Set(rows.map((r) => r.memory_id))).map((memoryId) =>
      supabase.rpc("bump_memory_importance", { p_memory_id: memoryId, p_delta: delta })
    )
  );
}

export const submitFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        eventId: z.string().uuid(),
        rating: z.number().int().min(-1).max(1),
        comment: z.string().max(2000).optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("ai_feedback").insert({
      user_id: context.userId,
      event_id: data.eventId,
      rating: data.rating,
      comment: data.comment ?? null,
    } as never);
    if (error) throw new Error(error.message);

    try {
      await applyRetrievalFeedback(
        context.supabase as unknown as SupabaseClient,
        data.eventId,
        data.rating,
      );
    } catch (e) {
      console.error("applyRetrievalFeedback failed (non-fatal):", e);
    }

    return { ok: true };
  });
