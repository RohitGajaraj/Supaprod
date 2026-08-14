import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  AUTOMATION_FLAGS,
  AUTOMATION_PLATFORM_KEYS,
  automationFlag,
  automationFlagColumns,
} from "./workspace-automation";

// The writers the automation flags never had. See workspace-automation.ts for
// why this file exists; the short version is that auto_derive_enabled was read
// by two cron jobs and written by nothing, so both ran empty for six weeks.
//
// AUTHORIZATION IS RLS, DELIBERATELY. These go through the caller's own
// supabase client, never supabaseAdmin, so the existing `ws owner admin manage`
// policy on `workspaces` (`has_workspace_role(id, ARRAY['owner','admin'])`) is
// the gate. Writing this check again in TypeScript would be a second copy that
// can drift from the one the database actually enforces, which is the same
// mistake that produced the mint-path scope list in mcp.functions.ts.

export type AutomationState = Record<string, boolean>;

/**
 * Which platform capabilities are configured, so a surface can tell an armed
 * flag from a running one.
 *
 * SERVER-SIDE ONLY, AND IT RETURNS BOOLEANS, NEVER VALUES. The client needs to
 * know whether the crawler is set up; it must never learn the key. Reading
 * `process.env` here and shipping a boolean is the whole point, and it is why
 * this cannot live in the import-free catalogue module beside the flags.
 *
 * WHAT IT CLOSES. `scout-tick` and `researcher-tick` both return early when
 * `FIRECRAWL_API_KEY` is unset, before the job ledger is even opened, so no run
 * is recorded and their honest explanation goes into a JSON body that only
 * pg_cron reads. The workspace switch meanwhile reads on. A person could arm
 * market watching, be told it was armed, and never be told the platform cannot
 * do it. This is the fact that makes the difference sayable.
 */
export function platformReadiness(): Record<string, boolean> {
  const ready: Record<string, boolean> = {};
  for (const key of AUTOMATION_PLATFORM_KEYS) {
    ready[key] = Boolean(process.env[key]);
  }
  return ready;
}

export async function getWorkspaceAutomationImpl(
  db: SupabaseClient,
  workspaceId: string,
): Promise<{ state: AutomationState; platform: Record<string, boolean> }> {
  const { data, error } = await db
    .from("workspaces")
    .select(automationFlagColumns.join(","))
    .eq("id", workspaceId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const row = (data ?? {}) as Record<string, unknown>;
  const state: AutomationState = {};
  for (const col of automationFlagColumns) state[col] = row[col] === true;
  // Returned together, because a switch without the platform fact beside it is
  // the half-truth this pair exists to stop. A caller cannot render "armed and
  // idle" from the switch alone.
  return { state, platform: platformReadiness() };
}

export async function setWorkspaceAutomationImpl(
  db: SupabaseClient,
  input: { workspaceId: string; column: string; enabled: boolean },
): Promise<{ column: string; enabled: boolean }> {
  const flag = automationFlag(input.column);
  // An allow-list, not a passthrough. Without it this is a generic
  // "update any column on workspaces" endpoint wearing a narrow name.
  if (!flag) throw new Error(`${input.column} is not a workspace automation flag.`);

  const patch: Record<string, unknown> = { [flag.column]: input.enabled };
  /**
   * Arming also clears the sweep clock, so the workspace goes to the front of
   * the very next tick instead of waiting out an ordering it was never in.
   * kickFirstIngest does the same thing for sensing and for the same reason:
   * a person who just turned something on should see it run, not learn that it
   * will run at some point within the next six hours.
   */
  if (input.enabled && flag.column === "auto_derive_enabled") patch.last_auto_derive_at = null;
  if (input.enabled && flag.column === "auto_sense_enabled") patch.last_auto_sense_at = null;

  /**
   * CHECKED, BECAUSE supabase-js RESOLVES AN RLS REFUSAL AS SUCCESS. A member
   * without owner or admin gets `{data: [], error: null}`, so without the
   * zero-row check this would report the automation armed while the row sat
   * unchanged. That is the defect this repo has now hit in four separate places.
   */
  const { data: rows, error } = await db
    .from("workspaces")
    .update(patch)
    .eq("id", input.workspaceId)
    .select("id");
  if (error) throw new Error(error.message);
  if (!rows || rows.length === 0) {
    throw new Error("That did not change. You need to be an owner or admin of this workspace.");
  }
  return { column: flag.column, enabled: input.enabled };
}

export const getWorkspaceAutomation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ workspaceId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) =>
    getWorkspaceAutomationImpl(context.supabase as unknown as SupabaseClient, data.workspaceId),
  );

export const setWorkspaceAutomation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        workspaceId: z.string().uuid(),
        // Narrowed to the catalogue at parse time as well as in the impl, so a
        // bad column is refused before it reaches a query builder.
        column: z.enum(AUTOMATION_FLAGS.map((f) => f.column) as unknown as [string, ...string[]]),
        enabled: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) =>
    setWorkspaceAutomationImpl(context.supabase as unknown as SupabaseClient, data),
  );
