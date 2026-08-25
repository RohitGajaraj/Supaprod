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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { TrackChain } from "@/components/spine/TrackChain";
import { TrackActivity } from "@/components/spine/TrackActivity";
import { ArtifactPane } from "@/components/track/ArtifactPane";
import { TrackConsent } from "@/components/track/TrackConsent";
import { Action, Region } from "@/components/meridian/surface-parts";
import { Row } from "@/components/meridian/rows";
import { StatusChip } from "@/components/meridian/StatusChip";
import { Receipt } from "@/components/meridian/Receipt";
import {
  driveTrackNow,
  getTrack,
  retryStation,
  type DriveNowResult,
} from "@/lib/spine/track.functions";
import { AGENT_STATIONS } from "@/lib/agent-vocabulary";
import { holdTone } from "@/lib/spine/driver";
import { relativeTime } from "@/lib/memory-view";

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
  const fetchTrack = useServerFn(getTrack);
  const fRetry = useServerFn(retryStation);
  const qc = useQueryClient();
  /*
   * THE RECORD AND THE PANE SHARE ONE POINTER. Clicking a thing in the record
   * (TrackChain) reveals the thing itself (the pane) -- item 7's door. Held
   * here because the two surfaces are siblings, and a pointer living in one of
   * them would make the other unreachable.
   */
  const [paneStation, setPaneStation] = React.useState<string | null>(null);

  /*
   * THE TRACK ITSELF, not only the walk's receipts. `getTrack` existed with
   * zero callers while 57 of 59 production tracks carried a hold reason this
   * surface never read, so a run that stopped sat here looking identical to one
   * that was simply slow. Polled on the same ten-second beat as the transcript
   * below: when the sweep or another tab clears a hold, the reason leaves this
   * screen without a refresh.
   */
  const trackQ = useQuery({
    queryKey: ["spine-track", trackId],
    queryFn: () => fetchTrack({ data: { trackId } }),
    refetchInterval: 10_000,
  });
  const track = trackQ.data ?? null;
  /** What a release did, rendered as a Receipt and cleared by nothing else. */
  const [releaseNote, setReleaseNote] = React.useState<{
    verb: string;
    consequence: string;
    failed?: boolean;
  } | null>(null);

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
      void qc.invalidateQueries({ queryKey: ["spine-track", trackId] });
      // A walk that opens a gate must make the question appear in the same
      // tick the drive result does (SPEC-CONSENT §1.4).
      void qc.invalidateQueries({ queryKey: ["track-gates", trackId] });
    },
  });

  /*
   * RELEASE THE STATION THAT STOPPED, without skipping it.
   *
   * The server refuses honestly on anything it will not do (not held, closed,
   * workspace paused), so the control is offered wherever there is a hold at
   * all -- except `waiting-on-a-person`, where releasing buys nothing: the
   * pending call stays queued and the driver holds again at the gate. There the
   * unblock IS the call, so the row says that instead of carrying a button.
   */
  const release = useMutation({
    mutationFn: () => fRetry({ data: { trackId } }),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ["spine-track", trackId] });
      void qc.invalidateQueries({ queryKey: ["spine-tracks"] });
      if (res.refused) {
        setReleaseNote({ verb: "Nothing was released", consequence: res.refused, failed: true });
        return;
      }
      setReleaseNote({
        verb: "You released it",
        consequence:
          "The station runs again on its next turn. Press Run it now to walk it immediately.",
      });
    },
    onError: (e: Error) =>
      setReleaseNote({
        verb: "Nothing was released",
        consequence: e.message,
        failed: true,
      }),
  });

  const result = run.data as DriveNowResult | undefined;

  /*
   * WHY IT STOPPED, in the driver's own words.
   *
   * `hold` is the sentence built from the raw reason by `holdLine`, which names
   * the station where the reason is about one; `holdTone` reads the RAW reason,
   * never the prose, because branching on wording is how every hold once painted
   * amber. `waiting-on-a-person` gets no retry control on purpose -- answering
   * the call is the move -- and every other hold does, because eleven of these
   * reasons clear from outside the product (a source connected, an account topped
   * up, a spec written) and the driver never looks again until someone says so.
   */
  const tone = track ? holdTone(track.holdReason) : null;
  const held = track?.status === "open" && tone !== null;
  const answerTheCall = track?.holdReason === "waiting-on-a-person";
  const nowMs = Date.now();

  return (
    <div className="flex flex-col gap-mrd-6">
      {/*
       * THE QUESTION, ABOVE EVERYTHING. When the run needs a person it asks
       * here, in place, with the consequence named (R-04) -- not in a queue
       * somebody has to remember to visit. `onAnswered` hands the parent's
       * drive mutation down, so an answer that releases the run picks the work
       * straight back up; that chain IS the item, and a card without it is the
       * approvals queue again.
       */}
      <TrackConsent trackId={trackId} onAnswered={() => run.mutate()} />

      {held && track ? (
        <Region title="Why it stopped" sub="This work is not moving until this clears.">
          <div className="flex flex-col gap-mrd-4">
            <Row
              lead={track.hold ?? undefined}
              sub={
                track.drivenAt
                  ? `It last moved ${relativeTime(track.drivenAt, nowMs)}.`
                  : "It has never been driven."
              }
              action={
                <StatusChip status={tone} pulse={tone === "you"}>
                  {tone === "you" ? "Waiting on you" : "On hold"}
                </StatusChip>
              }
            />
            {answerTheCall ? null : (
              <div>
                <Action busy={release.isPending} onClick={() => release.mutate()}>
                  {release.isPending
                    ? "Releasing it"
                    : `Let ${AGENT_STATIONS[track.station].name} try again`}
                </Action>
              </div>
            )}
          </div>
        </Region>
      ) : null}

      {/*
       * OUTSIDE THE REGION ON PURPOSE. A successful release clears the hold,
       * the region above unmounts on the refetch, and a receipt living inside
       * it would vanish in the same breath as the click. Here it survives long
       * enough to be read, and sits where the region was.
       */}
      {releaseNote ? (
        <Receipt
          verb={releaseNote.verb}
          consequence={releaseNote.consequence}
          failed={releaseNote.failed}
        />
      ) : null}

      {/*
       * THE PREVIEW PANE, above the control that moves the work. The ruling
       * puts the thing being made where the eye lands and the transcript
       * beside it (DESIGN-DIRECTION §1); until the two-column frame lands this
       * single column leads with what the work has made.
       */}
      <ArtifactPane trackId={trackId} active={paneStation} onActiveChange={setPaneStation} />

      <Region
        title="Run it"
        sub="Walks this work through its route now, station by station, and stops the moment something needs you."
      >
        <Action variant="primary" busy={run.isPending} onClick={() => run.mutate()}>
          {run.isPending ? "Walking the route" : "Run it now"}
        </Action>

        {run.isError ? <Row lead="The walk could not start. Nothing was moved." /> : null}

        {/*
         * THE WALK RESULT IS A LIVE REGION. These rows do not exist until a
         * mutation that can run for fifty seconds returns, which is the exact
         * case a polite status region exists for: the person pressed a button,
         * and what came back -- including "it stopped and is waiting on
         * something" -- is said, not shown only.
         */}
        {result ? (
          <div role="status" aria-live="polite">
            <Row
              lead={STOPPED_LINE[result.stopped]}
              sub={result.more ? "Run it again to continue." : undefined}
            />
            {/*
             * EVERY SEAT, INCLUDING THE ONES THAT FILED NOTHING. A seat that
             * produced no artifact is a real event and the most useful one to
             * see, because it is where a route quietly stops paying off.
             */}
            {result.steps.map((step, i) => (
              <Row
                key={`${step.station ?? "none"}-${i}`}
                lead={step.line}
                sub={
                  step.produced > 0
                    ? `Filed ${step.produced} ${step.produced === 1 ? "thing" : "things"}.`
                    : undefined
                }
              />
            ))}
          </div>
        ) : null}
      </Region>

      <TrackChain trackId={trackId} onOpenStation={setPaneStation} />
      <TrackActivity trackId={trackId} />
    </div>
  );
}

export default TrackRun;
