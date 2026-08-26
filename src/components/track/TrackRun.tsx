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
import { RunPresence } from "@/components/presence/RunPresence";
import { ArtifactPane } from "@/components/track/ArtifactPane";
import { TrackConsent } from "@/components/track/TrackConsent";
import { Action, Region } from "@/components/meridian/surface-parts";
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
import { SteerComposer } from "@/components/track/SteerComposer";
import { RunCost } from "@/components/track/RunCost";
import { triesLine } from "@/components/track/hold-tries";
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
            ? "It is waiting on you."
            : tone === "hold"
              ? "It is on hold."
              : track.drivenAt
                ? "Nothing is driving it right now."
                : "It has not been driven yet.";

  return (
    <Region title={`At ${stationName}`} sub={doing}>
      <div className="flex flex-col gap-mrd-4">
        <StepMeter noun="Station" steps={meter} note={clock} />
        <RunMap stops={stops} mode="live" orientation="stack" label="The route this work takes" />
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

  const showHold = held && !walkingMidRoute && !isCalmHold;
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
       * QUEUE 71: THE PANE POLLS AT VISIT SPEED WHENEVER A CREW IS HERE, not
       * only while this screen's own press is walking. The sweep serves tracks
       * with nothing pressed anywhere, and its running rows are the one honest
       * signal of that; the transcript reports them upward and both panes
       * follow. When no row says running or queued, nothing speeds up and
       * nothing pulses -- an idle track reads idle.
       */}
      <TrackActivity trackId={trackId} onLiveChange={onCrewLive} />

      {/*
       * THE STEER BOX (RUN-03), AT THE PANE'S FOOT -- below the transcript,
       * where a reader finishes and answers, sticky so a long record never
       * buries it. One instruction back into moving work from the surface the
       * work is on; `steerTrack` existed with zero callers until this mounted,
       * which made Start and Stop the run's whole vocabulary. The finished case
       * says so rather than rendering a form that can do nothing.
       */}
      <SteerComposer
        trackId={trackId}
        finished={track?.status === "done" || track?.status === "abandoned"}
      />
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
