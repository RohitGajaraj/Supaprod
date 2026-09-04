import { describe, test, expect } from "bun:test";
import { aReadingCanBringLearnForward, theOneReading } from "./a-reading-can-bring-learn-forward";
import { MIN_OBSERVATIONS_FOR_A_BAND, type ForecastBand } from "./forecast-band";

/** A well-founded band on the shipped release's metric: completion, higher is better. */
const BAND: ForecastBand = {
  metric: "tablet checkout completion rate",
  baseline: 67,
  predicted: 74,
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

describe("theOneReading", () => {
  test("one hand reading on one standing clause", () => {
    expect(theOneReading(contractWith(clause(reading(71))))).toBe(71);
  });

  test("no reading, two readings, and a superseded clause's reading are all null", () => {
    expect(theOneReading(contractWith(clause()))).toBeNull();
    expect(theOneReading(contractWith(clause(reading(71)), clause(reading(40))))).toBeNull();
    expect(theOneReading(contractWith(clause({ ...reading(71), status: "superseded" })))).toBeNull();
    expect(theOneReading(null)).toBeNull();
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
