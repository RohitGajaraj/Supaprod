/**
 * INSTRUMENT: the server read behind the rework rollup.
 *
 * Rework is the KPI the research settled on for AI-assisted product work —
 * clarification loops, reopened tickets, spec/design mismatches, review burden,
 * first-pass acceptance — and it reads as relief rather than throughput,
 * because rework is unpaid work. This is the read half. The rollup itself is
 * pure and lives in `./rework`, so the same code answers the server, any
 * surface, and the tests.
 *
 * THREE READS, THREE HONESTY PROBLEMS, EACH REPORTED RATHER THAN SMOOTHED:
 *
 * 1. THE DEMO SEED IS NOT EXCLUDED IN SQL. `WHERE workspace_id::text NOT LIKE
 *    '_0000000-...'` evaluates to NULL for a null workspace_id and Postgres
 *    drops the row, and the ONE gate event a real human has ever produced
 *    carries a null workspace_id. So the exclusion happens in the pure rollup,
 *    where null is answered honestly as "not a demo workspace". The cost is
 *    that seed rows are fetched before they are discarded, which is why
 *    `gateEventsFromDemo` is reported: it is the caller's evidence the filter
 *    actually ran.
 *
 * 2. A FAILED READ IS NOT AN EMPTY ONE. Every read here degrades to an empty
 *    rollup rather than throwing, for the reason `run-analytics.functions`
 *    gives: a panel that vanishes on error tells a person "nothing happened",
 *    which on a surface whose whole job is reporting what happened is the worst
 *    available answer. But an empty rollup and a broken read look identical
 *    from the outside, so `readFailed` names which one it was, per stream.
 *
 * 3. THE WORKSPACE FILTER HIDES THE ONE REAL ROW. Passing `workspaceId` adds
 *    `.eq("workspace_id", ...)`, and the single genuinely-human gate event has
 *    no workspace. That is correct behaviour for a workspace-scoped surface and
 *    it is still worth knowing, because it is why an unscoped read and a scoped
 *    read of the same corpus can differ by exactly one row today.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  rollUpRework,
  type ReworkGateRow,
  type ReworkRollup,
  type ReworkSpecRow,
} from "@/lib/rework";

const Schema = z.object({
  workspaceId: z.string().uuid().optional(),
  /** How far back to look. Defaults to 30 days. */
  days: z.number().int().min(1).max(365).optional(),
  /** Cap on rows scanned per stream, so a busy workspace cannot make this unbounded. */
  limit: z.number().int().min(1).max(5000).optional(),
});

export type GetReworkResult = ReworkRollup & {
  /** How many rows each stream actually returned, BEFORE demo exclusion, so a
   *  surface can say "last N" rather than implying it covers everything. */
  rowsScanned: { gateEvents: number; specs: number };
  /** True when a scan hit its cap, meaning older rows are not represented. A
   *  truncated read presented as a complete one is the silent-cap failure this
   *  repo already names as a defect class. */
  truncated: { gateEvents: boolean; specs: boolean };
  /** True when the read errored. Distinct from "returned nothing". */
  readFailed: { gateEvents: boolean; specs: boolean; sendBackNotes: boolean };
};

/**
 * The rework instrument for a workspace over a window.
 *
 * Reads three streams and hands them to one pure rollup:
 *
 * - `human_gate_events` carries first-pass acceptance, review burden and
 *   reopens. All three come from the same stream on purpose: they are three
 *   readings of one event, and computing them separately is how the same screen
 *   ends up showing a correction count that does not fit inside its own gate
 *   count.
 * - `prds` carries the spec/design divergence, windowed on `updated_at`. A spec
 *   nobody has touched inside the window is not counted, which is what makes
 *   this a window rather than a running total.
 * - `approval_feedback` carries a corroborating send-back count and nothing
 *   more. It has no workspace_id, so it cannot be scoped or cleaned, and the
 *   rollup labels it accordingly rather than adding it to anything.
 */
export const getRework = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => Schema.parse(i ?? {}))
  .handler(async ({ context, data }): Promise<GetReworkResult> => {
    const { supabase, userId } = context;
    const days = data.days ?? 30;
    const limit = data.limit ?? 2000;
    const untilIso = new Date().toISOString();
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    let gateQuery = supabase
      .from("human_gate_events")
      .select("gate_type,agent_slug,workspace_id,subject_type,verdict,created_at")
      .eq("user_id", userId)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (data.workspaceId) gateQuery = gateQuery.eq("workspace_id", data.workspaceId);

    let specQuery = supabase
      .from("prds")
      .select("status,design_gate_status,workspace_id,is_sample")
      .gte("updated_at", since)
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (data.workspaceId) specQuery = specQuery.eq("workspace_id", data.workspaceId);

    // Head-count only: the notes themselves are the operator's words and belong
    // to the gate they were written on, not to an aggregate.
    const notesQuery = supabase
      .from("approval_feedback")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", since);

    const [gateRes, specRes, notesRes] = await Promise.all([gateQuery, specQuery, notesQuery]);

    const gateRows = (gateRes.error ? [] : (gateRes.data ?? [])) as ReworkGateRow[];
    const specRows = (specRes.error ? [] : (specRes.data ?? [])) as ReworkSpecRow[];
    const sendBackNotes = notesRes.error ? null : (notesRes.count ?? 0);

    return {
      ...rollUpRework({
        gateEvents: gateRows,
        specs: specRows,
        sendBackNotes,
        window: { days, sinceIso: since, untilIso },
      }),
      rowsScanned: { gateEvents: gateRows.length, specs: specRows.length },
      truncated: {
        gateEvents: gateRows.length >= limit,
        specs: specRows.length >= limit,
      },
      readFailed: {
        gateEvents: !!gateRes.error,
        specs: !!specRes.error,
        sendBackNotes: !!notesRes.error,
      },
    };
  });
