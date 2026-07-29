/**
 * Approvals. The single pull point, ported onto the rebuild primitives (step 4).
 *
 * THE DESIGN CALL MADE HERE. Today shows ONE gate, because a brief asks for one
 * decision. Approvals is the whole queue, and the retired version rendered every
 * item as an identical full card with its own approve and reject buttons: ten
 * primary actions on one screen, which is the opposite of "one primary CTA per
 * screen" and gives you nothing to look at first.
 *
 * So the queue reads as ONE gate plus a list. The item holding focus renders as
 * the full Gate, the biggest thing on the surface; the rest are attribution
 * rows. j and k walk the list, which moves which item is the gate. That matches
 * how the queue is actually worked, one call at a time in order, and it means
 * the screen always has exactly one thing asking for a decision.
 *
 * Every behaviour of the retired version is kept: the optimistic decide with
 * rollback, the a/r keys, the workspace-scoped query key shared with the rail
 * badge, the unscoped "N more in other workspaces" read, the per-kind toasts,
 * and the live-activity receipt line on an empty queue.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import {
  getApprovalsQueue,
  decideApprovalItem,
  type ApprovalFilter,
  type ApprovalQueueItem,
} from "@/lib/approvals-queue.functions";
import { getLiveActivity } from "@/lib/agents.functions";
import { toast } from "@/lib/notify";
import { useWorkspace } from "@/hooks/use-workspace";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import {
  AgentMark,
  Block,
  Button,
  Empty,
  Gate,
  Num,
  PageHead,
  Row,
  Surface,
} from "@/components/shell/primitives";

export const Route = createFileRoute("/_authenticated/approvals")({
  component: ApprovalsSurface,
  head: () => ({ meta: [{ title: "Approvals · Supaprod" }] }),
});

const TOAST_APPROVE: Record<ApprovalQueueItem["kindKey"], string> = {
  tool_call: "Approved.",
  decision: "Approved.",
  memory_candidate: "Saved to workspace memory.",
  house_rule: "Approved.",
  trust_graduation: "Approved.",
  spec: "Spec approved. The decision is logged.",
  opportunity: "Kept. It moves to Now on the roadmap.",
  assumption_challenge: "Reopened for review.",
  design_gate: "Design approved. This spec can now dispatch to Build.",
  playbook_proposal: "Playbook adopted.",
};
const TOAST_REJECT = "Rejected. Noted for next time.";

const FILTERS: { id: ApprovalFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "proposals", label: "Proposals" },
  { id: "gates", label: "Gates" },
  { id: "memory", label: "Memory" },
  { id: "spend", label: "Spend" },
];

/** stripAutoPrefix only removes a LEADING "[auto]". Evidence lines carry it
 *  mid-sentence too ("From [auto] Investigate the ..."), so the marker has to
 *  come out wherever it sits: it is provenance for the loop, never copy. */
function stripAuto(text: string): string {
  return text.replace(/\[auto\]\s*/gi, "").trim();
}

function groupByProject(items: ApprovalQueueItem[]) {
  const groups = new Map<string, { name: string; items: ApprovalQueueItem[] }>();
  for (const item of items) {
    const key = item.projectId ?? "__workspace__";
    const name = item.projectName ?? "Workspace";
    if (!groups.has(key)) groups.set(key, { name, items: [] });
    groups.get(key)!.items.push(item);
  }
  return [...groups.values()];
}

function ApprovalsSurface() {
  const qc = useQueryClient();
  const { activeWorkspaceId } = useWorkspace();
  const fetchQueue = useServerFn(getApprovalsQueue);
  const fetchLiveActivity = useServerFn(getLiveActivity);
  const mDecide = useServerFn(decideApprovalItem);

  const [filter, setFilter] = useState<ApprovalFilter>("all");
  const [focusedId, setFocusedId] = useState<string | null>(null);

  // ONE COUNT, ONE SOURCE (2026-07-18): the same query key the rail badge and
  // Today read, scoped to the active workspace, so this page's own count can
  // never disagree with theirs.
  const queue = useQuery({
    queryKey: ["approvals", "queue", activeWorkspaceId],
    queryFn: () => fetchQueue({ data: { workspaceId: activeWorkspaceId ?? undefined } }),
  });
  // Unscoped read, this page only, so the quiet "N more in other workspaces"
  // line can be honest without every other surface paying for it too.
  const allWorkspacesQueue = useQuery({
    queryKey: ["approvals", "queue-unscoped"],
    queryFn: () => fetchQueue({ data: {} }),
    enabled: !!activeWorkspaceId,
  });
  const otherWorkspacesCount = activeWorkspaceId
    ? Math.max(0, (allWorkspacesQueue.data?.items.length ?? 0) - (queue.data?.items.length ?? 0))
    : 0;
  const liveActivity = useQuery({
    queryKey: ["approvals-live-activity"],
    queryFn: () => fetchLiveActivity(),
    enabled: (queue.data?.items.length ?? 0) === 0 && !queue.isLoading,
  });

  const allItems = queue.data?.items ?? [];
  const counts = useMemo(() => {
    const c: Record<ApprovalFilter, number> = {
      all: allItems.length,
      proposals: 0,
      gates: 0,
      memory: 0,
      spend: 0,
    };
    for (const it of allItems) c[it.filterBucket] += 1;
    return c;
  }, [allItems]);

  const visibleItems = useMemo(
    () => (filter === "all" ? allItems : allItems.filter((i) => i.filterBucket === filter)),
    [allItems, filter],
  );

  useEffect(() => {
    if (visibleItems.length === 0) {
      setFocusedId(null);
      return;
    }
    if (!visibleItems.some((i) => i.id === focusedId)) {
      setFocusedId(visibleItems[0].id);
    }
  }, [visibleItems, focusedId]);

  const focused = visibleItems.find((i) => i.id === focusedId) ?? null;
  const rest = visibleItems.filter((i) => i.id !== focusedId);
  const groups = useMemo(() => groupByProject(rest), [rest]);

  const queueKey = ["approvals", "queue", activeWorkspaceId];
  const decide = useMutation({
    mutationFn: (vars: { item: ApprovalQueueItem; verdict: "approve" | "reject" }) =>
      mDecide({
        data: { id: vars.item.sourceId, kind: vars.item.kindKey, verdict: vars.verdict },
      }),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: queueKey });
      const prev = qc.getQueryData<{ items: ApprovalQueueItem[] }>(queueKey);
      qc.setQueryData<{ items: ApprovalQueueItem[] } | undefined>(queueKey, (old) =>
        old ? { items: old.items.filter((i) => i.id !== vars.item.id) } : old,
      );
      return { prev };
    },
    onSuccess: (_res, vars) => {
      toast.success(vars.verdict === "approve" ? TOAST_APPROVE[vars.item.kindKey] : TOAST_REJECT, {
        critical: true,
      });
    },
    onError: (e: Error, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queueKey, ctx.prev);
      toast.error(e.message);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["approvals", "queue"] });
      // The rail badge and Today read the same gates; settle one here and they
      // must not keep claiming it.
      void qc.invalidateQueries({ queryKey: ["shell"] });
      void qc.invalidateQueries({ queryKey: ["today"] });
    },
  });

  // j/k move focus, a/r decide the focused call. Ignored while typing.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (typing || visibleItems.length === 0) return;
      const idx = visibleItems.findIndex((i) => i.id === focusedId);
      if (e.key === "j") {
        e.preventDefault();
        const next = visibleItems[Math.min(visibleItems.length - 1, idx + 1)];
        if (next) setFocusedId(next.id);
      } else if (e.key === "k") {
        e.preventDefault();
        const prev = visibleItems[Math.max(0, idx - 1)];
        if (prev) setFocusedId(prev.id);
      } else if (e.key === "a" || e.key === "r") {
        const current = visibleItems[idx];
        if (current && !decide.isPending) {
          e.preventDefault();
          decide.mutate({ item: current, verdict: e.key === "a" ? "approve" : "reject" });
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visibleItems, focusedId, decide]);

  const activity = liveActivity.data;
  const receiptLine =
    activity?.state === "working"
      ? "The crew is working. The next call comes to you here."
      : activity?.state === "waiting"
        ? "One just came in. Refresh to see it."
        : null;

  const n = allItems.length;
  const headline = queue.isLoading
    ? "Reading the queue."
    : n === 0
      ? "Nothing needs you."
      : n === 1
        ? "One call needs you."
        : `${n} calls need you.`;

  return (
    <Surface
      context={
        focused ? (
          <>
            <div className="sp-ctx-head">Where this call came from</div>
            <div className="sp-ctx-row">
              <AgentMark slug={focused.agentSlug} state="gate" />
              <span>
                <span className="sp-ctx-name">{agentDisplayName(focused.agentSlug)}</span>
                <span className="sp-ctx-sub">
                  {focused.projectName ?? focused.project ?? "This workspace"}
                </span>
              </span>
            </div>
            {focused.impact ? (
              <>
                <div className="sp-ctx-head">What it costs</div>
                <div className="sp-ctx-body">{focused.impact}</div>
              </>
            ) : null}
            <div className="sp-ctx-head">Moving through</div>
            <div className="sp-ctx-body">
              <Num>j</Num> and <Num>k</Num> walk the queue. <Num>a</Num> approves the one in front
              of you, <Num>r</Num> declines it.
            </div>
          </>
        ) : null
      }
    >
      <PageHead
        title={headline}
        sub={n > 0 ? "Settled in order. The one in front of you is the one that moves." : undefined}
      />

      {allItems.length > 0 ? (
        <div className="sp-tabs" role="tablist" aria-label="Filter the queue">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              className="sp-tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
              {counts[f.id] > 0 ? <span className="sp-tab-count">{counts[f.id]}</span> : null}
            </button>
          ))}
        </div>
      ) : null}

      {queue.isLoading ? null : queue.isError ? (
        <Gate question="The queue did not load.">
          <Button variant="primary" onClick={() => void queue.refetch()}>
            Try again
          </Button>
        </Gate>
      ) : focused ? (
        <Gate
          // Provenance, not copy: the "[auto]" prefix marks a call the loop
          // raised itself and must never reach the sentence being judged.
          question={stripAuto(focused.title)}
          lines={[
            ...focused.evidence
              .slice(0, 3)
              .map((line, i) => <span key={i}>{stripAuto(line)}</span>),
            <span key="c">{focused.approveConsequence}</span>,
          ]}
        >
          <Button
            variant="primary"
            shortcut="a"
            disabled={decide.isPending}
            onClick={() => decide.mutate({ item: focused, verdict: "approve" })}
          >
            Approve
          </Button>
          <Button
            shortcut="r"
            disabled={decide.isPending}
            onClick={() => decide.mutate({ item: focused, verdict: "reject" })}
          >
            Decline
          </Button>
        </Gate>
      ) : (
        <Gate question={allItems.length === 0 ? "Nothing needs you." : "Nothing in this filter."}>
          {allItems.length === 0 && receiptLine ? (
            <span className="sp-subtitle">{receiptLine}</span>
          ) : null}
        </Gate>
      )}

      {groups.map((group) => (
        <Block key={group.name} title={group.name}>
          {group.items.map((item) => (
            <Row
              key={item.id}
              marks={<AgentMark slug={item.agentSlug} state="quiet" />}
              lead={stripAuto(item.title)}
              sub={item.evidence[0] ? stripAuto(item.evidence[0]) : item.kind}
              onClick={() => setFocusedId(item.id)}
            />
          ))}
        </Block>
      ))}

      {otherWorkspacesCount > 0 ? (
        <Empty>
          <Num>{otherWorkspacesCount}</Num> more waiting in your other workspaces.
        </Empty>
      ) : null}
    </Surface>
  );
}
