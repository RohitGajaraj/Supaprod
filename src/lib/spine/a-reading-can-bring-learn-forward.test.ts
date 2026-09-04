import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test, expect } from "bun:test";
import {
  aReadingCanBringLearnForward,
  theLatestReadingOnTheOneClause,
} from "./a-reading-can-bring-learn-forward";
import { MIN_OBSERVATIONS_FOR_A_BAND, type ForecastBand } from "./forecast-band";

/** A well-founded band on the shipped release's metric: completion, higher is better. */
const BAND: ForecastBand = {
  direction: "higher-is-better",
  driftingAt: 70,
  missedAt: 64,
  observations: MIN_OBSERVATIONS_FOR_A_BAND,
};

const clause = (over: Record<string, unknown> = {}) => ({
  text: "Increase in tablet checkout completion rate from 67 percent.",
  status: "standing",
  ...over,
});

const reading = (value: number) => ({
  readings: [{ value, at: "2026-09-08T10:00:00Z", by: "founder" }],
});

const contractWith = (...clauses: Record<string, unknown>[]) => ({ success_metrics: clauses });

describe("theLatestReadingOnTheOneClause", () => {
  test("one hand reading on one standing clause", () => {
    expect(theLatestReadingOnTheOneClause(contractWith(clause(reading(71))))).toBe(71);
  });

  test("ONE CLAUSE with several readings takes its LATEST, not its first", () => {
    /*
     * A1's correction, 2026-09-04. `recordMetricReading` APPENDS, so a person
     * who measures twice has two readings on one clause and has not made
     * anything ambiguous -- the newer number is the current truth. Counting
     * readings rather than clauses would refuse them and punish measuring twice.
     */
    const twice = contractWith(
      clause({
        readings: [
          { value: 71, at: "2026-09-08T10:00:00Z", by: "founder" },
          { value: 73, at: "2026-09-11T09:00:00Z", by: "founder" },
          { value: 69, at: "2026-09-02T08:00:00Z", by: "founder" },
        ],
      }),
    );
    expect(theLatestReadingOnTheOneClause(twice)).toBe(73);
    const d = aReadingCanBringLearnForward(twice, BAND);
    expect(d.lift === true && d.reading).toBe(73);
  });

  test("no reading, two CLAUSES with readings, and a superseded clause are all null", () => {
    expect(theLatestReadingOnTheOneClause(contractWith(clause()))).toBeNull();
    expect(
      theLatestReadingOnTheOneClause(contractWith(clause(reading(71)), clause(reading(40)))),
    ).toBeNull();
    expect(
      theLatestReadingOnTheOneClause(
        contractWith(clause({ ...reading(71), status: "superseded" })),
      ),
    ).toBeNull();
    expect(theLatestReadingOnTheOneClause(null)).toBeNull();
  });
});

describe("aReadingCanBringLearnForward", () => {
  test("a settled, well-founded band with one reading LIFTS", () => {
    const d = aReadingCanBringLearnForward(contractWith(clause(reading(71))), BAND);
    expect(d.lift).toBe(true);
    expect(d.lift === true && d.reading).toBe(71);
    expect(d.lift === true && d.verdict).toBe("on-track");
  });

  test("a missed reading lifts too: early is early either way", () => {
    // The point is that the band SETTLED, not that the news was good.
    const d = aReadingCanBringLearnForward(contractWith(clause(reading(50))), BAND);
    expect(d.lift === true && d.verdict).toBe("missed");
  });

  /**
   * THE CASE THAT SEPARATES THIS PREDICATE FROM THE OBVIOUS ONE.
   *
   * Conditions 1 to 3 -- a reading exists, a band exists, the band answers --
   * read like the whole rule, and an implementation that stops there lifts
   * here. `driver.ts`'s filing instruction says a band from one reading "is
   * logged and never opens work", and bringing Learn forward IS opening work:
   * it runs a station, spends a seat and files a verdict. So a thin band must
   * not lift, and it would have passed any check that only asked whether the
   * band answered.
   */
  test("a THIN band does not lift, even though it answers cleanly", () => {
    const thin: ForecastBand = { ...BAND, observations: MIN_OBSERVATIONS_FOR_A_BAND - 1 };
    const d = aReadingCanBringLearnForward(contractWith(clause(reading(71))), thin);
    expect(d.lift).toBe(false);
    expect(d.lift === false && d.because).toContain("too few observations");
    // And it is emphatically NOT because the band could not answer.
    expect(d.lift === false && d.because).not.toContain("cannot answer");
  });

  test("an uncounted band does not lift either", () => {
    // observations null is "nobody counted", which is not evidence of three.
    const d = aReadingCanBringLearnForward(contractWith(clause(reading(71))), {
      ...BAND,
      observations: null,
    });
    expect(d.lift).toBe(false);
  });

  test("PROSE never lifts, however good the reading", () => {
    const d = aReadingCanBringLearnForward(contractWith(clause(reading(71))), null);
    expect(d.lift).toBe(false);
    expect(d.lift === false && d.because).toContain("prose");
  });

  test("a band that cannot answer keeps the date", () => {
    for (const broken of [
      { ...BAND, direction: null },
      { ...BAND, driftingAt: null },
      { ...BAND, missedAt: null },
      // Thresholds ordered against their own direction: malformed, not a verdict.
      { ...BAND, driftingAt: 60, missedAt: 70 },
    ] as ForecastBand[]) {
      const d = aReadingCanBringLearnForward(contractWith(clause(reading(71))), broken);
      expect(d.lift).toBe(false);
      expect(d.lift === false && d.because).toContain("cannot answer");
    }
  });

  test("two readings keep the date rather than guessing which one settles it", () => {
    // Attaching a number to the wrong metric and grading against it is worse
    // than waiting, which is the behaviour we already have.
    const d = aReadingCanBringLearnForward(
      contractWith(clause(reading(71)), clause(reading(40))),
      BAND,
    );
    expect(d.lift).toBe(false);
    expect(d.lift === false && d.because).toContain("nothing unambiguous");
  });

  test("no reading at all keeps the date", () => {
    expect(aReadingCanBringLearnForward(contractWith(clause()), BAND).lift).toBe(false);
  });

  test("every refusal says why, so a caller can log it rather than a bare false", () => {
    const refusals = [
      aReadingCanBringLearnForward(contractWith(clause()), BAND),
      aReadingCanBringLearnForward(contractWith(clause(reading(71))), null),
      aReadingCanBringLearnForward(contractWith(clause(reading(71))), {
        ...BAND,
        observations: 1,
      }),
    ];
    for (const r of refusals) {
      expect(r.lift).toBe(false);
      expect(r.lift === false && r.because.length).toBeGreaterThan(20);
    }
  });
});

describe("what this predicate does against the record as it actually stands", () => {
  /**
   * MEASURED ON PRODUCTION 2026-09-04, and it is the honest headline for the
   * packet: **133 specs, 0 carrying a reading on any clause.** So condition 1
   * fails everywhere and NOTHING lifts today. The predicate is correct and
   * inert, and it starts working the first time a person records a number.
   *
   * Pinned as a test because the claim in the report is exactly this, and a
   * later reader deserves to find the shape that produced it rather than the
   * sentence alone.
   */
  test("a spec shaped like every real one today keeps the date", () => {
    const asStored = {
      success_metrics: [
        {
          id: "5c92f3bd-f182-45de-9211-9f4e794f1f87",
          text: "Increase in tablet checkout completion rate from 67 percent.",
          status: "standing",
          oracle_kind: "eval",
          oracle_ref: "a653a20b-7c05-4eb6-9cc9-7e0ed807467e",
        },
      ],
    };
    const d = aReadingCanBringLearnForward(asStored, BAND);
    expect(d.lift).toBe(false);
    expect(d.lift === false && d.because).toContain("nothing unambiguous");
  });

  /**
   * AND THE CONDITION THAT DOES NOT PROTECT WHAT IT LOOKS LIKE IT PROTECTS.
   *
   * Four of the seven banded decisions on the record carry a POPULATION in
   * `forecast_observations` -- 41200, 1420, 1240, and one exactly equal to its
   * own baseline. `bandIsWellFounded` answers true for all of them, so this
   * guard is a floor and not protection while that field is not a readings
   * count. The header says so, and this pins the fact so the header cannot
   * quietly become false.
   *
   * P-150 fixes the field. This test should CHANGE when it does.
   */
  test("a band declaring 41200 observations passes the floor, because the field is not a count", () => {
    const asWritten: ForecastBand = { ...BAND, observations: 41200 };
    expect(aReadingCanBringLearnForward(contractWith(clause(reading(71))), asWritten).lift).toBe(
      true,
    );
  });
});

describe("the lift is wired in BOTH places, because either alone does nothing", () => {
  /**
   * The defect this guard exists to prevent, and it is the one this packet
   * nearly shipped: the sweep's SQL carries
   * `deferred_until.is.null,deferred_until.lte.now`, so a track deferred to
   * October is never fetched. Filtering inside the sweep is therefore correct
   * and inert on its own -- the row it filters never arrives. Clearing
   * `deferred_until` on the write is what puts the row back in front of the
   * sweep, and the sweep-side drop is what stops it being deferred again on the
   * same tick.
   *
   * Deleting either half leaves a feature that passes its own unit tests and
   * never once brings a track forward, so both are pinned by rule rather than
   * by spelling: the assertions name the COLUMN and the PREDICATE, not a
   * sentence somebody may reword.
   */
  const read = (rel: string) => readFileSync(join(import.meta.dir, rel), "utf8") as string;

  test("the sweep drops a lifted track from the due map", () => {
    const tick = read("../../routes/api/public/hooks/track-tick.ts");
    expect(tick).toContain("tracksAReadingBringsForward");
    // Dropped from the map, reusing "absent is never skipped" rather than a
    // second skip set that could disagree with it.
    expect(tick).toMatch(/for \(const id of lifted\) dueByTrack\.delete\(id\)/);
  });

  test("recording a reading clears the column that keeps the row out of the sweep", () => {
    const fns = read("../discovery.functions.ts");
    expect(fns).toContain("tracksAReadingBringsForward");
    expect(fns).toMatch(/deferred_until: null/);
  });

  test("and the wake failure is logged rather than swallowed or thrown", () => {
    // The reading is what the person asked for; the schedule rides on top. A
    // throw here would lose the number, and a silent catch is how F-197 hid a
    // cancelled write for a week.
    const fns = read("../discovery.functions.ts");
    expect(fns).toContain("[reading] recorded on");
    expect(fns).not.toMatch(/catch \(\) => undefined/);
  });
});
