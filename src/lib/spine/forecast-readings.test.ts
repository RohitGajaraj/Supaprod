import { describe, expect, test } from "bun:test";
import { forecastReadings } from "./forecast-readings";

const LINK = { decisionId: "decision", clauseId: "metric" };
const READING = { value: 71, at: "2026-09-08T10:00:00Z", by: "actual-person", note: "dashboard" };
const clause = (over: Record<string, unknown> = {}) => ({
  id: "metric",
  status: "standing",
  measures_decision_id: "decision",
  readings: [READING],
  ...over,
});
const contract = (...clauses: unknown[]) => ({ success_metrics: clauses });
const EMPTY = { reading: null, count: 0 };

describe("forecastReadings reciprocal ownership", () => {
  test("preserves the reading's actual attribution and note", () => {
    expect(forecastReadings(contract(clause()), LINK)).toEqual({ reading: READING, count: 1 });
  });
  test("missing or broken IDs never infer from prose or the unique clause", () => {
    for (const link of [
      { ...LINK, decisionId: null },
      { ...LINK, clauseId: null },
      { ...LINK, decisionId: " " },
      { ...LINK, clauseId: "" },
      { ...LINK, decisionId: "other" },
      { ...LINK, clauseId: "other" },
    ])
      expect(forecastReadings(contract(clause()), link)).toEqual(EMPTY);
    for (const over of [
      { id: undefined },
      { measures_decision_id: undefined },
      { measures_decision_id: "other" },
      { status: "superseded" },
      { status: undefined },
    ])
      expect(forecastReadings(contract(clause(over)), LINK)).toEqual(EMPTY);
  });
  test("duplicate target IDs refuse, even when the duplicate is superseded or owned elsewhere", () => {
    for (const over of [{}, { status: "superseded" }, { measures_decision_id: "other" }]) {
      expect(forecastReadings(contract(clause(), clause(over)), LINK)).toEqual(EMPTY);
    }
  });
  test("two standing clauses claiming the decision are ambiguous", () => {
    expect(forecastReadings(contract(clause(), clause({ id: "other" })), LINK)).toEqual(EMPTY);
    expect(forecastReadings(contract(clause(), clause({ id: undefined })), LINK)).toEqual(EMPTY);
  });
  test("other metrics and superseded reverse links do not block the linked metric", () => {
    expect(
      forecastReadings(
        contract(
          clause(),
          clause({ id: "other", measures_decision_id: "other-decision" }),
          clause({ id: "history", status: "superseded" }),
          null,
        ),
        LINK,
      ),
    ).toEqual({ reading: READING, count: 1 });
  });
  test("malformed contracts and absent reading arrays refuse", () => {
    for (const input of [
      null,
      undefined,
      1,
      [],
      {},
      { success_metrics: "metric" },
      contract(null, 1, []),
      contract(clause({ readings: {} })),
    ]) {
      expect(forecastReadings(input, LINK)).toEqual(EMPTY);
    }
  });
});

describe("forecastReadings record validation", () => {
  test("orders by parsed instant rather than the timestamp's lexical order", () => {
    const latest = { ...READING, value: 73, at: "2026-09-08T08:30:00-02:00", by: "second-person" };
    const earlier = { ...READING, value: 69, at: "2026-09-08T12:00:00+02:00" };
    expect(forecastReadings(contract(clause({ readings: [latest, earlier] })), LINK)).toEqual({
      reading: latest,
      count: 2,
    });
  });
  test("deduplicates instant plus person plus value across equivalent offsets and notes", () => {
    expect(
      forecastReadings(
        contract(
          clause({
            readings: [
              READING,
              { ...READING },
              { ...READING, at: "2026-09-08T12:00:00+02:00", note: "copy" },
              { ...READING, at: "2026-09-08T10:00:00.000Z" },
            ],
          }),
        ),
        LINK,
      ),
    ).toEqual({ reading: READING, count: 1 });
  });
  test("equal values at distinct instants are distinct measurements", () => {
    const latest = { ...READING, at: "2026-09-10T10:00:00Z" };
    expect(
      forecastReadings(
        contract(
          clause({ readings: [READING, latest, { ...READING, at: "2026-09-09T10:00:00Z" }] }),
        ),
        LINK,
      ),
    ).toEqual({ reading: latest, count: 3 });
  });
  test("distinct sub-millisecond instants remain distinct and equivalent offsets deduplicate", () => {
    const earlier = { ...READING, at: "2026-09-08T10:00:00.0001Z" };
    const latest = { ...READING, at: "2026-09-08T10:00:00.0002Z" };
    const duplicate = { ...READING, at: "2026-09-08T12:00:00.00020+02:00" };
    expect(
      forecastReadings(contract(clause({ readings: [latest, earlier, duplicate] })), LINK),
    ).toEqual({ reading: latest, count: 2 });
  });
  test("different attribution or value at one instant is not a duplicate", () => {
    expect(
      forecastReadings(
        contract(
          clause({
            readings: [READING, { ...READING, by: "another-person" }, { ...READING, value: 72 }],
          }),
        ),
        LINK,
      ).count,
    ).toBe(3);
  });
  test("rejects malformed values, attribution, dates and unqualified timestamps", () => {
    const malformed = [
      null,
      [],
      71,
      ...[NaN, Infinity, -Infinity, "71", null].map((value) => ({ ...READING, value })),
      ...[null, "", " ", 4].map((by) => ({ ...READING, by })),
      ...[
        null,
        "",
        "yesterday",
        "2026-09-08",
        "2026-09-08T10:00:00",
        "2026-02-30T10:00:00Z",
        "2026-02-29T10:00:00Z",
        "2026-13-08T10:00:00Z",
        "2026-09-08T24:00:00Z",
        "2026-09-08T10:60:00Z",
        "2026-09-08T10:00:00+24:00",
        "2026-09-08T10:00:00+02:60",
      ].map((at) => ({ ...READING, at })),
    ];
    expect(forecastReadings(contract(clause({ readings: malformed })), LINK)).toEqual(EMPTY);
    expect(forecastReadings(contract(clause({ readings: [...malformed, READING] })), LINK)).toEqual(
      { reading: READING, count: 1 },
    );
  });
  test("accepts valid leap days, fractional seconds, and negative finite values", () => {
    const reading = { ...READING, at: "2024-02-29T10:00:00.123+05:30", value: -1.25 };
    expect(forecastReadings(contract(clause({ readings: [reading] })), LINK)).toEqual({
      reading,
      count: 1,
    });
  });
});
