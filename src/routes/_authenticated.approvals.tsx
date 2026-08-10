/**
 * Approvals. Redesigned, not re-skinned (SURFACE-JUSTIFICATION.md).
 *
 * The prototype does not draw this surface, so it owes the five answers.
 *
 * 1. WHO IS HERE, AND WHY. A product lead who has just been told something is
 *    waiting on them. They came to clear it, not to browse it. They will be
 *    here for two minutes and they want to leave with the queue shorter.
 *
 * 2. THE ONE THING IT EXISTS FOR. To settle calls, in order, with enough
 *    evidence to be confident and no more. Nothing else on this surface earns
 *    its place unless it serves that.
 *
 * 3. KEEP / MOVE / KILL, on what was here before:
 *    KEEP  the queue itself, the filter row, the project grouping, the j/k/a/r
 *          keys, the optimistic decide: this is where the decision is made.
 *    KEEP  the "N more in other workspaces" line. It is the only thing telling
 *          you the number in front of you is not the whole number.
 *    KILL  the per-item full card. Twenty cards, each with its own evidence
 *          block and its own approve and reject pair, is twenty primary
 *          actions and nothing to look at first. It also forced the exact
 *          verbosity the founder named: "Why do we need so bigger things to
 *          display? If a user wants to know, he will click deeper."
 *    KILL  the standalone page header and RoomChromeShell. The app shell
 *          already says where you are.
 *    MOVE  the evidence, the cost and the provenance out of the list and into
 *          the context column, where they describe the ONE call in focus.
 *
 * 4. ONE CLICK AWAY. A list row is one line plus a different second fact (who
 *    raised it, what kind), never wrapping. Its full evidence appears when it
 *    becomes the focused call, which is one keypress or one click.
 *
 * 5. THE MOMENT. Clearing the last one. The queue is worked in order and the
 *    surface always has exactly one thing asking, so the end is visible from
 *    the start rather than being an infinite scroll that never resolves.
 *
 * WHAT THE SHAPE IS. One gate plus a list. The item holding focus renders as
 * the full Gate, the biggest thing on the surface; the rest are one-line rows.
 * j and k move which item is the gate. That matches how the queue is actually
 * worked, one call at a time, and keeps one primary action on screen.
 *
 * Every behaviour is preserved: optimistic decide with rollback, a/r, the
 * workspace-scoped query key shared with the rail badge and Today, the
 * unscoped other-workspaces read, and the live-activity line on an empty queue.
 *
 * THE COMMIT (agents/FINAL-agent-presence.md R10, which named this surface and
 * this line as the defect). Settling a call used to fire a toast saying
 * "Approved." and the card vanished. A toast confirms that your click
 * REGISTERED; a receipt renders what your click CAUSED. An approval that
 * erases itself teaches you that your judgment left no trace, and judgment is
 * the product, so it now leaves a mark at the moment it is made. The per-item
 * approveConsequence is real, per-kind copy that already existed, so the
 * receipt says the true thing rather than a generic confirmation. No arrow is
 * drawn to a receiving agent, because nothing in decideApprovalItem's response
 * tells us who picks the work up: an arrow to nowhere is worse than no arrow.
 */

import { createFileRoute } from "@tanstack/react-router";
import { approvalsQueueKey, APPROVALS_QUEUE_PREFIX, invalidateShellReads } from "@/lib/query-keys";
import { isModalOpen } from "@/lib/overlay";
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
  Loading,
  Num,
  PageHead,
  Receipt,
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
  memory_candidate: "In. It guides the next call.",
  house_rule: "Approved.",
  trust_graduation: "Approved.",
  spec: "Spec approved. It becomes precedent.",
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
  // THE COMMIT (agents/FINAL-agent-presence.md R10). A settled call does not
  // vanish into a toast: it collapses in place into a receipt that stays on
  // the surface for the rest of the session, so your judgment leaves a visible
  // trace at the moment you make it. Session-local on purpose; the durable
  // record is the trust ledger, and duplicating it here would be a second
  // source of the same truth.
  const [receipts, setReceipts] = useState<
    { id: string; verb: string; consequence: string; at: string; failed?: boolean }[]
  >([]);

  // ONE COUNT, ONE SOURCE (2026-07-18): the same query key the rail badge and
  // Today read, scoped to the active workspace, so this page's own count can
  // never disagree with theirs.
  const queue = useQuery({
    queryKey: approvalsQueueKey(activeWorkspaceId),
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

  /* THE OPTIMISTIC UPDATE ON THIS PAGE HAD NEVER WORKED, and it looked correct.
   *
   * This was `["approvals", "queue", activeWorkspaceId]` while the query that
   * actually feeds the list reads `approvalsQueueKey(activeWorkspaceId)`, which
   * is `["approvals-queue", ws]`. Two different keys, so onMutate wrote its
   * filtered list into a cache entry NOTHING reads, and onError rolled back the
   * same phantom. The settled row therefore stayed on screen with live buttons
   * until the refetch landed, which is the very thing the optimistic update was
   * written to prevent.
   *
   * This is the exact defect query-keys.ts was created to close, described in
   * its own header: "Three key families also meant three caches of one number,
   * so invalidating after an approval refreshed some of them and left the others
   * showing a stale count." One hand-built key survived the migration. Use the
   * helper, never a literal, so this cannot drift again. */
  const queueKey = approvalsQueueKey(activeWorkspaceId);
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
      // No toast. The receipt IS the confirmation, and it says what the click
      // CAUSED rather than that it registered.
      setReceipts((r) => [
        {
          id: vars.item.id,
          verb: vars.verdict === "approve" ? "You approved" : "You declined",
          consequence:
            vars.verdict === "approve"
              ? (vars.item.approveConsequence ?? TOAST_APPROVE[vars.item.kindKey])
              : (vars.item.rejectConsequence ?? TOAST_REJECT),
          at: new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
        },
        ...r,
      ]);
    },
    onError: (e: Error, vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queueKey, ctx.prev);
      // A failed write still writes a receipt, and the receipt goes honest
      // immediately. Never a success shape over a failed write: that is the one
      // thing that makes the successful ones trustworthy.
      setReceipts((r) => [
        {
          id: vars.item.id,
          verb: "Nothing was recorded",
          consequence: e.message,
          at: new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
          failed: true,
        },
        ...r,
      ]);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: APPROVALS_QUEUE_PREFIX });
      // The rail badge and Today read the same gates; settle one here and they
      // must not keep claiming it.
      invalidateShellReads(qc);
      void qc.invalidateQueries({ queryKey: ["today"] });
    },
  });

  /* j/k move focus, a/r settle the focused call. Both guards run before any of
   * them, and the order is the whole point.
   *
   * THE DEFECT THIS CLOSES, found 2026-08-05. This was the one gate surface
   * with no modifier guard at all, so every browser and OS chord whose letter
   * happened to be one of ours arrived here as a verdict on the call in focus.
   * `e.key` on a Cmd+R keydown is exactly "r": the modifier lives on a separate
   * field this handler never read. So Cmd+R and Ctrl+R, the reload people press
   * constantly, DECLINED the focused approval on their way out of the page.
   * Cmd+A, select-all, APPROVED it. Cmd+K opened Ask and walked the queue focus
   * underneath the overlay at the same time. decideApprovalItem writes the
   * verdict to the trust ledger and there is no undo, so the cost of one stray
   * reload was a settled call the user never made, attributed to them forever,
   * and a queue one item shorter than they left it.
   *
   * WHY NOTHING CAUGHT IT. The handler was correct TypeScript, it rendered, and
   * every test passed: reading `e.key` without reading `e.metaKey` is not an
   * error, it is an omission, and an omission is invisible in a diff of one
   * file. /today and /decide had both carried this guard for weeks. Only a
   * reader who opened all three at once would see that this one lacked it,
   * which is why the check below is now also asserted in
   * src/routes/__tests__/approvals-keys-stand-down.test.ts.
   *
   * The two lines are copied verbatim from the house pattern in
   * _authenticated.today.tsx rather than reworded, so the three gate surfaces
   * cannot quietly drift apart again.
   *
   * SELECT joins INPUT, TEXTAREA and contenteditable, and it was missing here
   * too. A native <select> keeps focus while it is open and type-ahead jumps to
   * the option whose label starts with the letter you press, so "r" inside one
   * was both a selection and a rejection, and the arrow keys moved the option
   * and the queue together.
   *
   * j and k are not destructive and still stand down under a modifier, for the
   * reason Cmd+K showed: a surface that moves its own focus underneath an
   * overlay the user just opened has taken a keypress that was never addressed
   * to it, and the call they then settle is not the call they were reading. */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      /**
       * AND NOT WHILE SOMETHING IS OPEN OVER THIS SURFACE.
       *
       * The sharpest case is the shortcut sheet itself: press `?`, read the row
       * that says "a -- Approves the call in front of you", press `a`, and the
       * call behind the scrim is settled. The sheet documents the key and then
       * leaves it armed. `BoardPanel` has the identical shape and opens on an
       * ordinary rail click.
       *
       * The field guards above cannot help: both overlays are made of BUTTONs
       * and a scrim, so focus is never in an INPUT, TEXTAREA or SELECT. The
       * chord handler has stood down under this exact selector for hours; the
       * gates never learned to.
       */
      if (isModalOpen()) return;

      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (visibleItems.length === 0) return;
      const idx = visibleItems.findIndex((i) => i.id === focusedId);
      if (e.key === "j") {
        e.preventDefault();
        const next = visibleItems[Math.min(visibleItems.length - 1, idx + 1)];
        if (next) setFocusedId(next.id);
      } else if (e.key === "k") {
        e.preventDefault();
        const prev = visibleItems[Math.max(0, idx - 1)];
        if (prev) setFocusedId(prev.id);
      } else if (e.key === "a" || e.key === "d") {
        /**
         * `d` DECLINES, NOT `r`. One alphabet across every gate: `a` accepts
         * and `d` declines on Today, Decide, Design, Crew and Discover, and
         * this surface was reading `r` for the same act. Today's own copy
         * sends a person straight here ("the rest is in Approvals"), so the
         * letter changed under them mid-task, and `d` was dead here while `r`
         * was dead there.
         */
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
  /* "CALL" AND "DECISION" WERE THE SAME OBJECT IN TWO WORDS, one inch apart.
     The shell above this page reads "83 decisions are ready for you"
     (AppFrame.tsx), and this headline read "83 calls need you" off the same
     count at the same moment. AppFrame's own comment records that exact drift
     being fixed there against /today; the fix never reached this page, which
     is the surface the shell is counting FOR.
     "Ready for you" over "needs you" is also the more honest verb: nothing
     here has happened yet, so nothing is owed. */
  const headline = queue.isLoading
    ? "Approvals"
    : n === 0
      ? "Nothing is ready for you."
      : n === 1
        ? "1 decision is ready for you."
        : `${n} decisions are ready for you.`;

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
                <div className="sp-ctx-head">Before you decide</div>
                <div className="sp-ctx-body">{focused.impact}</div>
              </>
            ) : null}
            <div className="sp-ctx-head">Moving through</div>
            {/* SAID `r` UNTIL 2026-08-10, AND `r` DOES NOTHING. The decline key
                was migrated r -> d (see the note above the key handler in this
                file); the handler, the button's own drawn keycap and
                lib/key-model.ts all moved together, and this sentence did not.
                So the one place on the surface that TEACHES the shortcut taught
                a key bound to nothing, while the working key sat unmentioned two
                inches away on the button.
                It survived because no test asserts this string. The derivation
                law the rail uses -- draw the keycap from the same source that
                binds it, so the two cannot drift -- is exactly what this prose
                sentence opted out of by hand-writing the letter. */}
            <div className="sp-ctx-body">
              <Num>j</Num> and <Num>k</Num> walk the queue. <Num>a</Num> approves the one in front
              of you, <Num>d</Num> declines it.
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

      {/* A LOADING READ IS NOT AN EMPTY PAGE. This was `isLoading ? null`,
          which rendered the heading and then nothing at all: on a cold load
          the queue surface was a blank rectangle for as long as the read took,
          with no signal that anything was coming. Empty, Failed and Loading
          are three different primitives in this product precisely so that a
          read in flight never wears the clothes of a queue with nothing in it,
          and this page was skipping straight past that rule. */}
      {queue.isLoading ? (
        <Loading>Reading the queue.</Loading>
      ) : queue.isError ? (
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
            shortcut="d"
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

      {receipts.length > 0 ? (
        <Block title="What you settled">
          {receipts.map((r, i) => (
            <Receipt
              key={`${r.id}-${i}`}
              verb={r.verb}
              consequence={r.consequence}
              time={r.at}
              failed={r.failed}
            />
          ))}
        </Block>
      ) : null}

      {groups.map((group) => (
        <Block key={group.name} title={group.name}>
          {group.items.map((item) => (
            <Row
              key={item.id}
              tight
              marks={<AgentMark slug={item.agentSlug} state="quiet" />}
              lead={stripAuto(item.title)}
              // The second line is a DIFFERENT fact, not more of the first: who
              // raised it and what family of call it is. The evidence belongs
              // to the one call in focus, not to twenty rows.
              sub={`${agentDisplayName(item.agentSlug)} · ${item.kind.toLowerCase()}`}
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
