import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useWorkspace } from "@/hooks/use-workspace";
import { missionsKey } from "@/lib/query-keys";
import { listMissions, type MissionListRow } from "@/lib/missions.functions";
import { agentDisplayName } from "@/lib/agent-vocabulary";

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
  missionId: string;
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
};

export type LiveAgents = {
  /** Every agent mid-run in this workspace, newest first. */
  working: LiveAgent[];
  /** True when anything at all is running, which is the common question. */
  any: boolean;
};

export function useLiveAgents(): LiveAgents {
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id ?? null;
  const fetchMissions = useServerFn(listMissions);

  const missions = useQuery({
    // The SHELL'S key, on purpose. Same key, same cache entry, no second request.
    queryKey: missionsKey(workspaceId),
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
    queryFn: () => fetchMissions({ data: { workspaceId: workspaceId ?? undefined } }),
  });

  return React.useMemo(() => {
    const rows: MissionListRow[] = missions.data?.missions ?? [];
    const working = rows
      .filter((m) => WORKING.has(m.status))
      .sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""))
      .map((m) => ({
        missionId: m.id,
        title: m.title,
        slug: m.current_agent_slug,
        name: agentDisplayName(m.current_agent_slug, null),
        subGoal: m.current_sub_goal,
      }));
    return { working, any: working.length > 0 };
  }, [missions.data]);
}
