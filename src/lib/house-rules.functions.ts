/**
 * RF-04: House-rules distillation (v12 §3.2, Tier 1, L5).
 *
 * A weekly steward pass (src/routes/api/public/hooks/house-rules-tick.ts)
 * clusters a workspace's validated learnings into short, versioned operating
 * rules and inserts them here as approval-gated drafts. A human decides each
 * one (decideHouseRule); only 'approved' rules that have not themselves been
 * superseded are injected into every agent's system prompt at the chokepoint,
 * right alongside the Strategic Brief (see src/lib/ai/loop.server.ts ->
 * renderHouseRulesBlock, modeled directly on renderBriefBlock in
 * briefs.functions.ts).
 *
 * Supersession mirrors `decisions`: retired-ness is DERIVED from an
 * artifact_lineage edge (relation='supersedes', parent=the new rule,
 * child=the old one), never a status flag — see src/lib/ai/supersession.ts
 * for the parent/child convention this follows. A supersedes edge only
 * retires its child once the PARENT (the new rule) is itself approved, so a
 * still-pending replacement draft never silently mutes the rule it proposes
 * to replace.
 *
 * KNOWN LIMIT: artifact_lineage RLS is owner-scoped (`auth.uid() = user_id`),
 * not workspace-scoped — a pre-existing constraint of the whole lineage
 * system (identical to how `decisions` supersession already behaves). In a
 * multi-user workspace, a supersession recorded by one member may not be
 * visible to another member's chokepoint read. Documented, not fixed here —
 * fixing lineage RLS is a cross-cutting change outside this ticket's scope.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assessAndQuarantine } from "@/lib/injection-classifier";

export type HouseRuleStatus = "pending" | "approved" | "rejected";

export type HouseRule = {
  id: string;
  workspace_id: string;
  rule_text: string;
  rationale: string | null;
  status: HouseRuleStatus;
  source_learning_ids: string[];
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  /** PC-30/RPT-50: null = applies workspace-wide (the original behavior);
   *  set = applies only to that one agent's system prompt. */
  agent_slug: string | null;
};

const SELECT_COLUMNS =
  "id,workspace_id,rule_text,rationale,status,source_learning_ids,decided_by,decided_at,created_at,agent_slug";

async function resolveWorkspaceId(
  supabase: SupabaseClient,
  explicit: string | null | undefined,
): Promise<string | null> {
  if (explicit) return explicit;
  const { data } = await supabase.rpc("current_user_default_workspace");
  return (data as string | null) ?? null;
}

/**
 * Server-side helper: render approved, non-superseded house rules as a
 * plain-text block for injection into an agent's system prompt. Returns ""
 * when there are none, so we never inject noise (mirrors renderBriefBlock).
 */
export function renderHouseRulesBlock(rules: HouseRule[]): string {
  if (!rules.length) return "";
  const body = rules.map((r) => `- ${r.rule_text.trim()}`).join("\n");
  return `\n--- Workspace House Rules (steward-distilled, approved, standing) ---\n${body}\n--- End house rules ---\n`;
}

export type SupersedeEdge = { parent_id: string; child_id: string };

/**
 * PURE. Given a workspace's approved house rules and its house_rule->house_rule
 * supersedes edges, return the subset still active: a supersedes edge only
 * retires its child (the old rule) once the PARENT (the new rule) is ITSELF
 * in the approved set — a still-pending replacement draft never silently
 * mutes the rule it proposes to replace.
 */
export function filterActiveRules(
  approvedRules: HouseRule[],
  supersedeEdges: SupersedeEdge[],
): HouseRule[] {
  if (approvedRules.length === 0 || supersedeEdges.length === 0) return approvedRules;
  const approvedIds = new Set(approvedRules.map((r) => r.id));
  const retiredIds = new Set(
    supersedeEdges.filter((e) => approvedIds.has(e.parent_id)).map((e) => e.child_id),
  );
  return approvedRules.filter((r) => !retiredIds.has(r.id));
}

/**
 * PURE. Narrow a workspace's approved rules to the ones a given agent
 * actually receives: every workspace-wide rule (agent_slug null) plus any
 * rule scoped to exactly that agent. A null/undefined agentSlug is the
 * original unscoped behavior -- every approved rule, untouched.
 */
export function filterRulesForAgent(
  approvedRules: HouseRule[],
  agentSlug: string | null | undefined,
): HouseRule[] {
  if (!agentSlug) return approvedRules;
  return approvedRules.filter((r) => !r.agent_slug || r.agent_slug === agentSlug);
}

/**
 * Load this workspace's currently-active house rules: status='approved' and
 * not retired by an approved supersedes edge. Called directly (not a
 * createServerFn) from the chokepoint in loop.server.ts, same as the brief
 * load it sits beside.
 *
 * agentSlug (PC-30/RPT-50): when passed, narrows to rules that apply to that
 * agent: every workspace-wide rule (agent_slug null) plus any rule scoped
 * to exactly that agent. Omit to keep the original unscoped behavior (every
 * approved rule), which existing callers that haven't been updated still get.
 */
export async function getActiveHouseRulesForWorkspace(
  supabase: SupabaseClient,
  workspaceId: string,
  agentSlug?: string | null,
): Promise<HouseRule[]> {
  const { data: rows } = await supabase
    .from("house_rules")
    .select(SELECT_COLUMNS)
    .eq("workspace_id", workspaceId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  const approved = filterRulesForAgent((rows ?? []) as HouseRule[], agentSlug);
  if (approved.length === 0) return [];

  const ids = approved.map((r) => r.id);
  const { data: edges } = await supabase
    .from("artifact_lineage")
    .select("parent_id,child_id")
    .eq("relation", "supersedes")
    .eq("parent_kind", "house_rule")
    .eq("child_kind", "house_rule")
    .in("child_id", ids);

  return filterActiveRules(approved, (edges ?? []) as SupersedeEdge[]);
}

const ListSchema = z.object({ workspaceId: z.string().uuid().nullable().optional() }).strip();

export type ListHouseRulesResult = { rules: HouseRule[] };

/** UI read: every house rule for the workspace, newest first (all statuses). */
export const listHouseRules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof ListSchema> | undefined) => ListSchema.parse(d ?? {}))
  .handler(async ({ context, data }): Promise<ListHouseRulesResult> => {
    const { supabase } = context;
    const workspaceId = await resolveWorkspaceId(supabase, data.workspaceId ?? null);
    if (!workspaceId) return { rules: [] };
    const { data: rows, error } = await supabase
      .from("house_rules")
      .select(SELECT_COLUMNS)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { rules: (rows ?? []) as HouseRule[] };
  });

const DecideSchema = z.object({
  ruleId: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
});

export type DecideHouseRuleResult = { ok: boolean };

/** Approve or reject a pending (or previously decided) house rule draft. */
export const decideHouseRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof DecideSchema>) => DecideSchema.parse(d))
  .handler(async ({ context, data }): Promise<DecideHouseRuleResult> => {
    const { supabase, userId } = context;
    const status: HouseRuleStatus = data.decision === "approve" ? "approved" : "rejected";
    const { data: updated, error } = await supabase
      .from("house_rules")
      .update({ status, decided_by: userId, decided_at: new Date().toISOString() })
      .eq("id", data.ruleId)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    // A zero-row update means the rule was already gone or (via RLS) belongs
    // to a workspace the caller isn't a member of — fail loudly instead of
    // returning ok:true for a no-op the UI would otherwise render as success.
    if (!updated) throw new Error("decideHouseRule: rule not found or not accessible");
    return { ok: true };
  });

const SupersedeSchema = z.object({
  oldRuleId: z.string().uuid(),
  ruleText: z.string().min(1).max(2000),
  rationale: z.string().max(2000).optional(),
});

export type SupersedeHouseRuleResult = { ok: boolean; id: string | null };

/**
 * Draft a replacement for an existing rule: inserts a new 'pending' row and
 * records the supersedes edge (new=parent, old=child) immediately. The old
 * rule stays active until a human approves the new one — getActiveHouseRulesForWorkspace
 * only retires a child whose supersedes-parent is itself 'approved'.
 */
export const supersedeHouseRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof SupersedeSchema>) => SupersedeSchema.parse(d))
  .handler(async ({ context, data }): Promise<SupersedeHouseRuleResult> => {
    const { supabase, userId } = context;
    const { data: oldRule, error: oldErr } = await supabase
      .from("house_rules")
      .select("workspace_id")
      .eq("id", data.oldRuleId)
      .maybeSingle();
    if (oldErr) throw new Error(oldErr.message);
    if (!oldRule) throw new Error("supersedeHouseRule: original rule not found");
    const workspaceId = (oldRule as { workspace_id: string }).workspace_id;

    // Same untrusted-boundary screening as the AI-drafted path (defense in
    // depth): a human-submitted replacement still ends up injected into every
    // future agent's system prompt once approved.
    const screened = assessAndQuarantine(data.ruleText);
    const { data: inserted, error: insErr } = await supabase
      .from("house_rules")
      .insert({
        workspace_id: workspaceId,
        rule_text: screened.text,
        rationale: data.rationale ?? null,
        status: "pending",
      })
      .select("id")
      .single();
    if (insErr) throw new Error(insErr.message);
    const newId = (inserted as { id: string }).id;

    const { error: edgeErr } = await supabase.from("artifact_lineage").upsert(
      {
        user_id: userId,
        parent_kind: "house_rule",
        parent_id: newId,
        child_kind: "house_rule",
        child_id: data.oldRuleId,
        relation: "supersedes",
        rationale: data.rationale ?? null,
        created_by_agent: null,
      },
      { onConflict: "user_id,parent_kind,parent_id,child_kind,child_id,relation" },
    );
    if (edgeErr) throw new Error(edgeErr.message);

    return { ok: true, id: newId };
  });
