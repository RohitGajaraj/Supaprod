import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { finishedStations, stationTimingsFrom, type StageMove } from "./station-timings";

const NOW = "2026-09-08T12:00:00.000Z";
const ago = (days: number, hoursLater = 0) =>
  new Date(Date.parse(NOW) - days * 86_400_000 + hoursLater * 3_600_000).toISOString();
const move = (id: string, from: string | null, to: string, at: string): StageMove => ({
  entity_id: id,
  from_stage: from,
  to_stage: to,
  at,
});

describe("how long a station usually takes here", () => {
  it("a station's duration runs from the move that arrived to the move that left", () => {
    const tracks = [{ id: "t1", created_at: ago(1) }];
    const moves = [
      move("t1", "sense", "decide", ago(1, 2)),
      move("t1", "decide", "define", ago(1, 3)),
    ];
    expect(finishedStations(moves, tracks)).toEqual([
      { station: "sense", leftAt: Date.parse(ago(1, 2)), ms: 2 * 3_600_000 },
      { station: "decide", leftAt: Date.parse(ago(1, 3)), ms: 3_600_000 },
    ]);
  });

  it("a station still in progress is not counted, and a move backward still leaves one", () => {
    const tracks = [{ id: "t1", created_at: ago(2) }];
    const moves = [
      move("t1", "sense", "decide", ago(2, 1)),
      move("t1", "decide", "define", ago(2, 2)),
      move("t1", "define", "design", ago(2, 4)),
      move("t1", "design", "define", ago(2, 5)), // correction: design was left after an hour
    ];
    const f = finishedStations(moves, tracks);
    expect(f.map((x) => x.station)).toEqual(["sense", "decide", "define", "design"]);
    expect(f[3]?.ms).toBe(3_600_000);
    // define is in progress again: no fifth sample.
  });

  it("the median is over the last thirty days, falls back to all, and is null with nothing", () => {
    const tracks = [
      { id: "old", created_at: ago(60) },
      { id: "a", created_at: ago(3) },
      { id: "b", created_at: ago(2) },
      { id: "c", created_at: ago(1) },
    ];
    const moves = [
      move("old", "sense", "decide", ago(60, 10)), // 10h, old
      move("old", "decide", "define", ago(60, 11)), // decide 1h, old and the only decide sample
      move("a", "sense", "decide", ago(3, 1)),
      move("b", "sense", "decide", ago(2, 2)),
      move("c", "sense", "decide", ago(1, 4)),
    ];
    const t = stationTimingsFrom(moves, tracks, NOW);
    expect(t.byStation.sense).toEqual({ p50Ms: 2 * 3_600_000, n: 3, window: "30d" });
    expect(t.byStation.decide).toEqual({ p50Ms: 3_600_000, n: 1, window: "all" });
    expect(t.byStation.build).toEqual({ p50Ms: null, n: 0, window: null });
  });

  it("an even count takes the mean of the middle two", () => {
    const tracks = [
      { id: "a", created_at: ago(1) },
      { id: "b", created_at: ago(1) },
    ];
    const moves = [
      move("a", "sense", "decide", ago(1, 1)),
      move("b", "sense", "decide", ago(1, 3)),
    ];
    expect(stationTimingsFrom(moves, tracks, NOW).byStation.sense.p50Ms).toBe(2 * 3_600_000);
  });

  it("the reader names its workspace and hands the rows to the pure half", () => {
    const src = readFileSync("src/lib/spine/track.functions.ts", "utf8");
    const from = src.indexOf("export const readStationTimings");
    const end = src.indexOf("\nexport ", from + 1);
    const body = src.slice(from, end);
    expect(from).toBeGreaterThan(-1);
    expect(body).toContain('.eq("workspace_id", data.workspaceId)');
    expect(body).toContain('.eq("entity_type", "spine_track")');
    expect(body).toContain("stationTimingsFrom(");
  });
});
