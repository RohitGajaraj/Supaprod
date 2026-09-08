import type { AgentStation } from "@/lib/agent-vocabulary";

/**
 * HOW LONG A STATION USUALLY TAKES HERE, FROM THE RECORD OF STATIONS THAT FINISHED.
 *
 * The home's working node and row say "Discover, 2m 10s" and nothing about
 * how long Discover usually takes, so a person cannot tell a normal wait from
 * a stuck one. `stage_events` holds every move a track made (from_stage,
 * to_stage, at); a station's duration is the time between the move that
 * arrived at it and the move that left it. Only stations that were LEFT are
 * counted: a station still in progress has no duration yet, and counting it
 * as "so far" would pull every median toward the present.
 *
 * A move backward (design to define, a correction) still leaves a station,
 * and that time was spent there, so it counts. The first station's arrival is
 * the track's own creation, since no move brought it there.
 *
 * PURE. The median is over the samples that left in the last thirty days;
 * a station with none in the window falls back to every sample the workspace
 * has, and says so with `window`; a station with none at all is null and n
 * is zero, never a number invented from another station.
 */
export type StationTiming = {
  /** The median duration in milliseconds, or null when nothing has finished here. */
  p50Ms: number | null;
  /** How many finished stations the median is over. */
  n: number;
  /** Which samples: the last thirty days, all the workspace has, or none. */
  window: "30d" | "all" | null;
};

export type StationTimings = { byStation: Record<AgentStation, StationTiming> };

export const STATIONS: readonly AgentStation[] = [
  "sense",
  "decide",
  "define",
  "design",
  "build",
  "ship",
  "learn",
];

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export type StageMove = {
  entity_id: string;
  from_stage: string | null;
  to_stage: string;
  at: string;
};

export type TrackStart = { id: string; created_at: string };

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid]! : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
}

/** Every finished station as (station, left-at, duration), from moves in any order. */
export function finishedStations(
  moves: readonly StageMove[],
  tracks: readonly TrackStart[],
): Array<{ station: AgentStation; leftAt: number; ms: number }> {
  const createdAt = new Map(tracks.map((t) => [t.id, Date.parse(t.created_at)]));
  const byTrack = new Map<string, StageMove[]>();
  for (const m of moves) {
    if (!byTrack.has(m.entity_id)) byTrack.set(m.entity_id, []);
    byTrack.get(m.entity_id)!.push(m);
  }
  const out: Array<{ station: AgentStation; leftAt: number; ms: number }> = [];
  for (const [trackId, list] of byTrack) {
    const sorted = [...list].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
    // Arrival at the current station: the last move's `at`, or the track's creation.
    let arrivedAt = createdAt.get(trackId) ?? null;
    let standingAt: string | null = null;
    for (const m of sorted) {
      const leftAt = Date.parse(m.at);
      const leaving = (m.from_stage ?? standingAt) as AgentStation | null;
      if (leaving && STATIONS.includes(leaving) && arrivedAt !== null && leftAt >= arrivedAt) {
        out.push({ station: leaving, leftAt, ms: leftAt - arrivedAt });
      }
      standingAt = m.to_stage;
      arrivedAt = leftAt;
    }
  }
  return out;
}

export function stationTimingsFrom(
  moves: readonly StageMove[],
  tracks: readonly TrackStart[],
  nowIso: string,
): StationTimings {
  const finished = finishedStations(moves, tracks);
  const since = Date.parse(nowIso) - THIRTY_DAYS_MS;
  const byStation = {} as Record<AgentStation, StationTiming>;
  for (const station of STATIONS) {
    const all = finished.filter((f) => f.station === station);
    const recent = all.filter((f) => f.leftAt >= since);
    const pick = recent.length > 0 ? recent : all;
    const p50Ms = median(pick.map((f) => f.ms));
    byStation[station] = {
      p50Ms,
      n: pick.length,
      window: pick.length === 0 ? null : recent.length > 0 ? "30d" : "all",
    };
  }
  return { byStation };
}
