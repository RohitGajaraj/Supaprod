import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { isPreMigration } from "@/lib/read-failure";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  isForecastDue,
  summarizeForecastCalls,
  suggestionQuality,
  buildDeferPatch,
  buildSettlePatch,
  dueCheckFilter,
  type ForecastResolution,
  type ForecastCallSummary,
  type SuggestionQuality,
} from "./brain/forecast-resolution";

// FC-01, the grading half: the reads and writes behind the Learn desk's forecast
// group. Capture lives in decisions.functions.ts and is a separate
// responsibility with separate consumers, which is why this is its own module.
//
// Plan: docs/planning/initiatives/forecast-resolution-plan.md

export const FORECAST_COLS =
  "id,title,forecast_claim,forecast_how_we_will_know,forecast_horizon_date," +
  "forecast_resolution,forecast_next_check_at,forecast_deferred_count," +
  "forecast_resolution_suggestion,workspace_id";

export type DueForecast = {
  id: string;
  title: string;
  claim: string;
  howWeWillKnow: string;
  horizonDate: string;
  daysLate: number;
  deferredCount: number;
  suggestion: {
    verdict: ForecastResolution;
    rationale: string;
    confidence: number;
    /**
     * Which of the three a reader is looking at. Without it a model that
     * returned unparseable garbage renders identically to a considered
     * judgment, because both arrive as `inconclusive`.
     */
    quality: SuggestionQuality;
  } | null;
};

/**
 * The desk shows twelve. This says how many there are.
 *
 * AN HONEST COUNT RATHER THAN PAGINATION, which is the right call on a list this
 * short: pagination adds a control for a problem nobody has, while silently
 * hiding the oldest overdue calls is the wrong failure on a desk whose entire
 * purpose is that overdue calls get answered. So the surface can say "N more,
 * oldest first" and mean it.
 */
export const DUE_FORECAST_PAGE = 12;

/**
 * WHY EVERY READ HERE FAILS SOFT.
 *
 * Migrations go live through Lovable the moment they are applied; app code goes
 * live separately when publish is clicked. Two switches, no enforced order, and
 * PostgREST answers an unknown column with an ERROR rather than a null. So a
 * throw here does not degrade the Learn desk, it breaks it, and it takes the
 * spec-outcome half down with it because both live on one route. Returning the
 * empty shape keeps the station standing.
 *
 * The writes below deliberately do NOT fail soft. A write that silently does
 * nothing is the defect deferOutcomeCheck was fixed for: the control said the
 * date moved while the row sat unchanged, which teaches people the button is
 * broken.
 */
/*
 * `isPreMigration` moved to `@/lib/read-failure` (F-126). It was written twice
 * within a day of itself, and two copies of a rule about telling two things
 * apart is how they drift back together. The reasoning that produced it lives
 * in that module's header, unabridged.
 */

export async function listDueForecastsImpl(
  db: SupabaseClient,
  nowIso: string,
  /**
   * Optional, and the DEFAULT IS STILL EVERY WORKSPACE.
   *
   * The desk's unscoped read is deliberate and stays that way; see the note
   * below. This exists because a WORKSPACE-SCOPED surface cannot borrow a
   * cross-workspace count without lying about it.
   *
   * The board pairs this number with `getForecastCalibration`, which resolves
   * `current_user_default_workspace` and counts one workspace. Putting an
   * unscoped count beside a scoped one in a single sentence - "came true 1 of 2
   * times. 2 more are past their date" - gives a reader one denominator drawn
   * from two different populations. This repo already has a name for that
   * failure: two numbers right about different objects.
   */
  workspaceId?: string | null,
): Promise<{ due: DueForecast[]; total: number }> {
  /**
   * No workspace filter BY DEFAULT, deliberately: RLS admits every workspace
   * the caller belongs to, so the desk is "every call anywhere that needs
   * settling", which matches listPendingOutcomes sitting beside it.
   */
  const matching = db
    .from("decisions")
    // `count: "exact"` alongside the limit, so the surface can say "N more,
    // oldest first" instead of silently hiding the oldest overdue calls. On a
    // desk whose entire purpose is that overdue calls get answered, a cap with
    // no indicator is the wrong failure, and pagination on a list this short
    // would add a control for a problem nobody has.
    .select(FORECAST_COLS, { count: "exact" })
    .not("forecast_claim", "is", null)
    .is("forecast_resolution", null)
    .lte("forecast_horizon_date", nowIso)
    /**
     * `.or` and never a bare `.lte` on forecast_next_check_at. NULL is the
     * overwhelming majority, every forecast nobody deferred, and a bare
     * comparison drops NULLs in SQL. That would empty the desk of everything
     * except previously-deferred forecasts, which is the loudest possible way to
     * get this wrong and still look like it works. The same mistake shipped
     * twice on the spec queue; see the two comments inside listPendingOutcomes.
     */
    .or(dueCheckFilter(nowIso));

  /* THE FILTER GOES BEFORE `count`, WHICH IS THE WHOLE POINT. `count: "exact"`
     counts the rows the FILTERS match, not the rows the limit returns, so
     scoping here scopes the population and the page together. Applying it after
     `.limit` would page an unscoped set and then count a scoped one. */
  const { data, error, count } = await (
    workspaceId ? matching.eq("workspace_id", workspaceId) : matching
  )
    .order("forecast_horizon_date", { ascending: true })
    .limit(DUE_FORECAST_PAGE);
  /*
   * ── F-120: AN UNREADABLE DESK USED TO REPORT AN EMPTY ONE ────────────────
   *
   * `return { due: [], total: 0 }` made "the query failed" and "nothing is
   * overdue" the same answer on the one desk whose entire purpose is that
   * overdue calls get answered.
   *
   * IT WAS WORSE THAN A WRONG NUMBER, because `ForecastDeskPanel` returns null
   * when all three of its reads come back empty. That null is deliberate and
   * right ("an account that has never recorded a forecast should not be shown a
   * desk for settling them") but it turned a total read failure into the desk
   * DISAPPEARING FROM THE PAGE. Not an error, not "nothing due": gone. A person
   * would conclude they had nothing to settle.
   *
   * The sibling in this very feature already fixed this and wrote down why:
   * `auditDueForecasts` throws, with a comment reading "A FAILED READ IS NOT AN
   * EMPTY QUEUE, and the old return made the two identical". The tick learned
   * it; the desk it feeds did not.
   *
   * Throwing is what `useQuery` needs to set `isError`, which is the only way
   * the panel can tell the difference.
   */
  if (error) {
    // The desk must stand before the migration lands; it must not stand silently
    // empty when the table is there and unreadable.
    if (isPreMigration(error)) return { due: [], total: 0 };
    throw new Error(`The forecasts that are due could not be read: ${error.message}`);
  }

  const nowMs = Date.parse(nowIso);
  const due = (data ?? [])
    // The SQL and the predicate agree by construction, but the predicate is the
    // authority: one rule, one place.
    .filter((r) => isForecastDue(r as never, nowIso))
    .map((r) => {
      const row = r as unknown as Record<string, unknown>;
      const horizon = String(row.forecast_horizon_date);
      const s = row.forecast_resolution_suggestion as {
        verdict?: string;
        rationale?: string;
        confidence?: number;
      } | null;
      return {
        id: String(row.id),
        title: String(row.title ?? ""),
        claim: String(row.forecast_claim ?? ""),
        howWeWillKnow: String(row.forecast_how_we_will_know ?? ""),
        horizonDate: horizon,
        daysLate: Math.floor((nowMs - Date.parse(horizon)) / 86_400_000),
        deferredCount: Number(row.forecast_deferred_count ?? 0),
        suggestion: s?.verdict
          ? {
              verdict: s.verdict as ForecastResolution,
              rationale: String(s.rationale ?? ""),
              confidence: Number(s.confidence ?? 0),
              quality: suggestionQuality({
                verdict: s.verdict,
                rationale: s.rationale,
                confidence: s.confidence,
              }),
            }
          : null,
      };
    });
  return { due, total: count ?? due.length };
}

export async function settleForecastImpl(
  db: SupabaseClient,
  input: { decisionId: string; resolution: ForecastResolution; rationale: string },
  nowIso: string,
): Promise<{ ok: true }> {
  const patch = buildSettlePatch({
    resolution: input.resolution,
    rationale: input.rationale,
    nowIso,
    agentSlug: null,
  });
  /**
   * CHECKED, BECAUSE supabase-js RESOLVES A REFUSED WRITE. An RLS refusal comes
   * back as success with zero rows, so without `.select()` and an empty check
   * this would report a settled forecast that is still sitting on the desk.
   */
  const { data: rows, error } = await db
    .from("decisions")
    .update(patch)
    .eq("id", input.decisionId)
    .select("id");
  if (error) throw new Error(error.message);
  if (!rows || rows.length === 0) {
    throw new Error("The verdict did not land. You may not have rights on this decision.");
  }
  return { ok: true };
}

export async function deferForecastCheckImpl(
  db: SupabaseClient,
  input: { decisionId: string; days: number },
  nowMs: number,
): Promise<{ checkBy: string; deferredCount: number }> {
  // Read the count first so the increment is honest. Two people deferring the
  // same forecast in the same second is not worth a transaction here: the worst
  // outcome is a count one low on a field nothing gates on.
  const { data: before } = await db
    .from("decisions")
    .select("forecast_deferred_count")
    .eq("id", input.decisionId)
    .maybeSingle();
  const priorCount =
    (before as { forecast_deferred_count?: number | null } | null)?.forecast_deferred_count ?? 0;

  const patch = buildDeferPatch({ days: input.days, priorCount, nowMs });
  const { data: rows, error } = await db
    .from("decisions")
    .update(patch)
    .eq("id", input.decisionId)
    .select("id");
  if (error) throw new Error(error.message);
  if (!rows || rows.length === 0) {
    throw new Error("The check date did not move. You may not have rights on this decision.");
  }
  return { checkBy: patch.forecast_next_check_at, deferredCount: patch.forecast_deferred_count };
}

/**
 * Put a settled forecast back on the desk, WITHOUT erasing the verdict it had.
 *
 * WHY THIS EXISTS AT ALL. Migration 20260812210000 added
 * `forecast_resolved_by_agent_slug` and argued the column exists so an agent
 * verdict stays reversible. Nothing could reverse one: once
 * `forecast_resolution` is non-null `isForecastDue` returns false, the row never
 * comes back to the desk, and no surface or API offered a control. The property
 * the column was added to guarantee was inverted in practice.
 *
 * WHY IT APPENDS RATHER THAN REWRITING, which is the whole design. Letting a
 * caller overwrite a settled verdict in place would make the grade mutable, and
 * this feature rests on a forecast being a thing nobody can quietly revise once
 * the answer is known. But a wrong verdict left permanently in place is also a
 * false entry, one the surface refuses to let anyone correct. Both corrupt the
 * record. So the prior verdict, its rationale, its timestamp and the slug of
 * whatever settled it are copied into an append-only log FIRST, and only then
 * are the live columns cleared. The history reads underneath the live state
 * rather than being replaced by it, and the log has no update or delete policy
 * at all, so it cannot be pruned by any authenticated caller.
 *
 * WHAT STAYS FROZEN IS UNTOUCHED. The claim, the observable and the horizon are
 * still held by `enforce_forecast_immutable`. What a team believed beforehand
 * remains unrewritable. Only the grade may be revisited, which was always the
 * intent: re-scoring on better evidence is legitimate, and the original
 * migration exempts the resolution fields on purpose.
 */
export async function reopenForecastImpl(
  db: SupabaseClient,
  input: { decisionId: string; reason: string },
  actorId: string | null,
  nowIso: string,
): Promise<{ ok: true; priorResolution: ForecastResolution }> {
  const { data: row, error: readErr } = await db
    .from("decisions")
    .select(
      "id,workspace_id,forecast_resolution,forecast_resolution_rationale," +
        "forecast_resolved_at,forecast_resolved_by_agent_slug",
    )
    .eq("id", input.decisionId)
    .maybeSingle();
  if (readErr) throw new Error(readErr.message);
  const current = row as {
    workspace_id: string | null;
    forecast_resolution: string | null;
    forecast_resolution_rationale: string | null;
    forecast_resolved_at: string | null;
    forecast_resolved_by_agent_slug: string | null;
  } | null;
  if (!current) throw new Error("We could not find that decision, so nothing changed.");
  if (!current.forecast_resolution) {
    throw new Error("That forecast has no verdict to reopen. It is already waiting on the desk.");
  }

  /**
   * THE HISTORY LANDS BEFORE THE CLEAR, and the order is the safety property. If
   * the log write fails, the verdict is still on the row and the caller is told
   * it did not reopen. Clearing first and logging second would lose the verdict
   * entirely on exactly the same failure, which is the one outcome this whole
   * design exists to prevent.
   */
  const { error: logErr } = await db.from("forecast_resolution_log").insert({
    decision_id: input.decisionId,
    workspace_id: current.workspace_id,
    resolution: current.forecast_resolution,
    resolution_rationale: current.forecast_resolution_rationale,
    resolved_at: current.forecast_resolved_at,
    resolved_by_agent_slug: current.forecast_resolved_by_agent_slug,
    reopened_by: actorId,
    reopened_at: nowIso,
    reason: input.reason,
  });
  if (logErr) {
    throw new Error(
      `The previous verdict could not be filed, so it was not reopened and nothing was lost: ${logErr.message}`,
    );
  }

  /**
   * Guarded on the verdict we just filed. Between the read and here somebody
   * could have reopened it already, and clearing again would file a second
   * history row for a verdict that is no longer on the record.
   */
  const { data: cleared, error } = await db
    .from("decisions")
    .update({
      forecast_resolution: null,
      forecast_resolution_rationale: null,
      forecast_resolved_at: null,
      forecast_resolved_by_agent_slug: null,
      // Back on the desk immediately rather than behind an old deferral.
      forecast_next_check_at: null,
    })
    .eq("id", input.decisionId)
    .eq("forecast_resolution", current.forecast_resolution)
    .select("id");
  if (error) throw new Error(error.message);
  if (!cleared || cleared.length === 0) {
    throw new Error(
      "The verdict did not move. Somebody may have reopened it already, or you may not have rights on this decision.",
    );
  }
  return { ok: true as const, priorResolution: current.forecast_resolution as ForecastResolution };
}

export type ForecastHistoryEntry = {
  resolution: ForecastResolution;
  rationale: string | null;
  resolvedAt: string | null;
  resolvedByAgentSlug: string | null;
  reopenedAt: string;
  reopenedBy: string | null;
  reason: string;
};

/** Every verdict this forecast has carried and had taken off it, newest first. */
export async function getForecastHistoryImpl(
  db: SupabaseClient,
  decisionId: string,
): Promise<{ history: ForecastHistoryEntry[] }> {
  const { data, error } = await db
    .from("forecast_resolution_log")
    .select(
      "resolution,resolution_rationale,resolved_at,resolved_by_agent_slug,reopened_at,reopened_by,reason",
    )
    .eq("decision_id", decisionId)
    .order("reopened_at", { ascending: false })
    .limit(20);
  // Fails soft for the same reason every read in this module does: the table
  // goes live when the migration is applied and the code when publish is
  // clicked, and a throw here would take the whole Learn desk down rather than
  // hiding one panel.
  // Same rule as the due list above: a failed read is not an empty history.
  if (error) {
    if (isPreMigration(error)) return { history: [] };
    throw new Error(`This forecast's history could not be read: ${error.message}`);
  }
  return {
    history: ((data ?? []) as Array<Record<string, unknown>>).map((r) => ({
      resolution: String(r.resolution) as ForecastResolution,
      rationale: (r.resolution_rationale as string | null) ?? null,
      resolvedAt: (r.resolved_at as string | null) ?? null,
      resolvedByAgentSlug: (r.resolved_by_agent_slug as string | null) ?? null,
      reopenedAt: String(r.reopened_at),
      reopenedBy: (r.reopened_by as string | null) ?? null,
      reason: String(r.reason ?? ""),
    })),
  };
}

/**
 * The oversight half of the auto-settle gate, mirroring listAgentSettledOutcomes.
 * An agent verdict is only reversible if somebody can see it, so the slug column
 * that makes the set filterable gets a surface.
 */
export type AgentSettledForecast = {
  id: string;
  title: string | null;
  forecast_claim: string | null;
  forecast_resolution: string | null;
  forecast_resolution_rationale: string | null;
  forecast_resolved_at: string | null;
  forecast_resolved_by_agent_slug: string | null;
};

export async function listAgentSettledForecastsImpl(
  db: SupabaseClient,
): Promise<{ settled: AgentSettledForecast[] }> {
  const { data, error } = await db
    .from("decisions")
    .select(
      "id,title,forecast_claim,forecast_resolution,forecast_resolution_rationale," +
        "forecast_resolved_at,forecast_resolved_by_agent_slug",
    )
    .not("forecast_resolved_by_agent_slug", "is", null)
    .order("forecast_resolved_at", { ascending: false })
    .limit(8);
  // Same rule: reporting "your crew has settled nothing" over an unreadable
  // table is the claim most likely to be believed and least likely to be true.
  if (error) {
    if (isPreMigration(error)) return { settled: [] };
    throw new Error(`What your crew settled could not be read: ${error.message}`);
  }
  return { settled: (data ?? []) as unknown as AgentSettledForecast[] };
}

export async function getForecastCallRateImpl(db: SupabaseClient): Promise<ForecastCallSummary> {
  const { data, error } = await db
    .from("decisions")
    .select("forecast_resolution")
    .not("forecast_resolution", "is", null)
    .neq("forecast_resolution", "inconclusive")
    .order("forecast_resolved_at", { ascending: false })
    .limit(10);
  /*
   * Same rule, and this one was the most misleading of the four: summarising an
   * EMPTY array produces a real-looking rate built on no rows, so an unreadable
   * table rendered as a confident score rather than as a blank.
   */
  if (error) {
    if (isPreMigration(error)) return summarizeForecastCalls([]);
    throw new Error(`Your forecast record could not be read: ${error.message}`);
  }
  return summarizeForecastCalls(
    ((data ?? []) as Array<{ forecast_resolution: string | null }>).map((r) => ({
      resolution: r.forecast_resolution,
    })),
  );
}

// The server functions are thin wrappers, so every branch above stays reachable
// from a test without a database or an auth context.

export const listDueForecasts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) =>
    listDueForecastsImpl(context.supabase as unknown as SupabaseClient, new Date().toISOString()),
  );

/**
 * THE SAME COUNT, FOR ONE WORKSPACE.
 *
 * ── WHY A SECOND ENTRY POINT RATHER THAN A PARAMETER ON THE FIRST ──────────
 * `listDueForecasts` is the desk's read and its scope is a designed answer:
 * "every call anywhere that needs settling". Changing it, or giving it an input
 * its three existing callers would have to start passing, would put that answer
 * at risk to serve a different surface. This adds a door rather than moving one.
 *
 * ── THE DEFECT IT EXISTS FOR ───────────────────────────────────────────────
 * `/today` pairs this count with `getForecastCalibration`, which resolves
 * `current_user_default_workspace` and counts ONE workspace. Read together they
 * were one sentence with two populations behind it:
 *
 *     "Your forecasts came true 1 of 2 times.        <- this workspace
 *      2 more are past their date..."                 <- every workspace
 *
 * Both numbers true, one sentence, and a reader with no way to see the seam.
 * The station strip had the same problem: its stations count this workspace's
 * runs, so a cross-workspace badge beside them says the same thing twice with
 * different meanings.
 *
 * The workspace is resolved SERVER-SIDE by the same RPC the calibration read
 * uses, so the two halves of that sentence cannot answer to different
 * workspaces. Passing an id from the client would let them.
 */
export const listDueForecastsHere = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase as unknown as SupabaseClient;
    const { data: ws } = await db.rpc("current_user_default_workspace");
    const workspaceId = (ws as string | null) ?? null;
    /* NO WORKSPACE IS NOT EVERY WORKSPACE. If the RPC cannot name one, falling
       through to the unscoped read would silently answer a different question
       than the caller asked - the exact substitution this function exists to
       stop. An empty answer is the honest one. */
    if (!workspaceId) return { due: [], total: 0 };
    return listDueForecastsImpl(db, new Date().toISOString(), workspaceId);
  });

export const settleForecast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        decisionId: z.string().uuid(),
        resolution: z.enum(["hit", "miss", "inconclusive"]),
        rationale: z.string().min(1).max(1000),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) =>
    settleForecastImpl(
      context.supabase as unknown as SupabaseClient,
      data,
      new Date().toISOString(),
    ),
  );

export const deferForecastCheck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        decisionId: z.string().uuid(),
        days: z.number().int().min(1).max(365).default(14),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) =>
    deferForecastCheckImpl(context.supabase as unknown as SupabaseClient, data, Date.now()),
  );

export const reopenForecast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        decisionId: z.string().uuid(),
        /**
         * REQUIRED, and the minimum is not arbitrary. Reopening a verdict is a
         * claim that the record is wrong, and a claim with no argument is the
         * same non-answer as a status word on its own. The reason is the content
         * of the new history row, not paperwork attached to it. The database
         * carries the same floor so no other writer can route around it.
         */
        reason: z.string().trim().min(3).max(1000),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) =>
    reopenForecastImpl(
      context.supabase as unknown as SupabaseClient,
      data,
      context.userId ?? null,
      new Date().toISOString(),
    ),
  );

export const getForecastHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ decisionId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) =>
    getForecastHistoryImpl(context.supabase as unknown as SupabaseClient, data.decisionId),
  );

export const listAgentSettledForecasts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) =>
    listAgentSettledForecastsImpl(context.supabase as unknown as SupabaseClient),
  );

export const getForecastCallRate = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) =>
    getForecastCallRateImpl(context.supabase as unknown as SupabaseClient),
  );
