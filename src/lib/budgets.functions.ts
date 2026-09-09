/**
 * Server functions for the Budgets UI (/budgets) and header BudgetBar:
 * - getBudgetOverview: global cap + usage, surface caps + usage, recent alerts
 * - updateGlobalBudget: caps + alert_at_pct
 * - upsertSurfaceBudget / deleteSurfaceBudget
 * - acknowledgeAlert
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { defaultWorkspaceId } from "@/lib/workspaces.functions";

/**
 * Said when a cap write RAN and the database returned no row.
 *
 * A write refused by RLS RESOLVES rather than throwing: PostgREST reports it as
 * zero rows matched, which is byte for byte what a successful write of nothing
 * looks like. Migration 20260805130000 narrowed both budget tables to owner,
 * admin or member, so from that migration onward a viewer pressing Save on
 * /budgets got `ok: true` back having changed nothing at all, and the page
 * redrew showing the cap they had typed.
 *
 * We cannot tell a refusal apart from a row someone else removed a moment
 * earlier — both come back empty and PostgREST does not say which — so this
 * states the uncertainty rather than picking one. Same ruling, same wording as
 * `guardrails.functions.ts`.
 */
function unconfirmedWrite(what: string): string {
  return `We could not confirm ${what}. Reload /budgets and check it before relying on it.`;
}

/**
 * Which workspace the PER-RUN ceiling below belongs to.
 *
 * Written out here rather than imported from `governance.functions.ts`, which
 * has the same helper: that module statically imports `loop.server.ts`, and
 * this one is reached by the header BudgetBar on every page, so importing it
 * would pull the whole agent runtime into a bundle that only wanted a number.
 *
 * Order matches the governance copy exactly, and for the same reason: the
 * caller's active workspace first, then `current_user_default_workspace()`
 * (the function every governed table defaults `workspace_id` to), and the
 * previous behaviour last so a caller that sends nothing still gets an answer.
 */
async function resolveCeilingWorkspace(
  supabase: SupabaseClient,
  workspaceId: string | null | undefined,
): Promise<string | null> {
  if (workspaceId) return workspaceId;
  const { data } = await supabase.rpc("current_user_default_workspace");
  return defaultWorkspaceId(data);
}

/**
 * Extracted logic for getBudgetOverview - testable without TanStack wrappers.
 *
 * `workspaceId` is optional and the fallback is the old behaviour, so callers
 * that cannot yet send it keep working. A caller that KNOWS its active
 * workspace should send it: see the ceiling read below for why a guess here is
 * not a cosmetic problem.
 */
export async function getBudgetOverviewImpl(
  supabase: SupabaseClient,
  userId: string,
  workspaceId?: string | null,
) {
  const [g, s, a] = await Promise.all([
    supabase.from("ai_budgets").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("ai_surface_budgets").select("*").eq("user_id", userId).order("surface"),
    supabase
      .from("ai_budget_alerts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  /**
   * The PER-RUN ceiling, read here because this is the "what bounds spend" call
   * and a caller that has to ask two places will eventually ask one.
   *
   * Added 2026-08-03: the Engine room said "no cap set", /runs said "Nothing
   * caps this yet", and /build displayed 10.00, while every workspace in the
   * database carried a 10 USD per-run ceiling. Two of the three were reporting
   * the absence of the ai_budgets meter as the absence of any control at all.
   *
   * RLS-scoped, so this returns the caller's own workspaces and nothing else. A
   * failed or empty read yields null, which the surfaces render as "nothing caps
   * this" rather than inventing a ceiling that may not hold.
   */
  // Guarded: this is an ADDITION to an existing overview, and a ceiling nobody
  // could read must not take the budget page down with it. On any failure the
  // answer is null, which the surfaces render as "nothing caps this" rather than
  // asserting a ceiling that may not hold. Understating a control is recoverable;
  // claiming one that is not there is not.
  //
  // WHICH WORKSPACE'S CEILING (2026-08-05). This read used to be
  // `.limit(1).maybeSingle()` with no filter at all, so on an account with more
  // than one workspace it showed whichever row Postgres returned first, while
  // `resolveMissionSpendCap` enforces the one the RUN carries, found by
  // `.eq("id", workspaceId)`. The page said one number and the loop obeyed
  // another. It is filtered by id now, resolved the same way enforcement
  // resolves it.
  let missionCapUsd: number | null = null;
  try {
    const capWorkspaceId = await resolveCeilingWorkspace(supabase, workspaceId);
    const { data: ws } = capWorkspaceId
      ? await supabase
          .from("workspaces")
          .select("default_mission_spend_cap_usd")
          .eq("id", capWorkspaceId)
          .maybeSingle()
      : { data: null };
    const rawCap = (ws as { default_mission_spend_cap_usd?: number | string | null } | null)
      ?.default_mission_spend_cap_usd;
    missionCapUsd =
      rawCap === null || rawCap === undefined || Number.isNaN(Number(rawCap))
        ? null
        : Number(rawCap);
  } catch {
    missionCapUsd = null;
  }

  return {
    global: g.data ?? null,
    surfaces: s.data ?? [],
    alerts: a.data ?? [],
    missionCapUsd,
  };
}

const WorkspaceScopeSchema = z
  .object({ workspaceId: z.string().uuid().nullable().optional() })
  .strip();

export const getBudgetOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof WorkspaceScopeSchema> | undefined) =>
    WorkspaceScopeSchema.parse(d ?? {}),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    return getBudgetOverviewImpl(supabase, userId, data.workspaceId);
  });

export const GlobalSchema = z.object({
  daily_usd_cap: z.number().min(0).nullable(),
  monthly_usd_cap: z.number().min(0).nullable(),
  daily_token_cap: z.number().int().min(0).nullable(),
  monthly_token_cap: z.number().int().min(0).nullable(),
  alert_at_pct: z.number().int().min(1).max(100),
});

/**
 * Extracted logic for updateGlobalBudget - testable without TanStack wrappers.
 */
export async function updateGlobalBudgetImpl(
  supabase: SupabaseClient,
  userId: string,
  data: z.infer<typeof GlobalSchema>,
) {
  const { data: existing } = await supabase
    .from("ai_budgets")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) {
    // `.select()` is the difference between a saved cap and a believed one.
    // See unconfirmedWrite: an RLS refusal on UPDATE resolves with zero rows
    // and no error, so this used to return ok:true for a budget that never
    // changed, and the caps page redrew the numbers the person had typed.
    const { data: written, error } = await supabase
      .from("ai_budgets")
      .update(data)
      .eq("id", existing.id)
      .select("id");
    if (error) throw new Error(error.message);
    if (!written || written.length === 0) {
      throw new Error(unconfirmedWrite("that your spend caps changed"));
    }
  } else {
    // The INSERT half does raise on a WITH CHECK violation, so this one is
    // belt and braces — but it is the same shape as the update above, and a
    // reader should not have to work out which branch can lie.
    const { data: written, error } = await supabase
      .from("ai_budgets")
      .insert({ user_id: userId, ...data })
      .select("id");
    if (error) throw new Error(error.message);
    if (!written || written.length === 0) {
      throw new Error(unconfirmedWrite("that your spend caps were set"));
    }
  }
  return { ok: true };
}

export const updateGlobalBudget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof GlobalSchema>) => GlobalSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    return updateGlobalBudgetImpl(supabase, userId, data);
  });

export const SurfaceSchema = z.object({
  surface: z.string().min(1).max(40),
  daily_usd_cap: z.number().min(0).nullable(),
  monthly_usd_cap: z.number().min(0).nullable(),
  enabled: z.boolean(),
});

/**
 * Extracted logic for upsertSurfaceBudget - testable without TanStack wrappers.
 */
export async function upsertSurfaceBudgetImpl(
  supabase: SupabaseClient,
  userId: string,
  data: z.infer<typeof SurfaceSchema>,
) {
  // An UPSERT that lands on the UPDATE branch is refused by RLS the same silent
  // way an UPDATE is: zero rows, no error. `.select()` makes the two tellable
  // apart, and this cap is the one that bounds a single surface's spend.
  const { data: written, error } = await supabase
    .from("ai_surface_budgets")
    .upsert({ user_id: userId, ...data }, { onConflict: "user_id,surface" })
    .select("id");
  if (error) throw new Error(error.message);
  if (!written || written.length === 0) {
    throw new Error(unconfirmedWrite(`the cap on ${data.surface}`));
  }
  return { ok: true };
}

export const upsertSurfaceBudget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof SurfaceSchema>) => SurfaceSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    return upsertSurfaceBudgetImpl(supabase, userId, data);
  });

/**
 * Extracted logic for deleteSurfaceBudget - testable without TanStack wrappers.
 *
 * THE SILENT ONE. A DELETE refused by RLS reports zero rows and no error, and
 * a DELETE is the only write here with nothing left behind to check: after a
 * refused update the old number is still on screen and looks wrong, whereas
 * after a refused delete the row is still there and the page has already
 * removed it from the list. So this handler used to be the surest way to
 * believe a spend cap was gone while it went on capping.
 *
 * IT NO LONGER RETURNS ok FOR AN EMPTY DELETE, and that is deliberate even
 * though it costs the idempotent read of "already gone". We cannot distinguish
 * a policy refusal from a row a teammate removed a second earlier — PostgREST
 * gives the same empty answer to both — and of the two possible mistakes,
 * telling someone a cap was removed when it was not is the one that lets money
 * be spent against a rule they think they lifted.
 */
export async function deleteSurfaceBudgetImpl(
  supabase: SupabaseClient,
  userId: string,
  surface: string,
) {
  const { data: removed, error } = await supabase
    .from("ai_surface_budgets")
    .delete()
    .eq("user_id", userId)
    .eq("surface", surface)
    .select("id");
  if (error) throw new Error(error.message);
  if (!removed || removed.length === 0) {
    throw new Error(unconfirmedWrite(`that the cap on ${surface} is gone`));
  }
  return { ok: true };
}

export const deleteSurfaceBudget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { surface: string }) => z.object({ surface: z.string().min(1) }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    return deleteSurfaceBudgetImpl(supabase, userId, data.surface);
  });

/**
 * Extracted logic for acknowledgeAlert - testable without TanStack wrappers.
 *
 * NO `.select()` HERE, AND THAT IS THE DECISION, not an omission. Every other
 * write in this file ends in one because it is a governed write that RLS can
 * refuse in silence. This is not a governed write: `ai_budget_alerts` is an
 * alert RECORD rather than a cap, and migration 20260805130000 says why it was
 * left ungated — the runtime inserts the alert through the ACTING USER's
 * client, so role-gating it would silence the safety warning for exactly the
 * person who triggered it. Dismissing a notice you have read is not the kind of
 * act that needs a receipt.
 */
export async function acknowledgeAlertImpl(
  supabase: SupabaseClient,
  userId: string,
  alertId: string,
) {
  const { error } = await supabase
    .from("ai_budget_alerts")
    .update({ acknowledged: true })
    .eq("id", alertId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export const acknowledgeAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    return acknowledgeAlertImpl(supabase, userId, data.id);
  });

/**
 * Extracted logic for getBudgetSummary - testable without TanStack wrappers.
 * Lightweight summary for header badge — just the global daily/monthly usage vs cap.
 */
export async function getBudgetSummaryImpl(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("ai_budgets")
    .select(
      "daily_usd_cap,monthly_usd_cap,daily_usd_used,monthly_usd_used,day_window,month_window,alert_at_pct",
    )
    .eq("user_id", userId)
    .maybeSingle();
  return data ?? null;
}

export const getBudgetSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    return getBudgetSummaryImpl(supabase, userId);
  });
