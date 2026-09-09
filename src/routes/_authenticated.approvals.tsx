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
 * workspace-scoped query key shared with the rail badge and Today, and the
 * live-activity line on an empty queue. The other-workspaces read is no
 * longer unscoped -- P-93 (A-QUEUE.md) made it one scoped read per other
 * workspace instead of one bare cross-workspace fan-out; see
 * `otherWorkspacesLine`'s own header below for why.
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

import { createFileRoute, Link } from "@tanstack/react-router";
import { failureLine } from "@/lib/error-copy";
import { stillHoldsWork } from "@/components/approvals/still-holds-work";
import { approvalsQueueKey, APPROVALS_QUEUE_PREFIX, invalidateShellReads } from "@/lib/query-keys";
import { isModalOpen } from "@/lib/overlay";
import { presenceAnchor } from "@/components/shell/presence-anchor";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  countApprovalsQueueByWorkspace,
  type WorkspaceWaiting,
} from "@/lib/approvals-queue.functions";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  getApprovalsQueue,
  decideApprovalItem,
  snoozeApprovalItem,
  type ApprovalFilter,
  type ApprovalQueueItem,
} from "@/lib/approvals-queue.functions";
import { getLiveActivity } from "@/lib/agents.functions";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAsk } from "@/lib/ask-context";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { getTrack } from "@/lib/spine/track.functions";
import { Surface } from "@/components/meridian/Surface";

import { ApprovalCard } from "@/components/meridian/ApprovalCard";
import { NeedsSetup } from "@/components/meridian/NeedsSetup";
import { StalledWork, type StalledItem } from "@/components/meridian/StalledWork";
import { looksSeeded } from "@/components/approvals/what-is-worth-your-next-ten-minutes";

import { Ask } from "@/components/meridian/Ask";
import { askQuestion } from "@/components/meridian/question";
import {
  Action,
  Actions,
  ACTION_LINK_FACE,
  ReadFailed,
  Reading,
} from "@/components/meridian/surface-parts";
import { CallContext, Key } from "@/components/approvals/CallContext";
import { FilterExcludedEverything, QueueFilters } from "@/components/approvals/QueueFilters";
import { SettledTrail, type SettledLine } from "@/components/approvals/SettledTrail";
import { UndatedCalls, type UndatedCall } from "@/components/approvals/UndatedCalls";
import { ProviderFaultNotice } from "@/components/approvals/ProviderFaultNotice";
import { getProviderFaults } from "@/lib/provider-faults.functions";
import { SendBackSheet, canSendBack } from "@/components/approvals/SendBack";
import { stripAutoMarkers } from "@/components/plan/format";
import { stoppedFor, waitingSince } from "@/components/meridian/stopped-for";
import { countIsAFloor, notTheWholeQueue } from "@/components/approvals/not-the-whole-queue";
import {
  queueShape,
  queueCounts,
  shapeSentence,
} from "@/components/approvals/a-queue-is-a-shape-not-a-total";
import { questionForGate } from "@/components/ask/a-question-is-composed-not-punctuated";

/** One identity for the empty case, so a loading or failed read does not
 *  invalidate every memo that depends on the queue. See its use below. */
const NO_ITEMS: readonly ApprovalQueueItem[] = [];

export const Route = createFileRoute("/_authenticated/approvals")({
  component: ApprovalsSurface,
  // P-61 (A-QUEUE.md): the tab title is the rail's own word for this door
  // (PRIMARY_NAV's "Waiting"), not the route's internal name.
  head: () => ({ meta: [{ title: "Inbox · Supaprod" }] }),
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
/** P-54: the write succeeded but changed no row -- someone, or another press
 *  in the same burst, already decided this gate first. Never printed as
 *  "You approved"/"You declined": that sentence is reserved for a verdict
 *  that actually landed. */
const NOTHING_CHANGED = "This was already decided.";

/**
 * WHAT A DECIDE PRESS PRINTS ON THE TRAY (P-54), pulled out as a pure function
 * so the branch that matters -- `changed: false` never gets the verdict shape
 * -- is testable without a mutation, a query client or a mount.
 */
export function decideSettledLine(
  vars: { item: ApprovalQueueItem; verdict: "approve" | "reject" },
  changed: boolean,
  at: string,
): SettledLine {
  if (!changed) {
    return {
      id: vars.item.id,
      verb: "Nothing changed",
      consequence: NOTHING_CHANGED,
      at,
      failed: true,
    };
  }
  return {
    id: vars.item.id,
    verb: vars.verdict === "approve" ? "You approved" : "You declined",
    consequence:
      vars.verdict === "approve"
        ? (vars.item.approveConsequence ?? SETTLED_APPROVE[vars.item.kindKey])
        : (vars.item.rejectConsequence ?? SETTLED_REJECT),
    at,
  };
}

/**
 * THE VOCABULARY, IN ORDER. What is DRAWN is decided below from what the queue
 * actually holds, because two of these tabs were furniture.
 *
 * `spend` is the clear one. `approvals-queue.functions.ts` says it in as many
 * words: the bucket "exists as a bucket so the vocabulary is stable, but
 * nothing routes into it yet because no spend-gate READ exists in the codebase
 * today." So this row has been drawing `Spend 0` on every load since it was
 * written, and a tab that can never do anything is exactly what R-20 section 8
 * calls furniture. It stays in this list, so it appears by itself on the day a
 * spend gate lands, and it is not drawn until then.
 *
 * S2 reached the same conclusion building the board's filter row and did not
 * copy the empty tab. They offered to add it back for consistency with this
 * page. The consistency is worth having and this page is the one that was
 * wrong, so it moves here rather than the furniture moving there.
 */
const FILTERS: { id: ApprovalFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "proposals", label: "Proposals" },
  { id: "gates", label: "Gates" },
  { id: "memory", label: "Memory" },
  { id: "spend", label: "Spend" },
];

/**
 * The tabs worth drawing, given what is in the queue right now.
 *
 * ONE TAB IS NOT A CHOICE, IT IS THE ILLUSION OF ONE. With every call in a
 * single bucket the row would read `All 5   Memory 5`, two controls that do the
 * same thing, so nothing is drawn and the queue speaks for itself.
 *
 * THE ACTIVE TAB IS KEPT EVEN AT ZERO. Settling the last gate while filtered to
 * Gates would otherwise delete the control under the pointer and silently widen
 * the list back to everything, which reads as the page losing your place.
 */
export function filtersWorthDrawing(
  counts: Readonly<Record<ApprovalFilter, number>>,
  active: ApprovalFilter,
): { id: ApprovalFilter; label: string }[] {
  const real = FILTERS.filter((f) => f.id === "all" || counts[f.id] > 0 || f.id === active);
  return real.length > 2 ? real : [];
}

/*
 * THE PRIVATE COPY IS GONE. It lived here as `stripAuto`, and this route folds,
 * so the fix would have died with the door.
 *
 * `stripAutoMarkers` is byte-identical and lives in `plan/format` beside
 * `stripAutoPrefix`, `cleanTitle` and `isAutoTitle` -- the module that already
 * owns this marker and carries its leak audit. S2 moved it there rather than
 * copying mine, on the argument that a fix inside a folding route is a fix with
 * a deadline, and then found what the duplication had already cost: their
 * `subjectKey` normalised with the ANCHORED `stripAutoPrefix`, so "Investigate
 * the flake" and "From [auto] Investigate the flake" keyed as two subjects. The
 * note whose whole job is saying "this is the same work" was silent about its
 * own case.
 *
 * `stripAutoPrefix` stays and is not deprecated: anchoring is correct for a
 * pipeline-stamped title, and collapsing the two would break what `isAutoTitle`
 * depends on. Two functions, two jobs, one home.
 */

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
  const {
    activeWorkspaceId,
    workspaces,
    setActiveWorkspaceId,
    isLoading: workspacesLoading,
  } = useWorkspace();
  const ask = useAsk();
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
  /*
   * P-93: A SCOPED READ PER WORKSPACE, NEVER ONE BARE CROSS-WORKSPACE COUNT.
   *
   * This used to be one unscoped `fetchQueue({data: {}})` fanned across every
   * workspace the caller belongs to, subtracted against the active
   * workspace's own count -- exactly the "bare cross-workspace count" the
   * packet's own scope forbids, and the one place P-67's read-names-its-
   * workspace guard would otherwise have to carve an exception for. Instead,
   * one query PER other workspace, each naming that workspace by id --
   * `a-read-names-its-workspace.test.ts`'s own `DELIBERATELY_UNSCOPED` entry
   * for `calibrate-tick.ts` states the rule this follows: "the tick iterates
   * workspaces itself and scopes each pass; that loop IS the scoping." Same
   * `approvalsQueueKey`, so a workspace switched TO here starts warm.
   */
  /*
   * ── ONE COUNT, ONE ROUND TRIP (Lane 3, 5f6487d90; wired by Lane 2) ──────
   * The per-workspace reads above were each the FULL queue, fetched once per
   * other workspace, to draw a number and a name. `countApprovalsQueueByWorkspace`
   * is one SQL function that answers every workspace the caller is in, still
   * scoped by naming the active one to exclude, so P-93's rule holds and the
   * line costs one hop rather than a queue per workspace.
   */
  const fetchWaiting = useServerFn(countApprovalsQueueByWorkspace);
  const otherWaiting = useQuery({
    queryKey: ["approvals-waiting-elsewhere", activeWorkspaceId ?? null],
    queryFn: () => fetchWaiting({ data: { excludeWorkspaceId: activeWorkspaceId ?? undefined } }),
    enabled: !!activeWorkspaceId,
    staleTime: 60_000,
  });
  const otherWorkspacesWithWork = useMemo(
    () =>
      (otherWaiting.data?.workspaces ?? [])
        .filter((w: WorkspaceWaiting) => w.workspaceId !== activeWorkspaceId && w.waiting > 0)
        .map((w: WorkspaceWaiting) => ({ id: w.workspaceId, name: w.name, count: w.waiting }))
        .sort((a, b) => b.count - a.count),
    [otherWaiting.data, activeWorkspaceId],
  );
  /*
   * THE DOOR ALWAYS TARGETS THE ONE WITH THE MOST WAITING, even when the
   * line names a second and a tail count -- "the workspace with the most
   * waiting... is a door that switches to it", singular, no matter how many
   * are named in the sentence beside it.
   */
  const otherWorkspacesLine = useMemo(() => {
    if (otherWorkspacesWithWork.length === 0) return null;
    const [top, second] = otherWorkspacesWithWork;
    if (!top) return null;
    const parts = [`${top.count} waiting in ${top.name}`];
    if (second) parts.push(`${second.count} in ${second.name}`);
    const restCount = otherWorkspacesWithWork.length - parts.length;
    const tail =
      restCount === 0 ? "." : restCount === 1 ? ", and one more." : `, and ${restCount} more.`;
    return { text: `${parts.join(", ")}${tail}`, targetWorkspaceId: top.id };
  }, [otherWorkspacesWithWork]);
  const liveActivity = useQuery({
    /* P-75: the key and the call both name the workspace. A1 read "One just
       came in. Refresh to see it." in an EMPTY probe workspace, where nothing
       had: every run this could see was Helio's, and the sentence fires exactly
       when the queue is otherwise empty. */
    queryKey: ["approvals-live-activity", activeWorkspaceId ?? null],
    queryFn: () => fetchLiveActivity({ data: { workspaceId: activeWorkspaceId ?? undefined } }),
    enabled: (queue.data?.items.length ?? 0) === 0 && !queue.isLoading,
  });

  /*
   * P-119: a provider fault is operational, not per-workspace — the same
   * Cohere account pays for embeddings across every workspace the founder
   * owns, so this reads once, unscoped, the same read Team's Spend-and-
   * limits room calls (one query, one answer, never two). Refetches on the
   * same 10s cadence the rest of this page's live reads use, no faster:
   * this clears on its own once the underlying tick starts succeeding
   * again (see provider-faults.functions.ts), so there is no press to react
   * to sooner than the next ordinary poll.
   */
  const fetchProviderFaults = useServerFn(getProviderFaults);
  const providerFaults = useQuery({
    queryKey: ["provider-faults"],
    queryFn: () => fetchProviderFaults(),
    refetchInterval: 60_000,
  });

  /*
   * P-90: A SCREEN READER LEARNS OF AN ARRIVAL, ONCE. P-83 wired the queue to
   * refetch the instant use-approval-push.ts's socket sees a new gate,
   * proposal or memory review -- a sighted person watching this page sees
   * the row land; nothing told a screen reader anything arrived at all.
   *
   * A count DELTA, not the count itself: rendering the live count directly
   * would announce it once on every page LOAD too (the jump from "no data
   * yet" to the real number), which is not an arrival. Silent (`""`) except
   * on the tick the count actually goes UP -- the "once, not on every poll"
   * rule the packet names, done by only ever writing non-empty text on a
   * real increase rather than by suppressing a repeat of the same text (the
   * mechanism `TrackConsent.tsx`/`ArtifactPane.tsx`'s own `aria-live`
   * regions already lean on for their own case).
   */
  const previousQueueCount = useRef<number | null>(null);
  const [arrivalAnnouncement, setArrivalAnnouncement] = useState("");
  useEffect(() => {
    if (queue.isLoading) return;
    const count = queue.data?.items.length ?? 0;
    const prev = previousQueueCount.current;
    if (prev !== null && count > prev) {
      const arrived = count - prev;
      setArrivalAnnouncement(
        arrived === 1 ? "One new call arrived." : `${arrived} new calls arrived.`,
      );
    }
    previousQueueCount.current = count;
  }, [queue.data?.items.length, queue.isLoading]);

  /*
   * ── `?? []` MINTED A NEW ARRAY ON EVERY RENDER (2026-09-01) ──────────────
   *
   * `react-hooks/exhaustive-deps` warns twice here that "the 'allItems' logical
   * expression could make the dependencies of useMemo change on every render",
   * and it is right in a way that costs real work rather than a lint point.
   *
   * An inline `[]` is a FRESH OBJECT each time the component renders. While the
   * queue is loading, and after a failed read, `queue.data` is undefined and
   * this expression therefore produced a different identity every render. Both
   * memos below depend on it, so `counts` recounted and `visibleItems`
   * re-filtered and re-SORTED on every render -- and `visibleItems` feeds a
   * `useEffect`, so that fired again too. The memos were doing the work of not
   * being memos.
   *
   * A module-scope constant has one identity for the life of the module, so the
   * empty case is stable and the memos hold. `readonly` because a shared empty
   * array must never be written through: one mutation would reach every reader.
   */
  const allItems = queue.data?.items ?? NO_ITEMS;
  // ONE ARRAY, BOTH PARTITIONS (P-129, A-QUEUE.md): `queueCounts` is the same
  // function the heading's own `queueShape` call below reads `allItems`
  // through -- never `visibleItems`, the active filter's own slice -- so the
  // two can no longer describe two different lists.
  const counts = useMemo(() => queueCounts(allItems), [allItems]);

  const shownFilters = useMemo(() => filtersWorthDrawing(counts, filter), [counts, filter]);

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
        asking: stripAutoMarkers(item.title),
        where: subjectOf(item),
        onOpen: () => setFocusedId(item.id),
      });
      continue;
    }
    stalled.push({
      id: item.id,
      asking: stripAutoMarkers(item.title),
      since,
      blocking: subjectOf(item) ?? undefined,
      /*
       * P-138. `gatesLiveWork` is passed through UNCHANGED, nulls included:
       * only a tool-call gate carries a meaningful value and everything else is
       * null by construction, so coercing it here would invent a claim about
       * whether a spec is holding a run open.
       *
       * `isDemo` is decided from the SOURCE id rather than the composite
       * `item.id`, which is prefixed by family and would never match. The
       * seeded convention is the only thing that can answer this today; see
       * `looksSeeded` for the measurement of why `is_sample` cannot.
       */
      kind: item.kindKey,
      gatesLiveWork: item.gatesLiveWork,
      isDemo: looksSeeded(item.sourceId),
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
    onSuccess: (res, vars) => {
      // No toast. The settled line IS the confirmation, and it says what the
      // click CAUSED rather than that it registered.
      //
      // P-54: `res.changed` is false when the write reached the server but a
      // row never moved -- this press lost a race a moment earlier one won.
      // That is not a failure (nothing is wrong, `onError` owns that shape)
      // and it is not a verdict either, so `decideSettledLine` gives it its
      // own line rather than borrowing "You approved"/"You declined" for
      // something that did not happen.
      const at = new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
      setSettled((r) => [decideSettledLine(vars, res.changed, at), ...r]);
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

      /**
       * P-54. `ask.isOpen` IS ITS OWN CHECK, NOT COVERED BY `isModalOpen()`.
       *
       * AskPane deliberately carries no `role="dialog"`, no `aria-modal` and no
       * scrim (its own header: "KILL the scrim, the focus trap and aria-modal,
       * deliberately... the page behind it stays live and readable"). That is
       * the right call for a complementary panel, and it means
       * `OPEN_MODAL_SELECTOR` will never see it open, by design.
       *
       * A1, 22:09 IST: a sentence typed into the Ask panel on this page landed
       * on these shortcuts instead, settled four calls in three seconds and
       * moved a real roadmap item to `now`. The field guard above only stands
       * down for the exact instant focus sits inside an editable element; the
       * fix belongs in the key handler, once, rather than asking AskPane (or
       * the next panel) to fake a modal it correctly is not.
       */
      if (ask.isOpen) return;

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
  }, [visibleItems, focusedId, decide, snooze, ask.isOpen]);

  const activity = liveActivity.data;
  /*
   * P-83: "Refresh to see it" is gone. The queue itself now refetches on the
   * same live channel that told `liveActivity` something was waiting
   * (use-approval-push.ts's own header explains the four tables that closed
   * this exact gap), so the row this line used to ask a person to fetch
   * lands here on its own within a tick -- an imperative describing a manual
   * step the product no longer requires them to take.
   */
  const quietLine =
    activity?.state === "working"
      ? "The crew is working. The next call comes to you here."
      : activity?.state === "waiting"
        ? "One just came in."
        : null;

  const n = allItems.length;

  /*
   * WHETHER THE NUMBER ABOVE IS A TOTAL OR A FLOOR. `getApprovalsQueue` bounds
   * every family it federates, and this page has always rendered the result as
   * an exact count in the largest type on the screen. See
   * `not-the-whole-queue.ts` for the 116-against-100 measurement.
   */
  const gaps = queue.data?.incomplete;
  const floor = countIsAFloor(gaps);
  const shortLine = notTheWholeQueue(gaps);
  /* "CALL" AND "DECISION" WERE THE SAME OBJECT IN TWO WORDS, one inch apart.
     The shell above this page reads "83 decisions are ready for you"
     (AppFrame.tsx), and this headline read "83 calls need you" off the same
     count at the same moment. AppFrame's own comment records that exact drift
     being fixed there against /today; the fix never reached this page, which
     is the surface the shell is counting FOR.
     "Ready for you" over "needs you" is also the more honest verb: nothing
     here has happened yet, so nothing is owed. */
  const headline = queue.isLoading
    ? "Inbox"
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
      ? "Inbox"
      : n === 0
        ? /*
           * ZERO IS THE ONE COUNT A CAP CANNOT SOFTEN, and it is also the one
           * that must not be said when a family failed to load. `notTheWholeQueue`
           * renders under this either way; what changes here is that "Nothing
           * is ready for you." is only allowed when the queue actually knows
           * that. A capped family cannot produce zero, so this reads the
           * failure case alone.
           */
          floor
          ? "Inbox"
          : "Nothing is ready for you."
        : /*
           * ── A SHAPE, NOT A TOTAL (P-56) ─────────────────────────────────
           *
           * This read `${n} decisions are ready for you.` -- 66 on the served
           * Helio Labs page, which is a wall. The same 66 are 35 design gates,
           * 10 assumption challenges, 8 decisions, 4 agent actions, 4 house
           * rules, 3 opportunities and 2 memory notes, and a person told THAT
           * knows one afternoon on one family clears half of it.
           *
           * The total is not hidden. It is the sum of what is named and every
           * part is on screen; what is gone is the number nobody can act on.
           *
           * The floor and failed-read branches above are untouched: a capped
           * read still says "at least", and a failed one still refuses to
           * assert a count at all.
           *
           * `allItems`, NEVER `visibleItems` (P-129, A-QUEUE.md). This read
           * `visibleItems.map(...)` -- the ACTIVE FILTER's own slice -- so
           * the heading narrowed to whatever tab was open while the filter
           * row's own counts stayed keyed on the whole queue. Filtered to
           * Gates, the heading would describe only the gates family and no
           * longer sum to the "All" tab beside it; on "all" the two arrays
           * happen to be the same length and the drift hid. The heading is
           * the shape of the WHOLE workload (P-56's own point: "one
           * afternoon on one family clears half of it" is a claim about
           * everything waiting, not about whichever tab is in front), so it
           * reads the same array the tab counts do.
           */
          shapeSentence(queueShape(allItems.map((i) => i.kindKey)), floor);

  /* THE THIRD FACT, which this surface used to collapse into the first. A
     person in no workspace at all was told "Nothing is ready for you.", which
     is true and useless: nothing CAN be ready, and the act that changes it is
     not a decision but a piece of setup. Only asserted once the membership read
     has actually landed and the queue itself came back empty, because several
     gate families predate workspace tenancy and are read unscoped either way,
     so a person with no workspace can still legitimately have calls waiting. */
  const needsWorkspace =
    !workspacesLoading && workspaces.length === 0 && !queue.isLoading && !queue.isError && n === 0;

  /*
   * ── THE RUN THIS CALL CAME FROM, NAMED ─────────────────────────────────
   *
   * Lane 1's fifth review, [0] and [7]: a call raised on a run reached the
   * Inbox with no way back to it, so a person could answer a gate and not watch
   * the work carry on. Lane 3 landed the link (`agent_approvals.run_id` to
   * `agent_runs.track_id`, both written by the loop) and `trackId` is on the
   * item now.
   *
   * AN ID IS NOT A DESTINATION. A door reading "Open the run" names nothing,
   * which is the defect the same review raised about doors elsewhere. The run's
   * title is what a person recognises, so this reads it -- and reads it for the
   * FOCUSED CALL ONLY, one at a time, rather than widening the queue's own read
   * to carry a title for six hundred rows that are never looked at. The queue
   * is hop-counted and this is a different question asked at a different rate.
   *
   * `getTrack` is the run screen's own read, so the title in this door and the
   * title on the page it opens come from one place and cannot drift. The door
   * degrades to nothing while the read is out and to nothing if it fails: a
   * call that cannot name its run is the ordinary pre-spine case, and this
   * surface has just been repaired for inventing a container it could not read.
   */
  const fGetTrack = useServerFn(getTrack);
  const focusedRun = useQuery({
    queryKey: ["track", focused?.trackId],
    queryFn: () => fGetTrack({ data: { trackId: focused!.trackId! } }),
    enabled: Boolean(focused?.trackId),
    staleTime: 30_000,
  });
  const runTitle = focused?.trackId ? (focusedRun.data?.title ?? null) : null;

  const focusedSince = focused ? waitingSince(focused.timestamp) : null;
  const focusedLines = focused
    ? focused.evidence.slice(0, 3).map((line: string) => stripAutoMarkers(line))
    : [];
  const focusedHidden = focused ? Math.max(0, focused.evidence.length - 3) : 0;
  // `Ask.reason` is one prose string; CallGate's `subject`, `lines` and
  // `hiddenLineCount` join into it (P-53). A cap still prints its real
  // number rather than silently dropping the rest.
  const focusedReason = focused
    ? [
        subjectOf(focused),
        ...focusedLines,
        focusedHidden > 0
          ? `${focusedHidden} further ${focusedHidden === 1 ? "line" : "lines"} not shown here.`
          : null,
      ]
        .filter(Boolean)
        .join(" ")
    : "";

  return (
    <Surface
      context={
        focused ? (
          <CallContext
            agentSlug={focused.agentSlug}
            agentName={agentDisplayName(focused.agentSlug)}
            /* NO FALLBACK. `subjectOf` returns null when the call belongs to
               no project, and its own docstring four hundred lines up forbids
               naming one anyway; this used to write "This workspace" here,
               which is the invention that rule exists to stop. `CallContext`
               now takes the null and draws the line away. */
            where={subjectOf(focused)}
            /* Only when the run is both linked AND named. A door with an id
               behind it and no words on it is not a door a person will press. */
            runHref={focused.trackId && runTitle ? `/track/${focused.trackId}` : null}
            runTitle={runTitle}
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
        {/* P-90: sr-only, see the effect above for why this is a delta rather
            than the live count itself. */}
        <p role="status" aria-live="polite" className="sr-only">
          {arrivalAnnouncement}
        </p>
        <header>
          <h1 className="text-mrd-h2 leading-mrd-tight font-medium text-mrd-ink">{headline}</h1>
          {/* THE SECOND CLAUSE EARNS ITS WORDS, and it is not decoration. The
              headline counts the WHOLE queue and the section below the gate
              counts the queue MINUS the call in the gate, so on twelve pending
              calls a reader meets "12" and then "11" two inches apart. Naming
              the split is what makes those two numbers one fact instead of a
              contradiction. Do not shorten this back to one sentence. */}
          {n > 0 ? (
            <p className="mt-mrd-3 leading-mrd-prose text-mrd-prose text-mrd-body">
              Settled in order, oldest first. The one in front of you is the one that moves, and the
              rest are listed under it.
            </p>
          ) : null}
          {/*
            WHAT THE QUEUE COULD NOT SHOW YOU, next to the number rather than
            in a log. Rendered whatever `n` is: a family that failed to load
            can leave this page reading zero, and "Nothing is ready for you"
            over a broken read is the worst sentence this surface can say.
          */}
          {shortLine ? (
            <p className="mt-mrd-3 leading-mrd-prose text-mrd-prose text-mrd-hold">{shortLine}</p>
          ) : null}
        </header>

        {allItems.length > 0 && shownFilters.length > 0 ? (
          <QueueFilters
            filters={shownFilters}
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
            error={queue.error}
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
          // P-53: `CallGate` retires into `Ask`. The presence anchor moves to
          // a plain wrapper -- `Ask` carries no `anchor` prop (no Meridian
          // edits beyond Gate's deletion) -- so this is still the first
          // object on the page a teammate's cursor can land on, same
          // kind/id source `DecisionQueue.tsx` used before it was deleted.
          <div {...presenceAnchor(`row:${focused.kindKey}`, focused.sourceId)}>
            <Ask
              // The "[auto]" marker names a call the loop raised itself and must
              // never reach the sentence being judged.
              /*
               * `questionForGate`, not `askQuestion(title)`. Both typecheck and
               * only one asks a question: a title is a statement, so the second
               * form is the glued mark again with the brand satisfied. It also
               * has to be the SAME composer the row beside it uses, or the
               * focused view and its own list word one gate two ways.
               */
              question={questionForGate(focused.kindKey, stripAutoMarkers(focused.title))}
              reason={focusedReason}
              /*
               * P-51 (A-QUEUE.md), still true through the Ask migration: this is
               * `risk`, not the declared default. It says what answering YES does
               * ("Approve · unblocks Build for this spec"), which is exactly the
               * question `risk` answers; it is not "what happens if nobody
               * answers", which this queue genuinely has none of -- these items
               * carry no expiry (see `still-holds-work.ts`'s own header: "none is
               * past an expiry that would clear them").
               *
               * THE SENTENCE IS REPLACED, NOT ARGUED WITH, when the work this
               * call held has already finished.
               *
               * "Approve · unblocks Build for this spec" is a promise the data
               * cannot always support. The number this comment used to give was
               * measured on the wrong join and is corrected here rather than
               * quietly dropped: "22 of the 29" came from matching approvals to
               * runs by `run_id`, and `gatesLiveWork` resolves through
               * `mission_id` to that mission's newest run. On that join the
               * answer today is 0 finished, 14 live and 15 with no mission at
               * all. The calls are still all 33+ days old and none is past an
               * expiry that would clear them. Printing both sentences would put
               * "approving unblocks Build" directly above "answering it now
               * releases nothing" and leave the reader to work out which is real.
               *
               * Silent when the run is live, and silent when we cannot tell --
               * see `still-holds-work.ts` for why null must never read as
               * finished.
               */
              risk={stillHoldsWork(focused.gatesLiveWork) ?? focused.approveConsequence}
              // No declared expiry (see the header comment above), so this
              // is irreversible by default: nothing runs until you answer.
              // `since` folds the age clock CallGate drew as its own
              // standalone line into the one sentence Ask has for it.
              fallback={{
                kind: "irreversible",
                since: focusedSince !== null ? stoppedFor(focusedSince, now) : null,
              }}
              answer={{
                label: "Approve",
                busy: decide.isPending,
                onPress: () => decide.mutate({ item: focused, verdict: "approve" }),
              }}
              decline={{
                label: "Decline",
                onPress: () => decide.mutate({ item: focused, verdict: "reject" }),
              }}
              // A1's ruling (P-53): Snooze is the third-answer shape P-50
              // closed -- the declared default arriving early -- so it is
              // the default line's own action, not a third button.
              fallbackAction={{
                label: "Snooze",
                busy: snooze.isPending,
                onPress: () => snooze.mutate(focused),
              }}
            />
            {/* Send back is a real fourth verb (opens the note sheet, and
                only exists on the kinds the server accepts), not the
                declared default, so it renders beside the card rather than
                folded into `fallbackAction`. */}
            {canSendBack(focused.kindKey) ? (
              <Actions>
                <Action variant="quiet" onClick={() => setSendBack(focused)}>
                  Send back
                </Action>
              </Actions>
            ) : null}
          </div>
        ) : allItems.length === 0 ? (
          /* NOTHING IS WAITING, which is good news and is drawn as such: no
             accent, no illustration, no call to action. The live line beside it
             is the one thing worth adding, because "nothing needs you" and "the
             crew is mid-run and something is coming" are different facts to
             someone deciding whether to close the tab. */
          <div className="flex flex-col gap-mrd-4">
            {/* P-63: nothing CAN be waiting until something has run, so a
                first-visit workspace's honest next step is Start, not a
                second "nothing here" apology beside the first. */}
            <ApprovalCard
              questions={[]}
              zeroAction={
                <Link to="/start" className={ACTION_LINK_FACE.default}>
                  Start a sentence
                </Link>
              }
            />
            {quietLine ? (
              <p role="status" aria-live="polite" className="text-mrd-label text-mrd-mute">
                {quietLine}
              </p>
            ) : null}
          </div>
        ) : (
          <FilterExcludedEverything
            total={allItems.length}
            label={FILTERS.find((f) => f.id === filter)?.label ?? "this filter"}
            onClearFilter={() => setFilter("all")}
          />
        )}

        <ProviderFaultNotice faults={providerFaults.data?.faults ?? []} />

        <SettledTrail lines={settled} />

        {stalled.length > 0 ? <StalledWork items={stalled} now={now} /> : null}

        <UndatedCalls calls={undated} />

        {/*
         * P-93: a bare cross-workspace number said nothing a person could act
         * on and left them to find the switcher themselves. This is the ONE
         * place a cross-workspace number is allowed to appear at all
         * (P-67's own read-names-its-workspace guard governs every other
         * surface) -- named per workspace, per `otherWorkspacesLine`'s own
         * header, and pressing it switches straight to the one that holds
         * the most.
         */}
        {otherWorkspacesLine ? (
          <button
            type="button"
            onClick={() => setActiveWorkspaceId(otherWorkspacesLine.targetWorkspaceId)}
            className="text-left text-mrd-label text-mrd-mute underline decoration-mrd-line underline-offset-2 hover:text-mrd-body"
          >
            {otherWorkspacesLine.text}
          </button>
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
                title: stripAutoMarkers(sendBack.title),
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
