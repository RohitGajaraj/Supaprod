/**
 * Feature liveness: the read the admin surface calls.
 *
 * Admin only, gated the same way the Observability surface gates: user_roles is
 * RLS-scoped to auth.uid(), so a hit means this caller is an admin. The probes
 * then run on the service-role client, because a liveness report scoped to one
 * person's rows would answer a different and much less useful question.
 *
 * Plan and the incident that produced this: LIVENESS-NEEDS-MIGRATION.md and
 * docs/planning/analytics-and-failure-detection-plan.md.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { buildLivenessReport, summariseReport, type LivenessReport } from "@/lib/liveness/report";
import type { LivenessClient } from "@/lib/liveness/probe";

export type LivenessResponse = LivenessReport & { headline: string };

export const getLivenessReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { windowDays?: number } | undefined) => d ?? {})
  .handler(async ({ context, data }): Promise<LivenessResponse | { error: string }> => {
    const { data: adminRole } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRole) return { error: "Forbidden" };

    const windowDays = Math.min(Math.max(data.windowDays ?? 7, 1), 90);

    // The generated Database types cannot express a table named by a string from
    // the registry, so the client crosses into the probe layer through its
    // narrow structural interface. Same precedent as the error_events writer.
    const client = supabaseAdmin as unknown as LivenessClient;

    const report = await buildLivenessReport(client, { windowDays });
    return { ...report, headline: summariseReport(report) };
  });
