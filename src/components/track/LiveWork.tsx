import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { ToolStream, type ToolStreamRow } from "@/components/meridian/ToolStream";
import { NothingYet, ReadFailedLine } from "@/components/meridian/surface-parts";
import { getTrackToolCalls } from "@/lib/spine/track.functions";

/**
 * ── WHAT THE AGENT IS ACTUALLY DOING, WHILE IT DOES IT ────────────────────
 *
 * THE REQUIREMENT, in the founder's words and marked non-negotiable: *"Being
 * truly agentic is not only about the agent doing the work. It is about the
 * user seeing it happen. On every station and every layer, the agent's
 * activity must be visible in real time: what it is doing right now, what it
 * just finished, what it is about to do."*
 *
 * ── WHAT THE RUN SCREEN COULD SAY BEFORE THIS ─────────────────────────────
 * "Draft is working", and a clock. That is the entire granularity a person
 * watching their own run was given. The transcript reads `agent_runs` -- one
 * row per SEAT'S TURN -- so between a station starting and finishing there was
 * exactly one row, holding for as long as the model took. Minutes of a single
 * unchanging line on the surface whose whole claim is that you can watch.
 *
 * ── EVERY PIECE OF THIS ALREADY EXISTED AND NONE OF IT WAS CONNECTED ──────
 * That is the finding, and it is this repo's most repeated shape.
 *
 *   `tool_calls`      2,714 rows in production, 2,431 in the last fortnight.
 *                     Live, written by every agent, read by no surface a
 *                     customer can reach.
 *   `agent_runs.trace_id`  the join. Added 2026-08-26 (F-93). Measured
 *                     2026-09-01: 108 of 108 runs since 08-31 carry one --
 *                     100% coverage going forward.
 *   `VERB_BY_TOOL`    27 curated first-person verbs -- "writing the spec",
 *                     "reading the repository", "recording the decision and
 *                     its forecast". Built for this and reached by nothing:
 *                     `PresenceInput.currentTool` was never once passed on
 *                     this surface, so the character always said the generic
 *                     "I'm on it."
 *   `ToolStream`      a finished component with auto-follow, an unseen-count,
 *                     and latency formatting corrected against real data.
 *                     Mounted on `/runs/$missionId` and the design gallery,
 *                     never on the run screen.
 *
 * So this composes and does not build. The only new thing is the read.
 *
 * ── AN EMPTY LIST IS THREE DIFFERENT FACTS ────────────────────────────────
 * This is the part that decides whether the surface is honest.
 *
 *   traced && calls && running   it is working and here is what it is doing
 *   traced && no calls && running  it has started and called nothing YET
 *   traced && no calls && settled  it genuinely called nothing
 *   NOT traced                   its runs predate the record, so nobody
 *                                wrote down what it did
 *
 * The last one is the trap. Those runs DID call tools; the column that would
 * let us name them did not exist yet. Rendering that as "called nothing" tells
 * a person their agents sat idle, which is the opposite of true, and it is
 * exactly the substitution that twice produced a wrong finding internally
 * before the join existed. It gets its own sentence.
 */
export function LiveWork({ trackId, running }: { trackId: string; running: boolean }) {
  const fetchCalls = useServerFn(getTrackToolCalls);

  const q = useQuery({
    queryKey: ["track-tool-calls", trackId],
    queryFn: () => fetchCalls({ data: { trackId } }),
    /*
     * THE SAME TWO SPEEDS THE TRANSCRIPT ALREADY RUNS AT, deliberately, so the
     * two panes on one screen cannot disagree about whether something just
     * happened. `TrackActivity` polls 500ms while a run row says running and
     * 10s otherwise; a third cadence here would produce the drift this file's
     * neighbours have been repaired for twice -- one pane announcing a tool
     * call while the other still shows the previous station.
     */
    refetchInterval: running ? 500 : 10_000,
  });

  const rows = React.useMemo<ToolStreamRow[]>(
    () =>
      (q.data?.calls ?? []).map((c) => ({
        id: c.id,
        tool: c.tool,
        at: Date.parse(c.at),
        state: c.ok ? "done" : "failed",
        /* `latency_ms` is what the loop measured, so it is reported and never
           estimated. ToolStream drops a 0 rather than printing "0s", because 0
           means "inside the clock's resolution" and not "instant". */
        durationMs: c.latencyMs > 0 ? c.latencyMs : undefined,
        error: c.error ?? undefined,
      })),
    [q.data],
  );

  if (q.isError) {
    return (
      <ReadFailedLine error={q.error} onRetry={() => void q.refetch()}>
        What the agents called could not be read. The run itself is untouched and still doing
        whatever it was.
      </ReadFailedLine>
    );
  }

  /*
   * NOT TRACED IS NOT EMPTY, and this is the sentence that keeps the surface
   * honest about its own history. Drawn only once the read has answered, so a
   * page that is still loading never claims a run predates anything.
   */
  if (q.data && !q.data.traced) {
    return (
      <NothingYet>
        {q.data.runs > 0
          ? "This run is older than the record of what agents call, so what it did was not written down. Newer runs show every call here as it happens."
          : "No agent has taken a turn on this work yet."}
      </NothingYet>
    );
  }

  return <ToolStream rows={rows} working={running} label="What the agents are calling" />;
}

/**
 * The newest tool an agent on this track has called, or null.
 *
 * ── WHY A SEPARATE HOOK RATHER THAN A PROP OUT OF THE COMPONENT ───────────
 * The character sits at the TOP of the left pane and the stream sits in the
 * right one, so there is no parent that owns both without lifting state
 * through the whole surface. They share a react-query KEY instead, which is
 * the pattern this file's neighbours already use for exactly this
 * ("one fact about one run must not have two freshnesses"): the same cache
 * entry, the same beat, one request.
 *
 * ONLY WHILE RUNNING. A settled run's last tool call is a fact about the past,
 * and feeding it to the character would have Supa announce "I'm reading the
 * repository" about something it finished yesterday. `verbForTool` is present
 * tense, so its input has to be too.
 */
export function useCurrentTool(trackId: string, running: boolean): string | null {
  const fetchCalls = useServerFn(getTrackToolCalls);
  const q = useQuery({
    queryKey: ["track-tool-calls", trackId],
    queryFn: () => fetchCalls({ data: { trackId } }),
    refetchInterval: running ? 500 : 10_000,
  });
  if (!running) return null;
  const calls = q.data?.calls ?? [];
  return calls.length > 0 ? (calls[calls.length - 1]?.tool ?? null) : null;
}
