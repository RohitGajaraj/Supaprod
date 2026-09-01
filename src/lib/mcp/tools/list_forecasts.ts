import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { dueCheckFilter, isForecastDue } from "@/lib/brain/forecast-resolution";
import { supabaseForUser, notAuthed } from "../supabase-for-user";

/**
 * ── THE MOAT WAS THE ONE THING THE AGENT SURFACE COULD NOT READ ───────────
 *
 * CLAUDE.md states the product's central claim in one sentence: the moat is
 * "the forecast captured at decision time -- what a team believed would happen,
 * recorded before the outcome was known". Counted 2026-09-01, this OAuth surface
 * exposed five read-only tools -- `whoami`, `list_workspaces`, `list_decisions`,
 * `search_signals`, `list_runs` -- and not one of them returned a forecast.
 * `list_decisions` selects `id, title, status, rationale, created_at`, a fixed
 * column list that omits all eleven forecast columns, so a connected agent could
 * read that a decision was made and had no way to find out what was PREDICTED
 * when it was made, when that prediction comes due, or whether it held.
 *
 * Measured against production the same day: 390 decisions, 194 of them carrying
 * a forecast, 91 of those already settled (46 hit, 23 miss, 22 inconclusive).
 * Every one of those 91 verdicts was reachable on the human Learn desk and none
 * of them was reachable by a machine on this surface. The product's defensible
 * layer was human-only by accident of a select list.
 *
 * ── WHY THIS IS NOT "LIST THE OVERDUE ONES" ───────────────────────────────
 * The older token-scoped surface at POST /api/mcp already ships
 * `list_due_forecasts`, which returns only calls past their horizon that nobody
 * has settled. That is the settle queue, and it is the right shape for the tool
 * it feeds. It is the wrong shape for this question. Measured today, 103
 * forecasts are unsettled and only 34 are past their horizon: a due-only view
 * hides 69 live predictions, the furthest reaching to 2030-01-01, and it hides
 * all 91 that already have a verdict. "What did we predict, when is it due, and
 * did it hold" needs the whole population, so `state` defaults to `all` and
 * narrowing is the caller's choice rather than the tool's.
 *
 * ── READ ONLY, AND SETTLING ONE IS NOT A TOOL DEFINITION'S CALL ───────────
 * The obvious next tool writes a verdict. It is not in this commit and that is a
 * decision rather than an omission. Grading a forecast is a human judgment in
 * this product and the code already says so twice: `canAutoSettle` refuses to
 * let an agent originate a grade at all -- it requires a linked outcome a PERSON
 * settled, plus confidence over 0.75, precisely because the chain
 * agent-judges-outcome then agent-judges-forecast was reachable until
 * 2026-08-14. And it holds in the data: all 91 settled verdicts carry a null
 * `forecast_resolved_by_agent_slug`, meaning a person settled every single one.
 * Opening a machine path to the grade would change what the product's own
 * acceptance measures, and that belongs to the founder.
 *
 * ── WHY THE DRAFTED VERDICT IS DELIBERATELY NOT RETURNED ──────────────────
 * `decisions.forecast_resolution_suggestion` holds a model's proposed verdict
 * and 6 rows carry one today, so this is a live risk rather than a hypothetical.
 * The Learn desk shows it behind `suggestionQuality`, which exists because an
 * unparseable reply and a considered judgment both arrive as `inconclusive` and
 * a reader who cannot tell them apart learns to distrust both. An agent has no
 * such label and no such caution: it would read `.verdict` and report that a
 * call held when nobody has graded it. The one thing this tool must never do is
 * let an unsettled forecast read as settled, so the draft stays off the wire.
 * `forecast_resolution` is non-null if and only if a verdict is on the record.
 *
 * ── AND NO HIT RATE, FOR THE REASON THIS REPO ALREADY NAMED ───────────────
 * A "you called N of M" line computed here would count the page, not the
 * workspace, and land beside numbers computed over the whole population. That is
 * two numbers right about different objects, the failure `listDueForecastsImpl`
 * carries a long comment about. The rows are returned whole; a caller that wants
 * a rate can count what it asked for.
 *
 * ── ONE FACT THE SCHEMA DOES NOT HOLD, SAID RATHER THAN APPROXIMATED ──────
 * WHO settled a forecast is not recorded when a person settles it. The only
 * column is `forecast_resolved_by_agent_slug`, and `settleForecastImpl` passes
 * `agentSlug: null` on the human path, so it is null on all 91. `decisions.user_id`
 * is the decision's author and would be a plausible, wrong answer, so it is not
 * returned as a settler. Note the asymmetry: `forecast_resolution_log.reopened_by`
 * DOES name the person who took a verdict off, so the schema can name a reverser
 * and cannot name a grader. That log is not joined here either -- it holds 0 rows
 * today, and a second query on every call to serve a case that has never occurred
 * is the wrong trade. `getForecastHistoryImpl` reads it when one exists.
 *
 * Every column below was checked against `src/integrations/supabase/types.ts`
 * before it was written, and then the check itself was checked: swapping
 * `forecast_resolution_rationale` for a plausible `forecast_resolution_reason`
 * and running tsc produced `SelectQueryError<"column
 * 'forecast_resolution_reason' does not exist on 'decisions'">`, naming the
 * offending column rather than failing vaguely. Worth doing once because an
 * invented column name ships as an empty field on every row rather than as an
 * error, which is why `hold_because` cost an hour on `list_runs` an hour before
 * this, and because the guard is silently absent unless the select is a single
 * literal -- see the note on FORECAST_SELECT.
 *
 * RLS DOES THE TENANCY. `supabaseForUser` is the caller's own client, so a token
 * that cannot see a workspace cannot see its forecasts -- the same boundary the
 * browser gets, not a parallel one that has to be kept in step.
 */

/**
 * The forecast columns plus the four that let a caller place the decision they
 * hang off. The prose half (claim, how we will know, horizon) AND the band --
 * see the note directly above the literal.
 *
 * ONE STRING LITERAL, NOT A CONCATENATION, and that is the difference between a
 * checked select and an unchecked one. I wrote this across five `+`-joined lines
 * first because it reads better wrapped, and tsc rejected the whole handler with
 * `Conversion of type 'GenericStringError'`: TypeScript infers `string` for a
 * concatenation of literals, supabase-js needs the literal type to parse the
 * column list, and an unparseable list means every column name goes unchecked.
 * `FORECAST_COLS` in forecast.functions.ts is concatenated exactly this way and
 * gets away with it only because it is handed to an untyped SupabaseClient,
 * which checks nothing either way. Wrapping this for readability would buy a
 * tidier line and lose the guard that caught `hold_because` on list_runs.
 */
/*
 * ── THE BAND WAS MISSING, AND IT IS THE HALF A MACHINE CAN CHECK ──────────
 * (2026-09-01, found by an adversarial verifier re-measuring against the
 * database rather than against this repo.)
 *
 * The first version of this select carried the PROSE forecast -- the claim, how
 * we will know, the horizon -- and none of the numbers. So a connecting agent
 * asking "what did we predict" got a sentence and a date and never a figure,
 * and asking "is this drifting" got nothing at all. The tool built to expose
 * the moat to a machine omitted the only machine-readable part of it.
 *
 * WHY IT WAS MISSED, WHICH IS THE MORE USEFUL FINDING. The column list was
 * checked against `src/integrations/supabase/types.ts` -- a GENERATED file --
 * and reported as "the schema". It was stale. Measured against production the
 * same day: `public.decisions` carries TWENTY `forecast_*` columns and the
 * generated types knew about ELEVEN. The nine missing ones were exactly the
 * band: metric, baseline, predicted, direction, the two thresholds,
 * observations, and the two if-missed / if-drifting actions.
 *
 * SO `tsc` WAS GIVING FALSE CONFIDENCE IN BOTH DIRECTIONS. It correctly
 * refused `hold_because` on `spine_tracks`, a column that does not exist -- and
 * it would equally have refused `forecast_predicted`, a column that DOES exist
 * and is live, because the generated file had not caught up. A type check
 * against a generated artifact is only as true as the last generation. The
 * types were regenerated upstream and now carry all twenty.
 *
 * THE BAND IS NOT DECORATION. `driver.ts` briefs every Decide crew to record it
 * and says why: it "is what makes a forecast checkable before its horizon
 * instead of once at the end". That is precisely the question an agent polling
 * this tool is asking, and it is the one it could not ask.
 */
const FORECAST_SELECT =
  "id, title, status, created_at, forecast_claim, forecast_how_we_will_know, forecast_horizon_date, forecast_next_check_at, forecast_deferred_at, forecast_deferred_count, forecast_resolution, forecast_resolution_rationale, forecast_resolved_at, forecast_resolved_by_agent_slug, forecast_metric, forecast_baseline, forecast_predicted, forecast_direction, forecast_band_drifting_at, forecast_band_missed_at, forecast_observations, forecast_if_missed, forecast_if_drifting";

export default defineTool({
  name: "list_forecasts",
  title: "List forecasts",
  description:
    "List what a Supaprod workspace predicted before the outcome was known: the claim, the observable chosen to settle it, the date it comes due, and the verdict if one has been settled (hit, miss or inconclusive). Use list_workspaces to find the workspace_id, or pass decision_id from list_decisions to read one decision's forecast. state=due narrows to calls past their date that nobody has settled.",
  inputSchema: {
    workspace_id: z.string().uuid().describe("Workspace UUID from list_workspaces."),
    decision_id: z
      .string()
      .uuid()
      .describe(
        "Optional decision UUID from list_decisions, to read just that decision's forecast.",
      )
      .optional(),
    state: z
      .enum(["all", "open", "due", "settled"])
      .describe(
        "all: every forecast recorded here. open: no verdict yet, whether or not its date has passed. due: past its date, no verdict, and not deferred past today. settled: has a verdict.",
      )
      .default("all")
      .optional(),
    limit: z.number().int().min(1).max(100).default(25).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ workspace_id, decision_id, state, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    const supabase = supabaseForUser(ctx);
    /* UTC, because the columns are timestamptz and every writer of them produces
       toISOString output, which is what makes the lexical comparisons inside
       isForecastDue correct. Reading local time here would shift every due
       boundary by the caller's offset. */
    const nowIso = new Date().toISOString();
    const nowMs = Date.parse(nowIso);
    const want = state ?? "all";

    let q = supabase
      .from("decisions")
      .select(FORECAST_SELECT)
      .eq("workspace_id", workspace_id)
      /* A decision with no claim carries no forecast, and 196 of the 390 rows are
         in that state. They are already reachable through list_decisions, so
         returning them here would pad every answer with rows that cannot answer
         the question the tool is named for. */
      .not("forecast_claim", "is", null);

    if (decision_id) q = q.eq("id", decision_id);
    if (want === "settled") q = q.not("forecast_resolution", "is", null);
    if (want === "open" || want === "due") q = q.is("forecast_resolution", null);
    if (want === "due") {
      q = q
        .lte("forecast_horizon_date", nowIso)
        /*
         * `.or(dueCheckFilter(...))` and never a bare `.lte` on
         * forecast_next_check_at. NULL is the overwhelming majority -- every
         * forecast nobody deferred -- and a bare comparison drops NULLs in SQL.
         * Measured today that mistake is total rather than partial: 0 rows carry
         * a deferral, so all 103 unsettled forecasts have a NULL there and a
         * bare `.lte` would return an empty due list while looking like it
         * worked. The clause is imported rather than rewritten because the desk
         * query and the settle tick already take it from that one place, and a
         * third copy is how they drift.
         */
        .or(dueCheckFilter(nowIso));
    }

    /*
     * THE ORDER DEPENDS ON THE QUESTION, because the two questions are asked
     * against different dates. An unsettled call is interesting by how overdue it
     * is, so horizon ascending puts the most overdue first, matching the Learn
     * desk. A settled one is interesting by how recently it was graded, so
     * resolved_at descending puts the newest verdict first; horizon ascending
     * there would lead with the oldest call the workspace ever closed.
     */
    const ordered =
      want === "settled"
        ? q.order("forecast_resolved_at", { ascending: false, nullsFirst: false })
        : q.order("forecast_horizon_date", { ascending: true, nullsFirst: false });

    const { data, error } = await ordered.limit(limit ?? 25);
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }

    const forecasts = (data ?? []).map((r) => {
      const row = r as Record<string, unknown>;
      const horizon = (row.forecast_horizon_date as string | null) ?? null;
      const horizonMs = horizon ? Date.parse(horizon) : Number.NaN;
      return {
        ...row,
        /*
         * The first derived field, and it earns its place the way `is_held` does
         * on list_runs: a caller should not have to know that a deferral
         * suppresses a call whose date has passed. Reading it off the columns
         * needs three rules at once, and the predicate holding those rules is
         * the same one the desk query and the settle tick answer to, so a caller
         * cannot disagree with the product about what is due.
         */
        is_due: isForecastDue(
          {
            forecast_claim: (row.forecast_claim as string | null) ?? null,
            forecast_horizon_date: horizon,
            forecast_resolution: (row.forecast_resolution as string | null) ?? null,
            forecast_next_check_at: (row.forecast_next_check_at as string | null) ?? null,
          },
          nowIso,
        ),
        /*
         * NULL rather than a negative number when the date has not arrived. A
         * forecast due in 2030 is not "-1218 days late"; it is not late at all,
         * and a signed field invites a caller to sort on it and rank the future
         * against the past. Same floor division the desk uses, so the two
         * surfaces cannot report a different lateness for one call.
         */
        days_late:
          Number.isFinite(horizonMs) && nowMs > horizonMs
            ? Math.floor((nowMs - horizonMs) / 86_400_000)
            : null,
      };
    });

    return {
      content: [{ type: "text", text: JSON.stringify(forecasts) }],
      structuredContent: { forecasts },
    };
  },
});
