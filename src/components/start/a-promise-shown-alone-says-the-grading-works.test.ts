/**
 * A PENDING BET SHOWN ALONE TELLS A READER THAT THE GRADING WORKS.
 *
 * MEASURED ON THE LIVE DATABASE, 2026-09-10 01:56 UTC, samples excluded:
 *
 *   Helio Labs        10 overdue, ungraded    28 pending
 *   My workspace       5 overdue, ungraded    10 pending
 *   A1 delete probe    0 overdue               6 pending
 *
 *   15 real forecasts past their horizon with `forecast_resolved_at` null,
 *   across 2 workspaces, oldest 2026-08-18. FOURTEEN of the fifteen carry a
 *   `forecast_next_check_at` that is ALSO in the past — scheduled, came due,
 *   nothing ran. Not one of the 51 (samples included) has ever been deferred:
 *   `forecast_deferred_at` is null on all of them and
 *   `forecast_deferred_count` maxes at 0.
 *
 * So in two of the three real workspaces the entry drew "What it is betting
 * on — you will know in N days" while ten and five earlier bets had quietly
 * lapsed. That is not a missing count. It is the surface implying that the
 * product's central claim — that it grades whether the work worked — is
 * running, when the closing step had not fired once. The founder's *"I cannot
 * feel the value"* is the correct reading of that screen.
 *
 * WHAT THIS PINS is the qualifier, not the wording: that a lapse reaches the
 * region at all, that zero stays silent, and that the ranking holds — a
 * RESULT outranks a LAPSE outranks a PROMISE.
 */
import { describe, test, expect } from "bun:test";

import { theBetStillOpen, lapsedLine } from "@/components/start/the-bet-still-open";

const NOW = "2026-09-10T02:00:00.000Z";
const ZONE = "Asia/Kolkata";

/** The bet as the read hands it over, with the counts measured that night. */
function bet(lapsed: number) {
  return {
    decisionTitle: "Ship the installer arrival window",
    claim: "Abandonment on the address screen falls below 5%.",
    howWeWillKnow: "The weekly funnel export.",
    horizon: "2026-09-20T00:00:00.000Z",
    isSample: false,
    lapsed,
  };
}

describe("a promise shown alone says the grading works", () => {
  test("THE REGRESSION: Helio Labs' ten lapsed bets reach the region", () => {
    const it = theBetStillOpen({ openBet: bet(10), closed: null, nowIso: NOW, zone: ZONE })!;
    expect(it.lapsed).toBe(10);
    expect(lapsedLine(it.lapsed)).toContain("10");
  });

  test("nothing lapsed says nothing at all", () => {
    // A1 delete probe. The promise is the whole truth there, and a "0 lapsed"
    // line would be an absence dressed as a measurement.
    const it = theBetStillOpen({ openBet: bet(0), closed: null, nowIso: NOW, zone: ZONE })!;
    expect(it.lapsed).toBe(0);
    expect(lapsedLine(0)).toBeNull();
  });

  test("one is said as one, not as a number with a plural", () => {
    expect(lapsedLine(1)).toBe("One earlier bet came due and nothing has graded it.");
    expect(lapsedLine(2)).toContain("2 earlier bets");
  });

  test("a result outranks a lapse: a closed loop still silences this region", () => {
    // `WhetherItWorked` draws instead, and the two must never both be on
    // screen. Adding the qualifier must not have created a second exception.
    expect(
      theBetStillOpen({ openBet: bet(10), closed: { any: true }, nowIso: NOW, zone: ZONE }),
    ).toBeNull();
  });

  test("a lapse never resurrects a region that had no promise to qualify", () => {
    // Ten lapsed and nothing pending is `/outcomes`' sentence, not this
    // region's: there is no bet here to qualify.
    expect(theBetStillOpen({ openBet: null, closed: null, nowIso: NOW, zone: ZONE })).toBeNull();
  });

  test("a negative or missing count never reaches the screen", () => {
    // A refused count is zero rather than a wrong number: the promise is still
    // true and worth drawing without its qualifier.
    const missing = theBetStillOpen({
      openBet: { ...bet(0), lapsed: undefined as unknown as number },
      closed: null,
      nowIso: NOW,
      zone: ZONE,
    })!;
    expect(missing.lapsed).toBe(0);
    expect(lapsedLine(-3)).toBeNull();
  });

  test("the line states the fact and never the cause", () => {
    // "Grading is manual today" is true now and becomes false the moment it is
    // automated — a qualifier outliving the read it was written for, which is
    // the defect this session fixed three times. The fact does not expire.
    const line = lapsedLine(10)!.toLowerCase();
    expect(line).toContain("nothing has graded them");
    for (const cause of ["manual", "agent", "not automatic", "no one has"]) {
      expect(line).not.toContain(cause);
    }
  });
});
