import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Action,
  Door,
  NothingHere,
  Num,
  PageHeading,
  ReadFailedLine,
  Reading,
  RecordSpeaks,
  Region,
  Value,
} from "@/components/meridian/surface-parts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import * as React from "react";

import { SendBackSheet } from "@/components/approvals/SendBack";
import { ConfidenceDisclosureChip } from "@/components/governance/ConfidenceDisclosureChip";
import { AgentInbox, type AgentSession } from "@/components/meridian/AgentInbox";
import { NeedsSetup } from "@/components/meridian/NeedsSetup";
import { taskStatus } from "@/components/meridian/TaskRows";
import { AskComposer } from "@/components/today/AskComposer";
import { DecisionQueue } from "@/components/today/DecisionQueue";
import { FocusNext } from "@/components/today/FocusNext";
import { PushedInsights } from "@/components/today/PushedInsights";
import { QuietMorning } from "@/components/today/QuietMorning";
import { RunState, ShippedState } from "@/components/today/RunState";
import { ago, daysSince, withinLastDay } from "@/components/today/when";
import { useSpineStrip } from "@/components/shell/use-spine-strip";
import { useSelection } from "@/components/shell/use-selection";
import { Receipt } from "@/components/meridian/Receipt";
import { Surface } from "@/components/meridian/Surface";
import { stripAutoPrefix, cleanTitle } from "@/components/plan/format";
import { useConfirm } from "@/hooks/use-confirm";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  getApprovalsQueue,
  decideApprovalItem,
  snoozeApprovalItem,
  type ApprovalQueueItem,
  type ApprovalsQueueResult,
} from "@/lib/approvals-queue.functions";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { openAsk } from "@/lib/ask-open";
import { tierFromProbability } from "@/lib/confidence";
import { cancelMission, listMissions, type MissionListRow } from "@/lib/missions.functions";
import { listLearnings } from "@/lib/outcome.functions";
import { approvalsQueueKey, missionsKey, invalidateShellReads } from "@/lib/query-keys";
import { stillWaiting } from "@/lib/query-state";
import "@/styles/today.css";

/**
 * TODAY. The screen a person opens after the crew worked without them.
 *
 * WHAT IT IS FOR, stated once so every decision below can be checked against
 * it: this surface ALLOCATES ATTENTION. It does not display output. The
 * binding constraint on an agentic product is not screen space, it is human
 * cognition — an operator running four agents in parallel is spent by
 * 11 a.m. — so a morning brief earns its place by deciding what NOT to show.
 * Triage by exception, never review-everything.
 *
 * FOUR THINGS FOLLOW, AND THEY ARE THE WHOLE DESIGN.
 *
 * 1. ONE SENTENCE CARRIES THE MORNING. A greeting, then one line that is a
 *    count and a verb: "3 decisions are ready for your review. 1 run is
 *    stuck." Everything below it is the reader confirming what that line
 *    already told them. It is the highest-leverage element on the surface and
 *    it is written in the operator's own vocabulary, not the product's — the
 *    words are the ones measured most frequent across 5.72M words of real
 *    product-operator conversation ("decisions" 562.8 per million, "review"
 *    232.1, "ready" 160.3, "stuck" 95.8, "shipped" 36.2). The words that
 *    sound right and are not spoken — "receipt", "unattended", "audit trail",
 *    all under 3 per million — appear nowhere in this file's copy.
 *
 * 2. EVERY SECTION IS NAMED FOR WHO IS BLOCKED, NOT FOR WHAT THE OBJECT IS.
 *    "Ready for your review", "Waiting on you", "Running", "Finished" — each
 *    says whose move it is. A section sorted by object type ("Missions",
 *    "Approvals", "Insights") makes the reader do the translation into "so
 *    what do I do", every morning, forever.
 *
 *    HOW IT IS DRAWN CHANGED ON 2026-08-22 AND THE RULE DID NOT. Three of the
 *    four lanes — Shipped, Stuck, Still running — were grouped by OUTCOME, which
 *    is the same list one step short of the rule: it says what the machine did
 *    and leaves the reader to work out whose move it is. They are now one
 *    `AgentInbox`, whose groups ARE the four needs and whose order is the need.
 *    "Ready for your review" stays its own lane, because the approvals queue it
 *    holds carries walk mode, bulk verbs and send-back, and an inbox row is not
 *    those things. See the note on `crew` for the fact-by-fact account of
 *    everything the three lanes carried and where each thing went.
 *
 * 3. IT RENDERS AT ZERO, and that is deliberate rather than an oversight.
 *    "Ready for your review — nothing is waiting on you" is the best sentence
 *    this product can show a person, and a quiet morning is the only chance it
 *    gets to teach the names while nothing is at stake. This is not the
 *    zero-tile the research warns about: a tile reading "0" is a number with
 *    no taxonomy attached, information that changes nothing you do. A section at
 *    zero names who is blocked, and "nobody" is the answer the reader came for.
 *    An empty GROUP inside the inbox draws nothing at all, so the assurances it
 *    would have made — nothing stopped, no agent is working, nothing went live —
 *    are collected and said once on the region's own line instead.
 *
 * 4. THE ORDER IS REVERSIBILITY, NOT RECENCY AND NOT PRIORITY. The morning
 *    question is not "what matters most", it is "what is hardest to undo".
 *    Inside the run inbox that is exactly the need order it already sorts by,
 *    read from the other end: what needs you cannot be undone until you act,
 *    what is finished is live and undoing it costs a rollback, and what is
 *    running has not happened at all. VISUAL weight stays call-first: the open
 *    call is the only Gate on the page, and everything else is a scan band.
 *
 * WHAT THIS SURFACE MUST NEVER CLAIM. It sharpens the reader's call; it never
 * says it handled anything. Every consequence printed here comes from the item
 * itself, never from a sentence written in this file about what an approval
 * generally does.
 */

export const Route = createFileRoute("/_authenticated/today")({
  component: Today,
  head: () => ({ meta: [{ title: "Today · Supaprod" }] }),
  /**
   * THE FRONT DOOR HAD NO FLOOR UNDER IT.
   *
   * Every read on this surface is guarded, and a guarded read is not the only
   * way a page dies. A throw anywhere in the render tree below -- a mission row
   * with a shape the formatter did not expect, a queue item missing a field a
   * child dereferences -- landed on the router's own default, on the one screen
   * a person opens first and the one screen that is supposed to tell them
   * whether their morning is clear. Seven surfaces carry this boundary and this
   * was the only one without it.
   *
   * IT SAYS WHAT IS STILL TRUE, then offers the way out. A page that failed to
   * draw is not a record that lost anything, and the first thing a person needs
   * to know is which of the two happened. `reset` re-renders the tree rather
   * than reloading the tab, so a retry costs nothing and keeps the session.
   */
  errorComponent: ({ error, reset }) => (
    <Surface wide>
      {/* THE RHYTHM IS STATED HERE, BECAUSE NOTHING ELSE STATES IT ANY MORE.
          This was a `PageHead` over a `Block`, and the block reserved 36px above
          itself plus 28px inside. Meridian's `Region` reserves nothing on the
          founder's ruling (see the head of `today.css`), so a branch that
          returns two siblings has to say what sits between them. 40px, the
          number that ruling names, and the same gap the sheet gives every
          section of the surface this branch replaces.

          The `Region` that used to wrap the message is gone rather than ported.
          It carried no title, so it rendered an empty section wrapper, and the
          message needs a container of its own here anyway: this branch IS the
          whole surface, which is the one case `NothingHere` is for rather than
          `NothingYet`. Its `action` slot is where the retry belongs. */}
      <div className="flex flex-col gap-mrd-7">
        <PageHeading
          title="Today did not open."
          sub="Whatever the crew did overnight is still on the record. This is the page failing to draw it."
        />
        <NothingHere
          action={
            <Action variant="primary" onClick={reset}>
              Try again
            </Action>
          }
        >
          {(error as Error)?.message ?? "The reason did not come back with the error."}
        </NothingHere>
      </div>
    </Surface>
  ),
});

/* The four states a run can be in that this surface has a lane for. Anything
   not listed is in flight in a way the reader cannot act on, and saying so
   would be four more words for no decision. `completed_with_failures` counts
   as LIVE and is labelled "partial" on its row: it shipped, and the hole in it
   is a fact about the thing that shipped, not a different lane. */
const LIVE = new Set(["completed", "done", "completed_with_failures"]);
const STUCK = new Set(["failed", "halted", "cancelled", "blocked"]);
/* Deliberately NOT `queued` or `dispatched`. A queued run has no agent on it,
   and "Still running" would then be claiming work that has not started. */
const WORKING = new Set(["running", "in_progress"]);

/**
 * HOW MANY ROWS OF A GROUP STAND OPEN, AND WHAT HAPPENS TO THE REST.
 *
 * Measured in a browser on 2026-08-11 at 1280: the Shipped lane printed
 * "4 live and waiting on nobody" over exactly THREE rows, under a door
 * labelled only "Open Runs". Every lane did the same thing -- the subtitle
 * counted the whole set and the body rendered `slice(0, 3)` -- so the count and
 * the list disagreed on screen and nothing on the surface reconciled them. A
 * reader either reads three and distrusts the four, or reads four and hunts
 * for the row that is not there.
 *
 * The three stays, because this surface is a scan band and not a list. What has
 * changed twice is where the other rows go:
 *
 *   2026-08-11  a door that named them: "Open Runs · 1 more". It closed the
 *               contradiction and it still made you leave the page to see one
 *               row.
 *   2026-08-22  `AgentInbox`'s `maxPerGroup`. The group heading counts every row
 *               it holds, the control under it says how many are behind it, and
 *               pressing it opens them WHERE THEY STAND. Nothing is hidden and
 *               nobody navigates, so the door and the arithmetic that fed it are
 *               both gone.
 */
const LANE_ROWS = 3;

/**
 * THE HEADING NAMES THE ROW ON SCREEN, NOT THE SIZE OF THE RECORD.
 *
 * It read "It learned one thing" over `learnings[0]`, which is the newest of
 * however many there are. On the demo workspace the record holds eight, so the
 * one surface a visitor meets first was undercounting the record by seven and
 * making the brain sound thinner than it is -- the exact opposite of the claim
 * this station carries. It is also the arm the failed read did not share, so
 * the section changed its name depending on how the fetch went.
 *
 * The honest version is a superlative rather than a count: true at one
 * learning, true at eight hundred, and it never has to be re-checked against
 * what `listLearnings` happens to return.
 */
const LEARNING_BLOCK = "The last thing it learned";

const VERDICT_LABEL: Record<string, string> = { ship: "Ship", revise: "Revise", kill: "Kill" };
/**
 * THREE VERDICTS, TWO COLOURS, AND THAT IS THE WHOLE POINT.
 *
 * `revise` used to take the "warn" tone, which resolves to gold. Gold IS
 * BANNED, and this is not an absence to be filled in: founder ruling
 * 2026-08-14 removed yellow, mustard, amber and gold from the entire system.
 * There is no warn token because there must not be one, so do not add one to
 * meridian.css to give this a third hue. Ship and kill are OUTCOMES and get
 * green and red, and revise is not an outcome at all, it is a call still to be
 * made. Painting it a third hue asked the reader to memorise a lookup table for
 * a word that already says exactly what it means.
 *
 * So it is quiet, and the word carries it. A verdict that reads "Revise" in
 * plain ink between one that is green and one that is red is not ambiguous; it
 * is the one that has not landed yet, which is true.
 */
const VERDICT_TONE: Record<string, "pass" | "quiet" | "fail"> = {
  ship: "pass",
  revise: "quiet",
  kill: "fail",
};

/**
 * THE OUTCOME RECORD'S VERDICT WORDS, WHICH ARE NOT THE CRITIC'S THREE ABOVE.
 * A learning's verdict is validated, missed or mixed, so it cannot ride
 * `VERDICT_TONE`: different keys, different facts. Only two take colour, and
 * the classes are the exact status strings `RunState.tsx` spends on done and
 * failed -- colour carries an outcome that happened, never decoration. "mixed"
 * is deliberately absent: it is neither cleanly, so it wears the line's own
 * ink and the word carries it.
 */
const LEARNING_VERDICT_CLASS: Record<string, string> = {
  validated: "text-mrd-pass",
  missed: "text-mrd-fail",
};

/** ICE arrives over PostgREST as a numeric-typed string, so both ends coerce
 *  through `Number()` before they are called numbers. A movement needs both
 *  ends: one alone says nothing about direction, so it draws nothing. */
function iceMovement(
  prior: number | string | null,
  next: number | string | null,
): { prior: number; next: number } | null {
  if (prior === null || prior === "" || next === null || next === "") return null;
  const from = Number(prior);
  const to = Number(next);
  return Number.isFinite(from) && Number.isFinite(to) ? { prior: from, next: to } : null;
}

type CriticHandoff = {
  idea: string;
  verdict?: string;
  summary?: string;
  risks?: string[];
  missing_evidence?: string[];
  confidence?: number;
};

type Settled = { verb: string; consequence: React.ReactNode; at: string; failed?: boolean };

/**
 * THE OPENING SENTENCE.
 *
 * Two clauses at most, because a third is a paragraph and a paragraph is not
 * read. The second clause changes with what is true rather than being padded:
 * a stuck run outranks a shipped one, and both outrank silence.
 *
 * "1 run is stuck", never the shorter "1 is stuck" the pattern would suggest.
 * After "3 decisions are ready for your review", a bare "1 is stuck" reads as
 * one of those decisions, and it is not — the stuck thing is a RUN. The short
 * form is better English and a false sentence, so it loses.
 */
function stateSentence(n: { ready: number; stuck: number; shipped: number }): React.ReactNode {
  const first =
    n.ready === 0 ? (
      "Nothing is ready for your review."
    ) : n.ready === 1 ? (
      <>
        <Num>1</Num> decision is ready for your review.
      </>
    ) : (
      <>
        <Num>{n.ready}</Num> decisions are ready for your review.
      </>
    );

  const second =
    n.stuck > 0 ? (
      n.stuck === 1 ? (
        <>
          {" "}
          <Num>1</Num> run is stuck.
        </>
      ) : (
        <>
          {" "}
          <Num>{n.stuck}</Num> runs are stuck.
        </>
      )
    ) : n.ready > 0 ? null : n.shipped > 0 ? (
      n.shipped === 1 ? (
        <>
          {" "}
          <Num>1</Num> run shipped.
        </>
      ) : (
        <>
          {" "}
          <Num>{n.shipped}</Num> runs shipped.
        </>
      )
    ) : (
      " Nothing is stuck."
    );

  return (
    <>
      {first}
      {second}
    </>
  );
}

function CriticBrief({
  result,
  onOpen,
  onAnother,
}: {
  result: CriticHandoff;
  onOpen: () => void;
  onAnother: () => void;
}) {
  const risks = (result.risks ?? []).filter((risk) => risk.trim()).slice(0, 3);
  const missing = (result.missing_evidence ?? []).find((item) => item.trim());

  return (
    <section className="today-critic" aria-labelledby="today-critic-title">
      <div className="today-section-head">
        <span className="today-kicker">Your first brief</span>
        <span className="today-critic-signals">
          {result.verdict ? (
            <Value tone={VERDICT_TONE[result.verdict] ?? "quiet"}>
              {VERDICT_LABEL[result.verdict] ?? result.verdict}
            </Value>
          ) : null}
          {typeof result.confidence === "number" ? (
            <ConfidenceDisclosureChip
              confidence={result.confidence}
              tier={tierFromProbability(result.confidence)}
            />
          ) : null}
        </span>
      </div>
      <h2 id="today-critic-title" className="today-critic-title">
        {result.idea}
      </h2>
      {result.summary?.trim() ? <p className="today-critic-summary">{result.summary}</p> : null}
      {risks.length || missing ? (
        <div className="today-critic-evidence">
          {risks.length ? (
            <div>
              <div className="today-evidence-label">Key risks</div>
              <ul>
                {risks.map((risk) => (
                  <li key={risk}>{risk}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {missing ? (
            <div>
              <div className="today-evidence-label">What you need to test</div>
              <p>{missing}</p>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="today-actions">
        <Action onClick={onOpen}>See the full analysis</Action>
        <Action variant="quiet" onClick={onAnother}>
          Try another idea
        </Action>
      </div>
    </section>
  );
}

/** One lane. A name, one line saying who is blocked and what undoing it costs,
 *  and a body that is allowed to be nothing. `quiet` collapses the lane's own
 *  breathing room when it has no body, so a lane at zero reads as a short
 *  taxonomy rather than as an empty room.
 *
 *  TWO CALLERS NOW, NOT FOUR. The approvals queue is one, and the crew's own
 *  runs are the other: three lanes grouped by outcome became one `AgentInbox`
 *  on 2026-08-22 and it wears this same wrapper rather than restating its
 *  markup, so the two sections cannot drift apart on spacing or on how a quiet
 *  one collapses. */
function Lane({
  name,
  waiting,
  quiet,
  goTo,
  onGoTo,
  children,
}: {
  name: string;
  waiting: React.ReactNode;
  quiet: boolean;
  /** The way OUT of this lane, naming where it lands. `Region` split the retired
   *  `more`/`onMore` into `goTo` (navigates) and `toggle` (reveals in place, and
   *  emits `aria-expanded`) because one prop was serving two controls. The one
   *  lane that uses it navigates to /runs, so this is the navigating half. */
  goTo?: string;
  onGoTo?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="today-lane" data-quiet={quiet}>
      <Region title={name} sub={waiting} goTo={goTo} onGoTo={onGoTo}>
        {children ?? null}
      </Region>
    </div>
  );
}

function Today() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    activeWorkspace,
    workspaces,
    isLoading: readingWorkspaces,
    refreshWorkspaces,
  } = useWorkspace();
  const workspaceId = activeWorkspace?.id ?? null;

  // Engine-Room: Today names outcomes, decisions and evidence. Agent internals stay recessed.
  useSpineStrip(null);

  const fetchQueue = useServerFn(getApprovalsQueue);
  const fetchMissions = useServerFn(listMissions);
  const fetchLearnings = useServerFn(listLearnings);
  const fCancelMission = useServerFn(cancelMission);
  const decide = useServerFn(decideApprovalItem);
  const snooze = useServerFn(snoozeApprovalItem);
  const confirm = useConfirm();

  const queue = useQuery({
    queryKey: approvalsQueueKey(workspaceId),
    queryFn: () => fetchQueue({ data: { workspaceId: workspaceId ?? undefined } }),
    enabled: Boolean(workspaceId),
  });
  const missions = useQuery({
    queryKey: missionsKey(workspaceId),
    queryFn: () => fetchMissions({ data: { workspaceId: workspaceId ?? undefined } }),
    enabled: Boolean(workspaceId),
  });
  const learnings = useQuery({
    queryKey: ["today", "learnings", workspaceId],
    queryFn: () => fetchLearnings({ data: { workspaceId: workspaceId ?? undefined } }),
    enabled: Boolean(workspaceId),
  });

  /* Both memoised on the QUERY's data rather than derived inline. A bare
     `?? []` builds a new array on every render, so every list below it would
     recompute on every render and `useSelection` would be handed a fresh id
     array each time — which is the one input it must be able to compare. */
  const items = React.useMemo(() => queue.data?.items ?? [], [queue.data]);
  const rows: MissionListRow[] = React.useMemo(
    () => missions.data?.missions ?? [],
    [missions.data],
  );

  const shipped = React.useMemo(
    () =>
      rows
        .filter((m) => LIVE.has(m.status) && withinLastDay(m.completed_at))
        .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? "")),
    [rows],
  );
  /* A stopped run does not reliably carry `completed_at` — halted and blocked
     are set by a resume path that only touches `updated_at` — so the window
     falls back to it. Without the fallback a stuck run would silently never
     appear, which is the one lane where absence is read as "fine". */
  const stuck = React.useMemo(
    () =>
      rows
        .filter((m) => STUCK.has(m.status) && withinLastDay(m.completed_at ?? m.updated_at))
        .sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? "")),
    [rows],
  );
  const running = React.useMemo(() => rows.filter((m) => WORKING.has(m.status)), [rows]);

  /* THE BRAKE PEDAL A RUNNING ROW CAN HONESTLY OFFER. `cancelMission` stops
     advancement, cancels the run's in-flight steps, releases held build claims
     and clears its pending approvals, which makes it irreversible -- so it is
     gated behind the app's own confirm (never a native dialog) in the handler
     below. Feedback is a toast rather than a receipt: cancelling belongs to
     this lane, not to the review queue's settled list. */
  const cancelRun = useMutation({
    mutationFn: (missionId: string) => fCancelMission({ data: { missionId } }),
    onSuccess: (result) => {
      if (result.alreadyTerminal) {
        toast.success("That run had already finished on its own.");
      } else {
        toast.success(
          typeof result.approvalsCancelled === "number" && result.approvalsCancelled > 0
            ? `Run cancelled · ${result.approvalsCancelled} pending approval${result.approvalsCancelled === 1 ? "" : "s"} cleared.`
            : "Run cancelled · it will not advance further.",
        );
      }
      void queryClient.invalidateQueries({ queryKey: ["today"] });
      invalidateShellReads(queryClient);
    },
    onError: (error: Error) => toast.error(error.message),
  });
  /* `mutate` is stable across renders, so the row wiring below can depend on
     this without rebuilding the crew list every time the component renders. */
  const { mutate: fireCancelRun } = cancelRun;
  const cancelRunAt = React.useCallback(
    async (missionId: string) => {
      const ok = await confirm({
        title: "Cancel this run?",
        body: "It stops now and will not advance further. Its pending approvals clear and any held build locks release. Work already done is kept. This cannot be undone.",
        destructive: true,
        confirmLabel: "Cancel run",
      });
      if (ok) fireCancelRun(missionId);
    },
    [confirm, fireCancelRun],
  );

  const learning = learnings.data?.learnings?.[0] ?? null;
  /* Resolved once here rather than inline in the block's evidence line, so the
     JSX below reads as what is printed and not as how it was parsed. */
  const learningVerdictClass = learning ? LEARNING_VERDICT_CLASS[learning.verdict] : undefined;
  const learningIce = learning
    ? iceMovement(learning.prior_ice, learning.new_ice)
    : null;
  const oldest = React.useMemo(
    () =>
      rows.reduce<string | null>(
        (minimum, mission) =>
          !minimum || mission.created_at < minimum ? mission.created_at : minimum,
        null,
      ),
    [rows],
  );
  const onRecord = daysSince(oldest);

  /** Which of the three facts about the run record is true right now. The three
   *  lanes it feeds each need it, and a lane that printed "Nothing stopped"
   *  over a read still in flight would be stating a claim it has not read. */
  const runsState: "reading" | "failed" | "ready" = stillWaiting(missions)
    ? "reading"
    : missions.isError
      ? "failed"
      : "ready";

  const runsLane = (known: React.ReactNode): React.ReactNode =>
    runsState === "reading"
      ? "Reading the run record."
      : runsState === "failed"
        ? "This could not be read."
        : known;

  /*
   * ══ THE THREE RUN LANES, AS ONE INBOX ═══════════════════════════════════
   *
   * Shipped, Stuck and Still running were three lanes grouped by OUTCOME.
   * `AgentInbox` groups by WHAT A RUN NEEDS FROM A PERSON, and its own header
   * makes the argument this replaces: a list grouped by what the machine is
   * doing "answers the question nobody opens the app with". Two of the three
   * lanes were exactly that list, and the third — Stuck — carried a comment
   * admitting it had promised a verb it could not deliver.
   *
   * IT IS A REPLACEMENT RATHER THAN A FOURTH THING ON THE PAGE, and every fact
   * the three lanes carried is still on screen. Written out, because "nothing is
   * lost" is a claim and not a feeling:
   *
   *   the coloured state word     `activity` takes a node now, so `RunState` and
   *                               `ShippedState` are handed through as the
   *                               components they are. `cancelled` and `halted`
   *                               still read as two different facts.
   *   the row's age               folded into the same line: "stopped 4h ago".
   *   the handoff count           folded into the same line, ahead of the state.
   *   three rows per lane         `maxPerGroup`, which is the lane's own
   *                               `LANE_ROWS`. The rest open IN PLACE behind a
   *                               control that says how many, which is strictly
   *                               more than the door's "N more" managed: that
   *                               said how many were missing and made you leave
   *                               the page to see them.
   *   each lane's sentence        `groupNote`, verbatim where it still parses.
   *   the door to /runs           one door on the region rather than three.
   *   the read failure + retry    one line above the inbox rather than three
   *                               copies of one fetch, which this file's own
   *                               note already flagged as the thing to fix if it
   *                               proved too loud in a screen reader.
   *   "nothing stopped" etc       an empty group draws nothing, so the assurance
   *                               moved into the region's own line, where all
   *                               three are said at once.
   *
   * WHAT IT ADDS: one tab stop for the whole set with `j`/`k` moving through it,
   * ordering by need instead of by taxonomy, and the idle collapse — a running
   * agent that has not moved in ten minutes says so, which none of the three
   * lanes could tell you.
   *
   * WHAT IS WIRED, AND ONLY WHERE AN ANSWER REALLY GOES SOMEWHERE: `onReply`
   * is passed for the blocked rows alone. Their reply opens Ask through
   * `openAsk`, the one writer this surface has, carrying the run's own title
   * ahead of the answer so the conversation starts knowing which work it is
   * about. Ready and finished rows stay unwired -- nothing consumes a reply
   * addressed to work that has ended -- and so do running rows, where a reply
   * has no path into an agent mid-flight. A control that cannot deliver is the
   * affordance failure the component's own header names.
   *
   * THE OTHER CONTROL A RUNNING ROW GETS is Cancel, wired to the real
   * `cancelMission` mutation behind the app confirm. It lives in the row's
   * activity line because `AgentInbox` owns the row markup; stopping its click
   * from reaching the row's own navigation is not optional.
   */
  const crew = React.useMemo<AgentSession[]>(() => {
    /* Every row opens its run, exactly as every lane row did. Built once here so
       three loops cannot drift into three different destinations. */
    const open = (id: string) => () =>
      void navigate({ to: "/runs/$missionId", params: { missionId: id } });
    /* `at` DRIVES IDLE AND SORT, so it may never be NaN: `now - NaN` is NaN,
       which is false against every comparison, so a row with an unreadable time
       would quietly never be called quiet and would sort unpredictably against
       its neighbours. The three filters above make that unreachable today
       (`shipped` and `stuck` are both windowed on a parsed date, `updated_at` is
       NOT NULL), which is exactly why the guard is here rather than trusted: it
       is unreachable until the day a filter changes. Epoch is the honest floor —
       a row nobody can date is the oldest thing in its group. */
    const instant = (iso: string | null | undefined, fallback: string): number => {
      const first = Date.parse(iso ?? "");
      if (Number.isFinite(first)) return first;
      const second = Date.parse(fallback);
      return Number.isFinite(second) ? second : 0;
    };
    const out: AgentSession[] = [];

    for (const m of stuck) {
      /* The mapping, not a second copy of it: `taskStatus` resolves anything it
         does not recognise to "a person is required", which is the one reading
         that cannot cost somebody their morning by being wrong. `blocked` is the
         only stuck state that is genuinely waiting on a human, so it is the only
         one that lands in the group that says so. */
      const state = taskStatus(m.status);
      const when = ago(m.completed_at ?? m.updated_at);
      out.push({
        id: m.id,
        title: cleanTitle(m.title),
        need: state === "blocked" ? "needs-input" : "ready",
        activity: (
          <>
            <RunState status={m.status} />
            {when ? ` ${when}` : ""}
          </>
        ),
        at: instant(m.completed_at ?? m.updated_at, m.created_at),
        agentSlug: m.current_agent_slug,
        /* An outcome, on its own axis. `halted` and `cancelled` resolve to
           `stopped`, which is a deliberate stop rather than a failure, so they
           wear no Failed chip and say which one they were in the line above. */
        failed: state === "failed",
        onOpen: open(m.id),
        /* Only the rows asking you something take a reply, because Ask is
           where it can genuinely land. The title rides ahead of the answer so
           the conversation does not start holding half a sentence. */
        onReply:
          state === "blocked"
            ? (text) => openAsk(`About the run "${cleanTitle(m.title)}": ${text}`)
            : undefined,
      });
    }

    for (const m of running) {
      const elapsed = ago(m.created_at);
      out.push({
        id: m.id,
        /* The sub-goal, not the title: the running lane always led with what the
           agent is actually doing right now, and that is the sentence this
           product is for. */
        title: stripAutoPrefix(m.current_sub_goal ?? m.title),
        need: "working",
        activity: (
          <>
            {elapsed ? `${elapsed} running` : "running"}
            <Action
              variant="quiet"
              busy={cancelRun.isPending}
              className="ml-mrd-2 h-6! px-mrd-2!"
              onClick={(event) => {
                /* The row itself navigates on click; this must not. */
                event.stopPropagation();
                void cancelRunAt(m.id);
              }}
            >
              Cancel run
            </Action>
          </>
        ),
        /* The last thing that happened, which is what `IDLE_AFTER_MS` measures
           against. `created_at` would call every long run idle. */
        at: instant(m.updated_at, m.created_at),
        agentSlug: m.current_agent_slug,
        onOpen: open(m.id),
      });
    }

    for (const m of shipped) {
      const when = ago(m.completed_at);
      out.push({
        id: m.id,
        title: cleanTitle(m.title),
        need: "done",
        activity: (
          <>
            {m.hop_count > 0 ? (
              <>
                <Num>{m.hop_count}</Num> {m.hop_count === 1 ? "handoff" : "handoffs"} ·{" "}
              </>
            ) : null}
            <ShippedState partial={m.status === "completed_with_failures"} />
            {when ? ` ${when}` : ""}
          </>
        ),
        at: instant(m.completed_at, m.updated_at),
        agentSlug: m.current_agent_slug,
        /* `completed_with_failures` is NOT a failure: it went out, and the hole
           in it is a fact about the thing that shipped. `ShippedState` says
           "partial" in the line above, which is the whole of what is true. */
        onOpen: open(m.id),
      });
    }

    return out;
  }, [stuck, running, shipped, navigate, cancelRun.isPending, cancelRunAt]);

  /* EVERY EMPTY CATEGORY, NAMED. An empty group draws nothing at all inside the
     inbox, which is right there and wrong here: "nothing stopped" is the single
     most valuable sentence on a morning surface and it used to be said out loud
     by the lane that was empty. So the assurances are collected and said once,
     on the region's own line, where all three fit and read as one sentence. */
  const crewQuiet = [
    stuck.length === 0 ? "nothing stopped" : null,
    running.length === 0 ? "no agent is working" : null,
    shipped.length === 0 ? "nothing went live" : null,
  ].filter((s): s is string => s !== null);
  const crewQuietLine =
    crewQuiet.length === 0
      ? null
      : crewQuiet.length === 1
        ? crewQuiet[0]!
        : `${crewQuiet.slice(0, -1).join(", ")} and ${crewQuiet[crewQuiet.length - 1]}`;

  /* WALKING IS A MODE, AND ARRIVAL IS ALWAYS ARRIVAL. Never persisted: the
     founder ruling is about what the surface does when you LAND on it, so a
     mode that survived a reload would defeat it on the second visit.
     It also COLLAPSES on its own once the list is down to one, because one
     decision drawn as a list of one is the arrival view with extra furniture. */
  const [walkRequested, setWalkRequested] = React.useState(false);
  const walking = walkRequested && items.length > 1;
  const enterQueue = React.useCallback(() => setWalkRequested(true), []);
  const leaveQueue = React.useCallback(() => setWalkRequested(false), []);
  const [focusedId, setFocusedId] = React.useState<string | null>(null);
  const focused = React.useMemo(
    () => items.find((i) => i.id === focusedId) ?? items[0] ?? null,
    [items, focusedId],
  );

  const selection = useSelection(React.useMemo(() => items.map((i) => i.id), [items]));
  const [sendBack, setSendBack] = React.useState<ApprovalQueueItem | null>(null);
  const [settled, setSettled] = React.useState<Settled[]>([]);
  const stamp = () =>
    new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const record = (entry: Settled) => setSettled((current) => [entry, ...current]);

  const dropFromQueue = React.useCallback(
    async (ids: string[]) => {
      const key = approvalsQueueKey(workspaceId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ApprovalsQueueResult>(key);
      const drop = new Set(ids);
      queryClient.setQueryData<ApprovalsQueueResult | undefined>(key, (current) =>
        current ? { ...current, items: current.items.filter((i) => !drop.has(i.id)) } : current,
      );
      return { previous };
    },
    [queryClient, workspaceId],
  );

  const restore = React.useCallback(
    (previous: ApprovalsQueueResult | undefined) => {
      if (previous) queryClient.setQueryData(approvalsQueueKey(workspaceId), previous);
    },
    [queryClient, workspaceId],
  );

  /** Move the open call to the NEXT one before the current leaves the list.
   *  Without this the fallback in `focused` snaps to the top of the queue and
   *  a person clearing a list from the middle is thrown back to the start. */
  const advancePast = React.useCallback(
    (id: string) => {
      const i = items.findIndex((x) => x.id === id);
      if (i === -1) return;
      setFocusedId((items[i + 1] ?? items[i - 1] ?? null)?.id ?? null);
    },
    [items],
  );

  const settle = useMutation({
    mutationFn: async (v: { item: ApprovalQueueItem; verdict: "approve" | "reject" }) => {
      await decide({ data: { id: v.item.sourceId, kind: v.item.kindKey, verdict: v.verdict } });
    },
    onMutate: (v) => dropFromQueue([v.item.id]),
    onSuccess: (_result, v) => {
      record({
        verb: v.verdict === "approve" ? "You approved" : "You declined",
        // The consequence is the ITEM's, never a sentence written here about
        // what an approval generally does. Each gate family means something
        // different by "approved" and only the item knows which.
        consequence:
          v.verdict === "approve"
            ? (v.item.approveConsequence ?? "The decision is on the record.")
            : (v.item.rejectConsequence ?? "The decision will guide the next pass."),
        at: stamp(),
      });
      void queryClient.invalidateQueries({ queryKey: ["today"] });
      invalidateShellReads(queryClient);
    },
    onError: (error: Error, _v, context) => {
      restore(context?.previous);
      record({
        verb: "Nothing was recorded",
        consequence: error.message,
        at: stamp(),
        failed: true,
      });
    },
  });

  const defer = useMutation({
    mutationFn: async (item: ApprovalQueueItem) => {
      await snooze({ data: { id: item.sourceId, kind: item.kindKey } });
    },
    onMutate: (item) => dropFromQueue([item.id]),
    onSuccess: () => {
      record({
        verb: "You snoozed it",
        consequence: "It returns with tomorrow's brief.",
        at: stamp(),
      });
      invalidateShellReads(queryClient);
    },
    onError: (error: Error, _item, context) => {
      restore(context?.previous);
      record({
        verb: "Nothing was recorded",
        consequence: error.message,
        at: stamp(),
        failed: true,
      });
    },
  });

  /**
   * THE BULK SETTLE, WHICH THIS PRODUCT HAS NEVER HAD.
   *
   * A sweep of every queue in the app found no multi-select anywhere, so a Head
   * of Product arriving to twenty overnight decisions had no path but twenty
   * keypresses. That is the whole reason `useSelection` and `SelectionBar`
   * exist; this is the first surface to spend them.
   *
   * ONE AT A TIME ON THE WIRE, ON PURPOSE. Each of these writes a verdict to
   * the record and several dispatch an agent. Firing forty in parallel puts
   * forty writes against the same tables in an order nobody chose, and makes a
   * partial failure unattributable. Sequential is slower and it is the only
   * version that can say afterwards exactly how many landed.
   *
   * A FAILURE RE-READS RATHER THAN GUESSES. On any refusal the queue is
   * invalidated and re-fetched instead of the failed rows being pushed back
   * into the cache by hand: after a partial settle the client's idea of the
   * list is provably stale, and the record is the only thing that knows what
   * is still open.
   */
  const bulk = useMutation({
    mutationFn: async (v: {
      picked: ApprovalQueueItem[];
      verb: "approve" | "reject" | "snooze";
    }) => {
      const failures: string[] = [];
      for (const item of v.picked) {
        try {
          if (v.verb === "snooze") {
            await snooze({ data: { id: item.sourceId, kind: item.kindKey } });
          } else {
            await decide({ data: { id: item.sourceId, kind: item.kindKey, verdict: v.verb } });
          }
        } catch (e) {
          failures.push(e instanceof Error ? e.message : String(e));
        }
      }
      return { total: v.picked.length, failures };
    },
    onMutate: (v) => dropFromQueue(v.picked.map((i) => i.id)),
    onSuccess: (result, v) => {
      const landed = result.total - result.failures.length;
      if (landed > 0) {
        record({
          verb:
            v.verb === "approve"
              ? `You approved ${landed}`
              : v.verb === "reject"
                ? `You declined ${landed}`
                : `You snoozed ${landed}`,
          // Deliberately says only what is true of EVERY kind in the set. A
          // sentence naming what an approval does would be right for some of
          // them and an invention for the rest.
          consequence:
            v.verb === "snooze"
              ? "They return with tomorrow's brief."
              : "The record has each one, with its own consequence.",
          at: stamp(),
        });
      }
      if (result.failures.length > 0) {
        record({
          verb: `Nothing was recorded for ${result.failures.length}`,
          consequence: `${result.failures[0]} The queue has been re-read, so what you see is what the record holds.`,
          at: stamp(),
          failed: true,
        });
      }
      selection.clear();
      void queryClient.invalidateQueries({ queryKey: ["today"] });
      invalidateShellReads(queryClient);
    },
    onError: (error: Error, _v, context) => {
      restore(context?.previous);
      record({
        verb: "Nothing was recorded",
        consequence: error.message,
        at: stamp(),
        failed: true,
      });
    },
  });

  const busy = settle.isPending || defer.isPending || bulk.isPending;

  const approve = React.useCallback(
    (item: ApprovalQueueItem) => {
      advancePast(item.id);
      settle.mutate({ item, verdict: "approve" });
    },
    [advancePast, settle],
  );
  const decline = React.useCallback(
    (item: ApprovalQueueItem) => {
      advancePast(item.id);
      settle.mutate({ item, verdict: "reject" });
    },
    [advancePast, settle],
  );
  const snoozeCall = React.useCallback(
    (item: ApprovalQueueItem) => {
      advancePast(item.id);
      defer.mutate(item);
    },
    [advancePast, defer],
  );

  const picked = React.useMemo(() => items.filter((i) => selection.has(i.id)), [items, selection]);

  /* Both memoised because `DecisionQueue` holds the keyboard listener and takes
     these in its dependency array. Rebuilt inline they would tear the listener
     down and register it again on every render of the surface. */
  const verbs = React.useMemo(
    () => ({ approve, decline, snooze: snoozeCall, sendBack: setSendBack, busy }),
    [approve, decline, snoozeCall, busy],
  );
  const bulkVerbs = React.useMemo(
    () => ({
      approve: () => bulk.mutate({ picked, verb: "approve" as const }),
      decline: () => bulk.mutate({ picked, verb: "reject" as const }),
      snooze: () => bulk.mutate({ picked, verb: "snooze" as const }),
    }),
    [bulk, picked],
  );

  const [justLanded, setJustLanded] = React.useState(false);
  const [criticResult, setCriticResult] = React.useState<CriticHandoff | null>(null);
  React.useEffect(() => {
    const landed = window.sessionStorage.getItem("supaprod.onboarding.justLanded") === "1";
    if (!landed) return;
    setJustLanded(true);
    window.sessionStorage.removeItem("supaprod.onboarding.justLanded");
    const stored = window.sessionStorage.getItem("supaprod.onboarding.criticReview");
    if (!stored) return;
    try {
      setCriticResult(JSON.parse(stored) as CriticHandoff);
    } catch {
      setCriticResult(null);
    } finally {
      window.sessionStorage.removeItem("supaprod.onboarding.criticReview");
    }
  }, []);

  /* The greeting is a courtesy, and the clock that decides it belongs to the
     reader. Resolved after mount rather than during render because the server
     renders this in its own timezone, and a server that says "Good evening" to
     someone eating breakfast is worse than a first frame that says morning and
     corrects itself. Same line, same height, so nothing moves. */
  const [clock, setClock] = React.useState<Date | null>(null);
  React.useEffect(() => setClock(new Date()), []);
  const hour = clock?.getHours() ?? 8;
  const greeting = hour < 12 ? "Good morning." : hour < 18 ? "Good afternoon." : "Good evening.";

  const loading = stillWaiting(queue, missions);
  const quietMorning =
    !loading &&
    !queue.isError &&
    !missions.isError &&
    items.length === 0 &&
    shipped.length === 0 &&
    stuck.length === 0 &&
    running.length === 0;

  /**
   * A FAILED READ IS NOT A QUIET MORNING, and this sentence is where the two
   * are easiest to confuse. "Nothing is ready for your review" is a claim about
   * the world and must never be printed because a fetch refused.
   *
   * `loading` is the union of two reads and it belongs to THIS sentence alone,
   * because one sentence assembled from two counts genuinely needs both. No
   * region below is allowed to wait on it: a lane keyed off the union stays
   * blank until the slower read lands, which is latency a person pays and gets
   * nothing for. Each lane waits on its own read instead.
   *
   * While it counts, the headline says the surface's name rather than
   * "Reading..." — a headline describing the fetch is the surface talking about
   * itself, and the lanes underneath already say what is being read.
   *
   * EVERY READ THE SENTENCE COUNTS IS ANSWERED FOR BEFORE IT COUNTS, and that is
   * the whole rule. `stateSentence` takes three numbers and cannot tell a zero it
   * read from a zero it never got. Two of them -- `stuck` and `shipped` -- come
   * from `missions` and the third from `queue`, so a failure in either has to be
   * dealt with above the call or the surface states it as fact.
   *
   * `missions` went unguarded until 2026-08-11 and nothing needed it to be, by
   * accident: `stillWaiting` never stood down on a failed read, so `loading`
   * stayed true for ever and the headline sat on the harmless "Today". Fixing
   * that helper removed the accident, and a cold `missions` failure began
   * printing "Nothing is ready for your review. Nothing is stuck." from a read
   * that refused.
   *
   * EACH FAILED READ NAMES ITSELF rather than sheltering under the surface's own
   * name. "Today" is right while it is still counting and wrong once a read has
   * come back refused, because the person is then looking at a page that will
   * never fill in and nothing tells them why. The two reads carry different
   * halves of the morning -- `queue` is what needs a decision from you,
   * `missions` is what the crew did overnight -- so which one died changes what
   * you do next. The both-failed case says so rather than picking a winner and
   * hiding the other.
   */
  const headline = React.useMemo(() => {
    if (loading) return "Today";
    if (missions.isError && queue.isError)
      return "Neither your run record nor your review queue loaded.";
    if (missions.isError) return "Your run record did not load.";
    if (queue.isError) return "Your review queue did not load.";
    if (justLanded && criticResult) return "Your first brief is ready.";
    return stateSentence({ ready: items.length, stuck: stuck.length, shipped: shipped.length });
  }, [
    loading,
    queue.isError,
    missions.isError,
    justLanded,
    criticResult,
    items.length,
    stuck.length,
    shipped.length,
  ]);

  /**
   * THE THIRD FACT, WHICH THIS SURFACE HAS NEVER TOLD APART FROM THE OTHER TWO.
   *
   * A person in zero workspaces reaches Today, and every read on this surface is
   * `enabled: Boolean(workspaceId)`. A disabled query reports pending for ever,
   * so `stillWaiting` never stands down: the headline sits on "Today", the
   * shipped lane reads "Reading what the crew finished." and neither ever
   * changes. Ending that wait by falling through to the empty state is a
   * different wrong answer rather than a fix, because it tells someone with no
   * workspace that their workspace is quiet.
   *
   * Three facts, and the product has been collapsing them into two: NOTHING
   * EXISTS YET, THE READ FAILED, and A PRECONDITION IS MISSING. This is the
   * third, and it is the one a first-time reader actually opens.
   *
   * THE REFUSED READ IS SEPARATED FROM IT rather than folded in. The workspace
   * list is a react-query read like any other and it can refuse, and what a
   * refusal leaves behind is an empty list, which is exactly what belonging to
   * no workspace leaves behind. `useWorkspace` reports the list and whether it
   * is still reading and nothing else, so the third fact is read from the cache
   * the hook already fills. That costs no fetch and changes no wiring, and it is
   * the whole difference between "you are not in a workspace" and "we could not
   * find out".
   *
   * NEITHER BRANCH WEARS THE ACCENT. Joining a workspace is a setup act, not a
   * decision: dressing it as one sends a reader hunting for a call to make, and
   * there is no call here, only a thing to put in place.
   */
  const workspacesRefused = queryClient.getQueryState(["workspaces"])?.status === "error";
  const noWorkspace = !readingWorkspaces && !workspacesRefused && workspaces.length === 0;
  const workspacesUnreadable = !readingWorkspaces && workspacesRefused && workspaces.length === 0;

  if (noWorkspace || workspacesUnreadable) {
    return (
      <Surface wide>
        <div className="today-page">
          <p className="today-greeting">{greeting}</p>
          {/* "Today" rather than a sentence about the state, because the state
              is the thing below and saying it twice is the ban this file's own
              lane subtitle records. The subtitle names the boundary instead,
              which is the one fact neither of the two bodies below states. */}
          <PageHeading title="Today" sub="Everything on this surface belongs to a workspace." />
          {/* `.today-arrival` states the gap under the heading for BOTH arms.
              The refused arm used to get it from `Block`, and `NeedsSetup` never
              had it at all: it is a bare Meridian section with no outer margin,
              so it has been sitting flush under the subtitle. One wrapper covers
              the pair and neither arm can drift from the other. */}
          <div className="today-arrival">
            {workspacesUnreadable ? (
              <Region title="The workspaces you are in">
                <ReadFailedLine onRetry={() => refreshWorkspaces()}>
                  This could not be read, so it cannot tell a quiet morning from a workspace it
                  never saw.
                </ReadFailedLine>
              </Region>
            ) : (
              <NeedsSetup
                kind="no-workspace"
                thenWhat="this opens on what the crew finished overnight, what is waiting on your call, and what stopped."
                action={
                  <Action variant="primary" onClick={() => navigate({ to: "/onboarding" })}>
                    Set up your workspace
                  </Action>
                }
              />
            )}
          </div>
        </div>
      </Surface>
    );
  }

  return (
    <Surface wide>
      <div className="today-page">
        <p className="today-greeting">{greeting}</p>
        <PageHeading
          title={headline}
          sub={
            <>
              {/* THE HONEST BOUNDARY. The idea this surface is built on is "what
                  changed since you last looked", and the database has no
                  per-user watermark to draw that line with — see
                  src/components/today/when.ts. So it says the window it
                  actually has. */}
              In the last 24 hours
              {onRecord !== null ? (
                <>
                  {" · "}
                  {/* TWO DOORS ON THIS PAGE ONCE CARRIED THE SAME WORDS AND WENT
                      TO DIFFERENT PLACES. This one and the one under the settled
                      calls both read "Open the record": this opens the shared
                      brain, that opens the room holding every call you have
                      settled. A label that names neither destination is worse
                      than no label, because a reader who has learned where one
                      goes now believes the wrong thing about the other. Each one
                      names where it lands. */}
                  <Door
                    title="Open the shared brain"
                    onClick={() => navigate({ to: "/brain", search: {} })}
                  >
                    <Num>{onRecord}</Num> {onRecord === 1 ? "day" : "days"} on the record
                  </Door>
                </>
              ) : null}
            </>
          }
        />

        {justLanded && criticResult ? (
          <CriticBrief
            result={criticResult}
            onOpen={() => navigate({ to: "/decide" })}
            onAnother={() => {
              setCriticResult(null);
              openAsk();
            }}
          />
        ) : null}

        <div className="today-lanes">
          <Lane
            name="Ready for your review"
            waiting={
              /* THIS LINE AND THE BODY TWELVE LINES DOWN USED TO CONTRADICT EACH
                 OTHER, on every ordinary cold load. The body has always asked
                 all three questions in order -- reading, failed, then content --
                 while this summary asked only two: `queue.isError`, then
                 `items.length === 0`. An unread queue is not an error and has no
                 items, so it fell to the second arm, and the lane rendered
                 "Nothing is waiting on you." directly above "Reading what needs
                 you." One lane, two adjacent elements, opposite claims, and the
                 wrong one was the one in the larger type.

                 It is null rather than a sentence of its own while the read is
                 in flight, deliberately: the body already says what is
                 happening, and `Block` drops a null `sub` entirely rather than
                 leaving a gap. Repeating it here is the case its own doc calls
                 hard ban 10 -- label, sublabel and helper all saying the same
                 thing. */
              stillWaiting(queue) ? null : queue.isError ? (
                "This could not be read."
              ) : items.length === 0 ? (
                "Nothing is waiting on you."
              ) : (
                <>
                  <Num>{items.length}</Num> waiting on you. Nothing has happened yet, so undo is
                  free.
                </>
              )
            }
            quiet={
              items.length === 0 && settled.length === 0 && !stillWaiting(queue) && !queue.isError
            }
          >
            {stillWaiting(queue) ? (
              <Reading>Reading what needs you.</Reading>
            ) : queue.isError ? (
              <ReadFailedLine onRetry={() => void queue.refetch()}>
                Your decisions are unchanged and this could not read them. Retry before you treat
                the morning as clear.
              </ReadFailedLine>
            ) : focused ? (
              <DecisionQueue
                items={items}
                focused={focused}
                onFocus={setFocusedId}
                walking={walking}
                onWalk={enterQueue}
                onLeave={leaveQueue}
                selection={selection}
                verbs={verbs}
                bulk={bulkVerbs}
                onOpenAgent={(agent) => navigate({ to: "/crew", search: { agent } })}
              />
            ) : null}
            {settled.length > 0 ? (
              <div className="today-settled">
                {settled.map((entry, index) => (
                  <Receipt
                    key={`${entry.at}-${index}`}
                    verb={entry.verb}
                    consequence={entry.consequence}
                    time={entry.at}
                    failed={entry.failed}
                  />
                ))}
                {/* The second of the pair. See the note on the door in the page
                    subtitle: that one opens the shared brain, this one opens the
                    room that holds every settled call with what each one caused,
                    and until now both said "Open the record". */}
                <Door
                  title="Every call you have settled, with what each one caused"
                  onClick={() => navigate({ to: "/engine-room", search: { room: "record" } })}
                >
                  Open everything you have settled
                </Door>
              </div>
            ) : null}
          </Lane>
          {/* THE CREW'S OWN RUNS. Shipped, Stuck and Still running were three
              lanes here until 2026-08-22; see the note on `crew` above for the
              fact-by-fact account of where each thing they carried went. */}
          <Lane
            name="What the crew has been doing"
            quiet={crew.length === 0 && runsState === "ready"}
            waiting={runsLane(
              <>
                {crew.length > 0 ? (
                  <>
                    <Num>{crew.length}</Num> {crew.length === 1 ? "run" : "runs"}, in the order of
                    what each one needs from you.{" "}
                  </>
                ) : null}
                {crewQuietLine
                  ? `${crewQuietLine.charAt(0).toUpperCase()}${crewQuietLine.slice(1)}.`
                  : null}
              </>,
            )}
            goTo={rows.length > 0 ? "Open Runs" : undefined}
            onGoTo={() => navigate({ to: "/runs" })}
          >
            {/* ONE WAIT AND ONE REFUSAL FOR ONE READ. Three lanes drew three of
                  each off this single query, and the note the shipped lane
                  carried already said that was the thing to fix if it proved too
                  loud. It is one fetch, so it says so once. */}
            {/* THE READ IS NAMED HERE RATHER THAN READ THROUGH `runsState`, and
                  that is a guard obeyed on purpose rather than worked around.
                  `today-states-its-wait.test.ts` asserts that every read Today
                  makes admits its own wait AND its own refusal in the JSX, by the
                  query's own name. Branching on a derived word would have kept the
                  behaviour and hidden the read from the one check that exists to
                  prove no region resolves to silence. `runsState` still composes
                  the region's sub-line and its quiet flag, where the derived word
                  is what is wanted. */}
            {stillWaiting(missions) ? (
              <Reading>Reading the run record.</Reading>
            ) : missions.isError ? (
              <ReadFailedLine onRetry={() => void missions.refetch()}>
                The run record did not load, so this cannot say what went live, what stopped or what
                is still going.
              </ReadFailedLine>
            ) : crew.length === 0 /*
               * A LANE AT ZERO IS A NAME AND A SENTENCE, WHICH IS WHAT THE THREE
               * IT REPLACED DREW: each one mapped an empty array and rendered no
               * body at all, and `Lane` says in its own doc that a body is
               * allowed to be nothing.
               *
               * AND THE INBOX'S OWN ZERO CASE WOULD BE WRONG HERE, which is the
               * real reason. It reads "Nothing needs you. No run is waiting on an
               * answer and nothing is asking to be looked at." — true on a
               * dedicated inbox, and false on this page, where the approvals
               * queue in the lane directly above may be holding four calls that
               * are waiting on exactly that. Two adjacent sections making
               * opposite claims is the defect the Ready lane's own subtitle was
               * fixed for; it is not being reintroduced one lane down.
               *
               * The sentence is on the lane's own line, where all three
               * assurances fit at once.
               */ ? null : (
              <AgentInbox
                sessions={crew}
                label="Runs, grouped by what each one needs from you"
                /* The lane's own three, kept: this surface is a scan band. Past
                     three, a group says how many more it holds and opens them
                     where they stand. */
                maxPerGroup={LANE_ROWS}
                groupNote={{
                  "needs-input": "Nothing moves on these until you answer.",
                  ready: "The crew has finished with these. Open one to see where it stopped.",
                  working: "Waiting on an agent, not on you.",
                  done: "Live and waiting on nobody. Undoing one costs a rollback.",
                }}
              />
            )}
          </Lane>
        </div>

        {quietMorning ? <QuietMorning /> : null}

        <PushedInsights />

        <FocusNext workspaceId={workspaceId} />

        {stillWaiting(learnings) ? (
          <Reading>Reading what it learned.</Reading>
        ) : learnings.isError ? (
          /* SAME REGION, SAME NAME, WHICHEVER WAY THE READ WENT. The failed arm
             called itself "Latest learning" and the loaded arm "It learned one
             thing", so the section changed its name depending on whether the
             fetch worked. */
          <div className="today-learned">
            <Region title={LEARNING_BLOCK}>
              <ReadFailedLine onRetry={() => void learnings.refetch()}>
                The outcome record did not load, so this cannot show what changed next.
              </ReadFailedLine>
            </Region>
          </div>
        ) : learning?.summary ? (
          <div className="today-learned">
            <Region title={LEARNING_BLOCK}>
              {/* THE DOOR CAME OUT OF THE RECESS AND BECAME A NAMED CONTROL.
                  The retired `Record` took an `onClick` and a `title` and made
                  the WHOLE recess clickable, which is how a surface's one
                  checkable claim ends up with an affordance nobody can see: a
                  paragraph that happens to be a button announces nothing and
                  looks like prose. Meridian's `RecordSpeaks` deliberately has no
                  onClick, so the door is drawn underneath it, in words, naming
                  where it lands. `decide.tsx` ports the identical shape and
                  `surface-parts.tsx` carries the reasoning.

                  The label is the string that used to be the recess's `title`,
                  unchanged. It was already written as a destination rather than
                  as a verb, which is exactly what a door owes, and it was
                  reachable only by hovering. `items-start` on the column so the
                  door hugs its own label: a Door is a word, and a button
                  stretched across a region centres its text and underlines it
                  across the full width, which reads as a broken heading. */}
              <div className="flex flex-col items-start gap-mrd-3">
                <RecordSpeaks
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
                      {learning.verdict ? (
                        <>
                          {" · "}
                          <span className={learningVerdictClass}>{learning.verdict}</span>
                        </>
                      ) : null}
                      {/* A movement, written plainly, because a reader should
                          not have to know which column is which end. */}
                      {learningIce ? (
                        <>
                          {" · ICE "}
                          <Num>{learningIce.prior}</Num> to <Num>{learningIce.next}</Num>
                        </>
                      ) : null}
                      {learning.metric_label && learning.metric_value
                        ? ` · ${learning.metric_label}: ${learning.metric_value}`
                        : null}
                    </>
                  }
                >
                  {learning.summary}
                </RecordSpeaks>
                <Door
                  onClick={() =>
                    navigate({ to: "/brain", search: { tab: "learnings", learning: learning.id } })
                  }
                >
                  Open this outcome in the record
                </Door>
              </div>
            </Region>
          </div>
        ) : null}

        <div data-page-composer className="today-composer">
          <div>
            <div className="today-kicker">Start something new</div>
            <div className="today-composer-copy">
              Ask a question or give the crew its next outcome.
            </div>
          </div>
          <AskComposer />
        </div>
      </div>

      {/* THE DOOR THAT WAS A WALL. Today has drawn a "Send back" button for
          weeks and it navigated to /approvals, which has no send-back control
          and no note field, so the one verb that records WHY a machine was
          wrong was advertised and unreachable. It opens here now, over the
          call it belongs to, and `isModalOpen()` disarms a/d/z while the note
          is being written. */}
      <SendBackSheet
        open={sendBack !== null}
        item={
          sendBack
            ? {
                id: sendBack.id,
                sourceId: sendBack.sourceId,
                kindKey: sendBack.kindKey,
                title: stripAutoPrefix(sendBack.title),
              }
            : null
        }
        onClose={() => setSendBack(null)}
      />
    </Surface>
  );
}
