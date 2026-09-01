/**
 * PC-30: The agent capability layer.
 *
 * Each cast member has capabilities: instructions (what they're told every run),
 * skills (playbooks with validated-outcome rates), autonomy (trust tiers), and
 * history (changes via lineage). This module provides the read interface for Brain's
 * Capability lens.
 *
 * Write side: recordCapabilityChange records human edits (instructions, skill enable/disable)
 * and RPT-50 self-tuned fixes via lineage + capability_changes table, displayed as
 * receipts in the history section.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import pLimit from "p-limit";
import { SPECIALIST_CATALOG, type AgentStation, type CatalogEntry } from "@/lib/agent-vocabulary";
import {
  AGENT_TO_PLAYBOOK_STATION,
  findPlaybook,
  selectPlaybooksForStation,
  type PlaybookDefinition,
} from "@/lib/playbooks/registry";
import {
  getActiveHouseRulesForWorkspace,
  renderHouseRulesBlock,
  filterRulesForAgent,
  type HouseRule,
} from "@/lib/house-rules.functions";
import { renderBriefBlock, renderBriefItemsBlock, type BriefItem } from "@/lib/briefs.functions";
import { loadVoiceAnchorBlock } from "@/lib/ai/loop.server";
import { computeAllAgentTrust, type Arc, type AgentTrust } from "@/lib/ai/trust.server";
import { recordLineageSafe } from "@/lib/lineage.functions";
import { z } from "zod";

/** Capability info per agent. */
export interface AgentCapability {
  slug: string;
  name: string;
  station: AgentStation;
  blurb: string;
  /** The agent's own base system prompt -- the only part a human edit changes. */
  baseInstructions: string;
  /** Read-only preview of what this agent is told every run: baseInstructions
   *  + the voice anchor + the Strategic Brief + house rules scoped to this
   *  agent -- assembled from the same render functions the real runtime
   *  chokepoint (loop.server.ts) uses, so it can never silently drift. */
  instructionsPreview: string;
  /** Playbooks this agent can run, with win-rates. */
  skills: SkillInfo[];
  /** Trust tier and autonomy info. */
  autonomy: AutonomyInfo;
  /** Recent capability changes via lineage. */
  history: CapabilityChange[];
}

export interface SkillInfo {
  id: string;
  name: string;
  /** Number of times this playbook was run by this agent's station. */
  runs: number;
  /** Number of runs with a positive verdict. */
  wins: number;
  /** Validated outcome rate (wins / runs). */
  winRate: number;
  /** False when a human has turned this playbook off for this agent
   *  (agent_disabled_skills) -- disabled playbooks are never auto-picked at
   *  mission-plan time (orchestrator.server.ts), a real effect, not just a
   *  UI flag. */
  enabled: boolean;
}

export interface ToolModeInfo {
  toolName: string;
  mode: string;
  source: string;
}

export interface GraduationHistoryEntry {
  id: string;
  toolName: string;
  fromMode: string;
  toMode: string;
  status: string;
  decidedAt: string | null;
  rationale: string | null;
}

export interface AutonomyInfo {
  station: AgentStation;
  tier: "crew" | "cast";
  status: "active" | "deprecated";
  /** The trust-ramp arc, when this catalog slug resolves to a live agents row. */
  arc: Arc | null;
  score: number | null;
  suggestedArc: Arc | null;
  /** Tool modes graduated (or operator-set) away from their seeded default. */
  toolModes: ToolModeInfo[];
  /** Decided graduation proposals for this agent, most recent first. */
  graduationHistory: GraduationHistoryEntry[];
}

export interface CapabilityChange {
  id: string;
  type: CapabilityChangeType;
  description: string;
  changedAt: string;
  changedBy: string | null;
}

/** The four kinds recordCapabilityChange is allowed to write. */
export type CapabilityChangeType =
  "instructions" | "skill_enabled" | "skill_disabled" | "self_tuned";

const CAPABILITY_CHANGE_TYPES: readonly string[] = [
  "instructions",
  "skill_enabled",
  "skill_disabled",
  "self_tuned",
];

/** capability_changes.change_type is a plain `text` column in the database --
 *  there is no check constraint, so nothing stops a writer putting an unknown
 *  string in it, and the read path used to launder that straight into the
 *  four-value union through an `any`. Narrow at the boundary instead: an
 *  unrecognised value becomes "instructions" (the neutral "someone edited this
 *  agent" reading) rather than a lie that type-checks. Found 2026-09-01 while
 *  removing the `(row as any)` casts -- with the row typed, tsc rejected the
 *  widening on the spot, which is exactly the check the cast was suppressing. */
function toCapabilityChangeType(raw: string): CapabilityChangeType {
  return CAPABILITY_CHANGE_TYPES.includes(raw) ? (raw as CapabilityChangeType) : "instructions";
}

/** Get capabilities for all active cast members in a workspace. */
export const getCapabilities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { workspaceId?: string | null } | undefined): { workspaceId?: string | null } =>
      input ?? {},
  )
  .handler(async ({ context, data }) => {
    // requireSupabaseAuth hands the handler a context TanStack infers as `any`
    // (measured 2026-09-01: a `.from("table_that_does_not_exist")` inside a
    // handler using this middleware compiles clean). That means every query in
    // every server function here is unchecked -- a mistyped column returns
    // undefined on every row instead of failing the build, which is the same
    // hole FORECAST_COLS fell through in forecast.functions.ts. The middleware
    // is a generated file we do not edit, so re-attach the schema here: from
    // this line down, table and column names in this handler are checked
    // against `Database` again.
    const { supabase, userId } = context as {
      supabase: SupabaseClient<Database>;
      userId: string;
    };
    let workspaceId = data.workspaceId ?? null;
    if (!workspaceId) {
      const { data: ws } = await supabase.rpc("current_user_default_workspace");
      workspaceId = (ws as string | null) ?? null;
    }

    // Get all active cast members (not crew, not deprecated).
    const activeCast = SPECIALIST_CATALOG.filter((a) => a.tier === "cast" && a.status === "active");

    // Trust is computed once for every agent this user has, not once per cast
    // member -- computeAllAgentTrust already scans the user's runs/evals in a
    // single pass, so calling it in a loop would just repeat the same work.
    let trustByAgentId = new Map<string, AgentTrust>();
    try {
      const trust = await computeAllAgentTrust(supabase, userId);
      trustByAgentId = new Map(trust.map((t) => [t.agent_id, t]));
    } catch (e) {
      console.warn("capabilities: trust load failed, autonomy will show tier only:", e);
    }

    // Load workspace-invariant data ONCE before building all capabilities.
    // These queries are independent of the agent; hoisting them prevents an N+1
    // where each agent would refetch the same data (voice anchor, briefs, rules).
    let voiceBlock = "";
    let briefBlock = "";
    let briefItemsBlock = "";
    let allHouseRules: HouseRule[] = [];
    try {
      voiceBlock = await loadVoiceAnchorBlock(supabase, userId);
    } catch (e) {
      console.warn("capabilities: voice anchor load failed:", e);
    }
    if (workspaceId) {
      try {
        const { data: brief } = await supabase
          .from("workspace_briefs")
          .select("id,workspace_id,mission,target_user,current_focus,anti_goals,notes,updated_at")
          .eq("workspace_id", workspaceId)
          .maybeSingle();
        briefBlock = renderBriefBlock(brief);

        const { data: briefItems } = await supabase
          .from("brief_items")
          .select(
            "id,workspace_id,kind,title,body,status,version,supersedes_id,created_at,updated_at",
          )
          .eq("workspace_id", workspaceId)
          .eq("status", "standing");
        briefItemsBlock = renderBriefItemsBlock(briefItems as BriefItem[] | null);
      } catch (e) {
        console.warn("capabilities: brief load failed:", e);
      }
      try {
        // Load all approved house rules once (unfiltered by agent);
        // each agent will filter to rules that apply to them.
        allHouseRules = await getActiveHouseRulesForWorkspace(supabase, workspaceId);
      } catch (e) {
        console.warn("capabilities: house rules load failed:", e);
      }
    }

    // Batch-load per-agent data (skills, tool modes, graduation history, capability
    // history) using .in() queries to eliminate 4×N sequential queries (N = cast size).
    // Each query filters by agent_slug; we batch all slugs in one query per type.
    const agentSlugs = activeCast.map((a) => a.slug);

    // Load disabled skills for all agents at once
    const disabledSkillsByAgent = new Map<string, Set<string>>();
    if (workspaceId) {
      try {
        const { data: disabledRows } = await supabase
          .from("agent_disabled_skills")
          .select("agent_slug,playbook_id")
          .eq("workspace_id", workspaceId)
          .in("agent_slug", agentSlugs);
        for (const row of disabledRows ?? []) {
          const key = row.agent_slug;
          if (!disabledSkillsByAgent.has(key)) {
            disabledSkillsByAgent.set(key, new Set());
          }
          disabledSkillsByAgent.get(key)!.add(row.playbook_id);
        }
      } catch (e) {
        console.warn("capabilities: batch load disabled skills failed:", e);
      }
    }

    // Load tool modes for all agents at once
    const toolModesByAgent = new Map<string, ToolModeInfo[]>();
    try {
      const { data: toolRows } = await supabase
        .from("agent_tool_modes")
        .select("agent_slug,tool_name,mode,source")
        .eq("user_id", userId)
        .in("agent_slug", agentSlugs);
      for (const row of toolRows ?? []) {
        const key = row.agent_slug;
        if (!toolModesByAgent.has(key)) {
          toolModesByAgent.set(key, []);
        }
        toolModesByAgent.get(key)!.push({
          toolName: row.tool_name,
          mode: row.mode,
          source: row.source,
        });
      }
    } catch (e) {
      console.warn("capabilities: batch load tool modes failed:", e);
    }

    // Load graduation history for all agents at once
    const graduationHistoryByAgent = new Map<string, GraduationHistoryEntry[]>();
    try {
      const { data: gradRows } = await supabase
        .from("trust_graduation_proposals")
        .select("agent_slug,id,tool_name,from_mode,to_mode,status,decided_at,rationale")
        .eq("user_id", userId)
        .in("agent_slug", agentSlugs)
        .in("status", ["approved", "rejected"])
        .order("decided_at", { ascending: false })
        .limit(10);
      for (const row of gradRows ?? []) {
        const key = row.agent_slug;
        if (!graduationHistoryByAgent.has(key)) {
          graduationHistoryByAgent.set(key, []);
        }
        graduationHistoryByAgent.get(key)!.push({
          id: row.id,
          toolName: row.tool_name,
          fromMode: row.from_mode,
          toMode: row.to_mode,
          status: row.status,
          decidedAt: row.decided_at,
          rationale: row.rationale,
        });
      }
    } catch (e) {
      console.warn("capabilities: batch load graduation history failed:", e);
    }

    // Load capability history for all agents at once
    const capabilityHistoryByAgent = new Map<string, CapabilityChange[]>();
    if (workspaceId) {
      try {
        const { data: capRows } = await supabase
          .from("capability_changes")
          .select("agent_slug,id,change_type,description,created_at,user_id")
          .eq("workspace_id", workspaceId)
          .in("agent_slug", agentSlugs)
          .order("created_at", { ascending: false })
          .limit(20);
        for (const row of capRows ?? []) {
          const key = row.agent_slug;
          if (!capabilityHistoryByAgent.has(key)) {
            capabilityHistoryByAgent.set(key, []);
          }
          capabilityHistoryByAgent.get(key)!.push({
            id: row.id,
            type: toCapabilityChangeType(row.change_type),
            description: row.description,
            changedAt: row.created_at,
            changedBy: row.user_id,
          });
        }
      } catch (e) {
        console.warn("capabilities: batch load capability history failed:", e);
      }
    }

    // Parallelize capability building across all cast members, capping concurrent
    // Supabase connections to prevent connection pool exhaustion (same pattern used
    // in notifications.functions.ts and orchestrator.functions.ts).
    const limit = pLimit(8);
    const capabilities = await Promise.all(
      activeCast.map((agent) =>
        limit(() =>
          buildCapabilityForAgent(
            supabase,
            userId,
            agent,
            workspaceId,
            trustByAgentId,
            voiceBlock,
            briefBlock,
            briefItemsBlock,
            allHouseRules,
            disabledSkillsByAgent,
            toolModesByAgent,
            graduationHistoryByAgent,
            capabilityHistoryByAgent,
          ),
        ),
      ),
    );

    return { capabilities };
  });

async function buildCapabilityForAgent(
  supabase: SupabaseClient<Database>,
  userId: string,
  agent: CatalogEntry,
  workspaceId: string | null,
  trustByAgentId: Map<string, AgentTrust>,
  voiceBlock: string = "",
  briefBlock: string = "",
  briefItemsBlock: string = "",
  allHouseRules: HouseRule[] = [],
  disabledSkillsByAgent?: Map<string, Set<string>>,
  toolModesByAgent?: Map<string, ToolModeInfo[]>,
  graduationHistoryByAgent?: Map<string, GraduationHistoryEntry[]>,
  capabilityHistoryByAgent?: Map<string, CapabilityChange[]>,
): Promise<AgentCapability> {
  // Load the agent's own live row, scoped by (user_id, slug) -- the exact
  // scoping the real runtime chokepoint uses (loop.server.ts), since a slug
  // alone is not guaranteed unique across users.
  let agentId: string | null = null;
  let baseInstructions = "";
  try {
    const { data: agentRow } = await supabase
      .from("agents")
      .select("id,system_prompt")
      .eq("user_id", userId)
      .eq("slug", agent.slug)
      .maybeSingle();
    agentId = (agentRow as { id?: string } | null)?.id ?? null;
    baseInstructions = (agentRow as { system_prompt?: string } | null)?.system_prompt ?? "";
  } catch (e) {
    console.warn(`Failed to load agent row for ${agent.name}:`, e);
  }

  // Instructions preview: what this agent is actually told every run. Reuses
  // the exact same render functions loop.server.ts's chokepoint calls, in the
  // same order, so the preview can never silently drift from real behavior.
  // Workspace-invariant blocks (voice, brief, rules) are preloaded once and
  // passed in to avoid N+1 refetches -- this agent just composes them.
  let instructionsPreview = baseInstructions;
  instructionsPreview += voiceBlock;
  instructionsPreview += briefBlock;
  instructionsPreview += briefItemsBlock;
  // House rules are loaded for all agents at once; filter to this agent's scope.
  const agentRules = filterRulesForAgent(allHouseRules, agent.slug);
  instructionsPreview += renderHouseRulesBlock(agentRules);

  // Skills: playbooks bound to this agent's station, with win-rates and
  // this agent's own enable/disable state. If pre-loaded batch data is available,
  // use it; otherwise fall back to individual query (for backward compatibility).
  let skills: SkillInfo[];
  if (disabledSkillsByAgent) {
    const disabled = disabledSkillsByAgent.get(agent.slug) ?? new Set();
    skills = await getStationSkillsWithDisabled(
      supabase,
      workspaceId,
      agent.slug,
      agent.station,
      disabled,
    );
  } else {
    skills = await getStationSkills(supabase, workspaceId, agent.slug, agent.station);
  }

  // Autonomy: the trust-ramp arc/score (computed once for all agents, above)
  // plus this agent's graduated tool modes and decided graduation history.
  const trust = agentId ? trustByAgentId.get(agentId) : undefined;
  const toolModes =
    toolModesByAgent?.get(agent.slug) ??
    (await getGraduatedToolModes(supabase, userId, agent.slug));
  const graduationHistory =
    graduationHistoryByAgent?.get(agent.slug) ??
    (await getGraduationHistory(supabase, userId, agent.slug));
  const autonomy: AutonomyInfo = {
    station: agent.station,
    tier: agent.tier,
    status: agent.status,
    arc: trust?.arc ?? null,
    score: trust?.score ?? null,
    suggestedArc: trust?.suggested_arc ?? null,
    toolModes,
    graduationHistory,
  };

  // History: capability changes recorded via human edits and RPT-50 self-tuned fixes.
  // PC-18 distillation is deferred (G-LEARN gate not earned) per the dashboard's own ruling.
  const history =
    capabilityHistoryByAgent?.get(agent.slug) ??
    (await getCapabilityHistory(supabase, workspaceId, agent.slug));

  return {
    slug: agent.slug,
    name: agent.name,
    station: agent.station,
    blurb: agent.blurb,
    baseInstructions,
    instructionsPreview,
    skills,
    autonomy,
    history,
  };
}

/**
 * PURE. Merge a station's bound playbooks with this workspace's run stats
 * and this agent's disabled-id set into the SkillInfo list the Capabilities
 * card renders. Every playbook bound to the station is included -- even one
 * never run -- so there is always something to toggle, not only playbooks
 * that already have a track record. Sorted by run frequency, registry order
 * as the tiebreak (mirrors rankPlaybooksByOutcome's own stable sort).
 */
export function buildSkillInfos(
  bound: readonly PlaybookDefinition[],
  runsByPlaybook: ReadonlyMap<string, { wins: number; total: number }>,
  disabledIds: ReadonlySet<string>,
): SkillInfo[] {
  return bound
    .map((def) => {
      const stats = runsByPlaybook.get(def.id) ?? { wins: 0, total: 0 };
      return {
        id: def.id,
        name: def.name,
        runs: stats.total,
        wins: stats.wins,
        winRate: stats.total > 0 ? stats.wins / stats.total : 0,
        enabled: !disabledIds.has(def.id),
      };
    })
    .sort((a, b) => b.runs - a.runs);
}

/**
 * Playbooks bound to this agent's station, with win-rates and this agent's
 * disabled state. NOTE (PC-30 fix, 2026-07-17): the prior version filtered
 * `playbook_runs.station` (a PlaybookStation value like "discovery") against
 * the raw AgentStation ("sense") -- those vocabularies never overlap, so the
 * Skills section silently returned [] for every agent since it first shipped.
 * Routing through AGENT_TO_PLAYBOOK_STATION fixes the read, not just adds
 * the toggle.
 */
export async function getStationSkills(
  supabase: SupabaseClient<Database>,
  workspaceId: string | null,
  agentSlug: string,
  station: AgentStation,
): Promise<SkillInfo[]> {
  const playbookStation = AGENT_TO_PLAYBOOK_STATION[station];
  if (!playbookStation) return []; // build/ship/design/learn: no PM method bound.

  const bound = selectPlaybooksForStation(playbookStation);
  if (bound.length === 0 || !workspaceId) return [];

  const byPlaybook = new Map<string, { wins: number; total: number }>();
  const { data: runs } = await supabase
    .from("playbook_runs")
    .select("playbook_id, verdict")
    .eq("workspace_id", workspaceId)
    .eq("station", playbookStation);
  for (const run of runs ?? []) {
    const current = byPlaybook.get(run.playbook_id) ?? { wins: 0, total: 0 };
    current.total += 1;
    if (run.verdict === "won" || run.verdict === "validated") {
      current.wins += 1;
    }
    byPlaybook.set(run.playbook_id, current);
  }

  const disabledIds = await getDisabledSkillIds(supabase, workspaceId, agentSlug);

  return buildSkillInfos(bound, byPlaybook, disabledIds);
}

/**
 * Variant of getStationSkills that uses a pre-loaded disabled set (from batch query).
 * Avoids an extra query when disabled skills have already been batch-loaded for all agents.
 */
async function getStationSkillsWithDisabled(
  supabase: SupabaseClient<Database>,
  workspaceId: string | null,
  agentSlug: string,
  station: AgentStation,
  disabledIds: Set<string>,
): Promise<SkillInfo[]> {
  const playbookStation = AGENT_TO_PLAYBOOK_STATION[station];
  if (!playbookStation) return []; // build/ship/design/learn: no PM method bound.

  const bound = selectPlaybooksForStation(playbookStation);
  if (bound.length === 0 || !workspaceId) return [];

  const byPlaybook = new Map<string, { wins: number; total: number }>();
  const { data: runs } = await supabase
    .from("playbook_runs")
    .select("playbook_id, verdict")
    .eq("workspace_id", workspaceId)
    .eq("station", playbookStation);
  for (const run of runs ?? []) {
    const current = byPlaybook.get(run.playbook_id) ?? { wins: 0, total: 0 };
    current.total += 1;
    if (run.verdict === "won" || run.verdict === "validated") {
      current.wins += 1;
    }
    byPlaybook.set(run.playbook_id, current);
  }

  return buildSkillInfos(bound, byPlaybook, disabledIds);
}

/** This agent's disabled-playbook set (agent_disabled_skills, PC-30). Empty
 *  on a read error or pre-migration -- absence of a row means enabled, so
 *  failing open here keeps every playbook available rather than silently
 *  disabling everything on a transient read failure. */
async function getDisabledSkillIds(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  agentSlug: string,
): Promise<Set<string>> {
  try {
    const { data: rows } = await supabase
      .from("agent_disabled_skills")
      .select("playbook_id")
      .eq("workspace_id", workspaceId)
      .eq("agent_slug", agentSlug);
    return new Set((rows ?? []).map((r) => r.playbook_id));
  } catch (e) {
    console.warn(`Failed to load disabled skills for ${agentSlug}:`, e);
    return new Set();
  }
}

/** Tool modes graduated (or operator-set) away from their seeded default for
 *  this agent -- the overlay agent_tool_modes carries, same shape reflection.server.ts's
 *  maybeProposeTrustGraduations reads to compute clean streaks. */
async function getGraduatedToolModes(
  supabase: SupabaseClient<Database>,
  userId: string,
  agentSlug: string,
): Promise<ToolModeInfo[]> {
  const { data: rows } = await supabase
    .from("agent_tool_modes")
    .select("tool_name,mode,source")
    .eq("user_id", userId)
    .eq("agent_slug", agentSlug);

  return (rows ?? []).map((r) => ({ toolName: r.tool_name, mode: r.mode, source: r.source }));
}

/** Decided (approved/rejected) trust-graduation proposals for this agent,
 *  most recent first -- the graduation history the spec names. Queried
 *  directly (not via the unscoped listTrustGraduationProposals) so an
 *  agent's older history can't be pushed out by another agent's proposals
 *  sharing the same global 50-row cap. */
async function getGraduationHistory(
  supabase: SupabaseClient<Database>,
  userId: string,
  agentSlug: string,
): Promise<GraduationHistoryEntry[]> {
  const { data: rows } = await supabase
    .from("trust_graduation_proposals")
    .select("id,tool_name,from_mode,to_mode,status,decided_at,rationale")
    .eq("user_id", userId)
    .eq("agent_slug", agentSlug)
    .in("status", ["approved", "rejected"])
    .order("decided_at", { ascending: false })
    .limit(10);

  return (rows ?? []).map((r) => ({
    id: r.id,
    toolName: r.tool_name,
    fromMode: r.from_mode,
    toMode: r.to_mode,
    status: r.status,
    decidedAt: r.decided_at,
    rationale: r.rationale,
  }));
}

/** Get recent capability changes for an agent in a workspace. */
async function getCapabilityHistory(
  supabase: SupabaseClient<Database>,
  workspaceId: string | null,
  agentSlug: string,
): Promise<CapabilityChange[]> {
  if (!workspaceId) return [];

  const { data: changes } = await supabase
    .from("capability_changes")
    .select("id,change_type,description,created_at,user_id")
    .eq("workspace_id", workspaceId)
    .eq("agent_slug", agentSlug)
    .order("created_at", { ascending: false })
    .limit(20);

  if (!changes) return [];

  // Map to CapabilityChange, resolve user display name (for now use null)
  const history: CapabilityChange[] = changes.map((c) => ({
    id: c.id,
    type: toCapabilityChangeType(c.change_type),
    description: c.description,
    changedAt: c.created_at,
    changedBy: c.user_id ? c.user_id.substring(0, 8) : null, // Placeholder: use userId prefix
  }));

  return history;
}

/** Record a capability change (human edit, or an RPT-50 self-tuned fix). */
export async function recordCapabilityChange(
  supabase: SupabaseClient<Database>,
  userId: string,
  workspaceId: string,
  agentSlug: string,
  changeType: "instructions" | "skill_enabled" | "skill_disabled" | "self_tuned",
  description: string,
  previousValue?: string | null,
): Promise<string> {
  const { data, error } = await supabase
    .from("capability_changes")
    .insert({
      workspace_id: workspaceId,
      user_id: userId,
      agent_slug: agentSlug,
      change_type: changeType,
      description,
      previous_value: previousValue ?? null,
    })
    .select("id")
    .single();

  if (error) throw new Error(`recordCapabilityChange: ${error.message}`);

  const changeId = (data as { id: string }).id;

  // Record lineage edge (capability_change as an artifact linked from the agent)
  await recordLineageSafe(supabase, userId, {
    parent_kind: "capability_change",
    parent_id: changeId,
    child_kind: "decision", // Conceptual link: this change is a decision about capabilities
    child_id: agentSlug, // Use agent slug as the artifact id (non-standard but acceptable)
    relation: "documents",
    rationale: description,
  });

  return changeId;
}

// ─── Write-side server functions ───

const UpdateInstructionsSchema = z.object({
  agentSlug: z.string(),
  workspaceId: z.string().uuid().optional(),
  instructions: z.string().min(1).max(5000),
});

export const updateAgentInstructions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof UpdateInstructionsSchema> | undefined) =>
    UpdateInstructionsSchema.parse(d ?? {}),
  )
  .handler(async ({ context, data }) => {
    // Same re-attachment as getCapabilities above, and needed for the same
    // reason: requireSupabaseAuth's context is inferred `any`, so without this
    // the writes below are unchecked. See the note on getCapabilities.
    const { supabase, userId } = context as {
      supabase: SupabaseClient<Database>;
      userId: string;
    };
    let workspaceId = data.workspaceId ?? null;
    if (!workspaceId) {
      const { data: ws } = await supabase.rpc("current_user_default_workspace");
      workspaceId = (ws as string | null) ?? null;
    }
    if (!workspaceId) throw new Error("updateAgentInstructions: no workspace");

    // Read the current text first so the receipt carries a real diff, then
    // persist to the SAME agents.system_prompt column the runtime chokepoint
    // reads every run -- an edit here now has a real, visible effect, not
    // just a logged receipt.
    const { data: before } = await supabase
      .from("agents")
      .select("system_prompt")
      .eq("user_id", userId)
      .eq("slug", data.agentSlug)
      .maybeSingle();
    const previousValue = (before as { system_prompt?: string } | null)?.system_prompt ?? null;

    const { error: updateErr } = await supabase
      .from("agents")
      .update({ system_prompt: data.instructions })
      .eq("user_id", userId)
      .eq("slug", data.agentSlug);
    if (updateErr) throw new Error(`updateAgentInstructions: ${updateErr.message}`);

    await recordCapabilityChange(
      supabase,
      userId,
      workspaceId,
      data.agentSlug,
      "instructions",
      `Updated ${data.agentSlug}'s instructions`,
      previousValue,
    );

    return { ok: true };
  });

const ToggleSkillSchema = z.object({
  agentSlug: z.string(),
  workspaceId: z.string().uuid().optional(),
  playbookId: z.string(),
  enabled: z.boolean(),
});

/**
 * Enable or disable a playbook for one agent (PC-30). Disabling writes a
 * deny-list row in agent_disabled_skills -- the SAME row
 * pickPlaybookForAgentStation's caller (orchestrator.server.ts's mission.plan)
 * reads, so a disable here has a real effect on the next mission plan, not
 * just a logged receipt. Re-enabling deletes the row.
 */
export const toggleAgentSkill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof ToggleSkillSchema> | undefined) =>
    ToggleSkillSchema.parse(d ?? {}),
  )
  .handler(async ({ context, data }) => {
    // Same re-attachment as getCapabilities above, and needed for the same
    // reason: requireSupabaseAuth's context is inferred `any`, so without this
    // the writes below are unchecked. See the note on getCapabilities.
    const { supabase, userId } = context as {
      supabase: SupabaseClient<Database>;
      userId: string;
    };
    let workspaceId = data.workspaceId ?? null;
    if (!workspaceId) {
      const { data: ws } = await supabase.rpc("current_user_default_workspace");
      workspaceId = (ws as string | null) ?? null;
    }
    if (!workspaceId) throw new Error("toggleAgentSkill: no workspace");

    const def = findPlaybook(data.playbookId);
    const playbookName = def?.name ?? data.playbookId;

    if (data.enabled) {
      const { error } = await supabase
        .from("agent_disabled_skills")
        .delete()
        .eq("workspace_id", workspaceId)
        .eq("agent_slug", data.agentSlug)
        .eq("playbook_id", data.playbookId);
      if (error) throw new Error(`toggleAgentSkill: ${error.message}`);
    } else {
      const { error } = await supabase.from("agent_disabled_skills").upsert(
        {
          workspace_id: workspaceId,
          user_id: userId,
          agent_slug: data.agentSlug,
          playbook_id: data.playbookId,
        },
        { onConflict: "workspace_id,agent_slug,playbook_id" },
      );
      if (error) throw new Error(`toggleAgentSkill: ${error.message}`);
    }

    await recordCapabilityChange(
      supabase,
      userId,
      workspaceId,
      data.agentSlug,
      data.enabled ? "skill_enabled" : "skill_disabled",
      `${data.enabled ? "Enabled" : "Disabled"} "${playbookName}" for ${data.agentSlug}`,
      null,
    );

    return { ok: true };
  });
