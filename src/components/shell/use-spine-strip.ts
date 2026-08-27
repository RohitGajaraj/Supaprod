/**
 * The seven-stage strip, as seen from anywhere on the spine that is not one run.
 *
 * FOUNDER RULING 2026-07-30, the second half: the strip must be on screen the
 * whole time you are in the Run section, it must show which station is working
 * without you opening anything, and clicking a station must open that station's
 * engine.
 *
 * One hook, seven callers, ONE query. Every spine surface calls this with its
 * own station and gets the same numbers, because they all read the same
 * `["studio-sessions", false]` cache entry that the board already populates.
 * React Query dedupes it, so putting the strip on seven surfaces costs one
 * request, not seven. That matters: a strip that is always on screen is a strip
 * whose cost is paid on every page in the section.
 *
 * WHAT A NUMBER MEANS HERE. Not one run's progress: how many of this
 * workspace's runs are standing at each stage, and which of them want a person.
 * `station` is resolved server-side in `listStudioSessions` so the board, the
 * strip and the run all answer "what stage is this at" the same way rather than
 * each inventing a rule.
 *
 * WHAT IT NEVER DOES. It never counts a run it cannot place. A run whose agent
 * is not in the catalog resolves to a null station and is counted at no stage,
 * rather than being filed under a guessed one to make the strip look busier.
 */

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";

import { pollMs } from "@/components/shell/poll";
import { listStudioSessions } from "@/lib/studio.functions";
import { listDueForecasts } from "@/lib/forecast.functions";
import { listPendingOutcomes } from "@/lib/outcome.functions";
import { runState } from "@/components/runs/run-state";
import { AGENT_STATION_ORDER, type AgentStation } from "@/lib/agent-vocabulary";
import { usePublishRunStrip, STATION_ROUTE, type RunStage } from "./run-strip";

/**
 * Publish the workspace's spine, with `active` lit on the station you are
 * standing on. Clicking any other chip opens that station's engine.
 *
 * `null` is for /runs, and it is not a missing value. The runs board is the
 * section entry rather than one of the seven: it lists RUNS, one piece of work
 * walking all seven stages, which is the other axis entirely. Lighting a chip
 * there would claim the board is a station, which is the exact confusion that
 * put Build's engine at /runs and left the real one unbuilt.
 */
/**
 * The strip's cadence: five seconds while answers arrive, backed off by
 * `pollMs` while they do not.
 *
 * THE DEFECT THIS CLOSED. This was a bare `refetchInterval: 5000`, and
 * `WorkspaceSpine` is mounted for the whole signed-in session - so against a
 * backend that was not answering it was every screen in the product asking
 * twelve times a minute, hardest at the moment it was least able to answer.
 * Found by S1 running `e2e/check-motion.sh --signed-in` against a dead backend.
 *
 * NOT A LIE, A LOAD PROBLEM. The strip keeps saying "count unavailable"
 * throughout, which stays true, so nothing here claimed a state it did not
 * have. That is why the fix is arithmetic and changes no words on screen.
 *
 * The reasoning for backing off rather than stopping lives in `poll.ts`.
 */
export function stripPollMs(failures: number): number | false {
  return pollMs(5_000, failures);
}

export function useSpineStrip(active: AgentStation | null): void {
  const navigate = useNavigate();
  const fList = useServerFn(listStudioSessions);
  const fListPending = useServerFn(listPendingOutcomes);
  const fDueForecasts = useServerFn(listDueForecasts);

  // The board's exact key, so the two share one fetch rather than racing two.
  const sessions = useQuery({
    queryKey: ["studio-sessions", false],
    queryFn: () => fList({ data: { includeArchived: false } }),
    refetchInterval: (query) => stripPollMs(query.state.fetchFailureCount),
  });

  // Pending outcomes for the Learn station badge. 60s staleTime: outcome queue
  // moves slowly and this is ambient notification, not a live gate.
  const pendingOutcomes = useQuery({
    queryKey: ["pending-outcomes"],
    queryFn: () => fListPending(),
    staleTime: 60_000,
    /* Ambient, and still backed off. A minute is gentle, but on a dead backend
       it is still an unbounded loop from every screen in the product, and the
       reason to exempt it would be that it is only a little wasteful. */
    refetchInterval: (query) => pollMs(60_000, query.state.fetchFailureCount),
  });

  const rows = sessions.data?.sessions;
  /* THE OTHER THING THAT COMES DUE AT LEARN, and it is the one the product is
     actually about.

     This badge counted only shipped specs with no outcome recorded. Measured
     2026-08-27 by S1: **0** of 21 shipped specs are unsettled, so the badge was
     correctly quiet - and **15 decision forecasts are past their horizon with
     no verdict written**, which nothing outside /learn was surfacing.

     A forecast with no verdict is the one thing this product claims as its
     moat: what a team believed would happen, recorded before the outcome was
     known. A station badge that stays silent while fifteen of them come due is
     silent about the only thing the station is for.

     WHY THESE TWO ARE SUMMED WHEN `run-totals.ts` REFUSES TO SUM. That file
     keeps session spend and track spend apart because they are two engines and
     the total "would invent a number nobody can check against either source".
     The test it implies is whether the sum is checkable where the badge points,
     and here it is: both are "an outcome nobody has recorded", the act a person
     performs is identical, and /learn lists both. Different tables, no overlap
     - `prds` with a shipped date against `decisions` past a horizon.

     `["forecast-due"]` IS THE DESK'S OWN KEY, deliberately. `ForecastDeskPanel`
     and the inbox already read it, so a third reader costs one fetch and the
     three cannot disagree about how many are due. */
  const dueForecasts = useQuery({
    queryKey: ["forecast-due"],
    queryFn: () => fDueForecasts(),
    staleTime: 60_000,
    refetchInterval: (query) => pollMs(60_000, query.state.fetchFailureCount),
  });

  /* `total`, NEVER `due.length`. `listDueForecastsImpl` selects with
     `count: "exact"` AND `.limit(DUE_FORECAST_PAGE)`, so the array is one page
     and the count is the population. Rendering the page length as the number
     is the defect S1 measured across the approvals queue the same day: 116
     pending gates behind a limit of 100, and every surface said 100. */
  const outcomesDue = React.useMemo(() => {
    const specs = pendingOutcomes.data?.pending.length;
    const forecasts = dueForecasts.data?.total;
    /* BOTH OR NEITHER. A total assembled from one of two reads is not a total,
       and this line has no room to say which half it is missing. Silence is
       what this hook already did when the outcome read failed, so this is the
       existing behaviour extended rather than a new rule. */
    if (specs === undefined || forecasts === undefined) return null;
    return specs + forecasts;
  }, [pendingOutcomes.data, dueForecasts.data]);

  const pendingCount = outcomesDue ?? 0;

  const sessionsFailed = sessions.isError;

  const stages = React.useMemo<RunStage[] | null>(() => {
    // A FAILED READ IS NOT A LOADING STATE, and until 2026-08-10 this hook could
    // not tell them apart: `isError` was never consulted, so a failed
    // `listStudioSessions` fell into the `!rows` branch below and returned null.
    // Because WorkspaceSpine is mounted for the whole session, that removed the
    // seven-station strip from EVERY screen in the product at once, with no
    // message anywhere. The one control that answers "where is the work" would
    // simply cease to exist, and the most natural reading of its absence is that
    // there is no work.
    //
    // The strip stays. It reports that it cannot count, using the escape hatch
    // this file's own `note` contract already defines -- "never invented, an
    // unknown stage says so". Every station goes quiet and says why, which is
    // strictly more honest than seven zeros and infinitely more honest than
    // nothing. `quiet` is the right state because it is the only one that makes
    // no claim about the work; `done`, `working` and `gate` all would.
    if (sessionsFailed && !rows) {
      return AGENT_STATION_ORDER.map((station) => ({
        station,
        state: "quiet" as const,
        note: "count unavailable",
      }));
    }

    // No strip until the record answers. A strip of seven "none"s while the
    // query is still in flight would say the workspace is empty, which is a
    // claim, not a loading state.
    if (!rows) return null;

    /*
     * `held` and `failed` are counted here for the first time. `runState` has
     * always returned five values and this tally read two of them, so a queued
     * run and a failed run both fell through to the plain total and the chip
     * said "5 runs" — the same words, in the same neutral, as five healthy
     * ones. A station full of failures reading as a station full of work is
     * the same class of lie as a fabricated count.
     */
    const tally = new Map<
      AgentStation,
      { total: number; working: number; gate: number; held: number; failed: number }
    >();
    for (const st of AGENT_STATION_ORDER)
      tally.set(st, { total: 0, working: 0, gate: 0, held: 0, failed: 0 });
    for (const s of rows) {
      const bucket = s.station ? tally.get(s.station) : undefined;
      if (!bucket) continue;
      bucket.total += 1;
      const state = runState(s);
      if (state === "working") bucket.working += 1;
      if (state === "gate") bucket.gate += 1;
      /* Queued is "stopped, and not on you": it is waiting on a condition —
         a source, a worker, capacity — never on a decision. That is exactly
         the amber role, and it is why this is `held` rather than `queued`
         here: the chip names what the reader experiences, not the enum. */
      if (state === "queued") bucket.held += 1;
      if (state === "stopped") bucket.failed += 1;
    }

    return AGENT_STATION_ORDER.map((station) => {
      const b = tally.get(station) ?? { total: 0, working: 0, gate: 0, held: 0, failed: 0 };
      const isLearn = station === "learn";
      // For Learn station, add pending outcomes to the note
      const learnExtra =
        isLearn && pendingCount > 0
          ? `, ${pendingCount} ${pendingCount === 1 ? "outcome" : "outcomes"} to record`
          : "";

      // Most urgent true thing first. A stage with a gate says so even while
      // something else on it is running, because the gate is the one that
      // wants a person and the person is who the line is for.
      // EMPTY, not "none". Founder, 2026-07-30: "why do we need to display
      // 'none' when nothing is pending. if only something i need to act on,
      // you can show, else cant it be empty?" He is right: on a normal
      // workspace five or six chips carried the same dead word, so the eye had
      // to read six lines to find the one that said something. The chip's own
      // muted styling already says nothing is here. The strip reserves the
      // line's height in CSS so removing the word does not make the region
      // jump every time a run starts or finishes.
      // NAME WHAT IS WAITING. This chip counts RUNS held at a gate, and it used
      // to read "20 waiting on you" directly above a Discover page reading
      // "9 clusters are waiting on a call". Both numbers were right about
      // different objects, and with the same six words between them the screen
      // read as a contradiction. Saying "runs" costs one word and removes it.
      /*
       * ONE LINE, AND IT IS THE MOST URGENT TRUE THING. The order below is the
       * order a reader needs, not the order the enum happens to be in:
       *
       *   waiting on you   a person is blocking it. Nothing outranks this,
       *                    because the strip exists for that person.
       *   failed           an outcome, and one somebody has to look at. It
       *                    beats "running" because a station that is both
       *                    running something and has broken something needs
       *                    the breakage said out loud.
       *   running          a machine is working. Ambient, not urgent.
       *   held             stopped, waiting on a condition rather than a
       *                    decision. Said plainly so nobody hunts for a button.
       *   a count          present and idle.
       *   nothing          empty, and deliberately blank — founder, 2026-07-30:
       *                    "why do we need to display 'none' when nothing is
       *                    pending". The chip's muted styling already says it.
       */
      const runWord = (n: number) => (n === 1 ? "run" : "runs");
      const note = b.gate
        ? `${b.gate} ${runWord(b.gate)} waiting on you`
        : b.failed
          ? `${b.failed} failed`
          : b.working
            ? `${b.working} running`
            : b.held
              ? `${b.held} held`
              : b.total
                ? `${b.total} ${runWord(b.total)}${learnExtra}`
                : isLearn && pendingCount > 0
                  ? `${pendingCount} ${pendingCount === 1 ? "outcome" : "outcomes"} to record`
                  : "";
      const state: RunStage["state"] = b.gate
        ? "gate"
        : b.failed
          ? "failed"
          : b.held && !b.working
            ? "held"
            : b.working
              ? "working"
              : b.total
                ? "done"
                : "quiet";
      return { station, state, note };
    });
  }, [rows, pendingCount, sessionsFailed]);

  usePublishRunStrip(
    stages
      ? {
          stages,
          active,
          mode: "nav",
          label: "The seven stages, and where the work is",
          // Clicking the station you are already on is not a navigation. Doing
          // it anyway would remount the surface under the person for no reason.
          onSelect: (station) => {
            if (station === active) return;
            void navigate({ to: STATION_ROUTE[station] });
          },
        }
      : null,
  );
}

/**
 * THE SPINE THE SHELL FALLS BACK TO, mounted once for the whole session.
 *
 * This is the same workspace spine every station already publishes, with no
 * station lit, and it is what a surface gets when it publishes nothing of its
 * own. `RunStripProvider` renders it; see the DEFAULT SPINE section in
 * run-strip.tsx for why absence stopped being the default.
 *
 * It renders no DOM. It exists to hold the query and the publish, because a
 * hook cannot be conditional and the shell needs one caller that is always
 * mounted. Being always mounted is also what removes the strip's arrival jump:
 * the `["studio-sessions", false]` entry is warm from the first read of the
 * session onward, so navigating between surfaces never re-enters the loading
 * state where `stages` is null and the region collapses.
 *
 * THE POLL IS NOW APP WIDE, and that is the honest cost of an always-on strip.
 * One query, 5s, deduped with every spine surface and with the board by the
 * shared key, so the request count does not change on any surface that already
 * drew a strip and goes from zero to one on the surfaces that did not.
 */
export function WorkspaceSpine(): null {
  // `null` is the whole point: Brain is not a station, so nothing is lit. The
  // strip still answers "where is the work", which is a question every surface
  // in the product has.
  useSpineStrip(null);
  return null;
}
