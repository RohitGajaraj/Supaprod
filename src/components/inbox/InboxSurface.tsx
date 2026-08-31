import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { AgentInbox, type AgentSession, type InboxNeed } from "@/components/meridian/AgentInbox";
import { Num, PageHeading, ReadFailedLine, Reading } from "@/components/meridian/surface-parts";
import { Surface } from "@/components/meridian/Surface";
import { NeedsSetup } from "@/components/meridian/NeedsSetup";
import { taskStatus } from "@/components/meridian/TaskRows";
import { RunState, ShippedState } from "@/components/today/RunState";
import { ago } from "@/components/today/when";
import { cleanTitle, stripAutoPrefix } from "@/components/plan/format";
import { useSpineStrip } from "@/components/shell/use-spine-strip";
import { useWorkspace } from "@/hooks/use-workspace";
import { supabase } from "@/integrations/supabase/client";
import {
  exampleNote,
  exampleTally,
  provenanceOf,
  type Provenance,
} from "@/components/inbox/an-example-says-so";
import { openAsk } from "@/lib/ask-open";
import { getApprovalsQueue } from "@/lib/approvals-queue.functions";
import { listDueForecasts } from "@/lib/forecast.functions";
import { listMissions, type MissionListRow } from "@/lib/missions.functions";
import { approvalsQueueKey, missionsKey } from "@/lib/query-keys";
import { stillWaiting } from "@/lib/query-state";
import { countIsAFloor, notTheWholeQueue } from "@/components/approvals/not-the-whole-queue";

/**
 * THE INBOX SURFACE. One list of everything the crew holds, sorted by who needs
 * you rather than by who is working: the review gate first, then runs stopped on
 * an answer, then live work, then what is over.
 *
 * EVERY ROW IS A REAL READ, AND THAT IS NOT THE SAME AS EVERY ROW BEING REAL
 * WORK. This comment used to end "Nothing here is sample data", it was TRUE
 * when it was written (`f7af3a00c`, 2026-08-25, when the sources were
 * `getApprovalsQueue` and `listMissions`), and `listDueForecasts` was added as
 * a THIRD source two days later in `8f11615b0` -- under a sentence that had
 * already excluded it.
 *
 * S4-166 measured the cost: of the 24 forecasts past their horizon, **20 sit on
 * an `is_sample` workspace, and six of the seven accounts with a non-empty desk
 * see one made entirely of fixtures.** The canon says the moat is the forecast
 * captured at decision time; this is the surface where that claim is cashed.
 *
 * So the sentence is not repaired, it is REPLACED BY THE BEHAVIOUR: a row we
 * can prove came with the workspace says so, per row, and the group says how
 * many. `an-example-says-so.ts` carries the reasoning and the counts. **A
 * comment asserting a property is a claim nothing checks, and this file is the
 * evidence** -- the guarantee outlived the code it described by two days and
 * nobody noticed for six.
 *
 * SPEND TRANSPARENCY. Each run shows its cost, and the page headline includes
 * the total workspace spend. Cost is "—" when unknown (no checkpointed traces
 * yet), never a fabricated $0.00. Totaling unknown costs is the sum of the
 * known ones only, which is honest about what is measured.
 */
const SUBTITLE = "Every call and run in one list, grouped by what each one needs from you.";

const GROUP_NOTES: Record<InboxNeed, React.ReactNode> = {
  "needs-input": "Nothing moves on these until you act.",
  ready: "These stopped before they finished. Open one to see how far it got.",
  working: "Waiting on an agent, not on you.",
  done: "Finished. Open one to see how it ended, and what it left behind.",
};

/** Epoch ms for sort, never NaN: an undated row falls back through the chain
 *  and lands at zero, the oldest thing in its group, rather than sorting
 *  unpredictably against a number it does not have. */
function instant(primary?: string | null, fallback?: string | null): number {
  const first = Date.parse(primary ?? "");
  if (Number.isFinite(first)) return first;
  const second = Date.parse(fallback ?? "");
  return Number.isFinite(second) ? second : 0;
}

function withWhen(state: React.ReactNode, iso: string | null | undefined): React.ReactNode {
  const when = ago(iso);
  return when ? (
    <>
      {state} {when}
    </>
  ) : (
    state
  );
}

/**
 * Total spend across missions. Null = unknown, and the second case below is the
 * one this surface was getting wrong.
 *
 * ── A ZERO OVER WORK THAT RAN IS NOT A ZERO ───────────────────────────────
 * This page rendered "Workspace spend: $0.00" while the same workspace's runs
 * carry $8.31 in `agent_runs.spend_used_usd` across 622 rows, every one of them
 * populated. It is not that the money is missing; it is that this total cannot
 * see it. `listMissions` derives `cost_usd` along mission -> runs ->
 * checkpoints -> `state.traceId` -> `ai_events`, and a break anywhere in that
 * chain yields a mission that costs nothing rather than a mission whose cost is
 * unknown.
 *
 * This module's own header already forbids the shape: cost is "—" when unknown,
 * "never a fabricated $0.00". That rule was applied to each ROW and never to
 * the total, so the one number a person reads as the workspace's whole spend
 * was the one number allowed to invent a zero.
 *
 * So: a total of exactly nothing, over missions that plainly RAN, is a failure
 * to attribute rather than an absence of spend, and it is reported as unknown.
 * A workspace where nothing has run still totals zero honestly, because there
 * are no steps to contradict it.
 *
 * The attribution chain itself is `missions.functions.ts` and S0's; this stops
 * the surface stating a number it cannot support in the meantime.
 */
function workspaceSpendTotal(rows: MissionListRow[]): number | null {
  let total = 0;
  let anythingRan = false;
  for (const m of rows) {
    if (m.cost_usd === null) return null; // Any unknown makes the total unknown
    total += m.cost_usd;
    if ((m.steps?.length ?? 0) > 0) anythingRan = true;
  }
  if (total === 0 && anythingRan) return null;
  return total;
}

export function InboxSurface() {
  const navigate = useNavigate();
  // Not a station on the spine; the strip lights nothing here, like /runs.
  useSpineStrip(null);
  const { activeWorkspace, workspaces, isLoading: readingWorkspaces } = useWorkspace();
  const workspaceId = activeWorkspace?.id ?? null;

  const fetchQueue = useServerFn(getApprovalsQueue);
  const fetchMissions = useServerFn(listMissions);

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

  /*
   * A VERDICT THAT HAS COME DUE NEEDS A PERSON, AND NOTHING WAS TELLING THEM.
   *
   * SESSION-1's Learn line: the verdict "arrives on its own; the person does
   * not go looking." It did not arrive anywhere. `listDueForecasts` exists and
   * has exactly one caller, `ForecastDeskPanel` on /learn, so the only way to
   * find out a forecast had come due was to navigate to the desk and look.
   *
   * Measured: 176 of the 369 decisions carry a forecast, 91 are settled, 70 are
   * still running, and **15 are past their horizon with no verdict written**.
   * None of them reaches this page. The approvals queue federates ten families
   * and a due forecast is not one of them: its decision family is decisions
   * with `status = 'pending'`, which is a different question entirely. So a
   * person with fifteen verdicts waiting was reading "Nothing needs you."
   *
   * That is the moat's own closing step. The product's claim is that it records
   * what you expected and then tells you what actually happened; the second
   * half was built and then left where nobody would meet it.
   *
   * SAME QUERY KEY AS THE DESK, so the two share one fetch and can never
   * disagree about how many are due. Wire what exists, rather than a second
   * read with its own filter, which is how the strip and the desk ended up
   * counting different things.
   */
  const fetchDue = useServerFn(listDueForecasts);
  const dueForecasts = useQuery({
    queryKey: ["forecast-due"],
    queryFn: () => fetchDue(),
    enabled: Boolean(workspaceId),
  });

  /*
   * WHERE EACH DUE CALL CAME FROM (S4-166).
   *
   * `listDueForecasts` selects `workspace_id` in `FORECAST_COLS` and **drops it
   * in the mapping** -- `DueForecast` has no field for it -- so the one fact
   * that separates a real forecast from a demo fixture is fetched and thrown
   * away one layer below this. Filed to S0 as a one-field ask; until it lands
   * this reads it back.
   *
   * ── WHY THIS SECOND READ IS SAFE, WHEN THE COMMENT ABOVE FORBIDS ONE ─────
   * The rule above is against a second read WITH ITS OWN FILTER, which is how
   * the strip and the desk ended up counting different things. This one is
   * keyed `.in("id", …)` on the ids the desk already returned, so it cannot
   * disagree about which rows exist or how many -- it can only attach
   * provenance to rows already on screen. `listOpportunities` states the same
   * argument for its own two-hop enrichment: "this can only enrich rows already
   * visible, never widen what's visible."
   *
   * It is deliberately NOT `enabled` on the workspace: the desk is
   * cross-workspace by design, and gating this on the active one would
   * reintroduce the scope mismatch it exists to report.
   */
  const dueIds = React.useMemo(
    () => (dueForecasts.data?.due ?? []).map((f) => f.id).sort(),
    [dueForecasts.data],
  );
  const dueOrigins = useQuery({
    queryKey: ["forecast-due-origin", dueIds],
    enabled: dueIds.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("decisions")
        .select("id,workspace_id")
        .in("id", dueIds);
      if (error) throw new Error(error.message);
      const by = new Map<string, string | null>();
      for (const r of (data ?? []) as { id: string; workspace_id: string | null }[]) {
        by.set(r.id, r.workspace_id);
      }
      return by;
    },
  });

  /*
   * QUEUED MISSIONS ARE DELIBERATELY ABSENT. A queued run has no worker on it
   * yet, so it is neither needing a person nor working, and every group here is
   * a claim about whose move it is. They stay visible on Open Runs instead.
   */
  const sessions = React.useMemo<AgentSession[]>(() => {
    const calls = queue.data?.items ?? [];
    const rows = missions.data?.missions ?? [];
    const due = dueForecasts.data?.due ?? [];

    /*
     * THE VERDICT ROWS. `need: "needs-input"` because that is exactly what they
     * are: nothing else can settle a forecast, and no agent may. They open the
     * desk that can, rather than a read-only view of themselves.
     *
     * The claim is the row's words, not the decision's title. "Escalation rate
     * drops below 10%" is what a person has to judge; the decision's title is
     * what it was called at the time, and on this surface the judgement is the
     * point.
     */
    /*
     * AND WHERE IT CAME FROM, WHEN WE CAN PROVE IT (S4-166). `decisions.is_sample`
     * is 0 on all 24 overdue rows, so the row cannot answer this about itself;
     * only its workspace can. `provenanceOf` returns `unknown` rather than
     * guessing, and `exampleNote` says nothing for real and for unknown.
     */
    const originOf = dueOrigins.data;
    const verdictSessions: AgentSession[] = due.map((f) => {
      const when =
        f.daysLate > 0
          ? `due ${f.daysLate} ${f.daysLate === 1 ? "day" : "days"} ago, no verdict yet`
          : "due now, no verdict yet";
      const note = exampleNote(provenanceOf(originOf?.get(f.id), workspaces));
      return {
        id: `forecast:${f.id}`,
        title: cleanTitle(f.claim || f.title),
        need: "needs-input" as const,
        activity: note ? `${when} · ${note}` : when,
        at: instant(f.horizonDate),
        agentSlug: null,
        onOpen: () => void navigate({ to: "/learn" }),
      };
    });

    const callSessions: AgentSession[] = calls.map((c) => ({
      id: c.id,
      title: cleanTitle(c.title),
      need: "needs-input",
      activity: "waiting on your call",
      at: instant(c.timestamp),
      agentSlug: c.agentSlug ?? null,
    }));

    const runSessions: AgentSession[] = rows.flatMap((m): AgentSession[] => {
      const title = cleanTitle(m.title);
      const onOpen = () => void navigate({ to: "/runs/$missionId", params: { missionId: m.id } });

      switch (taskStatus(m.status)) {
        case "blocked":
          return [
            {
              id: m.id,
              title,
              need: "needs-input",
              activity: "waiting on you",
              at: instant(m.completed_at ?? m.updated_at, m.created_at),
              agentSlug: m.current_agent_slug,
              onOpen,
              onReply: (text: string) => openAsk(`About the run "${title}": ${text}`),
            },
          ];
        case "running": {
          const elapsed = ago(m.created_at);
          return [
            {
              id: m.id,
              title,
              need: "working",
              activity: m.current_sub_goal
                ? stripAutoPrefix(m.current_sub_goal)
                : elapsed
                  ? `running ${elapsed}`
                  : "running",
              at: instant(m.updated_at, m.created_at),
              agentSlug: m.current_agent_slug,
              onOpen,
            },
          ];
        }
        case "failed":
          // Failed sits in ready, per the component's own rule: the machine has
          // finished and it is now your turn, so the chip reads the outcome.
          return [
            {
              id: m.id,
              title,
              need: "ready",
              failed: true,
              activity: withWhen(<RunState status={m.status} />, m.completed_at ?? m.updated_at),
              at: instant(m.completed_at ?? m.updated_at, m.created_at),
              agentSlug: m.current_agent_slug,
              onOpen,
            },
          ];
        case "stopped":
          return [
            {
              id: m.id,
              title,
              need: "done",
              activity: withWhen(<RunState status={m.status} />, m.completed_at ?? m.updated_at),
              at: instant(m.completed_at ?? m.updated_at, m.created_at),
              agentSlug: m.current_agent_slug,
              onOpen,
            },
          ];
        case "done":
        case "partial":
          return [
            {
              id: m.id,
              title,
              need: "done",
              activity: withWhen(
                <ShippedState partial={taskStatus(m.status) === "partial"} />,
                m.completed_at ?? m.updated_at,
              ),
              at: instant(m.completed_at ?? m.updated_at, m.created_at),
              agentSlug: m.current_agent_slug,
              onOpen,
            },
          ];
        case "queued":
          return [];
      }
    });

    return [...verdictSessions, ...callSessions, ...runSessions];
  }, [queue.data, missions.data, dueForecasts.data, dueOrigins.data, workspaces, navigate]);

  /*
   * THE LINE ABOVE THE GROUP, and it is the half a per-row mark cannot carry.
   * A desk where EVERY row is a fixture reads as a full desk of real work until
   * a person checks each row, and S4-166 measured that as the commonest state
   * in the product: six of the seven accounts with a desk see exactly that.
   *
   * Counted off what is ON SCREEN rather than off the population, because the
   * rows are the only thing the reader can check the sentence against.
   */
  const exampleLine = React.useMemo(() => {
    /*
     * A FAILED ORIGIN READ IS SAID, BECAUSE OTHERWISE IT IS INVISIBLE (R-16).
     *
     * `provenanceOf` returns `unknown` for a row it cannot place, and `unknown`
     * draws nothing -- which is correct per row and WRONG for the surface,
     * because "every row is real" and "the read that would have told us failed"
     * then look identical. That is the read-came-back-empty defect, and I had
     * built it into the component whose entire subject is that defect.
     *
     * It says only what it can: the rows are still real rows and still due; the
     * thing that did not load is where they came from.
     */
    if (dueOrigins.isError && (dueForecasts.data?.due?.length ?? 0) > 0) {
      return "Where these came from did not load, so any examples among them are not marked.";
    }
    const marks: Provenance[] = (dueForecasts.data?.due ?? []).map((f) =>
      provenanceOf(dueOrigins.data?.get(f.id), workspaces),
    );
    return exampleTally(marks).line;
  }, [dueForecasts.data, dueOrigins.data, dueOrigins.isError, workspaces]);

  const groupNotes = React.useMemo<Record<InboxNeed, React.ReactNode>>(
    () =>
      exampleLine
        ? {
            ...GROUP_NOTES,
            "needs-input": (
              <>
                {GROUP_NOTES["needs-input"]} {exampleLine}
              </>
            ),
          }
        : GROUP_NOTES,
    [exampleLine],
  );

  const missionRows = missions.data?.missions ?? [];
  const workspaceSpend = workspaceSpendTotal(missionRows);

  /*
   * WHETHER THE COUNTS BELOW ARE TOTALS OR FLOORS. `getApprovalsQueue` bounds
   * every family it federates and degrades a failed one to an empty list, and
   * this page has always rendered the result as an exact number. See
   * `not-the-whole-queue.ts` for the measurement that found it.
   */
  const queueGaps = queue.data?.incomplete;

  /*
   * THE VERDICT READ IS PAGED, AND I ALMOST SHIPPED THE DEFECT I HAD JUST
   * FINISHED REMOVING FROM THE QUEUE.
   *
   * `listDueForecastsImpl` selects with `count: "exact"` AND
   * `.limit(DUE_FORECAST_PAGE)`, which is 12. `due` is one page; `total` is the
   * population. There are 15 forecasts past their horizon right now, so taking
   * `due.length` as the count understates by three today and by more later.
   * That is RUN-99 wearing a different hat: a bounded read stated as a total,
   * on the surface whose entire job is telling a person what needs them.
   *
   * S2 found it in my code hours after I handed them the rule. The rows stay
   * the page, because a list is allowed to be a page; the COUNT becomes a
   * floor.
   *
   * A FAILED VERDICT READ ALSO MAKES IT A FLOOR. F-120 made that read throw
   * rather than return an empty desk, precisely so `isError` can be told apart
   * from "nothing due", and this is the client half of that fix: a page that
   * could not ask about verdicts may not answer that nothing needs you.
   */
  const dueShown = dueForecasts.data?.due.length ?? 0;
  const dueTotal = dueForecasts.data?.total ?? 0;
  const verdictsPaged = dueTotal > dueShown;

  const floor = countIsAFloor(queueGaps) || dueForecasts.isError || verdictsPaged;
  const shortLine = dueForecasts.isError
    ? "Your verdicts did not load, so this is not everything waiting on you."
    : verdictsPaged
      ? `${dueTotal - dueShown} more ${dueTotal - dueShown === 1 ? "verdict is" : "verdicts are"} waiting than this lists. Settle these and the rest follow.`
      : notTheWholeQueue(queueGaps);

  const waitingOnYou = sessions.filter((s) => s.need === "needs-input").length;
  const runningCount = sessions.filter((s) => s.need === "working").length;

  /*
   * THE VERDICT READ IS IN THE LOADING GATE, and leaving it out would have
   * reproduced the exact defect this page keeps being fixed for. With the two
   * older reads back and empty and this one still in flight, the headline would
   * say "Nothing needs you." for as long as the forecast query took, and then
   * fifteen verdicts would appear underneath a sentence saying there were none.
   * Zero and not-yet-known are different answers.
   */
  const reading = stillWaiting(queue, missions, dueForecasts);

  const headline = React.useMemo(() => {
    if (reading) return "Inbox";
    if (queue.isError && missions.isError)
      return "Neither your call queue nor your run record loaded.";
    if (queue.isError) return "Your call queue did not load.";
    if (missions.isError) return "Your run record did not load.";
    if (waitingOnYou > 0)
      /*
       * THE HEADLINE SUMMARISES ACROSS THE GROUPS; IT DOES NOT REPEAT THE FIRST
       * ONE.
       *
       * This read "85 waiting on you." three lines above a section heading
       * reading "WAITING ON YOU / 85" -- the same count and very nearly the
       * same words, adjacent, with nothing between them. The section is
       * `AgentInbox`'s and it is right: a grouped list needs a count per group.
       * So the heading above it has to earn its line, and restating group one
       * does not.
       *
       * Adding what is NOT waiting on you is what makes it a summary: the
       * reader learns the shape of the whole list before it breaks apart
       * underneath. `runningCount` was already computed and already used by the
       * branch below, so this states a fact the page holds rather than a new
       * read.
       */
      return runningCount > 0 ? (
        <>
          {floor ? "At least " : null}
          <Num>{waitingOnYou}</Num> need you. <Num>{runningCount}</Num> still running.
        </>
      ) : (
        <>
          {floor ? "At least " : null}
          <Num>{waitingOnYou}</Num> need you.
        </>
      );
    /*
     * "NOTHING WAITS ON YOU" IS A CLAIM AND A CAPPED OR FAILED READ CANNOT
     * MAKE IT. A family that failed to load degrades to an empty list so one
     * refusal cannot blank the other nine, which is right, and it can leave
     * this page reading zero. Saying nothing needs you over a broken read is
     * the worst sentence an inbox can say, so it falls back to naming itself
     * and `shortLine` below carries the reason.
     */
    if (floor) return runningCount > 0 ? <>{runningCount} still running.</> : "Inbox";
    if (runningCount > 0)
      return (
        <>
          Nothing waits on you. <Num>{runningCount}</Num> still running.
        </>
      );
    return "Nothing needs you.";
  }, [reading, queue.isError, missions.isError, waitingOnYou, runningCount, floor]);

  if (!readingWorkspaces && workspaces.length === 0) {
    return (
      <Surface>
        <div className="flex flex-col gap-mrd-7">
          <PageHeading title="Inbox" sub={SUBTITLE} />
          <NeedsSetup
            kind="no-workspace"
            thenWhat="every call the crew stops to ask, and every run it is holding, lands here grouped by what each one needs from you."
          />
        </div>
      </Surface>
    );
  }

  const spendNote =
    workspaceSpend !== null ? `Workspace spend: $${workspaceSpend.toFixed(2)}` : null;

  return (
    <Surface>
      <div className="flex flex-col gap-mrd-7">
        <div className="flex items-end justify-between gap-mrd-4">
          <PageHeading title={headline} sub={SUBTITLE} />
          {/*
            WHAT THE QUEUE COULD NOT SHOW, beside the number rather than in a
            log. Same sentence as /approvals, from one module, so the two
            surfaces cannot give a person two answers about one queue.
          */}
          {shortLine ? <p className="text-mrd-hold">{shortLine}</p> : null}
          {spendNote && <p className="mrd-meta">{spendNote}</p>}
        </div>

        {reading ? (
          <Reading>Reading what needs you.</Reading>
        ) : queue.isError || missions.isError ? (
          <ReadFailedLine
            onRetry={() => {
              void queue.refetch();
              void missions.refetch();
            }}
            error={queue.error ?? missions.error}
          >
            {queue.isError && missions.isError
              ? "Nothing was settled and nothing was lost while this page could not read them. Retry before you treat the inbox as clear."
              : queue.isError
                ? "Your calls are unchanged and this could not read them. Retry before you treat the inbox as clear."
                : "The run record did not load, so what stopped, what is live and what shipped are missing from this list."}
          </ReadFailedLine>
        ) : (
          <AgentInbox sessions={sessions} groupNote={groupNotes} />
        )}
      </div>
    </Surface>
  );
}
