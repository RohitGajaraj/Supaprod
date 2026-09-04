import { describe, test, expect } from "bun:test";
import {
  whatWouldMeasure,
  canProduceAReading,
  metricSourceLine,
  whatLearnCanMeasure,
  whyItCannotBeResolved,
  isStanding,
  type MetricClause,
} from "./what-would-measure-this";

const NO_READINGS: ReadonlySet<string> = new Set<string>();

/** The two clauses as production actually stores them on spec f2aa82f1. */
const TABLET_COMPLETION: MetricClause = {
  id: "5c92f3bd-f182-45de-9211-9f4e794f1f87",
  text: "Increase in tablet checkout completion rate from 67 percent.",
  status: "standing",
  oracle_kind: "eval",
  oracle_ref: "a653a20b-7c05-4eb6-9cc9-7e0ed807467e",
};
const ADDRESS_ABANDONMENT: MetricClause = {
  id: "775f05de-8ee3-42d2-ad13-7c8db40037dc",
  text: "Reduction in abandonment rate on the 'Shipping Address' screen for tablet devices from 41 percent of all checkout abandonments.",
  status: "standing",
  oracle_kind: "eval",
  oracle_ref: "6dbb1c54-9a78-406a-b5ab-9ce0ca7abf42",
};

describe("whatWouldMeasure", () => {
  test("a resolving oracle_ref with no readings is NOT a source", () => {
    // The defect this file exists for. Both live metrics name an eval case
    // that is a real row, so "is oracle_ref present" answers yes and is wrong.
    // Measured 2026-09-04: eval_case_results for both refs is 0.
    for (const clause of [TABLET_COMPLETION, ADDRESS_ABANDONMENT]) {
      const state = whatWouldMeasure(clause, NO_READINGS);
      expect(state.kind).toBe("named-never-run");
      expect(canProduceAReading(state)).toBe(false);
    }
  });

  test("the same clause becomes a source once its oracle has produced a reading", () => {
    const state = whatWouldMeasure(
      TABLET_COMPLETION,
      new Set(["a653a20b-7c05-4eb6-9cc9-7e0ed807467e"]),
    );
    expect(state.kind).toBe("connected");
    expect(canProduceAReading(state)).toBe(true);
  });

  test("ci and uat are acceptance checks, never outcome sources", () => {
    // Honest oracles for a different question. Counting them would let Learn
    // report a graded outcome off a green build.
    const ci = whatWouldMeasure({ status: "standing", oracle_kind: "ci" }, NO_READINGS);
    const uat = whatWouldMeasure({ status: "standing", oracle_kind: "uat" }, NO_READINGS);
    expect(ci.kind).toBe("acceptance-only");
    expect(uat.kind).toBe("acceptance-only");
    expect(canProduceAReading(ci)).toBe(false);
    expect(canProduceAReading(uat)).toBe(false);
  });

  test("a clause naming no oracle at all has nothing behind it", () => {
    expect(whatWouldMeasure({ status: "standing" }, NO_READINGS).kind).toBe("none");
  });

  test("an eval clause with a kind but no ref names nothing to point at", () => {
    expect(
      whatWouldMeasure({ status: "standing", oracle_kind: "eval", oracle_ref: "  " }, NO_READINGS)
        .kind,
    ).toBe("none");
  });

  test("a spec that declares a metric unverifiable is reported as saying so", () => {
    expect(
      whatWouldMeasure({ status: "standing", oracle_kind: "unverifiable" }, NO_READINGS).kind,
    ).toBe("declared-unverifiable");
  });

  test("a hand reading counts, and outranks an oracle that never ran", () => {
    const state = whatWouldMeasure(
      {
        ...TABLET_COMPLETION,
        readings: [{ value: 71, at: "2026-09-08T10:00:00Z", by: "founder" }],
      },
      NO_READINGS,
    );
    expect(state.kind).toBe("hand");
    expect(canProduceAReading(state)).toBe(true);
  });

  test("the newest hand reading is the one that counts", () => {
    const state = whatWouldMeasure(
      {
        status: "standing",
        readings: [
          { value: 68, at: "2026-09-05T10:00:00Z", by: "founder" },
          { value: 71, at: "2026-09-08T10:00:00Z", by: "founder" },
          { value: 69, at: "2026-09-06T10:00:00Z", by: "founder" },
        ],
      },
      NO_READINGS,
    );
    expect(state.kind === "hand" && state.reading.value).toBe(71);
  });

  test("a reading nobody can attribute is not a reading", () => {
    // A number with no `by` and no `at` would let a metric look measured with
    // nothing on the record about where it came from.
    for (const bad of [
      { value: 71 },
      { value: 71, at: "2026-09-08T10:00:00Z" },
      { value: 71, by: "founder" },
      { value: "71", at: "2026-09-08T10:00:00Z", by: "founder" },
      { value: Number.NaN, at: "2026-09-08T10:00:00Z", by: "founder" },
    ]) {
      expect(whatWouldMeasure({ status: "standing", readings: [bad] }, NO_READINGS).kind).toBe(
        "none",
      );
    }
  });
});

describe("sourceLine", () => {
  test("names what is there without scolding a clause for being an acceptance check", () => {
    const uat = metricSourceLine({ kind: "acceptance-only", oracle: "uat" });
    expect(uat).toContain("not how people behaved");
    expect(uat).not.toMatch(/should|must|failed|wrong/i);
  });

  test("a hand reading always says a person recorded it", () => {
    const line = metricSourceLine({
      kind: "hand",
      reading: { value: 71, at: "2026-09-08T10:00:00Z", by: "founder" },
    });
    expect(line).toContain("A person recorded 71");
    expect(line).toContain("2026-09-08");
  });

  test("a named-but-never-run oracle says there is no number behind it", () => {
    const line = metricSourceLine({ kind: "named-never-run", oracle: "eval", ref: "a653a20b" });
    expect(line).toContain("no number behind it");
  });
});

describe("whatLearnCanMeasure", () => {
  test("the honest line for the first live release, on today's data", () => {
    // Both metrics, both named-never-run. This is the sentence 09-09 shows.
    const states = [TABLET_COMPLETION, ADDRESS_ABANDONMENT].map((c) =>
      whatWouldMeasure(c, NO_READINGS),
    );
    const line = whatLearnCanMeasure(states);
    expect(line).toContain("None of the 2 success metrics");
    expect(line).toContain("cannot be graded yet");
  });

  test("some-but-not-all is its own sentence, because it is a different fact", () => {
    const line = whatLearnCanMeasure([
      { kind: "hand", reading: { value: 71, at: "2026-09-08T10:00:00Z", by: "founder" } },
      { kind: "none" },
    ]);
    expect(line).toContain("1 of 2");
    expect(line).not.toContain("None");
  });

  test("a spec with no metrics says so rather than claiming none can be measured", () => {
    expect(whatLearnCanMeasure([])).toContain("states no success metrics");
  });

  test("all measurable does not warn about anything", () => {
    const line = whatLearnCanMeasure([
      { kind: "connected", oracle: "eval", ref: "a" },
      { kind: "connected", oracle: "eval", ref: "b" },
    ]);
    expect(line).toContain("All 2");
    expect(line).not.toContain("cannot");
  });
});

describe("isStanding", () => {
  test("only a standing clause is a promise", () => {
    expect(isStanding({ status: "standing" })).toBe(true);
    expect(isStanding({ status: "superseded" })).toBe(false);
    expect(isStanding({})).toBe(false);
  });
});

describe("whyItCannotBeResolved", () => {
  test("says why, and says what would change it", () => {
    const because = whyItCannotBeResolved("tablet checkout completion");
    expect(because).toContain("could not be graded");
    expect(because).toContain("tablet checkout completion");
    expect(because).toContain("record a reading by hand");
  });

  test("reads as a sentence when the metric is not named", () => {
    expect(whyItCannotBeResolved(null)).not.toContain("()");
    expect(whyItCannotBeResolved("  ")).not.toContain("()");
  });
});
