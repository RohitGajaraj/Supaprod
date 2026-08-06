/**
 * Today. The front door, ported onto the rebuild primitives (step 4).
 *
 * THE DECISION THIS SURFACE OBEYS: "a brief, not an inbox and not a
 * dashboard" (session-handoff.md "What is decided"). The retired version was
 * 1543 lines and roughly twenty panels: a hero card, lanes, a triage queue, a
 * desk rail, receipts, a masthead, an onramp. That is a dashboard, and a
 * dashboard asks you to scan rather than to decide.
 *
 * So this reads top to bottom and says four things in order:
 *   what happened  ·  what needs you  ·  what was done  ·  what it learned
 *
 * VOICE: never greet, always report. The first line is a fact. The retired
 * version opened with "Good afternoon, {name}", which is exactly what the
 * convention bans.
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { approvalsQueueKey, missionsKey, invalidateShellReads } from "@/lib/query-keys";
import { isModalOpen } from "@/lib/overlay";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";

import { useWorkspace } from "@/hooks/use-workspace";
import { useSpineStrip } from "@/components/shell/use-spine-strip";
import {
  getApprovalsQueue,
  decideApprovalItem,
  snoozeApprovalItem,
  REVISABLE_KINDS,
  type ApprovalQueueItem,
} from "@/lib/approvals-queue.functions";
import { listMissions, type MissionListRow } from "@/lib/missions.functions";
import { listLearnings } from "@/lib/outcome.functions";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { openAsk } from "@/lib/ask-open";
import { FocusNext } from "@/components/today/FocusNext";
import { PushedInsights } from "@/components/today/PushedInsights";
import { stripAutoPrefix, cleanTitle } from "@/components/plan/format";
import {
  AgentMark,
  Block,
  Button,
  CtxBody,
  CtxHead,
  CtxRow,
  Door,
  Empty,
  Failed,
  Gate,
  Loading,
  Num,
  PageHead,
  Receipt,
  Record as RecordRecess,
  Row,
  Surface,
  Value,
  Who,
} from "@/components/shell/primitives";
// The verdict card below is the Critic's, so it wears what every other Critic
// verdict in the product wears: the disclosure chip, not a locally invented
// percentage. See ConfidenceDisclosureChip's header for why disclosure is
// unconditional even when confidence is high.
import { ConfidenceDisclosureChip } from "@/components/governance/ConfidenceDisclosureChip";
import { tierFromProbability } from "@/lib/confidence";
import { stillWaiting } from "@/lib/query-state";

export const Route = createFileRoute("/_authenticated/today")({
  component: Today,
  head: () => ({ meta: [{ title: "Today · Supaprod" }] }),
});

/** Plain-words relative time. Mono is applied by the row, not here. */
function ago(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return Number.isFinite(d) && d >= 0 ? d : null;
}

/**
 * Statuses that mean the crew STOPPED, rather than finished.
 *
 * `cancelMission` writes `completed_at` when a human cancels
 * (missions.functions.ts:565), which is correct as a timestamp and wrong as a
 * claim: it made a cancelled run indistinguishable from a delivered one to
 * anything that keyed on that column alone.
 */
const STOPPED = new Set(["cancelled", "halted"]);

/** Statuses that mean work is currently underway. */
const WORKING = new Set(["running", "in_progress"]);

/**
 * The verdict as a word and a tone, the same three the Critic's own chip uses
 * (CriticBadge.tsx:56-61). Kept as lookups rather than a `Record<CriticReview
 * ["verdict"], …>` because the verdict below arrives through `sessionStorage`
 * and `JSON.parse`, so at this boundary it is a string and the type system is
 * not standing behind it. Both fall back to the raw word in the quiet tone: an
 * unrecognised verdict is still the Critic's word and gets printed, it just
 * does not get to claim a colour it has not earned.
 */
const VERDICT_LABEL: Record<string, string> = { ship: "Ship", revise: "Revise", kill: "Kill" };
const VERDICT_TONE: Record<string, "pass" | "warn" | "fail"> = {
  ship: "pass",
  revise: "warn",
  kill: "fail",
};

/** "While you were gone" has to mean something, so it means the last day. */
function finishedRecently(m: MissionListRow): boolean {
  if (!m.completed_at) return false;
  return Date.now() - new Date(m.completed_at).getTime() < 86_400_000;
}

/**
 * Did this run actually FINISH, or was it stopped?
 *
 * The headline counts "N runs finished" off this block, so a cancelled run was
 * being reported to the founder as work the crew delivered overnight. The row
 * still appears in the list, because "you cancelled this" is worth seeing; it
 * just no longer counts as a finish and no longer wears the success mark.
 */
function actuallyFinished(m: MissionListRow): boolean {
  return finishedRecently(m) && !STOPPED.has(m.status);
}

/**
 * FirstRunBridge: When a user completes onboarding, their bet lands in Decide.
 * This component guides them there explicitly, connecting onboarding to first value moment.
 */
function FirstRunBridge() {
  const navigate = useNavigate();
  return (
    <Surface>
      <Block
        title="Your idea got an AI review"
        sub={
          /* THE SAME MISCREDIT, AND THIS ONE IS GUARANTEED TO SHARE A SCREEN
             WITH THE CARD THAT CONTRADICTS IT. `FirstRunBridge` mounts at :1063
             on `rows.length === 0 && criticResult`, and `criticResult` is only
             ever set by the effect gated on `justLanded` — so any render that
             mounts this also satisfies the assessment card's `justLanded &&
             criticResult` at :591. The card says "The Critic's assessment";
             this said "the AI analyst". One agent, two names, one viewport.
             "AI Analyst" is a real and different agent here — the brain's
             intelligence analyst, whose ANALYST_SYSTEM opens "You are the
             Supaprod intelligence analyst" (brain-insights.functions.ts:455) —
             and it does not run on a submitted idea. */
          <div style={{ fontSize: "var(--sp-text-meta)", color: "var(--sp-mute)" }}>
            See what the Critic found. You make the final call on whether to move forward.
          </div>
        }
      >
        <Door onClick={() => navigate({ to: "/decide" })}>See the analysis →</Door>
      </Block>
    </Surface>
  );
}

function Today() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id ?? null;

  /**
   * The seven stations, on the surface everyone lands on.
   *
   * FOUNDER RULING 2026-08-01. Today had no link to any of the seven: the rail
   * carries Today, Runs, Brain, Crew and Engine room, and the spine strip was
   * published only by loop surfaces. So the product's entire spine had exactly
   * one door from its own home page, the command palette, which is a keyboard
   * shortcut nobody has been told about yet. That is the door-missing defect on
   * the most visited screen in the app.
   *
   * `null` means no station is lit, which the strip already supports on purpose:
   * "a board opens with no stage selected, and that is a strip with nothing lit,
   * not the absence of a strip". Today is not a station, so nothing should be
   * lit; it is where you see the whole loop before choosing a part of it.
   *
   * This does revise the earlier reading that off a run there is no strip. That
   * reading came from a ruling whose actual words were "that horizontal pane,
   * always remain... right from 01 to 07. It should not collapse", which argues
   * for the strip being present, not absent. The 97px it costs buys the only
   * visible route into the loop from the front door.
   */
  useSpineStrip(null);

  const fetchQueue = useServerFn(getApprovalsQueue);
  const fetchMissions = useServerFn(listMissions);
  const fetchLearnings = useServerFn(listLearnings);
  const decide = useServerFn(decideApprovalItem);
  const snooze = useServerFn(snoozeApprovalItem);

  const queue = useQuery({
    queryKey: approvalsQueueKey(workspaceId),
    queryFn: () => fetchQueue({ data: { workspaceId: workspaceId ?? undefined } }),
  });
  const missions = useQuery({
    queryKey: missionsKey(workspaceId),
    queryFn: () => fetchMissions({ data: {} }),
  });
  const learnings = useQuery({
    queryKey: ["today", "learnings", workspaceId],
    queryFn: () => fetchLearnings(),
  });

  const items = queue.data?.items ?? [];
  const call: ApprovalQueueItem | null = items[0] ?? null;
  const rows = missions.data?.missions ?? [];
  const done = React.useMemo(
    () =>
      rows
        .filter(finishedRecently)
        .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? "")),
    [rows],
  );
  const learning = learnings.data?.[0] ?? null;

  const oldest = React.useMemo(
    () =>
      rows.reduce<string | null>(
        (min, m) => (!min || m.created_at < min ? m.created_at : min),
        null,
      ),
    [rows],
  );
  const onRecord = daysSince(oldest);

  // THE COMMIT (agents/FINAL-agent-presence.md R10). A settled call leaves a
  // receipt on the surface, never a toast. A toast confirms that your click
  // registered; a receipt renders what your click CAUSED, and judgment leaving
  // no trace is the thing the doctrine calls out by name.
  const [receipts, setReceipts] = React.useState<
    { verb: string; consequence: string; at: string; failed?: boolean }[]
  >([]);
  const stamp = () =>
    new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  const settle = useMutation({
    mutationFn: async (verdict: "approve" | "reject") => {
      if (!call) return;
      await decide({ data: { id: call.sourceId, kind: call.kindKey, verdict } });
    },
    /* THE CALL YOU JUST SETTLED KEPT ASKING, FOR THREE FULL SECONDS.
     *
     * There was no onMutate, so `call` stayed items[0] of the stale cache until
     * the refetch landed, and query-keys.ts measures that refetch at 2944 to
     * 3271ms. For that whole window the front door showed the receipt below
     * saying "You approved" while the gate directly above it still asked the
     * same question with a live Approve, Decline and Snooze. The obvious human
     * reaction is to press Approve again, which fires a second decide on an
     * already-settled item.
     *
     * Removed optimistically instead of disabling the buttons: disabling hides
     * the state, advancing it is the fix. The previous list is kept so a failed
     * write puts the call straight back, next to the receipt that says nothing
     * was recorded. */
    onMutate: async () => {
      if (!call) return { prev: undefined };
      const key = approvalsQueueKey(workspaceId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<{ items: ApprovalQueueItem[] }>(key);
      qc.setQueryData<{ items: ApprovalQueueItem[] } | undefined>(key, (old) =>
        old ? { ...old, items: old.items.filter((i) => i.id !== call.id) } : old,
      );
      return { prev };
    },
    onSuccess: (_r, verdict) => {
      setReceipts((r) => [
        {
          verb: verdict === "approve" ? "You approved" : "You declined",
          consequence:
            verdict === "approve"
              ? (call?.approveConsequence ?? "The decision is on the record.")
              : (call?.rejectConsequence ?? "Noted for next time."),
          at: stamp(),
        },
        ...r,
      ]);
      void qc.invalidateQueries({ queryKey: ["today"] });
      invalidateShellReads(qc);
    },
    // A failed write still writes a receipt, and it goes honest immediately.
    // The call comes BACK at the same time, so the surface and the receipt
    // agree: nothing was settled, and here is the thing still asking.
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(approvalsQueueKey(workspaceId), ctx.prev);
      setReceipts((r) => [
        { verb: "Nothing was recorded", consequence: e.message, at: stamp(), failed: true },
        ...r,
      ]);
    },
  });

  const defer = useMutation({
    mutationFn: async () => {
      if (!call) return;
      await snooze({ data: { id: call.sourceId, kind: call.kindKey } });
    },
    onSuccess: () => {
      setReceipts((r) => [
        {
          verb: "You snoozed it",
          consequence: "It comes back with tomorrow's brief.",
          at: stamp(),
        },
        ...r,
      ]);
      /* SNOOZE USED TO DO NOTHING YOU COULD SEE, and it was one missing line.
       *
       * `["today"]` prefix-matches only the learnings query on this page. The
       * queue this call actually lives in is `approvalsQueueKey(ws)`, which is
       * `["approvals-queue", ws]`, and the missions list is `["missions-list",
       * ws]`. Neither begins with "today", so neither refetched. With
       * refetchOnWindowFocus off and a 30s staleTime, nothing else rescued it
       * either.
       *
       * So the receipt said "You snoozed it. It comes back with tomorrow's
       * brief" while the identical call stayed on screen, still asking, and the
       * header count did not move. Pressing it again just produced a second
       * receipt. A control that reports a consequence the surface then
       * contradicts is worse than one that does nothing, because the user has
       * to work out which of the two is lying.
       *
       * `settle` directly above has always called this; `defer` was simply
       * never given it. */
      invalidateShellReads(qc);
    },
    onError: (e: Error) =>
      setReceipts((r) => [
        { verb: "Nothing was recorded", consequence: e.message, at: stamp(), failed: true },
        ...r,
      ]),
  });

  const busy = settle.isPending || defer.isPending;
  const revisable = call ? (REVISABLE_KINDS as readonly string[]).includes(call.kindKey) : false;

  // The shortcuts the gate's keycaps promise. A keycap that does nothing is a
  // lie, so they are bound here rather than drawn for looks. Bare letters, so
  // they stand down whenever focus is in a field.
  React.useEffect(() => {
    if (!call || busy) return;
    const onKey = (e: KeyboardEvent) => {
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
      if (e.key === "a") settle.mutate("approve");
      else if (e.key === "d") settle.mutate("reject");
      else if (e.key === "z") defer.mutate();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [call, busy, settle, defer]);

  /**
   * THE UNION IS THE HEADLINE'S BUSINESS AND NOBODY ELSE'S.
   *
   * One sentence assembled from two counts genuinely needs both reads, so it
   * waits for both. Every REGION below now waits on its OWN read instead: the
   * gate on the queue, the finished block on the missions list, the learning on
   * the learnings list.
   *
   * All three used to key off this union, and that is a latency bug rather than
   * a spinner bug: the queue landing first bought the user nothing, because the
   * gate stayed hidden until the SLOWER of the two returned. The thing a person
   * opens Today for is the call that needs them, and it was being held back by
   * a list of finished runs it does not depend on.
   */
  const loading = stillWaiting(queue, missions);

  /* ONBOARDING'S HANDOFF, READ ONCE. The verdict screen sets
   * `supaprod.onboarding.justLanded` and navigates here. It was written and
   * never read anywhere in the codebase, so the last step of the first run
   * handed off to a page that had no idea anyone had just arrived.
   *
   * Read in a lazy initialiser and cleared in an effect, so it survives
   * exactly one render pass of this page: refresh, or come back tomorrow, and
   * you get the ordinary front door instead of being greeted forever. Guarded
   * on `window` because this route server-renders. */
  const [justLanded] = React.useState(
    () =>
      typeof window !== "undefined" &&
      window.sessionStorage.getItem("supaprod.onboarding.justLanded") === "1",
  );
  React.useEffect(() => {
    if (justLanded) window.sessionStorage.removeItem("supaprod.onboarding.justLanded");
  }, [justLanded]);

  /**
   * THE ANALYSIS THAT CROSSES FROM ONBOARDING — AND THE FIELD THAT NEVER DID.
   *
   * This shape declared `challenges`, and there is no such field on a Critic
   * review. `CriticReview` (critic.server.ts:157-170) carries `summary`,
   * `risks` and `missing_evidence`. Onboarding held its review as
   * `useState<any>`, so `challenges: review.challenges` compiled, arrived
   * `undefined`, was dropped by `JSON.stringify`, and the "Challenges to
   * consider" block below never rendered once for anybody. What survived the
   * handoff was the lowercase verdict enum under a heading — ten seconds after
   * the same person watched a verdict stamp, a summary, named risks, missing
   * evidence and a confidence meter land on the results screen.
   *
   * This is now exactly the object ObsidianOnboarding.tsx:1126-1136 writes and
   * nothing else, so no key read here can be a key nobody sends. Every field
   * stays optional because the write is gated on `reviewHasSubstance`
   * (ObsidianOnboarding.tsx:180-193), which guarantees only that ONE of
   * summary / risks / missing_evidence carries words — so each block below
   * asks for its own content before it prints its heading.
   */
  const [criticResult, setCriticResult] = React.useState<{
    idea: string;
    verdict?: string;
    summary?: string;
    risks?: string[];
    missing_evidence?: string[];
    /** 0.0-1.0. Measured on production 2026-08-06: the 12 stored reviews range
     *  0.2-0.9, and `runCritic` clamps to [0,1] at critic.server.ts:367. */
    confidence?: number;
  } | null>(null);

  React.useEffect(() => {
    if (justLanded && typeof window !== "undefined") {
      const stored = window.sessionStorage.getItem("supaprod.onboarding.criticReview");
      if (stored) {
        try {
          setCriticResult(JSON.parse(stored));
          // Clear it after reading (one-time display)
          window.sessionStorage.removeItem("supaprod.onboarding.criticReview");
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [justLanded]);

  // The headline is a fact assembled from real counts. While loading, show
  // the date — a headline that says "Reading" advertises latency; a headline
  // that says the date tells the user they arrived. Data fills in instantly
  // from cache on revisit; on first load the brief gap is invisible because
  // the shell already provides structure.
  const headline = React.useMemo(() => {
    if (loading) return "Today";
    // THE HANDOFF FROM ONBOARDING. Read the flag before the counts, because for
    // the account that just arrived the counts are all zero and the ordinary
    // headline reads "Nothing finished overnight. Nothing needs you." three
    // seconds after the product delivered a verdict. That is true and it is a
    // terrible first sentence: it describes an absence to someone who just did
    // something. This says the same fact from the other side.
    //
    // It deliberately does NOT claim the teardown was saved. Today cannot see
    // that write, and onboarding already gates that exact claim on whether a
    // row came back (`beliefIsOnRecord`). Claiming it here from a flag that
    // only means "you navigated" would be the product asserting a receipt it
    // never checked.
    if (justLanded && criticResult) return "Your idea got an AI analysis";
    if (justLanded) return "You are set up. Nothing is running yet.";
    // Counts finishes, not stops. `done` still lists a cancelled run, because
    // seeing it is useful, but calling it a finish in the headline was the
    // product claiming work it did not do.
    const n = done.filter(actuallyFinished).length;
    const g = items.length;
    const ran =
      n === 0 ? "Nothing finished overnight" : n === 1 ? "One run finished" : `${n} runs finished`;
    // The noun, said out loud. The header 200px above counts the SAME approvals
    // queue and says "N calls need you", so a bare "N need you" here read as a
    // second, contradicting number. Same fix as the Runs board.
    const needs =
      g === 0 ? "Nothing needs you." : g === 1 ? "One call needs you." : `${g} calls need you.`;
    return `${ran}. ${needs}`;
  }, [loading, done, items.length, justLanded, criticResult]);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <Surface
      context={
        call ? (
          <>
            {/* THE AGENT THAT RAISED IT, and it opens the agent. This markup was
                hand-copied out of the primitives rather than using them, which
                is the drift CtxRow's own note names; going through the
                primitive is also what makes the door possible, because a div
                cannot take one. `/crew?agent=` is the agent's real address:
                what it may do, on whose approval, and its record. Absent when
                the queue does not say which agent raised the call, because a
                door to the whole roster is not a door to this agent. */}
            <CtxHead>Where this call came from</CtxHead>
            <CtxRow
              mark={<AgentMark slug={call.agentSlug} state="gate" />}
              name={agentDisplayName(call.agentSlug)}
              sub={call.projectName ?? call.project ?? "This workspace"}
              title={call.agentSlug ? "Open this agent in the crew" : undefined}
              onClick={
                call.agentSlug
                  ? () => navigate({ to: "/crew", search: { agent: call.agentSlug as string } })
                  : undefined
              }
            />
            {call.impact ? (
              <>
                <CtxHead>Before you decide</CtxHead>
                <CtxBody>{call.impact}</CtxBody>
              </>
            ) : null}
            {/* THE DOOR TO THE QUEUE. This counted the rest of the queue and
                gave no way to reach it, on the one surface that shows exactly
                one call at a time. /approvals IS the queue, and it is where
                the other N are. */}
            {items.length > 1 ? (
              <>
                <CtxHead>Behind this one</CtxHead>
                <CtxRow
                  name={
                    <>
                      <Num>{items.length - 1}</Num> more waiting
                    </>
                  }
                  sub="They keep their order until this call is settled."
                  title="Open the queue"
                  onClick={() => navigate({ to: "/approvals" })}
                />
              </>
            ) : null}
          </>
        ) : null
      }
    >
      <PageHead
        title={headline}
        sub={
          <>
            {today}
            {/* "On the record" names a place, and Brain is that place. It was
                a plain span on the front door: the product's own word for its
                moat, printed at you with no way in. The number is the age of
                the record, so the door is the record itself rather than the
                run the age happens to be measured from. */}
            {onRecord !== null ? (
              <>
                {" · "}
                <Door
                  title="Open the record"
                  onClick={() => navigate({ to: "/brain", search: {} })}
                >
                  <Num>{onRecord}</Num> {onRecord === 1 ? "day" : "days"} on the record
                </Door>
              </>
            ) : null}
          </>
        }
      />

      {/* POST-ONBOARDING VALUE MOMENT: Show Critic analysis result */}
      {justLanded && criticResult ? (
        <div
          style={{
            background: "var(--sp-float)",
            /* `--sp-radius-lg` and `--sp-accent` were BOTH undefined -- named
               nowhere in ink.css -- so this card rendered with square corners
               and no left border at all, while every other surface in the
               product sits on the named scale. The scale is semantic, not
               t-shirt sized: `--sp-radius-panel` is commented "record recess,
               gate detail", which is what this is.

               The stripe is deleted rather than given a colour. A coloured bar
               down the side of a card is banned outright in primitives.css, so
               defining `--sp-accent` to rescue it would have been inventing a
               token in order to break a rule. */
            borderRadius: "var(--sp-radius-panel)",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <div
                style={{
                  fontSize: "var(--sp-text-label)",
                  color: "var(--sp-mute)",
                  marginBottom: "6px",
                }}
              >
                Your idea
              </div>
              <div
                style={{ fontSize: "var(--sp-text-body)", color: "var(--sp-ink)", fontWeight: 500 }}
              >
                {criticResult.idea}
              </div>
            </div>

            {/* THE VERDICT IS A STAMP. IT WAS BEING RENDERED AS THE ASSESSMENT.
                The body of this block was `criticResult.verdict` — the raw
                lowercase database enum, in body type, under a heading calling
                it the assessment. The assessment is the Critic's sentence, and
                it now crosses the handoff (see the state shape above).

                THE HEADING NAMED THE WRONG AGENT. "AI Analyst" is a different
                agent in this product: it is the brain's intelligence analyst
                (brain-insights.functions.ts:437-455, whose prompt opens "You
                are the Supaprod intelligence analyst"), and it never ran here.
                What produced this verdict is the Critic — what onboarding
                called it on the screen this person was looking at ten seconds
                ago, and what every other verdict surface in the product calls
                it. */}
            {criticResult.verdict || criticResult.summary?.trim() ? (
              <div>
                <div
                  style={{
                    fontSize: "var(--sp-text-label)",
                    color: "var(--sp-mute)",
                    marginBottom: "6px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <span>The Critic&rsquo;s assessment</span>
                  {criticResult.verdict ? (
                    <Value tone={VERDICT_TONE[criticResult.verdict] ?? "quiet"}>
                      {VERDICT_LABEL[criticResult.verdict] ?? criticResult.verdict}
                    </Value>
                  ) : null}
                  {/* `confidence` crossed the handoff from the first day and was
                      read by nothing, so the animated meter the user watched on
                      the results screen became silence one navigation later. */}
                  {typeof criticResult.confidence === "number" ? (
                    <ConfidenceDisclosureChip
                      confidence={criticResult.confidence}
                      tier={tierFromProbability(criticResult.confidence)}
                    />
                  ) : null}
                </div>
                {criticResult.summary?.trim() ? (
                  <div
                    style={{
                      fontSize: "var(--sp-text-body)",
                      color: "var(--sp-ink)",
                      lineHeight: 1.6,
                    }}
                  >
                    {criticResult.summary}
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* THE BLOCK THAT HAS NEVER RENDERED, GIVEN THE DATA IT ALWAYS WANTED.
                It asked for `criticResult.challenges` — a field no Critic
                review has ever carried — so for every account that has ever
                finished onboarding, this heading and this list were dead. It
                reads `risks` now, which is the thing it was describing, and it
                is titled what the results screen titled the same three
                sentences ten seconds earlier (ObsidianOnboarding.tsx:1749), so
                the analysis does not get renamed on the way over.
                Blank entries are dropped rather than printed as empty bullets:
                `reviewHasSubstance` promises only that ONE of summary / risks /
                missing_evidence carries words, never that every entry does. */}
            {(criticResult.risks ?? []).some((r) => r.trim().length > 0) ? (
              <div>
                <div
                  style={{
                    fontSize: "var(--sp-text-label)",
                    color: "var(--sp-mute)",
                    marginBottom: "8px",
                  }}
                >
                  Key risks
                </div>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "20px",
                    color: "var(--sp-mute)",
                    fontSize: "var(--sp-text-meta)",
                  }}
                >
                  {(criticResult.risks ?? [])
                    .filter((r) => r.trim().length > 0)
                    .slice(0, 3)
                    .map((risk, i) => (
                      <li key={i} style={{ marginBottom: "4px" }}>
                        {risk}
                      </li>
                    ))}
                </ul>
              </div>
            ) : null}

            {/* The third thing the results screen showed and the handoff never
                carried. One item, which is what that screen shows
                (ObsidianOnboarding.tsx:1772), under the same heading.

                THE MEASUREMENT ON THIS LINE WAS WRONG AND IS CORRECTED, NOT
                DELETED. It read: "Measured on production 2026-08-06: of the 12
                stored reviews, 4 name missing evidence (1 to 5 items) and 8
                name none, so this block is quiet more often than not." Every
                one of those figures is wrong. Re-measured through the Lovable
                MCP on 2026-08-06, the same day the sentence was written:

                  select count(*) filter (where jsonb_array_length(
                           critic_review->'missing_evidence') > 0) as names_some,
                         count(*) filter (where jsonb_array_length(
                           critic_review->'missing_evidence') = 0) as names_none,
                         min(...) , max(...)
                  from opportunities
                  where critic_review is not null
                    and critic_review ? 'missing_evidence';

                returns names_some 12, names_none 0, min length 3, max length 5,
                and all 12 carry at least one non-blank entry. So this block is
                LOUD, not quiet: it renders for every review today's `runCritic`
                writes. (47 opportunities carry a critic_review in total; the
                other 35 are a legacy shape with no missing_evidence key at all
                and never reach this card, which reads only what onboarding put
                in sessionStorage seconds earlier.)

                The `.some(...)` guard below is unaffected and stays. It is
                correct whichever way the data falls, and it is the reason a
                heading can never print over an empty line — which is a property
                of the code, not of today's row counts. */}
            {(criticResult.missing_evidence ?? []).some((m) => m.trim().length > 0) ? (
              <div>
                <div
                  style={{
                    fontSize: "var(--sp-text-label)",
                    color: "var(--sp-mute)",
                    marginBottom: "8px",
                  }}
                >
                  What you need to test
                </div>
                <div
                  style={{
                    color: "var(--sp-mute)",
                    fontSize: "var(--sp-text-meta)",
                    lineHeight: 1.5,
                  }}
                >
                  {(criticResult.missing_evidence ?? []).filter((m) => m.trim().length > 0)[0]}
                </div>
              </div>
            ) : null}

            <div style={{ display: "flex", gap: "8px", paddingTop: "8px" }}>
              <Button variant="primary" onClick={() => navigate({ to: "/decide" })}>
                See analysis →
              </Button>
              {/* "A CONTROL'S LABEL IS A PROMISE ABOUT THE CLICK" (AppFrame.tsx:505).
                  This one promised another idea and delivered only the loss of
                  this one. `setCriticResult(null)` is not wrong — it swaps this
                  card for the ask composer in the other arm of this ternary,
                  which is where an idea gets typed — but the composer is a card
                  with a button on it, so the click that said "try another idea"
                  ended with the user hunting for a second control, having just
                  destroyed the verdict permanently — the effect that loads this
                  card removes the sessionStorage key as it reads it, so nothing
                  on this page or any other brings it back.
                  Opening Ask is the promise kept: the composer is under the
                  cursor, not one more click away. `openAsk` was already
                  imported in this file and called from three other buttons on
                  this same screen, and it is deliberately called with no intent
                  — the next idea is the person's to type, and passing one here
                  would submit a turn they did not write. */}
              <Button
                variant="ghost"
                onClick={() => {
                  setCriticResult(null);
                  openAsk();
                }}
              >
                Try another idea
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* PRIMARY INTERFACE: Ask bar (agentic-first entry point).
              `data-page-composer` is how the global dock knows to stand down.
              See shell.css: two identical prompts on one screen, 500px apart,
              is the friction this marker removes. */}
          <div
            data-page-composer
            style={{
              background: "var(--sp-float)",
              border: "1px solid var(--sp-line)",
              /* THE PRIMARY INTERFACE WAS THE ONE SQUARE OBJECT ON THE PAGE.
                 `--sp-radius-lg` is defined nowhere, so this resolved to 0 --
                 and it has a visible 1px border, which makes hard corners
                 unmissable next to 10 and 12px everywhere else. `--sp-radius-card`
                 is commented, in ink.css, "agent card, ask composer". This IS
                 the ask composer; the token was always there. */
              borderRadius: "var(--sp-radius-card)",
              padding: "20px",
              marginBottom: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div
              style={{ fontSize: "var(--sp-text-label)", color: "var(--sp-mute)", fontWeight: 500 }}
            >
              What should we build?
            </div>
            <Button
              variant="primary"
              onClick={() => openAsk()}
              style={{
                width: "100%",
                padding: "12px 16px",
                fontSize: "var(--sp-text-body)",
                textAlign: "left",
                justifyContent: "space-between",
                display: "flex",
              }}
            >
              <span>Tell Supaprod what to build...</span>
              <span
                style={{
                  fontFamily: "var(--sp-font-mono)",
                  fontSize: "var(--sp-text-kbd)",
                  marginLeft: "12px",
                  flexShrink: 0,
                }}
              >
                ⌘K
              </span>
            </Button>
            <div
              style={{ fontSize: "var(--sp-text-meta)", color: "var(--sp-mute)", lineHeight: 1.5 }}
            >
              Describe a feature, ask a question, or submit an idea. AI agents will analyze it,
              suggest next steps, and build what you approve.
            </div>
          </div>
        </>
      )}

      {/* THE BRAIN LEADS. It sits above the gate on purpose: the gate is what is
          waiting on YOU, and this is what the product thinks you should do next
          and why. A director that speaks only after you have cleared your inbox
          is not directing. Renders nothing at all when the ranking has no clear
          answer, so a quiet workspace is quiet. See FocusNext.tsx for why this
          had no door until now. */}
      <FocusNext />

      {/* WHAT NOBODY ASKED ABOUT, under what the brain would work on next and
          above the gate. FocusNext answers a question; these are the things the
          product volunteered while you were elsewhere -- a bet contradicted by
          new evidence, a calibration miss. Both are layer 01, and the
          unprompted half is the one that makes it a director rather than a
          search box. Renders nothing when there is nothing. */}
      <PushedInsights />

      {call ? (
        <Gate
          // The stored title carries a machine "[auto]" origin prefix when the
          // loop raised it. That is provenance, not copy, and it must never
          // reach the one sentence the human is asked to judge.
          question={stripAutoPrefix(call.title)}
          // Attribute the evidence without moving it away from the question it
          // answers. See Gate: a change that lifted these lines into a titled
          // block AFTER the Gate put the reasoning below the Approve button, so
          // a person was asked to decide above the reasons for deciding.
          linesLabel={call.evidence.length > 0 ? "Why the crew raised this" : undefined}
          lines={[
            ...call.evidence
              .slice(0, 3)
              .map((line, i) => <span key={`ev-${i}`}>{stripAutoPrefix(line)}</span>),
            // Never truncate in silence. Three is what a glance holds; when
            // there is more, say how much and where the rest of it is.
            ...(call.evidence.length > 3
              ? [
                  <span key="more">
                    {call.evidence.length - 3} more{" "}
                    {call.evidence.length - 3 === 1 ? "fact" : "facts"} on this call, in Approvals.
                  </span>,
                ]
              : []),
            <span key="consequence">{call.approveConsequence}</span>,
          ]}
        >
          <Button
            variant="primary"
            shortcut="a"
            disabled={busy}
            onClick={() => settle.mutate("approve")}
          >
            Approve
          </Button>
          {revisable ? (
            <Button
              disabled={busy}
              onClick={() => navigate({ to: "/approvals" })}
              title="Send it back with a note"
            >
              Send back
            </Button>
          ) : null}
          <Button shortcut="d" disabled={busy} onClick={() => settle.mutate("reject")}>
            Decline
          </Button>
          <Button variant="ghost" shortcut="z" disabled={busy} onClick={() => defer.mutate()}>
            Snooze
          </Button>
        </Gate>
      ) : stillWaiting(queue) ? (
        /* THE THIRD FACT, and the front door was the one surface missing it.
         *
         * `loading ? null` drew nothing where the biggest element on the screen
         * goes, so for the whole of a cold read Today was a headline over a
         * rule, and a screen reader was handed silence. Neither of the two
         * branches below is usable here: "Nothing is waiting on you" and
         * "Cannot reach the queue" are both claims, and at this moment neither
         * is known. Loading is the primitive for precisely that gap, it carries
         * the live region, and it reserves its own height so the gate arriving
         * pushes nothing around.
         *
         * It states what it is READING, in this surface's own words (the header
         * says "N calls need you"), and it says nothing about how long that
         * takes. Advertising latency is what surface-discipline bans outright. */
        <Loading>Reading what needs you.</Loading>
      ) : queue.isError ? (
        // A failed read is not an empty queue. `items` falls back to [] on error,
        // so without this branch the front door told a user "Nothing is waiting on
        // you" at the exact moment it had no idea what was waiting. That is the
        // worst sentence in the product to get wrong: it is the one thing Today
        // exists to say, and being confidently wrong about it teaches the user
        // that the surface cannot be trusted when it is quiet.
        <Gate question="Cannot reach the queue right now.">
          <Failed onRetry={() => queue.refetch()}>
            Your calls are safe, this screen just could not load them.
          </Failed>
        </Gate>
      ) : (
        <Gate question="Nothing is waiting on you.">
          <Button variant="primary" onClick={() => openAsk()}>
            Ask Supaprod what to build
          </Button>
        </Gate>
      )}

      {receipts.length > 0 ? (
        // THE RECEIPTS GO SOMEWHERE NOW. A receipt on this page is the trace of
        // a judgment made in this session and it vanished on reload, which
        // taught exactly what the receipt doctrine exists to prevent: that your
        // judgment left no lasting trace. The Record room is where every
        // receipt is kept, sealed, with the chain behind it. The door is on the
        // block rather than on each line because the block is the set, and
        // an individual settled item has no address of its own: `decideApprovalItem`
        // fans out across ten different kinds and only some of them land
        // somewhere a person can open.
        <Block
          title="What you settled"
          more="Every receipt"
          onMore={() => navigate({ to: "/engine-room", search: { room: "record" } })}
        >
          {receipts.map((r, i) => (
            <Receipt
              key={i}
              verb={r.verb}
              consequence={r.consequence}
              time={r.at}
              failed={r.failed}
            />
          ))}
        </Block>
      ) : null}

      {/* Agent Activity Ticker: Show currently running/in-progress missions */}
      {(() => {
        const running = rows.filter((m) => WORKING.has(m.status));
        if (running.length === 0) return null;

        return (
          <Block title="Agents working now">
            {running.map((mission) => {
              const elapsed = ago(mission.created_at);
              const agent = mission.current_agent_slug
                ? agentDisplayName(mission.current_agent_slug)
                : "The crew";
              return (
                <Row
                  key={mission.id}
                  lead={stripAutoPrefix(mission.title)}
                  sub={`${agent} · ${elapsed} running`}
                  onClick={() => navigate({ to: `/runs/${mission.id}` })}
                />
              );
            })}
          </Block>
        );
      })()}

      <Block
        title="Done without you"
        more={rows.length ? `All ${rows.length} runs` : undefined}
        onMore={() => navigate({ to: "/runs" })}
      >
        {stillWaiting(missions) ? (
          // The block head already renders its title, so this fills the body
          // rather than leaving a heading standing over a void. It is deliberately
          // the same subject as the Failed line just below: "Reading what the crew
          // finished" then "Could not load what the crew finished" is one topic
          // told twice, honestly, and the reader never has to reconcile them.
          <Loading>Reading what the crew finished.</Loading>
        ) : missions.isError ? (
          // Same rule as the Gate above: a read that failed must not be reported
          // as a day where nothing happened.
          <Failed onRetry={() => missions.refetch()}>Could not load what the crew finished.</Failed>
        ) : done.length === 0 ? (
          <>
            {/* GATED ON THE REVIEW, not on an empty queue. This mounted on
                `rows.length === 0` alone, which says nothing about a Critic:
                anyone who skipped onboarding, or whose Critic call degraded,
                was told on the front door that "Your idea got an AI review"
                when none had run. It also duplicated the honest card above
                (:591 — "340 lines above" when that sentence was written; the
                comment work since has pushed the two further apart, so the line
                is cited instead of a distance), which renders from the same
                stored result and says the same thing when there IS one. One
                fact, one claim, one place. */}
            {rows.length === 0 && criticResult ? <FirstRunBridge /> : null}
            <Empty
              action={
                <Button variant="ghost" onClick={() => openAsk()}>
                  Ask Supaprod
                </Button>
              }
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  Nothing finished in the last day yet. The crew is ready. Tell Supaprod what you
                  want to build, or connect data sources so they discover work.
                </div>
                <div style={{ fontSize: "var(--sp-text-meta)", color: "var(--sp-mute)" }}>
                  <strong>Here's how it works:</strong> You submit an idea. AI agents analyze it,
                  suggest next steps, and build what you approve. They handle planning, design,
                  building, and shipping. You make all the calls. Most work finishes overnight.
                </div>
              </div>
            </Empty>

            {rows.length === 0 && !justLanded ? (
              <Block title="Get started in three steps">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    padding: "12px 0",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: "600",
                        marginBottom: "6px",
                        color: "var(--sp-ink)",
                      }}
                    >
                      1. Submit an idea for analysis
                    </div>
                    {/* THE SAME MISCREDIT, THE SAME STATION, A DIFFERENT VISIT.
                        The assessment card above used to head the Critic's own
                        verdict "AI Analyst's assessment"; this step described
                        the same flow, behind the same "See analysis →" door to
                        the same /decide route, in the same wrong agent's name.
                        Not literally the same viewport — this block is gated on
                        `!justLanded` and the card on `justLanded`, so they take
                        turns rather than stack — but it is the same screen on
                        the visit after, and a person who read one then the
                        other was told two names for one agent.
                        "AI Analyst" is a real and DIFFERENT agent here — the
                        brain's intelligence analyst, whose ANALYST_SYSTEM opens
                        "You are the Supaprod intelligence analyst"
                        (brain-insights.functions.ts:455) and which volunteers
                        predictions and risk flags from the decision graph. It
                        does not run on an idea you submit. The Critic does:
                        /decide's "Challenge it" runs it (no line cited — that
                        file is being edited by another lane as this ships), and
                        onboarding runs it ten seconds after signup behind "Get
                        the Critic's take" (ObsidianOnboarding.tsx:1619).
                        agent-vocabulary.ts:75 gives it this exact verb —
                        `{ name: "Critic", verb: "challenges" }`. Renamed here
                        so the front door names one agent one way. */}
                    <div style={{ fontSize: "var(--sp-text-meta)", color: "var(--sp-mute)" }}>
                      The Critic challenges your thinking and suggests next steps. You decide
                      whether to proceed, refine, or pass.
                    </div>
                    <div style={{ marginTop: "8px" }}>
                      <Door onClick={() => navigate({ to: "/decide" })}>See analysis →</Door>
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontWeight: "600",
                        marginBottom: "6px",
                        color: "var(--sp-ink)",
                      }}
                    >
                      2. Connect your data (optional)
                    </div>
                    <div style={{ fontSize: "var(--sp-text-meta)", color: "var(--sp-mute)" }}>
                      Link Slack channels, support tickets, or feedback sources. The AI will scan
                      for new opportunities and bring them to your attention automatically.
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontWeight: "600",
                        marginBottom: "6px",
                        color: "var(--sp-ink)",
                      }}
                    >
                      3. Watch AI agents execute and learn
                    </div>
                    <div style={{ fontSize: "var(--sp-text-meta)", color: "var(--sp-mute)" }}>
                      Once you approve, AI agents plan the work, design it, build it, and ship it.
                      You see every step. Results teach the system for next time.
                    </div>
                  </div>
                </div>
              </Block>
            ) : null}
          </>
        ) : (
          done.slice(0, 6).map((m) => (
            <Row
              key={m.id}
              // Every run on this block rendered state="idle", so MarkState
              // "verified" existed solely to show a win and was never once used:
              // Today could shout a loss and had no way to show a success.
              /* A CANCELLED RUN WAS WEARING THE GREEN SUCCESS MARK.
               *
               * This ternary sent everything that was not `failed` or
               * `completed_with_failures` to `verified`, and the block it sits in
               * selects on `completed_at` alone (finishedRecently, above).
               * `cancelMission` writes `status:"cancelled", completed_at: now`
               * (missions.functions.ts:565), so a run the human deliberately
               * stopped arrived here, was painted green, and was counted in the
               * headline as one of the runs that finished. `halted` did the same.
               *
               * That breaks the primitive's own written contract: verified "IS
               * NOT done... A run that claims done with nothing behind it stays
               * neutral, because painting every finished run green would be the
               * product asserting success it never checked." Colour carries
               * status here, so green has to mean a real outcome and nothing
               * else. Stopped work is neutral, not a win and not a failure. */
              /* EVERY AGENT ON THE FRONT DOOR WAS ANONYMOUS, AND THE BLOCK
               * EXISTS TO PROVE NAMED AGENTS WORKED WHILE YOU SLEPT.
               *
               * `slug` was hard-coded null, so the mark fell to the Unknown
               * glyph and `agentDisplayName(null, m.build_driver)` made the
               * title and the aria-label the value of `build_driver`. Measured
               * on production 2026-08-06: `select build_driver, count(*) from
               * missions group by 1` returns exactly one row, `native / 331`.
               * Every finished run, without exception, hovered as "native" and
               * was read aloud as "native, verified" — an internal mechanism
               * word, on the screen whose whole claim is that named agents did
               * this.
               *
               * `current_agent_slug` is on the same `MissionListRow` and the
               * working-runs block on this very page already reads it (:983).
               * It is not `missions.current_agent_id`
               * (a uuid that is not reliably maintained); `listMissions` fills it
               * from `agent_runs.agent_slug` on the mission's latest run
               * (missions.functions.ts:254), which is written by the thing that
               * actually runs. Measured the same day: of the 28 missions with a
               * `completed_at`, 27 resolve a slug and 1 does not. The eight
               * slugs that appear are builder, discovery-scout, release,
               * competitor-watcher, data-analyst, orchestrator, critic and
               * ux-architect, and SPECIALIST_CATALOG places every one of them
               * (agent-vocabulary.ts:212-589), so those rows read Engineer,
               * Watch, Announce, Measure, Chief of Staff, Challenge and Design,
               * each in its own station's hue and glyph, instead of one machine
               * word behind the Unknown mark.
               *
               * `name` stays exactly as it was, and it is what makes that
               * twenty-eighth row safe: `agentDisplayName` falls through to it
               * when the catalog cannot place a slug, so the one run with no
               * agent_slug renders precisely what it renders today. This adds a
               * name where there was none and removes none. */
              marks={
                <AgentMark
                  slug={m.current_agent_slug}
                  name={m.build_driver}
                  state={
                    m.status === "failed"
                      ? "failed"
                      : m.status === "completed_with_failures" ||
                          m.status === "cancelled" ||
                          m.status === "halted"
                        ? "idle"
                        : "verified"
                  }
                />
              }
              lead={<Who>{cleanTitle(m.title)}</Who>}
              sub={
                <>
                  {m.hop_count > 0 ? (
                    <>
                      <Num>{m.hop_count}</Num> {m.hop_count === 1 ? "handoff" : "handoffs"}
                      {" · "}
                    </>
                  ) : null}
                  {/* Three outcomes, three tones. A partial used to be painted in
                      the same red as an outright failure, which taught the eye to
                      read "some of it landed" as "none of it landed"; warn is
                      exactly what a partial is. A clean run used to render the raw
                      database word in body grey, so the one thing worth celebrating
                      was also the least visible thing on the row. */}
                  {m.status === "failed" ? (
                    <span className="sp-fail">failed</span>
                  ) : m.status === "completed_with_failures" ? (
                    <span className="sp-warn">partial</span>
                  ) : m.status === "completed" ? (
                    <span className="sp-pass">done</span>
                  ) : (
                    m.status
                  )}
                </>
              }
              time={ago(m.completed_at)}
              onClick={() => navigate({ to: "/runs/$missionId", params: { missionId: m.id } })}
            />
          ))
        )}
      </Block>

      {stillWaiting(learnings) ? (
        /* NO BLOCK AROUND THIS ONE, and that is the whole point of writing it
         * out. The block's title is "It learned one thing", which is a CLAIM:
         * printing it before the read lands asserts a learning exists when
         * nobody yet knows whether one does. So the wait is the bare fact, and
         * the title arrives with the thing it describes. */
        <Loading>Reading what it learned.</Loading>
      ) : learnings.isError ? (
        // Same rule the Gate and the block above already obey: a read that
        // failed is not a record that learned nothing. This branch rendered
        // nothing at all, so an unreachable brain and a quiet one looked
        // identical on the one surface that is supposed to tell them apart.
        <Failed onRetry={() => learnings.refetch()}>Could not load what it learned.</Failed>
      ) : learning?.summary ? (
        <Block title="It learned one thing">
          <RecordRecess
            // THE RECESS OPENS THE OUTCOME. This is the one lit surface in the
            // product and on the front door it was inert: a claim about what
            // the record learned, with no way to read the outcome behind it.
            // Brain's Outcomes tab takes the learning id it already has, which
            // is the same drill CompoundingPanel's own rows use, so the two
            // doors cannot drift.
            title="Open this outcome in the record"
            onClick={() =>
              navigate({ to: "/brain", search: { tab: "learnings", learning: learning.id } })
            }
            evidence={
              <>
                {learning.recorded_by_agent_slug
                  ? `${agentDisplayName(learning.recorded_by_agent_slug)} recorded it`
                  : "Recorded"}
                {learning.created_at
                  ? ` · ${new Date(learning.created_at).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                    })}`
                  : ""}
              </>
            }
          >
            {learning.summary}
          </RecordRecess>
        </Block>
      ) : null}
    </Surface>
  );
}
