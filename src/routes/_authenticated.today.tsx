import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import * as React from "react";

import { SendBackSheet } from "@/components/approvals/SendBack";
import { ConfidenceDisclosureChip } from "@/components/governance/ConfidenceDisclosureChip";
import { AskComposer } from "@/components/today/AskComposer";
import { DecisionQueue } from "@/components/today/DecisionQueue";
import { FocusNext } from "@/components/today/FocusNext";
import { PushedInsights } from "@/components/today/PushedInsights";
import { QuietMorning } from "@/components/today/QuietMorning";
import { ago, daysSince, withinLastDay } from "@/components/today/when";
import { useSpineStrip } from "@/components/shell/use-spine-strip";
import { useSelection } from "@/components/shell/use-selection";
import {
  AgentMark,
  Block,
  Button,
  Door,
  Failed,
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
import { stripAutoPrefix, cleanTitle } from "@/components/plan/format";
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
import { listMissions, type MissionListRow } from "@/lib/missions.functions";
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
 * 2. THE LANES ARE NAMED FOR WHO IS BLOCKED, NOT FOR WHAT THE OBJECT IS.
 *    "Shipped", "Ready for your review", "Stuck", "Still running" — each says
 *    whose move it is. A lane sectioned by object type ("Missions",
 *    "Approvals", "Insights") makes the reader do the translation into "so
 *    what do I do", every morning, forever.
 *
 * 3. THEY RENDER AT ZERO, and that is deliberate rather than an oversight.
 *    "Ready for your review — nothing is waiting on you" is the best sentence
 *    this product can show a person, and a quiet morning is the only chance it
 *    gets to teach the four names while nothing is at stake. This is not the
 *    zero-tile the research warns about: a tile reading "0" is a number with
 *    no taxonomy attached, information that changes nothing you do. A lane at
 *    zero names who is blocked, and "nobody" is the answer the reader came for.
 *
 * 4. THE ORDER IS REVERSIBILITY, NOT RECENCY AND NOT PRIORITY. The morning
 *    question is not "what matters most", it is "what is hardest to undo".
 *    Shipped is first because it is live and undoing it costs a rollback;
 *    the decisions waiting on you are next because nothing has happened yet
 *    and undo is free; stuck and still-running are last because nothing has
 *    happened at all. Reading order is therefore shipped-first while VISUAL
 *    weight stays call-first: the shipped lane is a two-line scan band, the
 *    open call is the only Gate on the page. You glance at what went live,
 *    you land on the one thing that needs you.
 *
 * WHAT THIS SURFACE MUST NEVER CLAIM. It sharpens the reader's call; it never
 * says it handled anything. Every consequence printed here comes from the item
 * itself, never from a sentence written in this file about what an approval
 * generally does.
 */

export const Route = createFileRoute("/_authenticated/today")({
  component: Today,
  head: () => ({ meta: [{ title: "Today · Supaprod" }] }),
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
 * HOW MANY ROWS A LANE DRAWS, AND THE DOOR THAT ACCOUNTS FOR THE REST.
 *
 * Measured in a browser on 2026-08-11 at 1280: the Shipped lane printed
 * "4 live and waiting on nobody" over exactly THREE rows, under a door
 * labelled only "Open Runs". Every lane does the same thing -- the subtitle
 * counts the whole set and the body renders `slice(0, 3)` -- so the count and
 * the list disagreed on screen and nothing on the surface reconciled them. A
 * reader either reads three and distrusts the four, or reads four and hunts
 * for the row that is not there.
 *
 * The cap stays, because the lane is a scan band and not a list. What changes
 * is that the door says what it holds that the lane does not show, which is
 * the one fact the reader was missing and the one place it costs no space.
 */
const LANE_ROWS = 3;
const laneDoor = (total: number): string =>
  total > LANE_ROWS ? `Open Runs · ${total - LANE_ROWS} more` : "Open Runs";

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
const VERDICT_TONE: Record<string, "pass" | "warn" | "fail"> = {
  ship: "pass",
  revise: "warn",
  kill: "fail",
};

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
        <Button onClick={onOpen}>See the full analysis</Button>
        <Button variant="ghost" onClick={onAnother}>
          Try another idea
        </Button>
      </div>
    </section>
  );
}

/** One lane. A name, one line saying who is blocked and what undoing it costs,
 *  and a body that is allowed to be nothing. `quiet` collapses the lane's own
 *  breathing room when it has no body, so four lanes at zero read as a short
 *  taxonomy rather than as four empty rooms. */
function Lane({
  name,
  waiting,
  quiet,
  more,
  onMore,
  children,
}: {
  name: string;
  waiting: React.ReactNode;
  quiet: boolean;
  more?: string;
  onMore?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="today-lane" data-quiet={quiet}>
      <Block title={name} sub={waiting} more={more} onMore={onMore}>
        {children ?? null}
      </Block>
    </div>
  );
}

function Today() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id ?? null;

  // Engine-Room: Today names outcomes, decisions and evidence. Agent internals stay recessed.
  useSpineStrip(null);

  const fetchQueue = useServerFn(getApprovalsQueue);
  const fetchMissions = useServerFn(listMissions);
  const fetchLearnings = useServerFn(listLearnings);
  const decide = useServerFn(decideApprovalItem);
  const snooze = useServerFn(snoozeApprovalItem);

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

  const learning = learnings.data?.learnings?.[0] ?? null;
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

  return (
    <Surface wide>
      <div className="today-page">
        <p className="today-greeting">{greeting}</p>
        <PageHead
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
            name="Shipped"
            waiting={runsLane(
              shipped.length === 0 ? (
                "Nothing went live."
              ) : (
                <>
                  <Num>{shipped.length}</Num> live and waiting on nobody. Undoing one costs a
                  rollback.
                </>
              ),
            )}
            quiet={shipped.length === 0 && runsState === "ready"}
            more={shipped.length > 0 ? laneDoor(shipped.length) : undefined}
            onMore={() => navigate({ to: "/runs" })}
          >
            {/* THE ONE LIVE REGION FOR THE RUN RECORD. Three lanes are fed by
                this single read, and three `<Loading>`s would announce the same
                fetch three times to a screen reader. The other two say they are
                reading in their own subtitle and stay silent. */}
            {stillWaiting(missions) ? (
              <Loading>Reading what the crew finished.</Loading>
            ) : missions.isError ? (
              <Failed onRetry={() => void missions.refetch()}>
                The run record did not load, so this cannot say what went live.
              </Failed>
            ) : (
              shipped.slice(0, LANE_ROWS).map((mission) => (
                <Row
                  key={mission.id}
                  tight
                  marks={
                    <AgentMark
                      slug={mission.current_agent_slug}
                      name={mission.build_driver}
                      state={mission.status === "completed_with_failures" ? "idle" : "verified"}
                    />
                  }
                  lead={<Who>{cleanTitle(mission.title)}</Who>}
                  sub={
                    <>
                      {mission.hop_count > 0 ? (
                        <>
                          <Num>{mission.hop_count}</Num>{" "}
                          {mission.hop_count === 1 ? "handoff" : "handoffs"} ·{" "}
                        </>
                      ) : null}
                      {mission.status === "completed_with_failures" ? (
                        <span className="sp-warn">partial</span>
                      ) : (
                        <span className="sp-pass">done</span>
                      )}
                    </>
                  }
                  time={ago(mission.completed_at)}
                  onClick={() =>
                    navigate({ to: "/runs/$missionId", params: { missionId: mission.id } })
                  }
                />
              ))
            )}
          </Lane>

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
              <Loading>Reading what needs you.</Loading>
            ) : queue.isError ? (
              <Failed onRetry={() => void queue.refetch()}>
                Your decisions are unchanged and this could not read them. Retry before you treat
                the morning as clear.
              </Failed>
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
                <Door
                  title="Open everything you have settled"
                  onClick={() => navigate({ to: "/engine-room", search: { room: "record" } })}
                >
                  Open the record
                </Door>
              </div>
            ) : null}
          </Lane>

          <Lane
            name="Stuck"
            waiting={runsLane(
              stuck.length === 0 ? (
                "Nothing stopped."
              ) : (
                <>
                  <Num>{stuck.length}</Num> stopped before finishing. Waiting on you to unblock.
                </>
              ),
            )}
            quiet={stuck.length === 0}
            more={stuck.length > 0 ? laneDoor(stuck.length) : undefined}
            onMore={() => navigate({ to: "/runs" })}
          >
            {stuck.slice(0, LANE_ROWS).map((mission) => (
              <Row
                key={mission.id}
                tight
                marks={
                  <AgentMark
                    slug={mission.current_agent_slug}
                    name={mission.build_driver}
                    state={mission.status === "failed" ? "failed" : "idle"}
                  />
                }
                lead={<Who>{cleanTitle(mission.title)}</Who>}
                sub={
                  mission.status === "failed" ? (
                    <span className="sp-fail">failed</span>
                  ) : (
                    <span>{mission.status}</span>
                  )
                }
                time={ago(mission.completed_at ?? mission.updated_at)}
                onClick={() =>
                  navigate({ to: "/runs/$missionId", params: { missionId: mission.id } })
                }
              />
            ))}
          </Lane>

          <Lane
            name="Still running"
            waiting={runsLane(
              running.length === 0 ? (
                "No agent is working."
              ) : (
                <>
                  <Num>{running.length}</Num> waiting on an agent, not on you.
                </>
              ),
            )}
            quiet={running.length === 0}
            more={running.length > 0 ? laneDoor(running.length) : undefined}
            onMore={() => navigate({ to: "/runs" })}
          >
            {running.slice(0, LANE_ROWS).map((mission) => {
              const agent = mission.current_agent_slug
                ? agentDisplayName(mission.current_agent_slug)
                : "The crew";
              const elapsed = ago(mission.created_at);
              return (
                <Row
                  key={mission.id}
                  tight
                  marks={<AgentMark slug={mission.current_agent_slug} state="running" />}
                  lead={stripAutoPrefix(mission.current_sub_goal ?? mission.title)}
                  sub={`${agent}${elapsed ? ` · ${elapsed} running` : " · running"}`}
                  onClick={() =>
                    navigate({ to: "/runs/$missionId", params: { missionId: mission.id } })
                  }
                />
              );
            })}
          </Lane>
        </div>

        {quietMorning ? <QuietMorning /> : null}

        <PushedInsights />

        <FocusNext workspaceId={workspaceId} />

        {stillWaiting(learnings) ? (
          <Loading>Reading what it learned.</Loading>
        ) : learnings.isError ? (
          /* SAME BLOCK, SAME NAME, WHICHEVER WAY THE READ WENT. The failed arm
             called itself "Latest learning" and the loaded arm "It learned one
             thing", so the section changed its name depending on whether the
             fetch worked. */
          <Block title={LEARNING_BLOCK}>
            <Failed onRetry={() => void learnings.refetch()}>
              The outcome record did not load, so this cannot show what changed next.
            </Failed>
          </Block>
        ) : learning?.summary ? (
          <Block title={LEARNING_BLOCK}>
            <RecordRecess
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
