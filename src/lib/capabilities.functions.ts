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
import { SPECIALIST_CATALOG, type AgentStation, type CatalogEntry } from "@/lib/agent-vocabulary";
import { PLAYBOOK_REGISTRY } from "@/lib/playbooks/registry";
import {
  getActiveHouseRulesForWorkspace,
  renderHouseRulesBlock,
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
  type: "instructions" | "skill_enabled" | "skill_disabled" | "self_tuned";
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
    const { supabase, userId } = context;
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

    const capabilities: AgentCapability[] = [];

    for (const agent of activeCast) {
      const cap = await buildCapabilityForAgent(
        supabase,
        userId,
        agent,
        workspaceId,
        trustByAgentId,
      );
      capabilities.push(cap);
    }

    return { capabilities };
  });

async function buildCapabilityForAgent(
  supabase: SupabaseClient,
  userId: string,
  agent: CatalogEntry,
  workspaceId: string | null,
  trustByAgentId: Map<string, AgentTrust>,
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
  let instructionsPreview = baseInstructions;
  try {
    const voiceBlock = await loadVoiceAnchorBlock(supabase, userId);
    instructionsPreview += voiceBlock;
  } catch (e) {
    console.warn(`Failed to load voice anchor for ${agent.name}:`, e);
  }
  if (workspaceId) {
    try {
      const { data: brief } = await supabase
        .from("workspace_briefs")
        .select("id,workspace_id,mission,target_user,current_focus,anti_goals,notes,updated_at")
        .eq("workspace_id", workspaceId)
        .maybeSingle();
      instructionsPreview += renderBriefBlock(brief as any);

      const { data: briefItems } = await supabase
        .from("brief_items")
        .select(
          "id,workspace_id,kind,title,body,status,version,supersedes_id,created_at,updated_at",
        )
        .eq("workspace_id", workspaceId)
        .eq("status", "standing");
      instructionsPreview += renderBriefItemsBlock(briefItems as BriefItem[] | null);
    } catch (e) {
      console.warn(`Failed to load brief for ${agent.name}:`, e);
    }
    try {
      const activeRules = await getActiveHouseRulesForWorkspace(supabase, workspaceId, agent.slug);
      instructionsPreview += renderHouseRulesBlock(activeRules);
    } catch (e) {
      console.warn(`Failed to load house rules for ${agent.name}:`, e);
    }
  }

  // Skills: playbooks used by this agent's station, with win-rates.
  const skills = await getStationSkills(supabase, workspaceId, agent.station);

  // Autonomy: the trust-ramp arc/score (computed once for all agents, above)
  // plus this agent's graduated tool modes and decided graduation history.
  const trust = agentId ? trustByAgentId.get(agentId) : undefined;
  const toolModes = await getGraduatedToolModes(supabase, userId, agent.slug);
  const graduationHistory = await getGraduationHistory(supabase, userId, agent.slug);
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
  const history = await getCapabilityHistory(supabase, workspaceId, agent.slug);

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

/** Tool modes graduated (or operator-set) away from their seeded default for
 *  this agent -- the overlay agent_tool_modes carries, same shape reflection.server.ts's
 *  maybeProposeTrustGraduations reads to compute clean streaks. */
async function getGraduatedToolModes(
  supabase: SupabaseClient,
  userId: string,
  agentSlug: string,
): Promise<ToolModeInfo[]> {
  const { data: rows } = await supabase
    .from("agent_tool_modes" as never)
    .select("tool_name,mode,source")
    .eq("user_id", userId)
    .eq("agent_slug", agentSlug);

  return ((rows ?? []) as unknown as { tool_name: string; mode: string; source: string }[]).map(
    (r) => ({ toolName: r.tool_name, mode: r.mode, source: r.source }),
  );
}

/** Decided (approved/rejected) trust-graduation proposals for this agent,
 *  most recent first -- the graduation history the spec names. Queried
 *  directly (not via the unscoped listTrustGraduationProposals) so an
 *  agent's older history can't be pushed out by another agent's proposals
 *  sharing the same global 50-row cap. */
async function getGraduationHistory(
  supabase: SupabaseClient,
  userId: string,
  agentSlug: string,
): Promise<GraduationHistoryEntry[]> {
  const { data: rows } = await supabase
    .from("trust_graduation_proposals" as never)
    .select("id,tool_name,from_mode,to_mode,status,decided_at,rationale")
    .eq("user_id", userId)
    .eq("agent_slug", agentSlug)
    .in("status", ["approved", "rejected"])
    .order("decided_at", { ascending: false })
    .limit(10);

  return (
    (rows ?? []) as unknown as {
      id: string;
      tool_name: string;
      from_mode: string;
      to_mode: string;
      status: string;
      decided_at: string | null;
      rationale: string | null;
    }[]
  ).map((r) => ({
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

/** Record a capability change (human edit, or an RPT-50 self-tuned fix). */
export async function recordCapabilityChange(
  supabase: SupabaseClient,
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
    const { supabase, userId } = context;
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
