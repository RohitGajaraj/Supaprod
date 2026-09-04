import { describe, test, expect } from "bun:test";
import {
  metricsForTheBrief,
  whatItWasGradedAgainst,
  gradedAgainstFromStates,
} from "./the-number-a-person-gave-us";
import type { SourceState } from "./what-would-measure-this";
import { ARTIFACT_SOURCE } from "./chain";

/** The two clauses as production stores them on the shipped spec f2aa82f1. */
const LIVE_CONTRACT = {
  success_metrics: [
    {
      id: "5c92f3bd-f182-45de-9211-9f4e794f1f87",
      text: "Increase in tablet checkout completion rate from 67 percent.",
      status: "standing",
      oracle_kind: "eval",
      oracle_ref: "a653a20b-7c05-4eb6-9cc9-7e0ed807467e",
    },
    {
      id: "775f05de-8ee3-42d2-ad13-7c8db40037dc",
      text: "Reduction in abandonment rate on the 'Shipping Address' screen.",
      status: "standing",
      oracle_kind: "eval",
      oracle_ref: "6dbb1c54-9a78-406a-b5ab-9ce0ca7abf42",
    },
  ],
};

const withReading = (value: number, by = "founder", note?: string) => ({
  success_metrics: [
    {
      ...LIVE_CONTRACT.success_metrics[0],
      readings: [{ value, at: "2026-09-08T10:00:00Z", by, ...(note ? { note } : {}) }],
    },
    LIVE_CONTRACT.success_metrics[1],
  ],
});

describe("metricsForTheBrief", () => {
  test("the shipped spec today: both metrics named, and the seat told not to invent one", () => {
    const block = metricsForTheBrief(LIVE_CONTRACT)!;
    expect(block).toContain("67 percent");
    expect(block).toContain("Shipping Address");
    expect(block).toContain("NOTHING can produce a number");
    expect(block).toContain("say so rather than estimating one");
  });

  test("a recorded reading reaches the seat WITH who gave it and when", () => {
    // The point of the packet. "71" alone would let a seat write "measured"
    // over "somebody told us".
    const block = metricsForTheBrief(withReading(71))!;
    expect(block).toContain("A person (founder) recorded 71 on 2026-09-08");
    expect(block).toContain("1 of 2 have a number behind them");
    expect(block).toContain("say plainly that the rest have none");
  });

  test("a note on the reading travels too", () => {
    const block = metricsForTheBrief(withReading(71, "founder", "read off Relay's dashboard"))!;
    expect(block).toContain("They noted: read off Relay's dashboard");
  });

  test("a spec promising nothing returns null, not an empty heading", () => {
    // An empty "Success metrics" section reads as a failed read, and the seat
    // would be right to wonder what it was not shown.
    expect(metricsForTheBrief({})).toBeNull();
    expect(metricsForTheBrief(null)).toBeNull();
    expect(metricsForTheBrief({ success_metrics: [] })).toBeNull();
    expect(metricsForTheBrief({ success_metrics: "not a list" })).toBeNull();
  });

  test("a superseded clause is not read to the seat as a promise", () => {
    const c = {
      success_metrics: [
        { text: "the standing one", status: "standing" },
        { text: "the retired one", status: "superseded" },
      ],
    };
    const block = metricsForTheBrief(c)!;
    expect(block).toContain("the standing one");
    expect(block).not.toContain("the retired one");
  });

  test("a ci clause is described as a build check, never as a number", () => {
    const block = metricsForTheBrief({
      success_metrics: [{ text: "Telemetry is integrated.", status: "standing", oracle_kind: "ci" }],
    })!;
    expect(block).toContain("not how people behaved");
    expect(block).toContain("NOTHING can produce a number");
  });
});

describe("whatItWasGradedAgainst", () => {
  test("names the count, so a verdict from nothing is not the same artifact", () => {
    expect(whatItWasGradedAgainst(LIVE_CONTRACT)).toBe("graded with no reading");
    expect(whatItWasGradedAgainst(withReading(71))).toBe("graded against 1 reading");
  });

  test("singular and plural, and no metric at all is its own sentence", () => {
    const two = {
      success_metrics: [
        { text: "a", status: "standing", readings: [{ value: 1, at: "2026-09-08", by: "x" }] },
        { text: "b", status: "standing", readings: [{ value: 2, at: "2026-09-08", by: "x" }] },
      ],
    };
    expect(whatItWasGradedAgainst(two)).toBe("graded against 2 readings");
    expect(whatItWasGradedAgainst({})).toBe("graded with no success metric on the spec");
  });
});

describe("the spec actually carries its contract into the brief", () => {
  /**
   * The wiring, not the renderer. `metricsForTheBrief` can be perfect and the
   * seat still sees nothing if `ARTIFACT_SOURCE` does not send the column --
   * which is exactly what happened to the decision's forecast columns, where
   * 18 of 18 Learn runs had no forecast in their input because it was never
   * sent.
   */
  test("prd names contract in `also`", () => {
    expect(ARTIFACT_SOURCE.prd.also).toContain("contract");
  });

  test("and the decision still carries its forecast, which this must not have broken", () => {
    expect(ARTIFACT_SOURCE.decision.also).toContain("forecast_claim");
    expect(ARTIFACT_SOURCE.decision.also).toContain("forecast_how_we_will_know");
    expect(ARTIFACT_SOURCE.decision.also).toContain("forecast_horizon_date");
  });
});

describe("the driver refuses to stringify an object it cannot render", () => {
  /**
   * The trap the packet's own one-line answer would have fallen into:
   * `also: ["contract"]` with no renderer sends the column and prints
   * `[object Object]`. It compiles, it runs, the schema is right, and the seat
   * is handed nine characters of nothing.
   *
   * Read from source because the defect is what reaches a brief, and there is
   * no seam that returns the composed extras alone.
   */
  const body = require("node:fs").readFileSync(
    require("node:path").join(import.meta.dir, "driver.server.ts"),
    "utf8",
  ) as string;

  test("contract has a renderer rather than a String() cast", () => {
    expect(body).toContain("RENDER_FOR");
    expect(body).toContain("metricsForTheBrief");
  });

  test("and an unrendered object is skipped out loud, not printed", () => {
    expect(body).toContain("[object Object]");
    expect(body).toMatch(/typeof v === "object"/);
  });
});

describe("gradedAgainstFromStates", () => {
  const HAND: SourceState = {
    kind: "hand",
    reading: { value: 71, at: "2026-09-08T10:00:00Z", by: "founder" },
  };
  const NONE: SourceState = { kind: "named-never-run", oracle: "eval", ref: "a" };

  test("says nothing at all when the states could not be read", () => {
    // The important one. "graded with no reading" on a track that HAD one is
    // worse than the shorter sentence, and a check that could not look must
    // not make the claim.
    expect(gradedAgainstFromStates(null)).toBeNull();
  });

  test("counts only what can produce a number", () => {
    expect(gradedAgainstFromStates([HAND, NONE])).toBe("graded against 1 reading");
    expect(gradedAgainstFromStates([NONE, NONE])).toBe("graded with no reading");
    expect(gradedAgainstFromStates([HAND, HAND])).toBe("graded against 2 readings");
    expect(gradedAgainstFromStates([])).toBe("graded with no success metric on the spec");
  });
});

describe("the verify says what it graded against, not only that it graded", () => {
  const body = require("node:fs").readFileSync(
    require("node:path").join(import.meta.dir, "driver.server.ts"),
    "utf8",
  ) as string;

  test("the learn branch composes the count and degrades silently", () => {
    /*
     * The check said only "The forecast was graded", which is equally true of
     * a verdict built from a recorded 71 and one built from nothing. Read from
     * source because verifyStationOutput needs a live client to exercise.
     */
    expect(body).toContain("gradedAgainstFromStates");
    expect(body).toContain("The forecast was graded (${gradedAgainst})");
    // And the short sentence survives for the case it cannot tell.
    expect(body).toContain('"The forecast was graded"');
  });
});
