/**
 * RF-01 — Outcome attribution breadth.
 *
 * Chains the observers that already run into a provisional, confidence-tiered
 * outcome suggestion instead of leaving outcomes to enter only via a cold
 * human draft: outcome-tick's ship detection is the trigger, the Historian
 * draft (`draftOutcomeVerdict`) is the AI half, SEN-05 `product_analytics`
 * usage deltas and the BYO-P3 changeset->PRD join are the evidence that
 * determines confidence. High confidence surfaces as a one-click confirm;
 * low confidence still pre-fills the manual form but is not auto-actionable.
 *
 * Never overwrites a human-recorded `prds.outcome`, and never fabricates a
 * suggestion when there is no real signal yet.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { draftOutcomeVerdict, type OutcomeVerdict } from "@/lib/outcome.functions";
import { pickChangesetForPrd, type ChangesetForPrd } from "@/lib/studio-ship";
import { shouldPublishChangelog, type ChangesetForChangelog } from "@/lib/changelog";

export type OutcomeSuggestionBasis = {
  sample_users: number;
  sample_events: number;
  data_days: number;
  has_shipped_changeset: boolean;
  has_prediction: boolean;
};

export type OutcomeSuggestion = {
  verdict: OutcomeVerdict;
  summary: string;
  predicted: string;
  metric_label: string | null;
  metric_value: string | null;
  confidence: number; // 0..1
  confidence_tier: "high" | "low";
  basis: OutcomeSuggestionBasis;
  generated_at: string;
};

// Same 14-day ramp ice-adjust.server.ts uses for its confidence axis, so the
// two "how sure are we" scores stay consistent across the app.
const CONFIDENCE_DATA_DAYS_FULL = 14;
const HIGH_CONFIDENCE_THRESHOLD = 0.6;
const LOW_CONFIDENCE_REFRESH_MS = 24 * 60 * 60 * 1000;

export function scoreConfidence(basis: OutcomeSuggestionBasis): {
  confidence: number;
  tier: "high" | "low";
} {
  const usageSignal =
    basis.data_days > 0 ? Math.min(1, basis.data_days / CONFIDENCE_DATA_DAYS_FULL) : 0;
  const changesetSignal = basis.has_shipped_changeset ? 1 : 0;
  const predictionSignal = basis.has_prediction ? 1 : 0;
  // Weighted toward real usage data — the strongest evidence a bet actually
  // played out, vs. the changeset/prediction signals which only establish
  // that the work shipped and was measurable in principle.
  const confidence = 0.5 * usageSignal + 0.3 * changesetSignal + 0.2 * predictionSignal;
  return { confidence, tier: confidence >= HIGH_CONFIDENCE_THRESHOLD ? "high" : "low" };
}

/** Only low-confidence suggestions are refreshed — a high-confidence draft is
 *  already actionable, so re-drafting it would spend AI budget for no
 *  behavior change. */
function shouldRefresh(existing: OutcomeSuggestion | null): boolean {
  if (!existing) return true;
  if (existing.confidence_tier !== "low") return false;
  return Date.now() - new Date(existing.generated_at).getTime() > LOW_CONFIDENCE_REFRESH_MS;
}

/**
 * Generate (or refresh) a provisional outcome suggestion for a shipped PRD.
 * `db` may be the user-scoped client or supabaseAdmin (cron path); `ownerId`
 * is whichever user's identity the Historian's AI call bills against.
 * Returns null when: the PRD already has a human-recorded outcome, an
 * existing suggestion is still fresh, or there is no real signal to draft
 * from yet (never fabricates one from silence).
 */
export async function generateOutcomeSuggestion(
  db: SupabaseClient,
  ownerId: string,
  prdId: string,
): Promise<OutcomeSuggestion | null> {
  const { data: prdRow, error: prdErr } = await db
    .from("prds")
    .select("id, title, opportunity_id, workspace_id, outcome, outcome_suggestion")
    .eq("id", prdId)
    .single();
  if (prdErr || !prdRow) return null;

  const prd = prdRow as unknown as {
    id: string;
    opportunity_id: string | null;
    workspace_id: string | null;
    outcome: unknown;
    outcome_suggestion: OutcomeSuggestion | null;
  };
  if (prd.outcome) return null; // already human-recorded — never overwrite

  const existing = prd.outcome_suggestion ?? null;
  if (!shouldRefresh(existing)) return existing;

  type OppSignals = { problem: string | null; hypothesis: string | null; posthog_event: string | null };
  let opp: OppSignals | null = null;
  if (prd.opportunity_id) {
    const { data: o } = await db
      .from("opportunities")
      .select("problem, hypothesis, posthog_event")
      .eq("id", prd.opportunity_id)
      .maybeSingle();
    opp = (o as OppSignals | null) ?? null;
  }
  const hasPrediction = !!(opp?.problem?.trim() || opp?.hypothesis?.trim());

  // SEN-05 usage deltas — same 30-day window + column shape ice-adjust.server.ts
  // (`autoAdjustIce`) reads, so the two signals never disagree about the source.
  let sampleUsers = 0;
  let sampleEvents = 0;
  let dataDays = 0;
  if (opp?.posthog_event && prd.workspace_id) {
    const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const { data: rows } = await db
      .from("product_analytics")
      .select("cohort_date, distinct_users, event_count")
      .eq("workspace_id", prd.workspace_id)
      .eq("feature_event", opp.posthog_event)
      .gte("cohort_date", since);
    const analyticsRows = (rows ?? []) as Array<{ distinct_users: number; event_count: number }>;
    sampleUsers = analyticsRows.reduce((s, r) => s + (r.distinct_users ?? 0), 0);
    sampleEvents = analyticsRows.reduce((s, r) => s + (r.event_count ?? 0), 0);
    dataDays = analyticsRows.length;
  }

  // BYO-P3 changeset->PRD join — same "merged + has release notes" gate the
  // changelog uses, so a suggestion never claims a still-open changeset shipped.
  let hasShippedChangeset = false;
  let shippedNote = "";
  try {
    const { data: csRows } = await db
      .from("studio_changesets")
      .select("id,status,release_notes,pr_number,updated_at")
      .eq("prd_id", prd.id)
      .order("updated_at", { ascending: false });
    type ShippedChangeset = ChangesetForPrd & ChangesetForChangelog;
    const best = pickChangesetForPrd((csRows ?? []) as ShippedChangeset[]);
    if (best && shouldPublishChangelog(best as ChangesetForChangelog)) {
      hasShippedChangeset = true;
      shippedNote = (best.release_notes ?? "").trim().slice(0, 400);
    }
  } catch {
    // best-effort — a lookup failure never blocks the suggestion
  }

  const basis: OutcomeSuggestionBasis = {
    sample_users: sampleUsers,
    sample_events: sampleEvents,
    data_days: dataDays,
    has_shipped_changeset: hasShippedChangeset,
    has_prediction: hasPrediction,
  };

  // Nothing to go on yet — never fabricate a suggestion from silence.
  if (dataDays === 0 && !hasShippedChangeset && !hasPrediction) return null;

  // A low-confidence suggestion whose basis hasn't moved since last time would
  // otherwise re-draft an essentially identical verdict every 24h forever (a
  // PRD with a prediction but no usage data, say). Re-checking the basis is
  // cheap (an analytics + changeset query); only the AI draft is worth
  // skipping when nothing has actually changed.
  if (existing && JSON.stringify(existing.basis) === JSON.stringify(basis)) {
    return existing;
  }

  const { confidence, tier } = scoreConfidence(basis);
  const metricLabel = dataDays > 0 ? "Distinct users (30d)" : undefined;
  const metricValue = dataDays > 0 ? String(sampleUsers) : undefined;

  const draft = await draftOutcomeVerdict(db, ownerId, {
    prdId: prd.id,
    metricLabel,
    metricValue,
    notes: shippedNote || undefined,
  });

  const suggestion: OutcomeSuggestion = {
    verdict: draft.verdict,
    summary: draft.summary,
    predicted: draft.predicted,
    metric_label: metricLabel ?? null,
    metric_value: metricValue ?? null,
    confidence,
    confidence_tier: tier,
    basis,
    generated_at: new Date().toISOString(),
  };

  // .is("outcome", null) so a human recording that lands mid-flight never
  // gets clobbered by a suggestion that started drafting before it.
  await db
    .from("prds")
    .update({ outcome_suggestion: suggestion, updated_at: new Date().toISOString() })
    .eq("id", prd.id)
    .is("outcome", null);

  return suggestion;
}
