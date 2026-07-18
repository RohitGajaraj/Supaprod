import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { CommandBar, VerdictChip } from "@/components/ink";
import { createProject } from "@/lib/projects.functions";
import {
  getApprovalsQueue,
  decideApprovalItem,
  type ApprovalQueueItem,
} from "@/lib/approvals-queue.functions";

/**
 * The two pieces rescued from the archived rebuild (founder ruling, 2026-07-18),
 * living inside Today per the old IA's contract law (doors inside destinations,
 * never new rail items):
 * 1. A sentence box that actually does something: typing an idea creates a
 *    real project and confirms it.
 * 2. The one door to the federated Approvals queue, with its live count.
 * Self-contained on purpose: one import + one JSX line inside Today, so the
 * screen the founder likes stays untouched around it.
 */

/** First few meaningful words of the sentence, title-cased, as the name. */
function nameFromIntent(intent: string): string {
  const stop = new Set([
    "a",
    "an",
    "the",
    "for",
    "to",
    "of",
    "and",
    "my",
    "our",
    "with",
    "that",
    "build",
    "make",
    "create",
    "design",
    "plan",
    "write",
    "add",
    "ship",
  ]);
  const words = intent
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .split(/\s+/)
    .filter((w) => w && !stop.has(w.toLowerCase()));
  const picked = (words.length ? words : intent.split(/\s+/)).slice(0, 3);
  const name = picked
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ")
    .slice(0, 60);
  return name || "New project";
}

/** How many queue items render inline on Today before folding into the door. */
const PREVIEW_COUNT = 3;

export function TodayCommandBlock() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const doCreateProject = useServerFn(createProject);
  const fetchQueue = useServerFn(getApprovalsQueue);
  const doDecide = useServerFn(decideApprovalItem);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const queue = useQuery({
    queryKey: ["approvals", "queue"],
    queryFn: () => fetchQueue(),
    refetchInterval: 30_000,
    retry: 2,
  });
  const items: ApprovalQueueItem[] = queue.data?.items ?? [];
  const count = items.length;

  const decide = useMutation({
    mutationFn: (v: { item: ApprovalQueueItem; verdict: "approve" | "reject" }) =>
      doDecide({ data: { id: v.item.sourceId, kind: v.item.kindKey, verdict: v.verdict } }),
    onMutate: (v) => setDecidingId(v.item.id),
    onSuccess: (_res, v) => {
      toast.success(v.verdict === "approve" ? "Approved." : "Rejected. Noted for next time.");
      for (const key of [["approvals", "queue"], ["needs-you"], ["today-lanes"]]) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "That did not go through."),
    onSettled: () => setDecidingId(null),
  });

  const create = useMutation({
    mutationFn: (intent: string) =>
      doCreateProject({ data: { name: nameFromIntent(intent), status: "active" as const } }),
    onSuccess: async (created: { project?: { id: string; name?: string | null } }) => {
      const name = created.project?.name ?? "Your project";
      toast.success(`${name} created. The plan starts from your sentence.`);
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Could not start the project. Try again."),
  });

  const preview = items.slice(0, PREVIEW_COUNT);
  const more = count - preview.length;

  return (
    <section aria-label="Start something" className="mb-5 space-y-3">
      <CommandBar
        variant="rail"
        placeholder="What are we building? A sentence starts a project."
        onSubmit={(intent) => create.mutateAsync(intent).then(() => undefined)}
      />

      {/* The approvals, visible right here (founder ask 2026-07-18): the
          queue's top items with working decisions, then the door for the rest. */}
      {queue.isLoading ? (
        <div className="ink-skeleton h-10 w-full" aria-hidden />
      ) : preview.length > 0 ? (
        <ul aria-label="Waiting on you" className="space-y-1.5">
          {preview.map((item) => (
            <li
              key={item.id}
              className="ink-panel flex items-center gap-3 px-3 py-2"
            >
              <VerdictChip tone={item.kindTone ?? "human"}>{item.kind}</VerdictChip>
              <button
                type="button"
                onClick={() => void navigate({ to: "/approvals" })}
                title={item.title}
                className="ink-focus min-w-0 flex-1 truncate rounded-sm text-left text-[13px] text-[var(--ink-text)] hover:underline hover:underline-offset-4"
              >
                {item.title}
              </button>
              <button
                type="button"
                disabled={decidingId !== null}
                onClick={() => decide.mutate({ item, verdict: "approve" })}
                className="ink-focus shrink-0 rounded-md bg-[var(--voice-human)] px-2.5 py-1 text-[12px] font-medium text-white transition-colors hover:bg-[var(--voice-human-hover)] disabled:opacity-60"
              >
                {decidingId === item.id ? "Working" : "Approve"}
              </button>
              <button
                type="button"
                disabled={decidingId !== null}
                onClick={() => decide.mutate({ item, verdict: "reject" })}
                className="ink-focus shrink-0 rounded-md border border-[var(--ink-hairline)] px-2.5 py-1 text-[12px] font-medium text-[var(--ink-body)] transition-colors hover:border-[var(--ink-subtle)] hover:text-[var(--ink-text)] disabled:opacity-60"
              >
                Reject
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        onClick={() => void navigate({ to: "/approvals" })}
        className="ink-focus ink-mono rounded-sm px-1 text-[11px] text-[var(--ink-subtle)] transition-colors hover:text-[var(--ink-text)]"
      >
        {count > 0
          ? more > 0
            ? `${more} more in the queue. Open all approvals`
            : "Open the full approvals queue"
          : "Nothing waiting on you. Open the approvals queue"}
      </button>
    </section>
  );
}
