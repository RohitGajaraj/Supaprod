/**
 * WM-S1: Onboarding server functions.
 *
 * Thin TanStack Start server-function layer over the seed-workspace logic.
 * The client calls `triggerWorkspaceSeed` after a workspace is created; the
 * function runs server-side and is a no-op unless ONBOARDING_SEED_ENABLED=1.
 *
 * Security: userId is sourced from the verified JWT (context.userId), never
 * from client input, eliminating IDOR. Workspace membership is validated
 * against the workspaces table before seeding.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { seedSampleWorkspace } from "./seed-workspace.server";

/**
 * Layer A (SAMPLE-SEED): give the authenticated new user their own rich,
 * clearly-labelled "Explore workspace" (the Prism + Trellis showcase) so they
 * see the whole product on real data in their first session. userId comes from
 * the verified JWT, never client input. Dormant unless SAMPLE_WORKSPACE_ENABLED=1;
 * the underlying DB function is idempotent and never throws to the caller.
 */
export const triggerSampleWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const workspaceId = await seedSampleWorkspace(context.userId);
    return { ok: true, workspaceId };
  });

/**
 * Whether the rich per-signup sample workspace is live, so the onboarding UI
 * can decide whether to offer "Explore a sample workspace" without a click
 * that silently no-ops. Reveals only a boolean; no auth required.
 */
export const isSampleWorkspaceEnabled = createServerFn({ method: "GET" }).handler(async () => {
  return { enabled: process.env.SAMPLE_WORKSPACE_ENABLED === "1" };
});
