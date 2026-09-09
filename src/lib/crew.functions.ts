/**
 * CREW: the read and write side of governing the workforce.
 *
 * WHY THIS FILE EXISTS RATHER THAN A COMPOSITION OF EXISTING READS.
 * The Crew surface has to answer one question per agent that nothing in the
 * repo answered before: what will the loop ACTUALLY do when this agent reaches
 * for a tool. Every existing read answers a neighbouring question instead.
 * `listAgents` returns the roster row. `getAllAgentTrust` returns a score.
 * `getCapabilities` returns instructions and playbooks. None of them compose
 * the seeded tool mode with the per-agent override, the autonomy dial and the
 * safety floors, which is the composition the runtime actually performs, in
 * `resolveToolMode`. So this module performs it by CALLING `resolveToolMode`,
 * the real one, rather than restating its rules. A surface that restated them
 * would drift the first time a floor moved, and would then be lying about
 * permission, which is the one thing a governance surface may never do.
 *
 * THE DEFAULT-ARC DIVERGENCE, and it is a live inconsistency in the codebase.
 * `loadAgentArc` (trust.server.ts), which is what the LOOP calls, returns
 * "trusted" when an agent has no `agent_autonomy` row: founder ruling 2026-07-08,
 * autonomous by default. `computeAllAgentTrust`, in the same file, defaults the
 * same field to "observing". Those two disagree for every workspace that has
 * never touched the dial, which is every new workspace. This module follows the
 * LOOP, because the surface must describe what will happen and not what a
 * reporting function believes. `trustScore` below still comes from
 * `computeAllAgentTrust`; only its `arc` field is discarded.
 *
 * SCOPES, kept apart on purpose. The roster (`agents`), the dial
 * (`agent_autonomy`), the per-tool overrides (`agent_tool_modes`) and the
 * enabled tool set (`agent_tools`) are all per USER. Run history
 * (`agent_runs`) is per WORKSPACE. The surface labels each accordingly rather
 * than blending them into one number nobody can defend.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeAllAgentTrust, type Arc, type ToolMode } from "@/lib/ai/trust.server";
import { resolveToolMode } from "@/lib/ai/loop.server";
import { TOOL_REGISTRY } from "@/lib/ai/tools/registry.server";
import { capToolsByRisk } from "@/lib/agent-tool-cap";
import { TOOL_DEFAULTS, resolveToolAccess } from "@/lib/ai/tools/defaults";
import { toolRisk, type ToolRisk } from "@/lib/tool-consequences";
import { HIGH_RISK_FORCE_REVIEW, HIGH_RISK_MIN_CONFIRM } from "@/lib/ai/trust-ramp";
import { runBucket } from "@/lib/agent-fleet";
import { catalogEntry, type AgentStation } from "@/lib/agent-vocabulary";
import { defaultWorkspaceId } from "@/lib/workspaces.functions";

export type CrewArc = Arc;
export type CrewToolMode = ToolMode;

/** Run tallies for one agent, scoped to ONE workspace. */
export interface CrewRunTally {
  total: number;
  running: number;
  queued: number;
  finished: number;
  failed: number;
  lastAt: string | null;
}

/** A roster entry. Cheap: no tool composition, no trust computation. */
export interface CrewRosterMember {
  /** Null when the catalog knows this identity but the account has no row for
   *  it. Nothing can be governed until the row exists, and the surface says so
   *  rather than drawing controls that would write nowhere. */
  agentId: string | null;
  slug: string;
  name: string;
  enabled: boolean;
  arc: CrewArc;
  /** True when no `agent_autonomy` row exists, so this is the product's
   *  default rather than a choice anyone made. A default the user never set is
   *  our call, not their policy, so it is labelled. */
  arcIsDefault: boolean;
  runs: CrewRunTally;
  /** Pending graduation proposals: the agent asking for more room. Carried on
   *  the roster because an agent proposing its own promotion is the one thing
   *  on this surface that genuinely needs a person, and a count alone would
   *  make you open thirteen pages to find out what was asked. */
  asking: { toolLabel: string; toMode: CrewToolMode }[];
}

export interface CrewRoster {
  members: CrewRosterMember[];
  workspaceId: string | null;
  /** True when the account has no `agents` rows at all. */
  empty: boolean;
}

/** One tool, as this agent will actually experience it on the next run. */
export interface CrewToolPolicy {
  toolName: string;
  /** What a person reads. The internal id never reaches the surface. */
  label: string;
  risk: ToolRisk;
  /** The workspace-wide seeded mode from `agent_tools`. */
  seededMode: CrewToolMode;
  /** The per-agent override in `agent_tool_modes`, when one exists. */
  storedMode: CrewToolMode | null;
  storedSource: string | null;
  /** What `resolveToolMode` returns today: the truth, floors included. */
  resolvedMode: CrewToolMode;
  /** Modes that would survive resolution unchanged. Anything outside this list
   *  is a control that would lie, so the surface does not draw it. */
  offerable: CrewToolMode[];
  /** A floor no policy may lower, when this tool sits on one. */
  floor: "confirm" | "review" | null;
}

export interface CrewProposal {
  id: string;
  toolName: string;
  toolLabel: string;
  fromMode: CrewToolMode;
  toMode: CrewToolMode;
  cleanStreak: number;
  rationale: string | null;
  createdAt: string;
}

export interface CrewTrust {
  score: number;
  suggestedArc: CrewArc;
  samples: number;
  missionsTotal: number;
  missionsCompleted: number;
  approvalsTotal: number;
  approvalsApproved: number;
  outcomesTotal: number;
  outcomesValidated: number;
}

export interface CrewMember extends CrewRosterMember {
  station: AgentStation;
  blurb: string;
  maxToolRisk: ToolRisk | null;
  /** Null when the agent has no live row, or when the trust read failed. */
  trust: CrewTrust | null;
  tools: CrewToolPolicy[];
  proposals: CrewProposal[];
  /** True when the account has no enabled tools at all, which is a different
   *  fact from "this agent may use none of them". */
  noToolsEnabled: boolean;
}

/* ------------------------------------------------------------------ *
 * Shared helpers
 * ------------------------------------------------------------------ */

async function resolveWorkspace(
  supabase: SupabaseClient,
  given: string | null | undefined,
): Promise<string | null> {
  if (given) return given;
  const { data } = await supabase.rpc("current_user_default_workspace");
  return defaultWorkspaceId(data);
}

function emptyTally(): CrewRunTally {
  return { total: 0, running: 0, queued: 0, finished: 0, failed: 0, lastAt: null };
}

type RunRow = { agent_slug: string | null; status: string | null; created_at: string | null };

function tallyRuns(rows: RunRow[]): Map<string, CrewRunTally> {
  const out = new Map<string, CrewRunTally>();
  for (const r of rows) {
    const slug = r.agent_slug;
    if (!slug) continue;
    const t = out.get(slug) ?? emptyTally();
    t.total += 1;
    const b = runBucket(r.status);
    if (b === "running") t.running += 1;
    else if (b === "queued") t.queued += 1;
    else if (b === "done") t.finished += 1;
    else if (b === "failed") t.failed += 1;
    if (r.created_at && (!t.lastAt || r.created_at > t.lastAt)) t.lastAt = r.created_at;
    out.set(slug, t);
  }
  return out;
}

/** The loop's own default, restated once so the divergence noted in this
 *  file's header can never be reintroduced by a copy of `?? "observing"`. */
const LOOP_DEFAULT_ARC: Arc = "trusted";

const ARC_VALUES = ["observing", "proving", "trusted", "ambient"] as const;

function asArc(value: unknown): Arc {
  return (ARC_VALUES as readonly string[]).includes(value as string)
    ? (value as Arc)
    : LOOP_DEFAULT_ARC;
}

const MODE_VALUES = ["auto", "confirm", "review"] as const;

function asMode(value: unknown, fallback: ToolMode): ToolMode {
  return (MODE_VALUES as readonly string[]).includes(value as string)
    ? (value as ToolMode)
    : fallback;
}

function floorFor(toolName: string): "confirm" | "review" | null {
  if (HIGH_RISK_FORCE_REVIEW.has(toolName)) return "review";
  if (HIGH_RISK_MIN_CONFIRM.has(toolName)) return "confirm";
  return null;
}

/* ------------------------------------------------------------------ *
 * Read: the roster
 * ------------------------------------------------------------------ */

export const listCrew = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { workspaceId?: string | null } | undefined): { workspaceId?: string | null } =>
      input ?? {},
  )
  .handler(async ({ context, data }): Promise<CrewRoster> => {
    const { supabase, userId } = context;
    const workspaceId = await resolveWorkspace(supabase as SupabaseClient, data.workspaceId);

    const [agentsRes, autonomyRes, proposalsRes, toolNamesRes] = await Promise.all([
      supabase.from("agents").select("id,slug,name,enabled").eq("user_id", userId),
      supabase.from("agent_autonomy").select("agent_id,arc").eq("user_id", userId),
      supabase
        .from("trust_graduation_proposals")
        .select("agent_slug,tool_name,to_mode")
        .eq("user_id", userId)
        .eq("status", "pending"),
      // Placeholder kept so the destructure below stays positional; the real
      // labels come from the platform policy, not from stored rows.
      Promise.resolve({ data: [] as { tool_name: string; display_name: string }[] }),
    ]);
    if (agentsRes.error) throw new Error(agentsRes.error.message);

    const agents = (agentsRes.data ?? []) as {
      id: string;
      slug: string;
      name: string;
      enabled: boolean;
    }[];

    // Runs are the one WORKSPACE-scoped read here. No workspace at all reads as
    // no runs rather than as every workspace's runs merged together.
    let runRows: RunRow[] = [];
    if (workspaceId) {
      const { data: runs } = await supabase
        .from("agent_runs")
        .select("agent_slug,status,created_at")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(1000);
      runRows = (runs ?? []) as RunRow[];
    }
    const tallies = tallyRuns(runRows);

    const arcByAgentId = new Map<string, Arc>(
      ((autonomyRes.data ?? []) as { agent_id: string; arc: string }[]).map((r) => [
        r.agent_id,
        asArc(r.arc),
      ]),
    );

    // The internal tool id never reaches the surface; `agent_tools.display_name`
    // is what a person reads. A proposal for a tool the account has since
    // switched off would have no label, so it is dropped rather than shown as
    // a raw id.
    const labelByTool = new Map<string, string>(
      Object.entries(TOOL_DEFAULTS).map(([name, d]) => [name, d.label]),
    );
    const askingBySlug = new Map<string, { toolLabel: string; toMode: ToolMode }[]>();
    for (const row of (proposalsRes.data ?? []) as {
      agent_slug: string;
      tool_name: string;
      to_mode: string;
    }[]) {
      const label = labelByTool.get(row.tool_name);
      if (!label) continue;
      const list = askingBySlug.get(row.agent_slug) ?? [];
      list.push({ toolLabel: label, toMode: asMode(row.to_mode, "confirm") });
      askingBySlug.set(row.agent_slug, list);
    }

    const members: CrewRosterMember[] = agents.map((a) => ({
      agentId: a.id,
      slug: a.slug,
      name: a.name,
      enabled: a.enabled !== false,
      arc: arcByAgentId.get(a.id) ?? LOOP_DEFAULT_ARC,
      arcIsDefault: !arcByAgentId.has(a.id),
      runs: tallies.get(a.slug) ?? emptyTally(),
      asking: askingBySlug.get(a.slug) ?? [],
    }));

    return { members, workspaceId, empty: agents.length === 0 };
  });

/* ------------------------------------------------------------------ *
 * Read: one agent, in full
 * ------------------------------------------------------------------ */

export const getCrewMember = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ slug: z.string().min(1).max(80), workspaceId: z.string().uuid().nullish() })
      .parse(input),
  )
  .handler(async ({ context, data }): Promise<CrewMember | null> => {
    const { supabase, userId } = context;
    const workspaceId = await resolveWorkspace(supabase as SupabaseClient, data.workspaceId);
    const entry = catalogEntry(data.slug);

    const { data: agentRow, error: agentErr } = await supabase
      .from("agents")
      .select("id,slug,name,enabled,max_tool_risk")
      .eq("user_id", userId)
      .eq("slug", data.slug)
      .maybeSingle();
    if (agentErr) throw new Error(agentErr.message);
    if (!agentRow && !entry) return null;

    const agent = (agentRow ?? null) as {
      id: string;
      slug: string;
      name: string;
      enabled: boolean;
      max_tool_risk: string | null;
    } | null;
    const agentId = agent?.id ?? null;

    // Four independent reads, plus two conditional ones. None of them may fail
    // the surface: the boundary controls are the point, so a failed read reads
    // as an honest empty rather than as an error page.
    const [toolsRes, overridesRes, proposalsRes] = await Promise.all([
      // Overrides only. The list itself is the registry; see access.server.ts.
      supabase.from("agent_tools").select("tool_name,mode,enabled").eq("user_id", userId),
      supabase
        .from("agent_tool_modes")
        .select("tool_name,mode,source")
        .eq("user_id", userId)
        .eq("agent_slug", data.slug),
      supabase
        .from("trust_graduation_proposals")
        .select("id,tool_name,from_mode,to_mode,clean_streak,rationale,created_at")
        .eq("user_id", userId)
        .eq("agent_slug", data.slug)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
    ]);

    let arcRow: { arc?: string } | null = null;
    if (agentId) {
      const { data: row } = await supabase
        .from("agent_autonomy")
        .select("arc")
        .eq("user_id", userId)
        .eq("agent_id", agentId)
        .maybeSingle();
      arcRow = (row as { arc?: string } | null) ?? null;
    }
    const arc = arcRow?.arc ? asArc(arcRow.arc) : LOOP_DEFAULT_ARC;

    let runRows: RunRow[] = [];
    if (workspaceId) {
      const { data: rows } = await supabase
        .from("agent_runs")
        .select("agent_slug,status,created_at")
        .eq("workspace_id", workspaceId)
        .eq("agent_slug", data.slug)
        .order("created_at", { ascending: false })
        .limit(1000);
      runRows = (rows ?? []) as RunRow[];
    }

    // Trust: score and the suggestion only. Its own `arc` field is discarded,
    // see this file's header.
    let trust: CrewTrust | null = null;
    if (agentId) {
      try {
        const all = await computeAllAgentTrust(supabase as SupabaseClient, userId);
        const t = all.find((x) => x.agent_id === agentId);
        if (t) {
          trust = {
            score: t.score,
            suggestedArc: t.suggested_arc,
            samples: t.breakdown.samples,
            missionsTotal: t.breakdown.missions_total,
            missionsCompleted: t.breakdown.missions_completed,
            approvalsTotal: t.breakdown.approvals_total,
            approvalsApproved: t.breakdown.approvals_approved,
            outcomesTotal: t.breakdown.outcomes_total,
            outcomesValidated: t.breakdown.outcomes_validated,
          };
        }
      } catch {
        // A failed score is not a reason to hide the boundary controls, which
        // are the point of the surface. It reads as "not computed" instead.
        trust = null;
      }
    }

    // The tool composition, performed exactly as the loop performs it:
    // enabled rows -> registry filter -> per-agent blast-radius cap ->
    // per-agent stored override -> resolveToolMode.
    const rawTools = resolveToolAccess(
      Object.keys(TOOL_REGISTRY),
      (toolsRes.data ?? []) as {
        tool_name: string;
        mode: string | null;
        enabled: boolean | null;
      }[],
    );
    const capped = capToolsByRisk(rawTools, agent?.max_tool_risk ?? null);

    const overrides = new Map<string, { mode: ToolMode; source: string }>(
      ((overridesRes.data ?? []) as { tool_name: string; mode: string; source: string }[]).map(
        (r) => [r.tool_name, { mode: asMode(r.mode, "confirm"), source: r.source }],
      ),
    );

    const tools: CrewToolPolicy[] = capped.map((t) => {
      const seededMode = asMode(t.mode, "confirm");
      const override = overrides.get(t.tool_name) ?? null;
      const effective = override?.mode ?? seededMode;
      // contractApproved is false: plan-level consent (AGT-02) belongs to a
      // mission, and there is no mission in front of us here. False is the
      // conservative half of that branch, so this can only ever UNDER-state
      // how much the agent may do alone, never over-state it.
      const resolvedMode = resolveToolMode(t.tool_name, effective, arc, false);
      const offerable = MODE_VALUES.filter(
        (m) => resolveToolMode(t.tool_name, m, arc, false) === m,
      );
      return {
        toolName: t.tool_name,
        label: TOOL_DEFAULTS[t.tool_name]?.label ?? t.tool_name,
        risk: toolRisk(t.tool_name),
        seededMode,
        storedMode: override?.mode ?? null,
        storedSource: override?.source ?? null,
        resolvedMode,
        offerable,
        floor: floorFor(t.tool_name),
      };
    });
    tools.sort((a, b) => a.label.localeCompare(b.label));

    const proposals: CrewProposal[] = (
      (proposalsRes.data ?? []) as {
        id: string;
        tool_name: string;
        from_mode: string;
        to_mode: string;
        clean_streak: number;
        rationale: string | null;
        created_at: string;
      }[]
    ).map((p) => ({
      id: p.id,
      toolName: p.tool_name,
      toolLabel: tools.find((t) => t.toolName === p.tool_name)?.label ?? p.tool_name,
      fromMode: asMode(p.from_mode, "review"),
      toMode: asMode(p.to_mode, "confirm"),
      cleanStreak: p.clean_streak,
      rationale: p.rationale,
      createdAt: p.created_at,
    }));

    const runs = tallyRuns(runRows).get(data.slug) ?? emptyTally();

    return {
      agentId,
      slug: data.slug,
      name: entry?.name ?? agent?.name ?? data.slug,
      station: entry?.station ?? "build",
      blurb: entry?.blurb ?? "",
      enabled: agent ? agent.enabled !== false : false,
      maxToolRisk: (agent?.max_tool_risk as ToolRisk | null) ?? null,
      arc,
      arcIsDefault: !arcRow,
      trust,
      runs,
      tools,
      proposals,
      asking: proposals.map((p) => ({ toolLabel: p.toolLabel, toMode: p.toMode })),
      noToolsEnabled: rawTools.length === 0,
    };
  });

/* ------------------------------------------------------------------ *
 * Write: one tool's mode for one agent
 * ------------------------------------------------------------------ */

/**
 * Set the per-(agent, tool) approval mode as an OPERATOR decision.
 *
 * The table was built for exactly this: its `source` check accepts
 * 'graduation' | 'operator', and only the graduation half had a writer.
 * loop.server.ts overlays this row on the workspace-wide seeded mode at run
 * start, and `resolveToolMode`'s floors still compose afterward, so nothing
 * written here can lower a floor. The surface refuses to offer a mode the
 * floors would override, so the two never disagree.
 */
export const setCrewToolMode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        agentSlug: z.string().min(1).max(80),
        toolName: z.string().min(1).max(120),
        mode: z.enum(["auto", "confirm", "review"]),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    if (!TOOL_REGISTRY[data.toolName]) throw new Error("That tool is not in the registry");

    // Refuse a write the runtime would silently override. Arc is read here for
    // the same reason the surface reads it: a mode is only meaningful once
    // composed with the dial.
    const { data: agentRow } = await supabase
      .from("agents")
      .select("id")
      .eq("user_id", userId)
      .eq("slug", data.agentSlug)
      .maybeSingle();
    const agentId = (agentRow as { id?: string } | null)?.id ?? null;
    if (!agentId) throw new Error("This workspace has no agent by that name");

    const { data: arcRow } = await supabase
      .from("agent_autonomy")
      .select("arc")
      .eq("user_id", userId)
      .eq("agent_id", agentId)
      .maybeSingle();
    const arc = asArc((arcRow as { arc?: string } | null)?.arc ?? LOOP_DEFAULT_ARC);

    if (resolveToolMode(data.toolName, data.mode, arc, false) !== data.mode) {
      throw new Error("A safety floor holds this tool above that setting");
    }

    const { error } = await supabase.from("agent_tool_modes").upsert(
      {
        user_id: userId,
        agent_slug: data.agentSlug,
        tool_name: data.toolName,
        mode: data.mode,
        source: "operator",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,agent_slug,tool_name" },
    );
    if (error) throw new Error(error.message);
    return { ok: true as const, mode: data.mode };
  });
