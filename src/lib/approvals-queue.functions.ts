/**
 * Surface 3 (Approvals) - the single pull point (architecture §5).
 *
 * getApprovalsQueue federates every pending human gate the product already
 * has into one typed list, so the queue never asks a user to visit five
 * screens to find out what needs them. Every source is an EXISTING,
 * already-shipped table/resolver - this module adds no new gate, no new
 * table, no new capability; it only reads and re-shapes.
 *
 * Consolidation note (read, not a new gate): the architecture's gate
 * inventory lists ONE "Tool-call confirm/review" gate, backed by the single
 * `agent_approvals` table. Both `agent_loop.functions.listApprovals` and
 * `governance.functions.listGovernApprovals` read that same table - using
 * both here would double-list every pending tool call. This module reads
 * the richer one (`listGovernApprovals`: mission title, risk grade, agent
 * track record) and decides through its matching resolver (`resolveApproval`),
 * which already carries the tool-execution semantics `agent_loop`'s
 * `decideApproval` also implements (see the doc comment on resolveApproval).
 *
 * Gates federated: tool-call confirm/review, what-to-build / plan-sign-off
 * / other pending decisions, memory graduation (memory_candidates and
 * house_rules), trust graduation. Ship gates and spend gates already route
 * through the tool-call gate above when they are agent-executed tools; this
 * module does not invent a separate spend feed (no such read exists yet -
 * see the ledger note in the lane report).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { listGovernApprovals, resolveApproval } from "@/lib/governance.functions";
import { listDecisions, updateDecision } from "@/lib/decisions.functions";
import { listMemoryCandidates, decideMemoryCandidate } from "@/lib/memory-candidates.functions";
import { listHouseRules, decideHouseRule } from "@/lib/house-rules.functions";
import { listTrustGraduationProposals, decideTrustGraduation } from "@/lib/trust.functions";
import { ACTION_LABEL } from "@/lib/agent-vocabulary";
import { toolConsequence, REVERSIBILITY_LABEL } from "@/lib/tool-consequences";
import type { ApprovalItem } from "@/components/ink/ApprovalCard";
import type { VerdictTone } from "@/components/ink/chips";

/** The five gate families this queue federates. Used to route the decide
 *  call to the right existing resolver - never to brand anything in the UI. */
export type ApprovalKind =
  "tool_call" | "decision" | "memory_candidate" | "house_rule" | "trust_graduation";

/** The filter row's buckets (architecture §5 / the taste doc's restraint
 *  law: text tabs, not a facet explosion). "spend" exists as a bucket so the
 *  row matches the copy deck's shape; nothing routes into it yet because no
 *  spend-gate READ exists in the codebase today (see the ledger note). */
export type ApprovalFilter = "all" | "proposals" | "gates" | "memory" | "spend";

export type ApprovalQueueItem = ApprovalItem & {
  kindKey: ApprovalKind;
  /** The id to send back on decide - never the composite `item.id`. */
  sourceId: string;
  filterBucket: Exclude<ApprovalFilter, "all">;
  /** Null when the gate has no project of its own (workspace-wide memory,
   *  trust, or a mission with no resolvable project - see the ledger note). */
  projectId: string | null;
  projectName: string | null;
};

export type ApprovalsQueueResult = {
  items: ApprovalQueueItem[];
};

export const getApprovalsQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ApprovalsQueueResult> => {
    const { supabase } = context;

    const [govern, decisionsRes, memCandidates, houseRules, trustProposals] = await Promise.all([
      // listGovernApprovals takes no filter and returns every status (the
      // Govern surface needs the decided history for the track record) - the
      // pending filter below narrows it to the queue.
      listGovernApprovals().catch(() => ({
        approvals: [],
        trackByAgent: {},
        outcomeByAgent: {},
        rejectionsByKey: {},
        medianResponseMs: null,
      })),
      listDecisions({ data: { status: "pending" } }).catch(() => ({ decisions: [] })),
      // Direct RLS-wide read, not the workspace-scoped list function: the
      // queue is the single pull point (law 4.4), so a pending candidate in
      // ANY of the caller's workspaces must surface here.
      context.supabase
        .from("memory_candidates")
        .select("id, content, status, importance, source_kind, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(100)
        .then(({ data: rows }) => ({
          items: (
            (rows ?? []) as Array<{
              id: string;
              content: string;
              status: string;
              importance: number | null;
              source_kind: string;
              created_at: string;
            }>
          ).map((r) => ({ ...r, supersedes_content: null as string | null })),
        }))
        .catch(() => ({ items: [] })),
      listHouseRules({ data: {} }).catch(() => ({ rules: [] })),
      listTrustGraduationProposals().catch(
        () => [] as Awaited<ReturnType<typeof listTrustGraduationProposals>>,
      ),
    ]);

    // Project resolution: only decisions carry a resolvable project today,
    // via prd_id -> prds.project_id -> projects.name (missions and
    // agent_approvals carry no project_id in the current schema - flagged
    // in the ledger). Batched in one pass over the pending decisions.
    const pendingDecisions = (decisionsRes.decisions ?? []).filter((d) => d.status === "pending");
    const prdIds = [
      ...new Set(pendingDecisions.map((d) => d.prd_id).filter((x): x is string => !!x)),
    ];
    const projectByPrd = new Map<string, { id: string; name: string }>();
    if (prdIds.length) {
      const { data: prds } = await supabase.from("prds").select("id,project_id").in("id", prdIds);
      const projectIds = [
        ...new Set(
          (prds ?? [])
            .map((p) => (p as { project_id: string | null }).project_id)
            .filter((x): x is string => !!x),
        ),
      ];
      if (projectIds.length) {
        const { data: projects } = await supabase
          .from("projects")
          .select("id,name")
          .in("id", projectIds);
        const nameById = new Map<string, string>(
          (projects ?? []).map((p) => [p.id as string, (p.name as string) ?? "Untitled"]),
        );
        for (const p of (prds ?? []) as { id: string; project_id: string | null }[]) {
          if (p.project_id && nameById.has(p.project_id)) {
            projectByPrd.set(p.id, { id: p.project_id, name: nameById.get(p.project_id)! });
          }
        }
      }
    }

    const items: ApprovalQueueItem[] = [];

    // --- Tool-call confirm/review gates ------------------------------------
    for (const a of govern.approvals.filter((a) => a.status === "pending")) {
      const consequence = toolConsequence(a.tool_name);
      const track = a.agent_slug ? govern.trackByAgent[a.agent_slug] : undefined;
      const evidence: string[] = [];
      if (a.rationale) evidence.push(a.rationale);
      evidence.push(`${REVERSIBILITY_LABEL[consequence.reversible]} · ${consequence.undo}`);
      if (track && track.total > 0) {
        evidence.push(`This agent: ${track.approved} of ${track.total} approved before.`);
      }
      const kindTone: VerdictTone = a.risk === "high" ? "human" : "machine";
      items.push({
        id: `tool_call:${a.id}`,
        kindKey: "tool_call",
        sourceId: a.id,
        filterBucket: "gates",
        kind: "GATE",
        kindTone,
        project: a.mission_title ?? undefined,
        title: consequence.effect,
        evidence,
        impact: `${a.risk} risk${a.mission_title ? ` · in ${a.mission_title}` : ""}`,
        approveConsequence: "Approve · runs the action",
        rejectConsequence: "Reject · agent stands down",
        timestamp: a.created_at,
        projectId: null,
        projectName: null,
      });
    }

    // --- Proposals: pending decisions ---------------------------------------
    for (const d of pendingDecisions) {
      const proj = d.prd_id ? projectByPrd.get(d.prd_id) : undefined;
      const evidence: string[] = [];
      if (d.rationale) evidence.push(d.rationale);
      if (d.source_label) evidence.push(`From ${d.source_label}`);
      items.push({
        id: `decision:${d.id}`,
        kindKey: "decision",
        sourceId: d.id,
        filterBucket: "proposals",
        kind: "PROPOSAL",
        kindTone: "human",
        project: proj?.name,
        title: d.title,
        evidence,
        impact: d.source_kind === "mission" ? "raised during a pass" : undefined,
        approveConsequence: "Approve · decision recorded",
        rejectConsequence: "Reject · noted for next time",
        timestamp: d.created_at,
        projectId: proj?.id ?? null,
        projectName: proj?.name ?? null,
      });
    }

    // --- Memory graduation: candidates + house rules -----------------------
    for (const c of memCandidates.items.filter((c) => c.status === "pending")) {
      // The title already carries the content; evidence only adds what the
      // title cannot (what this rule would replace).
      const evidence: string[] = [];
      if (c.supersedes_content) evidence.push(`Replaces: ${c.supersedes_content}`);
      items.push({
        id: `memory_candidate:${c.id}`,
        kindKey: "memory_candidate",
        sourceId: c.id,
        filterBucket: "memory",
        kind: "MEMORY",
        kindTone: "neutral",
        title: c.content.length > 140 ? `${c.content.slice(0, 140)}…` : c.content,
        evidence,
        impact: `importance ${c.importance ?? 3}/5 · from ${c.source_kind}`,
        approveConsequence: "Approve · saves to workspace memory",
        rejectConsequence: "Reject · nothing saved",
        timestamp: c.created_at,
        projectId: null,
        projectName: null,
      });
    }
    for (const r of houseRules.rules.filter((r) => r.status === "pending")) {
      const evidence: string[] = [];
      if (r.rationale) evidence.push(r.rationale);
      evidence.push(
        `Distilled from ${r.source_learning_ids.length} learning${
          r.source_learning_ids.length === 1 ? "" : "s"
        }.`,
      );
      items.push({
        id: `house_rule:${r.id}`,
        kindKey: "house_rule",
        sourceId: r.id,
        filterBucket: "memory",
        kind: "MEMORY",
        kindTone: "neutral",
        title: r.rule_text,
        evidence,
        impact: r.agent_slug ? "applies to one agent" : "applies workspace-wide",
        approveConsequence: "Approve · becomes a standing rule",
        rejectConsequence: "Reject · rule discarded",
        timestamp: r.created_at,
        projectId: null,
        projectName: null,
      });
    }

    // --- Trust graduation ----------------------------------------------------
    for (const t of trustProposals.filter((t) => t.status === "pending")) {
      const evidence: string[] = [];
      if (t.rationale) evidence.push(t.rationale);
      evidence.push(`${t.clean_streak} clean approvals in a row.`);
      items.push({
        id: `trust_graduation:${t.id}`,
        kindKey: "trust_graduation",
        sourceId: t.id,
        filterBucket: "gates",
        kind: "TRUST",
        kindTone: "machine",
        // Plain words, never internals (law 6.4): "studio.stage" reads as
        // "drafting changes"; unknown tools fall back to "this action".
        title: `Let the agent run ${ACTION_LABEL[t.tool_name] ?? "this action"} without asking`,
        evidence,
        impact: `today it asks first (${t.from_mode}); approving makes it automatic`,
        approveConsequence: "Approve · agent gets more autonomy",
        rejectConsequence: "Reject · stays as is",
        timestamp: t.created_at,
        projectId: null,
        projectName: null,
      });
    }

    items.sort((a, b) => (b.timestamp ?? "").localeCompare(a.timestamp ?? ""));
    return { items };
  });

const DecideSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["tool_call", "decision", "memory_candidate", "house_rule", "trust_graduation"]),
  verdict: z.enum(["approve", "reject"]),
});

export type DecideApprovalItemResult = { ok: boolean };

/** One decide entry point for every gate kind, routing to the existing
 *  resolver for that gate (never a new write path). */
export const decideApprovalItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof DecideSchema>) => DecideSchema.parse(d))
  .handler(async ({ data }): Promise<DecideApprovalItemResult> => {
    switch (data.kind) {
      case "tool_call": {
        await resolveApproval({
          data: {
            approvalId: data.id,
            decision: data.verdict === "approve" ? "approved" : "rejected",
          },
        });
        return { ok: true };
      }
      case "decision": {
        await updateDecision({
          data: { id: data.id, status: data.verdict === "approve" ? "approved" : "rejected" },
        });
        return { ok: true };
      }
      case "memory_candidate": {
        await decideMemoryCandidate({ data: { id: data.id, decision: data.verdict } });
        return { ok: true };
      }
      case "house_rule": {
        await decideHouseRule({ data: { ruleId: data.id, decision: data.verdict } });
        return { ok: true };
      }
      case "trust_graduation": {
        await decideTrustGraduation({
          data: { proposalId: data.id, accept: data.verdict === "approve" },
        });
        return { ok: true };
      }
      default:
        throw new Error(`decideApprovalItem: unknown kind ${String(data.kind)}`);
    }
  });
