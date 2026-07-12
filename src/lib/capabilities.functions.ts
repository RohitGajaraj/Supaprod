/**
 * PC-30: The agent capability layer.
 *
 * Each cast member has capabilities: instructions (what they're told every run),
 * skills (playbooks with validated-outcome rates), autonomy (trust tiers), and
 * history (changes via lineage). This module provides the read interface for Brain's
 * Capability lens.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SPECIALIST_CATALOG, type AgentStation, type CatalogEntry } from "@/lib/agent-vocabulary";
import { PLAYBOOK_REGISTRY } from "@/lib/playbooks/registry";
import { getActiveHouseRulesForWorkspace, renderHouseRulesBlock } from "@/lib/house-rules.functions";
import { renderBriefBlock } from "@/lib/briefs.functions";

/** Capability info per agent. */
export interface AgentCapability {
  slug: string;
  name: string;
  station: AgentStation;
  blurb: string;
  /** Instructions the agent receives (concatenated system prompts + house_rules). */
  instructions: string;
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
}

export interface AutonomyInfo {
  station: AgentStation;
  tier: "crew" | "cast";
  status: "active" | "deprecated";
}

export interface CapabilityChange {
  id: string;
  type: "instructions" | "skill-enabled" | "skill-disabled";
  description: string;
  changedAt: string;
  changedBy: string | null;
}

/** Get capabilities for all active cast members in a workspace. */
export const getCapabilities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { workspaceId?: string | null } | undefined): { workspaceId?: string | null } =>
      input ?? {},
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    let workspaceId = data.workspaceId ?? null;
    if (!workspaceId) {
      const { data: ws } = await supabase.rpc("current_user_default_workspace");
      workspaceId = (ws as string | null) ?? null;
    }

    // Get all active cast members (not crew, not deprecated).
    const activeCast = SPECIALIST_CATALOG.filter((a) => a.tier === "cast" && a.status === "active");

    const capabilities: AgentCapability[] = [];

    for (const agent of activeCast) {
      const cap = await buildCapabilityForAgent(supabase, agent, workspaceId);
      capabilities.push(cap);
    }

    return { capabilities };
  });

async function buildCapabilityForAgent(
  supabase: SupabaseClient,
  agent: CatalogEntry,
  workspaceId: string | null,
): Promise<AgentCapability> {
  // Instructions: what this agent is told every run.
  // Assembles: system prompt (from agents table) + Strategic Brief + house rules.
  // PC-30 spec defers scoped "house_rules scoped to the agent" and "Brief injection preview" details,
  // so we show the workspace-scoped context that EVERY agent receives at runtime.
  let instructions = "";

  // Load agent's system prompt from the agents table.
  try {
    const { data: agentRow } = await supabase
      .from("agents")
      .select("system_prompt")
      .eq("slug", agent.slug)
      .maybeSingle();
    instructions = agentRow?.system_prompt ?? "";
  } catch (e) {
    console.warn(`Failed to load system prompt for ${agent.name}:`, e);
  }

  // Append workspace context (Brief + house rules) if available.
  if (workspaceId && instructions) {
    try {
      const { data: brief } = await supabase
        .from("workspace_briefs")
        .select("id,workspace_id,mission,target_user,current_focus,anti_goals,notes,updated_at")
        .eq("workspace_id", workspaceId)
        .maybeSingle();
      const briefBlock = renderBriefBlock(brief as any);
      if (briefBlock) {
        instructions += briefBlock;
      }
      const activeRules = await getActiveHouseRulesForWorkspace(supabase, workspaceId);
      const houseRulesBlock = renderHouseRulesBlock(activeRules);
      if (houseRulesBlock) {
        instructions += houseRulesBlock;
      }
    } catch (e) {
      // Non-fatal: if brief/rules load fails, still show base prompt.
      console.warn(`Failed to load workspace context for ${agent.name}:`, e);
    }
  }

  // Skills: playbooks used by this agent's station, with win-rates.
  const skills = await getStationSkills(supabase, workspaceId, agent.station);

  // Autonomy: basic info from the catalog.
  // PC-30 spec remainder: arc, tool modes, and graduation history are documented placeholders.
  const autonomy: AutonomyInfo = {
    station: agent.station,
    tier: agent.tier,
    status: agent.status,
  };

  // History: capability changes (for now, empty; PC-30 spec defers this to
  // human edit + PC-18 distillation + RPT-50 proposals, which land via lineage).
  const history: CapabilityChange[] = [];

  return {
    slug: agent.slug,
    name: agent.name,
    station: agent.station,
    blurb: agent.blurb,
    instructions,
    skills,
    autonomy,
    history,
  };
}

async function getStationSkills(
  supabase: SupabaseClient,
  workspaceId: string | null,
  station: AgentStation,
): Promise<SkillInfo[]> {
  if (!workspaceId) return [];

  // Get playbook runs for this station, grouped by playbook_id.
  const { data: runs } = await supabase
    .from("playbook_runs")
    .select("playbook_id, verdict")
    .eq("workspace_id", workspaceId)
    .eq("station", station);

  if (!runs || runs.length === 0) return [];

  // Group by playbook_id and calculate win-rates.
  const byPlaybook = new Map<string, { wins: number; total: number }>();
  for (const run of runs) {
    const current = byPlaybook.get(run.playbook_id) ?? { wins: 0, total: 0 };
    current.total += 1;
    if (run.verdict === "won" || run.verdict === "validated") {
      current.wins += 1;
    }
    byPlaybook.set(run.playbook_id, current);
  }

  // Convert to SkillInfo array, naming each from the playbook registry (falls
  // back to the raw id for a run recorded against a since-retired playbook,
  // never fabricated).
  const skills: SkillInfo[] = [];
  for (const [playbookId, stats] of byPlaybook) {
    const def = PLAYBOOK_REGISTRY.find((p) => p.id === playbookId);
    skills.push({
      id: playbookId,
      name: def?.name ?? playbookId,
      runs: stats.total,
      wins: stats.wins,
      winRate: stats.total > 0 ? stats.wins / stats.total : 0,
    });
  }

  return skills.sort((a, b) => b.runs - a.runs); // Sort by frequency.
}
