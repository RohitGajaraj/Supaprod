/**
 * F-ANALYTICS-1 / F-ANALYTICS-2 — TanStack server functions for the product
 * analytics + ICE auto-adjust surfaces.
 *
 * getProductAnalytics  — cohort sparkline + ICE adjustment history for an opportunity.
 * linkOpportunityEvent — set the PostHog event that measures this opportunity.
 * runAnalyticsIngest   — admin-only manual trigger (used by the observability surface).
 * autoAdjustIceForOpportunity — on-demand ICE update from current analytics data.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { ingestPostHogAnalytics } from "@/lib/analytics-ingest.server";
import { autoAdjustIce } from "@/lib/ice-adjust.server";
import type { Database } from "@/integrations/supabase/types";

// ── getProductAnalytics ──────────────────────────────────────────────────────

// Both row shapes are now PICKED OUT OF THE GENERATED SCHEMA rather than typed
// by hand. They used to be free-standing object types asserted onto the result
// of a query made through `supabaseAdmin as any`, which is the same shape of
// hole FORECAST_COLS fell through in forecast.functions.ts: the select list is
// a string, nothing compared it to the declared type, so a wrong column name
// would have produced `undefined` in that field on every row -- an empty
// sparkline or a blank ICE reason -- rather than an error anywhere. Deriving
// from Database means the field list below and the select strings in the
// handler are checked against the same source, and a column that is renamed or
// dropped in a migration breaks the build instead of the chart.
type ProductAnalyticsRow = Database["public"]["Tables"]["product_analytics"]["Row"];
type IceAdjustmentRow = Database["public"]["Tables"]["ice_adjustments"]["Row"];

type CohortRow = Pick<ProductAnalyticsRow, "cohort_date" | "distinct_users" | "event_count">;

type IceAdjRow = Pick<
  IceAdjustmentRow,
  | "adjusted_at"
  | "feature_event"
  | "old_impact"
  | "new_impact"
  | "old_confidence"
  | "new_confidence"
  | "reason"
  | "sample_users"
>;

export type ProductAnalyticsData = {
  opportunityId: string;
  featureEvent: string | null;
  cohort: CohortRow[];
  iceAdjustments: IceAdjRow[];
  ingestGated: boolean;
};

export const getProductAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ opportunityId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<ProductAnalyticsData> => {
    const { supabase } = context;

    const { data: opp } = await supabase
      .from("opportunities")
      .select("id, workspace_id, posthog_event")
      .eq("id", data.opportunityId)
      .single();

    const featureEvent: string | null = opp?.posthog_event ?? null;
    const workspaceId: string | undefined = opp?.workspace_id;

    if (!featureEvent || !workspaceId) {
      return {
        opportunityId: data.opportunityId,
        featureEvent,
        cohort: [],
        iceAdjustments: [],
        ingestGated: !featureEvent,
      };
    }

    // Reads go through supabaseAdmin because both tables grant SELECT to
    // service_role only (20260626230000_product_analytics.sql). The cast that
    // used to sit here -- "not in generated types (new migration)" -- is stale
    // as of 2026-09-01; with it gone, PostgREST infers each row from the
    // select string and tsc checks it against CohortRow / IceAdjRow above.
    const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

    const [cohortRes, adjRes] = await Promise.all([
      supabaseAdmin
        .from("product_analytics")
        .select("cohort_date, distinct_users, event_count")
        .eq("workspace_id", workspaceId)
        .eq("feature_event", featureEvent)
        .gte("cohort_date", since)
        .order("cohort_date", { ascending: true }),
      supabaseAdmin
        .from("ice_adjustments")
        .select(
          "adjusted_at, feature_event, old_impact, new_impact, old_confidence, new_confidence, reason, sample_users",
        )
        .eq("opportunity_id", data.opportunityId)
        .order("adjusted_at", { ascending: false })
        .limit(10),
    ]);

    const ingestGated = !process.env.POSTHOG_PERSONAL_API_KEY || !process.env.POSTHOG_PROJECT_ID;

    return {
      opportunityId: data.opportunityId,
      featureEvent,
      cohort: cohortRes.data ?? [],
      iceAdjustments: adjRes.data ?? [],
      ingestGated,
    };
  });

// ── linkOpportunityEvent ─────────────────────────────────────────────────────

export const linkOpportunityEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        opportunityId: z.string().uuid(),
        featureEvent: z.string().min(1).max(200).nullable(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("opportunities")
      .update({ posthog_event: data.featureEvent, updated_at: new Date().toISOString() })
      .eq("id", data.opportunityId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });

// ── autoAdjustIceForOpportunity ──────────────────────────────────────────────

export const autoAdjustIceForOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ opportunityId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    return autoAdjustIce(supabase, data.opportunityId);
  });

// ── runAnalyticsIngest (admin-only) ──────────────────────────────────────────

export const runAnalyticsIngest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ workspaceId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    // Verify caller is a workspace member or owner.
    const { data: ws } = await supabase
      .from("workspaces")
      .select("id, owner_id")
      .eq("id", data.workspaceId)
      .single();
    if (!ws) return { ok: false, error: "workspace not found" };

    return ingestPostHogAnalytics(data.workspaceId, ws.owner_id ?? userId);
  });
