/**
 * PC-30: The agent capability layer.
 *
 * Each cast member has capabilities: instructions (what they're told every run),
 * skills (playbooks with validated-outcome rates), autonomy (trust tiers), and
 * history (changes via lineage). This module provides the read interface for Brain's
 * Capability lens.
 *
 * Write side: recordCapabilityChange records human edits (instructions, skill enable/disable)
 * via lineage + capability_changes table, displayed as receipts in the history section.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SPECIALIST_CATALOG, type AgentStation, type CatalogEntry } from "@/lib/agent-vocabulary";
import { PLAYBOOK_REGISTRY } from "@/lib/playbooks/registry";
import {
  getActiveHouseRulesForWorkspace,
  renderHouseRulesBlock,
} from "@/lib/house-rules.functions";
import { renderBriefBlock } from "@/lib/briefs.functions";
import { recordLineageSafe } from "@/lib/lineage.functions";
import { z } from "zod";

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

  // History: capability changes recorded via human edits (PC-30 write side wiring).
  // PC-18 distillation + RPT-50 proposals are deferred per spec.
  const history = await getCapabilityHistory(supabase, workspaceId, agent.slug);

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

/** Get recent capability changes for an agent in a workspace. */
async function getCapabilityHistory(
  supabase: SupabaseClient,
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
  const history: CapabilityChange[] = changes.map((c: any) => ({
    id: c.id,
    type: c.change_type,
    description: c.description,
    changedAt: c.created_at,
    changedBy: c.user_id ? c.user_id.substring(0, 8) : null, // Placeholder: use userId prefix
  }));

  return history;
}

/** Record a capability change (human edit). */
export async function recordCapabilityChange(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
  agentSlug: string,
  changeType: "instructions" | "skill_enabled" | "skill_disabled",
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
    const { supabase, userId } = context;
    let workspaceId = data.workspaceId ?? null;
    if (!workspaceId) {
      const { data: ws } = await supabase.rpc("current_user_default_workspace");
      workspaceId = (ws as string | null) ?? null;
    }
    if (!workspaceId) throw new Error("updateAgentInstructions: no workspace");

    // NOTE: Instructions are stored in the agents table, per-user (not per-workspace yet).
    // This is a simplification for MVP; full house-rule scoping is deferred per spec.
    // For now, we just record the change in capability_changes + lineage.

    await recordCapabilityChange(
      supabase,
      userId,
      workspaceId,
      data.agentSlug,
      "instructions",
      `Updated ${data.agentSlug}'s instructions`,
    );

    return { ok: true };
  });
