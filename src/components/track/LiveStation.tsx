/**
 * THE STATION BEING WORKED, DRAWN AS IT FILLS.
 *
 * ── WHAT A PERSON SEES (founder, 2026-09-08) ─────────────────────────────
 * "Which agent, on what, right now, with its own identity on screen." While
 * a seat works the standing station, the right pane draws:
 *
 *   1. the seats here now, one `AgentPresence` each in its own colour, with
 *      the verb and the object of its newest call ("Discovery Scout is
 *      searching the workspace for “installer arrival time”", ticking);
 *   2. one line for what they have done so far ("6 searches, 1 read ·
 *      nothing matched yet");
 *   3. the files filling in under their hands, each marked with the colour of
 *      the seat that touched it and whether it wrote or read;
 *   4. the calls arriving, oldest first, following the tail.
 *
 * Nothing spins. The presence breathes, the clock ticks, rows arrive.
 *
 * ── THE SAME TWO READS THE TRANSCRIPT POLLS ──────────────────────────────
 * `["track-activity", trackId]` says which runs are live (only a run row may
 * say so) and `["track-tool-calls", trackId]` says what they called. Both are
 * the transcript's keys and cadence, so the left pane and this one cannot
 * disagree about who is here or what they just did. `useLiveAgents` adds the
 * planner's sentence for the step in flight, when the seat has one.
 *
 * Before the first run row lands, the old sentence stands: the station is
 * running and has filed nothing yet. A pane that goes blank for a beat is a
 * pane a person stops trusting.
 */
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getTrackActivity, getTrackToolCalls } from "@/lib/spine/track.functions";
import type { Turn } from "@/lib/spine/activity";
import { toolActionLabel, type AgentStation } from "@/lib/agent-vocabulary";
import { useLiveAgents } from "@/hooks/use-live-agents";
import { AgentPresence, PresenceDot, presenceColour } from "@/components/meridian/AgentPresence";
import { ToolStream, type ToolStreamRow } from "@/components/meridian/ToolStream";
import { RecordSpeaks, Reading, ReadFailedLine } from "@/components/meridian/surface-parts";
import { usePrefersReducedMotion } from "@/components/knowledge/graph-visual";
import { enterMotion } from "@/components/spine/enter-motion";
import {
  callsOf,
  filesTouched,
  objectOf,
  soFar,
  type LiveCall,
  type TouchedFile,
} from "@/components/track/live-station";

export function LiveStation({
  trackId,
  station,
  label,
  purpose,
}: {
  trackId: string;
  station: AgentStation;
  /** The station's name as the pane prints it: "Discover". */
  label: string;
  /** What the station will do, for the sentence before the first row lands. */
  purpose?: string | null;
}) {
  const fetchActivity = useServerFn(getTrackActivity);
  const fetchCalls = useServerFn(getTrackToolCalls);
  const activityQ = useQuery({
    queryKey: ["track-activity", trackId],
    queryFn: () => fetchActivity({ data: { trackId } }),
    refetchInterval: 500,
  });
  const callsQ = useQuery({
    queryKey: ["track-tool-calls", trackId],
    queryFn: () => fetchCalls({ data: { trackId } }),
    refetchInterval: 500,
  });
  const liveAgents = useLiveAgents();

  /* Only a run row may say a seat is live; a seat with no station of its own
     (the orchestrator) works wherever the track stands. */
  const seats = React.useMemo(() => {
    const turns = (activityQ.data?.turns ?? []) as Turn[];
    return turns.filter(
      (t) =>
        (t.outcome === "working" || t.outcome === "waiting") &&
        (t.station === station || t.station === null),
    );
  }, [activityQ.data, station]);

  const calls = React.useMemo<LiveCall[]>(
    () =>
      (callsQ.data?.calls ?? []).map((c) => ({
        id: c.id,
        tool: c.tool,
        at: Date.parse(c.at),
        ok: c.ok,
        runId: c.runId,
        argument: c.argument,
        found: c.found,
        files: c.files,
        touch: c.touch,
        error: c.error,
        latencyMs: c.latencyMs,
      })),
    [callsQ.data],
  );
  const runIds = React.useMemo(() => new Set(seats.map((s) => s.runId)), [seats]);
  const own = React.useMemo(() => callsOf(calls, runIds), [calls, runIds]);
  const files = React.useMemo(() => filesTouched(own), [own]);
  const line = soFar(own);
  const colourOf = (runId: string | null) => {
    const seat = seats.find((s) => s.runId === runId);
    return presenceColour(seat?.agentName ?? "");
  };

  if (seats.length === 0) {
    return (
      <RecordSpeaks>
        {`${label} is running now, and has not filed anything yet.${purpose ? ` ${purpose}` : ""}`}
      </RecordSpeaks>
    );
  }

  const rows: ToolStreamRow[] = own.map((c) => ({
    id: c.id,
    tool: c.tool,
    at: c.at,
    state: c.ok ? "done" : "failed",
    argument: c.argument ?? undefined,
    durationMs: c.latencyMs && c.latencyMs > 0 ? c.latencyMs : undefined,
    error: c.error ?? undefined,
  }));

  return (
    <div className="flex flex-col gap-mrd-4">
      {/*
        "at this STOP", which is the word this pane already uses -- its own
        caption reads "Press a stop on the road above, or a row below, for
        another". The Now card lists the run's seats under "Working on this
        run"; this list is scoped to the one stop being shown, and "here" was
        the only word carrying that difference, which it carried to nobody who
        could not see where the list sat.

        NOT "station", which was my first draft and which
        `a-user-never-reads-the-org-chart` correctly refused: that is the
        machine's word for the thing, and a person reads a road with stops on
        it. The guard caught a label I had written to fix a labelling defect.
      */}
      <ul aria-label="Working on this stop" className="flex flex-col gap-mrd-1">
        {seats.map((t) => {
          const running = liveAgents.working.find((a) => a.id === t.runId);
          const mine = own.filter((c) => c.runId === t.runId);
          const newest = mine[mine.length - 1] ?? null;
          const waiting = t.outcome === "waiting";
          const verb = waiting
            ? "waiting on you"
            : ((newest ? toolActionLabel(newest.tool) : null) ?? running?.verb ?? null);
          const object = waiting
            ? null
            : newest
              ? objectOf(newest.tool, newest.argument)
              : (running?.subGoal ?? null);
          return (
            <li key={t.runId}>
              <AgentPresence
                seat={t.agentName}
                verb={verb}
                object={object}
                since={t.at}
                colour={presenceColour(t.agentName)}
                alive
              />
            </li>
          );
        })}
      </ul>
      {line ? <span className="mrd-meta">{line}</span> : null}
      {files.length > 0 ? <FilesTouched files={files} colourOf={colourOf} /> : null}
      {/*
       * ── A READ THAT REFUSED AND A SEAT THAT HAS CALLED NOTHING ARE
       *    DIFFERENT FACTS (DESIGN-SYSTEM.md, the fifth review's rule) ───────
       *
       * `calls` is `callsQ.data?.calls ?? []`, so an empty list arrived here
       * from three unrelated places -- the read is still out, the read failed,
       * or the seat genuinely has not called anything yet -- and `ToolStream`
       * printed the third one's sentence, "Nothing called yet.", for all three.
       * Nothing in this file read `callsQ.isLoading` or `callsQ.isError` at all.
       *
       * It is the worst of the three to guess at on THIS surface, because this
       * is the live station: a person is watching a seat work and the panel
       * that exists to show what it is doing tells them it is doing nothing.
       */}
      {callsQ.isError ? (
        <ReadFailedLine error={callsQ.error}>
          What it is calling did not come back, so this list would not be trustworthy.
        </ReadFailedLine>
      ) : callsQ.isLoading ? (
        <Reading>Reading what it is calling.</Reading>
      ) : (
        <ToolStream rows={rows} working label="What it is calling" maxHeight={240} />
      )}
    </div>
  );
}

/**
 * The files under the seats' hands. Grows at the bottom; a row that arrives
 * after mount enters the way a stream row does, and a row present at mount
 * does not, for the reason `ToolStream` gives.
 */
function FilesTouched({
  files,
  colourOf,
}: {
  files: TouchedFile[];
  colourOf: (runId: string | null) => string;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const settledAtMount = React.useRef(files.length);
  return (
    <ul aria-label="Files touched" className="flex flex-col gap-mrd-1">
      {files.map((f, i) => (
        <li
          key={f.path}
          className="flex min-w-0 items-center gap-mrd-2 text-mrd-data"
          style={enterMotion(i >= settledAtMount.current, reducedMotion)}
        >
          <PresenceDot colour={colourOf(f.runId)} alive={false} size={6} />
          <span className="font-mrd-mono min-w-0 flex-1 break-all text-mrd-ink">{f.path}</span>
          <span className="shrink-0 text-mrd-mute">{f.touch}</span>
        </li>
      ))}
    </ul>
  );
}

export default LiveStation;
