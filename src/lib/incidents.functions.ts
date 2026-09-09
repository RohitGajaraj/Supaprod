import { createServerFn } from "@tanstack/react-start";
import { defaultWorkspaceId } from "@/lib/workspaces.functions";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  assessMissions,
  buildMissionStats,
  type RawMissionRow,
  type RawStepRow,
  type RawRunRow,
} from "@/lib/reliability/runaway";

// P7 · Incidents, a read-only "what went wrong" record: failed tool executions,
// errored auto-pipeline events, guardrail blocks, and cost cap incidents, newest
// first, each linked to its trace where available.
// Engine-Room: names the outcome ("what went wrong"), not the mechanism.

export type IncidentKind = "execution" | "pipeline" | "guardrail" | "cost" | "manual" | "runaway";

export type Incident = {
  id: string;
  kind: IncidentKind;
  title: string;
  detail: string;
  at: string | null;
  traceId: string | null;
  /** When there is no trace but the incident keys to a mission, the card opens /build/$missionId. */
  missionId?: string | null;
  amountUsd?: number;
  windowKind?: "day" | "month";
};

const LogCostIncidentSchema = z.object({
  title: z.string().min(1),
  detail: z.string().min(1),
  traceId: z.string().optional(),
  amountUsd: z.number().optional(),
  windowKind: z.enum(["day", "month"]).optional(),
});

export async function logCostIncidentInternal(
  supabase: SupabaseClient,
  userId: string,
  data: {
    title: string;
    detail: string;
    traceId?: string;
    amountUsd?: number;
    windowKind?: "day" | "month";
  },
): Promise<{ success: boolean; id?: string }> {
  const { data: ws } = await supabase.rpc("current_user_default_workspace");
  const workspaceId = defaultWorkspaceId(ws);
  if (!workspaceId) {
    throw new Error("No default workspace found");
  }

  const { data: inserted, error } = await supabase
    .from("cost_incidents")
    .insert({
      workspace_id: workspaceId,
      user_id: userId,
      title: data.title,
      detail: data.detail,
      trace_id: data.traceId ?? null,
      amount_usd: data.amountUsd ?? null,
      window_kind: data.windowKind ?? null,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return { success: true, id: inserted?.id };
}

/**
 * The ceiling on the merged incident read. Named rather than inline so the
 * slice and the "was it capped" test cannot drift to two different numbers: a
 * cap compared against a different literal is a cap that stops reporting itself.
 */
const INCIDENT_READ_LIMIT = 40;

export async function getIncidentsInternal(
  supabase: SupabaseClient,
  userId: string,
): Promise<{
  incidents: Incident[];
  count: number;
  /** True when the merged read hit its ceiling, so `count` is a FLOOR rather
   *  than a total and a surface must render it with a "+". */
  capped: boolean;
}> {
  const out: Incident[] = [];

  // Failed tool executions: a human-or-auto approval whose call errored out.
  const { data: failed } = await supabase
    .from("agent_approvals")
    .select("id,agent_slug,tool_name,error,status,created_at,trace_id")
    .eq("user_id", userId)
    .eq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(20);
  for (const a of failed ?? []) {
    const tool = (a.tool_name as string | null) ?? "a tool call";
    const who = (a.agent_slug as string | null) ?? "an agent";
    out.push({
      id: `exec:${a.id}`,
      kind: "execution",
      title: `${tool} failed`,
      detail: (a.error as string | null) ?? `${who}'s call did not complete.`,
      at: (a.created_at as string | null) ?? null,
      traceId: (a.trace_id as string | null) ?? null,
    });
  }

  // Errored auto-pipeline events: the reactor could not dispatch or complete.
  // event_queue is workspace-scoped, so resolve the default workspace and
  // filter on it (defense-in-depth on top of RLS, and it uses the index),
  // matching how the reactor reads this table.
  const { data: ws } = await supabase.rpc("current_user_default_workspace");
  const workspaceId = defaultWorkspaceId(ws);
  if (workspaceId) {
    const { data: events } = await supabase
      .from("event_queue")
      .select("id,event_type,error,created_at,mission_id")
      .eq("workspace_id", workspaceId)
      .not("error", "is", null)
      .order("created_at", { ascending: false })
      .limit(20);
    for (const e of events ?? []) {
      const row = e as unknown as {
        id: string;
        event_type: string | null;
        error: string | null;
        created_at: string | null;
        mission_id: string | null;
      };
      const type = row.event_type ?? "an event";
      out.push({
        id: `pipe:${row.id}`,
        kind: "pipeline",
        title: `Pipeline error on ${type}`,
        detail: row.error ?? "The reactor reported an error.",
        at: row.created_at ?? null,
        traceId: null,
        missionId: row.mission_id ?? null,
      });
    }

    // Cost incidents: persistent manually logged or auto-detected cost breaches
    const { data: costIncidents } = await supabase
      .from("cost_incidents")
      .select("id,title,detail,created_at,trace_id,amount_usd,window_kind")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(20);
    for (const c of costIncidents ?? []) {
      out.push({
        id: `cost:${c.id}`,
        kind: "cost",
        title: c.title,
        detail: c.amount_usd
          ? `${c.detail} (Amount: $${c.amount_usd}${c.window_kind ? ` for the ${c.window_kind}` : ""})`
          : c.detail,
        at: (c.created_at as string | null) ?? null,
        traceId: (c.trace_id as string | null) ?? null,
        amountUsd: c.amount_usd ? Number(c.amount_usd) : undefined,
        windowKind: (c.window_kind as "day" | "month" | null) ?? undefined,
      });
    }
  }

  // Guardrail blocks: a rule that stopped an AI call. Only action = "block"
  // is an incident; "warn" and "redact" are routine governance (the call still
  // runs), so they are intentionally excluded. We surface the rule and side,
  // never the raw matched payload, so nothing sensitive lands in the list.
  const { data: blocks } = await supabase
    .from("guardrail_hits")
    .select("id,rule_name,side,created_at,event_id,trace_id")
    .eq("user_id", userId)
    .eq("action", "block")
    .order("created_at", { ascending: false })
    .limit(20);
  const blockRows = (blocks ?? []) as unknown as Array<{
    id: string;
    rule_name: string | null;
    side: string | null;
    created_at: string | null;
    event_id: string | null;
    trace_id: string | null;
  }>;
  // Read-time recovery for rows written before write-time stamping landed: one
  // batched event_id -> ai_events.trace_id join (a single .in() query, never per-row).
  const unstampedEventIds = [
    ...new Set(blockRows.filter((h) => !h.trace_id && h.event_id).map((h) => h.event_id as string)),
  ];
  const traceByEventId = new Map<string, string | null>();
  if (unstampedEventIds.length) {
    const { data: evts } = await supabase
      .from("ai_events")
      .select("id,trace_id")
      .in("id", unstampedEventIds);
    for (const e of evts ?? []) {
      traceByEventId.set(e.id as string, (e.trace_id as string | null) ?? null);
    }
  }
  for (const h of blockRows) {
    const rule = h.rule_name ?? "a guardrail rule";
    const side = h.side === "output" ? "output" : "input";
    out.push({
      id: `guard:${h.id}`,
      kind: "guardrail",
      title: `Blocked by guardrail: ${rule}`,
      detail:
        side === "output"
          ? "A guardrail rule blocked a model response from being returned."
          : "A guardrail rule blocked a prompt before the call ran.",
      at: h.created_at ?? null,
      traceId: h.trace_id ?? (h.event_id ? (traceByEventId.get(h.event_id) ?? null) : null),
    });
  }

  // Cost-incident detector: surface real budget alerts from ai_budget_alerts.
  // Contract (producer: runtime.server.ts incrementBudget / incrementSurfaceBudget):
  // exactly one row is written per window when spend CROSSES the configured alert
  // threshold (default 80% of cap), always kind="warn", with pct in [threshold, 100]
  // (pct is capped at 100; a genuine cap hit halts the next call by throwing).
  // No path writes kind="block" today, so the prior `.eq("kind","block")` filter
  // matched nothing and this detector was silently dead. Surface the warn rows that
  // actually exist, report the true pct, and escalate the copy to "cap reached" only
  // when the cap itself was hit (pct >= 100, or a future block).
  const { data: budgetAlerts } = await supabase
    .from("ai_budget_alerts")
    .select("id,kind,pct,surface,usd_cap,usd_used,window_kind,created_at,trace_id")
    .eq("user_id", userId)
    .in("kind", ["warn", "block"])
    .order("created_at", { ascending: false })
    .limit(20);
  for (const b of budgetAlerts ?? []) {
    const surface = b.surface ? ` for "${b.surface}"` : "";
    const window = b.window_kind === "month" ? "monthly" : "daily";
    const pct = b.pct != null ? Math.round(Number(b.pct)) : null;
    const capReached = (pct ?? 0) >= 100 || b.kind === "block";
    const cap = `$${Number(b.usd_cap ?? 0).toFixed(2)}`;
    const used = `$${Number(b.usd_used ?? 0).toFixed(2)}`;
    const pctText = pct != null ? `${pct}%` : "the alert threshold";
    out.push({
      id: `budget_alert:${b.id}`,
      kind: "cost",
      title: capReached
        ? `Budget cap reached${surface}`
        : `Budget alert${surface}: ${pctText} of ${window} cap`,
      detail: capReached
        ? `Your ${window} AI spend reached the ${cap} cap (used: ${used}). Further AI calls are blocked until the cap is raised.`
        : `Your ${window} AI spend reached ${pctText} of the ${cap} cap (used: ${used}).`,
      at: (b.created_at as string | null) ?? null,
      traceId: ((b as unknown as { trace_id: string | null }).trace_id as string | null) ?? null,
      amountUsd: b.usd_cap != null ? Number(b.usd_cap) : undefined,
      windowKind: b.window_kind === "month" ? "month" : b.window_kind === "day" ? "day" : undefined,
    });
  }

  // Runaway missions (RUNAWAY-DETECT): a mission that is spinning (hop/step/retry/spend blown past
  // normal) lands in the durable "what went wrong" record, not only the silent Missions glance.
  // Live-recomputed (non-persisted), like the approval/guardrail/budget sources above. Only
  // `runaway` severity (still active) is emitted; a terminal-but-breached mission is `watch` and
  // excluded, so the log is not flooded by finished runs. Reuses the SAME bounded read + the shared
  // pure fold as getRunawayMissions, so the two cannot drift.
  // Scan the 200 most recent missions (bounded by order+limit, no age floor, so an old still-active
  // spinner is caught too); assessMissions only flags the active `runaway` ones.
  const MAX_RUNAWAY_MISSIONS = 200;
  const { data: rMissions } = await supabase
    .from("missions")
    .select("id,status,hop_count,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(MAX_RUNAWAY_MISSIONS);
  const rIds = (rMissions ?? []).map((m) => (m as { id: string }).id).filter(Boolean);
  if (rIds.length) {
    // Read .data only (no throw on .error): this is a fan-in aggregator, so a failing source must
    // degrade to empty, never blow up the whole incidents log. Matches every source above.
    const [rSteps, rRuns] = await Promise.all([
      supabase.from("mission_steps").select("mission_id,attempts").in("mission_id", rIds),
      supabase.from("agent_runs").select("mission_id,spend_used_usd").in("mission_id", rIds),
    ]);
    const stats = buildMissionStats(
      (rMissions ?? []) as RawMissionRow[],
      (rSteps.data ?? []) as RawStepRow[],
      (rRuns.data ?? []) as RawRunRow[],
      Date.now(),
    );
    const byId = new Map(
      (rMissions ?? []).map((m) => [(m as { id: string }).id, m as { created_at: string | null }]),
    );
    for (const v of assessMissions(stats)) {
      if (v.severity !== "runaway") continue;
      out.push({
        id: `runaway:${v.missionId}`,
        kind: "runaway",
        title: "Mission is spinning",
        detail: v.reasons.join(", "),
        at: byId.get(v.missionId)?.created_at ?? null,
        traceId: null,
        missionId: v.missionId,
      });
    }
  }

  out.sort((x, y) => (y.at ?? "").localeCompare(x.at ?? ""));
  const incidents = out.slice(0, INCIDENT_READ_LIMIT);
  /**
   * THE COUNT SAYS WHETHER IT IS A TOTAL OR A FLOOR.
   *
   * THE DEFECT. This returned `count: incidents.length` and the Safety room
   * printed it bare on its VERDICT line -- "7 incidents" -- as though it were
   * the number of incidents. It is the number this read RETURNED, and the read
   * is capped twice over: forty here, and each of the five sources it merges is
   * itself limited to twenty. A workspace with a hundred cost incidents reports
   * forty, on the line a person uses to decide whether anything is wrong.
   *
   * A ceiling wearing a total's clothes is the same defect as the trace count
   * that printed "200 runs this week" when 200 was the limit, and it takes the
   * same fix: say `capped`, and let the surface render the floor with a "+".
   * The room is free to ignore it; it is not free to be unable to ask.
   */
  return { incidents, count: incidents.length, capped: out.length > INCIDENT_READ_LIMIT };
}

export const logCostIncident = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => LogCostIncidentSchema.parse(input))
  .handler(async ({ context, data }): Promise<{ success: boolean; id?: string }> => {
    return logCostIncidentInternal(context.supabase, context.userId, data);
  });

export const getIncidents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(
    async ({
      context,
      // `capped` travels, or the surface cannot tell a total from a floor and
      // the Safety verdict goes back to printing a ceiling as a fact.
    }): Promise<{ incidents: Incident[]; count: number; capped: boolean }> => {
      return getIncidentsInternal(context.supabase, context.userId);
    },
  );
