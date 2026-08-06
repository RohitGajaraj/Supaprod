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
 * house_rules), trust graduation, specs in review, opportunities carrying a
 * Critic verdict, open assumption-supersession challenges, undecided design
 * gates, and proposed playbooks (2026-07-18: ONE COUNT, ONE SOURCE - this
 * queue now federates every family Today's "needs you" triage counts, so
 * the rail badge, the Today hero, and the approvals pill can never disagree
 * again). Ship gates and spend gates already route through the tool-call
 * gate above when they are agent-executed tools; this module does not
 * invent a separate spend feed (no such read exists yet - see the ledger
 * note in the lane report). Pushed Brain insights and ready fan-out batches
 * are deliberately NOT federated here: they are attention, not a yes/no
 * approval with an existing decide resolver, so Today keeps owning them.
 *
 * Workspace scoping (2026-07-18, Change 3): `workspaceId` is optional. Every
 * source that carries a `workspace_id` column is filtered to it when given;
 * sources that don't (agent_approvals/tool-call gates, trust graduation
 * proposals - both predate workspace tenancy) stay unscoped either way.
 * Omitting it keeps the original RLS-wide "everything across every
 * workspace I'm a member of" read this queue has always done.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { listGovernApprovals, resolveApproval } from "@/lib/governance.functions";
import {
  listDecisions,
  updateDecision,
  resolveAssumptionChallenge,
} from "@/lib/decisions.functions";
import { listMemoryCandidates, decideMemoryCandidate } from "@/lib/memory-candidates.functions";
import { listHouseRules, decideHouseRule } from "@/lib/house-rules.functions";
import { listTrustGraduationProposals, decideTrustGraduation } from "@/lib/trust.functions";
import { savePrd, updateOpportunity, type CriticReview } from "@/lib/discovery.functions";
import { decideDesignGate } from "@/lib/design-scaffold.functions";
import { decidePlaybookProposal } from "@/lib/playbooks.functions";
import { castByStation, type AgentStation } from "@/lib/agent-vocabulary";

/** The station whose specialist owns each gate family, so a gate that carries
 *  no explicit agent slug still shows an honest attribution chip (the agent
 *  that produces that kind of call). */
const APPROVAL_KIND_STATION: Partial<Record<ApprovalKind, AgentStation>> = {
  decision: "decide",
  opportunity: "decide",
  assumption_challenge: "decide",
  spec: "define",
  design_gate: "design",
  tool_call: "build",
  memory_candidate: "learn",
  house_rule: "learn",
};
function approvalAgentSlug(kind: ApprovalKind, explicit: string | null): string | null {
  if (explicit) return explicit;
  const station = APPROVAL_KIND_STATION[kind];
  return station ? (castByStation(station)[0]?.slug ?? null) : null;
}
import { ACTION_LABEL } from "@/lib/agent-vocabulary";
import { sourceLabel } from "@/lib/memory-candidates";
import { toolConsequence, REVERSIBILITY_LABEL } from "@/lib/tool-consequences";
import type { ApprovalItem } from "@/components/ink/ApprovalCard";
import type { VerdictTone } from "@/components/ink/chips";
import { cleanTitle } from "@/components/plan/format";

/** The ten gate families this queue federates. Used to route the decide
 *  call to the right existing resolver - never to brand anything in the UI. */
export type ApprovalKind =
  | "tool_call"
  | "decision"
  | "memory_candidate"
  | "house_rule"
  | "trust_graduation"
  | "spec"
  | "opportunity"
  | "assumption_challenge"
  | "design_gate"
  | "playbook_proposal";

/** The filter row's buckets (architecture §5 / the taste doc's restraint
 *  law: text tabs, not a facet explosion). "spend" exists as a bucket so the
 *  row matches the copy deck's shape; nothing routes into it yet because no
 *  spend-gate READ exists in the codebase today (see the ledger note). Specs,
 *  opportunities, design gates, and playbook proposals all read as sensible
 *  "proposals"; an assumption challenge is a "gate" (it reopens a standing
 *  decision, the same shape as a tool-call gate). */
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
  /** The agent that owns this gate (real slug for tool-call gates, else the
   *  owning station's specialist); renders the attribution chip. Set in the
   *  final map, so the per-kind constructions do not each repeat it. */
  agentSlug?: string | null;
};

export type ApprovalsQueueResult = {
  items: ApprovalQueueItem[];
};

/** Tolerant critic_review reader: jsonb object or a stringified copy (mirrors
 *  today.functions.ts's private helper of the same name). */
function parseCriticReview(raw: unknown): CriticReview | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as CriticReview;
    } catch {
      return null;
    }
  }
  return raw as CriticReview;
}

/** A short "why" line from a Critic verdict, honest when there isn't one yet. */
function criticEvidenceLine(cr: CriticReview | null): string {
  if (!cr) return "Waiting on your call. No Critic review yet.";
  if (cr.risks?.length) return cr.risks[0];
  if (cr.summary) return cr.summary;
  return "Waiting on your call.";
}

const GetQueueSchema = z.object({ workspaceId: z.string().uuid().optional() });

export const getApprovalsQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof GetQueueSchema>) => GetQueueSchema.parse(d ?? {}))
  .handler(async ({ context, data }): Promise<ApprovalsQueueResult> => {
    const { supabase } = context;
    const wsId = data.workspaceId ?? null;

    const [
      govern,
      decisionsRes,
      memCandidates,
      houseRules,
      trustProposals,
      specRows,
      oppRows,
      challengeRows,
      playbookRows,
      designWsRows,
    ] = await Promise.all([
      // listGovernApprovals takes no filter and returns every status (the
      // Govern surface needs the decided history for the track record) - the
      // pending filter below narrows it to the queue. agent_approvals predates
      // workspace tenancy (no workspace_id column), so this stays unscoped.
      listGovernApprovals().catch(() => ({
        approvals: [],
        trackByAgent: {},
        outcomeByAgent: {},
        rejectionsByKey: {},
        medianResponseMs: null,
      })),
      listDecisions({ data: { status: "pending", workspaceId: wsId ?? undefined } }).catch(() => ({
        decisions: [],
      })),
      // Direct RLS-wide read, not the workspace-scoped list function: the
      // queue is the single pull point (law 4.4), so a pending candidate in
      // ANY of the caller's workspaces must surface here, unless scoped.
      (() => {
        let q = context.supabase
          .from("memory_candidates")
          .select("id, content, status, importance, source_kind, created_at")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(100);
        if (wsId) q = q.eq("workspace_id", wsId);
        return q.then(({ data: rows }) => ({
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
        }));
      })().catch(() => ({ items: [] })),
      listHouseRules({ data: { workspaceId: wsId } }).catch(() => ({ rules: [] })),
      listTrustGraduationProposals().catch(
        () => [] as Awaited<ReturnType<typeof listTrustGraduationProposals>>,
      ),
      // Specs in review (mirrors today.functions.ts getNeedsYou's prdCalls read).
      (() => {
        let q = supabase
          .from("prds")
          .select("id,title,status,critic_review,updated_at,project_id")
          .eq("status", "review")
          .order("updated_at", { ascending: false })
          .limit(100);
        if (wsId) q = q.eq("workspace_id", wsId);
        return q;
      })(),
      // Opportunities the Critic said revise/kill on, still in backlog
      // (mirrors today.functions.ts getNeedsYou's oppCalls read).
      (() => {
        let q = supabase
          .from("opportunities")
          .select("id,title,critic_review,created_at,project_id")
          .filter("critic_review->>verdict", "in", '("revise","kill")')
          .eq("status", "backlog")
          .order("created_at", { ascending: false })
          .limit(100);
        if (wsId) q = q.eq("workspace_id", wsId);
        return q;
      })(),
      // Open assumption-supersession challenges (mirrors getNeedsYou's
      // assumptionCalls read).
      (() => {
        let q = supabase
          .from("assumption_challenges")
          .select("id,assumption_id,signal_id,learning_id,rationale,created_at")
          .eq("status", "open")
          .order("created_at", { ascending: false })
          .limit(100);
        if (wsId) q = q.eq("workspace_id", wsId);
        return q;
      })(),
      // Proposed playbooks from the compounding pass (mirrors getNeedsYou's
      // playbookCalls read). playbook_proposals postdates the generated
      // types, so the client is structurally cast (the house idiom).
      (() => {
        let q = (supabase as unknown as SupabaseClient)
          .from("playbook_proposals")
          .select("id,title,body,created_at,source_learning_ids")
          .eq("status", "proposed")
          .order("created_at", { ascending: false })
          .limit(100);
        if (wsId) q = q.eq("workspace_id", wsId);
        return q;
      })(),
      // Which workspaces have the design stage on - the design-gate family
      // only exists there (mirrors getNeedsYou's own designStageEnabled
      // lookup, generalized across every workspace the caller can read).
      (() => {
        let q = supabase
          .from("workspaces")
          .select("id,design_stage_enabled")
          .eq("design_stage_enabled", true);
        if (wsId) q = q.eq("id", wsId);
        return q;
      })(),
    ]);

    // Design gates: specs with an undecided design_gate_status, scoped to the
    // workspaces just resolved to have the design stage on. A dependent read
    // (the workspace ids aren't known until designWsRows lands above).
    const designWsIds = ((designWsRows.data ?? []) as { id: string }[]).map((w) => w.id);
    const designGateRes = designWsIds.length
      ? await supabase
          .from("prds")
          .select("id,title,updated_at,project_id")
          .in("workspace_id", designWsIds)
          .is("design_gate_status", null)
          .order("updated_at", { ascending: false })
          .limit(100)
      : {
          data: [] as {
            id: string;
            title: string;
            updated_at: string;
            project_id: string | null;
          }[],
        };

    // Project resolution, one batched pass for every family that carries a
    // project_id (specs, opportunities, design gates directly; decisions only
    // indirectly via their prd_id -> prds.project_id).
    const pendingDecisions = (decisionsRes.decisions ?? []).filter((d) => d.status === "pending");
    const decisionPrdIds = [
      ...new Set(pendingDecisions.map((d) => d.prd_id).filter((x): x is string => !!x)),
    ];
    const projectIdByPrd = new Map<string, string>();
    if (decisionPrdIds.length) {
      const { data: prds } = await supabase
        .from("prds")
        .select("id,project_id")
        .in("id", decisionPrdIds);
      for (const p of (prds ?? []) as { id: string; project_id: string | null }[]) {
        if (p.project_id) projectIdByPrd.set(p.id, p.project_id);
      }
    }
    const specRowsData = (specRows.data ?? []) as {
      id: string;
      title: string;
      status: string;
      critic_review: unknown;
      updated_at: string;
      project_id: string | null;
    }[];
    const oppRowsData = (oppRows.data ?? []) as {
      id: string;
      title: string;
      critic_review: unknown;
      created_at: string;
      project_id: string | null;
    }[];
    const designGateRows = (designGateRes.data ?? []) as {
      id: string;
      title: string;
      updated_at: string;
      project_id: string | null;
    }[];
    const allProjectIds = new Set<string>([
      ...projectIdByPrd.values(),
      ...specRowsData.map((s) => s.project_id).filter((x): x is string => !!x),
      ...oppRowsData.map((o) => o.project_id).filter((x): x is string => !!x),
      ...designGateRows.map((p) => p.project_id).filter((x): x is string => !!x),
    ]);
    const projectNameById = new Map<string, string>();
    if (allProjectIds.size) {
      const { data: projects } = await supabase
        .from("projects")
        .select("id,name")
        .in("id", [...allProjectIds]);
      for (const p of (projects ?? []) as { id: string; name: string | null }[]) {
        projectNameById.set(p.id, p.name ?? "Untitled");
      }
    }
    const projectByPrd = new Map<string, { id: string; name: string }>();
    for (const [prdId, projId] of projectIdByPrd) {
      if (projectNameById.has(projId)) {
        projectByPrd.set(prdId, { id: projId, name: projectNameById.get(projId)! });
      }
    }
    const projectOf = (projectId: string | null): { id: string | null; name: string | null } =>
      projectId && projectNameById.has(projectId)
        ? { id: projectId, name: projectNameById.get(projectId)! }
        : { id: null, name: null };

    const items: ApprovalQueueItem[] = [];
    // Real agent slug per tool-call gate, so the final map can attribute it.
    const agentSlugBySource = new Map<string, string>();

    // --- Tool-call confirm/review gates ------------------------------------
    for (const a of govern.approvals.filter((a) => a.status === "pending")) {
      if (a.agent_slug) agentSlugBySource.set(a.id, a.agent_slug);
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
        title: cleanTitle(d.title),
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
        // Where it came from, in the words the memory surface already uses.
        // The raw `source_kind` and the 1-5 importance are ranking inputs the
        // decay sweep reads, not something a person weighs before approving.
        impact: sourceLabel(c.source_kind),
        approveConsequence: "Approve · it guides the next call",
        rejectConsequence: "Reject · nothing changes",
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

    // --- Specs in review (worth building?) ----------------------------------
    for (const p of specRowsData) {
      const cr = parseCriticReview(p.critic_review);
      const proj = projectOf(p.project_id);
      items.push({
        id: `spec:${p.id}`,
        kindKey: "spec",
        sourceId: p.id,
        filterBucket: "proposals",
        kind: "SPEC",
        kindTone: "human",
        project: proj.name ?? undefined,
        title: p.title,
        evidence: [criticEvidenceLine(cr)],
        impact: "spec in review",
        approveConsequence: "Approve · the spec is approved and becomes precedent",
        rejectConsequence: "Reject · sends it back to draft",
        timestamp: p.updated_at,
        projectId: proj.id,
        projectName: proj.name,
      });
    }

    // --- Opportunities the Critic flagged (worth building?) -----------------
    for (const o of oppRowsData) {
      const cr = parseCriticReview(o.critic_review);
      const proj = projectOf(o.project_id);
      items.push({
        id: `opportunity:${o.id}`,
        kindKey: "opportunity",
        sourceId: o.id,
        filterBucket: "proposals",
        kind: "PROPOSAL",
        kindTone: "human",
        project: proj.name ?? undefined,
        title: o.title,
        evidence: [criticEvidenceLine(cr)],
        impact: cr?.verdict ? `Critic said ${cr.verdict}` : undefined,
        approveConsequence: "Approve · keeps it and moves it to Now on the roadmap",
        rejectConsequence: "Reject · drops it from the backlog",
        timestamp: o.created_at,
        projectId: proj.id,
        projectName: proj.name,
      });
    }

    // --- Open assumption-supersession challenges (worth re-examining?) ------
    if (challengeRows.data && challengeRows.data.length > 0) {
      const rows = challengeRows.data as {
        id: string;
        assumption_id: string;
        signal_id: string | null;
        learning_id: string | null;
        rationale: string;
        created_at: string;
      }[];
      const assumptionIds = [...new Set(rows.map((c) => c.assumption_id))];
      const { data: assumptionRows } = await supabase
        .from("assumptions")
        .select("id,statement,decision_id,prd_id")
        .in("id", assumptionIds);
      const assumptionById = new Map(
        (
          (assumptionRows ?? []) as {
            id: string;
            statement: string;
            decision_id: string | null;
            prd_id: string | null;
          }[]
        ).map((a) => [a.id, a]),
      );
      const decisionIds = [
        ...new Set(
          [...assumptionById.values()].map((a) => a.decision_id).filter((x): x is string => !!x),
        ),
      ];
      const prdIds = [
        ...new Set(
          [...assumptionById.values()].map((a) => a.prd_id).filter((x): x is string => !!x),
        ),
      ];
      const [decisionRows, prdRows] = await Promise.all([
        decisionIds.length
          ? supabase.from("decisions").select("id,title").in("id", decisionIds)
          : Promise.resolve({ data: [] as { id: string; title: string }[] }),
        prdIds.length
          ? supabase.from("prds").select("id,title").in("id", prdIds)
          : Promise.resolve({ data: [] as { id: string; title: string }[] }),
      ]);
      const decisionTitleById = new Map(
        ((decisionRows.data ?? []) as { id: string; title: string }[]).map((d) => [d.id, d.title]),
      );
      const prdTitleById = new Map(
        ((prdRows.data ?? []) as { id: string; title: string }[]).map((p) => [p.id, p.title]),
      );

      for (const c of rows) {
        const assumption = assumptionById.get(c.assumption_id);
        if (!assumption) continue;
        const decisionTitle = assumption.decision_id
          ? (decisionTitleById.get(assumption.decision_id) ?? "A past decision")
          : assumption.prd_id
            ? `Spec: ${prdTitleById.get(assumption.prd_id) ?? "a spec"}`
            : "A past decision";
        items.push({
          id: `assumption_challenge:${c.id}`,
          kindKey: "assumption_challenge",
          sourceId: c.id,
          filterBucket: "gates",
          kind: "CHALLENGE",
          kindTone: "human",
          title: decisionTitle,
          evidence: [`${assumption.statement}. ${c.rationale}`],
          impact: undefined,
          approveConsequence: "Approve · reopens the decision for review",
          rejectConsequence: "Reject · keeps it standing as decided",
          timestamp: c.created_at,
          projectId: null,
          projectName: null,
        });
      }
    }

    // --- Design gates (design ready?) ---------------------------------------
    for (const p of designGateRows) {
      const proj = projectOf(p.project_id);
      items.push({
        id: `design_gate:${p.id}`,
        kindKey: "design_gate",
        sourceId: p.id,
        filterBucket: "proposals",
        kind: "DESIGN",
        kindTone: "human",
        project: proj.name ?? undefined,
        title: p.title,
        evidence: [
          "The generated mockup is waiting on your call before this spec can dispatch to Build.",
        ],
        impact: undefined,
        approveConsequence: "Approve · unblocks Build for this spec",
        rejectConsequence: "Reject · keeps the gate closed",
        timestamp: p.updated_at,
        projectId: proj.id,
        projectName: proj.name,
      });
    }

    // --- Playbook proposals (make it a method?) ------------------------------
    if (playbookRows.data && playbookRows.data.length > 0) {
      for (const p of playbookRows.data as {
        id: string;
        title: string;
        body: string;
        created_at: string;
        source_learning_ids: string[] | null;
      }[]) {
        const sourceCount = p.source_learning_ids?.length ?? 0;
        const evidence: string[] = [p.body.length > 200 ? `${p.body.slice(0, 200)}…` : p.body];
        if (sourceCount > 0) evidence.push(`${sourceCount} same-shaped learnings behind this`);
        items.push({
          id: `playbook_proposal:${p.id}`,
          kindKey: "playbook_proposal",
          sourceId: p.id,
          filterBucket: "proposals",
          kind: "PLAYBOOK",
          kindTone: "neutral",
          title: p.title,
          evidence,
          impact: undefined,
          approveConsequence: "Approve · adopts the method on the record",
          rejectConsequence: "Reject · retires this proposal for good",
          timestamp: p.created_at,
          projectId: null,
          projectName: null,
        });
      }
    }

    // Gate snoozes (front-end reimagining Phase 4; founder-authorized
    // 2026-07-19): drop items the operator deferred with H until snoozed_until.
    // RLS scopes the read to this user.
    //
    // 2026-08-06: the table HAS landed (supabase/migrations/
    // 20260720000000_mc_approval_snoozes.sql) and carries live rows, so the
    // "un-applied migration" this comment used to describe is history. The
    // error is still discarded, deliberately, and here is exactly what that
    // now costs: if the read fails, `snoozed` is empty and every snoozed gate
    // reappears. That is the only direction this particular read may fail in -
    // this queue is the single pull point, so re-showing a deferred gate is a
    // nuisance while hiding one that needs you is a broken promise. Absence
    // here is never read as "nothing needs you", only as "defer nothing".
    const snoozeDb = supabase as unknown as SupabaseClient;
    const { data: snoozeRows } = await snoozeDb
      .from("approval_snoozes")
      .select("kind,source_id")
      .gt("snoozed_until", new Date().toISOString());
    const snoozed = new Set(
      ((snoozeRows ?? []) as { kind: string; source_id: string }[]).map(
        (r) => `${r.kind}:${r.source_id}`,
      ),
    );
    const visible = snoozed.size
      ? items.filter((it) => !snoozed.has(`${it.kindKey}:${it.sourceId}`))
      : items;

    visible.sort((a, b) => (b.timestamp ?? "").localeCompare(a.timestamp ?? ""));
    return {
      items: visible.map((it) => ({
        ...it,
        agentSlug: approvalAgentSlug(it.kindKey, agentSlugBySource.get(it.sourceId) ?? null),
      })),
    };
  });

// ---------------------------------------------------------------------------
// WHAT A STATUS WRITE MEANS FOR A SPEC, STATE BY STATE (2026-08-06).
//
// Two verbs in this module write prds.status for kind "spec": decline (via
// decideApprovalItem -> "draft"), and send back (via sendBackApprovalItem ->
// "draft", with a note). Neither looked at the spec first. The id is whatever
// the caller posts - these are POST server functions, not a closed loop over
// the queue's own items - so a shipped spec's id moved a shipped bet to
// "draft", and NOTHING in the product writes "shipped" back: every writer of
// that value is a ship-time path guarded by `shipped_at IS NULL`. The record
// of a bet that genuinely went out, gone on one keystroke.
//
//   draft     Already the revisable state. There is nothing to send back.
//   review    The gate this queue actually lists (the spec source filters on
//             status = 'review'). Moving backward is the entire point.
//   approved  Signed off, not shipped. Backward un-dispatches it and REMOVES
//             nothing: the "Spec approved" decisions row stays, the stage-event
//             trail records approved -> draft, and re-approving later is
//             idempotent on prd_id (discovery.functions.ts savePrd). Allowed.
//   shipped   Refused. Live today: 41 specs read 'approved' and SEVEN of them
//             carry a non-null shipped_at, so status alone is not a safe test -
//             `shipped_at` is the fact and it is what this checks.
//
// The forward write is checked for the one case that is a backward write in
// disguise: approving a spec that has already shipped. savePrd sees
// `prior.status !== 'approved'`, treats it as a FIRST approval, files a
// Decisions entry and stamps a stage event leaving 'shipped'
// (discovery.functions.ts:2055,2112) - so "Approve" on a shipped spec is how
// those seven rows got that way. This closes that route through the queue; the
// button that opens it lives on the spec page and is NOT fixed here (see the
// note on sendBackApprovalItem).
// ---------------------------------------------------------------------------

type SpecState = { status: string | null; shippedAt: string | null };

/** The spec's live state, or a refusal. Never "absent, therefore fine". */
async function readSpecState(db: SupabaseClient, prdId: string): Promise<SpecState> {
  const { data: row, error } = await db
    .from("prds")
    .select("status,shipped_at")
    .eq("id", prdId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  // A null row is the REFUSAL case, not evidence the spec does not exist: an
  // RLS refusal and a deleted row are indistinguishable from here, and neither
  // one is permission to write. Refusing on both is the only honest read.
  if (!row) {
    throw new Error("Couldn't read that spec, so nothing was changed. It may not be yours.");
  }
  const r = row as { status: string | null; shipped_at: string | null };
  return { status: r.status, shippedAt: r.shipped_at };
}

/** Shipped is a fact on the record, and `shipped_at` is where that fact lives. */
function hasShipped(state: SpecState): boolean {
  return state.status === "shipped" || !!state.shippedAt;
}

/** Every door named here exists: Ship draws "Roll back" on each live release
 *  row, Learn's outcome desk keys off `shipped_at` (not status, so a shipped
 *  bet is still judgeable), and Decide's "Where it sits" moves any bet. */
const SHIPPED_STATUS_REFUSAL =
  "This spec has already shipped, so its status can't be rewritten from here - " +
  "that would drop the record of a bet that really went out. To take the release " +
  "back, use Roll back on the release in Ship. To put the bet itself on the record " +
  "as wrong, give it a verdict in Learn or move it in Decide.";

/** Refuses a spec status write that would contradict a record already on the
 *  books. `to` is the status about to be written. Returns nothing: it either
 *  permits the caller to proceed or throws with the reason. */
async function assertSpecStatusWrite(
  db: SupabaseClient,
  prdId: string,
  to: "approved" | "draft",
): Promise<void> {
  const state = await readSpecState(db, prdId);
  if (hasShipped(state)) throw new Error(SHIPPED_STATUS_REFUSAL);
  if (to === "draft" && state.status === "draft") {
    throw new Error("This spec is already a draft, so there is nothing to send back.");
  }
}

const DecideSchema = z.object({
  id: z.string().min(1),
  kind: z.enum([
    "tool_call",
    "decision",
    "memory_candidate",
    "house_rule",
    "trust_graduation",
    "spec",
    "opportunity",
    "assumption_challenge",
    "design_gate",
    "playbook_proposal",
  ]),
  verdict: z.enum(["approve", "reject"]),
});

export type DecideApprovalItemResult = { ok: boolean };

/** One decide entry point for every gate kind, routing to the existing
 *  resolver for that gate (never a new write path). */
export const decideApprovalItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof DecideSchema>) => DecideSchema.parse(d))
  .handler(async ({ context, data }): Promise<DecideApprovalItemResult> => {
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
      case "spec": {
        // The queue only ever lists specs at status 'review', so this guard is
        // silent on every item the tray can show. It exists because the id is
        // posted, not carried: see the state-by-state note above DecideSchema.
        const to = data.verdict === "approve" ? "approved" : "draft";
        await assertSpecStatusWrite(context.supabase as unknown as SupabaseClient, data.id, to);
        await savePrd({ data: { id: data.id, status: to } });
        return { ok: true };
      }
      case "opportunity": {
        await updateOpportunity({
          data: { id: data.id, status: data.verdict === "approve" ? "now" : "dropped" },
        });
        return { ok: true };
      }
      case "assumption_challenge": {
        await resolveAssumptionChallenge({
          data: { id: data.id, action: data.verdict === "approve" ? "confirm" : "dismiss" },
        });
        return { ok: true };
      }
      case "design_gate": {
        await decideDesignGate({
          data: { prdId: data.id, decision: data.verdict === "approve" ? "approve" : "reject" },
        });
        return { ok: true };
      }
      case "playbook_proposal": {
        await decidePlaybookProposal({
          data: {
            proposalId: data.id,
            decision: data.verdict === "approve" ? "confirm" : "dismiss",
          },
        });
        return { ok: true };
      }
      default:
        throw new Error(`decideApprovalItem: unknown kind ${String(data.kind)}`);
    }
  });

const SnoozeSchema = z.object({
  id: z.string().min(1),
  kind: z.enum([
    "tool_call",
    "decision",
    "memory_candidate",
    "house_rule",
    "trust_graduation",
    "spec",
    "opportunity",
    "assumption_challenge",
    "design_gate",
    "playbook_proposal",
  ]),
  /** Defer window in hours; default one day ("resurfaces with tomorrow's briefing"). */
  hours: z
    .number()
    .int()
    .min(1)
    .max(24 * 30)
    .optional(),
  reason: z.string().max(500).optional(),
});

export type SnoozeApprovalItemResult = { ok: boolean; snoozedUntil: string };

/**
 * Snooze a gate (the tray's H verb). Defers ANY federated family by
 * (kind, source_id) without touching its source table: a personal triage
 * record in approval_snoozes that getApprovalsQueue filters on until it lapses.
 *
 * Founder-authorized 2026-07-19. 2026-08-06: the table HAS landed
 * (supabase/migrations/20260720000000_mc_approval_snoozes.sql) and carries live
 * rows, so the pre-merge caveat this comment used to make is spent - a failure
 * here is now a real failure and is surfaced as one. The UI has NOT caught up:
 * MissionShell's snoozeMutation.onError still toasts "Snooze is not live yet.
 * It turns on with the next release." over what is now a genuine error. That
 * copy is in src/components/mission/MissionShell.tsx and is not fixed here.
 */
export const snoozeApprovalItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof SnoozeSchema>) => SnoozeSchema.parse(d))
  .handler(async ({ context, data }): Promise<SnoozeApprovalItemResult> => {
    const db = context.supabase as unknown as SupabaseClient;
    const hours = data.hours ?? 24;
    const snoozedUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    // NO ROWS BACK MEANT NO EVIDENCE. Without `.select()` PostgREST returns
    // nothing and supabase-js resolves with `data: null` whether one row landed
    // or none did, so the tray's "Snoozed. It will resurface with tomorrow's
    // briefing." was drawn on a resolved promise rather than on a written row.
    // The returned id is the evidence; an empty set is the refusal case.
    const { data: rows, error } = await db
      .from("approval_snoozes")
      .upsert(
        {
          user_id: context.userId,
          kind: data.kind,
          source_id: data.id,
          snoozed_until: snoozedUntil,
          reason: data.reason ?? null,
        },
        { onConflict: "user_id,kind,source_id" },
      )
      .select("id");
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) {
      throw new Error("The snooze was not recorded, so this gate is still in your queue.");
    }
    return { ok: true, snoozedUntil };
  });

/** The gate families that can be SENT BACK (returned to a revisable state with
 *  a note), as opposed to only approved/declined. A spec that has not shipped
 *  returns to draft; a design gate returns for revision. Every other family is
 *  a binary gate.
 *
 *  KIND, NOT INSTANCE. This answers "can this family be sent back at all",
 *  which is what the tray needs to draw the verb. Whether a PARTICULAR spec may
 *  move is a second question answered per state by assertSpecStatusWrite: a
 *  shipped spec is a revisable KIND whose backward move is refused. */
export const REVISABLE_KINDS: readonly ApprovalKind[] = ["spec", "design_gate"];

export function isRevisableKind(kind: ApprovalKind): boolean {
  return REVISABLE_KINDS.includes(kind);
}

const SendBackSchema = z.object({
  id: z.string().min(1),
  kind: z.enum([
    "tool_call",
    "decision",
    "memory_candidate",
    "house_rule",
    "trust_graduation",
    "spec",
    "opportunity",
    "assumption_challenge",
    "design_gate",
    "playbook_proposal",
  ]),
  /** The operator's revision guidance. Required: a note-less send-back is a decline. */
  note: z.string().min(1).max(2000),
});

export type SendBackApprovalItemResult = { ok: boolean };

/**
 * Send a revisable gate back with a note (the tray's verb 2). The spec's live
 * state is checked FIRST, then the note is persisted (approval_feedback), then
 * the gate is returned to its revisable state via the SAME resolvers the decide
 * path uses: a spec to draft, a design gate to reject-for-revision, so the
 * agent continues the same thread knowing what to fix. Non-revisable families
 * are refused (decline them instead).
 *
 * Founder-authorized 2026-07-19. 2026-08-06: the approval_feedback table HAS
 * landed (supabase/migrations/20260720010000_mc_approval_feedback.sql), so the
 * pre-merge caveat this comment used to make is spent - and MissionShell's
 * sendBackMutation.onError toast, "Send back turns on with the next release.",
 * now hides real errors including this function's own refusals. That copy lives
 * in src/components/mission/MissionShell.tsx and is NOT fixed here.
 *
 * WHICH SPECS CAN REACH THIS AND WHICH CANNOT (the honest half of the fix).
 * The state rules above DecideSchema now let an APPROVED, unshipped spec be
 * sent back, and refuse a shipped one. That is the server half only: the queue
 * still sources specs with `.eq("status","review")` (one spec live today), so
 * no surface offers this verb on the 34 approved-and-unshipped specs. Widening
 * that source is the wrong fix - an approved spec is not a pending approval,
 * and listing 41 of them would inflate the one count three surfaces badge. The
 * door belongs on the spec's own page, next to Approve, in
 * src/routes/_authenticated.plan.spec.$id.tsx. This function is ready for it.
 */
export const sendBackApprovalItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof SendBackSchema>) => SendBackSchema.parse(d))
  .handler(async ({ context, data }): Promise<SendBackApprovalItemResult> => {
    if (!isRevisableKind(data.kind)) {
      throw new Error("This kind can't be sent back. Decline it instead.");
    }
    const db = context.supabase as unknown as SupabaseClient;

    // 1) STATE FIRST, before a single row is written. A send-back the spec's
    //    own state forbids must leave no trace at all - not even a note that
    //    reads, later, as guidance somebody acted on. Specs only: a design-gate
    //    send-back writes prds.design_gate_status via decideDesignGate and
    //    never touches prds.status, so it cannot contradict a shipped record.
    if (data.kind === "spec") {
      await assertSpecStatusWrite(db, data.id, "draft");
    }

    // 2) Capture the note. Same rule as the snooze write: `.select("id")` so
    //    the row that comes back is the evidence the note landed, and an empty
    //    set is treated as the refusal it is. A send-back whose note vanished
    //    is a decline wearing guidance's clothes.
    const { data: noteRows, error: fbErr } = await db
      .from("approval_feedback")
      .insert({
        user_id: context.userId,
        kind: data.kind,
        source_id: data.id,
        note: data.note,
      })
      .select("id");
    if (fbErr) throw new Error(fbErr.message);
    if (!noteRows || noteRows.length === 0) {
      throw new Error("Your note was not recorded, so nothing was sent back.");
    }

    // 3) Return the gate to its revisable state via the existing resolvers.
    //    PARTIAL-FAILURE HONESTY: these are two writes, not a transaction. If
    //    the resolver below throws, the note from step 2 stays behind. That is
    //    the safe residue - a record of what you asked for, on a gate the
    //    caller was just told did not move - and it is not cleaned up here,
    //    because a compensating delete can fail in exactly the same way.
    if (data.kind === "spec") {
      await savePrd({ data: { id: data.id, status: "draft" } });
    } else {
      await decideDesignGate({ data: { prdId: data.id, decision: "reject" } });
    }
    return { ok: true };
  });
