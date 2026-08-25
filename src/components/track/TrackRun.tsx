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
import { Character } from "@/components/presence/Character";
import { ArtifactPane } from "@/components/track/ArtifactPane";
import { TrackConsent } from "@/components/track/TrackConsent";
import { Action, Region } from "@/components/meridian/surface-parts";
import { Row } from "@/components/meridian/rows";
import { StatusChip } from "@/components/meridian/StatusChip";
import { Receipt } from "@/components/meridian/Receipt";
import {
  driveTrackNow,
  getTrack,
  getTrackChain,
  getTrackArtifacts,
  retryStation,
  type DriveNowResult,
} from "@/lib/spine/track.functions";
import { AGENT_STATIONS } from "@/lib/agent-vocabulary";
import { holdTone } from "@/lib/spine/driver";
import { relativeTime } from "@/lib/memory-view";
import { summaryText } from "@/components/track/run-summary";
import { triesLine } from "@/components/track/hold-tries";

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

/** What a run says when it is handed to somebody, in words a PR thread can read. */
export /*
 * ITEM 24: THE RUN CAN BE HANDED TO SOMEBODY. The record of this work is the
 * thing you most want in front of a reviewer, and until now the only way to
 * share it was a link with no context or a screenshot of a table. The text is
 * built from rows the run wrote -- route, states, filed nouns, the hold
 * sentence -- never a JSON dump; the control SAYS what it copied; and it is a
 * real button, so the keyboard reaches it and the live region announces it.
 */
function CopyRunSummary({ trackId }: { trackId: string }) {
  const fChain = useServerFn(getTrackChain);
  const chain = useQuery({
    queryKey: ["spine-track-chain", trackId],
    queryFn: () => fChain({ data: { trackId } }),
    // Same cache entry the pane polls; no second fetch, no extra poll.
    staleTime: 10_000,
  });
  const [copied, setCopied] = React.useState<string | null>(null);

  const copy = async () => {
    const data = chain.data;
    if (!data?.track || !data.chain) {
      setCopied(null);
      return;
    }
    const now = Date.now();
    const stops = data.chain.stops.map((s) => ({
      label: s.label,
      state: s.state,
      nouns: s.members.map((m) => `${m.missing ? "gone: " : ""}${m.title ?? m.word}`),
    }));
    const text = summaryText({
      title: data.track.title,
      stationName:
        AGENT_STATIONS[data.track.station]?.name ?? String(data.track.station ?? "unknown"),
      hold: data.track.hold,
      stops,
      url: `${window.location.origin}/track/${trackId}`,
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopied("Copied. Paste it wherever the review happens.");
    } catch {
      setCopied("The copy did not go through, so nothing is on the clipboard.");
    }
  };

  return (
    <div className="flex flex-col gap-mrd-2">
      <div>
        <Action variant="quiet" busy={chain.isLoading} onClick={() => void copy()}>
          Copy a summary of this run
        </Action>
      </div>
      {copied ? (
        <p role="status" aria-live="polite" className="mrd-meta">
          {copied}
        </p>
      ) : null}
    </div>
  );
}

/*
 * THE SPLIT (request 024 / SPEC-LAYOUT §0, executed by LANE 1 under the
 * founder's parallel order). One column cannot be two panes, so the body is
 * two exported pieces:
 *
 *   `TrackRunLeft`  -- the character, the consent card, holds and their
 *                      release, the run-it control with its automatic legs,
 *                      and the transcript. Owns every piece of walk state.
 *   `TrackPaneRight` -- the artifact pane and the record beside it, sharing
 *                      the pane-station pointer between themselves (item 7).
 *
 * `TrackRun` composes both for any caller that still wants today's stacked
 * column -- behaviour-preserving for `/plan`'s inline reveal and any other
 * mount, with one documented delta: the run-it control now sits above the
 * artifact pane instead of below it, because the control belongs to the
 * transcript pane and the artifact leads its own.
 */
export function TrackRunLeft({
  trackId,
  autoStart = false,
}: {
  trackId: string;
  /**
   * Start walking the moment the page opens, with no click (queue item 28).
   * FIRES ONCE PER MOUNT and ONLY on work that has never been driven
   * (`drivenAt === null`) -- revisiting a finished or in-flight run must never
   * re-spend money on work somebody is only looking at. The route may pass the
   * flag; the ROUTE must not call the walk itself: two writers on one walk
   * double-spend, so the mutation stays behind this component's control.
   */
  autoStart?: boolean;
}) {
  const drive = useServerFn(driveTrackNow);
  const fetchTrack = useServerFn(getTrack);
  const fRetry = useServerFn(retryStation);
  const qc = useQueryClient();
  /*
   * (The pane-station pointer moved into TrackPaneRight below -- it is only
   * read by the artifact pane and the record, which both live there now.)
   */

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

  const fArtifacts = useServerFn(getTrackArtifacts);
  const artifactsQ = useQuery({
    queryKey: ["spine-track-artifacts", trackId],
    queryFn: () => fArtifacts({ data: { trackId } }),
    staleTime: 10_000,
    enabled: !!track,
  });

  /** What a release did, rendered as a Receipt and cleared by nothing else. */
  const [releaseNote, setReleaseNote] = React.useState<{
    verb: string;
    consequence: string;
    failed?: boolean;
  } | null>(null);

  const run = useMutation({
    /*
     * Queue 64. Every caller says whether a PERSON caused this leg (`press`:
     * the composer landing, the Run control, a gate being answered) or the
     * client is walking on from a window-closed leg of that press
     * (`continuation`). Required by the server fn, so a new call site cannot
     * quietly write a row the record later has to distrust.
     */
    mutationFn: (origin: "press" | "continuation") => drive({ data: { trackId, origin } }),
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
   * THE AUTO-START, AND ITS ONE GUARD THAT IS THE WHOLE POINT. Fires at most
   * once per mount, and only when the track has never been driven: a person
   * landing from the composer watches work begin with no click, while a person
   * reopening a finished run reads it instead of re-spending on it.
   */
  const autoStartedRef = React.useRef(false);
  React.useEffect(() => {
    if (!autoStart || autoStartedRef.current) return;
    if (trackQ.isLoading || !track) return;
    if (track.drivenAt !== null) return;
    autoStartedRef.current = true;
    setLegsLeft(AUTO_MAX);
    // `press`: the person's act was submitting the composer; landing here is
    // that press arriving, not the client deciding anything on its own.
    run.mutate("press");
  }, [autoStart, track, trackQ.isLoading, run]);

  /*
   * THE WALK CONTINUES ITSELF, WITHIN STATED BOUNDS (queue item 34).
   *
   * One foreground call is a 50-second window, which bought about two stations;
   * a seven-station route needed ten presses, and a run that needs ten nudges
   * is a run a human is touching mid-run -- acceptance criterion 2 failed by
   * arithmetic. So one press now buys the whole route: while the walk came back
   * ONLY because its window closed (`out-of-window` with `more`), the next leg
   * starts itself.
   *
   * THE GUARDS ARE THE FEATURE. It never continues past `held`, `stalled` or
   * `finished`: a hold is exactly where a person IS wanted, and auto-continuing
   * past one would be the product deciding on somebody's behalf. The legs are
   * capped at AUTO_MAX so a pathological route cannot spend silently forever --
   * when the cap lands with route still ahead, that number is SAID and the
   * control returns to the person. And "Stop" cancels the remaining legs at any
   * moment, which makes the walking theirs rather than automatic.
   */
  const AUTO_MAX = 24;
  const [legsLeft, setLegsLeft] = React.useState(0);

  React.useEffect(() => {
    if (!result || run.isPending) return;
    const canContinue = result.stopped === "out-of-window" && result.more && legsLeft > 0;
    if (!canContinue) return;
    const t = window.setTimeout(() => {
      setLegsLeft((n) => n - 1);
      run.mutate("continuation");
    }, 500);
    return () => window.clearTimeout(t);
    // `result` changes identity on every settle, which is what walks the chain
    // of legs; `isPending` guards against firing while a leg is in flight.
  }, [result, run, legsLeft]);

  /** True while this press still has automatic legs and the route is not done. */
  const continuing =
    legsLeft > 0 && Boolean(result) && result?.stopped === "out-of-window" && result.more === true;
  const capReached =
    Boolean(result) &&
    result?.stopped === "out-of-window" &&
    result.more === true &&
    legsLeft === 0;

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

  // QUEUE 67: Calm hold tone for "needs-evidence" when forecast not yet due.
  // Extract the forecast_horizon_date from the decision artifact.
  const forecastHorizonDate = React.useMemo(() => {
    if (!artifactsQ.data?.stops) return null;
    for (const stop of artifactsQ.data.stops) {
      if (stop.station === "decide") {
        for (const item of stop.items) {
          if (
            item.kind === "decision" &&
            item.fields &&
            typeof item.fields === "object" &&
            "forecast_horizon_date" in item.fields
          ) {
            return item.fields.forecast_horizon_date as string | null;
          }
        }
      }
    }
    return null;
  }, [artifactsQ.data?.stops]);

  // Check if this is a calm hold: needs-evidence at learn with future horizon.
  const isCalmHold = React.useMemo(() => {
    if (
      track?.holdReason === "needs-evidence" &&
      track.station === "learn" &&
      forecastHorizonDate
    ) {
      const horizonDate = new Date(forecastHorizonDate);
      return horizonDate > new Date(nowMs);
    }
    return false;
  }, [track?.holdReason, track?.station, forecastHorizonDate, nowMs]);

  /*
   * OUT-OF-TIME IS THE LOOP'S CLOCK, NOT A STOP (F-46/R027). While this press
   * still has automatic legs, the row may carry `out-of-time` between them --
   * and showing "Why it stopped" mid-walk reports a pause as a full stop. The
   * banner yields to the walking state and returns the moment the walk hands
   * control back for real.
   */
  const walkingMidRoute = Boolean(continuing || run.isPending);
  const showHold = held && !walkingMidRoute && !isCalmHold;
  const showCalmHold = isCalmHold && !walkingMidRoute;

  return (
    <div className="flex flex-col gap-mrd-6">
      {/*
       * THE CHARACTER, FIRST (SPEC-PRESENCE.md §Anatomy). One worker fronts
       * the crew; this block is where the person meets it. Every input below
       * is a read this surface already holds -- the track row, the newest walk
       * result, the mutation's own in-flight flag -- so the state is derived,
       * never staged. When the run asks, the consent card directly below IS
       * this character's voice; when a tool refuses, it says the door is
       * locked rather than promising a retry (R-26).
       */}
      <Character
        input={{
          track: track
            ? { status: track.status, holdReason: track.holdReason, drivenAt: track.drivenAt }
            : null,
          result: result ? { stopped: result.stopped, more: result.more } : null,
          walking: run.isPending,
          continuing,
          feedDead: trackQ.isError,
        }}
      />

      {/*
       * THE QUESTION, ABOVE EVERYTHING ELSE. When the run needs a person it
       * asks here, in place, with the consequence named (R-04) -- not in a
       * queue somebody has to remember to visit. `onAnswered` hands the
       * parent's drive mutation down, so an answer that releases the run picks
       * the work straight back up; that chain IS the item, and a card without
       * it is the approvals queue again.
       */}
      {/* Answering a gate is a person acting: `press`, never `continuation`. */}
      <TrackConsent trackId={trackId} onAnswered={() => run.mutate("press")} />

      {/*
       * PHASE 3: Current station indicator during active run.
       * Shows live which station the agent is currently at.
       */}
      {walkingMidRoute && track ? (
        <Region
          title={`At ${AGENT_STATIONS[track.station]?.name ?? track.station}`}
          sub="Watch as it moves through the route."
        >
          <Row
            lead={`Elapsed: ${track.drivenAt ? relativeTime(track.drivenAt, nowMs) : "just started"}`}
            sub={
              continuing
                ? `${legsLeft} more automatic ${legsLeft === 1 ? "leg" : "legs"} on this press`
                : undefined
            }
          />
        </Region>
      ) : null}

      {showHold && track ? (
        <Region title="Why it stopped" sub="This work is not moving until this clears.">
          <div className="flex flex-col gap-mrd-4">
            <Row
              lead={track.hold ?? undefined}
              sub={[
                track.drivenAt
                  ? `It last moved ${relativeTime(track.drivenAt, nowMs)}.`
                  : "It has never been driven.",
                // WHICH TRY THIS IS (queue 66): a person reading a hold
                // knows how close this is to stopping without SQL.
                triesLine(track.attempts, AGENT_STATIONS[track.station].name),
              ]
                .filter(Boolean)
                .join(" ")}
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

      {/* QUEUE 67: Calm hold tone when forecast not yet due. No alarm, no nudge. */}
      {showCalmHold && track && forecastHorizonDate ? (
        <Region title="Learning to come" sub="This forecast is on hold until the date arrives.">
          <div className="flex flex-col gap-mrd-4">
            <Row
              lead={`The forecast comes due ${new Date(forecastHorizonDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}; Learn returns then.`}
              sub={
                track.drivenAt
                  ? `It last moved ${relativeTime(track.drivenAt, nowMs)}.`
                  : "It has never been driven."
              }
              action={
                <StatusChip status="hold" pulse={false}>
                  Waiting for evidence
                </StatusChip>
              }
            />
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
       * THE PREVIEW PANE AND THE RECORD LIVE IN THE RIGHT PANE NOW
       * (TrackPaneRight). This column keeps the walking: character, consent,
       * holds, the control, and the transcript.
       */}

      <Region
        title="Run it"
        sub="Walks this work through its route now, station by station, and stops the moment something needs you."
      >
        {continuing ? (
          <div className="flex flex-wrap items-center gap-mrd-3">
            <Action variant="primary" busy onClick={() => undefined}>
              Walking the route
            </Action>
            {/* Stoppable at any moment: this cancels the LEGS THIS PRESS bought,
                never the leg in flight -- a server walk cannot be un-walked. */}
            <Action variant="quiet" onClick={() => setLegsLeft(0)}>
              Stop after this leg
            </Action>
          </div>
        ) : (
          <Action
            variant="primary"
            busy={run.isPending}
            onClick={() => {
              setLegsLeft(AUTO_MAX);
              run.mutate("press");
            }}
          >
            {run.isPending ? "Walking the route" : "Run it now"}
          </Action>
        )}

        {run.isError ? <Row lead="The walk could not start. Nothing was moved." /> : null}

        <CopyRunSummary trackId={trackId} />

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
              lead={
                continuing
                  ? `It is still walking. ${legsLeft} automatic ${legsLeft === 1 ? "leg" : "legs"} left on this press.`
                  : STOPPED_LINE[result.stopped]
              }
              sub={
                continuing
                  ? "Press Stop after this leg to take over."
                  : result.more && !capReached
                    ? "Run it again to continue."
                    : undefined
              }
            />
            {capReached ? (
              <Row
                tight
                lead={`It walked every automatic leg (${AUTO_MAX}) and still has route ahead.`}
                sub="Nothing was stopped silently: press Run it now to buy another set of legs."
              />
            ) : null}
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

      {/*
       * PHASE 3: Live agent visibility. Poll faster (500ms) during active run
       * so user sees progress. The isRunning flag comes from the mutation state.
       */}
      <TrackActivity trackId={trackId} isRunning={run.isPending || continuing} />
    </div>
  );
}

/*
 * THE RIGHT PANE: the thing being made, and the record beside it. The
 * pane-station pointer lives entirely in here -- it is the private wiring of
 * item 7 (a record row reveals the artifact), and no other pane reads it.
 */
export function TrackPaneRight({
  trackId,
  isRunning = false,
}: {
  trackId: string;
  isRunning?: boolean;
}) {
  const [paneStation, setPaneStation] = React.useState<string | null>(null);
  return (
    <div className="flex flex-col gap-mrd-6">
      <ArtifactPane
        trackId={trackId}
        active={paneStation}
        onActiveChange={setPaneStation}
        isRunning={isRunning}
      />
      <TrackChain trackId={trackId} onOpenStation={setPaneStation} />
    </div>
  );
}

/** Today's stacked column, composed from the two panes. Unchanged callers. */
export function TrackRun({ trackId, autoStart = false }: { trackId: string; autoStart?: boolean }) {
  // PHASE 3: Detect if a run is active by checking if TrackRunLeft has state
  // For now, we'll pass isRunning=false since we don't have that state here.
  // In a full refactor, this would come from TrackRunLeft's run state.
  return (
    <div className="flex flex-col gap-mrd-6">
      <TrackRunLeft trackId={trackId} autoStart={autoStart} />
      <TrackPaneRight trackId={trackId} isRunning={false} />
    </div>
  );
}

export default TrackRun;
