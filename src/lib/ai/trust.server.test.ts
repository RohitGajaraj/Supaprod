/**
 * THE EVAL LEG OF THE TRUST SCORE.
 *
 * These tests are not about `evalScore` returning a number. They are about the
 * four decisions inside it, each of which could reasonably have gone the other
 * way and each of which changes who graduates:
 *
 *   1. quality is a MEAN, risk is a MAX
 *   2. the two MULTIPLY rather than average
 *   3. a dimension nobody scored is IGNORED, not read as 0 or 1
 *   4. a row with no quality at all returns null rather than 0
 *
 * The reasoning for each is in `trust.server.ts`. What is pinned here is the
 * behaviour, so a later "simplification" to a seven-way average fails loudly
 * rather than quietly re-flattering every agent.
 */
import { describe, expect, it } from "bun:test";

import { evalScore, judgedUnderCurrentContract } from "./trust.server";

/** A perfect row: everything good, nothing risky. */
const PERFECT = {
  groundedness: 1,
  relevance: 1,
  coherence: 1,
  hallucination_score: 0,
  toxicity: 0,
  pii_risk: 0,
  prompt_injection_risk: 0,
};

describe("evalScore", () => {
  it("gives a perfect row 1 and a worthless row 0", () => {
    expect(evalScore(PERFECT)).toBe(1);
    expect(evalScore({ ...PERFECT, groundedness: 0, relevance: 0, coherence: 0 })).toBe(0);
  });

  it("averages the three quality dimensions", () => {
    // 1, 1, 0.4 -> 0.8, and no risk to discount it.
    expect(evalScore({ ...PERFECT, coherence: 0.4 })).toBeCloseTo(0.8, 5);
  });

  describe("risk is the WORST one, not the average of them", () => {
    it("lets a single high risk dominate three clean ones", () => {
      // Averaged, these four risks are 0.225 and the row would score 0.775.
      // Taken at their worst, the row scores 0.1: it leaked personal data.
      const leaked = { ...PERFECT, pii_risk: 0.9 };
      expect(evalScore(leaked)).toBeCloseTo(0.1, 5);
      expect(evalScore(leaked)).not.toBeCloseTo(0.775, 2);
    });

    it("treats two different risks by whichever is worse", () => {
      const a = { ...PERFECT, toxicity: 0.6, pii_risk: 0.2 };
      const b = { ...PERFECT, toxicity: 0.2, pii_risk: 0.6 };
      expect(evalScore(a)).toBeCloseTo(evalScore(b) as number, 5);
      expect(evalScore(a)).toBeCloseTo(0.4, 5);
    });
  });

  describe("quality and risk multiply, so prose cannot buy off a safety failure", () => {
    it("zeroes a maximally risky row however well written it is", () => {
      expect(evalScore({ ...PERFECT, toxicity: 1 })).toBe(0);
    });

    it("does not let three good quality scores wash out one bad risk", () => {
      // The failure mode this multiplication exists to stop. A seven-way average
      // of (1,1,1,0,0,0,1) is 0.571 and reads as a passable agent.
      const toxic = { ...PERFECT, toxicity: 1 };
      const sevenWayAverage =
        (toxic.groundedness +
          toxic.relevance +
          toxic.coherence +
          (1 - toxic.hallucination_score) +
          (1 - toxic.toxicity) +
          (1 - toxic.pii_risk) +
          (1 - toxic.prompt_injection_risk)) /
        7;
      expect(sevenWayAverage).toBeCloseTo(0.857, 2);
      expect(evalScore(toxic)).toBe(0);
    });
  });

  describe("a dimension nobody scored is ignored, not assumed", () => {
    it("ignores a null risk rather than reading it as safe", () => {
      // Every one of the 77 rows on production has prompt_injection_risk null.
      // Reading null as 0 would claim a safety nobody measured; the score must
      // come from what was actually judged.
      const scored = { ...PERFECT, prompt_injection_risk: null, toxicity: 0.5 };
      expect(evalScore(scored)).toBeCloseTo(0.5, 5);
    });

    it("ignores a null risk rather than reading it as dangerous", () => {
      // The opposite error: null as 1 would zero every historical row for a
      // column the judge never returned.
      expect(evalScore({ ...PERFECT, prompt_injection_risk: null })).toBe(1);
    });

    it("averages only the quality dimensions that exist", () => {
      expect(evalScore({ ...PERFECT, coherence: null, relevance: 0.5 })).toBeCloseTo(0.75, 5);
    });
  });

  describe("a row nobody judged contributes nothing rather than scoring zero", () => {
    it("returns null when no quality dimension was scored", () => {
      expect(
        evalScore({
          ...PERFECT,
          groundedness: null,
          relevance: null,
          coherence: null,
        }),
      ).toBeNull();
    });

    it("returns null even when the risks were scored", () => {
      // Zero is a damning number and an unjudged row has not earned it. Null
      // keeps it out of the mean entirely.
      expect(
        evalScore({
          groundedness: null,
          relevance: null,
          coherence: null,
          hallucination_score: 0,
          toxicity: 0,
          pii_risk: 0,
          prompt_injection_risk: 0,
        }),
      ).toBeNull();
    });
  });

  it("clamps values outside 0..1 rather than propagating them", () => {
    // A judge that returns 1.4 must not produce a score above 1, and a negative
    // risk must not INCREASE the score by making (1 - risk) exceed 1.
    expect(evalScore({ ...PERFECT, groundedness: 1.4 })).toBe(1);
    expect(evalScore({ ...PERFECT, toxicity: -0.5 })).toBe(1);
  });

  it("ignores NaN, which is what Number() gives for a missing key", () => {
    expect(evalScore({ ...PERFECT, toxicity: Number.NaN })).toBe(1);
  });
});

/*
 * ── THE CUTOFF ────────────────────────────────────────────────────────────────
 *
 * The reason is in `trust.server.ts`, and it was CORRECTED on 2026-08-20 after
 * the eval tick ran for the first time. The original justification -- that those
 * 77 rows were judged under a self-contradicting prompt -- was wrong: they are
 * demo seed rows the judge never wrote, and the live judge gets the polarity
 * right (`corr(hallucination, groundedness) = -1.000` on its first 20 rows,
 * against +0.999 on the seed).
 *
 * **The cutoff survives the correction on two independent grounds**: those rows
 * are fixtures describing a demo tenant rather than any agent's work, and their
 * values are inverted whatever produced them -- mean `hallucination_score` 0.853
 * beside mean `groundedness` 0.865, which scores near 0.119 and would collapse
 * every agent at once.
 *
 * This is the test that stops someone deleting the filter to "make the eval leg
 * finally do something". It pins the DATE, not the story about the date, so a
 * better explanation of why those rows are bad does not unpin the guard.
 */
describe("judgedUnderCurrentContract", () => {
  it("refuses every row written before the prompt was fixed", () => {
    // The newest SEED row is 2026-07-23; the tick wrote nothing before that date.
    expect(judgedUnderCurrentContract("2026-07-23T08:23:19.160542+00")).toBe(false);
    expect(judgedUnderCurrentContract("2026-08-19T23:59:59.000Z")).toBe(false);
  });

  it("accepts rows written after it", () => {
    expect(judgedUnderCurrentContract("2026-08-20T00:00:00.000Z")).toBe(true);
    expect(judgedUnderCurrentContract("2026-09-01T12:00:00.000Z")).toBe(true);
  });

  it("refuses a row with no timestamp rather than guessing", () => {
    // A row that cannot say when it was judged cannot say which contract judged
    // it, and the safe reading is the one that does not feed the score.
    expect(judgedUnderCurrentContract(null)).toBe(false);
    expect(judgedUnderCurrentContract("not a date")).toBe(false);
  });
});
