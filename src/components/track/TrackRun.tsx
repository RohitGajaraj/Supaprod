/**
 * ONE PIECE OF WORK, WALKING ITS SEVEN STATIONS, WHILE YOU WATCH.
 *
 * WHY THIS FILE EXISTS, and it is not because anything here was missing.
 * `TrackChain` and `TrackActivity` were both built on 2026-08-01 and both had
 * ZERO importers until this file. `TrackActivity`'s own header quotes the
 * founder ruling it was built to answer:
 *
 *   "if some agents are working, there should be some scope for showing
 *    visually that this agent is what, after this particular agent it switched
 *    to next agent, this is the outcome. Something like Claude Code or Copilot
 *    or Codex... so the user knows what is happening."
 *
 * That was asked for on 2026-08-01, built the same day, and mounted nowhere. It
 * was asked for again on 2026-08-25, by which point nobody remembered it
 * existed. `TrackChain`'s header calls itself "THE DOOR THAT WAS MISSING" and
 * then had no door of its own, which is the joke this repo keeps telling: the
 * engine ships, the door does not, and the request comes back around.
 *
 * SO THIS COMPOSES, IT DOES NOT BUILD. Every part below already existed. The
 * only new thing in the whole surface is the control, and the control is the
 * point: until `driveTrackNow` there was no way for a person to make their own
 * work move at all. `driveTrackOnce` had one caller, a cron, which drove five
 * tracks in twenty-four hours. 58 tracks have entered at `sense` and not one
 * has ever reached `learn`.
 *
 * THE TWO PANELS ANSWER DIFFERENT QUESTIONS and that is why both are here.
 * `TrackChain` is the ROUTE: where this work sits and what each station
 * produced, including the stations that make nothing, so a walk that passed
 * straight through does not read as a skip. `TrackActivity` is the TRANSCRIPT:
 * who acted, what they did, what you now have, and the handoff where one agent
 * gives the work to the next. The handoff is the product's entire claim and it
 * used to happen silently inside a cron.
 *
 * IT NEVER INVENTS A STATUS. Both panels derive every line from a row the run
 * itself wrote, and the drive result below reports the bound it actually hit
 * rather than a cheerful summary. A person has to be able to tell facts from
 * guesses, and a status display that guesses removes that ability entirely.
 */
import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { TrackChain } from "@/components/spine/TrackChain";
import { TrackActivity } from "@/components/spine/TrackActivity";
import { Action, Region } from "@/components/meridian/surface-parts";
import { Row, Line } from "@/components/meridian/rows";
import { driveTrackNow, type DriveNowResult } from "@/lib/spine/track.functions";

/**
 * What the walk did, said plainly.
 *
 * ONE SENTENCE PER BOUND, and `finished` is the only one that means the journey
 * is complete. The others are all real states a person may need to act on, so
 * none of them is dressed up as progress.
 */
const STOPPED_LINE: Record<DriveNowResult["stopped"], string> = {
  finished: "It reached the end of its route.",
  held: "It stopped and is waiting on something.",
  stalled: "It could not move any further.",
  "out-of-window": "It ran out of this turn's time and has more to walk.",
  "not-found": "That track could not be read.",
};

export function TrackRun({ trackId }: { trackId: string }) {
  const drive = useServerFn(driveTrackNow);
  const qc = useQueryClient();

  const run = useMutation({
    mutationFn: () => drive({ data: { trackId } }),
    /*
     * Both panels read their own tables, so the walk's writes are invisible to
     * them until their queries are told. `TrackActivity` polls every ten
     * seconds on its own and would catch up eventually; invalidating here is
     * what makes the last station appear the moment the walk returns rather
     * than up to ten seconds later, which is the difference between watching
     * something happen and reading that it did.
     */
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["track-activity", trackId] });
      void qc.invalidateQueries({ queryKey: ["spine-track-chain", trackId] });
    },
  });

  const result = run.data as DriveNowResult | undefined;

  return (
    <div className="flex flex-col gap-mrd-6">
      <Region
        title="Run it"
        sub="Walks this work through its route now, station by station, and stops the moment something needs you."
      >
        <Action variant="primary" busy={run.isPending} onClick={() => run.mutate()}>
          {run.isPending ? "Walking the route" : "Run it now"}
        </Action>

        {run.isError ? (
          <Row>
            <Line>The walk could not start. Nothing was moved.</Line>
          </Row>
        ) : null}

        {result ? (
          <>
            <Row>
              <Line>
                {STOPPED_LINE[result.stopped]}
                {result.more ? " Run it again to continue." : ""}
              </Line>
            </Row>
            {/*
             * EVERY SEAT, INCLUDING THE ONES THAT FILED NOTHING. A seat that
             * produced no artifact is a real event and the most useful one to
             * see, because it is where a route quietly stops paying off.
             */}
            {result.steps.map((step, i) => (
              <Row key={`${step.station ?? "none"}-${i}`}>
                <Line>
                  {step.line}
                  {step.produced > 0
                    ? ` It filed ${step.produced} ${step.produced === 1 ? "thing" : "things"}.`
                    : ""}
                </Line>
              </Row>
            ))}
          </>
        ) : null}
      </Region>

      <TrackChain trackId={trackId} />
      <TrackActivity trackId={trackId} />
    </div>
  );
}

export default TrackRun;
