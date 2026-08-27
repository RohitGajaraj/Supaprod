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
 *    KEEP  the queue itself, the filter row, the j/k/a/d keys, the optimistic
 *          decide: this is where the decision is made.
 *    KEEP  the "N more in other workspaces" line. It is the only thing telling
 *          you the number in front of you is not the whole number.
 *    KILL  the per-item full card. Twenty cards, each with its own evidence
 *          block and its own approve and reject pair, is twenty primary
 *          actions and nothing to look at first. It also forced the exact
 *          verbosity the founder named: "Why do we need so bigger things to
 *          display? If a user wants to know, he will click deeper."
 *    KILL  the standalone page header and RoomChromeShell. The app shell
 *          already says where you are.
 *    MOVE  the evidence, the cost and where a call came from out of the list
 *          and into the context column, where they describe the ONE call in
 *          focus.
 *
 * 4. ONE CLICK AWAY. A list row is one line plus a different second fact,
 *    never wrapping. Its full evidence appears when it becomes the focused
 *    call, which is one keypress or one click.
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
 * Every behaviour is preserved: optimistic decide with rollback, a/d, the
 * workspace-scoped query key shared with the rail badge and Today, the
 * unscoped other-workspaces read, and the live-activity line on an empty queue.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * 2026-08-14: THE COST OF WAITING IS NOW ON THE SURFACE (Meridian).
 *
 * Measured in production that morning: twelve gates pending, ages in hours 86,
 * 83, 83, 83, 80, 74, 68, 67, 66, 55, 52, 51. The oldest entered at 18:31 on 10
 * August. Each one blocks exactly one named piece of work, and NOTHING ANYWHERE
 * IN THE PRODUCT TOLD ANYONE. The loop sat for three and a half days waiting on
 * a click, in a product whose whole claim is that it keeps moving.
 *
 * The diagnosis was not that the queue looked bad. It was that A PENDING
 * APPROVAL IS A ROW IN A LIST, NOT A STALLED PIECE OF WORK WITH A COST. So the
 * list is no longer a list of gates: it is StalledWork, which drives emphasis
 * from age through elevation and type weight as well as hue, so the oldest is
 * still obviously the oldest in greyscale, and which names what is not
 * happening. The gate at the top carries the same fact for the call in front of
 * you.
 *
 * TWO THINGS CHANGED THAT ARE NOT PRESENTATION, and both are here rather than
 * in the read, so no query moved:
 *
 *   ORDER. The queue arrives NEWEST FIRST (approvals-queue.functions.ts sorts
 *   `b.timestamp` against `a.timestamp`), so this surface used to put the
 *   freshest call in front of a person while an 86 hour gate sat at the bottom
 *   of the page. It is sorted OLDEST FIRST here, which is the order the surface
 *   already claimed to work in ("settled in order") and the only order the
 *   finding above permits. The read is untouched; this is which one is drawn
 *   first.
 *
 *   THE PROJECT GROUPING IS GONE, and it was on the KEEP list until today. A
 *   list grouped by project cannot also be ordered by age: an 86 hour gate
 *   sitting under the third project heading is exactly how the oldest call
 *   stayed invisible for three and a half days. The project is not lost, it
 *   moves onto the row itself, which is a better place for it: a heading tells
 *   you where you are in a list, a row fact tells you what is held up.
 *
 * THE ROW'S SECOND FACT CHANGED, and answer 4 above is still the law. It used
 * to be who raised the call and which family it belongs to; it is now how long
 * the call has been stopped and what that is holding up. Both are one line and
 * neither wraps, so the shape is unchanged and only the fact is. The agent is
 * not lost: it is drawn in the context column for the call in focus, which is
 * one keypress away, and it never told a reader whether to act. The age does.
 * The family is still on the surface as the filter row's own buckets.
 *
 * THE COMMIT (agents/FINAL-agent-presence.md R10, which named this surface and
 * this line as the defect). Settling a call used to fire a toast saying
 * "Approved." and the card vanished. A toast confirms that your click
 * REGISTERED; the settled line renders what your click CAUSED. An approval that
 * erases itself teaches you that your judgment left no trace, and judgment is
 * the product, so it now leaves a mark at the moment it is made. The per-item
 * approveConsequence is real, per-kind copy that already existed, so the
 * settled line says the true thing rather than a generic confirmation. No arrow
 * is drawn to a receiving agent, because nothing in decideApprovalItem's
 * response tells us who picks the work up: an arrow to nowhere is worse than no
 * arrow.
 *
 * FOUR FACTS, NOT TWO. This surface separates them and must keep separating
 * them: nothing is waiting on you, a filter excluded everything, the read
 * failed, and you are not in a workspace yet so it cannot ask its question at
 * all. The third must never wear the first's clothes and must offer a way out.
 */

import { createFileRoute } from "@tanstack/react-router";
import { failureLine } from "@/components/track/error-copy";
import { approvalsQueueKey, APPROVALS_QUEUE_PREFIX, invalidateShellReads } from "@/lib/query-keys";
import { isModalOpen } from "@/lib/overlay";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import {
  getApprovalsQueue,
  decideApprovalItem,
  snoozeApprovalItem,
  type ApprovalFilter,
  type ApprovalQueueItem,
} from "@/lib/approvals-queue.functions";
import { getLiveActivity } from "@/lib/agents.functions";
import { useWorkspace } from "@/hooks/use-workspace";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { Surface } from "@/components/meridian/Surface";

import { ApprovalCard } from "@/components/meridian/ApprovalCard";
import { NeedsSetup } from "@/components/meridian/NeedsSetup";
import { StalledWork, type StalledItem } from "@/components/meridian/StalledWork";

import { CallGate } from "@/components/approvals/CallGate";
import { Action, Approve, ReadFailed, Reading } from "@/components/meridian/surface-parts";
import { CallContext, Key } from "@/components/approvals/CallContext";
import { FilterExcludedEverything, QueueFilters } from "@/components/approvals/QueueFilters";
import { SettledTrail, type SettledLine } from "@/components/approvals/SettledTrail";
import { UndatedCalls, type UndatedCall } from "@/components/approvals/UndatedCalls";
import { SendBackSheet, canSendBack } from "@/components/approvals/SendBack";
import { waitingSince } from "@/components/approvals/stopped-for";

export const Route = createFileRoute("/_authenticated/approvals")({
  component: ApprovalsSurface,
  head: () => ({ meta: [{ title: "Approvals · Supaprod" }] }),
});

const SETTLED_APPROVE: Record<ApprovalQueueItem["kindKey"], string> = {
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
const SETTLED_REJECT = "Declined. Noted for next time.";

const FILTERS: { id: ApprovalFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "proposals", label: "Proposals" },
  { id: "gates", label: "Gates" },
  { id: "memory", label: "Memory" },
  { id: "spend", label: "Spend" },
];

/** stripAutoPrefix only removes a LEADING "[auto]". Evidence lines carry it
 *  mid-sentence too ("From [auto] Investigate the ..."), so the marker has to
 *  come out wherever it sits: it marks a call the loop raised itself, and it is
 *  never copy for a person to read. */
function stripAuto(text: string): string {
  return text.replace(/\[auto\]\s*/gi, "").trim();
}

/** The mission or project a call sits in front of, in the words the queue
 *  already resolved. Null on the families that are workspace wide (memory,
 *  house rules, trust, assumption challenges, playbooks), and null is drawn as
 *  nothing rather than as "Workspace", because inventing a container for a call
 *  that has none says something the read never said. */
function subjectOf(item: ApprovalQueueItem): string | null {
  return item.project ?? item.projectName ?? null;
}

/**
 * OLDEST FIRST, and calls with no recorded start time last.
 *
 * The read hands this page newest first. That order put the freshest call in
 * front of a person and left the 86 hour one at the bottom of the page, which
 * is the defect the 2026-08-14 finding names. Sorting here rather than in the
 * read keeps every other reader of that same cache entry (the rail badge,
 * Today) untouched.
 */
function oldestFirst(a: ApprovalQueueItem, b: ApprovalQueueItem): number {
  const at = waitingSince(a.timestamp);
  const bt = waitingSince(b.timestamp);
  if (at === null && bt === null) return 0;
  if (at === null) return 1;
  if (bt === null) return -1;
  return at - bt;
}

function ApprovalsSurface() {
  const qc = useQueryClient();
  const { activeWorkspaceId, workspaces, isLoading: workspacesLoading } = useWorkspace();
  const fetchQueue = useServerFn(getApprovalsQueue);
  const fetchLiveActivity = useServerFn(getLiveActivity);
  const mDecide = useServerFn(decideApprovalItem);
  const mSnooze = useServerFn(snoozeApprovalItem);

  const [filter, setFilter] = useState<ApprovalFilter>("all");
  const [focusedId, setFocusedId] = useState<string | null>(null);
  // THE COMMIT (agents/FINAL-agent-presence.md R10). A settled call does not
  // vanish into a toast: it collapses in place into a line that stays on the
  // surface for the rest of the session, so your judgment leaves a visible
  // trace at the moment you make it. Session-local on purpose; the durable
  // record is the trust audit trail, and duplicating it here would be a second
  // source of the same truth.
  const [settled, setSettled] = useState<SettledLine[]>([]);

  // The call being sent back. The sheet owns its own mutation and cache
  // invalidation; this surface only holds which item is open and writes the
  // settled line on a landed send.
  const [sendBack, setSendBack] = useState<ApprovalQueueItem | null>(null);

  // One clock for one paint, so the gate's age and the queue's ages can never
  // disagree by a tick inside the same render.
  const now = Date.now();

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

  const visibleItems = useMemo(() => {
    const inFilter =
      filter === "all" ? allItems : allItems.filter((i) => i.filterBucket === filter);
    return [...inFilter].sort(oldestFirst);
  }, [allItems, filter]);

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

  /*
   * The queue below the gate, as work that has stopped rather than as rows.
   *
   * `blocking` is the mission or project the call sits in front of, which is
   * the coarsest honest answer available: nothing on an item names the single
   * downstream piece of work it holds up, so for a tool-call gate this is the
   * mission (exactly right) and for a project-scoped gate it is the project
   * (true, and less precise than the component deserves). Recorded as a gap
   * rather than papered over with a guess.
   *
   * `reason` is left at its default. Every call in this queue is a gate waiting
   * on a person; nothing here is stopped for want of a connected source, which
   * is the other reason StalledWork draws and the one that carries no accent.
   *
   * No per-row commit control. StalledWork offers one and it is deliberately
   * not passed: this surface keeps ONE primary action on screen, and a row that
   * can approve but not decline is a lopsided pair on an irreversible verdict.
   */
  const stalled: StalledItem[] = [];
  const undated: UndatedCall[] = [];
  for (const item of rest) {
    const since = waitingSince(item.timestamp);
    if (since === null) {
      undated.push({
        id: item.id,
        asking: stripAuto(item.title),
        where: subjectOf(item),
        onOpen: () => setFocusedId(item.id),
      });
      continue;
    }
    stalled.push({
      id: item.id,
      asking: stripAuto(item.title),
      since,
      blocking: subjectOf(item) ?? undefined,
      onOpen: () => setFocusedId(item.id),
    });
  }

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
      // No toast. The settled line IS the confirmation, and it says what the
      // click CAUSED rather than that it registered.
      setSettled((r) => [
        {
          id: vars.item.id,
          verb: vars.verdict === "approve" ? "You approved" : "You declined",
          consequence:
            vars.verdict === "approve"
              ? (vars.item.approveConsequence ?? SETTLED_APPROVE[vars.item.kindKey])
              : (vars.item.rejectConsequence ?? SETTLED_REJECT),
          at: new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
        },
        ...r,
      ]);
    },
    onError: (e: Error, vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queueKey, ctx.prev);
      // A failed write still writes a line, and the line goes honest
      // immediately. Never a success shape over a failed write: that is the one
      // thing that makes the successful ones trustworthy.
      setSettled((r) => [
        {
          id: vars.item.id,
          verb: "Nothing was recorded",
          consequence: failureLine("This is still waiting for you.", e),
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

  /* Snooze, the third verb on a gate, mounted here so the queue stops offering
   * only approve/decline. Same shape as `decide` above on purpose: same cache
   * key (the helper, never a literal), same optimistic drop, same rollback, and
   * the settled line instead of a toast, because a deferred call is also a call
   * that left the list at your hand. The write is snoozeApprovalItem's
   * (kind, source_id) upsert, which getApprovalsQueue filters on until it
   * lapses; Today's z runs exactly this resolver against this same cache. */
  const snooze = useMutation({
    mutationFn: (item: ApprovalQueueItem) =>
      mSnooze({ data: { id: item.sourceId, kind: item.kindKey } }),
    onMutate: async (item) => {
      await qc.cancelQueries({ queryKey: queueKey });
      const prev = qc.getQueryData<{ items: ApprovalQueueItem[] }>(queueKey);
      qc.setQueryData<{ items: ApprovalQueueItem[] } | undefined>(queueKey, (old) =>
        old ? { items: old.items.filter((i) => i.id !== item.id) } : old,
      );
      return { prev };
    },
    onSuccess: (_res, item) => {
      setSettled((r) => [
        {
          id: item.id,
          verb: "You snoozed it",
          consequence: "It returns with tomorrow's brief.",
          at: new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
        },
        ...r,
      ]);
    },
    onError: (e: Error, item, ctx) => {
      if (ctx?.prev) qc.setQueryData(queueKey, ctx.prev);
      setSettled((r) => [
        {
          id: item.id,
          verb: "Nothing was recorded",
          consequence: failureLine("This is still waiting for you.", e),
          at: new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
          failed: true,
        },
        ...r,
      ]);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: APPROVALS_QUEUE_PREFIX });
      invalidateShellReads(qc);
      void qc.invalidateQueries({ queryKey: ["today"] });
    },
  });

  /* j/k move focus, a/d settle the focused call. Both guards run before any of
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
   * verdict to the trust audit trail and there is no undo, so the cost of one
   * stray reload was a settled call the user never made, attributed to them
   * forever, and a queue one item shorter than they left it.
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
   * to it, and the call they then settle is not the call they were reading.
   *
   * j AND k NOW WALK OLDEST FIRST, because `visibleItems` is ordered that way
   * (see `oldestFirst`). The keys are unchanged; what changed is which call is
   * under them first, and it is now the one that has been stopped longest. */
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
      } else if (e.key === "z") {
        /* z SNOOZES, the same letter and the same resolver as the gate on
         * Today. It defers rather than settles, so it is not destructive, but
         * it still stands down under every guard above: it removes the call
         * from this queue for a day, and the same overlay argument holds.
         * Declared in lib/key-model.ts beside j/k/a/d so the sheet cannot
         * drift from this binding. */
        const current = visibleItems[idx];
        if (current && !snooze.isPending) {
          e.preventDefault();
          snooze.mutate(current);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visibleItems, focusedId, decide, snooze]);

  const activity = liveActivity.data;
  const quietLine =
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
    : /*
       * A FAILED READ IS NOT AN EMPTY QUEUE, and this heading was the one place
       * on the page that had not learned it. `queue.isError` was never consulted
       * here, so a failed read fell through to n === 0 and printed "Nothing is
       * ready for you." in the largest type on the screen, directly above the
       * error card explaining that the queue could not be read. The page
       * asserted the queue was empty and unreadable in the same breath, and a
       * person believing the heading would walk away from work that is sitting
       * there.
       *
       * The rest of this file already knows the rule: :580 checks !isError
       * before deciding somebody is in no workspace, and the card below branches
       * on it too. The heading takes the neutral title, the same one it wears
       * while loading, because a heading that cannot know the count must not
       * imply one. The card underneath carries the explanation.
       */
      queue.isError
      ? "Approvals"
      : n === 0
        ? "Nothing is ready for you."
        : n === 1
          ? "1 decision is ready for you."
          : `${n} decisions are ready for you.`;

  /* THE THIRD FACT, which this surface used to collapse into the first. A
     person in no workspace at all was told "Nothing is ready for you.", which
     is true and useless: nothing CAN be ready, and the act that changes it is
     not a decision but a piece of setup. Only asserted once the membership read
     has actually landed and the queue itself came back empty, because several
     gate families predate workspace tenancy and are read unscoped either way,
     so a person with no workspace can still legitimately have calls waiting. */
  const needsWorkspace =
    !workspacesLoading && workspaces.length === 0 && !queue.isLoading && !queue.isError && n === 0;

  const focusedSince = focused ? waitingSince(focused.timestamp) : null;
  const focusedLines = focused ? focused.evidence.slice(0, 3).map(stripAuto) : [];
  const focusedHidden = focused ? Math.max(0, focused.evidence.length - 3) : 0;

  return (
    <Surface
      context={
        focused ? (
          <CallContext
            agentSlug={focused.agentSlug}
            agentName={agentDisplayName(focused.agentSlug)}
            where={subjectOf(focused) ?? "This workspace"}
            impact={focused.impact}
            keys={
              /* SAID `r` UNTIL 2026-08-10, AND `r` DOES NOTHING. The decline key
                 was migrated r -> d (see the note above the key handler in this
                 file); the handler, the button's own drawn keycap and
                 lib/key-model.ts all moved together, and this sentence did not.
                 So the one place on the surface that TEACHES the shortcut taught
                 a key bound to nothing, while the working key sat unmentioned two
                 inches away on the button.
                 It survived because no test asserts this string. The derivation
                 law the rail uses -- draw the keycap from the same source that
                 binds it, so the two cannot drift -- is exactly what this prose
                 sentence opted out of by hand-writing the letter. */
              <>
                <Key>j</Key> and <Key>k</Key> walk the queue, oldest first. <Key>a</Key> approves
                the one in front of you, <Key>d</Key> declines it, <Key>z</Key> snoozes it until
                tomorrow.
              </>
            }
          />
        ) : null
      }
    >
      <div className="flex flex-col gap-mrd-7">
        <header>
          <h1 className="text-mrd-h2 leading-mrd-tight font-medium text-mrd-ink">{headline}</h1>
          {/* THE SECOND CLAUSE EARNS ITS WORDS, and it is not decoration. The
              headline counts the WHOLE queue and the section below the gate
              counts the queue MINUS the call in the gate, so on twelve pending
              calls a reader meets "12" and then "11" two inches apart. Naming
              the split is what makes those two numbers one fact instead of a
              contradiction. Do not shorten this back to one sentence. */}
          {n > 0 ? (
            <p className="mt-mrd-3 text-mrd-base leading-mrd-prose text-mrd-prose text-mrd-body">
              Settled in order, oldest first. The one in front of you is the one that moves, and the
              rest are listed under it.
            </p>
          ) : null}
        </header>

        {allItems.length > 0 ? (
          <QueueFilters
            filters={FILTERS}
            counts={counts}
            active={filter}
            onSelect={(id) => setFilter(id)}
          />
        ) : null}

        {/* A LOADING READ IS NOT AN EMPTY PAGE. This was `isLoading ? null`,
            which rendered the heading and then nothing at all: on a cold load
            the queue surface was a blank rectangle for as long as the read took,
            with no signal that anything was coming. Empty, failed and loading
            are three different things in this product precisely so that a read
            in flight never wears the clothes of a queue with nothing in it, and
            this page was skipping straight past that rule.

            A plain quiet line, not the pixel-grid loader: that one carries a
            live elapsed timer and belongs where an agent genuinely runs for
            seconds. On an ordinary read it would invent a wait. */}
        {queue.isLoading ? (
          <Reading>Reading the queue.</Reading>
        ) : queue.isError ? (
          <ReadFailed
            onRetry={() => void queue.refetch()}
            detail="Nothing has been settled and nothing has been lost. The queue is still whatever it was a moment ago; this screen just could not read it."
          >
            The queue did not load.
          </ReadFailed>
        ) : needsWorkspace ? (
          <NeedsSetup
            kind="no-workspace"
            thenWhat="every call the crew stops to ask lands here, and the work it is holding up is named beside it."
          />
        ) : focused ? (
          <CallGate
            // The "[auto]" marker names a call the loop raised itself and must
            // never reach the sentence being judged.
            question={stripAuto(focused.title)}
            subject={subjectOf(focused)}
            since={focusedSince}
            now={now}
            lines={focusedLines}
            hiddenLineCount={focusedHidden}
            consequence={focused.approveConsequence}
          >
            <Approve
              shortcut="a"
              busy={decide.isPending}
              onClick={() => decide.mutate({ item: focused, verdict: "approve" })}
            >
              Approve
            </Approve>
            <Action
              shortcut="d"
              busy={decide.isPending}
              onClick={() => decide.mutate({ item: focused, verdict: "reject" })}
            >
              Decline
            </Action>
            {/* The two quiet verbs, mounted so this queue stops offering only a
                verdict pair. Snooze defers; nothing is settled. Send back opens
                the note sheet and only exists on the kinds the server accepts,
                drawn as absence rather than as a disabled control (the rule
                canSendBack enforces for every caller). */}
            <Action
              variant="quiet"
              shortcut="z"
              busy={snooze.isPending}
              onClick={() => snooze.mutate(focused)}
            >
              Snooze
            </Action>
            {canSendBack(focused.kindKey) ? (
              <Action variant="quiet" onClick={() => setSendBack(focused)}>
                Send back
              </Action>
            ) : null}
          </CallGate>
        ) : allItems.length === 0 ? (
          /* NOTHING IS WAITING, which is good news and is drawn as such: no
             accent, no illustration, no call to action. The live line beside it
             is the one thing worth adding, because "nothing needs you" and "the
             crew is mid-run and something is coming" are different facts to
             someone deciding whether to close the tab. */
          <div className="flex flex-col gap-mrd-4">
            <ApprovalCard questions={[]} />
            {quietLine ? <p className="text-mrd-label text-mrd-mute">{quietLine}</p> : null}
          </div>
        ) : (
          <FilterExcludedEverything
            total={allItems.length}
            label={FILTERS.find((f) => f.id === filter)?.label ?? "this filter"}
            onClearFilter={() => setFilter("all")}
          />
        )}

        <SettledTrail lines={settled} />

        {stalled.length > 0 ? <StalledWork items={stalled} now={now} /> : null}

        <UndatedCalls calls={undated} />

        {otherWorkspacesCount > 0 ? (
          <p className="text-mrd-label text-mrd-mute">
            <span className="font-mrd-mono tabular-nums text-mrd-prose text-mrd-body">
              {otherWorkspacesCount}
            </span>{" "}
            more waiting in your other workspaces.
          </p>
        ) : null}
      </div>

      {/* The send-back sheet, mounted over the call it belongs to, the way Today
          mounts it: same component, same item shape, same cache work done
          inside the sheet. onSent writes this surface's settled line, because
          here a sent-back call is also a judgment made at the gate and every
          judgment on this page leaves its line. */}
      <SendBackSheet
        open={sendBack !== null}
        item={
          sendBack
            ? {
                id: sendBack.id,
                sourceId: sendBack.sourceId,
                kindKey: sendBack.kindKey,
                title: stripAuto(sendBack.title),
              }
            : null
        }
        onClose={() => setSendBack(null)}
        onSent={() =>
          setSettled((r) => [
            {
              id: sendBack?.id ?? "sent-back",
              verb: "You sent it back",
              consequence: "It returns to the agent with your note.",
              at: new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
            },
            ...r,
          ])
        }
      />
    </Surface>
  );
}
