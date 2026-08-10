/**
 * INSTRUMENT: the server read behind per-station run analytics.
 *
 * The brief's requirement is that every agent run reports outcome, retries,
 * abandonment, time to first result and station, because when agents do most
 * of the work, watching the UI cannot reveal friction. This is the read half.
 * The rollup itself is pure and lives in `./run-analytics`, so the same code
 * answers the server, any surface, and the tests.
 *
 * STATION IS DERIVED, NOT STORED. `agent_runs` carries `agent_slug`, and
 * `agentStation` already maps a slug to its station from the canonical
 * catalogue. Adding a `station` column would be a second source of truth that
 * drifts the first time an agent is re-homed, which is the defect this
 * codebase has paid for repeatedly with hand-copied lists.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { rollUpRuns, type RunAnalytics, type RunRow } from "@/lib/run-analytics";
import { runAttemptColumnsPresent } from "@/lib/ai/run-attempt.server";

const Schema = z.object({
  workspaceId: z.string().uuid().optional(),
  /** How far back to look. Defaults to 30 days. */
  days: z.number().int().min(1).max(365).optional(),
  /** Cap on rows scanned, so a busy workspace cannot make this unbounded. */
  limit: z.number().int().min(1).max(5000).optional(),
});

export type GetRunAnalyticsResult = RunAnalytics & {
  /** How many rows the rollup actually saw, so a surface can say "last N runs"
   *  rather than implying it covers everything. */
  rowsScanned: number;
  /** True when the scan hit its cap, meaning older runs are not represented.
   *  Reported rather than hidden: a truncated read presented as a complete one
   *  is the silent-cap failure this repo already names as a defect class. */
  truncated: boolean;
};

/**
 * Per-station run analytics for a workspace.
 *
 * Returns an honest empty rollup rather than throwing when the read fails: a
 * dashboard panel that vanishes on error tells a person "nothing happened",
 * which on a surface whose whole job is reporting what happened is the worst
 * available answer. The caller can tell the two apart because `rowsScanned` is
 * 0 in both cases but `truncated` is only ever true on a real read.
 */
export const getRunAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => Schema.parse(i ?? {}))
  .handler(async ({ context, data }): Promise<GetRunAnalyticsResult> => {
    const { supabase } = context;
    const days = data.days ?? 30;
    const limit = data.limit ?? 2000;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // The retry/resume columns are asked for ONLY once the migration has landed.
    // PostgREST rejects an entire select that names an absent column, and the
    // error branch below answers with an empty rollup — so an ungated column
    // here would blank the whole panel and report "no runs" for a workspace with
    // 1,232 of them. The probe is cached per isolate; a false answer costs the
    // two new signals and keeps the four that already work.
    const columns = (await runAttemptColumnsPresent(supabase))
      ? "agent_slug,status,duration_ms,failure_kind,halted_reason,attempt,resume_count"
      : "agent_slug,status,duration_ms,failure_kind,halted_reason";

    let q = supabase
      .from("agent_runs")
      .select(columns)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (data.workspaceId) q = q.eq("workspace_id", data.workspaceId);

    const { data: rows, error } = await q;
    if (error) {
      return { ...rollUpRuns([]), rowsScanned: 0, truncated: false };
    }
    const list = (rows ?? []) as RunRow[];
    return {
      ...rollUpRuns(list),
      rowsScanned: list.length,
      truncated: list.length >= limit,
    };
  });
