import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test, expect } from "bun:test";
import { aReadingCanBringLearnForward } from "./a-reading-can-bring-learn-forward";
import type { ForecastBand } from "./forecast-band";

const LINK = { decisionId: "decision", clauseId: "metric" };
const BAND: ForecastBand = {
  direction: "higher-is-better",
  driftingAt: 70,
  missedAt: 64,
  observations: 41200,
  recordedReadings: 41200,
};
const readings = (value = 71) =>
  [6, 7, 8].map((day) => ({
    value,
    at: "2026-09-0" + day + "T10:00:00Z",
    by: "founder",
  }));
const clause = (over: Record<string, unknown> = {}) => ({
  id: "metric",
  measures_decision_id: "decision",
  status: "standing",
  readings: readings(),
  ...over,
});
const contract = (...clauses: Record<string, unknown>[]) => ({ success_metrics: clauses });

describe("aReadingCanBringLearnForward with explicit forecast linkage", () => {
  test("41200 declared observations and no recorded readings refuses", () => {
    expect(aReadingCanBringLearnForward(contract(clause({ readings: [] })), BAND, LINK).lift).toBe(
      false,
    );
  });
  test("one record refuses despite forged recordedReadings and population", () => {
    const result = aReadingCanBringLearnForward(
      contract(clause({ readings: readings().slice(0, 1) })),
      BAND,
      LINK,
    );
    expect(result.lift).toBe(false);
    expect(!result.lift && result.because).toContain("too few recorded readings");
  });
  test("three proper linked readings lift regardless of caller-supplied count", () => {
    expect(
      aReadingCanBringLearnForward(
        contract(clause()),
        { ...BAND, recordedReadings: 0, observations: null },
        LINK,
      ),
    ).toEqual({ lift: true, reading: 71, verdict: "on-track" });
  });
  test("a missed reading also lifts a well-founded band", () => {
    expect(
      aReadingCanBringLearnForward(contract(clause({ readings: readings(50) })), BAND, LINK),
    ).toEqual({ lift: true, reading: 50, verdict: "missed" });
  });
  test("missing linkage refuses instead of inferring the unique clause", () => {
    expect(aReadingCanBringLearnForward(contract(clause()), BAND).lift).toBe(false);
    expect(
      aReadingCanBringLearnForward(contract(clause()), BAND, { ...LINK, clauseId: null }).lift,
    ).toBe(false);
  });
  test("unrelated clause readings cannot lift", () => {
    expect(
      aReadingCanBringLearnForward(
        contract(
          clause({ readings: [] }),
          clause({ id: "other", measures_decision_id: "other-decision" }),
        ),
        BAND,
        LINK,
      ).lift,
    ).toBe(false);
  });
  test("multiple other metric clauses do not block the linked metric", () => {
    expect(
      aReadingCanBringLearnForward(
        contract(
          clause(),
          clause({ id: "other", measures_decision_id: "other-decision" }),
          clause({ id: "third", measures_decision_id: null }),
        ),
        BAND,
        LINK,
      ).lift,
    ).toBe(true);
  });
  test("mismatched reverse link refuses", () => {
    expect(
      aReadingCanBringLearnForward(
        contract(clause({ measures_decision_id: "other-decision" })),
        BAND,
        LINK,
      ).lift,
    ).toBe(false);
  });
  test("malformed and duplicate readings cannot inflate the count", () => {
    const first = readings()[0];
    expect(
      aReadingCanBringLearnForward(
        contract(
          clause({
            readings: [
              first,
              first,
              { ...first, at: "2026-09-06T12:00:00+02:00" },
              { ...first, at: "yesterday" },
              { ...first, by: " " },
              { ...first, value: Infinity },
            ],
          }),
        ),
        BAND,
        LINK,
      ).lift,
    ).toBe(false);
  });
  test("prose and malformed bands keep the date and explain why", () => {
    const broken = [
      null,
      { ...BAND, direction: null },
      { ...BAND, direction: "sideways" } as unknown as ForecastBand,
      { ...BAND, driftingAt: null },
      { ...BAND, missedAt: Infinity },
      { ...BAND, driftingAt: 60, missedAt: 70 },
    ];
    for (const band of broken) {
      const result = aReadingCanBringLearnForward(contract(clause()), band, LINK);
      expect(result.lift).toBe(false);
      expect(!result.lift && result.because.length).toBeGreaterThan(20);
    }
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
