import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ApprovalCard } from "@/components/ink";
import { FilterTabs } from "@/components/approvals/FilterTabs";
import {
  getApprovalsQueue,
  decideApprovalItem,
  type ApprovalFilter,
  type ApprovalQueueItem,
} from "@/lib/approvals-queue.functions";
import { getLiveActivity } from "@/lib/agents.functions";
import { toast } from "@/lib/notify";
import { useWorkspace } from "@/hooks/use-workspace";
import { RoomChromeShell } from "@/components/mission/RoomChrome";

/**
 * Surface 3: Approvals. The single pull point (architecture §5): one queue,
 * workspace-wide, grouped by project. One-tap approve/reject, keyboard j/k
 * to move, a/r to decide, a quiet text-tab filter row, and the copy deck's
 * exact empty state + toasts.
 */
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

function ApprovalsSkeleton() {
  return (
    <div className="space-y-3">
      <div className="ink-skeleton h-24 w-full" />
      <div className="ink-skeleton h-24 w-full" />
      <div className="ink-skeleton h-24 w-full" />
    </div>
  );
}

function ApprovalsSurface() {
  const qc = useQueryClient();
  const { activeWorkspaceId } = useWorkspace();
  const fetchQueue = useServerFn(getApprovalsQueue);
  const fetchLiveActivity = useServerFn(getLiveActivity);
  const mDecide = useServerFn(decideApprovalItem);

  const [filter, setFilter] = useState<ApprovalFilter>("all");
  const [focusedId, setFocusedId] = useState<string | null>(null);

  // ONE COUNT, ONE SOURCE (2026-07-18): the same query key the rail badge,
  // the Today hero, and the top-bar pill all read, scoped to the active
  // workspace, so this page's own count can never disagree with theirs.
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
  const groups = useMemo(() => groupByProject(visibleItems), [visibleItems]);

  useEffect(() => {
    if (visibleItems.length === 0) {
      setFocusedId(null);
      return;
    }
    if (!visibleItems.some((i) => i.id === focusedId)) {
      setFocusedId(visibleItems[0].id);
    }
  }, [visibleItems, focusedId]);

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
      toast.success(e.message);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["approvals", "queue"] });
    },
  });

  // Keyboard: j/k move focus, a/r decide the focused card. Ignored while
  // typing anywhere (inputs, textareas, contenteditable).
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
      ? "Agents are working; we will bring you the next decision."
      : activity?.state === "waiting"
        ? "One thing just came in. Refresh to see it."
        : null;

  return (
    <RoomChromeShell activeDoor="approvals">
      <div className="mx-auto w-full max-w-2xl flex-1 px-6 pb-16">
      <header className="flex flex-col gap-4 pb-6 pt-10">
        <div>
          <h1 className="text-[22px] font-medium leading-tight text-[var(--ink-text)]">
            Approvals
          </h1>
          <p className="mt-1 text-[13px] text-[var(--ink-subtle)]">
            Everything that needs you. Nothing that doesn't.
          </p>
        </div>
        {allItems.length > 0 ? (
          <FilterTabs value={filter} onChange={setFilter} counts={counts} />
        ) : null}
      </header>

      {queue.isLoading ? (
        <ApprovalsSkeleton />
      ) : queue.isError ? (
        <div className="ink-panel p-5 text-[13px] text-[var(--ink-subtle)]">
          Could not load the queue.{" "}
          <button
            type="button"
            className="ink-focus rounded-sm text-[var(--ink-text)] underline underline-offset-4"
            onClick={() => queue.refetch()}
          >
            Try again
          </button>
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="ink-panel flex flex-col items-start gap-1.5 p-6">
          <p className="text-[15px] text-[var(--ink-text)]">
            {allItems.length === 0 ? "Nothing needs you." : "Nothing in this filter."}
          </p>
          {allItems.length === 0 && receiptLine ? (
            <p className="ink-mono text-[12px] text-[var(--ink-subtle)]">{receiptLine}</p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.name} aria-label={group.name}>
              <h2 className="ink-kicker mb-2.5">{group.name}</h2>
              <div className="space-y-2.5">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className={
                      item.id === focusedId
                        ? "rounded-[var(--ink-radius-panel)] ring-1 ring-[var(--voice-human-border)]"
                        : undefined
                    }
                  >
                    <ApprovalCard
                      item={item}
                      onApprove={async () => {
                        await decide.mutateAsync({ item, verdict: "approve" });
                      }}
                      onReject={async () => {
                        await decide.mutateAsync({ item, verdict: "reject" });
                      }}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      {otherWorkspacesCount > 0 ? (
        <p className="ink-mono mt-8 text-[12px] text-[var(--ink-faint)]">
          {otherWorkspacesCount} more in other workspaces
        </p>
      ) : null}
      </div>
    </RoomChromeShell>
  );
}
