/**
 * A station whose crew the clock split across two ticks has not filed nothing.
 *
 * WHY THIS EXISTS, and it is the wall the first end-to-end run actually died on.
 *
 * The seat cursor fixed the SPENDING half of a split crew: a station cut off by
 * the tick deadline resumes at the seat it still owes instead of paying for its
 * first seat again. It left the VERDICT half broken. The tick that finishes the
 * crew judges the station on `attached` -- what the seats in THAT tick filed --
 * so a crew whose producing seat ran in the earlier tick and whose checking seat
 * runs in the later one reads as "ran cleanly, filed nothing". That is
 * `produced-nothing`, it counts an attempt, and three of them is `given-up`.
 *
 * MEASURED 2026-08-24 on the only live workspace, `0b792d52`. Track `f9e41393`
 * at Decide, whose crew is `strategist` then `critic`:
 *
 *   20:40:31  strategist  53.7s  -> decision eec7780d filed 20:41:28
 *   20:50:35  critic      21.0s  -> harvest empty, attempt 1
 *   21:00:31  strategist  42.7s  -> decision e67ae002 filed 21:01:18
 *   21:10:01  critic      15.6s  -> harvest empty, attempt 2
 *   21:20:01  strategist  41.6s  -> decision 7b43fd8e filed 21:20:46
 *   21:30:04  critic      18.9s  -> harvest empty, attempt 3  -> given-up
 *
 * Three decisions on the record, three `spine_track_members` rows at `decide`,
 * and the driver gave up on the station that wrote them. Every strategist run
 * exceeded the 45s deadline BY ITSELF, so the split was structural: that crew
 * could never once have reached its second seat in the same tick, and therefore
 * could never have advanced. 23 of the 59 tracks in that workspace were sitting
 * on `out-of-time` when this was found.
 *
 * WHAT THIS FILE GUARDS IN THE OTHER DIRECTION. A rule that lets work advance is
 * dangerous exactly where a rule that blocks it is safe, so most of what follows
 * asserts the loosening cannot reach the ordinary path: an unresumed crew that
 * files nothing must still be `produced-nothing`, and a resumed crew whose
 * earlier seats also filed nothing must still be `produced-nothing`.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "bun:test";

import { didStationProduce, resumeSeatFrom, stationCrew } from "./driver";
import { TICK_DEADLINE_MS } from "./track-caps.server";

describe("a crew split by the clock is judged on what the station filed", () => {
  /**
   * THE LIVE FAILURE, replayed. The critic tick harvests nothing because the
   * critic files nothing -- that is its job -- and the decision the strategist
   * filed one tick earlier is on the record at this station, on this visit.
   */
  it("the tick that finishes a resumed crew counts the earlier seat's work", () => {
    expect(
      didStationProduce({ attachedCount: 0, startSeat: 1, filedAtStationSinceArrival: true }),
    ).toBe(true);
  });

  it("a resumed crew whose earlier seats also filed nothing is still empty", () => {
    expect(
      didStationProduce({ attachedCount: 0, startSeat: 1, filedAtStationSinceArrival: false }),
    ).toBe(false);
  });

  /**
   * The ordinary path is untouched, and this is the assertion that says so. A
   * station that ran its whole crew in one tick and filed nothing has filed
   * nothing; there is no earlier tick for its output to be hiding in.
   */
  it("an unresumed crew that files nothing is still produced-nothing", () => {
    expect(
      didStationProduce({ attachedCount: 0, startSeat: 0, filedAtStationSinceArrival: null }),
    ).toBe(false);
    // Even if a caller wrongly supplied a yes, the unresumed path ignores it.
    expect(
      didStationProduce({ attachedCount: 0, startSeat: 0, filedAtStationSinceArrival: true }),
    ).toBe(false);
  });

  it("a station that filed in this tick needs no record lookup at all", () => {
    expect(
      didStationProduce({ attachedCount: 2, startSeat: 0, filedAtStationSinceArrival: null }),
    ).toBe(true);
    expect(
      didStationProduce({ attachedCount: 1, startSeat: 1, filedAtStationSinceArrival: null }),
    ).toBe(true);
  });

  /**
   * An unreadable trail must not advance work. `stationFiledSinceArrival`
   * returns false when it cannot resolve an arrival stamp, and this pins the
   * direction that failure has to fail in.
   */
  it("cannot advance on an answer nobody could read", () => {
    expect(
      didStationProduce({ attachedCount: 0, startSeat: 2, filedAtStationSinceArrival: null }),
    ).toBe(false);
  });
});

describe("the shape that made the defect reachable is still real", () => {
  /**
   * The premise. A cursor can only be non-zero while a real station's crew can
   * cost more than the window it shares, and the verdict can only disagree with
   * the harvest while a crew has more than one seat.
   */
  it("a real station still has a crew that can be split", () => {
    expect(TICK_DEADLINE_MS).toBeGreaterThan(0);
    expect(stationCrew("decide").length).toBeGreaterThan(1);
    // Resuming at seat 1 of that crew is a state the driver can actually be in.
    expect(resumeSeatFrom(1, stationCrew("decide").length)).toBe(1);
  });

  /**
   * The driver must reach its verdict through this rule rather than through the
   * bare harvest count, because a reader fixing something nearby is exactly who
   * would reintroduce `attached.length === 0` without knowing what it costs.
   */
  it("driveTrackOnce decides produced-nothing through didStationProduce", () => {
    const src = readFileSync(fileURLToPath(new URL("./driver.server.ts", import.meta.url)), "utf8");
    expect(src).toContain("didStationProduce(");
    expect(src).toContain("if (!producedThisVisit)");
    // The old predicate must not be what gates the hold any more.
    expect(src).not.toContain("if (attached.length === 0) {");
  });

  /**
   * The arrival scope is the honest half of the fix. Reading the track's whole
   * record here would let a station advance on an artifact a PREVIOUS visit
   * filed, so the query must stay bound to this station and this arrival.
   */
  it("the record lookup is scoped to this station and this arrival", () => {
    const src = readFileSync(fileURLToPath(new URL("./driver.server.ts", import.meta.url)), "utf8");
    const fn = src.slice(src.indexOf("async function stationFiledSinceArrival"));
    const body = fn.slice(0, fn.indexOf("\n}\n"));
    expect(body).toContain('.eq("station", station)');
    expect(body).toContain('.gte("created_at", since)');
    expect(body).toContain('.eq("to_stage", station)');
  });
});
