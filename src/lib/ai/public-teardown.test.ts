import { describe, expect, test } from "bun:test";
import { parseTeardown, TEARDOWN_VERDICTS, type Teardown } from "@/lib/ai/public-teardown.server";

// Pure-only tests for the bounding parser. No model call, no I/O.

describe("parseTeardown", () => {
  const valid = {
    verdict: "worth building",
    headline: "A clear bet with bounded risk.",
    risks: ["No pricing named", "Assumes weekly usage"],
    gaps: ["User is undefined", "No success metric"],
    recommendation: "Interview five target users before building.",
    confidence: 0.7,
  };

  test("accepts a valid teardown unchanged", () => {
    const out = parseTeardown(valid);
    expect(out).not.toBeNull();
    const t = out as Teardown;
    expect(t.verdict).toBe("worth building");
    expect(t.headline).toBe("A clear bet with bounded risk.");
    expect(t.risks).toEqual(["No pricing named", "Assumes weekly usage"]);
    expect(t.gaps).toEqual(["User is undefined", "No success metric"]);
    expect(t.recommendation).toBe("Interview five target users before building.");
    expect(t.confidence).toBe(0.7);
  });

  test("every verdict in the enum survives", () => {
    for (const v of TEARDOWN_VERDICTS) {
      const out = parseTeardown({ ...valid, verdict: v });
      expect(out?.verdict).toBe(v);
    }
  });

  test("clamps the risks and gaps arrays to 4 items", () => {
    const many = ["r1", "r2", "r3", "r4", "r5", "r6"];
    const out = parseTeardown({ ...valid, risks: many, gaps: many });
    expect(out?.risks.length).toBe(4);
    expect(out?.gaps.length).toBe(4);
    expect(out?.risks).toEqual(["r1", "r2", "r3", "r4"]);
  });

  test("clamps over-long strings to their caps", () => {
    const longHeadline = "h".repeat(500);
    const longItem = "x".repeat(500);
    const longRec = "y".repeat(1000);
    const out = parseTeardown({
      ...valid,
      headline: longHeadline,
      risks: [longItem],
      gaps: [longItem],
      recommendation: longRec,
    });
    expect(out).not.toBeNull();
    expect((out as Teardown).headline.length).toBeLessThanOrEqual(200);
    expect((out as Teardown).risks[0].length).toBeLessThanOrEqual(240);
    expect((out as Teardown).gaps[0].length).toBeLessThanOrEqual(240);
    expect((out as Teardown).recommendation.length).toBeLessThanOrEqual(400);
  });

  test("coerces an unknown verdict to needs work", () => {
    expect(parseTeardown({ ...valid, verdict: "totally shippable" })?.verdict).toBe("needs work");
    expect(parseTeardown({ ...valid, verdict: 42 })?.verdict).toBe("needs work");
    expect(parseTeardown({ ...valid, verdict: undefined })?.verdict).toBe("needs work");
  });

  test("defaults missing list / recommendation fields gracefully", () => {
    const out = parseTeardown({ verdict: "needs work", headline: "Only a headline." });
    expect(out).not.toBeNull();
    expect((out as Teardown).risks).toEqual([]);
    expect((out as Teardown).gaps).toEqual([]);
    expect((out as Teardown).recommendation).toBe("");
    // Absent confidence defaults to 0.5.
    expect((out as Teardown).confidence).toBe(0.5);
  });

  test("survives on recommendation alone (no headline)", () => {
    const out = parseTeardown({ recommendation: "Ship a spike first." });
    expect(out).not.toBeNull();
    expect((out as Teardown).headline).toBe("");
    expect((out as Teardown).recommendation).toBe("Ship a spike first.");
  });

  test("rejects an object with neither headline nor recommendation", () => {
    expect(parseTeardown({ verdict: "worth building", risks: ["r"], confidence: 0.9 })).toBeNull();
    expect(parseTeardown({})).toBeNull();
  });

  test("clamps confidence into 0..1 and defaults non-finite", () => {
    expect(parseTeardown({ ...valid, confidence: 1.7 })?.confidence).toBe(1);
    expect(parseTeardown({ ...valid, confidence: -0.5 })?.confidence).toBe(0);
    expect(parseTeardown({ ...valid, confidence: "high" })?.confidence).toBe(0.5);
    expect(parseTeardown({ ...valid, confidence: Number.NaN })?.confidence).toBe(0.5);
  });

  test("drops non-string entries inside the lists", () => {
    const out = parseTeardown({ ...valid, risks: ["ok", 3, null, "", "  ", "also ok"] });
    expect(out?.risks).toEqual(["ok", "also ok"]);
  });

  test("returns null for non-object input", () => {
    expect(parseTeardown(null)).toBeNull();
    expect(parseTeardown(undefined)).toBeNull();
    expect(parseTeardown("a string")).toBeNull();
    expect(parseTeardown(42)).toBeNull();
    expect(parseTeardown(["an", "array"])).toBeNull();
    expect(parseTeardown(true)).toBeNull();
  });
});
