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
import { DecisionQueue } from "@/components/today/DecisionQueue";
import { ElapsedRunning, parseableInstant } from "@/components/today/ElapsedRunning";
import { FocusNext } from "@/components/today/FocusNext";
import { HandoverNote } from "@/components/today/HandoverNote";
import { PushedInsights } from "@/components/today/PushedInsights";
import {
  trackToBoardRows,
  type TrackBoardRow,
} from "@/components/today/tracks-feed";
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
import { listTracks } from "@/lib/spine/track.functions";
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
  onOpen: () => void;
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
        <span className="flex shrink-0 items-baseline gap-mrd-2 text-mrd-data text-mrd-mute">
          {row.who ? `${row.who} · ` : ""}
          {row.state}
        </span>
        {verb}
      </div>
      {children}
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
  const fetchTracks = useServerFn(listTracks);
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

  // The track record read. CHARACTER-IDENTICAL KEY to Brain's, so the two
  // surfaces are two consumers of ONE request and the tab opens on a cache hit.
  const fCalibration = useServerFn(getForecastCalibration);
  const calibrationQ = useQuery({
    queryKey: ["forecast-calibration", workspaceId],
    queryFn: () => fCalibration(),
    enabled: Boolean(workspaceId),
  });
  const calibration = calibrationQ.data;

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
    (id: string) => () =>
      void navigate({ to: "/runs/$missionId", params: { missionId: id } }),
    [navigate],
  );

  const replyRows = React.useMemo<CrewRow[]>(
    () =>
      stuck
        .filter((m) => taskStatus(m.status) === "blocked")
        .map((m) => {
          const when = ago(m.completed_at ?? m.updated_at);
          return {
            id: m.id,
            who: m.current_agent_slug ? agentDisplayName(m.current_agent_slug) : null,
            title: cleanTitle(m.title),
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
        .sort((a, b) => b.at - a.at),
    [stuck, openRun],
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
    () => [
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
    (trackId: string) => () =>
      void navigate({ to: "/track/$trackId", params: { trackId } }),
    [navigate],
  );
  const trackCrewRows = React.useMemo(() => {
    const grouped = trackToBoardRows(tracks.data, openTrackIds, ago);
    const base = (r: TrackBoardRow): CrewRow => ({
      id: r.id,
      who: null,
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
        state: <>{r.holdLine ?? "Waiting on your answer"}</>,
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
      })),
      open: grouped.finished.map((r): CrewRow => ({
        ...base(r),
        state: <>{r.lastMoved ? `done · moved ${r.lastMoved} ago` : "done"}</>,
      })),
    };
  }, [tracks.data, openTrackIds, openTrack]);

  const allReplyRows = React.useMemo(
    () => [...replyRows, ...trackCrewRows.reply],
    [replyRows, trackCrewRows],
  );
  const allLiveRows = React.useMemo(
    () => [...liveRows, ...trackCrewRows.live],
    [liveRows, trackCrewRows],
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
    note: string,
    verbFor: (row: CrewRow) => React.ReactNode,
    extraFor?: (row: CrewRow) => React.ReactNode,
  ) => {
    const shown = standingRows(name, all);
    const over = all.slice(shown.length);
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
        <FeedHead name={name} count={all.length} />
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
    stuck.length === 0 && trackCrewRows.reply.length === 0 ? "nothing stopped" : null,
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

        {/* THE HERO BAND. Landing pages are read as masthead, one featured
            moment, then sections; this is the featured moment, so it gets the
            air and the rules that make hierarchy legible before any list. */}
        <div className="today-hero">
          <FocusNext workspaceId={workspaceId} />
        </div>

        {/* THE TRACK RECORD LINE. Insight, not a boxed count: the page states
            what came true and opens the record, and only once a forecast has
            actually been graded - a zero never renders as a finding. */}
        {calibration?.prediction.resolved ? (
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <WorkGlyph kind="forecast" />
            <RecordSpeaks
              evidence={
                <Door onClick={() => navigate({ to: "/brain" })}>
                  See which held and which missed
                </Door>
              }
            >
              Your forecasts came true {calibration.prediction.hits} of{" "}
              {calibration.prediction.resolved} times.
            </RecordSpeaks>
          </div>
        ) : null}

        <div className="today-lanes">
          <Region
            title={FEED_TITLE}
            goTo={rows.length > 0 ? "Open Runs" : undefined}
            onGoTo={() => navigate({ to: "/runs" })}
            sub={
              stillWaiting(queue) || stillWaiting(missions)
                ? null
                : queue.isError || missions.isError
                  ? "This could not be read."
                  : (
                    <>
                      {items.length > 0 ? (
                        <>
                          <Num>{items.length}</Num> waiting on you. Nothing has happened yet, so
                          undo is free.
                        </>
                      ) : (
                        <>Nothing is waiting on you.</>
                      )}
                      {crewQuietLine
                        ? ` ${crewQuietLine.charAt(0).toUpperCase()}${crewQuietLine.slice(1)}.`
                        : null}
                    </>
                  )
            }
          >
            {/* THE CALLS. The queue keeps its whole self: walk mode, bulk verbs,
                send-back and the a/d/z keys live in DecisionQueue and were not
                moved. Its own controls spell out the review act, so this section
                carries no second Review label; the heading names the group. */}
            {stillWaiting(queue) ? (
              <Reading>Reading what needs you.</Reading>
            ) : queue.isError ? (
              <ReadFailedLine onRetry={() => void queue.refetch()}>
                Your decisions are unchanged and this could not read them. Retry before you treat
                the morning as clear.
              </ReadFailedLine>
            ) : (
              <>
                {focused ? (
                  <section aria-label={FEED_CALLS} className="flex flex-col">
                    <FeedHead name={FEED_CALLS} count={items.length} />
                    <div className="mt-mrd-3">
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
            {stillWaiting(missions) ? (
              <Reading>Reading the run record.</Reading>
            ) : missions.isError ? (
              <ReadFailedLine onRetry={() => void missions.refetch()}>
                The run record did not load, so this cannot say what went live, what stopped or what
                is still going.
              </ReadFailedLine>
            ) : stillWaiting(tracks) ? (
              <Reading>Reading the work the loop is driving.</Reading>
            ) : tracks.isError ? (
              <ReadFailedLine onRetry={() => void tracks.refetch()}>
                The loop's work could not be read, so something started from a sentence may be
                missing here. Retry before you treat the morning as clear.
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
                  "Nothing moves on these until you answer.",
                  (row) => (
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
                  (row) =>
                    replyTo === row.id ? (
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
                    ) : null,
                )}
                {crewSection(FEED_LIVE, allLiveRows, "Waiting on an agent, not on you.", (row) => (
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
                ), (row) => (
                  /* WHERE THE WORK JUST CAME FROM. The founder asked twice to
                     see the handoff; on the board that is this one line under
                     each running row, drawn only when a real handover row
                     exists. It owns its own read and its own silence, so the
                     route-level wait contract above is untouched. */
                  <HandoverNote missionId={row.id} workspaceId={workspaceId} />
                ))}
                {crewSection(
                  FEED_OPEN,
                  allOpenRows,
                  "Finished. Open one to see how it ended, and what it left behind.",
                  (row) => <Door onClick={row.onOpen}>Open</Door>,
                )}
              </div>
            ) : null}

            {/* THE INBOX DOOR. This card shows three rows per section and opens
                the rest in place; the inbox is the same triage with no cap and
                nothing but the triage on it. Until 2026-08-25 the route answered
                and nothing pointed at it - a surface with no door, this repo's
                most common defect. The door rides under the feed it extends,
                where the reader who needs it already is. */}
            <Door
              title="The full list of what needs you, uncapped"
              onClick={() => navigate({ to: "/inbox" })}
            >
              Open the inbox
            </Door>
          </Region>
        </div>

        {quietMorning ? <QuietMorning /> : null}

        <PushedInsights />


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
