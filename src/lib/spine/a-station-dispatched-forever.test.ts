/**
 * A station that always runs out of time never escalates, and runs forever.
 *
 * `attempts` bounds a station that FILES NOTHING, and `out-of-time` deliberately
 * does not increment it — F-14 established that a crew cut short by the tick
 * deadline has not failed, and charging it an attempt punished a station for a
 * clock it does not control. **That fix was right and it left a hole: nothing
 * else counted either.**
 *
 * So a station that runs out of time on every pass holds `out-of-time` forever,
 * reports `attempts: 0` forever, and is dispatched forever. Measured 2026-08-25
 * on open tracks with ten or more runs:
 *
 *   ef50b26a | design | out-of-time | attempts 0 | $0.62 | 316 runs  <- since 2026-08-01
 *   96f58feb | sense  | out-of-time | attempts 0 | $0.30 | 174 runs
 *   425e6887 | sense  | out-of-time | attempts 0 | $0.73 |  90 runs
 *   8fa79aad | design | out-of-time | attempts 2 | $0.35 |  77 runs
 *   94bdccce | sense  | out-of-time | attempts 0 | $0.48 |  63 runs
 *   44f207cb | sense  | NULL        | attempts 0 | $0.23 |  56 runs
 *
 * **776 runs across six tracks, roughly $2.70, and not one advanced a station.**
 * The oldest was dispatched 316 times over 24 days while honestly reporting
 * `attempts: 0` — because `attempts` was answering its own question correctly
 * the whole time. The question nobody was asking is **"is this converging?"**.
 *
 * `station_drives` asks it. It counts every dispatch whatever the outcome and
 * resets when the work actually moves.
 */
import { describe, expect, it } from "bun:test";

import { decideDrive, MAX_STATION_DRIVES, MAX_STATION_ATTEMPTS, HOLD_LINE } from "./driver";
import { TERMINAL_HOLDS } from "./correction";

const base = {
  paused: false,
  station: "sense" as const,
  title: "Alert fatigue",
  origin: null,
  pendingApprovals: 0,
  attempts: 0,
};

describe("the ceiling that counts every dispatch", () => {
  it("acts one below it", () => {
    expect(decideDrive({ ...base, stationDrives: MAX_STATION_DRIVES - 1 }).act).toBe(true);
  });

  it("refuses at it", () => {
    expect(decideDrive({ ...base, stationDrives: MAX_STATION_DRIVES })).toMatchObject({
      act: false,
      hold: "going-in-circles",
    });
  });

  /**
   * THE CASE THAT COST 316 RUNS, reproduced exactly: a station that never fails
   * and never produces, whose every pass ends `out-of-time` so `attempts` stays
   * 0 forever. Before this ceiling, `decideDrive` returned `act: true` here on
   * every call, without bound.
   */
  it("stops the out-of-time loop that attempts can never see", () => {
    const forever = { ...base, attempts: 0, lastHold: "out-of-time" as const };
    expect(decideDrive({ ...forever, stationDrives: 316 })).toMatchObject({
      act: false,
      hold: "going-in-circles",
    });
    // And the proof it was unbounded before: attempts alone still says go.
    expect(decideDrive(forever).act).toBe(true);
  });

  /**
   * Absent behaves exactly as before. Every existing caller and test predates
   * this field, and a ceiling that changed their behaviour by omission would be
   * a second defect rather than a fix.
   */
  it("is inert when the caller does not pass it", () => {
    expect(decideDrive(base).act).toBe(true);
  });
});

describe("it is the LAST net, and never steals a sharper diagnosis", () => {
  /** A station that is failing keeps `stalled`, which says something specific. */
  it("yields to the attempts ceiling", () => {
    expect(
      decideDrive({ ...base, attempts: MAX_STATION_ATTEMPTS, stationDrives: 999 }),
    ).toMatchObject({ hold: "stalled" });
  });

  it("yields to a kill switch and to an open call", () => {
    expect(decideDrive({ ...base, paused: true, stationDrives: 999 })).toMatchObject({
      hold: "paused",
    });
    expect(decideDrive({ ...base, pendingApprovals: 1, stationDrives: 999 })).toMatchObject({
      hold: "waiting-on-a-person",
    });
  });

  /**
   * ── IT DOES YIELD TO MONEY, AND THIS TEST SAID THE OPPOSITE ──────────────
   *
   * It read: *"Twelve dispatches have spent real money whatever the last hold
   * said."* Measured on `6cc7a010` (Lane 1, 2026-09-10), that premise is false
   * in the one case it decides. Twelve `ux-architect` dispatches, every one
   * `halted` with `halted_reason = out_of_credit`, **averaging 612 milliseconds
   * each**. Refusals at the door. The station never ran and nothing was
   * charged.
   *
   * What the twelve measured was the wall. The driver read the shape -- many
   * dispatches, no movement -- called it `going-in-circles`, which is TERMINAL,
   * and the sweep dropped a live track for good. That account holds 5,249
   * credits today and the run has been dead six days.
   *
   * The concern this test was written for is real and is kept below: the
   * exemption must not become a way to be dispatched forever. It cannot,
   * because it is conditioned on the CURRENT hold. The moment there is credit
   * the drive runs, the hold becomes something else, and the ceiling applies
   * again on the very next tick. A wall that never clears costs 612ms a tick
   * and no money, which is the trade already accepted for
   * `waiting-on-another-run` and for the same stated reason: a hold whose
   * clearing condition lives outside this track must not be counted as this
   * track failing.
   */
  it("does not fire while a wall the track cannot pay is still up", () => {
    for (const lastHold of ["out-of-credit", "over-budget"] as const) {
      expect(
        decideDrive({ ...base, lastHold, attempts: 99, stationDrives: MAX_STATION_DRIVES }),
      ).not.toMatchObject({ hold: "going-in-circles" });
    }
  });

  /*
   * THE MIRROR, and it is the concern the old test was defending. The
   * exemption is conditioned on the wall being up, so a track whose hold is
   * anything else meets the ceiling normally at the same drive count.
   */
  it("fires on the very next drive once the hold is no longer the wall", () => {
    for (const lastHold of ["produced-nothing", "out-of-time", null] as const) {
      expect(
        decideDrive({ ...base, lastHold, attempts: 0, stationDrives: MAX_STATION_DRIVES }),
      ).toMatchObject({ hold: "going-in-circles" });
    }
  });
});

describe("the hold stops the loop paying, and says so", () => {
  it("is terminal, so the sweep stops giving it slots", () => {
    expect(TERMINAL_HOLDS).toContain("going-in-circles");
  });

  /*
   * THIS TEST PINNED A CLAIM THAT TURNED OUT TO BE FALSE, and it is replaced
   * rather than deleted so the next reader meets the reasoning.
   *
   * It asserted the line contains "That is the loop rather than any single
   * run". That clause was never derived from anything; it was written because
   * looping usually means the shape rather than a single cause. Read live on
   * `6cc7a010` (Lane 2, 2026-09-09) it was simply wrong: Build reported "No
   * repository is connected for this workspace" six times across forty minutes,
   * the loop answered by sending the work backwards, and the credit ran out.
   * The cause WAS a single external blocker, and this sentence ruled it out to
   * the one person who could act on it.
   *
   * So the guard now pins what the line may claim rather than the words it
   * used: the COUNT and the CONSEQUENCE, which are both derived, and no verdict
   * on the cause, which is not. That is law 10 in the design contract, applied
   * to the driver's own copy.
   */
  it("says the count and the consequence, and rules nothing out about the cause", () => {
    const line = HOLD_LINE["going-in-circles"];
    // The two facts the driver actually has.
    expect(line).toContain("run many times over");
    expect(line).toContain("nothing further will be spent");
    // And no verdict on WHY, which it does not have.
    expect(line).not.toContain("rather than any single run");
    expect(line.toLowerCase()).not.toContain("that is the loop");
  });

  it("does not promise to try again", () => {
    expect(HOLD_LINE["going-in-circles"].toLowerCase()).not.toContain("try again");
  });
});

describe("the ceiling is a considered number, not a guess", () => {
  /**
   * A station is two or three seats, so twelve dispatches is four to six full
   * crew passes — more than a healthy station has ever needed, and two orders of
   * magnitude under the 316 that prompted it.
   */
  it("is well above a healthy station and far below the runaway", () => {
    expect(MAX_STATION_DRIVES).toBe(12);
    expect(MAX_STATION_DRIVES).toBeGreaterThan(MAX_STATION_ATTEMPTS * 3);
    expect(MAX_STATION_DRIVES).toBeLessThan(50);
  });
});
