// FC-01, the grading half. Every rule that decides behaviour lives here, pure,
// so all of it is table-testable without a database and without a model call.
//
// THIS FILE IMPORTS NOTHING, AND THAT IS LOAD BEARING. forecast-words.ts is
// reached from a client component and takes the ForecastResolution type from
// here. summarizeResolutions in calibrate-insights.server.ts computes the same
// counts, and importing it would put callModel and the whole AI runtime one
// accidental value-import away from the client bundle. The four lines of counting
// below are duplicated on purpose; the zero-state STRING is pinned to the shared
// one by a test, so the two cannot drift apart unnoticed.
//
// Plan: docs/planning/initiatives/forecast-resolution-plan.md

export type ForecastResolution = "hit" | "miss" | "inconclusive";

/** The confidence a drafted verdict must clear before it may settle itself. */
export const AUTO_SETTLE_CONFIDENCE_FLOOR = 0.75;

export type DueForecastRow = {
  forecast_claim: string | null;
  forecast_horizon_date: string | null;
  forecast_resolution: string | null;
  forecast_next_check_at: string | null;
};

/**
 * The queue rule, in one place, so the SQL and the surface cannot disagree.
 *
 * A deferral suppresses without a verdict: forecast_next_check_at in the future
 * means a person looked and said the evidence is not in yet. The frozen horizon
 * is never consulted for suppression, only for whether the claim came due at
 * all, which is why deferring can never hide a slipped call.
 *
 * ISO 8601 UTC strings compare correctly as strings, which is why these are
 * lexical comparisons and not Date.parse calls. Every writer of these columns
 * produces toISOString output.
 */
export function isForecastDue(row: DueForecastRow, nowIso: string): boolean {
  if (!row.forecast_claim) return false;
  if (row.forecast_resolution) return false;
  if (!row.forecast_horizon_date) return false;
  if (row.forecast_horizon_date > nowIso) return false;
  if (row.forecast_next_check_at && row.forecast_next_check_at > nowIso) return false;
  return true;
}

/**
 * The gate. Both conditions, never one.
 *
 * `linkedOutcomeSettled` is true only when the decision links to a spec whose
 * `prds.outcome` was settled BY A PERSON. So in the auto case the agent applies
 * a stated observable to judgment a person already made, and never originates
 * the judgment.
 *
 * THIS COMMENT USED TO SAY prds.outcome IS WRITTEN BY THE HUMAN PATH ALONE.
 * That was false and it was load bearing. Two agent paths write it through
 * `applyOutcome`: the autonomous historian sweep and the MCP `settle_outcome`
 * tool. The caller now checks `outcome->>settled_by` rather than mere presence,
 * so an agent-settled outcome cannot authorise an agent-settled forecast. The
 * chain agent-judges-outcome then agent-judges-forecast, with no human anywhere
 * in it, was reachable until 2026-08-14 and was masked only by the auto leg
 * never having executed.
 */
export function canAutoSettle(input: {
  linkedOutcomeSettled: boolean;
  confidence: number | null | undefined;
}): boolean {
  if (!input.linkedOutcomeSettled) return false;
  if (typeof input.confidence !== "number" || !Number.isFinite(input.confidence)) return false;
  return input.confidence >= AUTO_SETTLE_CONFIDENCE_FLOOR;
}

/**
 * The NULL-safe deferral clause, in one place, because writing it twice is how
 * the spec queue got it wrong in exactly one of its two halves. Both the desk
 * query and the tick query take it from here, so they cannot disagree about what
 * is due. Exported as a string so a test can assert it without reaching through
 * a stubbed query chain.
 */
export function dueCheckFilter(nowIso: string): string {
  return `forecast_next_check_at.is.null,forecast_next_check_at.lte.${nowIso}`;
}

/**
 * How much a drafted verdict is worth to the person reading it.
 *
 * THREE STATES, NOT A BOOLEAN, because they are three different things to
 * somebody about to settle a call. `parseAuditReply` coerces an unparseable or
 * unrecognised model reply to `{verdict:"inconclusive", rationale:"",
 * confidence:0}`, which the desk then renders identically to a considered
 * judgment that genuinely could not settle the claim. Those are opposites: one
 * is the agent having looked and reported honestly, the other is the agent
 * having produced nothing at all. Collapsing them teaches people to distrust the
 * drafts that are worth reading.
 */
export type SuggestionQuality = "considered" | "low-confidence" | "no-answer";

export function suggestionQuality(input: {
  verdict: string | null | undefined;
  rationale: string | null | undefined;
  confidence: number | null | undefined;
}): SuggestionQuality {
  const c =
    typeof input.confidence === "number" && Number.isFinite(input.confidence)
      ? input.confidence
      : 0;
  // No rationale and no confidence is the shape parseAuditReply produces when it
  // had to correct the reply. Nothing was judged, so nothing is being offered.
  if (!input.verdict || (c <= 0 && !(input.rationale ?? "").trim())) return "no-answer";
  // Below the floor the verdict could not have settled itself, so it is a
  // reading rather than a recommendation, and the desk should say so.
  return c >= AUTO_SETTLE_CONFIDENCE_FLOOR ? "considered" : "low-confidence";
}

/** The zero state, pinned to the shared wording by a test. */
export const NO_CALLS_YET = "Not enough resolved calls yet";

export type ForecastCallSummary = {
  resolved: number;
  hits: number;
  hitRate: number | null;
  label: string;
};

/**
 * The counting matches the insight calibrator; the sentence deliberately does
 * not.
 *
 * summarizeResolutions says "Supaprod called 2 of the last 3", which is right
 * for a claim the product generated and wrong for a forecast a person recorded.
 * Letting the product take credit for a person's judgment claims more than it
 * delivers. The zero state keeps the shared wording, because "Not enough
 * resolved calls yet" is also the honest form while nothing has resolved.
 */
export function summarizeForecastCalls(
  rows: Array<{ resolution: string | null }>,
): ForecastCallSummary {
  const resolved = rows.length;
  const hits = rows.filter((r) => r.resolution === "hit").length;
  return {
    resolved,
    hits,
    hitRate: resolved > 0 ? hits / resolved : null,
    label: resolved > 0 ? `You called ${hits} of the last ${resolved}` : NO_CALLS_YET,
  };
}

/**
 * PURE, AND HERE RATHER THAN BESIDE THE SERVER FUNCTIONS, BECAUSE THE PIN IS THE
 * ABSENCE OF A KEY.
 *
 * The thing that must never happen is a deferral writing a verdict. Asserting an
 * absence through a stubbed query chain is fragile; asserting it on the patch
 * object is exact. Keeping both builders in this import-free module also means
 * the auditor does not have to import a module full of createServerFn
 * definitions to reach one helper.
 */
export function buildDeferPatch(input: { days: number; priorCount: number; nowMs: number }): {
  forecast_next_check_at: string;
  forecast_deferred_at: string;
  forecast_deferred_count: number;
} {
  return {
    forecast_next_check_at: new Date(input.nowMs + input.days * 86_400_000).toISOString(),
    forecast_deferred_at: new Date(input.nowMs).toISOString(),
    forecast_deferred_count: input.priorCount + 1,
  };
}

export function buildSettlePatch(input: {
  resolution: ForecastResolution;
  rationale: string;
  nowIso: string;
  agentSlug: string | null;
}): {
  forecast_resolution: ForecastResolution;
  forecast_resolution_rationale: string;
  forecast_resolved_at: string;
  forecast_resolved_by_agent_slug: string | null;
} {
  return {
    forecast_resolution: input.resolution,
    forecast_resolution_rationale: input.rationale,
    forecast_resolved_at: input.nowIso,
    forecast_resolved_by_agent_slug: input.agentSlug,
  };
}
