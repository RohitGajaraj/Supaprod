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

import { listStudioSessions } from "@/lib/studio.functions";
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
export function useSpineStrip(active: AgentStation | null): void {
  const navigate = useNavigate();
  const fList = useServerFn(listStudioSessions);

  // The board's exact key, so the two share one fetch rather than racing two.
  const sessions = useQuery({
    queryKey: ["studio-sessions", false],
    queryFn: () => fList({ data: { includeArchived: false } }),
    refetchInterval: 5000,
  });

  const rows = sessions.data?.sessions;

  const stages = React.useMemo<RunStage[] | null>(() => {
    // No strip until the record answers. A strip of seven "none"s while the
    // query is still in flight would say the workspace is empty, which is a
    // claim, not a loading state.
    if (!rows) return null;

    const tally = new Map<AgentStation, { total: number; working: number; gate: number }>();
    for (const st of AGENT_STATION_ORDER) tally.set(st, { total: 0, working: 0, gate: 0 });
    for (const s of rows) {
      const bucket = s.station ? tally.get(s.station) : undefined;
      if (!bucket) continue;
      bucket.total += 1;
      const state = runState(s);
      if (state === "working") bucket.working += 1;
      if (state === "gate") bucket.gate += 1;
    }

    return AGENT_STATION_ORDER.map((station) => {
      const b = tally.get(station) ?? { total: 0, working: 0, gate: 0 };
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
      const note = b.gate
        ? `${b.gate} ${b.gate === 1 ? "run" : "runs"} waiting on you`
        : b.working
          ? `${b.working} running`
          : b.total
            ? `${b.total} ${b.total === 1 ? "run" : "runs"}`
            : "";
      const state: RunStage["state"] = b.gate
        ? "gate"
        : b.working
          ? "working"
          : b.total
            ? "done"
            : "quiet";
      return { station, state, note };
    });
  }, [rows]);

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
