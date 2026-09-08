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

/**
 * The hold reasons that mean "stopped on a condition that must change". The
 * ones NOT here are either a person's call (`needsYou` carries that), a
 * finished route, or a note that rides along with a move.
 */
const HELD: ReadonlySet<string> = new Set([
  "paused",
  "no-agent",
  "produced-nothing",
  "self-check-failed",
  "nothing-to-hand-on",
  "stalled",
  "over-budget",
  "out-of-time",
  "out-of-credit",
  "going-in-circles",
  "tools-refused",
  "corrections-spent",
  "given-up",
  "station-cannot-finish",
  /* A route that skips a station the work needs. Seen live 12:37 IST 09-08:
     the row said "Put it back, or file it yourself" and offered neither,
     because the reason was not counted as held and so drew no Decide. */
  "needs-a-waived-station",
]);

/** The horizon wait's own sentence, composed by the driver (P-144). A wait
 *  for a date the machine already knows is scheduled, not held. */
const HORIZON = /comes due|returns on|graded on/i;

export function standingState(r: RunLike): JourneyState {
  if (r.status === "abandoned") return "failed";
  if (r.needsYou) return "you";
  if (r.working) return "working";
  if (r.holdReason && HELD.has(r.holdReason)) return "held";
  if (r.holdBecause && HORIZON.test(r.holdBecause)) return "scheduled";
  return "waiting";
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

export function journeyOfRun(r: RunLike): JourneyStation[] {
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
      return { key, state: standingState(r), outcome, at: r.working?.since ?? null };
    }
    return { key, state: "pending" };
  });
}

/** The strongest thing standing at a station names the station's state. */
const WEIGHT: Record<JourneyState, number> = {
  you: 6,
  failed: 5,
  held: 4,
  working: 3,
  scheduled: 2,
  waiting: 1,
  done: 0,
  waived: 0,
  pending: 0,
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
    return { key, state, count: here.length };
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
  seats: ReadonlyArray<{ seat: string; station: string | null }>,
  colourOf: (seat: string) => string,
): JourneyStation[] {
  if (seats.length === 0) return [...stations];
  return stations.map((s) => {
    const here = seats.filter((w) => w.station === s.key);
    if (here.length === 0) return s;
    const seen = new Set<string>();
    const presences = here
      .filter((w) => (seen.has(w.seat) ? false : (seen.add(w.seat), true)))
      .map((w) => ({ seat: w.seat, colour: colourOf(w.seat) }));
    return { ...s, presences };
  });
}

export function keyOfStation(station: string): JourneyKey | null {
  return (JOURNEY_ORDER as readonly string[]).includes(station) ? (station as JourneyKey) : null;
}
