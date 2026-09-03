import type { SupabaseClient } from "@supabase/supabase-js";
import { callModel } from "@/lib/ai/runtime.server";
import {
  canAutoSettle,
  buildSettlePatch,
  dueCheckFilter,
  type ForecastResolution,
} from "./forecast-resolution";
import {
  aboutOurOwnPaperwork,
  whyItCannotBeGraded,
  CANNOT_BE_GRADED,
} from "@/lib/spine/a-forecast-about-our-own-paperwork";
import { TOOL_REGISTRY } from "@/lib/ai/tools/registry.server";

/**
 * ── EVERY RESOLUTION FILES A ROW, THE GRADER'S INCLUDED ───────────────────
 *
 * `forecast_resolution_log` had two writers, the reopen path and the
 * `learning.record` tool, and NEITHER is on a scheduled path. So the log held a
 * history of verdicts taken back with no history of verdicts made, and its
 * emptiness was repeatedly misread as evidence the tick was broken. It was not:
 * the tick had simply never been able to write here.
 *
 * `reopened_by` and `reopened_at` belong to the reopen path and stay null, which
 * reads correctly: this row is the verdict being made, not unmade.
 *
 * A FAILED LOG WRITE DOES NOT FAIL THE SETTLE. The verdict is already committed
 * on `decisions` by the time this runs, and throwing here would leave the row
 * settled with the caller told it failed, which is worse than a missing log
 * line. It is recorded and swallowed.
 */
async function fileResolutionRow(
  supabase: SupabaseClient,
  input: {
    decisionId: string;
    workspaceId: string | null;
    resolution: string;
    rationale: string;
    nowIso: string;
  },
): Promise<void> {
  const { error } = await supabase.from("forecast_resolution_log").insert({
    decision_id: input.decisionId,
    workspace_id: input.workspaceId,
    resolution: input.resolution,
    resolution_rationale: input.rationale.slice(0, 2000),
    resolved_at: input.nowIso,
    resolved_by_agent_slug: AUDITOR_SLUG,
  } as never);
  if (error) {
    console.error(
      `[forecast-audit] settled ${input.decisionId} but its log row was not written: ${error.message}`,
    );
  }
}

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

/**
 * How long a forecast that drafted but could not settle waits before it is
 * redrafted. Six hours is the tick's own cadence, so this is "not every tick"
 * rather than a new schedule; a day is long enough that a row nobody can settle
 * stops costing four calls a day and short enough that a spec settled this
 * afternoon is regraded tonight.
 */
const REDRAFT_BACKOFF_MS = 24 * 60 * 60 * 1000;

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
 * gated on `auto_derive_enabled`. THAT CLAUSE IS ITSELF NOW STALE, twice over,
 * and is kept only because the sentence around it records real history: Settings
 * has written that flag since 2026-08-14, and since `1a3b2fefa` the flag no
 * longer gates this pass at all (the horizon does not ask permission). What
 * remains true is the reason the chain was never caught: the auto leg had not
 * executed.
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
      /*
       * ── OUR OWN PAPERWORK IS REFUSED HERE, NOT JUST AT THE LEARN SEAT ────
       *
       * `aboutOurOwnPaperwork` had exactly one caller, inside `learning.record`,
       * which fires only when a track reaches Learn and the model chooses that
       * tool. Live: two rows ever, both 2026-08-25. So the eight self-referential
       * forecasts on production were handed to the model like any other, came
       * back "inconclusive" for the wrong reason, and stayed due, re-billing a
       * paid call every six hours forever.
       *
       * Settling these `inconclusive` is safe in a way widening the gate is not:
       * it is a REFUSAL to grade, not a judgment about the customer's product.
       * Nothing about the world is being asserted, so no human judgment is being
       * originated or displaced.
       *
       * BEFORE the model call, deliberately: the answer does not depend on it,
       * and paying for a reply we will discard is the defect this closes.
       */
      const paperwork = aboutOurOwnPaperwork(
        raw.forecast_how_we_will_know,
        Object.keys(TOOL_REGISTRY),
      );
      if (paperwork.ourOwn) {
        const because = whyItCannotBeGraded(paperwork.named);
        const { data: refused, error: refuseErr } = await supabase
          .from("decisions")
          .update({
            ...buildSettlePatch({
              resolution: CANNOT_BE_GRADED,
              rationale: because,
              nowIso,
              agentSlug: AUDITOR_SLUG,
            }),
            forecast_resolution_suggestion: {
              verdict: CANNOT_BE_GRADED,
              rationale: because,
              confidence: 1,
              drafted_at: nowIso,
              model: "rule:a-forecast-about-our-own-paperwork",
            },
          } as never)
          .eq("id", raw.id)
          .is("forecast_resolution", null)
          .select("id,workspace_id");
        if (refuseErr) {
          failed++;
          continue;
        }
        if (!refused || refused.length === 0) {
          raced++;
          continue;
        }
        await fileResolutionRow(supabase, {
          decisionId: raw.id,
          workspaceId:
            (refused[0] as { workspace_id?: string | null }).workspace_id ?? workspaceId ?? null,
          resolution: CANNOT_BE_GRADED,
          rationale: because,
          nowIso,
        });
        autoSettled++;
        drafted++;
        continue;
      }

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

      /*
       * ── A VERDICT WITH NOTHING BEHIND IT IS NOT A VERDICT ──────────────
       *
       * P-04. `forecastAuditPrompt` hands the model the claim, the observable,
       * the horizon and `evidence`, and `evidence` has exactly one source: the
       * linked spec's settled outcome. With no linked spec it reads, verbatim,
       * "No linked outcome has been settled." The model gets no tools, no
       * analytics, no signals, nothing about the world at all.
       *
       * MEASURED ON PRODUCTION 2026-09-03: eight due forecasts drafted, seven
       * with `prd_id` null and the eighth's spec outcome null, and **all eight
       * came back at confidence 1.0**. They were certain about nothing, because
       * a model asked to judge with no evidence still answers.
       *
       * THIS IS WHY THE SETTLE GATE MUST NOT SIMPLY WIDEN. `linkedOutcomeSettled`
       * was read as the human anchor, and it is, but it is also the only thing
       * guaranteeing the grader has anything to LOOK at. Dropping it to let the
       * pass settle on the stated observable would not free a blocked grader; it
       * would let a model settle hits and misses from its own priors, on the one
       * record this product claims nothing else has. The blocker was never the
       * gate. It is that nobody has connected the grader to evidence.
       *
       * Until they do, the honest verdict is `inconclusive`, and it says why.
       * The draft still lands, because a person settling this at the desk should
       * see that the agent looked and had nothing to look at.
       */
      const nothingToJudgeAgainst = !link.evidence.trim();
      if (nothingToJudgeAgainst && parsed.verdict !== "inconclusive") {
        parsed.verdict = "inconclusive";
        parsed.confidence = 0;
        parsed.rationale =
          "Graded without evidence. Nothing outside this record was available to check the stated observable against, so this cannot be settled either way. " +
          (parsed.rationale
            ? `The model's reading, for what it is worth: ${parsed.rationale}`
            : "");
      }

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

      const willSettle = canAutoSettle({
        linkedOutcomeSettled: link.settled,
        confidence: parsed.confidence,
      });

      /*
       * ── A ROW THAT CANNOT SETTLE MUST NOT BE RE-BILLED EVERY SIX HOURS ───
       *
       * A draft that the gate refuses leaves `forecast_resolution` null, so the
       * row is due again on the next tick and buys another paid model call, for
       * ever. Measured on production: eight rows, all drafting at confidence
       * 1.0, none able to settle, at four ticks a day. Thirty-two paid calls a
       * day producing nothing settleable.
       *
       * `forecast_next_check_at` is the column the queue already respects for
       * exactly this ("a person looked and said the evidence is not in yet"), so
       * pushing it forward reuses the established meaning rather than inventing
       * a second one. The draft still lands and the desk still shows it; what
       * stops is paying to redraft the same verdict every six hours.
       *
       * NOT A SUPPRESSION OF THE CALL. `isForecastDue` consults the frozen
       * horizon separately, so deferring can never hide a slipped forecast, and
       * a person settling it at the desk is unaffected.
       */
      if (!willSettle) {
        patch.forecast_next_check_at = new Date(
          Date.parse(nowIso) + REDRAFT_BACKOFF_MS,
        ).toISOString();
      }

      if (willSettle) {
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
      if (settledThisRow) {
        await fileResolutionRow(supabase, {
          decisionId: raw.id,
          workspaceId: workspaceId ?? null,
          resolution: parsed.verdict,
          rationale: parsed.rationale,
          nowIso,
        });
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
