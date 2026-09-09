/**
 * A RUN'S ROW, READ AS A POSITION ON THE ROAD.
 *
 * `listRunsForStart` already answers every question the Journey drawing asks:
 * which station, whether a seat is inside it, whether a person is required,
 * what stopped it, what it filed and how the forecast was graded. This file
 * turns those row facts into Journey stations, and nothing here reads the
 * database or guesses from elapsed time.
 *
 * Two readers: `journeyOfRun` draws one run's row mark; `journeyMap` draws
 * the home's map of where every open run stands, counted per station.
 */
import {
  JOURNEY_ORDER,
  type JourneyKey,
  type JourneyStation,
  type JourneyState,
} from "@/components/meridian/Journey";
import { KIND_WORD, STATION_ARTIFACT } from "@/lib/spine/attach";
import type { StartRun } from "@/lib/spine/track.functions";
import { holdTone } from "@/lib/spine/driver";
import { STALL_MINUTES } from "@/lib/loop-health.functions";
import { presenceColour } from "@/components/meridian/AgentPresence";
import { nothingIsComing } from "@/components/track/nothing-is-coming";

export type RunLike = Pick<
  StartRun,
  | "station"
  | "status"
  | "working"
  | "needsYou"
  | "holdReason"
  | "holdBecause"
  | "produced"
  | "forecast"
  | "drivenAt"
>;

/** The horizon wait's own sentence, composed by the driver (P-144). A wait
 *  for a date the machine already knows is scheduled, not held. */
const HORIZON = /comes due|returns on|graded on/i;

/**
 * ONE PREDICATE, EVERY READER. The home used to keep its own list of "held"
 * reasons, and it disagreed with the driver's: a call the driver marks as a
 * person's ("the-call-is-yours") drew a grey wait, and a stop the driver
 * calls final ("corrections-spent") drew Decide over a card that rendered
 * nothing (entry review, 2026-09-08). So the state is read from the sets
 * the driver itself decides with: `holdTone` says whose the hold is, and
 * `nothingIsComing` says whether the loop will ever move it again, the same
 * two the run screen's `runNow` reads. A calendar wait is still neutral
 * and still comes first.
 */
export function standingState(r: RunLike): JourneyState {
  if (r.status === "abandoned") return "failed";
  if (r.needsYou) return "you";
  if (r.working) return "working";
  if (r.holdBecause && HORIZON.test(r.holdBecause)) return "scheduled";
  const tone = holdTone(r.holdReason);
  /* A hold the driver marks as the person's with nothing coming is
     `stopped`, painted in the you hue: it used to be `held`, so the row's
     mark wore the amber the system defines as "not on a person" over a card
     that said "Stopped" in orchid (fourth review, 2026-09-09). `held` is
     only ever a hold on a condition. */
  if (tone === "you") return nothingIsComing(r.holdReason) ? "stopped" : "you";
  if (tone === "hold") return "held";
  return "waiting";
}

/**
 * THE ROAD'S MODE ON THE HOME, from the runs read. The promise (every stop
 * pending, each with what it hands on) is for the account that has never
 * pressed Enter; once anything has run, the road is a map, even the morning
 * after the only run finished. It used to reset to the promise whenever no
 * run was open, and the starter cards came back above a Finished row
 * (fourth review, 2026-09-09).
 */
export function homeRoadMode(runs: ReadonlyArray<Pick<RunLike, "status">>): "promise" | "map" {
  return runs.length === 0 ? "promise" : "map";
}

/**
 * Whether the three starter runs stand on the home: only from an ANSWERED
 * runs read (a failed one drew the day-one cards on a workspace with twelve
 * runs), and only while nothing is open, nothing has finished and no bet has
 * arrived. An abandoned first try still leaves the other two.
 */
export function startersStand(
  runs: ReadonlyArray<Pick<RunLike, "status">> | undefined,
  betsCount: number,
): boolean {
  if (runs === undefined || betsCount > 0) return false;
  return !runs.some((r) => r.status === "open" || r.status === "done");
}

/**
 * A person's call that has no gate under it: the driver says the hold is
 * theirs and nothing is coming, but there is no approval row to answer in
 * place. The answer lives on the run screen (the Choice, a source to point
 * at), so the row's control opens the run rather than an empty card.
 */
export function callWithoutAGate(r: RunLike): boolean {
  return !r.needsYou && holdTone(r.holdReason) === "you" && !nothingIsComing(r.holdReason);
}

function verdictOf(resolution: string): "pass" | "fail" | "open" {
  if (resolution === "hit") return "pass";
  if (resolution === "miss") return "fail";
  return "open";
}

function producedLine(kind: string, n: number): string | null {
  if (n <= 0) return null;
  const w = KIND_WORD[kind] ?? { one: kind, many: `${kind}s` };
  return `${n} ${n === 1 ? w.one : w.many}`;
}

function quietSince(iso: string | null | undefined, nowMs: number): boolean {
  if (!iso) return false;
  const ms = nowMs - Date.parse(iso);
  return Number.isFinite(ms) && ms > STALL_MINUTES * 60_000;
}

export function journeyOfRun(r: RunLike, nowMs: number = Date.now()): JourneyStation[] {
  const at = JOURNEY_ORDER.indexOf(r.station);
  const byKind = new Map(r.produced.map((p) => [p.kind, p.count] as const));
  return JOURNEY_ORDER.map((key, i) => {
    const outcome = producedLine(
      STATION_ARTIFACT[key].kind,
      byKind.get(STATION_ARTIFACT[key].kind) ?? 0,
    );
    if (r.status === "done") {
      const verdict = key === "learn" && r.forecast ? verdictOf(r.forecast.resolution) : null;
      return { key, state: "done", outcome, verdict };
    }
    if (i < at) return { key, state: "done", outcome };
    if (i === at) {
      /* THE SEAT'S OWN COLOUR ON THE ROW'S MARK. Every working row painted
         the same status azure; the seat's identity never reached the row
         (entry review, 2026-09-08). The mark is filled with the seat's
         presence colour, the same one the strip and the map's dots carry. */
      const presences = r.working
        ? [
            {
              seat: r.working.seat,
              colour: presenceColour(r.working.seat),
              /* Quiet past the stall threshold: the mark keeps the seat's
                 colour but stops breathing (Lane 3's lastCallAt, 2026-09-08). */
              alive: !quietSince(r.working.lastCallAt ?? r.working.since, nowMs),
            },
          ]
        : undefined;
      return { key, state: standingState(r), outcome, at: r.working?.since ?? null, presences };
    }
    return { key, state: "pending" };
  });
}

/** The strongest thing standing at a station names the station's state. */
const WEIGHT: Record<JourneyState, number> = {
  you: 7,
  stopped: 6,
  failed: 5,
  held: 4,
  working: 3,
  scheduled: 2,
  waiting: 1,
  done: 0,
  waived: 0,
  pending: 0,
  /* The home never draws it: the map is built from runs the read returned, so
     a station is only unread on the run screen, where one run's artifacts
     read can refuse on its own (fifth review, 2026-09-09). */
  unread: 0,
};

export function journeyMap(runs: readonly RunLike[]): JourneyStation[] {
  const open = runs.filter((r) => r.status === "open");
  return JOURNEY_ORDER.map((key) => {
    const here = open.filter((r) => r.station === key);
    let state: JourneyState = "pending";
    for (const r of here) {
      const s = standingState(r);
      if (WEIGHT[s] > WEIGHT[state]) state = s;
    }
    /* The earliest seat still inside the station, so the map's working
       stop can say whether the wait is past its usual time. */
    const since = here
      .map((r) => r.working?.since)
      .filter((v): v is string => typeof v === "string" && v.length > 0)
      .sort()[0];
    return { key, state, count: here.length, at: since ?? null };
  });
}

/**
 * THE MAP CARRIES WHO IS WORKING WHERE. The seats come from the same
 * `listRunningNow` read the Working-now strip draws, keyed by station; each
 * is given the presence colour AgentPresence gives it everywhere else, so
 * the road, the strip and the run screen agree on who is who.
 */
export function withPresences(
  stations: readonly JourneyStation[],
  seats: ReadonlyArray<{
    seat: string;
    station: string | null;
    alive?: boolean;
    /** Carried through only when the seat is quiet, so the map's stop can
     *  print the strip's own "quiet for N min" (fourth review, 2026-09-09). */
    quietMs?: number | null;
  }>,
  colourOf: (seat: string) => string,
): JourneyStation[] {
  if (seats.length === 0) return [...stations];
  return stations.map((s) => {
    const here = seats.filter((w) => w.station === s.key);
    if (here.length === 0) return s;
    const seen = new Set<string>();
    const presences = here
      .filter((w) => (seen.has(w.seat) ? false : (seen.add(w.seat), true)))
      .map((w) => ({
        seat: w.seat,
        colour: colourOf(w.seat),
        alive: w.alive ?? true,
        ...(w.quietMs ? { quietMs: w.quietMs } : {}),
      }));
    return { ...s, presences };
  });
}

/** "about 4 min", "about 2 h", "under a minute": the coarseness is the point,
 *  a median is not a promise. */
export function roughDuration(ms: number): string {
  if (ms < 60_000) return "under a minute";
  const min = Math.round(ms / 60_000);
  if (min < 60) return `about ${min} min`;
  const h = Math.round(ms / 3_600_000);
  return `about ${h} h`;
}

/**
 * THE WAIT, DESIGNED RATHER THAN ENDURED. A working station on the map says
 * how long it usually takes here (Lane 3's readStationTimings, the median
 * over this workspace's own finished stations), so a person knows whether
 * two minutes is early or late. Only where the station has no outcome line
 * of its own, and only from a real sample: null p50 says nothing.
 */
export function withTimings(
  stations: readonly JourneyStation[],
  timings: { byStation: Partial<Record<string, { p50Ms: number | null; n: number }>> } | undefined,
  nowMs: number = Date.now(),
): JourneyStation[] {
  if (!timings) return [...stations];
  return stations.map((s) => {
    if (s.state !== "working" || s.outcome) return s;
    const t = timings.byStation[s.key];
    if (!t || t.p50Ms === null || t.n === 0) return s;
    const usual = roughDuration(t.p50Ms);
    const started = s.at ? Date.parse(s.at) : NaN;
    /* Past its usual time: a fact a person can act on, said plainly, with
       the usual time beside it so "past" has a size. */
    if (Number.isFinite(started) && nowMs - started > t.p50Ms) {
      return { ...s, outcome: `past its usual time here (${usual})` };
    }
    return { ...s, outcome: `usually ${usual} here` };
  });
}

export function keyOfStation(station: string): JourneyKey | null {
  return (JOURNEY_ORDER as readonly string[]).includes(station) ? (station as JourneyKey) : null;
}
