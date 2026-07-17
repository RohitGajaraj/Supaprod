/**
 * JNY-04: launch + GTM kit (v12 §8).
 *
 * The v12 journey audit graded "Launch/GTM/marketing" THIN: LCH-01's
 * `generateLaunchKit` (studio.functions.ts) already turns a shipped
 * changeset into channel copy (changelog/blog/email/social/docs), but
 * nothing composes the layer above it — positioning derived from the
 * decision's own WHY, a launch checklist, and an armed outcome-check
 * window. This file is that layer, one plan per PRD, deliberately reusing
 * LCH-01 for channel copy rather than duplicating it.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callModel } from "@/lib/ai/runtime.server";
import { humanizeText } from "@/lib/ai/humanize";

export type LaunchChecklistItem = {
  label: string;
  done: boolean;
};

export type LaunchPlan = {
  id: string;
  workspace_id: string;
  prd_id: string;
  positioning: string;
  checklist: LaunchChecklistItem[];
  success_metric: string | null;
  check_by: string | null;
  created_at: string;
  updated_at: string;
};

const LAUNCH_PLAN_COLUMNS =
  "id,workspace_id,prd_id,positioning,checklist,success_metric,check_by,created_at,updated_at";

const DEFAULT_CHECK_BY_DAYS = 30;

/** Pure, deterministic, no AI: every launch gets the same standing checklist. */
export function defaultLaunchChecklist(): LaunchChecklistItem[] {
  return [
    { label: "Channel copy drafted (changelog, announcement)", done: false },
    { label: "Positioning reviewed", done: false },
    { label: "Success metric defined", done: false },
    { label: "Outcome check scheduled", done: false },
    { label: "Stakeholders notified", done: false },
  ];
}

/** Pure: the first stated success metric on the contract, never invented. */
export function pickSuccessMetric(
  contract: { success_metrics?: Array<{ text?: string }> } | null | undefined,
): string | null {
  const first = contract?.success_metrics?.[0]?.text;
  return typeof first === "string" && first.trim() ? first.trim() : null;
}

/** Pure: a launch plan arms a check-back date DEFAULT_CHECK_BY_DAYS out, so
 *  RF-01's outcome-tick pass does not evaluate a launch before there has
 *  been time to see real usage. Takes `nowIso` explicitly for testability. */
export function defaultCheckByDate(nowIso: string, days: number = DEFAULT_CHECK_BY_DAYS): string {
  const d = new Date(nowIso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

export const getLaunchPlan = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { prdId: string }) => z.object({ prdId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<LaunchPlan | null> => {
    const { supabase } = context;
    const { data: row } = await supabase
      .from("launch_plans")
      .select(LAUNCH_PLAN_COLUMNS)
      .eq("prd_id", data.prdId)
      .maybeSingle();
    return (row as LaunchPlan | null) ?? null;
  });

const POSITIONING_SYSTEM = `You are the Supaprod launch strategist. Given a spec's title, its core intent, and (if present) the rationale of the decision that approved it, write ONE tight positioning paragraph for its launch: who it is for, why it matters now, in plain language.
Rules:
- Ground every claim ONLY in the provided intent, rationale, and title. Never invent a benefit, number, or feature the text does not support.
- 2 to 4 sentences. No hype, no hedging.
- No em dashes, no en dashes, no AI cliches (delve, leverage, unlock, game-changer, crucial).
- Output ONLY valid JSON: {"positioning": "..."}`;

export const generateLaunchPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { prdId: string }) => z.object({ prdId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<LaunchPlan> => {
    const { supabase, userId } = context;
    const { data: prd, error: prdErr } = await supabase
      .from("prds")
      .select("id,title,body_md,workspace_id,contract")
      .eq("id", data.prdId)
      .single();
    if (prdErr || !prd) throw new Error(prdErr?.message ?? "Spec not found.");

    const contract = (
      prd as { contract?: { intent?: string; success_metrics?: Array<{ text?: string }> } | null }
    ).contract;

    const { data: decisionRow } = await supabase
      .from("decisions")
      .select("rationale")
      .eq("prd_id", prd.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const rationale = (decisionRow as { rationale?: string | null } | null)?.rationale ?? null;

    const user = [
      `Title: ${(prd.title as string).slice(0, 280)}`,
      contract?.intent ? `Intent: ${contract.intent.slice(0, 1000)}` : "",
      rationale ? `Decision rationale: ${rationale.slice(0, 1000)}` : "",
      !contract?.intent && !rationale
        ? `Body:\n${((prd.body_md as string) ?? "").slice(0, 2000)}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const res = await callModel(supabase as never, userId, {
      surface: "prd",
      surface_ref: "generate_launch_plan",
      model: "google/gemini-2.5-flash",
      workspaceId: prd.workspace_id as string,
      responseFormat: "json_object",
      messages: [
        { role: "system", content: POSITIONING_SYSTEM },
        { role: "user", content: user },
      ],
    });
    const j = (res.json ?? {}) as { positioning?: unknown };
    const positioning = humanizeText(
      typeof j.positioning === "string" ? j.positioning.trim() : "",
    ).slice(0, 1000);
    if (!positioning) throw new Error("Positioning came back empty, try again.");

    const nowIso = new Date().toISOString();
    const { data: row, error } = await supabase
      .from("launch_plans")
      .upsert(
        {
          workspace_id: prd.workspace_id,
          prd_id: prd.id,
          positioning,
          checklist: defaultLaunchChecklist(),
          success_metric: pickSuccessMetric(contract),
          check_by: defaultCheckByDate(nowIso),
          generated_by: userId,
        },
        { onConflict: "prd_id" },
      )
      .select(LAUNCH_PLAN_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return row as LaunchPlan;
  });

export const toggleLaunchChecklistItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { prdId: string; index: number }) =>
    z.object({ prdId: z.string().uuid(), index: z.number().int().min(0) }).parse(d),
  )
  .handler(async ({ context, data }): Promise<LaunchPlan> => {
    const { supabase } = context;
    const { data: existing, error: readErr } = await supabase
      .from("launch_plans")
      .select(LAUNCH_PLAN_COLUMNS)
      .eq("prd_id", data.prdId)
      .single();
    if (readErr || !existing) throw new Error(readErr?.message ?? "Launch plan not found.");
    const checklist = [...((existing as LaunchPlan).checklist ?? [])];
    if (data.index >= checklist.length) throw new Error("Checklist item out of range.");
    checklist[data.index] = { ...checklist[data.index], done: !checklist[data.index].done };

    const { data: row, error } = await supabase
      .from("launch_plans")
      .update({ checklist })
      .eq("prd_id", data.prdId)
      .select(LAUNCH_PLAN_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return row as LaunchPlan;
  });

export const rearmOutcomeCheck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { prdId: string; days: number }) =>
    z.object({ prdId: z.string().uuid(), days: z.number().int().min(1).max(365) }).parse(d),
  )
  .handler(async ({ context, data }): Promise<LaunchPlan> => {
    const { supabase } = context;
    const checkBy = defaultCheckByDate(new Date().toISOString(), data.days);
    const { data: row, error } = await supabase
      .from("launch_plans")
      .update({ check_by: checkBy })
      .eq("prd_id", data.prdId)
      .select(LAUNCH_PLAN_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return row as LaunchPlan;
  });
