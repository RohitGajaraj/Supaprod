/**
 * F-ANALYTICS-2 — Auto-adjust an opportunity's ICE scores from real product-
 * analytics data. Called after `ingestPostHogAnalytics` refreshes the
 * product_analytics table, and also on-demand from the UI.
 *
 * Scoring logic:
 *  - impact:     clamp(floor(log10(distinctUsers+1) * 3.5), 1, 10)
 *    → 0 users = 1, 10 users ≈ 3.5, 100 users ≈ 7, 1k users ≈ 10.5 → clamped 10
 *  - confidence: clamp(min(dataDays / 14, 1) * 10, 1, 10)
 *    → 14+ days of data = 10, 7 days ≈ 5, 1 day ≈ 1
 *
 * Only updates when the new value differs from current by ≥ 1 point (avoids
 * micro-jitter). Stores the change in ice_adjustments for provenance.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type AdjustResult =
  | { ok: false; reason: string }
  | { ok: true; skipped: true; reason: string }
  | {
      ok: true;
      adjusted: true;
      oldImpact: number;
      newImpact: number;
      oldConfidence: number;
      newConfidence: number;
      sampleUsers: number;
      sampleEvents: number;
      reason: string;
    };

/**
 * Auto-adjust impact + confidence on an opportunity from its linked PostHog event.
 * `supabase` can be either the user-scoped client or supabaseAdmin.
 * `admin` is the service-role client used for product_analytics / ice_adjustments
 * (both tables only grant INSERT/SELECT to service_role — see
 * 20260626230000_product_analytics.sql) — defaults to the module singleton so
 * production behavior is unchanged; tests inject a mock here.
 */
export async function autoAdjustIce(
  supabase: SupabaseClient<Database>,
  opportunityId: string,
  admin: SupabaseClient<Database> = supabaseAdmin,
): Promise<AdjustResult> {
  // 1. Load the opportunity (needs posthog_event + current ICE).
  const { data: opp, error: oppErr } = await supabase
    .from("opportunities")
    .select("id, workspace_id, impact, confidence, ease, posthog_event")
    .eq("id", opportunityId)
    .single();
  if (oppErr || !opp) return { ok: false, reason: oppErr?.message ?? "opportunity not found" };

  const featureEvent = opp.posthog_event;
  if (!featureEvent) return { ok: true, skipped: true, reason: "no posthog_event linked" };

  const workspaceId: string = opp.workspace_id;

  // 2. Aggregate product_analytics for this event (last 30 days).
  // The `admin as any` that stood here was justified by "product_analytics +
  // ice_adjustments are not in generated types yet (new migration)". Measured
  // 2026-09-01 both tables ARE in the regenerated
  // src/integrations/supabase/types.ts, so the cast -- and the hand-written
  // AnalyticsRow shape that had to be asserted back on afterwards -- were
  // buying nothing except an unchecked column list. The select's three columns
  // and the ice_adjustments insert below are now checked against the schema.
  const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const { data: rows, error: rowsErr } = await admin
    .from("product_analytics")
    .select("cohort_date, distinct_users, event_count")
    .eq("workspace_id", workspaceId)
    .eq("feature_event", featureEvent)
    .gte("cohort_date", since)
    .order("cohort_date", { ascending: false });

  if (rowsErr) return { ok: false, reason: rowsErr.message };
  if (!rows?.length) return { ok: true, skipped: true, reason: "no analytics data yet" };

  const totalUsers = rows.reduce((s, r) => s + (r.distinct_users ?? 0), 0);
  const totalEvents = rows.reduce((s, r) => s + (r.event_count ?? 0), 0);
  const dataDays = rows.length; // distinct date rows = days of data

  // 3. Compute new scores.
  const newImpact = Math.min(10, Math.max(1, Math.floor(Math.log10(totalUsers + 1) * 3.5)));
  const newConfidence = Math.min(10, Math.max(1, Math.round(Math.min(dataDays / 14, 1) * 10)));

  const oldImpact: number = opp.impact;
  const oldConfidence: number = opp.confidence;

  const deltaI = Math.abs(newImpact - oldImpact);
  const deltaC = Math.abs(newConfidence - oldConfidence);

  if (deltaI < 1 && deltaC < 1) {
    return { ok: true, skipped: true, reason: "delta < 1 point on both axes · no update needed" };
  }

  // 4. Apply update.
  const reason =
    `Auto-adjusted from ${totalUsers} distinct users across ${dataDays} days of "${featureEvent}" data. ` +
    `Impact ${oldImpact}→${newImpact}, Confidence ${oldConfidence}→${newConfidence}.`;

  const { error: updateErr } = await supabase
    .from("opportunities")
    .update({
      impact: newImpact,
      confidence: newConfidence,
      updated_at: new Date().toISOString(),
    })
    .eq("id", opportunityId);
  if (updateErr) return { ok: false, reason: updateErr.message };

  // 5. Record provenance.
  await admin.from("ice_adjustments").insert({
    opportunity_id: opportunityId,
    workspace_id: workspaceId,
    feature_event: featureEvent,
    old_impact: oldImpact,
    new_impact: newImpact,
    old_confidence: oldConfidence,
    new_confidence: newConfidence,
    sample_users: totalUsers,
    sample_events: totalEvents,
    reason,
  });

  return {
    ok: true,
    adjusted: true,
    oldImpact,
    newImpact,
    oldConfidence,
    newConfidence,
    sampleUsers: totalUsers,
    sampleEvents: totalEvents,
    reason,
  };
}
