/**
 * BYO-P5 P5b: the server fn behind the founder-only "Supaprod-hosted" toggle.
 *
 * Admin-gated via the `user_roles` table, the same real mechanism `amIAdmin`
 * (`pricing.functions.ts`) and the `/admin/*` route layout use — NOT the
 * `profiles.plan_tier === "admin"` pattern `triggerDeploy` (`build.functions.ts`)
 * uses, which was the first pattern mirrored here until adversarial review
 * caught that `profiles` has no `plan_tier` column at all (only
 * `workspaces`/`accounts` do, for the billing tier); that check silently
 * fails closed for every caller, admin or not (fixed in `triggerDeploy` too,
 * same commit).
 *
 * No new table or column, matching P5b's "no DB wiring" (the plan means the
 * P5c pooled-DB tenancy layer, not the pre-existing `admin_audit_log` — but
 * that table's `target_kind` CHECK constraint has no value that fits a
 * hosting deploy, and adding one is itself a schema change, so this logs to
 * the server console instead of the DB for now; a real audit row is a P5d
 * item alongside the rest of the lifecycle-management surface).
 *
 * `projects` RLS (`auth.uid() = user_id`) means the caller can only ever
 * target a project THEY own — never a workspace-mate's, let alone a
 * customer's — so this cannot leak another user's product name onto a
 * public URL. The deployed shell stays live until manually torn down
 * (`denoDeployProvider.teardown()`); P5b is a persistent toggle, not a
 * prove-then-destroy test like P5a-poc was, so no auto-teardown here.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { denoDeployProvider } from "@/lib/hosting/deno-deploy.server";
import { deployHostingPoc, type HostingPocOutcome } from "@/lib/hosting/hosting-poc";
import type { AppRuntimeRef } from "@/lib/hosting/provider";

export type ProvisionHostingPocResult =
  HostingPocOutcome | { ok: false; reason: "forbidden" | "not_found"; message: string };

export const provisionHostingPoc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ projectId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }): Promise<ProvisionHostingPocResult> => {
    const { supabase, userId } = context;

    const { data: adminRow } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRow) {
      return {
        ok: false,
        reason: "forbidden",
        message: "Admin role required for the hosting PoC.",
      };
    }

    const { data: project, error } = await supabase
      .from("projects")
      .select("id,name,workspace_id")
      .eq("id", data.projectId)
      .single();
    if (error || !project) {
      return { ok: false, reason: "not_found", message: "Project not found or not accessible." };
    }

    const ref: AppRuntimeRef = {
      workspaceId: project.workspace_id,
      productId: project.id,
      hostedAppId: project.id,
    };

    const outcome = await deployHostingPoc(denoDeployProvider, ref, project.name);
    if (outcome.ok) {
      console.log(
        `[hosting-poc] admin=${userId} deployed project=${project.id} (${project.name}) -> ${outcome.url}`,
      );
    } else {
      console.error(
        `[hosting-poc] admin=${userId} project=${project.id} failed: ${outcome.reason} - ${outcome.message}`,
      );
    }
    return outcome;
  });
