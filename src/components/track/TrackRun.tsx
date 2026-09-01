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
import { useNavigate } from "@tanstack/react-router";

import { TrackChain } from "@/components/spine/TrackChain";
import { TrackActivity } from "@/components/spine/TrackActivity";
import { RunPresence } from "@/components/presence/RunPresence";
import { LiveWork, useCurrentTool } from "@/components/track/LiveWork";
import { Teammates, type LiveSeat } from "@/components/presence/Teammates";
import { ArtifactPane } from "@/components/track/ArtifactPane";
import { TrackConsent } from "@/components/track/TrackConsent";
import { Action, Door, Region } from "@/components/meridian/surface-parts";
import { Row } from "@/components/meridian/rows";
import { StatusChip } from "@/components/meridian/StatusChip";
import { Receipt } from "@/components/meridian/Receipt";
import { RunMap } from "@/components/meridian/RunMap";
import { StepMeter } from "@/components/meridian/progress";
import { useElapsed } from "@/components/meridian/use-elapsed";
import {
  driveTrackNow,
  getTrack,
  getTrackChain,
  getTrackArtifacts,
  retryStation,
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
import { RunCost } from "@/components/track/RunCost";
import { triesLine } from "@/components/track/hold-tries";
import { wayOut } from "@/components/track/way-out";
import { buildBlocked } from "@/components/track/build-precondition";
import { canDispatchToRepo } from "@/lib/new-build.functions";
import { useWorkspace } from "@/hooks/use-workspace";
import { takeOver } from "@/components/track/take-over";
import type { SpineRoute } from "@/lib/spine/route";
import { runPosition } from "@/components/track/run-position";

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

/**
 * THE LIVE ROUTE HEADER: where it is, what it is doing, how far through, how long.
 *
 * ── WHAT THIS REPLACES ──────────────────────────────────────────────────
 * One row, rendered only while a walk was in flight, reading `At Build / Watch
 * as it moves through the route.` with `Elapsed: just started` under it. It
 * answered none of the four questions on arrival, because on arrival there is
 * no walk in flight and the whole block was unmounted -- which is the state a
 * person actually lands in, 58 tracks out of 59.
 *
 * ── THE ROUTE IS `RunMap`, MOUNTED RATHER THAN REBUILT ──────────────────
 * `RunMap` was built on 2026-08-20, is good, and had exactly one caller: the
 * component gallery. It could not be mounted here because it drew its seven
 * stations horizontally at 168px each, about 1176px, inside a rail of
 * `clamp(300px, 38%, 440px)` -- recorded as SPEC-LAYOUT gap G3. It now takes an
 * `orientation`, so this is the same component in the same vocabulary rather
 * than a second route renderer that would drift from it.
 *
 * It is deliberately passed NO `outcome` text. What each station FILED is the
 * question `TrackChain` answers in the pane beside this one, and answering it
 * twice in two rhythms is how one run comes to have four views. This one
 * answers position and what is holding it, and stops there.
 *
 * ── THE CLOCK IS HONEST ABOUT WHICH INTERVAL IT MEASURES ────────────────
 * `spine_tracks.driven_at` is written by eleven exit paths in `driver.server.ts`
 * as `new Date().toISOString()` at the moment the row is written, AFTER a seat
 * resolves. It is therefore a stamp of when the work last MOVED, not when the
 * current station started, and a clock counting up from it would report an
 * interval nobody asked about. That is SPEC-LAYOUT gap G10 and it is still
 * open, so this draws the two clocks that ARE defensible:
 *
 *   while a walk is in flight   the age of THIS WALK, from the moment the
 *     mutation went pending in this tab. Ticks in tenths through `useElapsed`,
 *     which is the system's one timer, and it is labelled "Walking for" rather
 *     than "at this station" because that is what it measures.
 *   otherwise                   how long ago it last moved, from `driven_at`,
 *     which is exactly what that column knows.
 *   never driven                said in those words. A zero on a clock and a
 *     run that has never started are opposite facts.
 */
function RunRouteHeader({
  track,
  walking,
  walkStartedAt,
  continuing,
  legsLeft,
  nowMs,
}: {
  track: Track;
  /**
   * A drive is in flight from this tab. The one input that is not a row.
   *
   * THE WHOLE PRESS, NOT ONE LEG. `run.isPending` drops to false for the 500ms
   * between automatic legs, so wiring that in alone would flip the live station
   * from `working` back to `here` and forward again on every leg -- a rail that
   * flickers eight times during one uninterrupted walk. `walkingMidRoute` is
   * the flag that spans the press, and it is the one the hold banner already
   * yields to for the same reason (F-46/R027).
   */
  walking: boolean;
  /** When this press began, or null when nothing is walking. */
  walkStartedAt: number | null;
  continuing: boolean;
  legsLeft: number;
  nowMs: number;
}) {
  const { stops, meter } = runPosition(track, walking);
  /* `active` follows the walk, so a parked run pays for no interval at all --
     `useElapsed`'s own contract, and the reason it takes the flag. */
  const walked = useElapsed(walkStartedAt ?? undefined, walkStartedAt !== null);

  const stationName = AGENT_STATIONS[track.station]?.name ?? track.station;
  const tone = holdTone(track.holdReason);
  const terminallyStopped = nothingIsComing(track.holdReason);

  /** How long, in the words of whichever interval is actually known. */
  const clock =
    walkStartedAt !== null
      ? `Walking for ${walked}`
      : track.drivenAt
        ? `Last moved ${relativeTime(track.drivenAt, nowMs)}`
        : "Never driven";

  /**
   * WHAT IT IS DOING, in one sentence, and every branch is a row or the walk.
   *
   * THE HOLD BRANCH IS DELIBERATELY THE SHORT FORM. `holdLine`'s full sentence
   * is already rendered twice further down this pane -- on the map's own stop,
   * where it is attached to the station it is about, and in "Why it stopped",
   * which carries the control that clears it. Printing it a third time in the
   * heading would spend the first line a person reads on a sentence they are
   * about to read again, so this says WHICH KIND of stop it is and leaves the
   * reason to the two places that can act on it. It is never a re-wording:
   * these are `StatusChip`'s own words for the two tones, which is the one
   * vocabulary the driver, the map and the banner all share.
   */
  const doing = continuing
    ? `An agent is walking the route. ${legsLeft} more automatic ${legsLeft === 1 ? "leg" : "legs"} on this press.`
    : walking
      ? "An agent is working here now."
      : track.status === "done"
        ? "It reached the end of its route."
        : track.status === "abandoned"
          ? "This work was abandoned here."
          : tone === "you"
            ? /*
               * The fourth surface on one screen carrying this claim, and the
               * argument is `run-status.ts`'s in full: four of the six reasons
               * `holdTone` calls "you" are the whole of `TERMINAL_HOLDS`, and
               * 36 of the 37 open tracks reaching here have nothing pending
               * for anybody. This line sits directly above "Why it stopped",
               * which is where `way-out.ts` names the restart, so saying
               * "waiting" here contradicted the paragraph under it.
               */
              terminallyStopped
              ? "It stopped here, and nothing will pick it up again on its own."
              : "It is waiting on you."
            : tone === "hold"
              ? "It is on hold."
              : track.drivenAt
                ? "Nothing is driving it right now."
                : "It has not been driven yet.";

  /*
   * THE FINISHED-RUN COLLAPSE (SPEC-LAYOUT §5.2). A finished route's step list
   * collapses to one settled line -- the walk is over, and seven rows of
   * history push everything a person came back to read below the fold. The
   * line counts what actually happened off the same derived stops the map
   * draws, so the two can never disagree; clicking it re-expands, and replay
   * mode strips the map of every live control.
   */
  const settled = track.status === "done";
  const [expanded, setExpanded] = React.useState(false);
  const ranCount = stops.filter((s) => s.state === "done").length;
  const waivedCount = stops.filter((s) => s.state === "skipped").length;
  const collapsedLine = [
    `${stops.length} stations`,
    `${ranCount} ran`,
    ...(waivedCount > 0 ? [`${waivedCount} taken off the route`] : []),
    clock,
  ].join(" · ");

  if (settled && !expanded) {
    return (
      <Region title="Route complete" sub={doing}>
        <button
          type="button"
          data-mrd=""
          onClick={() => setExpanded(true)}
          aria-expanded={false}
          className="flex w-full items-center justify-between gap-mrd-3 rounded-mrd-chip px-mrd-3 py-mrd-2 text-left transition-colors enabled:hover:bg-mrd-hover"
          style={{ transitionDuration: "var(--mrd-d-press)" }}
        >
          <span className="mrd-meta">{collapsedLine}</span>
          <span className="text-mrd-small font-medium text-mrd-body">Show them</span>
        </button>
      </Region>
    );
  }

  return (
    <Region title={settled ? "Route complete" : `At ${stationName}`} sub={doing}>
      <div className="flex flex-col gap-mrd-4">
        <StepMeter noun="Station" steps={meter} note={clock} />
        {settled ? (
          <div className="flex flex-col gap-mrd-2">
            <RunMap
              stops={stops}
              mode="replay"
              orientation="stack"
              label="The route this work took"
            />
            <div>
              <Action variant="quiet" onClick={() => setExpanded(false)}>
                Collapse the route again
              </Action>
            </div>
          </div>
        ) : (
          <RunMap stops={stops} mode="live" orientation="stack" label="The route this work takes" />
        )}
      </div>
    </Region>
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
  onCrewLive,
  onDriveState,
  crewLive = false,
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
  onDriveState?: (s: { canStop: boolean; stop: () => void }) => void;
  /**
   * RUN-02: the same live fact, handed BACK by the composition, so this pane's
   * own presence reads it. A run driven by the sweep while this tab was closed
   * used to render the character as "Ready when you are" above a transcript
   * that said Working -- two sentences about one moment, and the quiet one was
   * the lie.
   */
  crewLive?: boolean;
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
        consequence:
          "The station runs again on its next turn. Press Run it now to walk it immediately.",
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

  /*
   * WHEN THIS PRESS STARTED WALKING, which is the only interval this client can
   * honestly put a ticking clock on.
   *
   * `spine_tracks.driven_at` stamps the END of a leg (eleven writes in
   * `driver.server.ts`, all `new Date().toISOString()` at row-write time), so
   * counting up from it measures time since the work last MOVED rather than
   * time at the station -- SPEC-LAYOUT gap G10, still open. `useElapsed`'s own
   * header is explicit that a timer reporting the age of the COMPONENT instead
   * of the age of the WORK is "actively misleading", so this records a real
   * instant instead: the moment this tab's press began.
   *
   * IT SPANS THE WHOLE PRESS, not one leg. `run.isPending` drops to false for
   * the 500ms between automatic legs, and a clock that reset there would report
   * a two-minute walk as a series of eight-second ones.
   */
  const [walkStartedAt, setWalkStartedAt] = React.useState<number | null>(null);
  React.useEffect(() => {
    setWalkStartedAt((prev) => (walkingMidRoute ? (prev ?? Date.now()) : null));
  }, [walkingMidRoute]);

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
   * WHO is working, not just whether anyone is. One teammate stays one
   * character (SPEC-PRESENCE); two or more are drawn each with its own colour
   * and name (SPEC-MULTIPLAYER-PRESENCE §1), and both read the same run rows.
   */
  const [seats, setSeats] = React.useState<LiveSeat[]>([]);

  const stopRef = React.useRef<() => void>(() => undefined);
  stopRef.current = () => setLegsLeft(0);
  /*
   * `continuing` ALONE WAS NOT ENOUGH, and driving it is what showed that.
   * It is true only BETWEEN legs -- `legsLeft > 0` AND a returned result that
   * stopped out-of-window with more to do. While a leg is actually in flight it
   * is false, so a Stop gated on it existed for the gaps and not for the walk.
   * Watched live at 36 seconds into a press: the footer correctly said work was
   * happening and offered nothing to stop it. THE-ONE-SCREEN asks for a Stop
   * that always works, and a control that is absent for most of the thing it
   * governs does not.
   *
   * `run.isPending` is this tab's press being in flight, which is exactly the
   * other half. Pressing Stop sets the legs to zero, so nothing further is
   * bought; the leg already running cannot be un-walked, which is why the
   * control has always said "Stop after this leg" rather than "Stop".
   */
  const canStop = continuing || run.isPending;
  React.useEffect(() => {
    onDriveState?.({ canStop, stop: () => stopRef.current() });
  }, [canStop, onDriveState]);

  const showHold = held && !walkingMidRoute && !isCalmHold;
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

  const holdWayOut = wayOut(
    track?.holdReason,
    { undo: Boolean(holdTakeOver?.undoTo), handback: Boolean(holdTakeOver?.handback) },
    track ? (AGENT_STATIONS[track.station]?.name ?? null) : null,
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
      // `r` mirrors the Run-it control exactly, including every state where
      // the control refuses to exist.
      if (finished || walkingMidRoute || run.isPending) return;
      e.preventDefault();
      setLegsLeft(AUTO_MAX);
      run.mutate("press");
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
       * The many-teammate case sits ABOVE the character rather than replacing
       * it: the character is still this run's voice and still says what is
       * happening, and the row of teammates says who is doing it. Below two, it
       * renders nothing at all and the surface is exactly as it was.
       */}
      <Teammates seats={seats} />

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
       * THE LIVE ROUTE HEADER (mission: agentic work must be SEEN, not
       * inferred). It renders whenever there is a track, not only mid-walk:
       * the block it replaces was mounted behind `walkingMidRoute`, so the
       * state a person actually lands in -- parked at a station with nobody
       * driving it, which is 58 of this product's 59 tracks -- showed no
       * position, no route and no clock at all.
       */}
      {track ? (
        <RunRouteHeader
          track={track}
          walking={workingNow}
          walkStartedAt={walkStartedAt}
          continuing={continuing}
          legsLeft={legsLeft}
          nowMs={nowMs}
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
              action={
                /*
                 * THE FIFTH AND LAST COPY OF THIS CLAIM ON ONE SCREEN, and the
                 * one that read worst, because it sat beside the prose that
                 * already contradicted it: "Nothing more will be tried on it
                 * automatically", with a chip next to it saying a person was
                 * being waited on. The words are `run-status.ts`'s, which is
                 * the rule this chip's own sibling comment states -- one
                 * vocabulary shared by the driver, the map and the banner --
                 * so the header chip and this one cannot drift apart.
                 *
                 * Pulse follows the same rule it does there: motion is a claim,
                 * and nothing is moving on a track the sweep has dropped.
                 */
                <StatusChip status={tone} pulse={tone === "you" && !terminallyStopped}>
                  {tone === "you"
                    ? terminallyStopped
                      ? "Needs a restart"
                      : "Waiting on you"
                    : "On hold"}
                </StatusChip>
              }
            />
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
       * THE RUN CONTROL, AND ITS TWO HONEST ABSENCES. A finished route has
       * nothing to drive, so the control is REMOVED and one line takes its
       * place (SPEC-LAYOUT §5.4) -- a greyed primary that looks pressable and
       * does nothing is the affordance failure this surface already paid for
       * once on RunMap's own Stop. Abandoned work says the same in its own
       * words; the steer box below carries the way back either way.
       */}
      <Region
        /*
         * ONE SENTENCE WHEN THERE IS NOTHING TO DRIVE, NOT THREE.
         *
         * A finished run used to say it three times in one column: the heading
         * carried "(done)", the sub said "This walk is finished", and a row
         * under them said "It reached the end of its route" -- with the status
         * chip at the top of the page already saying Finished. An abandoned one
         * was worse than repetitive: the sub described the control's normal job,
         * "walks this work through its route now", on a run that cannot be
         * walked, and then repeated the header's own sentence back.
         *
         * So the closed case gets one line that says what happened AND what it
         * means for this control, which is the only part the header did not
         * already cover. The heading stays plain: the chip and this sentence
         * both carry the state, and a third copy in the heading is the one that
         * was earning nothing.
         */
        title="Run it"
        sub={
          track?.status === "done"
            ? "This walk is finished, so there is nothing left to drive."
            : track?.status === "abandoned"
              ? "This work was abandoned, so there is nothing left to drive."
              : "Walks this work through its route now, station by station, and stops the moment something needs you."
        }
      >
        {track?.status === "done" || track?.status === "abandoned" ? null : continuing ? (
          /*
           * THE STOP IS NOT HERE ANY MORE, and that is the ruling rather than a
           * tidy-up. THE-ONE-SCREEN:21 puts it in the footer under both panes,
           * and the reason is legibility: it used to sit inside the same box as
           * Run it, so stopping a run meant scrolling back to the control you
           * started it from. There is exactly ONE Stop on this surface and it
           * is the footer's; a second copy here would be the duplication this
           * screen keeps being repaired for.
           */
          <Action variant="primary" busy onClick={() => undefined}>
            Walking the route
          </Action>
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
                lead={`It walked every automatic leg (${AUTO_MAX}) and still has route ahead.`}
                sub="Nothing was stopped silently: press Run it now to buy another set of legs."
              />
            ) : null}
            {/*
             * THE PER-SEAT LIST IS DELIBERATELY ABSENT (SPEC-LAYOUT §0 ruled
             * this deletion; it never landed). The transcript below already
             * renders every seat the moment its run row lands -- who acted,
             * what they filed, what it cost. Printing the same walk a second
             * time from the mutation's return value meant one fact about one
             * run with two freshesses, which is how a header once said Running
             * over a hold. The mutation's own outcome above is the only thing
             * here that the queries cannot say.
             */}
          </div>
        ) : null}
      </Region>

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
      <TrackActivity trackId={trackId} onLiveChange={onCrewLive} onLiveSeats={setSeats} />

      {/*
       * THE STEER BOX (RUN-03), AT THE PANE'S FOOT -- below the transcript,
       * where a reader finishes and answers, sticky so a long record never
       * buries it. One instruction back into moving work from the surface the
       * work is on; `steerTrack` existed with zero callers until this mounted,
       * which made Start and Stop the run's whole vocabulary. The finished case
       * says so rather than rendering a form that can do nothing. `/` from
       * anywhere on this page lands here (RUN-10).
       */}
      <SteerComposer trackId={trackId} finished={finished} fieldRef={steerFieldRef} />
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
  promised = null,
}: {
  trackId: string;
  isRunning?: boolean;
  /** RUN-08: the person's opening sentence, for the value audit beside the record. */
  promised?: string | null;
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
      {/*
       * ── WHAT IT IS DOING RIGHT NOW, CALL BY CALL (2026-09-01) ────────────
       *
       * The goal names this the most essential requirement: *"the agent's
       * activity must be visible in real time ... never a blank screen with a
       * spinner while something runs behind it."* This surface met the letter
       * of that -- there is no spinner anywhere on it -- and missed the point.
       * The transcript's finest grain is one row per SEAT'S TURN, so while a
       * station ran it said "Draft is working" and a ticking clock, unchanged,
       * for however long the model took.
       *
       * IT SITS UNDER THE ROUTE AND ABOVE THE COST, which is the order a
       * person asks in: where is this, what is it doing, what has it cost.
       * `TrackChain` above it is the plan; this is the execution; `RunCost`
       * below is the bill.
       *
       * IN THE ARTIFACT PANE RATHER THAN THE TRANSCRIPT, and that is a real
       * choice. The left pane is the NARRATIVE -- who acted, what they handed
       * on, where it needs you -- and a hundred `repo.read` lines would bury
       * the handoff that is the product's whole claim. The right pane is what
       * the run PRODUCED, and the call log is exactly that: the evidence under
       * the artifacts sitting above it.
       */}
      <LiveWork trackId={trackId} running={isRunning} />
      <RunCost trackId={trackId} promised={promised} />
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
  return (
    <div className="flex flex-col gap-mrd-6">
      <TrackRunLeft
        trackId={trackId}
        autoStart={autoStart}
        onCrewLive={setCrewLive}
        crewLive={crewLive}
      />
      <TrackPaneRight trackId={trackId} isRunning={crewLive} />
    </div>
  );
}

export default TrackRun;
