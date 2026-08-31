/**
 * THE BOARD, AS A COMPONENT RATHER THAN A ROUTE.
 *
 * ── WHY IT MOVED, 2026-08-31 ──────────────────────────────────────────────
 * S0's ruling A01 settles F-144: **the home is `/start` and the board folds
 * INTO it.** `RANKED-BACKLOG` §T1-S2 names `/today` among the routes that fold
 * and says "the board folds into the home, so landing shows the composer *and*
 * what is in flight, on one surface." A route cannot be both the thing folded
 * and the thing folded into, so the content had to stop being a route before it
 * could be anywhere else.
 *
 * **Nothing about the surface changed in the move.** This is the same tree
 * `/today` has been drawing, lifted out of the route file whole rather than
 * rewritten - which is also what makes the fallout legible: 51 source-scanning
 * tests failed on ONE fact (the text they read now lives here) instead of on
 * fifty-one separate ones. A rewrite would have hidden a real regression inside
 * the same red.
 *
 * ── THE ROUTE THAT REMAINS ────────────────────────────────────────────────
 * `src/routes/_authenticated.today.tsx` still renders this and keeps its error
 * boundary. **It becomes a redirect only in the commit that mounts this on the
 * home** - a fold that removes the old door before the new one exists is a 404
 * in production, which is the ruling's own acceptance wording, and the inverse
 * is worse here: redirecting before the board is drawn anywhere else would take
 * the review queue off the product entirely.
 */
import { useNavigate } from "@tanstack/react-router";
import {
  Action,
  Door,
  Num,
  PageHeading,
  ReadFailedLine,
  RecordSpeaks,
  Region,
  Value,
} from "@/components/meridian/surface-parts";
import { WorkGlyph, type WorkGlyphKind } from "@/components/meridian/work-glyphs";
import { getForecastCalibration } from "@/lib/brain-insights.functions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import * as React from "react";

import { SendBackSheet } from "@/components/approvals/SendBack";
import { ConfidenceDisclosureChip } from "@/components/governance/ConfidenceDisclosureChip";
import { ReasonField } from "@/components/meridian/forms";
import { NeedsSetup } from "@/components/meridian/NeedsSetup";
import { taskStatus } from "@/components/meridian/TaskRows";
import { AskComposer } from "@/components/today/AskComposer";
import { callsWaitingByMission } from "@/components/today/calls-waiting";
import { DecisionQueue } from "@/components/today/DecisionQueue";
import { ElapsedRunning, parseableInstant } from "@/components/today/ElapsedRunning";
import { FocusNext } from "@/components/today/FocusNext";
import { HandoverNote } from "@/components/today/HandoverNote";
import { OverlapCheck, OverlapNote } from "@/components/today/OverlapNote";
import { CameFrom } from "@/components/today/CameFrom";
import { PushedInsights } from "@/components/today/PushedInsights";
import { runTotals, spendWords } from "@/components/today/run-totals";
import { lastMovedAt, stillnessLine } from "@/components/today/last-movement";
import { failureLine } from "@/lib/error-copy";
import { trackToBoardRows, type TrackBoardRow } from "@/components/today/tracks-feed";
import { CrewPulseNote } from "@/components/today/CrewPulseNote";
import { SystemAlerts } from "@/components/today/SystemAlerts";
import { QuietMorning } from "@/components/today/QuietMorning";
import { RunState, ShippedState } from "@/components/today/RunState";
import { ago, daysSince, withinLastDay } from "@/components/today/when";
import { useSpineStrip } from "@/components/shell/use-spine-strip";
import { useSelection } from "@/components/shell/use-selection";
import { Receipt } from "@/components/meridian/Receipt";
import { Surface } from "@/components/meridian/Surface";
import {
  duplicateWork,
  redoingSettledWork,
  repeatBadge,
  repeatLine,
  subjectKey,
} from "@/components/today/duplicate-work";
import { repeatedOutput, repeatedOutputLine } from "@/components/today/duplicate-output";
import { countIsAFloor, notTheWholeQueue } from "@/components/approvals/not-the-whole-queue";
import { SlowRead } from "@/components/shell/SlowRead";
import { stateSentence } from "@/components/today/state-sentence";
import {
  gradedLine,
  ungradedAlone,
  ungradedLine,
  worthDrawing,
} from "@/components/today/forecast-line";
import { listDueForecastsHere } from "@/lib/forecast.functions";
import { undatedNote } from "@/components/today/undated-order";
import {
  bucketEmptyLine,
  bucketTabs,
  inBucket,
  worthFiltering,
  type QueueBucket,
} from "@/components/today/queue-buckets";
import { waitingSince } from "@/components/meridian/stopped-for";
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
import { listTracks } from "@/lib/spine/track.functions";
import { listStudioSessions } from "@/lib/studio.functions";
import {
  approvalsQueueKey,
  missionsKey,
  studioSessionsKey,
  invalidateShellReads,
} from "@/lib/query-keys";
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
 *    HOW IT IS DRAWN CHANGED TWICE AND THE RULE DID NOT. Three of the four
 *    lanes — Shipped, Stuck, Still running — were grouped by OUTCOME, which is
 *    the same list one step short of the rule: it says what the machine did and
 *    leaves the reader to work out whose move it is. On 2026-08-22 they became
 *    one `AgentInbox`, whose groups are the four needs. On 2026-08-24 the
 *    review lane joined them, because two headings made the reader do the merge
 *    themselves every morning: there is ONE triage card now, read in the order
 *    of what each row costs to undo — gate calls first, then runs blocked on
 *    you, then live runs, then finished — and every run row states its verb
 *    beside its state. See the note on the feed below for the fact-by-fact
 *    account of everything the lanes carried and where each thing went.
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

/* The four states a run can be in that this surface has a lane for. Anything
   not listed is in flight in a way the reader cannot act on, and saying so
   would be four more words for no decision. `completed_with_failures` counts
   as LIVE and is labelled "partial" on its row: it shipped, and the hole in it
   is a fact about the thing that shipped, not a different lane. */
const LIVE = new Set(["completed", "done", "completed_with_failures"]);
/* `proposed` BELONGS HERE even though it is not a failure: the trigger tick
   raises a proposed mission and then waits for a person to promote it
   (studio.functions.ts fetches them separately for exactly that gate). The
   lane sets below route STUCK rows by taskStatus — blocked ones become
   Waiting-on-you — so leaving "proposed" out made the single most common
   person-gate in the product (232 of 349 missions at last measure)
   invisible on the board: in no lane, counted by no quiet line. */
const STUCK = new Set(["failed", "halted", "cancelled", "blocked", "proposed"]);
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

/* ══ THE TRIAGE FEED ════════════════════════════════════════════════════
 *
 * Engine-Room: the card names outcomes and one verb per row. No agent
 * internals, no mechanism.
 *
 * ONE CARD UNDER THE GLANCE STRIP, READ IN THE ORDER OF WHAT EACH ROW COSTS
 * TO UNDO. The review lane and the crew inbox were two headings over one
 * morning's work; a person landing here had to merge them by hand before the
 * first decision of the day. The four sections below are that merge, and the
 * order is the reversibility rule this file already ran on, read from both
 * sources at once: what needs your call cannot be undone until you act, a run
 * blocked on you moves nothing until you answer, a live run has not happened
 * yet, and what is finished is live and costs a rollback to take back.
 *
 * EVERY RUN ROW STATES ITS VERB BESIDE ITS STATE. The verb is the whole of
 * what the reader can do about that row: Reply on a run asking you something,
 * Stop on a run still going, Open on a run that ended. The calls keep their
 * own verbs — Approve, Send back, Decline, Snooze — because those ARE the
 * review act; printing "Review" above them would be one label saying what the
 * controls beside it already say (hard ban 10), so the section heading names
 * the group and the gate speaks for itself.
 *
 * WHAT EACH SECTION CARRIED OVER, fact by fact:
 *
 *   calls      the queue in full — walk mode, bulk settle, send-back, the
 *              a/d/z keys — plus the settled receipts and their door.
 *   reply      only runs whose state resolves to blocked, the same scoping the
 *              inbox applied: the answer composes beside the row and lands in
 *              Ask carrying the run's title ahead of it.
 *   live       elapsed time, the agent on it, and Stop behind the app confirm.
 *   finished   shipped rows with their handoff count and partial word, plus
 *              stopped rows — failed, halted, cancelled — which are also over,
 *              and the state word on each row says which way.
 *
 * THREE ROWS STAND OPEN PER SECTION (`LANE_ROWS`), the rest behind one count
 * that opens IN PLACE. That is the inbox's own mechanic kept, for the reason
 * it was built: this card is a scan band, and a list that quietly shows five
 * of nine is a list nobody can trust.
 */
const FEED_TITLE = "What needs you";
const FEED_CALLS = "Ready for your review";
const FEED_REPLY = "Waiting on you";
const FEED_LIVE = "Running";
const FEED_OPEN = "Finished";

/** One run row of the feed, resolved once from the mission list. The verbs are
 *  attached where the row is drawn, because they close over handlers this type
 *  should not carry. */
type CrewRow = {
  id: string;
  /** Who owns the work, named in the row's state line. */
  who: string | null;
  title: string;
  /** The state words, already coloured by RunState or ShippedState. */
  state: React.ReactNode;
  /** Epoch ms of the last thing that happened. Newest first in a section. */
  at: number;
  /**
   * A sentence the ROW cannot hold, drawn on the line underneath it.
   *
   * The state slot sits beside a truncating title and does not wrap, so it is
   * for a few words. The driver's hold sentences are real prose and run to 250
   * characters, and they are worth reading rather than clipping. Same place
   * `HandoverNote` puts what a row cannot carry.
   */
  note?: string | null;
  onOpen: () => void;
  /**
   * THE ACT THE ROW NEEDS, when "reply" is not it. A proposed mission is
   * waiting for a person to REVIEW AND LAUNCH it — the trigger tick raised
   * it and nobody has promoted it — so its verb opens the run's launch
   * control rather than an Ask composer. Absent for every other blocked row,
   * whose answer really does go back into the run as a reply.
   */
  proposed?: boolean;
  /**
   * TRUE FOR SPINE TRACKS. The section's Stop verb calls `cancelMission`,
   * which is a MISSION mutation; handing it a track id would fail at runtime,
   * so a track row takes no Stop and its control stays the row itself
   * (opening the work). There is no track-stop write to offer yet.
   */
  isTrack?: boolean;
};

/** `at` DRIVES SORT, so it may never be NaN: `b.at - a.at` against NaN sorts
 *  nothing and a row nobody can date would land unpredictably. Epoch is the
 *  honest floor — an undated row is the oldest thing in its section. */
function feedInstant(iso: string | null | undefined, fallback: string): number {
  const first = Date.parse(iso ?? "");
  if (Number.isFinite(first)) return first;
  const second = Date.parse(fallback);
  return Number.isFinite(second) ? second : 0;
}

/** A section heading: the name that says whose move it is, with the real count
 *  beside it. Same grammar as every eyebrow in the system. */
function FeedHead({ name, count }: { name: string; count: number }) {
  const kind: WorkGlyphKind | null =
    name === FEED_CALLS
      ? "call"
      : name === FEED_REPLY
        ? "reply"
        : name === FEED_LIVE
          ? "run"
          : name === FEED_OPEN
            ? "finished"
            : null;
  return (
    <div className="flex items-center gap-2">
      {kind ? <WorkGlyph kind={kind} /> : null}
      <h3 className="mrd-eyebrow">{name}</h3>
      <span className="font-mrd-mono tabular-nums text-mrd-faint">{count}</span>
    </div>
  );
}

/**
 * One run row. The whole line opens the run — that is what a click on an inbox
 * row means — so the two verbs that must NOT navigate hold their click at the
 * source. The div rather than a button, and the reply field rendered inside
 * the row, are the inbox's own reasoning kept: an `option` inside a listbox
 * may carry only `group` between them, and the compose field needs a form in
 * the row.
 */
function CrewLine({
  row,
  selected,
  entry,
  verb,
  children,
}: {
  row: CrewRow;
  selected: boolean;
  /** The list's single resident tab stop while nothing is selected. Without
   *  it the feed has no way in from the keyboard. */
  entry?: boolean;
  verb?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div data-mrd="">
      <div
        id={`feed-row-${row.id}`}
        tabIndex={selected || entry ? 0 : -1}
        role="option"
        aria-selected={selected}
        onClick={row.onOpen}
        className={`flex w-full items-baseline gap-mrd-3 rounded-mrd-xs px-mrd-2 py-mrd-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--mrd-focus)] hover:bg-mrd-hover cursor-pointer`}
        style={{ transitionDuration: "var(--mrd-d-press)" }}
      >
        {/* Truncation, not wrapping: three rows stand open per section and a
            wrapped title spends the scan band on prose. The full title is the
            run page's own h1, one click away. */}
        <span className="min-w-0 flex-1 truncate text-mrd-label font-medium text-mrd-ink">
          {row.title}
        </span>
        {/* BOUNDED, FOR THE SAME REASON THE TITLE IS. This span is `shrink-0`
            so a live clock like "19h 23m running" is never clipped, and that
            was safe only while every state line was short. It is not any more:
            a parked track carries the driver's own hold sentence, and those run
            to 250 characters ("This station has been run many times over and
            the work has not moved on once. That is the loop rather than any
            single run, so nothing further will be spent on it until you look.")
            In a shrink-0 span that squeezes the title to nothing and breaks the
            row. Two open tracks in this workspace are in exactly that state.
            A ceiling with truncation keeps every ordinary state intact, since
            they are far under it, and degrades the pathological one instead of
            destroying the row around it. The full sentence is on the run, one
            click away, which is the argument the title's own truncation makes. */}
        <span className="flex min-w-0 max-w-[40ch] shrink-0 items-baseline gap-mrd-2 truncate text-mrd-data text-mrd-mute">
          {row.who ? `${row.who} · ` : ""}
          {row.state}
        </span>
        {verb}
      </div>
      {children}
    </div>
  );
}

export function Board() {
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
  const fetchTracks = useServerFn(listTracks);
  const fListSessions = useServerFn(listStudioSessions);
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
  /* THE WORK THE MISSION LIST CANNOT SEE. `/start` creates a spine track and
     no mission, so without this read that work never appeared on the board at
     all. The key is the SHELL'S (`["shell","open-tracks"]`, AppFrame's own
     query): one shared cache entry, the shell's cadence driving it, and no
     second request while the shell is up. */
  const tracks = useQuery({
    queryKey: ["shell", "open-tracks"],
    queryFn: () => fetchTracks(),
  });
  /* WHO IS ACTUALLY WAITING ON YOU. A gated mission keeps status "running",
     so the lanes alone would call it agent work; this read (the same shared
     app-wide key the strip and /runs use) carries each mission's open-call
     count and the rows below reclassify by it. */
  const fetchSessions = useServerFn(listStudioSessions);
  const sessions = useQuery({
    queryKey: studioSessionsKey(workspaceId),
    queryFn: () => fListSessions({ data: { includeArchived: false, workspaceId } }),
    /*
     * ── DO NOT ASK BEFORE WE KNOW WHICH WORKSPACE (2026-08-31) ────────────
     *
     * This read was unguarded while both its KEY and its PAYLOAD carry
     * `workspaceId`, so on first paint it fired once with the workspace still
     * unresolved and again with the real id — **two requests and two cache
     * entries for one answer**, the second of which is the only usable one.
     *
     * ── AND THE HYPOTHESIS THAT LED HERE WAS MOSTLY WRONG, WHICH IS WHY
     *    THIS COMMENT IS SMALLER THAN IT WAS ────────────────────────────────
     * I found this while chasing a ten-second spinner on the home, having
     * measured `listStudioSessions` as the most-called server function on a
     * cold load. **It is not this.** The strip polls the SAME key every five
     * seconds shell-wide (`use-spine-strip.ts`), and a later count of seven
     * calls over a ~35s window is exactly 35/5. **The repetition is the poll,
     * and the poll is honest.**
     *
     * So the guard removes ONE meaningless request — the unresolved-workspace
     * call — and no more. **It is not a fix for the spinner and is not claimed
     * as one.** It stands on its own smaller merit: a read that names a
     * workspace in its key and its payload cannot answer anything before there
     * is one, and firing it writes a cache entry under a key nobody will read.
     *
     * It matters more than it did last week: `/today` folded into the home, so
     * this is no longer a page somebody visits. **Every arrival pays it.**
     *
     * The other two unguarded reads on this surface are deliberately so and
     * were left alone: `fetchTracks` rides the SHELL's `["shell","open-tracks"]`
     * key on the shell's cadence, and `fDueForecasts` shares one fetch with the
     * station strip. Guarding either would add a request rather than remove one.
     */
    enabled: Boolean(workspaceId),
  });

  /* Both memoised on the QUERY's data rather than derived inline. A bare
     `?? []` builds a new array on every render, so every list below it would
     recompute on every render and `useSelection` would be handed a fresh id
     array each time — which is the one input it must be able to compare. */
  const items = React.useMemo(() => queue.data?.items ?? [], [queue.data]);
  /* WHAT THE QUEUE KNOWS IT DID NOT SHOW. `getApprovalsQueue` bounds every one
     of ten families and degrades a family that throws to an empty list, so a
     partial read arrives looking exactly like a complete one. Until this field
     existed there was no signal in the payload at all and no guard on this
     surface could have been written - which is why this board waited for it
     rather than inferring it. */
  const incomplete = queue.data?.incomplete;
  const queueIsPartial = countIsAFloor(incomplete);
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
  /*
   * THE LANE READS THE UNWINDOWED SET, AND THE HEADLINE STILL READS `stuck`.
   *
   * `stuck` is filtered through `withinLastDay`, which is right for a sentence
   * about the morning and wrong for the lane whose whole job is "what needs
   * you". Blocked work does not age out: it stays blocked, and the longer it
   * waits the more it needs a person. The window deleted exactly the rows the
   * lane exists to show.
   *
   * IT ALSO PUT TWO NUMBERS ON ONE SCREEN THAT READ AS A CONTRADICTION. The
   * station strip above the board counts the same population without a window
   * and said "89 runs waiting on you" while this lane's own head said 1.
   * `use-spine-strip.ts` records that exact failure happening once before, in
   * its own words: two numbers "right about different objects" with the same
   * six words between them, so the screen reads as broken.
   *
   * The headline keeps `stuck` deliberately. It says "N runs are stuck", and
   * the STUCK set includes `proposed`, which is a mission a trigger raised and
   * nobody has launched. Calling 89 of those "stuck" would be a worse sentence
   * than the one this fixes. Splitting proposed from stuck properly is the real
   * repair and it is a bigger change than this one; the window is doing that
   * job by accident today and this leaves it doing so.
   */
  const blockedAll = React.useMemo(() => rows.filter((m) => STUCK.has(m.status)), [rows]);
  /*
   * STOPPED AND UNLAUNCHED ARE NOT THE SAME WORD.
   *
   * `STUCK` holds `failed`, `halted`, `cancelled`, `blocked` AND `proposed`,
   * which is right for routing every one of them into the lane that needs a
   * person. It is wrong for the HEADLINE, which says "N runs are stuck": a
   * `proposed` mission is one an ambient trigger raised and nobody has launched
   * yet. Nothing went wrong with it. This workspace holds 89 of them, so the
   * headline was one unwindowed read away from telling a person that 89 runs
   * were stuck when none of them had started.
   *
   * Both counts are unwindowed, for the reason the lane is: neither stopped
   * work nor an unlaunched proposal ages out of needing you.
   */
  const stoppedAll = React.useMemo(
    () => blockedAll.filter((m) => m.status !== "proposed"),
    [blockedAll],
  );
  const proposedAll = React.useMemo(
    () => blockedAll.filter((m) => m.status === "proposed"),
    [blockedAll],
  );
  const running = React.useMemo(() => rows.filter((m) => WORKING.has(m.status)), [rows]);

  /* THE GATE COUNT PER RUNNING MISSION, so "waiting on an agent" is never
     said about work that is actually waiting on you. See calls-waiting.ts. */
  const gatesByMission = React.useMemo(
    () => callsWaitingByMission(sessions.data?.sessions),
    [sessions.data],
  );

  /* WHAT THE WORK COST, which no other surface says now that /runs redirects.
     Both figures come from reads this page already makes, so it costs nothing.
     Sessions and tracks are two engines and their spend is NOT added together:
     see run-totals.ts for why a combined figure would be uncheckable. */
  /* TRACKS ARE NOT PASSED, and that is a limit rather than an oversight:
     `listTracks` does not select `spend_used_usd`, so the loop's spend is not
     in any read this page makes. It is $3.4734 across 37 tracks in the
     database and I will not print a number I cannot source from a payload. A
     server-side change is filed; until then this line speaks only for runs. */
  const totals = React.useMemo(
    () => runTotals(sessions.data?.sessions, undefined),
    [sessions.data],
  );

  /* WHEN ANYTHING LAST MOVED. The brief's third glance-fact is "what changed",
     and its honest form is this: there is no per-user last-seen watermark in
     the database (when.ts and today-lanes.functions.ts:542 both say so), so
     "since you last looked" cannot be drawn. When the workspace last moved can.
     Reads the rows already on hand; speaks only once movement has stopped. */
  const stillness = React.useMemo(
    () => stillnessLine(lastMovedAt(Date.now(), rows, tracks.data), Date.now(), ago),
    [rows, tracks.data],
  );

  // The track record read. CHARACTER-IDENTICAL KEY to Brain's, so the two
  // surfaces are two consumers of ONE request and the tab opens on a cache hit.
  const fCalibration = useServerFn(getForecastCalibration);
  const fDueForecasts = useServerFn(listDueForecastsHere);
  /* A DIFFERENT KEY BECAUSE IT IS A DIFFERENT QUESTION. The desk asks "every
     call anywhere that needs settling" and this board asks about the workspace
     it is showing. Sharing `["forecast-due"]` with the desk would have made one
     cache entry answer both, so whichever mounted first would decide what the
     other saw. The station strip reads this same scoped key, so the two
     workspace-scoped surfaces still cost one fetch between them. */
  const dueForecasts = useQuery({
    queryKey: ["forecast-due", "workspace"],
    queryFn: () => fDueForecasts(),
    staleTime: 60_000,
  });
  const calibrationQ = useQuery({
    queryKey: ["forecast-calibration", workspaceId],
    queryFn: () => fCalibration(),
    enabled: Boolean(workspaceId),
  });
  const calibration = calibrationQ.data;
  /* THE TWO HALVES OF THE TRACK RECORD, side by side and each null until its
     own read answers. `ungraded` takes `total`, NEVER `due.length`:
     `listDueForecasts` bounds the array at `DUE_FORECAST_PAGE` and returns the
     population beside it, and S1 shipped the page length on another surface and
     understated by three the moment it landed. */
  const standing = React.useMemo(
    () => ({
      resolved: calibration?.prediction.resolved ?? null,
      hits: calibration?.prediction.hits ?? null,
      ungraded: dueForecasts.data?.total ?? null,
    }),
    [calibration, dueForecasts.data],
  );

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
    /* Cancelling failed, so the run did not stop. Say that, and let the
       server's own words through only if they were written for a person. */
    onError: (error: Error) => toast.error(failureLine("The run is still going.", error)),
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
  /*
   * TWO TEAMMATES ANSWERED THE SAME THING (SPEC-AGENT-COMMS §3, `claim`).
   *
   * `claim` is the type that would PREVENT this and it has zero rows ever, so
   * this is the half that can be true today: say it happened. And the case is
   * not hypothetical - the only two real learnings this product has ever
   * recorded are the same learning, written by two agents 26 seconds apart
   * (F-158). A row comparison, never a model call.
   */
  const repeatedAnswers = React.useMemo(
    () =>
      repeatedOutput(
        (learnings.data?.learnings ?? []).map((l) => ({
          id: l.id,
          recordedBy: l.recorded_by_agent_slug,
          createdAt: l.created_at,
          /* `decision_id` is not on this payload - `listLearnings` selects the
             embedded `decision:decisions(forecast_claim)` instead. Asked for as
             one field; the claim is the subject's own text meanwhile, which is
             a key borrowed from the decision rather than a similarity judgement
             about the learnings. */
          subjectClaim: l.forecast_claim,
          verdict: l.verdict,
        })),
      ),
    [learnings.data],
  );
  const repeatedAnswersLine = repeatedOutputLine(repeatedAnswers);
  /* Resolved once here rather than inline in the block's evidence line, so the
     JSX below reads as what is printed and not as how it was parsed. */
  const learningVerdictClass = learning ? LEARNING_VERDICT_CLASS[learning.verdict] : undefined;
  const learningIce = learning ? iceMovement(learning.prior_ice, learning.new_ice) : null;
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

  /*
   * ══ THE FEED'S RUN ROWS ═════════════════════════════════════════════════
   *
   * Three sections of rows, resolved once from the same three windows the
   * lanes fed. The mapping is the inbox's, one group at a time: `taskStatus`
   * owns every state word, so a value this file does not recognise still lands
   * somewhere honest.
   *
   * THE REPLY STAYS SCOPED AND COMPOSED BESIDE THE ROW. Only blocked rows take
   * it — nothing consumes a reply addressed to work that has ended, and a
   * running agent has no path for one mid-flight. The answer composes in the
   * row's own field and lands in Ask through `openAsk`, the one writer this
   * surface has, carrying the run's title ahead of it: `openAsk` SENDS its
   * argument as the conversation's first turn (AskPane runs an opener's intent
   * verbatim), which is why the compose step cannot be skipped — seeding the
   * pane with a half sentence would send it.
   */
  const openRun = React.useCallback(
    (id: string) => () => void navigate({ to: "/runs/$missionId", params: { missionId: id } }),
    [navigate],
  );

  const replyRows = React.useMemo<CrewRow[]>(
    () =>
      blockedAll
        .filter((m) => taskStatus(m.status) === "blocked")
        .map((m) => {
          const when = ago(m.completed_at ?? m.updated_at);
          return {
            id: m.id,
            who: m.current_agent_slug ? agentDisplayName(m.current_agent_slug) : null,
            title: cleanTitle(m.title),
            proposed: m.status === "proposed",
            state: (
              <>
                <RunState status={m.status} />
                {when ? ` ${when}` : ""}
              </>
            ),
            at: feedInstant(m.completed_at ?? m.updated_at, m.created_at),
            onOpen: openRun(m.id),
          };
        })
        /* OLDEST FIRST, and this lane is the ONLY one that sorts this way.
           Running and Finished sort newest-first because for work in motion the
           story is recency. Here the story is the opposite: nothing in this lane
           moves until a person acts, so the longer a thing has sat the more it
           needs them. Sorting it newest-first, which is what this line used to
           do, put the freshest arrival on top and buried the oldest behind a cap
           of three and an overflow control. Measured 2026-08-27: the oldest gate
           in this workspace has been waiting 33 days, and it was the last row of
           a folded list. The brief's words for this lane are "sorted by what
           needs a person soonest", and recency is not that. */
        .sort((a, b) => a.at - b.at),
    [blockedAll, openRun],
  );

  const liveRows = React.useMemo<CrewRow[]>(
    () =>
      running
        .map((m) => {
          /* The sub-goal, not the title: what the agent is actually doing right
             now is the sentence this product is for.
             THE CLOCK TICKS rather than freezing at poll time — a real elapsed
             from the mission's own created_at (ElapsedRunning for the honest
             cases; the plain word when the timestamp cannot drive a clock). */
          const startedAt = parseableInstant(m.created_at);
          return {
            id: m.id,
            who: m.current_agent_slug ? agentDisplayName(m.current_agent_slug) : null,
            title: stripAutoPrefix(m.current_sub_goal ?? m.title),
            state: startedAt ? <ElapsedRunning startedAt={startedAt} /> : <>running</>,
            at: feedInstant(m.updated_at, m.created_at),
            onOpen: openRun(m.id),
          };
        })
        .sort((a, b) => b.at - a.at),
    [running, openRun],
  );

  const openRows = React.useMemo<CrewRow[]>(
    () =>
      [
        ...shipped.map((m): CrewRow => {
          const when = ago(m.completed_at);
          return {
            id: m.id,
            who: m.current_agent_slug ? agentDisplayName(m.current_agent_slug) : null,
            title: cleanTitle(m.title),
            state: (
              <>
                {m.hop_count > 0 ? (
                  <>
                    <Num>{m.hop_count}</Num> {m.hop_count === 1 ? "handoff" : "handoffs"} ·{" "}
                  </>
                ) : null}
                {/* `completed_with_failures` is NOT a failure: it went out, and
                  the hole in it is a fact about the thing that shipped.
                  `ShippedState` says "partial", which is the whole of what is
                  true. */}
                <ShippedState partial={m.status === "completed_with_failures"} />
                {when ? ` ${when}` : ""}
              </>
            ),
            at: feedInstant(m.completed_at, m.updated_at),
            onOpen: openRun(m.id),
          };
        }),
        ...stuck
          .filter((m) => taskStatus(m.status) !== "blocked")
          .map((m): CrewRow => {
            const when = ago(m.completed_at ?? m.updated_at);
            return {
              id: m.id,
              who: m.current_agent_slug ? agentDisplayName(m.current_agent_slug) : null,
              title: cleanTitle(m.title),
              /* `halted` and `cancelled` read as two different facts in the line:
               a deliberate stop and the engine stopping are not the same news. */
              state: (
                <>
                  <RunState status={m.status} />
                  {when ? ` ${when}` : ""}
                </>
              ),
              at: feedInstant(m.completed_at ?? m.updated_at, m.created_at),
              onOpen: openRun(m.id),
            };
          }),
      ].sort((a, b) => b.at - a.at),
    [shipped, stuck, openRun],
  );

  /* SPINE WORK, INTO THE SAME THREE SECTIONS. Rows built from `spine_tracks`
     (the work `/start` creates — which the mission list never sees) merge into
     the feed so a reader meets ONE "Running", ONE "Waiting on you", ONE
     "Finished", whichever engine drives the work. A track its own mission
     already shows is dropped before grouping (`tracks-feed.ts`), so nothing
     renders twice. */
  const openTrackIds = React.useMemo(
    () => new Set(rows.map((m) => m.trackId).filter((t): t is string => !!t)),
    [rows],
  );
  const openTrack = React.useCallback(
    (trackId: string) => () => void navigate({ to: "/track/$trackId", params: { trackId } }),
    [navigate],
  );
  const trackCrewRows = React.useMemo(() => {
    const grouped = trackToBoardRows(tracks.data, openTrackIds, ago);
    const base = (r: TrackBoardRow): CrewRow => ({
      id: r.id,
      who: null,
      isTrack: true,
      title: r.title,
      state: (
        <>
          {`at ${r.stationWord}`}
          {r.lastMoved ? ` · moved ${r.lastMoved} ago` : ""}
        </>
      ),
      at: r.at,
      onOpen: openTrack(r.trackId),
    });
    return {
      reply: grouped.waiting.map((r): CrewRow => ({
        ...base(r),
        state: <>{r.holdLine ?? "waiting on your answer"}</>,
        note: r.reason,
      })),
      // A held track says WHY before it says when it moved: stopped-for-a-
      // reason must not read as slow.
      live: grouped.running.map((r): CrewRow => ({
        ...base(r),
        state:
          r.holdLine && r.lastMoved ? (
            <>
              {r.holdLine} · moved {r.lastMoved} ago
            </>
          ) : r.holdLine ? (
            <>{r.holdLine}</>
          ) : (
            base(r).state
          ),
        note: r.reason,
      })),
      open: grouped.finished.map((r): CrewRow => ({
        ...base(r),
        state: <>{r.lastMoved ? `done · moved ${r.lastMoved} ago` : "done"}</>,
      })),
    };
  }, [tracks.data, openTrackIds, openTrack]);

  /* RUNNING WORK HELD AT A GATE belongs in Waiting-on-you, not Running: the
     loop stopped for a call and the call is yours. State carries the count in
     plain words; the row's verb stays Reply, because an answer goes back into
     the run the same way. */
  const gatedRows = React.useMemo<CrewRow[]>(
    () =>
      running
        .filter((m) => gatesByMission.has(m.id))
        .map((m) => {
          const n = gatesByMission.get(m.id) ?? 0;
          return {
            id: m.id,
            who: m.current_agent_slug ? agentDisplayName(m.current_agent_slug) : null,
            title: stripAutoPrefix(m.current_sub_goal ?? m.title),
            state: (
              <>
                <Num>{n}</Num> {n === 1 ? "call" : "calls"} waiting on you
              </>
            ),
            at: feedInstant(m.updated_at, m.created_at),
            onOpen: openRun(m.id),
          };
        })
        /* Same lane, same rule: oldest first. These rows come from the sessions
           read rather than the windowed mission list, so unlike the rows above
           they can genuinely be weeks old, which is exactly why they must not
           sort to the bottom. */
        .sort((a, b) => a.at - b.at),
    [running, gatesByMission, openRun],
  );

  /* THE MERGE MUST RE-SORT, or the per-list ordering above is decorative.
     Three sources feed this lane: blocked missions (windowed to 24 hours),
     gated sessions (NOT windowed, so genuinely weeks old) and spine tracks.
     Concatenating them put every gated row after every mission row regardless
     of age, so the 33-day gate still sorted below a mission blocked ten minutes
     ago. Oldest first across the whole lane, for the reason on replyRows. */
  const allReplyRows = React.useMemo(() => {
    const merged = [...replyRows, ...gatedRows, ...trackCrewRows.reply].sort((a, b) => a.at - b.at);
    /*
     * A ROW THAT IS THE FOURTH COPY SAYS SO (2026-08-27).
     *
     * The lane note says how much of this list repeats itself. That is the
     * fact a person needs before they start, and on its own it is a warning
     * they cannot act on, because it does not say WHICH rows it was about.
     * Measured live: 89 proposals under 48 subjects, one of them raised seven
     * times. Somebody working down this lane answers the same request seven
     * times without the rows ever admitting they are the same request.
     *
     * It goes in `note`, which this type already defines as "a sentence the
     * ROW cannot hold, drawn on the line underneath it" — the state slot beside
     * the title does not wrap and is for a few words. Where a row already has
     * a note, usually a driver hold sentence worth reading, this is APPENDED
     * rather than substituted: which of the two matters more is the reader's
     * call and not this line's.
     */
    const size = new Map(duplicateWork(merged).groups.map((g) => [g.key, g.total]));
    if (size.size === 0) return merged;
    return merged.map((r) => {
      const badge = repeatBadge(size.get(subjectKey(r.title)) ?? 0);
      if (!badge) return r;
      return { ...r, note: r.note ? `${r.note} ${badge}` : badge };
    });
  }, [replyRows, gatedRows, trackCrewRows]);
  const allLiveRows = React.useMemo(
    () => [...liveRows.filter((r) => !gatesByMission.has(r.id)), ...trackCrewRows.live],
    [liveRows, gatesByMission, trackCrewRows],
  );
  const allOpenRows = React.useMemo(
    () => [...openRows, ...trackCrewRows.open],
    [openRows, trackCrewRows],
  );
  /* The board's own count of spine work standing somewhere, used by the quiet
     line below: "no agent is working" must stay true when only tracks move. */
  const trackTotal =
    trackCrewRows.reply.length + trackCrewRows.live.length + trackCrewRows.open.length;

  /** Which run is composing its reply. One at a time; opening one closes the
   *  other, because two open fields in one scan band is a form nobody reads. */
  const [replyTo, setReplyTo] = React.useState<string | null>(null);

  /* THE OVERFLOW CONTROLS, ONE STATE PER SECTION. Two sections can be open at
     once, and forcing them to take turns would close a section under the
     reader, which is the defect the inbox already recorded. */
  const [moreOpen, setMoreOpen] = React.useState<string[]>([]);
  const toggleMore = React.useCallback((key: string) => {
    setMoreOpen((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }, []);

  /* THE FEED'S KEYBOARD, AND IT IS THE INBOX'S MECHANIC KEPT RATHER THAN
     REINVENTED. One tab stop for the whole run list while nothing is selected,
     `j`/`k` and the arrows moving through what is actually on screen, and focus
     following the selection so the browser does the scrolling.
     
     THE HANDLER STOPS PROPAGATION ON THE KEYS IT TAKES. The queue's listener is
     a window-level one and would otherwise move the open call every time `j`
     moved a feed row; holding the event at the list means the two lists can
     never move at once. Keys pressed outside this subtree still reach the queue
     untouched. */
  const [feedSel, setFeedSel] = React.useState<string | null>(null);

  /** What each section stands open: three rows, or all of them once its
   *  overflow control has been taken. */
  const standingRows = (key: string, all: CrewRow[]) =>
    moreOpen.includes(key) ? all : all.slice(0, LANE_ROWS);

  const feedSections = React.useMemo(
    () => [
      { key: FEED_REPLY, all: allReplyRows },
      { key: FEED_LIVE, all: allLiveRows },
      { key: FEED_OPEN, all: allOpenRows },
    ],
    [allReplyRows, allLiveRows, allOpenRows],
  );

  /* The flattened visible order, which is what the keys move through. A row
     behind a closed overflow control is not on screen, so `j` may not land on
     it. */
  const feedOrder = React.useMemo(() => {
    const ids: string[] = [];
    for (const section of feedSections) {
      for (const row of standingRows(section.key, section.all)) ids.push(row.id);
    }
    return ids;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedSections, moreOpen]);

  const moveFeed = React.useCallback(
    (delta: number) => {
      if (feedOrder.length === 0) return;
      /* Never take focus off a text control: the reply field lives in this
         subtree, and "j" is a letter somebody is typing. Same guard the inbox
         ran, and for the same bisected hang. */
      const active = document.activeElement as HTMLElement | null;
      const tag = active?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || active?.isContentEditable) return;
      const at = feedSel ? feedOrder.indexOf(feedSel) : -1;
      const next = at === -1 ? 0 : (at + delta + feedOrder.length) % feedOrder.length;
      const id = feedOrder[next]!;
      setFeedSel(id);
      document.getElementById(`feed-row-${id}`)?.focus();
    },
    [feedOrder, feedSel],
  );

  const feedKeys = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const el = event.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || el?.isContentEditable) return;
      if (event.key === "ArrowDown" || event.key === "j") {
        event.preventDefault();
        event.stopPropagation();
        moveFeed(1);
      }
      if (event.key === "ArrowUp" || event.key === "k") {
        event.preventDefault();
        event.stopPropagation();
        moveFeed(-1);
      }
    },
    [moveFeed],
  );

  const crewTotal = allReplyRows.length + allLiveRows.length + allOpenRows.length;

  /** One feed section: heading with its real count, one sentence saying what
   *  the group costs, three rows standing, and the rest behind a count that
   *  opens IN PLACE. The verb is per row and supplied by the caller; the reply
   *  field is the one thing that renders under a row. */
  const crewSection = (
    name: string,
    all: CrewRow[],
    /* THE TRUE TOTAL, when the page holds fewer rows than exist.
       `listMissions` returns the first 50 by recency; `totalBlocked` counts
       every one. The head says the number a person is actually facing, which is
       also the number the station strip above this board has always shown, so
       the two stop disagreeing. Undefined keeps `all.length`, which is right
       for every lane whose rows are all of them. */
    trueCount: number | undefined,
    /* A NODE RATHER THAN A STRING since 2026-08-26, so a section's own sentence
       can carry a clause that has to be READ before it can be written — Running
       says what it could not check for overlap, and that is only knowable from a
       query. The base sentence still stands alone, so nothing here can resolve a
       wait to nothing. */
    note: React.ReactNode,
    verbFor: (row: CrewRow) => React.ReactNode,
    extraFor?: (row: CrewRow) => React.ReactNode,
  ) => {
    const headCount = trueCount ?? all.length;
    /*
     * EXPANDING A LANE USED TO REMOVE THE CONTROL THAT COLLAPSES IT.
     *
     * `standingRows` returns ALL rows once a lane is expanded, which is right
     * for its other caller: the keyboard order has to walk everything on
     * screen. Used here it made `over` empty, and the whole `over.length > 0`
     * block is what draws the toggle, so opening a lane deleted "Show fewer"
     * and a person could not close it again. Found by clicking it.
     *
     * The cap and the remainder are constants of the list, not of its open
     * state. `expanded` decides whether the remainder is DRAWN, one line below,
     * which is what that ternary always intended.
     */
    const shown = all.slice(0, LANE_ROWS);
    const over = all.slice(LANE_ROWS);
    const expanded = moreOpen.includes(name);
    const line = (row: CrewRow) => (
      <CrewLine
        key={row.id}
        row={row}
        selected={feedSel === row.id}
        entry={feedSel === null && feedOrder[0] === row.id}
        verb={verbFor(row)}
      >
        {extraFor?.(row)}
      </CrewLine>
    );
    return (
      <section role="group" aria-label={name} className="flex flex-col">
        <FeedHead name={name} count={headCount} />
        <p className="mb-mrd-2 max-w-[62ch] text-mrd-data leading-mrd-prose text-mrd-mute">
          {note}
        </p>
        <div className="flex flex-col">
          {shown.map(line)}
          {over.length > 0 ? (
            <>
              <div className="px-mrd-2 py-mrd-1">
                <Action variant="quiet" aria-expanded={expanded} onClick={() => toggleMore(name)}>
                  {expanded ? "Show fewer" : `${over.length} more`}
                </Action>
              </div>
              {expanded ? over.map(line) : null}
              {expanded && headCount > all.length ? (
                /* WHAT THE PAGE COULD NOT REACH. The head says the true total
                   and the page holds the 50 most recently touched, so expanding
                   this list ends before the number above it does. Without this
                   line a person counts the rows, finds fewer than the head
                   claimed, and concludes the head is wrong — which would undo
                   the fix that put a true number there. The inbox door at the
                   foot of this region is where the rest actually are. */
                <p className="px-mrd-2 py-mrd-1 text-mrd-data text-mrd-mute">
                  Showing <Num>{all.length}</Num> of <Num>{headCount}</Num>. The rest are in the
                  inbox.
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      </section>
    );
  };

  /* EVERY EMPTY CATEGORY, NAMED. An empty group draws nothing at all inside the
     inbox, which is right there and wrong here: "nothing stopped" is the single
     most valuable sentence on a morning surface and it used to be said out loud
     by the lane that was empty. So the assurances are collected and said once,
     on the region's own line, where all three fit and read as one sentence. */
  const crewQuiet = [
    /* "nothing stopped" is a claim about STOPPED work, so it reads `stoppedAll`
       rather than the windowed set that also counts unlaunched proposals. */
    stoppedAll.length === 0 && trackCrewRows.reply.length === 0 ? "nothing stopped" : null,
    running.length === 0 && trackCrewRows.live.length === 0 ? "no agent is working" : null,
    shipped.length === 0 && trackCrewRows.open.length === 0 ? "nothing went live" : null,
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

  /*
   * THE FILTER THE FOLD WAS ABOUT TO COST A PERSON.
   *
   * `/approvals` carries five text tabs over `filterBucket`, each with a count,
   * and SURFACE-MAP marks that route FOLD. The board it folds into had no
   * filter at all, so the fold would have quietly removed the only way anyone
   * had to triage fifty-two calls. This lane's rule is that the fold removes a
   * door, not a capability.
   *
   * `bucket` NARROWS WHAT THE QUEUE SHOWS AND NOTHING ELSE. The headline, the
   * lane note and `quietMorning` all keep reading `items`, the whole set,
   * because "52 decisions are ready for your review" is a fact about the
   * workspace and must not move when a reader looks at one bucket. A count that
   * changes with a filter is a count nobody can quote.
   *
   * The active bucket self-heals: if the one you were in empties as you settle
   * its last call, `tabs` stops offering it and this falls back to all of them
   * rather than leaving you in a bucket that no longer exists.
   */
  const [bucket, setBucket] = React.useState<QueueBucket | null>(null);
  const bucketList = React.useMemo(() => bucketTabs(items, bucket), [items, bucket]);
  const activeBucket = bucketList.some((t) => t.id === bucket) ? bucket : null;
  /*
   * OLDEST FIRST, AND THE BOARD WAS SHOWING THE OPPOSITE.
   *
   * `approvals-queue.functions.ts:908` sorts the queue NEWEST FIRST
   * (`b.timestamp` against `a.timestamp`), and this board never re-sorted it.
   * So the freshest call sat in the card at the top while the oldest waited at
   * the bottom of a list that shows three rows and folds the rest behind
   * "Walk the queue".
   *
   * `/approvals` already fixed exactly this and recorded why: that surface
   * "used to put the freshest call in front of a person while an 86 HOUR GATE
   * sat at the bottom of the page". It is the same defect this lane fixed in
   * the waiting lane earlier tonight, for the same reason - nothing in a queue
   * of calls moves until a person acts, so the longer a thing has sat the more
   * it needs them, and recency is the opposite of that.
   *
   * `waitingSince` is imported rather than reimplemented: two comparators for
   * one order is how two surfaces come to disagree about which call is oldest.
   * Nulls sort LAST, as they do there - a call with no timestamp is not the
   * most urgent thing on the screen, it is a gap in what we know about it.
   */
  const visibleItems = React.useMemo(() => {
    const inFilter = inBucket(items, activeBucket);
    return inFilter.sort((a, b) => {
      const at = waitingSince(a.timestamp);
      const bt = waitingSince(b.timestamp);
      /* A ROW WITH NO AGE GOES LAST, AND `undatedNote` BELOW SAYS SO. Wherever
         an unplaceable row lands, the reader interprets its position as an age;
         at the bottom of an oldest-first list that reads as "newest", and it
         could be the oldest thing here. Last is the least wrong PLACE, and it
         is still wrong on its own - the sentence is the half that fixes it.
         Neither half works without the other, so they change together. */
      if (at === null && bt === null) return 0;
      if (at === null) return 1;
      if (bt === null) return -1;
      return at - bt;
    });
  }, [items, activeBucket]);

  const undatedLine = React.useMemo(() => undatedNote(visibleItems), [visibleItems]);
  const focused = React.useMemo(
    () => visibleItems.find((i) => i.id === focusedId) ?? visibleItems[0] ?? null,
    [visibleItems, focusedId],
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
        /* WHAT IS STILL TRUE, not what the server called the failure. This
           printed `error.message` into the product's own voice, so a person
           read "Nothing was recorded" and then a log line. The useful fact
           after a failed decision is that the optimistic update was rolled
           back one line above: the call is where it was. `failureLine` appends
           the server's sentence only when it was written for a person. */
        consequence: failureLine("The call is still waiting on you.", error),
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
        /* WHAT IS STILL TRUE, not what the server called the failure. This
           printed `error.message` into the product's own voice, so a person
           read "Nothing was recorded" and then a log line. The useful fact
           after a failed decision is that the optimistic update was rolled
           back one line above: the call is where it was. `failureLine` appends
           the server's sentence only when it was written for a person. */
        consequence: failureLine("The call is still waiting on you.", error),
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
        /* WHAT IS STILL TRUE, not what the server called the failure. This
           printed `error.message` into the product's own voice, so a person
           read "Nothing was recorded" and then a log line. The useful fact
           after a failed decision is that the optimistic update was rolled
           back one line above: the call is where it was. `failureLine` appends
           the server's sentence only when it was written for a person. */
        consequence: failureLine("The call is still waiting on you.", error),
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
  /*
   * THE TWO READS, SEPARATELY, BECAUSE THE HEADLINE NOW ASKS THEM SEPARATELY.
   *
   * `loading` is true while EITHER is outstanding, which is right for anything
   * that needs both and wrong as a dependency for something that does not. The
   * headline waits only on the queue, so when the queue lands while the record
   * is still reading, `loading` does not change — and a memo keyed on it would
   * not recompute.
   *
   * It happened to work anyway, which is worse than failing: `items.length`
   * went 0 -> 52 in the same tick and that IS in the dependency list, so the
   * headline updated for a reason unrelated to the read it was waiting on. In a
   * workspace whose queue answers with ZERO items nothing in that list would
   * have changed, and the headline would have sat on "Today" after its read had
   * landed. Found by the exhaustive-deps warning my own change introduced.
   */
  const queueAnswered = !stillWaiting(queue);
  const recordAnswered = !stillWaiting(missions);
  /*
   * A QUIET MORNING IS A CLAIM ABOUT THE WORKSPACE, NOT ABOUT THE LAST DAY.
   *
   * This asked `stuck.length === 0`, and `stuck` is filtered through
   * `withinLastDay` (:670). So the test was "nothing became blocked in the last
   * 24 hours", while the sentence it gates says nothing needs you at all, and
   * the screen it gates shows a worked Example on the premise that there is
   * nothing real to look at.
   *
   * Measured 2026-08-27: this workspace holds 89 missions waiting on a person
   * and 85 of them last moved between 8 and 30 days ago. Three are inside the
   * window today, so the quiet screen does not fire. **When those three age out
   * it will, and the board will offer an Example while 89 things wait.** That
   * is not a hypothetical; it is what tomorrow looks like.
   *
   * So the quiet test reads the UNWINDOWED rows. `stuck` keeps its window,
   * because the lane is genuinely about the last day and says so. Being quiet
   * is a stronger claim than having a quiet lane, and it needs the stronger
   * test. The cap on `listMissions` still applies, which makes this test
   * conservative in the safe direction: it can fail to call a morning quiet,
   * and it cannot call a busy one quiet.
   */
  const anythingBlocked = React.useMemo(() => rows.some((m) => STUCK.has(m.status)), [rows]);
  /*
   * `crewTotal === 0` CARRIES THE TRACKS, and leaving it out was a second way
   * to claim a quiet morning over work that is on screen. Every clause here
   * counts MISSIONS: `items`, `shipped`, `anythingBlocked` and `running` all
   * read the mission list, and none of them can see a spine track. `/start`
   * creates a track and no mission (C2-003), so a workspace driving three
   * tracks and no missions satisfied every test above while three rows stood
   * in the feed underneath the sentence saying nothing needed anyone.
   *
   * This workspace has three open tracks right now, so it is the live case
   * rather than a hypothetical. `crewTotal` is the feed's own total across all
   * three lanes and both engines, which makes it the same number the reader is
   * looking at.
   */
  const quietMorning =
    !loading &&
    !queue.isError &&
    !missions.isError &&
    /* A PARTIAL READ IS NOT A QUIET MORNING, and this is the case `isError`
       cannot see. `getApprovalsQueue` degrades a family that THROWS to an empty
       list so that one refusal cannot blank the other nine - which is right for
       the queue and fatal for this sentence, because the top-level read then
       succeeds, `isError` is false, `items` is empty, and every other condition
       here holds. The board would print "Nothing needs you right now." over a
       queue that failed to load.
       There was no signal in the payload until `incomplete` shipped, so this
       guard could not be written and was deliberately left unwritten rather
       than guessed at. */
    !queueIsPartial &&
    items.length === 0 &&
    shipped.length === 0 &&
    !anythingBlocked &&
    running.length === 0 &&
    crewTotal === 0;

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
    /* WAITS ON THE REVIEW QUEUE ONLY. The first clause counts `queue` and
       nothing else; the second counts the run record and is omitted while that
       is outstanding. `quietMorning` below still requires BOTH, through
       `loading`, because "nothing needs you" is a claim over every read. */
    if (!queueAnswered) return "Today";
    if (missions.isError && queue.isError)
      return "Neither your run record nor your review queue loaded.";
    if (missions.isError) return "Your run record did not load.";
    if (queue.isError) return "Your review queue did not load.";
    if (justLanded && criticResult) return "Your first brief is ready.";
    /*
     * ONE SENTENCE ON A QUIET MORNING, not two negations.
     *
     * `stateSentence` at all-zero produces "Nothing is ready for your review."
     * followed by " Nothing is stuck.", and this is the HEADLINE, the first
     * line a person reads. Together with the region sub below it that made five
     * negations in the first viewport, which is the audit finding that cost
     * this surface the home slot on 2026-08-25.
     *
     * A quiet morning is this product working, not failing: the boundaries
     * held, the crew got on with it, and nothing needed a person. That deserves
     * one clear sentence rather than an inventory of absences. It stays a
     * negation because the fact IS negative and dressing it up would be worse,
     * but one honest negation reads as calm and four read as broken.
     *
     * Every other branch is untouched. When there is something to say, the
     * counted sentence says it.
     */
    if (quietMorning) return "Nothing needs you right now.";
    return stateSentence({
      ready: items.length,
      partial: queueIsPartial,
      stuck: recordAnswered ? stoppedAll.length : null,
      waiting: recordAnswered ? proposedAll.length : null,
      shipped: recordAnswered ? shipped.length : null,
    });
  }, [
    quietMorning,
    queueIsPartial,
    queueAnswered,
    recordAnswered,
    queue.isError,
    missions.isError,
    justLanded,
    criticResult,
    items.length,
    stoppedAll.length,
    proposedAll.length,
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
              {/* THE WINDOW USED TO BE STATED HERE AND IT WAS FALSE HERE.
                  "In the last 24 hours" sat directly under a headline whose
                  four clauses are `ready`, `stuck`, `waiting` and `shipped` -
                  and only the LAST of those is filtered through
                  `withinLastDay`. The other three read the whole outstanding
                  set, because blocked work does not age out and the review
                  queue was never windowed at all.

                  Measured on the rendered board 2026-08-27, signed in: this
                  line sat under "52 decisions are ready for your review", and
                  the oldest of those 52 had been waiting 49 DAYS. A reader is
                  entitled to conclude 52 decisions arrived since yesterday.

                  So the boundary moved onto the one clause it describes, in
                  `stateSentence`, and this slot carries only what is true of
                  the whole page. The idea the line came from is still right and
                  still unbuildable: "since you last looked" needs a per-user
                  watermark the database does not have (see when.ts). That is a
                  column to add, not a claim to keep making loosely. */}
              {onRecord !== null ? (
                <>
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

        {/* THE HERO BAND. Landing pages are read as masthead, one featured
            moment, then sections; this is the featured moment, so it gets the
            air and the rules that make hierarchy legible before any list. */}
        <div className="today-hero">
          <FocusNext workspaceId={workspaceId} />
        </div>

        {/* THE TRACK RECORD LINE. Insight, not a boxed count: the page states
            what came true and opens the record. "A zero never renders as a
            finding" still holds - `gradedLine` returns null on 0 resolved,
            because 0 of 0 is not a track record.

            WHAT CHANGED IS THE GUARD AROUND IT. This band used to require a
            graded forecast to draw at all, so a workspace that had made
            fifteen forecasts and graded NONE saw no forecast line whatsoever.
            The product's own claim is that the moat is the forecast captured at
            decision time; a forecast nobody grades never becomes that, and the
            surface went quiet at exactly the moment it had something to say.

            And when both facts are true, the record stops hiding its
            denominator: "1 of 2" over fifteen ungraded is a record built from
            two of seventeen, which is a different claim. */}
        {worthDrawing(standing) ? (
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <WorkGlyph kind="forecast" />
            <RecordSpeaks
              evidence={
                <Door onClick={() => navigate({ to: "/brain" })}>
                  See which held and which missed
                </Door>
              }
            >
              {gradedLine(standing) ? (
                <>
                  {gradedLine(standing)}
                  {ungradedLine(standing) ? ` ${ungradedLine(standing)}` : null}
                </>
              ) : (
                /* ALONE, THE SENTENCE LOSES "more". There is no first sentence
                   for it to refer back to, and "15 more" with nothing before it
                   is a lie about a line that is not on the screen. */
                ungradedAlone(standing)
              )}
            </RecordSpeaks>
          </div>
        ) : null}

        <div className="today-lanes">
          {/* "OPEN RUNS" WAS A DOOR BACK TO THIS PAGE. It navigated to /runs,
              which the fold turned into a redirect to /today, so the control
              reloaded the surface the reader was already on. Removed rather
              than retargeted: the uncapped list already has its own door at the
              foot of this region ("Open the inbox"), and a second one competing
              with it would be the duplication the fold exists to remove.

              This is the fold's own blast radius. A redirect keeps every link
              resolving, which is what made the fold safe, and is exactly why a
              link whose meaning died is invisible: nothing breaks, it just
              stops meaning anything. Swept the rest in the same pass; the four
              that remain are honest (the rail's Runs row lands where runs are
              listed, and build.index's two are S1's to retitle per A-005). */}
          {/* SPEND NEARING A CAP, AND OUTPUT DRIFTING. Two conditions this
              product computes against real tables and showed nobody:
              `getNotifications` had exactly ONE mention in src, its own
              definition, while Settings offered four "App" toggles that wrote a
              preference no surface read. Neither is derivable from anything
              Today reads, so this is the only board they can appear on.

              ABOVE the decisions on purpose. A reached spend cap blocks the
              calls that produce those decisions, so answering the queue first
              would be working under a condition nobody told you about. It draws
              nothing at all when there is nothing to say, which is almost every
              morning, so it costs the fold nothing on an ordinary one. */}
          <SystemAlerts />

          <Region
            title={FEED_TITLE}
            sub={
              stillWaiting(queue) || stillWaiting(missions) ? null : queue.isError ||
                missions.isError ? (
                "This could not be read."
              ) : (
                <>
                  {items.length > 0 ? (
                    /*
                     * THE COUNT IS GONE FROM HERE, AND ONLY THE COUNT.
                     *
                     * Screenshotted on the running board 2026-08-27, signed in,
                     * against real data: the number 52 appeared THREE TIMES
                     * inside about a hundred pixels. The headline said "52
                     * decisions are ready for your review", this line said "52
                     * waiting on you", and the group heading immediately below
                     * drew "READY FOR YOUR REVIEW 52". A person does not read
                     * that as emphasis, they read it as a screen that cannot
                     * tell them one thing once.
                     *
                     * `AgentInbox`'s own contract for this slot already says
                     * which of the three should go: "the heading says what a
                     * group needs and the count says how many. Neither can say
                     * the thing a reader actually weighs... that nothing has
                     * happened yet on a pending call so undo is free." The
                     * count was mine to stop repeating, and the judgement is
                     * the half no other element on the screen can carry.
                     *
                     * The number is not lost. It is still in the headline and
                     * still on the group, which is the element that owns it.
                     */
                    <>Nothing has happened yet, so undo is free.</>
                  ) : quietMorning /* SILENT ON A QUIET MORNING, and this is the wall coming
                       down. An audit of the real first sixty seconds found this
                       surface opening with FIVE NEGATIONS in one viewport, and
                       that finding is why `/start` took the home slot from it
                       on 2026-08-25 (post-auth-home.ts). Four of the five were
                       here, in one sentence: "Nothing is waiting on you.
                       Nothing stopped, no agent is working and nothing went
                       live."

                       When the whole board is quiet, `QuietMorning` renders
                       directly below and says the same thing once, in the
                       positive, with a worked example of what an arrival looks
                       like. Saying it four more times first does not make it
                       truer, it just makes the screen read as broken. So this
                       says nothing and lets the considered screen carry it.

                       The negations STAY when the board is not quiet, because
                       then they are news: an empty review queue beside three
                       running rows is a fact worth printing. */ ? null : (
                    <>
                      Nothing is waiting on you.
                      {crewQuietLine
                        ? ` ${crewQuietLine.charAt(0).toUpperCase()}${crewQuietLine.slice(1)}.`
                        : null}
                    </>
                  )}
                </>
              )
            }
          >
            {/* THE CALLS. The queue keeps its whole self: walk mode, bulk verbs,
                send-back and the a/d/z keys live in DecisionQueue and were not
                moved. Its own controls spell out the review act, so this section
                carries no second Review label; the heading names the group. */}
            {/* THE SAME `refetch` THE FAILURE BRANCH BELOW ALREADY USES. `SlowRead`
                offers it only past 15 seconds and never says the read failed,
                because it has not - the sentence and the ticking figure stay,
                and all that appears is something to press. Measured on this
                board 2026-08-27: "Reading the run record. 22.4s" with no
                control anywhere near it, so a reader who could see exactly how
                long they had waited had no move except reloading the page. */}
            {stillWaiting(queue) ? (
              <SlowRead onRetry={() => void queue.refetch()}>Reading what needs you.</SlowRead>
            ) : queue.isError ? (
              <ReadFailedLine error={queue.error} onRetry={() => void queue.refetch()}>
                Your decisions are unchanged and this could not read them. Retry before you treat
                the morning as clear.
              </ReadFailedLine>
            ) : (
              <>
                {/* DRAWN BY THE UNFILTERED QUEUE, NOT BY THE FOCUSED ITEM, and the
                    difference is a dead end. This guard used to read `focused`,
                    which is the first VISIBLE item, so a filter that excluded
                    everything deleted the whole section - the queue, its heading
                    and the tab row itself, which lived inside the branch its own
                    state could delete. A control must never be reachable only
                    from the state it is the exit for. */}
                {items.length > 0 ? (
                  <section aria-label={FEED_CALLS} className="flex flex-col">
                    {/* NO HEAD ON THIS GROUP, AND IT TOOK ME THREE GOES TO GET
                        HERE, so the reasoning is worth more than the diff.

                        The head read "READY FOR YOUR REVIEW  52". Screenshotted
                        on the running board 2026-08-27, signed in, the reader
                        met this, in this order, inside about 170px:

                          "52 decisions are ready for your review."   headline
                          "What needs you"                            region
                          "READY FOR YOUR REVIEW  52"                 here
                          "All 52   Proposals 37   Gates 10 ..."      filter

                        Four elements, three of them saying 52, two of them
                        saying "ready for your review". `AppFrame` states the
                        rule this breaks and its own live line was fixed for it
                        the same day: no third statement of one fact inside 100
                        pixels.

                        I first removed the head only when nothing was settled,
                        then only when the region held no other group. Both were
                        wrong in the same way - they treated this as a question
                        about SIBLINGS when it is a question about the HEADLINE.
                        The second version was worse than the first: it restored
                        the head on any ordinary board, because the crew lanes
                        below almost always have rows.

                        WHAT ACTUALLY NAMES THIS GROUP, now that the head is
                        gone. The region title above it says whose move it is.
                        The filter row below carries the count on `All`. And the
                        sibling groups - "Waiting on you", "Running", "Finished"
                        - keep their own heads, which is what separates them
                        from this one: the unlabelled group is the one the
                        region title is about, and the labelled ones are the
                        departures from it.

                        THE ACCESSIBLE NAME DOES NOT MOVE. `aria-label` on the
                        section is unconditional, so the group keeps its name for
                        a reader who cannot see the region title above it.
                        Dropping a visible duplicate must never cost the one
                        person who was relying on it. */}
                    <div className="mt-mrd-3">
                      {/* TEXT TABS, NOT A FACET EXPLOSION, which is the taste law
                          `approvals-queue.functions.ts` states over this very vocabulary. The
                          labels and the order are /approvals' own, not reworded, so the two
                          surfaces cannot come to disagree about what a bucket is.
                      
                          IT DRAWS NOTHING WHEN THERE IS NOTHING TO CHOOSE. One bucket is not a
                          choice, and an empty bucket is never offered - which is why `spend`
                          does not appear here: its own comment says "nothing routes into it
                          yet because no spend-gate READ exists in the codebase today", and
                          /approvals draws it anyway as a permanently empty tab. */}
                      {worthFiltering(bucketList) ? (
                        <div className="mb-mrd-4 flex flex-wrap items-center gap-mrd-3">
                          {/* "EVERY" AND AN EXACT COUNT, ON A BOUNDED READ.
                              `getApprovalsQueue` caps each of ten families, so
                              when `incomplete` is non-empty this control was
                              promising totality twice over - the word in its
                              title and the figure on its face - while the rail
                              chip a few inches left already said "52+" and the
                              headline said "At least 52".

                              Three statements of one count inside a viewport,
                              two of them hedged and one not, reads as the three
                              disagreeing. Same "+" convention as the rail and
                              the station strip. */}
                          <Action
                            variant="quiet"
                            aria-pressed={activeBucket === null}
                            onClick={() => setBucket(null)}
                            title={
                              queueIsPartial
                                ? "Every call this could read. More are waiting."
                                : "Every call waiting on you"
                            }
                          >
                            All{" "}
                            <Num>
                              {items.length}
                              {queueIsPartial ? "+" : ""}
                            </Num>
                          </Action>
                          {bucketList.map((t) => (
                            <Action
                              key={t.id}
                              variant="quiet"
                              aria-pressed={activeBucket === t.id}
                              onClick={() => setBucket(t.id)}
                              title={`Only the ${t.label.toLowerCase()}`}
                            >
                              {t.label} <Num>{t.count}</Num>
                            </Action>
                          ))}
                        </div>
                      ) : null}
                      {focused ? (
                        <DecisionQueue
                          items={visibleItems}
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
                      ) : activeBucket ? (
                        /* THE FILTER EXCLUDED EVERYTHING, which is not the same fact as
                           an empty queue and must not wear its words. `bucketEmptyLine`
                           carries the reasoning and the sentence.

                           `role="status"` because this replaces the queue after an
                           answer settles, so a screen reader is told the list it was
                           working is now empty and why. R-19 defers small screens; it
                           does not defer this. */
                        <p
                          role="status"
                          className="flex flex-wrap items-center gap-mrd-3 text-mrd-mute"
                        >
                          {bucketEmptyLine(activeBucket, items.length)}
                          <Action
                            variant="quiet"
                            onClick={() => setBucket(null)}
                            title="Every call waiting on you"
                          >
                            Show all <Num>{items.length}</Num>
                          </Action>
                        </p>
                      ) : null}
                      {/* WHERE THE ORDER STOPS MEANING SOMETHING. The queue is
                          sorted oldest first, so a row's position IS a claim
                          about its age. A call with no timestamp has none, sits
                          last, and reads as the newest thing here. It draws
                          nothing today - every family carries a timestamp - and
                          a sort is exactly where that stops being true. */}
                      {/* WHY THIS LIST IS NOT EVERYTHING, when it is not. Drawn
                          ABOVE the undated note on purpose: "part of your queue
                          did not load" changes whether you trust the screen at
                          all, and "some of these carry no start time" only
                          changes how you read the order.

                          The sentence is `notTheWholeQueue`'s, not mine, and
                          that is the point - three surfaces show this queue and
                          two spellings of one caveat is how a person gets two
                          answers about one queue. It names no family, which is
                          also deliberate: "critic'd opportunities" is right in a
                          log and, in front of a person, invites them to work out
                          which of their calls is missing. That is a puzzle, not
                          an answer. */}
                      {notTheWholeQueue(incomplete) ? (
                        <p
                          role="status"
                          className="mt-mrd-3 max-w-[var(--mrd-measure)] text-mrd-label leading-mrd-prose text-mrd-mute"
                        >
                          {notTheWholeQueue(incomplete)}
                        </p>
                      ) : null}
                      {undatedLine ? (
                        <p className="mt-mrd-3 max-w-[var(--mrd-measure)] text-mrd-label leading-mrd-prose text-mrd-faint">
                          {undatedLine}
                        </p>
                      ) : null}
                    </div>
                  </section>
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
              </>
            )}

            {/* THE RUNS. ONE WAIT AND ONE REFUSAL FOR ONE READ, named here by
                the query's own name rather than through a derived word:
                today-states-its-wait.test.ts asserts that every read Today makes
                admits its own wait AND its own refusal in the JSX. At zero no
                section draws at all, so the assurances live once on the card's
                own sub-line above, where all three fit as one sentence. */}
            {/* THE SILENCE, NAMED. A truthfully quiet board and a broken one
                look identical, and that is the expensive confusion: a person
                cannot tell from a calm screen whether the crew finished or the
                sweep died three days ago. This draws ABOVE the read-state chain
                on purpose, because the state it speaks for is the one where
                every lane below it is empty. It says nothing while work is
                fresh, since the rows carry their own clocks. */}
            {stillness ? (
              <p className="mb-mrd-4 max-w-[62ch] text-mrd-data leading-mrd-prose text-mrd-mute">
                {stillness}
              </p>
            ) : null}

            {stillWaiting(missions) ? (
              <SlowRead onRetry={() => void missions.refetch()}>Reading the run record.</SlowRead>
            ) : missions.isError ? (
              <ReadFailedLine error={missions.error} onRetry={() => void missions.refetch()}>
                The run record did not load, so this cannot say what went live, what stopped or what
                is still going.
              </ReadFailedLine>
            ) : stillWaiting(tracks) ? (
              <SlowRead onRetry={() => void tracks.refetch()}>
                Reading the work the loop is driving.
              </SlowRead>
            ) : tracks.isError ? (
              <ReadFailedLine error={tracks.error} onRetry={() => void tracks.refetch()}>
                The loop's work could not be read, so something started from a sentence may be
                missing here. Retry before you treat the morning as clear.
              </ReadFailedLine>
            ) : stillWaiting(sessions) ? (
              <SlowRead onRetry={() => void sessions.refetch()}>
                Reading which runs need your answer.
              </SlowRead>
            ) : sessions.isError ? (
              <ReadFailedLine error={sessions.error} onRetry={() => void sessions.refetch()}>
                The gate check did not load, so a run waiting on you may be sitting in Running.
                Retry before you treat the morning as clear.
              </ReadFailedLine>
            ) : crewTotal > 0 ? (
              <div
                role="listbox"
                aria-label="Runs, in the order of what each one needs from you"
                className="mt-mrd-6 flex flex-col gap-mrd-7"
                onKeyDown={feedKeys}
              >
                {crewSection(
                  FEED_REPLY,
                  allReplyRows,
                  /* ZERO FROM A FAILED COUNT MUST NOT RENDER AS ZERO. S0's
                     count degrades to 0 rather than throwing, so a broken read
                     would put "Waiting on you 0" at the head of the lane whose
                     whole job is saying what needs a person: a false all-clear
                     produced by a fault, which is the failure every honesty
                     gate on this surface exists to stop.
                     `|| undefined` falls back to the row count, which is what
                     this head showed before the total existed and is honest. A
                     genuine zero has no rows either, so it still reads 0 and
                     nothing is lost. Asked S0 for `number | null`; until then
                     this is the safe read of the value as shipped. */
                  missions.data?.totalBlocked || undefined,
                  /* THE BOUNDARY, SAID OUT LOUD, because the omission it covers
                     is large and silent. This lane is filtered by
                     `withinLastDay` (:670), so work whose last movement was over
                     24 hours ago is not here AND IS NOT COUNTED. Measured
                     2026-08-27: 89 missions are waiting on a person and 85 of
                     them last moved between 8 and 30 days ago, so the lane
                     showed 3. The longer a thing waits, the more certainly it
                     disappears from the one surface that exists to say what
                     needs you.

                     NO NUMBER IS PRINTED HERE, and that is the honest choice
                     rather than the lazy one. `listMissions` is `.limit(50)`
                     ordered by `updated_at` descending (missions.functions.ts
                     :244-245), so the client is handed the 50 most RECENTLY
                     touched of 108 and the oldest waiting work is precisely
                     what falls off the end. Any count or "oldest" computed here
                     would be drawn from the newest 50 and would understate by a
                     margin nobody could see. A stated boundary is true; a
                     number from a capped read is a wrong number wearing a
                     fact's clothes. The real count needs a server-side read and
                     is filed with S0. */
                  /* HOW LONG THE OLDEST HAS SAT. I built this earlier tonight
                     and reverted it, because the only population I could reach
                     was the windowed one and every row in it was under a day
                     old, so the clause could not fire. `oldestBlockedAt` counts
                     over every row rather than the first 50, so the sentence
                     now has a source. Under a day it says nothing: "waiting 0
                     days" reads as a bug even when it is arithmetic. */
                  (() => {
                    /* WHAT THE COUNT ABOVE IS INFLATED BY (2026-08-27).
                     *
                     * Measured against the live database: this workspace holds
                     * 89 proposed missions under 48 distinct subjects, so 41
                     * are the same request raised again, and 5 ask for work
                     * whose subject is already completed — one of them
                     * completed three times over. The lane says how many are
                     * waiting and has never said how many are the same thing.
                     * That is the brief's fourth glance-fact, "two teammates
                     * about to redo each other's output", and it is the one
                     * this surface has never drawn.
                     *
                     * THE SENTENCE IS SCOPED TO THIS PAGE, and it has to be.
                     * The boundary note directly above records that
                     * `listMissions` is `.limit(50)` of 111 and that "a number
                     * from a capped read is a wrong number wearing a fact's
                     * clothes". So this counts the rows actually rendered and
                     * says "on this list", which a reader can check by
                     * scrolling. Where the real repetition is worse, it
                     * under-reports, which is the only direction that cannot
                     * talk somebody into dismissing work that was never
                     * duplicated. */
                    const repeats = repeatLine(
                      duplicateWork(allReplyRows),
                      redoingSettledWork(allReplyRows, rows),
                    );
                    const withRepeats = (text: string) => (repeats ? `${text} ${repeats}` : text);
                    const base = "Nothing moves on these until you answer.";
                    const d = daysSince(missions.data?.oldestBlockedAt);
                    if (d === null || d < 1) return withRepeats(base);
                    /* SAY WHEN THE OLDEST IS NOT ON THE PAGE, because otherwise
                       this line and the row under it look like they disagree.
                       Seen live: the note said 39 days while the top row said
                       21d, both true. `oldestBlockedAt` counts every blocked
                       row; the page holds the 50 most recently touched, and the
                       lane sorts oldest-first, so whenever the true oldest is
                       outside that 50 the first row is younger than this
                       sentence. Naming it turns an apparent contradiction into
                       the useful fact, which is that older work exists than
                       this page can reach. */
                    const shownOldest = allReplyRows.length
                      ? Math.min(...allReplyRows.map((r) => r.at).filter((n) => n > 0))
                      : 0;
                    const shownDays = shownOldest
                      ? Math.floor((Date.now() - shownOldest) / 86_400_000)
                      : null;
                    const offPage = shownDays !== null && d - shownDays >= 1;
                    const word = d === 1 ? "day" : "days";
                    return withRepeats(
                      offPage
                        ? `${base} The oldest has been waiting ${d} ${word}, and is not on this page.`
                        : `${base} The oldest has been waiting ${d} ${word}.`,
                    );
                  })(),
                  (row) =>
                    /* A TRACK IS NOT ANSWERING A QUESTION HERE, so it is not
                       offered a Reply. Seen live 2026-08-27: a track parked on
                       going-in-circles sat in this lane wearing a Reply button,
                       and nothing had asked anything — the loop ran out of road.
                       Reply opens an Ask conversation, while a track's answer
                       belongs in its own steer composer on the run, which is
                       where its one exit (rewindTrackTo) also lives. The row
                       already opens that run, so the honest verb is none: the
                       same call C2-006 made when Stop was removed from track
                       rows for naming a mutation that could not run on them. */
                    row.isTrack ? null : row.proposed ? (
                      /* A PROPOSED MISSION IS NOT ASKING A QUESTION — it is
                         waiting for a person to review and launch it, and the
                         launch control lives on the run. Naming the act beats
                         a composer that would send words nobody asked for
                         into a run that has not started. */
                      <Door title="Open the run to review and launch it" onClick={row.onOpen}>
                        Review &amp; launch
                      </Door>
                    ) : (
                      <Action
                        variant="quiet"
                        onClick={(event) => {
                          /* The row itself opens the run; picking up the compose
                             field must not navigate away from it. */
                          event.stopPropagation();
                          setReplyTo(replyTo === row.id ? null : row.id);
                        }}
                      >
                        Reply
                      </Action>
                    ),
                  (row) => (
                    <>
                      {/* WHY IT STOPPED, on the line under the row. Parked work
                          carries the driver's own sentence and it is 250
                          characters of real prose; the row's state slot is a
                          few words wide and does not wrap. Drawn verbatim: this
                          surface is not entitled to reword the product's voice,
                          only to put it where it fits. */}
                      {row.note ? (
                        <p className="px-mrd-2 pb-mrd-2 text-mrd-data leading-mrd-prose text-mrd-mute">
                          {row.note}
                        </p>
                      ) : null}
                      {/* WHERE THIS CAME FROM (§0.5's connectedness, board half).
                          The lineage sheet is already mounted app-wide in
                          AppFrame; before this, nothing in this prefix offered
                          the gesture. Under the row rather than in the scan
                          band, which truncates. Never on a track: AUDIT_KINDS
                          has no spine-track entry, so the ref would not
                          resolve. */}
                      <CameFrom missionId={row.id} isTrack={row.isTrack} />
                      {/* WHAT WAS HANDED TO YOU, BEFORE YOU DECIDE ON IT.
                          The founder asked twice to see the handoff and it was
                          drawn under RUNNING rows only. Measured against the
                          live database 2026-08-27: 26 handoffs exist, across 10
                          missions — 7 finished, 3 blocked, and ZERO running.
                          The lane's own note four hundred lines below records
                          that `agent_runs` holds no in-flight rows at all. So
                          the one event the brief calls "worth drawing" was
                          wired to the only lane none of them are in, and has
                          never appeared.
                          It belongs here most of all: this lane is where a
                          person decides, and "Handed over by the orchestrator
                          3h ago: <task> · 4 items passed" is the artifact that
                          arrived, not a status change. It owns its own read and
                          its own silence, and a track row simply finds no
                          mission handoff and draws nothing. */}
                      <HandoverNote missionId={row.id} workspaceId={workspaceId} />
                      {replyTo === row.id ? (
                        <ReasonField
                          id={`feed-reply-${row.id}`}
                          label={`Answer ${row.who ?? "this run"}`}
                          hint="It goes back to the run as your answer, and the work carries on from there."
                          placeholder="Use the shorter verify step, and leave the migration for later"
                          commitLabel="Send it"
                          cancelLabel="Not now"
                          onCommit={(text) => {
                            openAsk(`About the run "${row.title}": ${text}`);
                            setReplyTo(null);
                          }}
                          onCancel={() => setReplyTo(null)}
                        />
                      ) : null}
                    </>
                  ),
                )}
                {crewSection(
                  FEED_LIVE,
                  allLiveRows,
                  undefined,
                  /* THE NOTE HAS TO SURVIVE ITS OWN LANE BEING EMPTY.
                     "Waiting on an agent, not on you" is true of rows in this
                     lane and FALSE of a lane with none, and it rendered anyway:
                     a section draws its head and its note whatever the count.
                     Measured 2026-08-27, agent_runs holds ZERO rows in any
                     in-flight status, so this is the state the board is in
                     today, not an edge case.
                     At zero it says what is true and points at the act that
                     would change it, WITHOUT a number: listMissions is capped
                     at 50 of 89, so any count printed here would be a floor
                     wearing a total's clothes. The count that IS honest is
                     already on the lane above, on its own head. */
                  allLiveRows.length > 0 ? (
                    <>
                      Waiting on an agent, not on you.
                      <OverlapCheck workspaceId={workspaceId} />
                    </>
                  ) : allReplyRows.length > 0 ? (
                    <>Nothing is running. The work above is waiting on you, not on an agent.</>
                  ) : (
                    <>Nothing is running.</>
                  ),
                  (row) =>
                    row.isTrack ? null : (
                      <Action
                        variant="quiet"
                        busy={cancelRun.isPending}
                        onClick={(event) => {
                          /* The row itself opens the run; stopping it must not. */
                          event.stopPropagation();
                          void cancelRunAt(row.id);
                        }}
                      >
                        Stop
                      </Action>
                    ),
                  (row) => (
                    <>
                      {/* WHY IT IS HELD, in full, on the line under the row. The
                          driver writes real sentences past 200 characters and
                          the state slot is a few words wide, so the row says
                          "held" and the reason reads properly here. Same split
                          the waiting lane uses. */}
                      {row.note ? (
                        <p className="px-mrd-2 pb-mrd-2 text-mrd-data leading-mrd-prose text-mrd-mute">
                          {row.note}
                        </p>
                      ) : null}
                      {/* WHERE THIS CAME FROM (§0.5's connectedness, board half).
                          The lineage sheet is already mounted app-wide in
                          AppFrame; before this, nothing in this prefix offered
                          the gesture. Under the row rather than in the scan
                          band, which truncates. Never on a track: AUDIT_KINDS
                          has no spine-track entry, so the ref would not
                          resolve. */}
                      <CameFrom missionId={row.id} isTrack={row.isTrack} />
                      {/* WHERE THE WORK JUST CAME FROM. The founder asked twice to
                          see the handoff; on the board that is this one line under
                          each running row, drawn only when a real handover row
                          exists. It owns its own read and its own silence, so the
                          route-level wait contract above is untouched. */}
                      <HandoverNote missionId={row.id} workspaceId={workspaceId} />
                      {/* WHO ELSE IS ON THE SAME THING. Only where one of them is
                          WRITING, because a shared read is a healthy afternoon and a
                          mark that is always on is furniture. A track row carries a
                          track id, not a mission id, so it is not asked. */}
                      {row.isTrack ? null : (
                        <OverlapNote missionId={row.id} workspaceId={workspaceId} />
                      )}
                    </>
                  ),
                )}
                {crewSection(
                  FEED_OPEN,
                  allOpenRows,
                  undefined,
                  "Finished. Open one to see how it ended, and what it left behind.",
                  (row) => (
                    <Door onClick={row.onOpen}>Open</Door>
                  ),
                  /* HOW IT GOT DONE, on the row that says it is done. SEVEN of
                     the ten missions carrying a handoff are finished, so
                     without this the event the brief calls "worth drawing"
                     stays invisible for the majority of the work that actually
                     has one. "Handed over by the orchestrator · 4 items passed"
                     is the agentic half of a finished run made visible rather
                     than implied, which is the whole difference between a
                     status and a record. Silent when no handover exists, so a
                     settled lane gains no furniture. */
                  (row) => (
                    <HandoverNote missionId={row.id} workspaceId={workspaceId} />
                  ),
                )}
              </div>
            ) : null}

            {/* THE INBOX DOOR. This card shows three rows per section and opens
                the rest in place; the inbox is the same triage with no cap and
                nothing but the triage on it. Until 2026-08-25 the route answered
                and nothing pointed at it - a surface with no door, this repo's
                most common defect. The door rides under the feed it extends,
                where the reader who needs it already is. */}
            {/* WHAT IT COST. `/runs` carried this and redirects now, so without
                it the fold would remove a capability rather than a door. One
                quiet line, no accent, and drawn ONLY when a figure exists:
                "no cost reported" and "$0.00" are different claims and this
                surface may not swap one for the other. */}
            {totals.sessionSpendUsd !== null || totals.trackSpendUsd !== null ? (
              <p className="max-w-[62ch] text-mrd-data leading-mrd-prose text-mrd-mute">
                {[
                  spendWords(totals.sessionSpendUsd)
                    ? `${spendWords(totals.sessionSpendUsd)} spent on runs`
                    : null,
                  spendWords(totals.trackSpendUsd)
                    ? `${spendWords(totals.trackSpendUsd)} on work the loop drove`
                    : null,
                ]
                  .filter(Boolean)
                  .join(", ")}
                .
                {totals.sessionsWithoutCost > 0
                  ? ` ${totals.sessionsWithoutCost} ${
                      totals.sessionsWithoutCost === 1 ? "run" : "runs"
                    } reported no cost, so this is a floor.`
                  : ""}
              </p>
            ) : null}

            <Door
              title="The full list of what needs you, uncapped"
              onClick={() => navigate({ to: "/inbox" })}
            >
              Open the inbox
            </Door>
          </Region>
        </div>

        {/* WHETHER THE QUIET IS THIS PRODUCT WORKING OR THIS PRODUCT STOPPED.
            `QuietMorning` below teaches what a decision looks like, which is
            the first-run question. This answers the returning reader's, which
            is "is anything actually running?" — and it is the half a calm
            screen has never been able to tell apart. Measured on the live
            database 2026-08-27: 622 agent runs, 621 of which finished without
            needing a person. The board said none of it. */}
        {quietMorning ? <CrewPulseNote workspaceId={workspaceId} /> : null}
        {quietMorning ? <QuietMorning /> : null}

        <PushedInsights />

        {stillWaiting(learnings) ? (
          <SlowRead onRetry={() => void learnings.refetch()}>Reading what it learned.</SlowRead>
        ) : learnings.isError ? (
          /* SAME REGION, SAME NAME, WHICHEVER WAY THE READ WENT. The failed arm
             called itself "Latest learning" and the loaded arm "It learned one
             thing", so the section changed its name depending on whether the
             fetch worked. */
          <div className="today-learned">
            <Region title={LEARNING_BLOCK}>
              <ReadFailedLine error={learnings.error} onRetry={() => void learnings.refetch()}>
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
                {/* THE SAME ANSWER, TWICE. Drawn here because this region is
                    what the crew produced, and "two of you wrote this" is a
                    fact about the production rather than about the finding.
                    Null when there is nothing to say - never an all-clear,
                    because this reads a capped list and an absence means "not
                    in what we read", not "it did not happen". */}
                {repeatedAnswersLine ? (
                  <p className="m-0 max-w-[68ch] text-mrd-label leading-mrd-prose text-mrd-hold">
                    {repeatedAnswersLine}
                  </p>
                ) : null}
                {/* What this learning was about, named above the claim rather
                    than folded into the evidence line: evidence is mono and
                    holds counts and dates, never a title. Absent when the
                    learning carries no opportunity, and then nothing prints. */}
                {learning.opportunity_title ? (
                  <p className="m-0 max-w-[68ch] text-mrd-label leading-mrd-prose text-mrd-mute">
                    About {learning.opportunity_title}
                  </p>
                ) : null}
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

        {/*
         * THE DOOR THAT SAID IT STARTED WORK AND DID NOT. This block read
         * "Start something new" over a composer whose submit is `openAsk()`,
         * which opens the Ask pane. Asking is a real act and a good one, but a
         * person reading "give the crew its next outcome" expects work to
         * exist afterwards, and none did. The most-visited surface in the
         * product was promising the one act it does not perform.
         *
         * So the composer is named for what it does, and the act it was
         * standing in for gets its own door beside it. `/start` is the door
         * that creates a track, and 41 of the last 43 tracks entered at
         * `sense` through it, so it is the live way work begins.
         *
         * DELIBERATELY A LINK AND NOT A SECOND COMPOSER. Which engine the
         * board's own composer should drive is a real question with three
         * candidates and it is not mine to settle; it is filed as
         * D2-the-consolidated-start-door.md for S0 and S1. A link removes the
         * false promise today without pre-empting that ruling, and it cannot
         * become a fourth way to start work.
         */}
        <div data-page-composer className="today-composer">
          <div>
            <div className="today-kicker">Ask the crew</div>
            <div className="today-composer-copy">
              Ask a question about this workspace, or talk through what to do next.{" "}
              <Door title="Start a new piece of work" onClick={() => navigate({ to: "/start" })}>
                Start a piece of work
              </Door>
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
