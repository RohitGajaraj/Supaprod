import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useWorkspace } from "@/hooks/use-workspace";
import { missionMarksKey, runningNowKey } from "@/lib/query-keys";
import { listMissionMarks, type MissionMark } from "@/lib/missions.functions";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { listRunningNow } from "@/lib/spine/track.functions";

/**
 * WHICH AGENTS ARE ACTUALLY WORKING, RIGHT NOW.
 *
 * THE GAP THIS CLOSES, and it is the largest one between what this product does
 * and what a person can see it do.
 *
 * Twelve `<AgentPulse>` mounts exist across the stations, and almost every one
 * of them is gated on a react-query mutation's `isPending`:
 * `draftSpec.isPending` on Decide, `critic.isPending` and `drawAt.isPending` on
 * Design, `busy` on a run, and so on. That means the indicator lives exactly as
 * long as the fetch THE USER'S OWN CLICK started, and not one moment longer.
 *
 * The consequence is the whole point. Everything this product claims to do on
 * its own produces NO indicator anywhere:
 *
 *   - `driveTrackOnce` (lib/spine/driver.server.ts) walking a piece of work
 *     through all seven stations unattended,
 *   - the resume-runs sweeper promoting a queued run minutes after the click
 *     that enqueued it (the sharpest case: the pulse on plan.spec reads "Build
 *     is picking up the spec" and stops at the exact moment the agent starts),
 *   - anything dispatched from Ask,
 *   - anything a cron raised.
 *
 * A product whose defining claim is that agents do the work had a light that
 * only ever came on when the human pressed something.
 *
 * WHY THIS IS A HOOK AND NOT A NEW READ. The shell already knows. `AppFrame`
 * filters the same `listMissions` result by the same working statuses to draw
 * the header's MarkStack. This reuses that query under the SAME key
 * (`missionsKey`), so mounting it on a station adds no request: react-query
 * dedupes it, and a station that mounts this simply reads what the header was
 * already reading. What was missing was never the data. It was that the data
 * reached the chrome and never reached the work.
 *
 * DELIBERATELY NOT A POLL OF ITS OWN. `refetchInterval` is left to the shell,
 * which owns the cadence and already tunes it (4s while work is moving). A
 * second interval here would double the traffic to say the same thing.
 *
 * AND IT CARRIES THE WORK, NOT ONLY THE NAME. `subGoal` below is the sentence
 * the planner wrote for the step the mission is actually on, passed through
 * verbatim — nothing here rewrites it, and nothing should. A name plus a state
 * proves something is alive; the sentence proves something is thinking. It is
 * the difference between a surface that can only say "Engineer is working on
 * Beacon SSO" and one that can put "Implement a /health JSON endpoint and a
 * plain landing page in the starter app" underneath it. It costs nothing here —
 * `listMissions` reads `mission_steps` for the step dots either way — and it is
 * null often enough (single-run missions have no steps at all) that every
 * reader must have a fallback rather than assume it.
 */

/** The statuses that mean an agent is genuinely mid-run. Same set the shell uses. */
const WORKING = new Set(["running", "in_progress"]);

export type LiveAgent = {
  /** The RUN. Always present, and the only identity every seat has (P-127). */
  id: string;
  /** Null for a seat the spine dispatched outside a mission. */
  missionId: string | null;
  /** Null for a seat with no track, such as the orchestrator. */
  trackId: string | null;
  /** Where the work is, when it has a track. */
  station: string | null;
  /** The mission's own title, so a surface can say WHAT is being worked on. */
  title: string;
  /** Roster slug, for the glyph and the stage hue. Null when never run. */
  slug: string | null;
  /** The name a person reads. Falls back to the catalog for an unknown slug. */
  name: string;
  /**
   * The step this agent is on, in the planner's own words — a model-written
   * imperative sentence ("Create a sprint plan outlining the tasks, estimated
   * effort, and sequence for implementing the /health JSON endpoint and the
   * landing page, based on the provided PRD."). Measured across all 291
   * `mission_steps` rows on 2026-08-06: median 110 characters, p90 240, longest
   * 561, so a reader must decide how much of it fits rather than assume a
   * phrase.
   *
   * NULL IS NORMAL, not an error: the mission has no step mid-flight, or it is
   * a single-run mission with no `mission_steps` rows. Show the title instead;
   * never write a sentence to fill the gap.
   *
   * It is PROSE, and that rules out one place it must not go: `AgentPulse`'s
   * `detail` slot is mono, nowrap and single-line (`.sp-pulse-detail`,
   * primitives.css:2592-2605) and its contract asks for "a NOUN THIS SURFACE
   * ALREADY READ. Never a second verb" (AgentPulse.tsx:112-117). An imperative
   * sentence there collides with the rotating verb and gets clipped to a few
   * mono words. Give it its own line. See CrewWorking.tsx.
   */
  subGoal: string | null;
  /** What the seat is doing right now, first person ("reading the repository"),
   *  from its latest tool call; null before its first call (Lane 3, P-127). */
  verb: string | null;
  /** ISO. When the seat started, so a presence can tick. */
  startedAt: string | null;
};

export type LiveAgents = {
  /** Every agent mid-run in this workspace, newest first. */
  working: LiveAgent[];
  /** True when anything at all is running, which is the common question. */
  any: boolean;
  /**
   * The most recently touched finished mission, for a reader when nothing is
   * working -- "X finished" in the past tense rather than silence. Null when
   * nothing has ever finished. P-18b (A-QUEUE.md).
   */
  lastDone: { title: string; completedAt: string } | null;
};

export function useLiveAgents(): LiveAgents {
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id ?? null;
  const fetchMissions = useServerFn(listMissionMarks);

  const missions = useQuery({
    // The SHELL'S key, on purpose. Same key, same cache entry, no second request.
    // The marks read since 2026-09-09: seven fields a mission in one round
    // trip, where listMissions carried every step and run of fifty missions
    // (170 KB, five seconds on the run screen) for a "last done" line.
    queryKey: missionMarksKey(workspaceId),
    /*
     * THE WORKSPACE IS PASSED, and until 2026-08-18 it was not.
     *
     * The key said `missionsKey(workspaceId)` and the fetch said `{}`.
     * `listMissions` only filters when `input.workspaceId` is present, so the
     * key changed on a workspace switch and the DATA never did: this hook
     * reported every working mission on the account, and the shell's live line
     * could name an agent working somewhere the reader was not looking.
     *
     * Worse, one key held two different datasets. Four callers share
     * `missionsKey`; `_authenticated.today.tsx` passed the workspace and the
     * other three did not, so whichever mounted first won and the rest read its
     * cache. Which meant the answer depended on mount order.
     */
    queryFn: () => fetchMissions({ data: { workspaceId: workspaceId as string } }),
    /* Not before the workspace is known, the same rule the shell's own read
       keeps: the key claims a workspace, so the fetch must name one. */
    enabled: Boolean(workspaceId),
  });

  /*
   * P-18b (A-QUEUE.md). THE SAME CROSS-CHECK THE BAR ALREADY MAKES, not a
   * second one invented here.
   *
   * At 06:45 IST the bar read "Nothing running" while this hook's own
   * `working` still said an agent was mid-run on a mission whose `status`
   * had gone stale independently of the work it names -- P-18/P-18a's own
   * defect (`genuinely-working.ts`'s header), now caught a second time on
   * the one reader P-18a never touched. `genuinelyWorkingMissions` is the
   * exact pure filter `AppFrame.tsx` already runs its own `missions` read
   * through; `listMovingTracks` is mounted under the SAME query key
   * (`["shell","moving-tracks"]`) the shell already polls, so this is a
   * cache read, never a second request or a second interval -- the file's
   * own standing rule just above stays true.
   */
  /*
   * ── THE SUBJECT IS THE RUN NOW (P-127) ─────────────────────────────────
   *
   * This asked `listMissions` for missions whose stored status looked like
   * work, then confirmed each against `listMovingTracks` because that column
   * goes stale. Both hops were right on their own terms and between them they
   * dropped every seat the spine dispatches:
   *
   *   06:13 on 2026-09-04  the orchestrator was running, and had no TRACK, so
   *                        `genuinelyWorkingMissions` could not confirm it and
   *                        correctly refused to guess.
   *   06:44               the release seats were running, and had no MISSION,
   *                        so they were never in the list to begin with.
   *
   * The header said "Nothing running" both times, on the day this product
   * shipped its first release. No amount of cross-checking a mission's status
   * reaches a seat that has no mission -- so the question is asked of
   * `agent_runs`, which is the table that knows.
   *
   * `genuinelyWorkingMissions` and its cross-check are NOT deleted: they still
   * guard `AppFrame`'s mission-shaped read, and the defect they exist for
   * (a stale `missions.status`) is untouched by this. What changes is that
   * this hook no longer needs them, because a run's status is not a stored
   * summary of something else.
   */
  const fetchRunning = useServerFn(listRunningNow);
  const running = useQuery({
    queryKey: runningNowKey(workspaceId),
    queryFn: () => fetchRunning({ data: { workspaceId } }),
  });

  return React.useMemo(() => {
    const rows: MissionMark[] = missions.data?.missions ?? [];
    const working = (running.data ?? []).map((seat) => ({
      id: seat.runId,
      missionId: seat.missionId,
      trackId: seat.trackId,
      station: seat.station,
      title: seat.title ?? "",
      slug: seat.slug,
      name: agentDisplayName(seat.slug, null),
      /* The planner's sentence for the step in flight, carried through from the
         mission the run belongs to. Null for a seat with no mission -- honest,
         rather than a sentence invented to fill the slot. */
      subGoal: seat.subGoal,
      verb: seat.now?.verb ?? null,
      startedAt: seat.startedAt ?? null,
    }));

    // Same source and shape as AppFrame.tsx's own `lastDone`: the most
    // recently touched finished mission, said in the past tense rather than
    // silence when nothing is currently working.
    const done = rows
      .filter((m) => !WORKING.has(m.status) && m.completed_at)
      .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));
    const lastDone = done[0] ? { title: done[0].title, completedAt: done[0].completed_at! } : null;

    return { working, any: working.length > 0, lastDone };
  }, [missions.data, running.data]);
}
