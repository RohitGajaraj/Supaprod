/**
 * LEARN MUST GRADE THE FORECAST, NOT THE SPEC (S4 → S0, 2026-08-27).
 *
 * `CLAUDE.md` calls the forecast captured at decision time **the moat**, and the
 * one thing no other vendor can reconstruct after the fact. `FILE_IT.decide`
 * refuses a decision that has no forecast, so every decision carries one.
 *
 * **Nothing has ever read one back.** S4 measured the whole population: the two
 * grading seats, `data-analyst` and `insight-keeper`, have had 18 runs between
 * them and `input ILIKE '%forecast%'` is false on **18 of 18** — including two
 * composed briefs of 7,800 characters. Not truncation, not deploy lag. It was
 * never sent.
 *
 * Two independent defects, and fixing either alone changes nothing:
 *
 *   1. THE BRIEF ASKED THE WRONG QUESTION. `FILE_IT.learn` and both seat jobs
 *      said "grade against the spec". The spec says what was built; the forecast
 *      says what we believed would happen.
 *   2. THE VALUES WERE NOT THERE. `ARTIFACT_SOURCE.decision` carried `title` and
 *      `rationale` only, so even a brief that asked for the forecast would have
 *      been asking about something absent. S4 flagged this explicitly as the
 *      thing not to assume.
 *
 * This also corrects S4-052, which read two wrong verdicts as a crew failure.
 * The crew did exactly what the brief said. Tuning that prompt would have broken
 * something that was working.
 */
import { describe, expect, it } from "bun:test";

import { ARTIFACT_SOURCE } from "./chain";
import { stationCrew, stationGoal, type UpstreamArtifact } from "./driver";

const TRACK = { title: "Let returning customers reuse a saved delivery address", origin: null };

/** A decision as the loader now composes it: rationale plus the labelled bet. */
const DECISION: UpstreamArtifact = {
  kind: "decision",
  id: "cb3ec477-3b0e-477c-95c2-c89ef53efde8",
  title: "Do not implement address reuse until post-fix abandonment evidence emerges",
  body: [
    "The redundant address re-confirm was already fixed via checkout_single_address.",
    "What we expected: Address reuse is not a material driver of checkout abandonment.",
    "How we would know: Session replays show <10% of abandonments occur after the single-address screen.",
    "Expected by: 2026-10-15",
  ].join("\n"),
};

const learnBriefs = () => [
  stationGoal("learn", TRACK, [DECISION]),
  ...stationCrew("learn").map((s) => stationGoal("learn", TRACK, [DECISION], s)),
];

describe("1 · the values travel with the decision", () => {
  it("the decision source carries its three forecast columns", () => {
    expect(ARTIFACT_SOURCE.decision.also).toEqual([
      "forecast_claim",
      "forecast_how_we_will_know",
      "forecast_horizon_date",
    ]);
  });

  it("and still carries the rationale, which explains the call", () => {
    // The forecast is what is graded; the rationale is why the call was made.
    // Losing one to gain the other would trade one blind spot for another.
    expect(ARTIFACT_SOURCE.decision.body).toBe("rationale");
  });
});

describe("2 · every Learn seat is asked to grade the prediction", () => {
  it("Learn has seats, or these assertions prove nothing", () => {
    expect(stationCrew("learn").length).toBeGreaterThan(0);
  });

  it("every brief names the forecast", () => {
    for (const b of learnBriefs()) {
      expect(b.toLowerCase()).toContain("forecast");
    }
  });

  it("and the bet's own words reach the seat", () => {
    // The whole point of carrying the columns: the grading seat can see the
    // claim, the observable and the date without another query.
    for (const b of learnBriefs()) {
      expect(b).toContain("Address reuse is not a material driver");
      expect(b).toContain("Session replays show <10%");
      expect(b).toContain("2026-10-15");
    }
  });
});

describe("3 · the refusals that keep a verdict honest", () => {
  const brief = stationGoal("learn", TRACK, [DECISION]);

  it("it must quote the observable's real value, not something adjacent", () => {
    expect(brief).toContain("quote the number you read");
  });

  it("an unreadable observable is said, not worked around", () => {
    expect(brief).toContain("cannot be read");
  });

  it("and grading before the horizon is refused outright", () => {
    // The measured failure: two verdicts written four days BEFORE the bet came
    // due, against a horizon that was still in the future.
    expect(brief).toContain("do not grade at all");
  });

  it("the spec still attaches the grade, so nothing was traded away", () => {
    expect(brief).toContain("prd_id");
    expect(brief).toContain("decision_id");
  });
});
