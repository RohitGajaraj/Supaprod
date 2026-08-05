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
    queryFn: () => fetchMissions({ data: {} }),
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
      }));
    return { working, any: working.length > 0 };
  }, [missions.data]);
}
