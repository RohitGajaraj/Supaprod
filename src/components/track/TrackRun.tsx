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
import { nothingIsComing } from "@/components/track/nothing-is-coming";
import { failureLine } from "@/lib/error-copy";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link, useNavigate } from "@tanstack/react-router";
import { CLAIMED_PATH_HOLD } from "@/lib/spine/a-claimed-path-is-a-wait-not-an-unstage";

import { TrackActivity } from "@/components/spine/TrackActivity";
import { RunPresence } from "@/components/presence/RunPresence";
import { useCurrentTool } from "@/components/track/LiveWork";
import { ArtifactPane } from "@/components/track/ArtifactPane";
import { TrackConsent } from "@/components/track/TrackConsent";
import { Action, Door, Region } from "@/components/meridian/surface-parts";
import { Row } from "@/components/meridian/rows";
import { StatusChip } from "@/components/meridian/StatusChip";
import { Receipt } from "@/components/meridian/Receipt";
import {
  driveTrackNow,
  getTrack,
  getTrackChain,
  getTrackArtifacts,
  retryStation,
  stopTrack,
  whoHoldsThePath,
  type DriveNowResult,
  type Track,
} from "@/lib/spine/track.functions";
import { AGENT_STATIONS } from "@/lib/agent-vocabulary";
import { holdTone } from "@/lib/spine/driver";
import { relativeTime } from "@/lib/memory-view";
import { formatDeadlineDate } from "@/components/track/expiry-deadline";
import { summaryText } from "@/components/track/run-summary";
import { runTabState } from "@/components/track/run-tab";
import { keyAction, shouldIgnoreKey } from "@/components/track/run-keys";
import { SteerComposer } from "@/components/track/SteerComposer";
import { TakeOver } from "@/components/track/TakeOver";
import { triesLine } from "@/components/track/hold-tries";
import { wayOut } from "@/components/track/way-out";
import { buildBlocked } from "@/components/track/build-precondition";
import { canDispatchToRepo } from "@/lib/new-build.functions";
import { useWorkspace } from "@/hooks/use-workspace";
import { takeOver } from "@/components/track/take-over";
import type { SpineRoute } from "@/lib/spine/route";
import { GotYou } from "@/components/meridian/got-you";
import {
  gotYouChips,
  gotYouClauses,
  gotYouLink,
  hasAnything,
  useRunTally,
} from "@/components/track/run-tally";
import { stoppedByYou } from "@/components/track/footer-mode";
import {
  waitingOnTime,
  horizonFromStops,
} from "@/components/track/a-calendar-wait-is-not-a-stoppage";
import { composerPromiseFor } from "@/components/track/one-door-for-one-state";

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
 * ── THE ROUTE HEADER IS GONE, AND THAT IS THE RULING RATHER THAN A CUT ───
 *
 * `RunRouteHeader` drew a `StepMeter` reading "Station 5 of 7", a `RunMap` of
 * the route, and a clock, at the top of the left pane. Three things were wrong
 * with it and only the third is about this pane.
 *
 * IT WAS THE THIRD STATION DISPLAY ON ONE SCREEN. The shell strip above the
 * header is a run's own seven stages and drives the artifact pane's tabs; the
 * `TrackChain` list in the right pane said the same thing a third time. A1's
 * audit counted four, including the pane's own tab row, which had already been
 * removed for this reason on 2026-09-02. One display now, and it is the strip.
 *
 * "STATION 5 OF 7" IS A POSITION, AND R-13 REFUSED POSITIONS. A route that
 * waives and reopens stations cannot honestly be drawn as a fraction, and
 * `footer-mode.ts` states the same rule for the bar under both panes: mode,
 * never position. The meter contradicted the footer on every run that had one.
 *
 * THE CLOCK SURVIVES, in the footer, where the bill is. It measured this tab's
 * own press, which is a real interval and is now one of the two figures on the
 * bar under both panes rather than a fourth thing at the top of one of them.
 */
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
  onCrewLive,
  onDriveState,
  crewLive = false,
  selectedArtifactId = null,
  onSelectArtifact,
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
  /** QUEUE 71: the transcript's answer to "is a crew here right now", lifted
   * so the composition can share it with the right pane. */
  onCrewLive?: (live: boolean) => void;
  /**
   * Whether a press in this tab has legs left to cancel, and how to cancel
   * them. Lifted because the Stop belongs in the footer under both panes
   * (THE-ONE-SCREEN:21) and this pane cannot reach it.
   */
  onDriveState?: (s: {
    /** A press in THIS tab is walking steps it bought. */
    walking: boolean;
    /** A press this tab made and has not had answered. */
    starting: boolean;
    /** A stop this tab asked for and has not had answered. */
    stopping: boolean;
    stop: () => void;
    run: () => void;
  }) => void;
  /**
   * RUN-02: the same live fact, handed BACK by the composition, so this pane's
   * own presence reads it. A run driven by the sweep while this tab was closed
   * used to render the character as "Ready when you are" above a transcript
   * that said Working -- two sentences about one moment, and the quiet one was
   * the lie.
   */
  crewLive?: boolean;
  /** The artifact the right pane is showing, so the row and chip say so. */
  selectedArtifactId?: string | null;
  /** A transcript row or one of its artifact chips was pressed. */
  onSelectArtifact?: (artifactId: string) => void;
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
    // The artifacts pane's own entry, not a second one: the pane polls this
    // read every ten seconds already, and a private key here would run the
    // same server fn twice on every track a person opens.
    queryKey: ["track-artifacts", trackId],
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
        consequence: "It runs again on its next turn. Press Run it now to walk it immediately.",
      });
    },
    onError: (e: Error) =>
      setReleaseNote({
        verb: "Nothing was released",
        consequence: failureLine("Nothing was released, so it is still held.", e),
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
  /* See the chip below, and `nothing-is-coming.ts` for why it is one predicate. */
  const terminallyStopped = nothingIsComing(track?.holdReason);
  const held = track?.status === "open" && tone !== null;
  const answerTheCall = track?.holdReason === "waiting-on-a-person";
  const nowMs = Date.now();

  // QUEUE 67: Calm hold tone for "needs-evidence" when forecast not yet due.
  // Extract the forecast_horizon_date from the decision artifact.
  /* Extracted to `a-calendar-wait-is-not-a-stoppage` so the run's FOOTER can
     read the same date. It could not before, because the footer is the route's
     and the stops are this pane's, so the card said "comes due Sat, Oct 3" and
     the bar below said "when the forecast comes due". */
  const forecastHorizonDate = React.useMemo(
    () => horizonFromStops(artifactsQ.data?.stops),
    [artifactsQ.data?.stops],
  );

  // Check if this is a calm hold: needs-evidence at learn with future horizon.
  const isCalmHold = React.useMemo(
    () =>
      /*
       * P-37. The same predicate the run's FOOTER reads, so the chip and the bar
       * cannot describe one state two ways. They were computing the same idea in
       * two places, which is how the footer came to ask two of the three things
       * this asks and to call an overdue track a calendar wait.
       *
       * `forecastHorizonDate` null keeps the chip's old behaviour of not
       * claiming calm, because a chip is a claim about a specific date being
       * ahead; the footer's broader reading is documented at the predicate.
       */
      forecastHorizonDate
        ? waitingOnTime({
            station: track?.station,
            holdReason: track?.holdReason,
            horizon: forecastHorizonDate,
            now: nowMs,
          })
        : false,
    [track?.holdReason, track?.station, forecastHorizonDate, nowMs],
  );

  /*
   * OUT-OF-TIME IS THE LOOP'S CLOCK, NOT A STOP (F-46/R027). While this press
   * still has automatic legs, the row may carry `out-of-time` between them --
   * and showing "Why it stopped" mid-walk reports a pause as a full stop. The
   * banner yields to the walking state and returns the moment the walk hands
   * control back for real.
   */
  const walkingMidRoute = Boolean(continuing || run.isPending);

  /*
   * ── THE PRESS CLOCK IS GONE WITH THE HEADER THAT SHOWED IT ──────────────
   *
   * It recorded the instant this tab's press began, because `driven_at` stamps
   * the END of a leg and counting up from it measures time since the work last
   * MOVED rather than time at the station (SPEC-LAYOUT gap G10, still open).
   * That reasoning is unchanged and the only reader was `RunRouteHeader`, which
   * came off this pane with the meter and the route map.
   *
   * The clock a person now reads is the footer's, and it measures something
   * else and better: `agent_runs.duration_ms` summed over the turns, which is
   * time the AGENTS worked rather than time this tab has been watching. Keeping
   * a second timer with no reader would be state that drifts unnoticed until
   * somebody wires it to the wrong thing.
   */

  /*
   * QUEUE 71 + RUN-18: THE ONE LIVE FACT NOW COVERS BOTH SOURCES OF MOTION --
   * seats the record says are working AND a press this tab is walking. The
   * header chip reads the same merged fact, which is why it stopped flashing
   * On-hold between automatic legs: an out-of-time row written mid-press is
   * real, but while the next leg is already in flight the truthful headline is
   * that the work is moving.
   */
  React.useEffect(() => {
    onCrewLive?.(crewLive || walkingMidRoute);
  }, [crewLive, walkingMidRoute, onCrewLive]);

  /*
   * THE FOOTER'S STOP LIVES OUTSIDE THIS PANE, so the fact that there is
   * something to stop has to travel out of it. Same shape as the crewLive lift
   * above rather than a second mechanism.
   *
   * The handler is read through a ref so this effect depends only on WHETHER a
   * press is walking, not on a function identity that changes every render.
   * Reporting on identity would fire on every paint and the footer would
   * re-render for nothing.
   */
  /*
   * ── STOP IS A ROW NOW, NOT A NUMBER IN THIS TAB ──────────────────────────
   *
   * It used to be `setLegsLeft(0)` and nothing else, which cancels the automatic
   * steps THIS TAB would have bought next. That is real and it is not a stop:
   * the step already dispatched finishes, and the sweep drives the same track
   * again on its next tick, because nothing on the record ever said a person
   * asked it to stop. Closing the page did exactly as much.
   *
   * `stopTrack` stamps `spine_tracks.stop_requested_at`, which `driveTrackOnce`
   * reads before dispatching any seat, so one press binds this tab AND the loop.
   * That is what lets the footer offer Stop on a run the sweep is driving, which
   * it correctly refused to do while the control could not reach one.
   *
   * THE LEGS ARE CANCELLED FIRST, BEFORE THE CALL AND WHATEVER IT ANSWERS. The
   * two halves protect different things and only one of them is on the network:
   * a person who pressed Stop must stop buying steps in this tab immediately,
   * whether or not the write lands, and whether or not the write is even
   * possible against a database that has not taken the column yet.
   */
  const fStop = useServerFn(stopTrack);
  /* Only called while the hold says so; see the query below. */
  const fWhoHolds = useServerFn(whoHoldsThePath);
  const stopWalk = useMutation({
    mutationFn: () => fStop({ data: { trackId } }),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ["spine-track", trackId] });
      void qc.invalidateQueries({ queryKey: ["track-activity", trackId] });
      /* A refusal is reported in the same receipt a refused release uses, so
         the two answers a person can get from this pane read the same way. */
      if (res.refused) {
        setReleaseNote({ verb: "The loop was not told", consequence: res.refused, failed: true });
      }
    },
    onError: (e: Error) =>
      setReleaseNote({
        verb: "The loop was not told",
        consequence: failureLine(
          "This page stopped buying steps, but the loop was not told, so it may drive this again.",
          e,
        ),
        failed: true,
      }),
  });

  const stopRef = React.useRef<() => void>(() => undefined);
  stopRef.current = () => {
    setLegsLeft(0);
    stopWalk.mutate();
  };

  const runRef = React.useRef<() => void>(() => undefined);
  runRef.current = () => {
    setLegsLeft(AUTO_MAX);
    run.mutate("press");
  };

  /*
   * ── WHAT THE FOOTER NEEDS, LIFTED OUT OF THIS PANE ───────────────────────
   *
   * The one control lives under both panes and this pane owns every piece of
   * walk state, so the handlers and the two in-flight flags travel out. Same
   * shape as the `crewLive` lift above rather than a second mechanism.
   *
   * `walking` is this tab's own press, which is the fact `footerMode` branches
   * on: `continuing` alone is true only BETWEEN steps, so a footer gated on it
   * would have offered nothing to stop for most of the thing it governs, which
   * is what watching a live press at 36 seconds showed.
   *
   * The handlers are read through refs so this effect depends only on the
   * booleans, not on function identities that change every render. Reporting on
   * identity would fire on every paint and the footer would re-render for
   * nothing.
   */
  const walkingHere = continuing || run.isPending;
  React.useEffect(() => {
    onDriveState?.({
      walking: walkingHere,
      starting: run.isPending,
      stopping: stopWalk.isPending,
      stop: () => stopRef.current(),
      run: () => runRef.current(),
    });
  }, [walkingHere, run.isPending, stopWalk.isPending, onDriveState]);

  /*
   * P-43 (A-QUEUE.md): "I'm ready, press run" said to someone who already
   * had. `run.isPending` alone cannot carry this past the moment itself --
   * it settles back to false once the server call returns, which can land
   * BEFORE the polled `drivenAt`/`crewLive` reads catch up, and the
   * character falls back to inviting a press that already happened. Set
   * once, on the first sign a press was made, and never cleared for this
   * mount: once true it stays true regardless of what the record does
   * later, because the fact "a press was made" does not un-happen.
   */
  const [pressedRun, setPressedRun] = React.useState(false);
  React.useEffect(() => {
    if (run.isPending) setPressedRun(true);
  }, [run.isPending]);

  /* A run a person stopped is drawn by its own line above, not as a hold: see
     the block there for why `paused` needs the sentinel to be read honestly. */
  const personStopped = track ? stoppedByYou(track.holdReason, track.holdBecause) : false;
  const showHold = held && !walkingMidRoute && !isCalmHold && !personStopped;
  /*
   * The way out is computed FROM WHAT THE SCREEN IS SHOWING, not from the hold
   * alone. Caught on the first drive: a track going in circles at the first
   * station on its route was told to send it back a step, directly above a
   * region saying there was nothing to send it back to. Pointing at a door that
   * is not there is the same defect as pointing at none.
   */
  const holdTakeOver = track
    ? takeOver({ status: track.status, station: track.station, route: track.route as SpineRoute })
    : null;
  /*
   * CAN BUILD ACTUALLY OPEN A PULL REQUEST? Asked only while this screen is
   * showing a hold at Build, so no other run pays for it. `ReadyToBuild` has
   * gated its own button on this same function for as long as it has existed;
   * the run screen never asked, and a person sat in front of six identical
   * failures being told it would try again. See `build-precondition.ts` for the
   * measurement and for why this is a fact about bindings rather than a branch
   * on the agent's wording.
   *
   * `productId` is passed because omitting it is the documented way this check
   * LIES: a repo bound to a product is invisible to the workspace-only path,
   * and the founder's own workspace was once told no repo was connected while
   * one was bound to Relay.
   */
  const navigate = useNavigate();
  const { activeWorkspace, activeProduct } = useWorkspace();
  const fCanDispatch = useServerFn(canDispatchToRepo);
  const repoCheck = useQuery({
    queryKey: ["track-build-repo", activeWorkspace?.id ?? null, activeProduct?.id ?? null],
    queryFn: () =>
      fCanDispatch({
        data: {
          ...(activeWorkspace?.id ? { workspaceId: activeWorkspace.id } : {}),
          ...(activeProduct?.id ? { productId: activeProduct.id } : {}),
        },
      }),
    enabled: Boolean(track && track.station === "build" && showHold),
    staleTime: 60_000,
  });
  const buildStop = buildBlocked({
    station: track?.station ?? "",
    held: Boolean(showHold),
    resolution: repoCheck.data?.resolution ?? null,
  });

  /*
   * WHO HOLDS THE FILE THIS RUN IS WAITING FOR, asked only while it is waiting.
   *
   * `enabled` on the hold, so the ordinary run costs no query at all. Read live
   * rather than stored, so the door disappears the moment the claim releases --
   * which is the same moment this track starts moving again.
   */
  const holder = useQuery({
    queryKey: ["who-holds-the-path", trackId],
    queryFn: () => fWhoHolds({ data: { trackId } }),
    enabled: track?.holdReason === CLAIMED_PATH_HOLD,
    staleTime: 30_000,
  });

  const holdWayOut = wayOut(
    track?.holdReason,
    { undo: Boolean(holdTakeOver?.undoTo), handback: Boolean(holdTakeOver?.handback) },
    track ? (AGENT_STATIONS[track.station]?.name ?? null) : null,
    holder.data ?? null,
  );
  const showCalmHold = isCalmHold && !walkingMidRoute;

  /*
   * WORK IS WORK WHEREVER IT WAS STARTED (RUN-02). The header's live line and
   * the route's active stop read this tab's press OR the record's own running
   * seats; without the second half, a run the sweep drove while this tab was
   * closed rendered as parked above a transcript that said Working.
   */
  const workingNow = walkingMidRoute || crewLive;

  /*
   * THE TAB TITLE CARRIES THE ONE LIVE FACT (RUN-02: watchable AND leavable).
   * After the person switches tabs, the tab is where they look; one word of
   * news -- Working, or Waiting on you -- derived from rows, nothing else.
   * Stands down entirely during a focus block, which owns the title
   * (`use-flow-mode`), and restores the page's own title on every change.
   */
  /* The tool the newest call on this track named, while it is still walking.
     Shares `ToolStream`'s cache entry, so the character and the stream read one
     fact on one beat. See `LiveWork.tsx`. */
  const currentTool = useCurrentTool(trackId, run.isPending || crewLive);

  const tabWord = runTabState({
    status: track?.status ?? null,
    holdReason: track?.holdReason ?? null,
    walking: run.isPending,
    crewLive,
  });
  React.useEffect(() => {
    if (!tabWord) return;
    if (document.documentElement.classList.contains("flow")) return;
    const prev = document.title;
    document.title = `${tabWord} · ${prev}`;
    return () => {
      document.title = prev;
    };
  }, [tabWord]);

  /*
   * TWO KEYS, NO CHORDS (RUN-10 / standard #4). `/` lands in the steer box,
   * `r` starts a walk -- the two controls a watcher reaches for repeatedly.
   * The guard lives in run-keys.ts and is tested there; its short form is that
   * a key pressed while somebody is TYPING, or with a modifier held, is not a
   * shortcut and never becomes one.
   */
  const finished = track?.status === "done" || track?.status === "abandoned";
  const steerFieldRef = React.useRef<HTMLTextAreaElement | null>(null);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (shouldIgnoreKey(e)) return;
      const action = keyAction(e.key);
      if (!action) return;
      if (action === "steer") {
        e.preventDefault();
        steerFieldRef.current?.focus();
        return;
      }
      // `r` mirrors the footer's Run-it control exactly, including every state
      // where the control refuses to exist, and it goes through the same handler
      // so the two cannot diverge.
      if (finished || walkingMidRoute || run.isPending) return;
      e.preventDefault();
      runRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finished, walkingMidRoute, run]);

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
       *
       * `RunPresence` holds the one distinction the derivation cannot see:
       * while this pane's first read is in flight nothing is claimed at all,
       * so a person arriving from /start reads "Reading this piece of work"
       * instead of the false alarm "I can't find this piece of work".
       */}
      {/*
       * ── THE TEAMMATES BLOCK IS GONE, AND THE FACT IT CARRIED IS NOT ────
       *
       * `Teammates` drew a row of marks above the character whenever two or
       * more seats were in flight. It was a HEADER of who is here, and the
       * transcript directly below it already draws every seat the moment its
       * run row lands, with the artifact it filed and what it cost. So the two
       * answered one question and only one of them could say what the seat
       * actually did. §4 removes the header for that reason and keeps the
       * answer where the evidence is.
       */}
      {/*
       * PRESENCE ONLY WHEN IT DISCRIMINATES (§4: "one sentence, only when it
       * discriminates -- stopped, waiting, finished. Silent while working").
       *
       * While work is moving, three things on this screen already say so: the
       * live entry ticking in the transcript, the footer's mode line, and the
       * strip's working chip. A fourth sentence saying "I'm on it" above them
       * is the repetition this surface keeps being repaired for, and it is the
       * one that reads as filler because it is the only one with no figure
       * attached.
       *
       * THE LOADING CASE STILL DRAWS, and that is not an exception to the rule.
       * "Reading this piece of work" is the distinction the derivation cannot
       * otherwise make: without it a person arriving from /start meets the
       * false alarm "I can't find this piece of work" while the first read is
       * still in flight.
       */}
      {trackQ.isLoading || !workingNow ? (
        <RunPresence
          loading={trackQ.isLoading}
          input={{
            track: track
              ? { status: track.status, holdReason: track.holdReason, drivenAt: track.drivenAt }
              : null,
            result: result ? { stopped: result.stopped, more: result.more } : null,
            // A crew the sweep is driving is working, exactly as a leg this tab
            // pressed is: presence reads the record, not this tab's own press.
            walking: run.isPending || crewLive,
            continuing,
            feedDead: trackQ.isError,
            pressedRun,
            /*
             * ── THE CHARACTER NAMES THE TOOL NOW (2026-09-01) ──────────────
             *
             * `PresenceInput.currentTool` has existed since the character was
             * built, `VERB_BY_TOOL` holds 27 curated first-person verbs for it,
             * and `character.ts:225` turns one into "I'm writing the spec." --
             * and NOTHING ON THIS SURFACE EVER PASSED IT. The branch was dead
             * code, so a run that was reading the repository, drafting a design
             * and checking its own work against the evidence said the same four
             * words the whole way through: "I'm on it."
             *
             * The reason it was never wired is that the join did not exist:
             * `tool_calls` could not be tied to a run until `agent_runs.trace_id`
             * landed on 2026-08-26 (F-93). It can now, at 100% coverage for runs
             * from 2026-08-31 on, so the verb the character was built to say is
             * finally derivable from a row.
             *
             * Null while settled, on purpose -- `verbForTool` is present tense
             * and a finished run's last call is a fact about the past.
             */
            currentTool,
          }}
        />
      ) : null}

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
       * ── WHAT THE PRESS ITSELF ANSWERED, AND NOTHING ELSE ────────────────
       *
       * These rows exist only after a mutation that can run for fifty seconds
       * returns, which is the exact case a polite status region is for: the
       * person pressed a control, and what came back -- including "it stopped
       * and is waiting on something" -- is said, not merely shown.
       *
       * NOT IN A REGION ANY MORE. It used to live inside the boxed `Run it`
       * block, which is gone: the control moved to the footer under both panes
       * (THE-ONE-SCREEN:21) and a box whose only remaining content was the
       * answer to a control somewhere else is a container earning nothing. The
       * facts are unchanged, and the cap message in particular stays, because
       * "nothing was stopped silently" is the sentence that keeps automatic
       * legs honest.
       */}
      {result || run.isError ? (
        <div role="status" aria-live="polite" className="flex flex-col">
          {result ? (
            <Row
              lead={
                continuing
                  ? `It is still walking. ${legsLeft} automatic ${legsLeft === 1 ? "step" : "steps"} left on this press.`
                  : STOPPED_LINE[result.stopped]
              }
              sub={
                continuing
                  ? "Stop, in the bar below, takes it back at the end of this step."
                  : result.more && !capReached
                    ? "Run it again to continue."
                    : undefined
              }
            />
          ) : null}
          {capReached ? (
            <Row
              lead={`It walked every automatic step (${AUTO_MAX}) and still has route ahead.`}
              sub="Nothing was stopped silently: press Run it now, in the bar below, to buy another set."
            />
          ) : null}
          {run.isError ? <Row lead="The walk could not start. Nothing was moved." /> : null}
        </div>
      ) : null}

      {/*
       * ── YOU STOPPED IT, WHICH IS NOT THE WORKSPACE BEING PAUSED ─────────
       *
       * A person's stop is written as `last_hold = 'paused'`, because the hold
       * vocabulary is closed (see `STOPPED_BY_YOU` in driver.ts). Left to the
       * region below, this would print `HOLD_LINE.paused` -- "Everything is
       * paused for this workspace, so nothing ran" -- directly under the
       * driver's own "Stopped by you.", which is one screen making two
       * incompatible claims about one row.
       *
       * It is also not a hold in the sense that region is written for. There is
       * nothing to diagnose, no way out to name and nothing to release: the
       * control that made it is the control that undoes it, and it is in the
       * footer. So it gets one line and no box.
       */}
      {track && stoppedByYou(track.holdReason, track.holdBecause) && !walkingMidRoute ? (
        <Row
          lead="You stopped this run."
          sub="Nothing further will be dispatched, by this page or by the loop, until you press Run it now."
          action={
            <StatusChip status="hold" pulse={false}>
              Stopped
            </StatusChip>
          }
        />
      ) : null}

      {showHold && track ? (
        <Region title="Why it stopped" sub="This work is not moving until this clears.">
          <div className="flex flex-col gap-mrd-4">
            {/*
             * WHAT THE STATION ITSELF SAID, above the kind of stop it was.
             *
             * `track.hold` is derived from the coarse `holdReason` -- the kind a
             * LIST needs -- so a refused tool reads "this station could not use
             * a tool it needed", which is true and unactionable. `holdBecause`
             * is the sentence the driver stored verbatim at the stop, and for a
             * refusal it names the tool and quotes it: "It was studio.pr.merge,
             * which said: ...".
             *
             * Tonight I watched a Build station fail six times saying "GitHub is
             * not connected" in its own prose while the hold line said "This
             * station ran but filed nothing. It will try again." The station
             * said the true thing, the surface said a false one, and the
             * transcript was the only place they met. This is where they meet
             * now.
             *
             * FIRST, not appended to the kind: the specific sentence is what a
             * person can act on, and the kind is context for it rather than the
             * other way round.
             *
             * NULL IS THE COMMON CASE AND STAYS SILENT. The column is written
             * only at the two stops that have words of their own, and every
             * track that stopped before it existed reads null. So this adds a
             * line when there is one and changes nothing when there is not.
             */}
            {track.holdBecause ? <Row lead={track.holdBecause} /> : null}

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
            />
            {/*
             * ── AND THE CHIP IS THE SIXTH COPY, SO IT GOES (2026-09-02) ────
             *
             * The comment this replaces called itself "the fifth and last copy
             * of this claim on one screen" and then added a sixth. Photographed
             * on `ce846e9b` after the header was cut back to one chip: the
             * header said **Needs a restart** at the top right, and this row
             * said **Needs a restart** 380px below it, same word, same colour,
             * about the same run. One status per screen is the rule, and when
             * two chips carry the SAME word the second one cannot even be
             * defended as a different subject.
             *
             * Nothing is lost. `run-status.ts` still owns the vocabulary and
             * the header still wears it; this region's own heading, its lead
             * and `wayOut`'s sentence below already say what stopped it and
             * what clears it, in words rather than in a colour.
             */}
            {/*
             * WHAT WILL ACTUALLY CLEAR IT (RUN-23). Eight of the eighteen hold
             * reasons name no way out at all, and the only control here says
             * "let this station try again", which for those eight does the
             * same thing again. A person read a reason and was told nothing
             * about what to do, which is the dead end R-20 section 5 forbids.
             *
             * Read from the RAW reason, never the prose. Branching on wording
             * is how every hold once painted amber.
             *
             * The retry control is deliberately left in place below: somebody
             * who has just unlocked a refused tool elsewhere comes back here
             * wanting exactly that button. The dead end was the missing
             * sentence, not the button.
             */}
            {holdWayOut.next ? (
              <Row
                lead={holdWayOut.next}
                sub={
                  holdWayOut.onThisScreen
                    ? "Both of those are under Take it over, just below."
                    : undefined
                }
              />
            ) : null}

            {/*
             * THE WAY OUT THAT IS SOMEWHERE ELSE.
             *
             * A run waiting on a claimed path has nothing to press here -- the
             * file frees when the other run's pull request merges or closes --
             * and the hold's own sentence already says that. What it has is
             * somewhere to GO, and a person who has just read "waiting on the
             * tablet run" wants that run.
             *
             * A real link, never a label. `wayOut` returns this only with an id
             * it was handed, and the id is resolved live, so a claim that has
             * released renders nothing rather than a door onto a run that is no
             * longer holding anything.
             */}
            {holdWayOut.door ? (
              <Link
                to="/track/$trackId"
                params={{ trackId: holdWayOut.door.trackId }}
                search={{}}
                className="mrd-focus rounded-mrd-ctl text-mrd-small text-mrd-ink underline decoration-mrd-line underline-offset-4 transition-colors hover:decoration-mrd-edge"
              >
                {holdWayOut.door.label}
              </Link>
            ) : null}

            {/*
             * THE PRECONDITION THE RETRY CANNOT SATISFY, said before the retry.
             *
             * It sits ABOVE the control on purpose. A person who reads "Let
             * Build try again" first will press it -- six people-equivalents
             * already did on this one track, at 373,096 tokens -- and a reason
             * printed underneath a button has already lost. The door is the
             * instruction, so the sentence carries no imperative of its own.
             */}
            {buildStop ? (
              /*
               * THE SENTENCE IS NOT CONDITIONAL ON A CONTROL, and this is the
               * second version of this block.
               *
               * The first put the line inside `AskInPlace` as its `why` and let
               * that component own the row. It is built for exactly this
               * situation, it is S3's, and mounting it here was the obvious
               * upgrade: connect in place instead of sending someone to a page
               * of connectors, which is SESSION-1's fourth unit.
               *
               * Rendered against this held track it drew NOTHING, and the
               * reason is worth keeping rather than working around.
               * `AskInPlace` decides whether the need is met by asking whether
               * a CONNECTOR EXISTS -- `satisfiedByEnv` counts an admin's env
               * credential, and the comment on that default is right for its
               * own purpose: "Supaprod is already reading through it, so asking
               * would be a lie". But this station's blocker is not a missing
               * credential. `canDispatchToRepo` runs the same resolution the
               * dispatch runs, and it fails when no repo RESOLVES -- most often
               * a credential that exists with no repository bound to this
               * workspace or product.
               *
               * So the two disagree exactly where it matters: the component
               * concludes the need is satisfied and hides itself at the moment
               * the station cannot proceed. Putting the explanation inside it
               * took the explanation down too, which is how the regression
               * showed up at all.
               *
               * The door therefore stays pointed at Settings, which is where
               * BOTH halves are fixed -- connect the account, and bind the
               * repository. A control that can only solve half the causes must
               * not be the only way out of a hold.
               */
              <Row
                lead={buildStop.line}
                action={
                  <Door
                    onClick={() =>
                      navigate({ to: "/settings", search: { section: "connections" } })
                    }
                  >
                    {buildStop.door}
                  </Door>
                }
              />
            ) : null}

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
              // The viewer's locale spells the day, and the weekday rides along,
              // the same rule the consent expiry line runs on. A horizon date is
              // a calendar day, so no time is put on it.
              lead={`The forecast comes due ${formatDeadlineDate(Date.parse(forecastHorizonDate))}; Learn returns then.`}
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

      {/*
       * ── THE `RUN IT` REGION IS GONE, AND THE CONTROL IS NOT ─────────────
       *
       * A boxed region titled "Run it", with a paragraph of its own and a
       * primary button, sat here in the middle of the transcript column. Stop
       * had already moved to the footer under both panes (THE-ONE-SCREEN:21),
       * which left the two halves of one decision in two places: you started a
       * run in the middle of the left column and stopped it at the bottom of
       * the screen, and on a long transcript whichever one you wanted was off
       * screen. Both are in the footer now, as ONE control that reads Stop or
       * Run it now and never both.
       *
       * WHAT WAS IN THE BOX BESIDES THE BUTTON is kept and moved rather than
       * deleted: the press's own answer is the live region above, and the copy
       * control is directly below. The three sentences the box carried about a
       * finished or abandoned run are the footer's job now, and it says each
       * of them once.
       */}

      {/*
       * THE RUN, IN A FORM SOMEBODY CAN PASTE SOMEWHERE. It is the one export
       * on this pane and it belongs to the transcript above it rather than to a
       * control that no longer lives here.
       */}
      <CopyRunSummary trackId={trackId} />

      {/*
       * RUN-20: THE CONTROLS THAT ARE NOT START AND STOP. Sending a step back
       * and handing a step in by hand are the two moves a person makes when
       * what came back is wrong, and neither had a door -- `rewindTrackTo` and
       * `submitStationByHand` were on `main` with zero importers. They sit here,
       * under the control that drives the run forward and above the record of
       * what it did, because all three act on where the work stands.
       */}
      {track ? <TakeOver trackId={trackId} track={track} /> : null}

      {/*
       * QUEUE 71: THE PANE POLLS AT VISIT SPEED WHENEVER A CREW IS HERE, not
       * only while this screen's own press is walking. The sweep serves tracks
       * with nothing pressed anywhere, and its running rows are the one honest
       * signal of that; the transcript reports them upward and both panes
       * follow. When no row says running or queued, nothing speeds up and
       * nothing pulses -- an idle track reads idle.
       */}
      <TrackActivity
        trackId={trackId}
        onLiveChange={onCrewLive}
        onSelect={onSelectArtifact}
        selected={selectedArtifactId}
      />

      {/*
       * THE STEER BOX (RUN-03), AT THE PANE'S FOOT -- below the transcript,
       * where a reader finishes and answers, sticky so a long record never
       * buries it. One instruction back into moving work from the surface the
       * work is on; `steerTrack` existed with zero callers until this mounted,
       * which made Start and Stop the run's whole vocabulary. The finished case
       * says so rather than rendering a form that can do nothing. `/` from
       * anywhere on this page lands here (RUN-10).
       */}
      <SteerComposer
        trackId={trackId}
        finished={finished}
        /*
         * P-37. R-36 promises two ways on from a run stuck for want of
         * evidence: add a source, or say what you know. The card keeps one
         * door, so the second promise is made here, in the field that can
         * accept it. `composerPromiseFor` is the same decision the door reads,
         * so the two cannot offer different things about one state.
         */
        stuckOnEvidence={
          composerPromiseFor({
            hold: track?.holdReason ?? null,
            /* At Learn the promise would be false: nothing carries on until the
               horizon, whatever anybody types. */
            station: track?.station ?? null,
            hasConnection: false,
            connectionIsBound: false,
            productName: null,
          }) !== null
        }
        fieldRef={steerFieldRef}
      />
    </div>
  );
}

/*
 * THE RIGHT PANE: the thing being made, and the record beside it. The
 * pane-station pointer lives entirely in here -- it is the private wiring of
 * item 7 (a record row reveals the artifact), and no other pane reads it.
 */
/**
 * The strip, filled from this run's own rows.
 *
 * A thin composition rather than a component: `meridian/got-you.tsx` draws chips
 * and clauses and knows nothing about tracks, `run-tally.ts` counts a track and
 * knows nothing about drawing, and this is the two-line seam between them. It
 * lives here rather than in either, because "which run" is the pane's question.
 */
function RunGotYou({
  trackId,
  onOpen,
  active,
}: {
  trackId: string;
  onOpen?: (artifactId: string | null) => void;
  active: string | null;
}) {
  const { tally, ready } = useRunTally(trackId);
  /*
   * NOTHING YET IS NOT AN EMPTY STRIP. A run that has produced nothing has a
   * transcript saying so two inches to the left, and a box reading "nothing yet"
   * over a pane that already says it is the duplication this screen keeps being
   * repaired for. `ready` is both reads having answered, so the strip arrives
   * whole rather than reflowing as its second half lands.
   */
  if (!ready || !hasAnything(tally)) return null;
  return (
    <GotYou
      label="What this run got you"
      chips={gotYouChips(tally)}
      clauses={gotYouClauses(tally)}
      link={gotYouLink(tally)}
      active={active}
      onOpen={onOpen ? (id) => onOpen(id) : undefined}
    />
  );
}

export function TrackPaneRight({
  trackId,
  isRunning = false,
  activeArtifactId = null,
  onOpenArtifact,
}: {
  trackId: string;
  isRunning?: boolean;
  /**
   * The ARTIFACT shown, chosen in the transcript or on a chip above this pane.
   *
   * An artifact id rather than a station, which is P-24's whole correction: a
   * station reaches one thing per station, so the third prototype of ten could
   * be seen and not opened. Owned by the URL, through the route, because the
   * control that sets it is a row in the other pane and because a person wants
   * to send a colleague the spec rather than the run.
   *
   * Null means nobody has picked, and the pane falls back to the newest thing
   * the run made.
   */
  activeArtifactId?: string | null;
  /** Null clears the selection and returns the pane to the newest artifact. */
  onOpenArtifact?: (artifactId: string | null) => void;
}) {
  return (
    <div className="flex flex-col gap-mrd-6">
      {/*
       * ── WHAT THIS RUN GOT YOU, ABOVE THE THING IT MADE ──────────────────
       *
       * A1-REPORT §4 puts one strip here "once the run has produced anything",
       * and calls it "the sentence the person repeats to a colleague". It is
       * also the only place on this screen where the four facts a person
       * actually reports -- what you now have, whether it is any good, when the
       * forecast lands, what it cost -- are readable in one movement of the eye.
       * Before it, the last of those was a bordered region at the BOTTOM of this
       * pane and the first was nowhere at all.
       *
       * Its chips are the second way into this pane: each names a thing the run
       * made, in the person's own word for it, and selects the row that made it.
       * It never names a station that made nothing, which is the difference
       * between a summary and a seven-slot template.
       */}
      <RunGotYou trackId={trackId} onOpen={onOpenArtifact} active={activeArtifactId} />
      <ArtifactPane
        trackId={trackId}
        activeArtifactId={activeArtifactId}
        onOpenArtifact={onOpenArtifact}
        isRunning={isRunning}
      />
      {/*
       * ── FOUR THINGS CAME OFF THIS SCREEN, AND EACH FOR ITS OWN REASON ───
       *
       * THE SEVEN-STAGE STRIP (founder, 2026-09-02). The run screen drew the
       * stations four times and this was the last of the four. It is gone with
       * them, and nothing replaces it: stations appear only as marker rows in
       * the transcript, where they are facts about what happened rather than a
       * menu. `usePublishRunStrip` is not called from here, so the shell's band
       * draws nothing on this route, and `run-strip-spec.ts` is deleted with its
       * last importer. The right pane now follows the SELECTED TRANSCRIPT ROW,
       * which is the same gesture with one fewer control: you point at the thing
       * that happened, not at the stage it happened in.
       *
       * `TrackChain` was 2,706px of the same route in list form, with rows that
       * opened a station. The transcript is that list, in time order, with what
       * each turn actually filed.
       *
       * `LiveWork` listed every tool call on the whole track in one flat stream
       * headed "What the agents are calling". It answered what the RUN called
       * and could not answer what THIS SEAT called, which is the only version of
       * the question somebody watching a handoff has. Those calls are now inside
       * the transcript entry of the seat that made them, collapsed, one press
       * from open.
       *
       * `RunCost` was a bordered region below the artifacts holding the two
       * figures people check most often, on the side of the screen they were not
       * reading. They are facts about the run rather than about anything it
       * made, so they are on the bar under both panes, computed by the same
       * `runTally` the strip above uses so the two cannot print different
       * numbers.
       */}
    </div>
  );
}

/** Today's stacked column, composed from the two panes. Unchanged callers. */
export function TrackRun({ trackId, autoStart = false }: { trackId: string; autoStart?: boolean }) {
  /*
   * QUEUE 71: one crew-live fact for the whole screen, read off the
   * transcript's run rows and shared with both panes, so a sweep-driven visit
   * polls at visit speed on the artifact side too. The old wiring hardcoded
   * this pane's flag to false, which is why tonight's watch watched real crews
   * work behind a ten-second silence.
   */
  const [crewLive, setCrewLive] = React.useState(false);
  /* The transcript row a person picked, which is what the right pane shows. */
  const [selected, setSelected] = React.useState<string | null>(null);
  return (
    <div className="flex flex-col gap-mrd-6">
      <TrackRunLeft
        trackId={trackId}
        autoStart={autoStart}
        onCrewLive={setCrewLive}
        crewLive={crewLive}
        selectedArtifactId={selected}
        onSelectArtifact={setSelected}
      />
      <TrackPaneRight
        trackId={trackId}
        isRunning={crewLive}
        activeArtifactId={selected}
        onOpenArtifact={setSelected}
      />
    </div>
  );
}

export default TrackRun;
