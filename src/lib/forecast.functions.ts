import { createServerFn } from "@tanstack/react-start";
import { defaultWorkspaceId } from "@/lib/workspaces.functions";
import { z } from "zod";

import { isPreMigration } from "@/lib/read-failure";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
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

/**
 * ONE `as const` STRING LITERAL, AND IT MUST STAY THAT WAY.
 *
 * This was three lines joined with `+`, and that is the whole defect. supabase-js
 * checks a select list at the TYPE level by parsing the literal you hand it; a
 * concatenation is plain `string` to the compiler, so it gives up, hands back
 * an unparsed row, and NOTHING compares these ten names to the `decisions`
 * table. A column renamed in a migration -- or simply misspelled here -- then
 * ships as an empty field on every row of the Learn desk rather than as a build
 * failure, because PostgREST is asked for a column that does not exist and the
 * mapper below reads `undefined`.
 *
 * The existing test only asserts `FORECAST_COLS` CONTAINS certain substrings,
 * which pins the spelling and proves nothing about whether the column exists.
 * As one literal with `as const`, tsc does the real check: every name below is
 * resolved against Database["public"]["Tables"]["decisions"], and all ten were
 * additionally verified against the live database on 2026-09-01 rather than
 * against the generated file.
 *
 * If you add a column, add it INSIDE this literal. Do not concatenate.
 */
export const FORECAST_COLS =
  "id,title,forecast_claim,forecast_how_we_will_know,forecast_horizon_date,forecast_resolution,forecast_next_check_at,forecast_deferred_count,forecast_resolution_suggestion,workspace_id" as const;

export type DueForecast = {
  id: string;
  /**
   * THE WORKSPACE THIS BELONGS TO — SELECTED ALL ALONG AND DROPPED IN THE MAP.
   *
   * `FORECAST_COLS` has fetched `workspace_id` since it was written and
   * `listDueForecastsImpl` already filters on it, so the column travelled the
   * whole way and then fell out of the shape at the last step. **Asked for twice
   * by S1** (`DueForecast-drops-the-workspace-it-already-selected.md`), who
   * measured the exact gap rather than the assumed one: no query change, no new
   * read, one field.
   *
   * It matters because the inbox draws forecasts from more than one workspace
   * for a person who belongs to more than one, and a verdict shown without
   * saying whose it is asks them to grade something they cannot place.
   */
  workspaceId: string | null;
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
    /**
     * P-42. What the grader actually read, and which of it the verdict leaned
     * on. Kept apart because "it saw nine things and used two" and "it saw two
     * things" are different facts about the same verdict, and a person deciding
     * whether to accept a draft needs both. Empty on every suggestion drafted
     * before P-42, which reads correctly: those were graded on one line.
     */
    read: Array<{ kind: string; id: string; line: string }>;
    cited: string[];
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
  db: SupabaseClient<Database>,
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
  /*
   * `const row = r as unknown as Record<string, unknown>` USED TO STAND HERE,
   * AND IT WAS THE SECOND HALF OF THE FORECAST_COLS HOLE.
   *
   * Collapsing FORECAST_COLS into one literal (see its note above) is only half
   * the repair: a double assertion through `unknown` to an index signature
   * discards whatever the query returned, so every field below was read off a
   * bag of `unknown` and no name in it was compared to anything. Measured
   * 2026-09-01: with the literal fixed but this cast still in place, misspelling
   * a column inside FORECAST_COLS produced ZERO tsc errors. With the cast gone
   * it produces a build failure, which is the entire point of the exercise.
   *
   * `r` is now the row PostgREST inferred from the select list, so
   * `r.forecast_deferred_count` and its nine siblings are checked names. The
   * String()/Number() coercions stay: they normalise nullable columns into the
   * non-null DueForecast shape the desk renders, which is a different job from
   * knowing the column exists.
   */
  const due = (data ?? [])
    // The SQL and the predicate agree by construction, but the predicate is the
    // authority: one rule, one place.
    .filter((row) => isForecastDue(row, nowIso))
    .map((row) => {
      const horizon = String(row.forecast_horizon_date);
      const s = row.forecast_resolution_suggestion as {
        verdict?: string;
        rationale?: string;
        confidence?: number;
        read?: Array<{ kind?: string; id?: string; line?: string }>;
        cited?: string[];
      } | null;
      return {
        id: String(row.id),
        // Null-preserving: a forecast with no workspace is a real state and
        // `""` would be a workspace id that matches nothing while looking like
        // one. F-76's law at field level.
        workspaceId: row.workspace_id ?? null,
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
              read: Array.isArray(s.read)
                ? s.read.map((r) => ({
                    kind: String(r?.kind ?? "source"),
                    id: String(r?.id ?? ""),
                    line: String(r?.line ?? ""),
                  }))
                : [],
              cited: Array.isArray(s.cited) ? s.cited.map((c) => String(c)) : [],
            }
          : null,
      };
    });
  return { due, total: count ?? due.length };
}

export async function settleForecastImpl(
  db: SupabaseClient<Database>,
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
  db: SupabaseClient<Database>,
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
  db: SupabaseClient<Database>,
  input: { decisionId: string; reason: string },
  actorId: string | null,
  nowIso: string,
): Promise<{ ok: true; priorResolution: ForecastResolution }> {
  const { data: row, error: readErr } = await db
    .from("decisions")
    // One literal, not a `+`-joined pair; see the note on FORECAST_COLS.
    .select(
      "id,workspace_id,forecast_resolution,forecast_resolution_rationale,forecast_resolved_at,forecast_resolved_by_agent_slug",
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
  db: SupabaseClient<Database>,
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
  db: SupabaseClient<Database>,
  /** See the note on `getForecastCallRateImpl`. Default is every workspace. */
  workspaceId?: string | null,
): Promise<{ settled: AgentSettledForecast[] }> {
  const matching = db
    .from("decisions")
    // One literal, not a `+`-joined pair; see the note on FORECAST_COLS.
    .select(
      "id,title,forecast_claim,forecast_resolution,forecast_resolution_rationale,forecast_resolved_at,forecast_resolved_by_agent_slug",
    )
    .not("forecast_resolved_by_agent_slug", "is", null);
  const { data, error } = await (workspaceId ? matching.eq("workspace_id", workspaceId) : matching)
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

export async function getForecastCallRateImpl(
  db: SupabaseClient<Database>,
  /**
   * Optional, default every workspace, and `getForecastCallRateHere` is what
   * the one surface that draws this calls.
   *
   * ── THE TWO NUMBERS THAT WERE RIGHT ABOUT DIFFERENT OBJECTS ─────────────
   * Read signed in on 2026-09-10, on `/outcomes` in workspace `c8ffbbe7`
   * ("A1 delete probe": 8 decisions, 6 carrying a forecast, 0 resolved):
   *
   *   "Your calls -- You called it on 6 of the last 9"
   *   ...four regions down...
   *   "No forecast has been graded yet."
   *
   * Both true. The first counted `decisions.forecast_resolution` over EVERY
   * workspace RLS admits; the second counts `insights.resolution` inside this
   * one. One noun, two populations, two tables, one scroll -- and this file's
   * own header already named that failure and built `listDueForecastsHere` to
   * stop it, for a different pair, three months earlier.
   */
  workspaceId?: string | null,
): Promise<ForecastCallSummary> {
  const matching = db
    .from("decisions")
    .select("forecast_resolution")
    .not("forecast_resolution", "is", null)
    .neq("forecast_resolution", "inconclusive");
  const { data, error } = await (workspaceId ? matching.eq("workspace_id", workspaceId) : matching)
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
/**
 * ── THE THREE `Here` READS TAKE THE WORKSPACE YOU ARE STANDING IN ─────────
 *
 * Each takes `workspaceId` and resolves the person's default only when the
 * caller has none, which is the shape P-75 requires and this file did not have.
 * The original `listDueForecastsHere` resolved `current_user_default_workspace`
 * and could not be told otherwise, and its own comment argued for that:
 * *"Passing an id from the client would let them [answer to different
 * workspaces]"*. That was written against a real failure -- two halves of one
 * sentence answering to two workspaces -- and it fixes it in the wrong place.
 *
 * Since migration `20260907010000` a person can hold two workspaces, and the
 * DEFAULT is not the one they have open. `a-read-serves-the-workspace-you-are-in`
 * has the reading A1 took on exactly this surface: *"1 of 2 graded forecasts
 * came true"* on Outcomes, and it was Helio Labs'. That is the same tenancy
 * defect as the unscoped read, one layer in, and a caller putting
 * `activeWorkspaceId` in its query key makes it look correct while it is wrong.
 *
 * So the id comes from the caller, and the ORIGINAL argument is honoured by
 * every read on the desk taking the SAME id from one source rather than by
 * hiding the resolution: see `ForecastDeskPanel`, which passes
 * `activeWorkspaceId` to all three and keys all three on it.
 *
 * The default remains the fallback, because a caller that genuinely has no
 * workspace to name must still work; the strip's `useSpineStrip` is one.
 */
const AtWorkspace = z.object({ workspaceId: z.string().uuid().nullable().optional() });

export const listDueForecastsHere = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AtWorkspace.parse(i ?? {}))
  .handler(async ({ context, data }) => {
    const db = context.supabase as unknown as SupabaseClient;
    /* The caller's id first, the person's default only as the fallback. Written
       out rather than shared through a helper on purpose: the ratchet in
       `a-read-serves-the-workspace-you-are-in.test.ts` reads source text and
       cannot see through a call, so a helper here would have moved this file to
       zero by blinding the scanner rather than by fixing the read. */
    let workspaceId = data?.workspaceId ?? null;
    if (!workspaceId) {
      const { data: ws } = await db.rpc("current_user_default_workspace");
      workspaceId = defaultWorkspaceId(ws);
    }
    /* NO WORKSPACE IS NOT EVERY WORKSPACE. If neither the caller nor the RPC can
       name one, falling through to the unscoped read would silently answer a
       different question than the caller asked - the exact substitution this
       function exists to stop. An empty answer is the honest one. */
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

/**
 * ── THE DESK'S THREE READS, ALL ANSWERING FOR ONE WORKSPACE ───────────────
 *
 * `listDueForecastsHere` shipped alone because the pair it was written for was
 * a strip badge beside a calibration line. The DESK kept all three of its
 * unscoped reads, and the desk has exactly one caller in the tree:
 * `/outcomes`, which is a workspace record. It prints "8 decisions" for this
 * workspace four regions below the nine forecasts it was drawing from other
 * people's.
 *
 * On production, 2026-09-10, in `c8ffbbe7` -- a workspace with SIX forecasts
 * and NONE of them overdue -- the desk drew nine rows, about crypto wallet
 * parity, $7.99 pricing and tablet checkout: Helio Labs' work, in a workspace
 * named "A1 delete probe". The `DueForecast` type has carried a `workspaceId`
 * field since S1 asked for it twice, expressly because "a verdict shown
 * without saying whose it is asks them to grade something they cannot place",
 * and the panel never rendered it.
 *
 * Scoped rather than labelled, and the argument for scoping over labelling is
 * the surface: a cross-workspace queue is a real thing and this product
 * already has one -- the Inbox, which this same page links to two regions
 * further down. A record page shows its own record.
 *
 * All three, together. A scoped due list beside an unscoped call rate is the
 * same defect one shelf along, and it is how this one survived.
 *
 * The workspace is resolved SERVER-SIDE, and all three resolve it the same
 * way, so the count in the heading and the denominator in the rate cannot
 * answer to different workspaces. An id passed from the client could.
 */
export const listAgentSettledForecastsHere = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AtWorkspace.parse(i ?? {}))
  .handler(async ({ context, data }) => {
    const db = context.supabase as unknown as SupabaseClient;
    // Caller's id first, the default only as the fallback. See listDueForecastsHere.
    let workspaceId = data?.workspaceId ?? null;
    if (!workspaceId) {
      const { data: ws } = await db.rpc("current_user_default_workspace");
      workspaceId = defaultWorkspaceId(ws);
    }
    /* NO WORKSPACE IS NOT EVERY WORKSPACE, the same refusal `listDueForecastsHere`
       makes and for the same reason: falling through to the unscoped read would
       answer a different question than the caller asked. */
    if (!workspaceId) return { settled: [] as AgentSettledForecast[] };
    return listAgentSettledForecastsImpl(db, workspaceId);
  });

export const getForecastCallRateHere = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AtWorkspace.parse(i ?? {}))
  .handler(async ({ context, data }) => {
    const db = context.supabase as unknown as SupabaseClient;
    // Caller's id first, the default only as the fallback. See listDueForecastsHere.
    let workspaceId = data?.workspaceId ?? null;
    if (!workspaceId) {
      const { data: ws } = await db.rpc("current_user_default_workspace");
      workspaceId = defaultWorkspaceId(ws);
    }
    /* Summarising an empty array produces a real-looking rate built on no
       rows, which is the same trap the error path here already refuses. So the
       honest empty answer goes through `summarizeForecastCalls([])`, which says
       "no calls yet" rather than a score. */
    if (!workspaceId) return summarizeForecastCalls([]);
    return getForecastCallRateImpl(db, workspaceId);
  });
