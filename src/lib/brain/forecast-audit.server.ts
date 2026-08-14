import type { SupabaseClient } from "@supabase/supabase-js";
import { callModel } from "@/lib/ai/runtime.server";
import {
  canAutoSettle,
  buildSettlePatch,
  dueCheckFilter,
  type ForecastResolution,
} from "./forecast-resolution";

// FC-01, the grading half. This drafts a verdict for every due forecast and
// promotes only the gated subset. It never decides a forecast the gate refuses.
//
// IT ENRICHES, IT NEVER GATES. The due-forecast queue the Learn desk reads is
// derived in SQL from the frozen columns and does not consult anything written
// here. With this tick failing, throttled, or auto_derive_enabled switched off, a
// workspace still sees its due forecasts; they simply arrive with no draft.
//
// This inverts the sibling. calibrateExpiredInsights finds due rows and writes
// the verdict in one pass, which is why insights have no human path at all.
// Separating discovery from judgment is what makes a gate possible.
//
// Plan: docs/planning/initiatives/forecast-resolution-plan.md

const MODEL = "google/gemini-2.5-flash" as const;
const AUDIT_BATCH = 10;

/** Stamped onto every verdict this module promotes, so the set is one query. */
export const AUDITOR_SLUG = "forecast-auditor" as const;

const AUDIT_SYSTEM = `You judge whether a forecast came true. You are given what a team expected, the observable they chose to settle it, and what is known now.
Rules:
- Signal first: the verdict, then the one fact that decided it.
- Rationale max 2 sentences.
- Judge against the stated observable only. If it does not settle the claim, answer inconclusive rather than guessing.
- Report your own confidence as a number from 0 to 1.
- No em dashes, no en dashes, no AI cliches.
- Output ONLY valid JSON matching the requested schema.`;

/** Pure, so the prompt's guarantees are testable without a model call. */
export function forecastAuditPrompt(input: {
  claim: string;
  howWeWillKnow: string;
  horizonDate: string;
  evidence: string;
}): string {
  return `THE TEAM EXPECTED: ${input.claim}
HOW THEY SAID THEY WOULD KNOW: ${input.howWeWillKnow}
THE HORIZON WAS: ${input.horizonDate}

WHAT IS KNOWN NOW: ${input.evidence || "No linked outcome has been settled."}

Did the forecast come true, judged only against the stated observable? Answer inconclusive if the observable does not settle it. Output JSON:
{"outcome":"hit|miss|inconclusive","rationale":"...","confidence":0.0}`;
}

/**
 * Pure. An unparseable or unrecognised reply must not be able to auto-settle,
 * so a verdict we had to correct carries no confidence at all.
 */
export function parseAuditReply(j: { outcome?: string; rationale?: string; confidence?: number }): {
  verdict: ForecastResolution;
  rationale: string;
  confidence: number;
} {
  const ok = j.outcome === "hit" || j.outcome === "miss" || j.outcome === "inconclusive";
  const verdict: ForecastResolution = ok ? (j.outcome as ForecastResolution) : "inconclusive";
  const raw = typeof j.confidence === "number" && Number.isFinite(j.confidence) ? j.confidence : 0;
  return {
    verdict,
    rationale: j.rationale ?? "",
    confidence: ok ? Math.min(1, Math.max(0, raw)) : 0,
  };
}

type DueRow = {
  id: string;
  title: string | null;
  forecast_claim: string | null;
  forecast_how_we_will_know: string | null;
  forecast_horizon_date: string | null;
  prd_id: string | null;
};

/**
 * The first half of the gate: a person already judged the thing this forecast
 * was about, so the agent applies a stated observable to existing human
 * judgment rather than originating any.
 *
 * THIS COMMENT USED TO SAY prds.outcome IS WRITTEN BY THE HUMAN PATH ALONE, AND
 * THAT WAS FALSE. Two agent paths write it through `applyOutcome`: the
 * autonomous historian sweep (ai/outcome-review.server.ts, stamping
 * HISTORIAN_AGENT_SLUG) and the MCP `settle_outcome` tool (stamping
 * "mcp-agent"). The check below only asked whether `outcome` was non-null, so an
 * agent-settled outcome satisfied "a person already judged this" and the chain
 * became agent-judges-outcome then agent-judges-forecast, with no human anywhere
 * in it. Nothing caught this because the auto leg has never executed: it is
 * gated on `auto_derive_enabled`, which no code in this repo can set.
 *
 * So the gate now reads the field that records WHO settled it. `applyOutcome`
 * writes `settled_by: "human" | "agent"` into the payload, and the codebase
 * already filters on `outcome->>settled_by` elsewhere, so this is the
 * established key rather than a new convention.
 *
 * AN AGENT-SETTLED OUTCOME IS EVIDENCE, JUST NOT PERMISSION. It is still passed
 * to the model as context, because it genuinely is what is known about the
 * spec. It simply cannot be the thing that authorizes an unattended verdict.
 */
export async function linkedOutcomeIsSettled(
  supabase: SupabaseClient,
  prdId: string | null,
): Promise<{ settled: boolean; evidence: string }> {
  if (!prdId) return { settled: false, evidence: "" };
  const { data, error } = await supabase
    .from("prds")
    .select("outcome,title")
    .eq("id", prdId)
    .maybeSingle();
  if (error) return { settled: false, evidence: "" };
  const row = data as { outcome: unknown; title: string | null } | null;
  if (!row || row.outcome == null) return { settled: false, evidence: "" };

  const settledBy = (row.outcome as { settled_by?: unknown } | null)?.settled_by;
  /**
   * Missing counts as human. Rows settled before `settled_by` was written carry
   * no key, and every one of them came from the Learn desk, which was the only
   * door at the time. Treating an absent field as "agent" would silently refuse
   * to auto-settle against the entire historical record; treating it as human
   * matches how those rows were actually produced.
   */
  const byHuman = settledBy !== "agent";

  return {
    settled: byHuman,
    evidence: `The linked spec "${row.title ?? ""}" has a settled outcome${
      byHuman ? "" : ", recorded by an agent rather than a person"
    }: ${JSON.stringify(row.outcome)}`,
  };
}

export async function auditDueForecasts(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
): Promise<{ drafted: number; autoSettled: number; raced: number; failed: number }> {
  const nowIso = new Date().toISOString();
  const { data: due, error } = await supabase
    .from("decisions")
    .select("id,title,forecast_claim,forecast_how_we_will_know,forecast_horizon_date,prd_id")
    .eq("workspace_id", workspaceId)
    .not("forecast_claim", "is", null)
    .is("forecast_resolution", null)
    .lte("forecast_horizon_date", nowIso)
    // The same NULL-safe clause as the desk, from one place, so the tick and the
    // surface can never disagree about what is due.
    .or(dueCheckFilter(nowIso))
    .limit(AUDIT_BATCH);
  /**
   * A FAILED READ IS NOT AN EMPTY QUEUE, and the old `return {drafted:0}` made
   * the two identical. The caller wrote `ok: true` either way, so a workspace
   * whose forecast pass could not read the table looked exactly like one with
   * nothing due -- in job_runs, in the HTTP response, and in telemetry at once.
   * Throwing lets calibrate-tick record the workspace as failed.
   */
  if (error) throw new Error(`forecast audit could not read due forecasts: ${error.message}`);

  let drafted = 0;
  let autoSettled = 0;
  let raced = 0;
  let failed = 0;

  for (const raw of (due ?? []) as unknown as DueRow[]) {
    let settledThisRow = false;
    /**
     * PER ROW, so one failure cannot truncate the batch. Without this a single
     * callModel throw -- an exhausted budget, or GovernanceHaltError from the
     * kill switch -- abandoned every remaining forecast silently, so rows 1..k
     * got drafts and k+1..10 got nothing and nobody learned which.
     */
    try {
    const link = await linkedOutcomeIsSettled(supabase, raw.prd_id);
    const res = await callModel(supabase as never, userId, {
      surface: "decision",
      surface_ref: "audit_forecast",
      model: MODEL,
      workspaceId,
      responseFormat: "json_object",
      messages: [
        { role: "system", content: AUDIT_SYSTEM },
        {
          role: "user",
          content: forecastAuditPrompt({
            claim: raw.forecast_claim ?? "",
            howWeWillKnow: raw.forecast_how_we_will_know ?? "",
            horizonDate: raw.forecast_horizon_date ?? "",
            evidence: link.evidence,
          }),
        },
      ],
    });
    const parsed = parseAuditReply((res.json ?? {}) as never);

    // The draft always lands. It is enrichment, and a person settling this
    // forecast by hand should be able to read what the agent thought.
    const patch: Record<string, unknown> = {
      forecast_resolution_suggestion: {
        verdict: parsed.verdict,
        rationale: parsed.rationale,
        confidence: parsed.confidence,
        drafted_at: nowIso,
        model: MODEL,
      },
    };

    if (canAutoSettle({ linkedOutcomeSettled: link.settled, confidence: parsed.confidence })) {
      Object.assign(
        patch,
        buildSettlePatch({
          resolution: parsed.verdict,
          rationale: parsed.rationale,
          nowIso,
          agentSlug: AUDITOR_SLUG,
        }),
      );
      autoSettled++;
      settledThisRow = true;
    }

    /**
     * GUARDED ON forecast_resolution IS NULL, AND THE RESULT IS READ.
     *
     * Two separate defects lived on the one unguarded line this replaces.
     *
     * The race: a `callModel` round trip sits between the SELECT that found this
     * row and this write. A person settling the same forecast at the desk inside
     * that window had their verdict, their rationale, their timestamp and their
     * NULL agent slug overwritten, and the row restamped as auto-settled. The
     * `.is()` clause makes the update a compare-and-swap on the exact column
     * that means "already decided", so the human always wins and a second tick
     * running concurrently cannot double-settle. The sibling module guards its
     * write the same way and for the same reason (outcome-suggestion.server.ts).
     *
     * The unread result: supabase-js RESOLVES a refused write, so `drafted++`
     * ran whether or not a row changed. That made a permanently-failing pass
     * report `forecastsDrafted: N`, and because the row stayed unresolved it was
     * still due on the next tick, re-billing the paid model call above forever.
     * A tick that cannot write should say so and stop paying to rediscover it.
     */
    const { data: written, error: writeError } = await supabase
      .from("decisions")
      .update(patch)
      .eq("id", raw.id)
      .is("forecast_resolution", null)
      .select("id");

    if (writeError) {
      failed++;
      continue;
    }
    if (!written || written.length === 0) {
      // Not an error: somebody settled this forecast while the model was
      // thinking. Their verdict stands and this draft is simply stale.
      if (settledThisRow) autoSettled--;
      raced++;
      continue;
    }
    drafted++;
    } catch {
      // The row is untouched and still due, so the next tick retries it. What
      // must not happen is the remaining rows being dropped on the floor.
      if (settledThisRow) autoSettled--;
      failed++;
    }
  }

  return { drafted, autoSettled, raced, failed };
}
