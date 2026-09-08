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
import type { Database } from "@/integrations/supabase/types";
import { assessAndQuarantine } from "@/lib/injection-classifier";
import {
  getUserWorkspaceRole,
  writeDeniedReason,
  type GovernedSurface,
  type Role,
} from "./roles.functions";

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
 * The provenance columns the weekly steward pass reads off `house_rules` to
 * work out where to look next. `source_learning_ids` is RF-04's own
 * provenance; `source_run_ids` belongs to the nightly retro (RPT-39), which
 * writes into this same table, so an EMPTY source_run_ids is what marks a row
 * as the steward pass's own work.
 */
export type HouseRuleProvenance = {
  workspace_id: string;
  status: string;
  source_learning_ids: string[] | null;
  source_run_ids: string[] | null;
  created_at: string;
};

/**
 * One workspace the weekly pass should spend a model call on, plus the exact
 * undistilled learnings that earned it the slot (newest first).
 */
export type DistillTarget = {
  workspaceId: string;
  ownerId: string;
  learningIds: string[];
};

export type SelectDistillTargetsInput = {
  /** Every workspace in scope, any order. */
  workspaces: { id: string; owner_id: string }[];
  /** Existing house_rules provenance across those workspaces. */
  existingRules: HouseRuleProvenance[];
  /** Learnings inside the lookback window, NEWEST FIRST. */
  learnings: { id: string; workspace_id: string | null }[];
  /** Start of the current ISO week (UTC) as an ISO timestamp. */
  weekStartIso: string;
  minLearnings: number;
  maxLearningsPerWorkspace: number;
  maxWorkspaces: number;
};

/**
 * PURE. Decide which workspaces this week's steward pass distils, and from
 * which learnings.
 *
 * THE DEFECT THIS EXISTS TO PREVENT, measured on production 2026-08-05: the
 * tick used to take the five OLDEST workspaces by created_at and nothing else.
 * Those five held zero `learnings` between them, all time, while every one of
 * the eleven workspaces that did hold learnings had been created later and so
 * could never enter the window. The pass ran on schedule, finished in 515ms
 * without ever reaching a model, and reported ok. That is why `house_rules`
 * held five rows and not one of them was distilled from a learning. Selection
 * now follows where the undistilled material actually is, never workspace age.
 *
 * Ranking is by how much undistilled material a workspace holds, so the scarce
 * model calls go where the evidence is. Provenance dedup drains that pool as
 * rules get drafted, so a busy workspace cannot hold the slots forever. Ties
 * break on workspace id so a pass is deterministic and replayable.
 */
export function selectDistillTargets(input: SelectDistillTargetsInput): DistillTarget[] {
  const owners = new Map(input.workspaces.map((w) => [w.id, w.owner_id]));

  // A learning cited by any non-rejected rule is spent, so a learning is
  // distilled at most once. A REJECTED draft releases its learnings again: a
  // human turning down one framing of a pattern must not bury that pattern
  // forever.
  const spent = new Set(
    input.existingRules
      .filter((r) => r.status !== "rejected")
      .flatMap((r) => r.source_learning_ids ?? []),
  );

  // Weekly idempotency: a workspace this pass already drafted for during THIS
  // ISO week is finished. Scoped to the pass's own drafts (empty
  // source_run_ids) so the nightly retro's rows, which land in the same table,
  // never suppress it.
  const doneThisWeek = new Set(
    input.existingRules
      .filter((r) => (r.source_run_ids ?? []).length === 0 && r.created_at >= input.weekStartIso)
      .map((r) => r.workspace_id),
  );

  const pools = new Map<string, string[]>();
  for (const learning of input.learnings) {
    const wsId = learning.workspace_id;
    if (!wsId || !owners.has(wsId) || doneThisWeek.has(wsId) || spent.has(learning.id)) continue;
    const pool = pools.get(wsId) ?? [];
    // The per-workspace cap keeps the drafting prompt bounded, and it is
    // applied AFTER dedup, never before. Capping first was the second half of
    // the same starvation bug: a workspace whose newest N learnings were all
    // already distilled would read as empty while undistilled ones sat just
    // outside the cut.
    if (pool.length >= input.maxLearningsPerWorkspace) continue;
    pool.push(learning.id);
    pools.set(wsId, pool);
  }

  return [...pools.entries()]
    .filter(([, ids]) => ids.length >= input.minLearnings)
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .slice(0, input.maxWorkspaces)
    .flatMap(([workspaceId, learningIds]) => {
      const ownerId = owners.get(workspaceId);
      return ownerId ? [{ workspaceId, ownerId, learningIds }] : [];
    });
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
    return readHouseRules(supabase, data.workspaceId ?? null);
  });

/** The read behind `listHouseRules`, callable with a client you already hold
 *  (the approvals queue, which used to pay the auth middleware again to call
 *  the server function from inside its own handler). */
export async function readHouseRules(
  supabase: SupabaseClient<Database>,
  explicitWorkspaceId: string | null | undefined,
): Promise<ListHouseRulesResult> {
  const workspaceId = await resolveWorkspaceId(supabase, explicitWorkspaceId ?? null);
  if (!workspaceId) return { rules: [] };
  const { data: rows, error } = await supabase
    .from("house_rules")
    .select(SELECT_COLUMNS)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return { rules: (rows ?? []) as HouseRule[] };
}

/** The two kinds of write this file performs on `house_rules`. */
export type HouseRuleWriteAction = "decide" | "draft";

/**
 * PURE. Which governed surface a house-rule write belongs to.
 *
 * DECIDING a rule (approve or reject) is an owner/admin act, because an
 * approved rule is injected verbatim into every agent's system prompt at the
 * chokepoint. DRAFTING one is a proposal, and a member keeps it: a draft lands
 * as status='pending' and changes no agent's behaviour until somebody decides
 * it. Collapsing the two would either hand a viewer the approval or take
 * proposing away from members, so the choice is made once, here, and tested.
 */
export function houseRuleSurface(action: HouseRuleWriteAction): GovernedSurface {
  return action === "decide" ? "house_rules_decide" : "house_rules_draft";
}

/**
 * PURE, and the only place this file decides what to say about a refused write.
 * Null means the role may write.
 *
 * THE DEFECT THIS EXISTS TO PREVENT: RLS refuses an UPDATE by matching zero
 * rows, not by raising. Once migration 20260805130000 narrows house_rules
 * writes to owner/admin, a viewer pressing Approve would otherwise watch the
 * button do nothing and hear nothing, which is strictly worse than the hole
 * being closed.
 */
export function houseRuleWriteDenial(
  role: Role | null | undefined,
  action: HouseRuleWriteAction,
): string | null {
  return writeDeniedReason(role, houseRuleSurface(action));
}

/**
 * Refuse a house-rule write BEFORE attempting it, in a sentence a person can
 * act on. Reads the role off workspace_members, which is exactly what the
 * database's own has_workspace_role() reads, so this check and the policy that
 * enforces it cannot drift into disagreeing.
 */
async function assertCanWriteHouseRule(
  supabase: SupabaseClient<Database>,
  userId: string,
  workspaceId: string,
  action: HouseRuleWriteAction,
): Promise<void> {
  const role = await getUserWorkspaceRole(supabase, workspaceId, userId);
  const denial = houseRuleWriteDenial(role, action);
  if (denial) throw new Error(denial);
}

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
    // Read the rule's workspace first so the refusal can name the caller's role
    // instead of arriving as an unexplained zero-row update.
    const { data: rule, error: readErr } = await supabase
      .from("house_rules")
      .select("workspace_id")
      .eq("id", data.ruleId)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!rule) throw new Error("That house rule is no longer here, so nothing changed.");
    await assertCanWriteHouseRule(
      supabase,
      userId,
      (rule as { workspace_id: string }).workspace_id,
      "decide",
    );

    const status: HouseRuleStatus = data.decision === "approve" ? "approved" : "rejected";
    const { data: updated, error } = await supabase
      .from("house_rules")
      .update({ status, decided_by: userId, decided_at: new Date().toISOString() })
      .eq("id", data.ruleId)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    // The role check above has already answered the common case. A zero-row
    // update that survives it is genuinely ambiguous: a policy refusal and a
    // rule someone else removed a second ago are the same empty response, and
    // PostgREST does not say which. Say that, rather than guess, and never
    // return ok:true for a decision we cannot vouch for.
    if (!updated) {
      throw new Error(
        "We could not confirm that decision. Reload the page and check this rule before relying on it.",
      );
    }
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
    if (!oldRule) throw new Error("That house rule is no longer here, so nothing was drafted.");
    const workspaceId = (oldRule as { workspace_id: string }).workspace_id;
    // A replacement is a DRAFT, not a decision: it lands as status='pending'
    // and changes no agent's behaviour until somebody approves it. So a member
    // keeps this, and only a read-only role is turned away.
    await assertCanWriteHouseRule(supabase, userId, workspaceId, "draft");

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
