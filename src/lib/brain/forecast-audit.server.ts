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
 * The first half of the gate, and the reason it is safe: prds.outcome is written
 * by the human settle path alone, since agent drafts live in
 * prds.outcome_suggestion. A true here means a person already judged the thing
 * this forecast was about, so the agent applies a stated observable to existing
 * judgment rather than originating any.
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
  return {
    settled: true,
    evidence: `The linked spec "${row.title ?? ""}" has a settled outcome: ${JSON.stringify(row.outcome)}`,
  };
}

export async function auditDueForecasts(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
): Promise<{ drafted: number; autoSettled: number }> {
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
  if (error) return { drafted: 0, autoSettled: 0 };

  let drafted = 0;
  let autoSettled = 0;

  for (const raw of (due ?? []) as unknown as DueRow[]) {
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
    }

    await supabase.from("decisions").update(patch).eq("id", raw.id).select("id");
    drafted++;
  }

  return { drafted, autoSettled };
}
