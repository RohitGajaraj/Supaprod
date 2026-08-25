/**
 * Who is working on this right now, who worked on it before, and what came out.
 *
 * FOUNDER RULING 2026-08-01: "if some agents are working, there should be some
 * scope for showing visually that this agent is what, after this particular agent
 * it switched to next agent, this is the outcome. Something like Claude Code or
 * Copilot or Codex... so the user knows what is happening."
 *
 * THE REFERENCE, named before building. Claude Code's transcript: a flat
 * chronological stream, one actor per entry, each stamped with what it touched
 * and what came back. No progress bar, no percentage, no spinner with a noun
 * attached. What is borrowed is the INFORMATION MODEL, not the chrome:
 *
 *   who acted  ->  what they did  ->  what you now have
 *
 * WHAT IS ADDED, because this product has stations and Claude Code does not:
 * the HANDOFF. The moment one agent finishes and the next picks the work up is
 * the product's entire claim, and until now it happened silently in a cron.
 *
 * IT NEVER INVENTS A STATUS. Every line is derived from a row the run wrote
 * itself. "Working" is only said when the run row literally says `running`, and
 * a turn that filed nothing says so plainly rather than being dressed up as
 * progress.
 *
 * DRAWN IN THE ONE RUN VOCABULARY (2026-08-25, item 11). `run-rows.tsx` was
 * ported from beautifui.dev and reached by nothing while three surfaces drew
 * three transcripts; this now composes it -- glyph, rail, subject, clock --
 * so one rhythm carries every run view. Motion follows R-20 §4: an arrival
 * animates ONCE on `--mrd-d-enter`, nothing else moves, and every duration on
 * this file is a token. A live turn's elapsed figure ticks through
 * `useElapsed` with the WORK's start time, never the component's.
 */
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getTrackActivity } from "@/lib/spine/track.functions";
import { countKinds, type Turn } from "@/lib/spine/activity";
import { mergeActivityRows } from "@/components/spine/activity-rows";
import type { AgentStation } from "@/lib/agent-vocabulary";
import { GLYPH_FOR_STATION, type StationGlyphKind } from "@/components/meridian/station-glyphs";
import {
  RUN_LINE,
  RUN_ROW,
  RUN_STACK,
  RunClock,
  RunGlyph,
  RunMeta,
  RunNote,
  RunRail,
  RunSubject,
  RunTook,
} from "@/components/meridian/run-rows";
import { StatusChip } from "@/components/meridian/StatusChip";
import { useElapsed } from "@/components/meridian/use-elapsed";
import { Reading, ReadFailedLine, RecordSpeaks } from "@/components/meridian/surface-parts";

/** One map, so a station's slug and its drawing cannot disagree. */
function glyphForStation(s: AgentStation | null): StationGlyphKind | undefined {
  return s ? GLYPH_FOR_STATION[s] : undefined;
}

/** How a finished turn reads, in verbs rather than status words. */
function headline(t: Turn): string {
  if (t.outcome === "working") return `${t.agentName} is working`;
  if (t.outcome === "waiting") return `${t.agentName} is queued`;
  if (t.made.length) return `${t.agentName} filed ${countKinds(t.made)}`;
  if (t.outcome === "stopped") return `${t.agentName} stopped, filing nothing`;
  return `${t.agentName} finished, filing nothing`;
}

/*
 * A chip only where there is something to say. Most rows of a healthy run are
 * done, and a column of chips saying so buries the one row that is not -- the
 * same argument ToolStream states for its own stream. Green is never used for
 * "still working": azure (`agent`) is the only tone that means now.
 */
function chipOf(t: Turn) {
  if (t.outcome === "working")
    return (
      <StatusChip status="agent" pulse>
        Working
      </StatusChip>
    );
  if (t.outcome === "waiting") return <StatusChip status="hold">Queued</StatusChip>;
  if (t.outcome === "stopped") return <StatusChip status="fail">Stopped</StatusChip>;
  return null;
}

/** The live turn's age, ticking. Reports the WORK, not the component. */
function LiveTook({ startedAt }: { startedAt: number }) {
  const elapsed = useElapsed(startedAt);
  return <RunTook>{elapsed}</RunTook>;
}

export function TrackActivity({ trackId }: { trackId: string }) {
  const fetchActivity = useServerFn(getTrackActivity);
  const q = useQuery({
    queryKey: ["track-activity", trackId],
    queryFn: () => fetchActivity({ data: { trackId } }),
    // A live view has to move on its own, or a person watching a run has to
    // guess whether nothing has happened or nothing is being fetched. Ten
    // seconds is under the driver's tick and cheap: two indexed reads.
    refetchInterval: 10_000,
  });

  /*
   * ARRIVALS ANIMATE, THE FIRST PAINT DOES NOT. Every run id present when the
   * first page of data lands goes into `seen` un-animated: a transcript of
   * twenty rows playing one entrance is noise, not movement. An id that shows
   * up on a LATER poll was not on screen before -- that is an event, and it
   * gets the entrance once, then joins `seen`.
   */
  const seen = React.useRef<Set<string>>(new Set());
  const primed = React.useRef(false);
  const rows = React.useMemo(
    () => mergeActivityRows(q.data?.turns ?? [], q.data?.transitions ?? []),
    [q.data],
  );
  React.useEffect(() => {
    if (!q.data) return;
    if (!primed.current) {
      for (const r of rows) seen.current.add(r.key);
      primed.current = true;
      return;
    }
    const keys = rows.map((r) => r.key);
    const timer = window.setTimeout(() => {
      for (const k of keys) seen.current.add(k);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [q.data, rows]);

  if (q.isLoading) return <Reading>Reading what happened.</Reading>;
  if (q.isError)
    return (
      // The LINE half of the failed-read pair, not the boxed one: this renders
      // inside a region that already draws its own container, and the standard
      // caps a region at one bordered box.
      <ReadFailedLine>
        The activity did not come back, so nothing here would be trustworthy.
      </ReadFailedLine>
    );

  const turns = q.data?.turns ?? [];
  // NOT "no agent has worked on this yet", which is a claim this cannot support.
  // Runs only carry a track from the day `track_id` was added, so work done
  // before that is real and unlinked, and saying it never happened would be
  // exactly the invention this view exists to refuse. Deliberately silent on the
  // reason: an unlinked history and a genuinely new track are indistinguishable
  // here, and a made-up reason is worse than a plain absence.
  if (!turns.length) {
    return (
      <RecordSpeaks>
        Nothing is recorded against this work yet. Activity appears here as agents run.
      </RecordSpeaks>
    );
  }

  // Newest first, turns and station moves in one stream: a marker sits
  // between the rows it belongs between (activity-rows.ts).
  const last = rows.length - 1;

  return (
    /*
     * THE TRANSCRIPT IS A LOG, and that is a role rather than a decoration.
     * This file polls every ten seconds, so without it every arrival was silent
     * to a screen reader. `role="log"` announces ADDITIONS only, so a
     * transcript that grows long does not read the whole column out each time
     * one entry lands.
     */
    <div role="log" aria-label="What the agents did, newest first">
      <ol className={RUN_STACK}>
        {rows.map((row, i) => {
          if (row.kind === "move") {
            // WHO CAUSED THIS LEG (queue 65). press names the person, sweep
            // names the loop, continuation says it carried on alone. Rows
            // with no provable driver never reach this list at all.
            const arrived = primed.current && !seen.current.has(row.key);
            return (
              <li
                key={row.key}
                className={RUN_ROW}
                style={
                  arrived
                    ? { animation: "mrd-fade-up var(--mrd-d-enter) var(--mrd-ease) both" }
                    : undefined
                }
              >
                <RunClock at={row.at} />
                <span className="flex flex-col items-center self-stretch">
                  <RunGlyph kind="station" station={glyphForStation(row.to as AgentStation)} />
                  {i === last ? null : <RunRail />}
                </span>
                <span className="min-w-0 pb-1">
                  <span className={RUN_LINE}>
                    <RunSubject>{`Moved to ${row.toName}`}</RunSubject>
                  </span>
                  <RunMeta>{row.line}</RunMeta>
                </span>
              </li>
            );
          }

          const t = row.turn;
          // The handoff. Marked when the station changes from the TURN that ran
          // before this one -- skipping move markers, which are not seats.
          let previous: Turn | undefined;
          for (let j = i + 1; j < rows.length; j++) {
            const r = rows[j];
            if (r.kind === "turn") {
              previous = r.turn;
              break;
            }
          }
          const handedOver =
            Boolean(t.stationName) && previous != null && previous.stationName !== t.stationName;

          const arrived = primed.current && !seen.current.has(row.key);

          return (
            <li
              key={row.key}
              className={RUN_ROW}
              style={
                arrived
                  ? { animation: "mrd-fade-up var(--mrd-d-enter) var(--mrd-ease) both" }
                  : undefined
              }
            >
              <RunClock at={Date.parse(t.at)} />

              {/* The rail stops on the last row of the STREAM, not of this
                  render pass: a line continuing past the newest entry claims
                  another one is already coming. */}
              <span className="flex flex-col items-center self-stretch">
                <RunGlyph
                  kind={handedOver ? "handoff" : "station"}
                  station={handedOver ? undefined : glyphForStation(t.station)}
                />
                {i === last ? null : <RunRail />}
              </span>

              <span className="min-w-0 pb-1">
                <span className={RUN_LINE}>
                  <RunSubject>{headline(t)}</RunSubject>
                  {chipOf(t)}
                  {t.outcome === "working" ? <LiveTook startedAt={Date.parse(t.at)} /> : null}
                </span>

                <RunMeta>
                  {[
                    handedOver && previous?.stationName
                      ? `picked up from ${previous.stationName}`
                      : t.stationName,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </RunMeta>

                {/* The agent's own last line, trimmed and never rewritten. One
                    line is enough to tell whether it understood the job; the
                    full text lives on the run. Wraps rather than truncates:
                    half a reason is worse than a wrapped one. */}
                {t.said ? (
                  <RunNote>{t.said.length > 160 ? `${t.said.slice(0, 160)}...` : t.said}</RunNote>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
