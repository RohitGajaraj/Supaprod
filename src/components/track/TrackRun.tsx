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
import { failureLine } from "@/lib/error-copy";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link, useNavigate } from "@tanstack/react-router";
import { CLAIMED_PATH_HOLD } from "@/lib/spine/a-claimed-path-is-a-wait-not-an-unstage";

import { TrackActivity } from "@/components/spine/TrackActivity";
import { useCurrentTool } from "@/components/track/LiveWork";
import { ArtifactPane } from "@/components/track/ArtifactPane";
import { TrackConsent } from "@/components/track/TrackConsent";
import { Action, Door } from "@/components/meridian/surface-parts";
import { Row } from "@/components/meridian/rows";
import { Receipt } from "@/components/meridian/Receipt";
import {
  driveTrackNow,
  getTrack,
  getTrackChain,
  getTrackArtifacts,
  retryStation,
  setStationWaiver,
  stopTrack,
  whoHoldsThePath,
  type DriveNowResult,
  type Track,
} from "@/lib/spine/track.functions";
import { AGENT_STATIONS, type AgentStation } from "@/lib/agent-vocabulary";
import { STATION_NEEDS } from "@/lib/spine/correction";
import { holdTone } from "@/lib/spine/driver";
import { summaryText } from "@/components/track/run-summary";
import { runTabState } from "@/components/track/run-tab";
import { keyAction, shouldIgnoreKey } from "@/components/track/run-keys";
import { SteerComposer } from "@/components/track/SteerComposer";
import { TakeOver } from "@/components/track/TakeOver";
import { runNow } from "@/components/track/run-now";
import { RunNow, HoldFact } from "@/components/track/RunNow";
import { wayOut } from "@/components/track/way-out";
import { triedAgainLine } from "@/lib/spine/three-tries-and-nothing-changed";
import { sameCalendarDay } from "@/lib/time-of-day";
import { useTimezone } from "@/hooks/use-timezone";
import { builtWithLine } from "@/lib/hosting/what-shape-is-this-repo";
import { buildBlocked } from "@/components/track/build-precondition";
import { canDispatchToRepo } from "@/lib/new-build.functions";
import { useWorkspace } from "@/hooks/use-workspace";
import { useLiveAgents } from "@/hooks/use-live-agents";
import { AgentPresence, presenceColour } from "@/components/meridian/AgentPresence";
import { takeOver } from "@/components/track/take-over";
import type { SpineRoute } from "@/lib/spine/route";
import { RunProof } from "@/components/track/RunProof";
import { proofRows } from "@/components/track/run-proof";
import { useRunTally } from "@/components/track/run-tally";
import { stoppedByYou } from "@/components/track/footer-mode";
import {
  waitingOnTime,
  howWeWillKnowFromStops,
  horizonFromStops,
} from "@/components/track/a-calendar-wait-is-not-a-stoppage";
import { composerPromiseFor } from "@/components/track/one-door-for-one-state";
import { whyShipStopped } from "@/lib/deployments.functions";
import { checkForecastObservable } from "@/lib/spine/track.functions";
import { TheCallIsYours } from "@/components/track/TheCallIsYours";
import {
  buildOnYourWord,
  choiceStillOutstanding,
  pointASourceFirst,
} from "@/lib/spine/track.functions";
import { retryPreviewNow } from "@/lib/deployments.functions";
import {
  type ShipStop,
  shipStopFrom,
  shipStopLine,
  shipStopWaitsOnAPerson,
} from "@/lib/hosting/a-ship-that-cannot-deploy-names-the-provider";

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

/**
 * The copy itself, as a hook, so the header's menu and any button can share
 * one implementation and one receipt. Reads the chain off the cache entry the
 * pane already polls; no second fetch.
 */
export function useCopyRunSummary(trackId: string): {
  copy: () => Promise<void>;
  copied: string | null;
  busy: boolean;
} {
  const fChain = useServerFn(getTrackChain);
  const chain = useQuery({
    queryKey: ["spine-track-chain", trackId],
    queryFn: () => fChain({ data: { trackId } }),
    staleTime: 10_000,
  });
  const [copied, setCopied] = React.useState<string | null>(null);

  const copy = async () => {
    const data = chain.data;
    if (!data?.track || !data.chain) {
      setCopied(null);
      return;
    }
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

  return { copy, copied, busy: chain.isLoading };
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
      /*
       * P-151 / F-202. A press on deferred work now actually drives the track
       * (see `retryStation`'s own header), which files real artifacts and
       * gates the other invalidations above never had to cover before this.
       */
      void qc.invalidateQueries({ queryKey: ["track-activity", trackId] });
      void qc.invalidateQueries({ queryKey: ["track-gates", trackId] });
      setReleaseNote({
        verb: "You released it",
        /*
         * `note` is what the look actually found -- the station's own hold
         * line if it re-held, composed fresh, never a promise about "its next
         * turn" that a deferred track's own bug made false. Absent only when
         * the track was not deferred, in which case the sweep's own next pass
         * (unchanged by this fix) is genuinely the next turn.
         */
        consequence:
          res.note ?? "It runs again on its next turn. Press Run it now to walk it immediately.",
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
  const held = track?.status === "open" && tone !== null;
  const answerTheCall = track?.holdReason === "waiting-on-a-person";
  /*
   * ── R-39's CHOICE IS UP (P-71b) ────────────────────────────────────────
   *
   * Its own hold word, not `waiting-on-a-person` plus a sentence. The first
   * draft matched on the stored question and broke F-127's invariant, which
   * requires `waiting-on-a-person` to clear that column because the GATE is its
   * reason. This hold has no gate row: it has a question with two answers.
   */
  /* P-71d. Whether R-39's question is still in front of this person, read from
     the record rather than from the current hold. */
  const fChoiceOutstanding = useServerFn(choiceStillOutstanding);
  const choiceRaised = useQuery({
    queryKey: ["choice-outstanding", trackId],
    queryFn: () => fChoiceOutstanding({ data: { trackId } }),
    staleTime: 30_000,
  });

  /*
   * ── DURABLE, FOR THE SAME REASON THE FOOTING IS (P-71d) ────────────────
   *
   * This read the current hold, and A1's third probe walk overwrote it: the
   * Choice was raised at 00:10, the sweep drove the track again at 00:20,
   * Decide ran out of time, and the screen fell back to the generic out-of-time
   * card with "Let Decide try again" while the question was still unanswered.
   *
   * P-71d stops the sweep taking the track back, so the hold now survives on
   * its own. This ALSO reads the durable record, because a hold is a current
   * fact and the question being unanswered is a historical one -- the same
   * lesson P-71c already paid for once, and the reason that walk found this at
   * all.
   */
  const callIsYours =
    track?.holdReason === "the-call-is-yours" ||
    (choiceRaised.isSuccess && choiceRaised.data.outstanding);

  /* Their call, recorded as theirs. `press` afterwards so the run picks the
     work straight back up, the same chain `TrackConsent`'s `onAnswered` is. */
  const fBuildOnYourWord = useServerFn(buildOnYourWord);
  const onYourWord = useMutation({
    mutationFn: (howWeWillKnow: string) =>
      fBuildOnYourWord({
        data: { trackId, howWeWillKnow: howWeWillKnow || undefined },
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["track", trackId] });
      run.mutate("press");
    },
  });
  /*
   * The other answer. Recorded BEFORE the navigation, and it does not press:
   * there is nothing to drive until a source actually lands, and pressing would
   * spend a dispatch to rediscover the same emptiness. The navigation happens
   * either way -- a failed write must not strand the person on a screen whose
   * button did nothing, and the settings page is where they were going.
   */
  const fPointASourceFirst = useServerFn(pointASourceFirst);
  const pointASource = useMutation({
    mutationFn: () => fPointASourceFirst({ data: { trackId } }),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["track", trackId] });
      navigate({ to: "/settings", search: { section: "connections" } });
    },
  });

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

  const zone = useTimezone();

  /* Whether `deferred_until` is holding this card's own words hostage to a
     date it did not earn: the calendar wait (`needs-evidence`) writes the
     forecast horizon into the same column the backoff ladder uses, and
     "Tried 3 times" is false for a track that has never been driven three
     times against this hold at all (P-143). */
  const deferralIsForecastHorizon = Boolean(
    track?.deferredUntil &&
    forecastHorizonDate &&
    sameCalendarDay(track.deferredUntil, forecastHorizonDate, zone),
  );

  /* Hoisted above the R-39 read below, which needs the workspace. Unconditional
     and in one place, so hook order is unchanged between renders. */
  const { activeWorkspace, activeProduct } = useWorkspace();

  /*
   * ── R-39 / P-71: CAN ANYTHING HERE GRADE IT? ───────────────────────────
   *
   * A decision recorded against 1,000 sessions no connected source can see read
   * as a calendar wait: "Waiting on time, Learn returns Oct 3". A date that
   * returns to nothing is worse than a stoppage, because a stoppage asks for
   * something and this asks for patience.
   *
   * `checkForecastObservable` is the read the Decide station already uses to
   * answer this at the moment of the call; the same question is asked here, of
   * the same words, so the two cannot disagree. Only while held at Learn --
   * everywhere else there is no wait to correct.
   */
  const howWeWillKnow = React.useMemo(
    () => howWeWillKnowFromStops(artifactsQ.data?.stops),
    [artifactsQ.data?.stops],
  );
  const fCheckObservable = useServerFn(checkForecastObservable);
  const observable = useQuery({
    queryKey: ["forecast-observable", trackId, howWeWillKnow, activeWorkspace?.id ?? null],
    queryFn: () =>
      fCheckObservable({
        data: { howWeWillKnow: howWeWillKnow ?? "", workspaceId: activeWorkspace?.id as string },
      }),
    enabled:
      track?.station === "learn" &&
      track?.holdReason === "needs-evidence" &&
      Boolean(howWeWillKnow) &&
      Boolean(activeWorkspace?.id),
    staleTime: 5 * 60_000,
  });
  /*
   * UNREAD IS NOT UNGRADEABLE. `undefined` while the read is pending or failed
   * leaves the calendar reading exactly as it was; only a definite "nothing here
   * can check this" turns the wait into a stoppage.
   */
  const gradableBySource = observable.isSuccess ? observable.data.checkable : null;

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
            gradableBySource,
            now: nowMs,
          })
        : false,
    [track?.holdReason, track?.station, forecastHorizonDate, gradableBySource, nowMs],
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
  /* The skipped step a held station needs, and the press that puts it back;
     see HoldCard.tsx for the walk that asked for it. */
  const fWaiver = useServerFn(setStationWaiver);
  const putBack = useMutation({
    mutationFn: (station: AgentStation) => fWaiver({ data: { trackId, station, waived: false } }),
    onSuccess: (res, station) => {
      void qc.invalidateQueries({ queryKey: ["spine-track", trackId] });
      if (res.problems.length > 0) {
        setReleaseNote({
          verb: "Nothing was put back",
          consequence: res.problems.join(" "),
          failed: true,
        });
        return;
      }
      setReleaseNote({
        verb: "You put it back",
        consequence: `${AGENT_STATIONS[station].name} is on the route again and runs next.`,
      });
      setLegsLeft(AUTO_MAX);
      run.mutate("press");
    },
    onError: (e: Error) =>
      setReleaseNote({
        verb: "Nothing was put back",
        consequence: failureLine("The route is unchanged.", e),
        failed: true,
      }),
  });
  const skippedStation: AgentStation | null =
    track?.holdReason === "needs-a-waived-station"
      ? (STATION_NEEDS[track.station]?.from ?? null)
      : null;
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

  /*
   * ── WHAT STOPPED SHIP, WHEN THE HOLD WORD CANNOT SAY (P-59) ─────────────
   *
   * Only at Ship, and only while held: everywhere else this read has no
   * question to answer, and asking it would put a query on every run screen to
   * be told null.
   */
  const fWhyShip = useServerFn(whyShipStopped);
  const shipStopped = useQuery({
    queryKey: ["why-ship-stopped", trackId],
    queryFn: () => fWhyShip({ data: { trackId } }),
    /*
     * ── NOT GATED ON A CURRENT HOLD (P-59d) ────────────────────────────────
     *
     * `Boolean(track?.holdReason)` was the gate, and A1 read the consequence:
     * between ticks the hold is null, the run screen says "Ready when you are."
     * with no card and no press, and the only control that changes anything is
     * absent exactly when a person is looking. The failed deployment is on the
     * record whatever the hold says.
     */
    enabled: track?.station === "ship",
    staleTime: 30_000,
  });
  /*
   * A FAILED READ IS NOT "NOTHING STOPPED IT". `shipStopFrom` is only consulted
   * when the read actually answered; until then the static sentence stands,
   * which is what this screen said before and is never a claim about a cause.
   */
  /*
   * ── A FAILURE WITH NO REASON IS STILL A FAILURE (P-59c) ────────────────
   *
   * `failureReason: null` meant two different things and only one of them is a
   * stopped Ship: no failed deployment at all, or a failed one whose reason was
   * never recorded. The read answers both now, and the card is drawn for the
   * second -- which is the tablet track exactly, whose one failure carries a
   * NULL reason and reads "nothing on the attempt says why".
   */
  /*
   * ── EVERY BRANCH THE READ CAN TAKE SAYS SO (P-59c acceptance) ──────────
   *
   * A1 read the served card fifty minutes after publish and it was still the
   * generic "It will try again", with the station's retry correctly stood down
   * -- so `shipStop` was truthy and the button still was not there. The cause
   * is one line below this: the retry rode on `holdWayOut.next`, and way-out
   * says NOTHING for `produced-nothing` on purpose, so the Row carrying it was
   * never rendered at all.
   *
   * The screen could not say which branch fired, so a correct read and a broken
   * one looked identical from the outside. It says it now: read failed, no
   * failed deployment, a failure with no reason, a failure with one.
   */
  const shipStop: ShipStop | null = shipStopped.isError
    ? { kind: "unread", said: (shipStopped.error as Error).message }
    : !shipStopped.isSuccess
      ? null
      : shipStopped.data.failed
        ? shipStopFrom(shipStopped.data.failureReason)
        : { kind: "none" };
  /** Only a real stop takes the screen over; "none" is drawn as a quiet line. */
  const shipIsStopped = Boolean(shipStop && shipStop.kind !== "none");

  /* P-68b. The offer in the hold card, as a real action. It ignores the sweep's
     retry window and nothing else, and it writes a reasoned row either way. */
  const fRetryPreview = useServerFn(retryPreviewNow);
  const retryPreview = useMutation({
    mutationFn: () => fRetryPreview({ data: { trackId } }),
    onSuccess: () => {
      /* The hold card reads the newest failed deployment, so it is stale the
         instant this lands, whichever way it went. */
      void qc.invalidateQueries({ queryKey: ["why-ship-stopped", trackId] });
      void qc.invalidateQueries({ queryKey: ["track", trackId] });
    },
  });

  const holdWayOut = wayOut(
    track?.holdReason,
    { undo: Boolean(holdTakeOver?.undoTo), handback: Boolean(holdTakeOver?.handback) },
    track ? (AGENT_STATIONS[track.station]?.name ?? null) : null,
    holder.data ?? null,
    shipStop
      ? { line: shipStopLine(shipStop), actionable: shipStopWaitsOnAPerson(shipStop) }
      : null,
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

  /*
   * ── ONE SENTENCE ABOUT NOW (2026-09-08) ─────────────────────────────────
   *
   * Everything below used to say what was happening five times in five
   * registers: the character, the drive-result rows, the "You stopped this
   * run" row, the "Why it stopped" region and the "Learning to come" region.
   * `run-now.ts` reads the same facts once and picks the register on purpose,
   * and the facts that used to be rows inside those regions ride inside the
   * one card. See that module's header for the walk that found it.
   */
  const [liveSeats, setLiveSeats] = React.useState<
    Array<{ slug: string | null; name: string; waiting: boolean }>
  >([]);
  const shippedAt = React.useMemo(() => {
    for (const stop of artifactsQ.data?.stops ?? []) {
      if (stop.station !== "ship") continue;
      for (const item of stop.items) {
        if (item.kind !== "deployment" || item.missing) continue;
        const at = (item.fields as Record<string, unknown> | null)?.deployed_at;
        if (typeof at === "string") return at;
      }
    }
    return null;
  }, [artifactsQ.data?.stops]);
  /*
   * ── THE SEATS, AS PRESENCES (founder, 2026-09-08) ─────────────────────
   * "Which agent, on what, right now, with its own identity on screen." The
   * shell's running-now key (Lane 3) carries every live seat in the workspace
   * with its verb and start; this run draws its own, one AgentPresence each,
   * inside the Now card, so the card names the work and the presences name
   * the workers. Same key as the home and the rail, so they cannot disagree.
   */
  const liveAgents = useLiveAgents();
  const presences = React.useMemo(
    () => liveAgents.working.filter((a) => a.trackId === trackId),
    [liveAgents.working, trackId],
  );
  const now = runNow({
    track: track
      ? {
          status: track.status,
          station: track.station,
          hold: track.hold,
          holdReason: track.holdReason,
          holdBecause: track.holdBecause,
          drivenAt: track.drivenAt,
          deferredUntil: track.deferredUntil,
          attempts: track.attempts,
          route: { path: track.route.path },
        }
      : null,
    /* The scheduled register reads the release and the horizon off the
       artifacts; until they arrive the card says it is reading rather than
       "The change is out" about a run it has not looked at. */
    loading: trackQ.isLoading || (Boolean(track) && artifactsQ.isLoading),
    feedDead: trackQ.isError,
    live: workingNow,
    /* When the presences below name the seat and its verb, the headline says
       only where the work is; two sentences about one seat is the defect the
       card exists to remove. */
    currentTool: presences.length > 0 ? null : currentTool,
    seats: presences.length > 0 ? [] : liveSeats,
    legsLeft: continuing ? legsLeft : null,
    horizon: forecastHorizonDate,
    gradableBySource,
    shippedAt,
    verdict: null,
    nowMs,
  });
  /* A call in front of the person IS the now; the card yields to it. */
  const askIsUp = callIsYours || answerTheCall;
  /* The facts a hold used to carry as rows under "Why it stopped". */
  const holdFacts = track && (now.register === "held" || now.register === "stopped");
  /* The station's own retry stands down wherever pressing it changes nothing:
     a call is in front of the person, the preview is what stopped Ship, or
     nothing will pick the work up again. */
  const retryStandsDown =
    answerTheCall || callIsYours || shipIsStopped || now.register === "stopped";
  /* A skipped step is put back, not retried: a release re-holds on the same
     missing step, so the generic retry yields to the one press that helps. */
  const putBackFirst = skippedStation !== null;

  return (
    <div className="flex flex-col gap-mrd-5">
      {callIsYours ? (
        <TheCallIsYours
          busyId={
            onYourWord.isPending
              ? "build-on-your-word"
              : pointASource.isPending
                ? "point-a-source"
                : null
          }
          onBuildOnYourWord={(howWeWillKnow) => onYourWord.mutate(howWeWillKnow)}
          onPointASource={() => pointASource.mutate()}
        />
      ) : (
        <TrackConsent trackId={trackId} onAnswered={() => run.mutate("press")} />
      )}

      {askIsUp ? null : (
        <RunNow now={now}>
          {now.register === "working" && presences.length > 0 ? (
            <ul aria-label="Working on this now" className="flex flex-col gap-mrd-2">
              {presences.map((a) => (
                <li key={a.id}>
                  <AgentPresence
                    seat={a.name}
                    verb={a.verb}
                    object={a.subGoal}
                    since={a.startedAt}
                    colour={presenceColour(a.name)}
                    alive
                  />
                </li>
              ))}
            </ul>
          ) : null}
          {now.register === "scheduled" && gradableBySource === false ? (
            <div>
              <Door
                onClick={() => navigate({ to: "/settings", search: { section: "connections" } })}
              >
                Connect a source
              </Door>
            </div>
          ) : null}
          {holdFacts && track ? (
            <>
              {track.holdBecause ? <HoldFact>{track.holdBecause}</HoldFact> : null}
              {shipStop ? (
                <Row
                  tight
                  lead={shipStopLine(shipStop)}
                  sub={
                    retryPreview.isError
                      ? `That did not run: ${(retryPreview.error as Error).message}`
                      : retryPreview.data && !retryPreview.data.ok
                        ? `It ran and failed: ${retryPreview.data.reason ?? "no reason was given."}`
                        : undefined
                  }
                  action={
                    shipIsStopped ? (
                      <Action busy={retryPreview.isPending} onClick={() => retryPreview.mutate()}>
                        {retryPreview.isPending ? "Trying the preview" : "Try the preview again"}
                      </Action>
                    ) : undefined
                  }
                />
              ) : null}
              {builtWithLine({
                shape: shipStopped.data?.shape ?? null,
                build: shipStopped.data?.build ?? null,
              }) ? (
                <HoldFact>
                  {
                    builtWithLine({
                      shape: shipStopped.data?.shape ?? null,
                      build: shipStopped.data?.build ?? null,
                    }) as string
                  }
                </HoldFact>
              ) : null}
              {triedAgainLine(track.deferredUntil, new Date(), {
                zone,
                isForecastHorizon: deferralIsForecastHorizon,
              }) ? (
                <HoldFact>
                  {
                    triedAgainLine(track.deferredUntil, new Date(), {
                      zone,
                      isForecastHorizon: deferralIsForecastHorizon,
                    }) as string
                  }
                </HoldFact>
              ) : null}
              {holdWayOut.next ? (
                <HoldFact
                  sub={
                    holdWayOut.onThisScreen
                      ? "Both of those are under Take it over, below."
                      : undefined
                  }
                >
                  {holdWayOut.next}
                </HoldFact>
              ) : null}
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
              {buildStop ? (
                <Row
                  tight
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
              {/* Ship's own retry stands down when the preview is what stopped
                  it; the one control that changes anything is drawn above. */}
              {skippedStation ? (
                <div>
                  <Action
                    variant="primary"
                    busy={putBack.isPending}
                    onClick={() => putBack.mutate(skippedStation)}
                  >
                    {putBack.isPending
                      ? "Putting it back"
                      : `Put ${AGENT_STATIONS[skippedStation].name} back on the route`}
                  </Action>
                </div>
              ) : null}
              {retryStandsDown ? null : putBackFirst ? null : (
                <div>
                  <Action busy={release.isPending} onClick={() => release.mutate()}>
                    {release.isPending
                      ? "Releasing it"
                      : `Let ${AGENT_STATIONS[track.station].name} try again`}
                  </Action>
                </div>
              )}
            </>
          ) : null}
          {capReached ? (
            <Row
              tight
              lead={`It walked every automatic step (${AUTO_MAX}) and still has route ahead.`}
              sub="Nothing was stopped silently. Run it now, in the bar below, buys another set."
            />
          ) : null}
          {run.isError ? <Row tight lead="The walk could not start. Nothing was moved." /> : null}
          {result && result.stopped === "not-found" ? (
            <Row tight lead={STOPPED_LINE["not-found"]} />
          ) : null}
          {releaseNote ? (
            <Receipt
              verb={releaseNote.verb}
              consequence={releaseNote.consequence}
              failed={releaseNote.failed}
            />
          ) : null}
        </RunNow>
      )}

      {holdFacts && track ? <TakeOver trackId={trackId} track={track} /> : null}

      <TrackActivity
        trackId={trackId}
        /* A press this tab is walking is motion the record may not show for
           a beat; polling at the live rate from the first second means the
           seat's row appears the moment it is written, not ten seconds on. */
        isRunning={workingNow}
        onLiveChange={onCrewLive}
        onLiveSeats={setLiveSeats}
        onSelect={onSelectArtifact}
        selected={selectedArtifactId}
      />

      <SteerComposer
        trackId={trackId}
        finished={finished}
        stuckOnEvidence={
          composerPromiseFor({
            hold: track?.holdReason ?? null,
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
  /*
   * ── THE STRIP BECAME A PANEL (2026-09-08) ─────────────────────────────
   * `run-proof.ts` turns the same tally and the same stops into five labelled
   * rows (made, checked, shipped, on the hook, verdict) instead of one line of
   * counts. Same cache entries, same pointer, a different shape; see that
   * module's header for the line it replaces.
   */
  const { tally, ready } = useRunTally(trackId);
  const fArtifacts = useServerFn(getTrackArtifacts);
  const artifacts = useQuery({
    queryKey: ["track-artifacts", trackId],
    queryFn: () => fArtifacts({ data: { trackId } }),
    staleTime: 10_000,
  });
  const rows = React.useMemo(
    () => proofRows({ stops: artifacts.data?.stops ?? null, tally, nowMs: Date.now() }),
    [artifacts.data, tally],
  );
  if (!ready) return null;
  return <RunProof rows={rows} active={active} onOpen={onOpen ? (id) => onOpen(id) : undefined} />;
}

export function TrackPaneRight({
  trackId,
  isRunning = false,
  activeArtifactId = null,
  onOpenArtifact,
  stationOverride = null,
}: {
  trackId: string;
  isRunning?: boolean;
  /** A stop pressed on the road with nothing to open; see `ArtifactPane`. */
  stationOverride?: AgentStation | null;
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
        stationOverride={stationOverride}
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
