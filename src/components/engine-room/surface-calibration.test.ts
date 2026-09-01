/**
 * QUALITY > BY SURFACE PRINTED 8463% (2026-09-01).
 *
 * The row computed `Math.round(cal.passRate * 100)` and rendered it with a
 * per-cent sign. The field named `passRate` holds the mean of
 * `eval_runs.avg_score`, which is a judge score OUT OF 100. Measured against
 * production the day it was found: 19 scored runs, min 68, max 91, mean 84.63.
 *
 * So the figure was two orders of magnitude wrong on the surface an engineer
 * opens to ask whether the product's own AI is behaving, and the name is what
 * carried the error: three other consumers of the same column render it bare
 * (`EvalsPanel.tsx:252`, `EvalSuiteDetail.tsx:216`, `:381`) and compare it
 * directly against `pass_threshold`, so this one was alone in believing it held
 * a ratio.
 *
 * THE COLOUR WAS THE WORSE HALF, and it is the reason nobody noticed the
 * number. The threshold read `passRatePct >= 90`, defended in its own comment
 * as "green only where it is an OUTCOME worth reporting: a surface passing at
 * or above ninety". Multiplied by 100, that is true of any score at or above
 * 0.9 -- so every surface was green, permanently, whatever it scored. The page
 * looked healthy no matter what the evals said, which is the exact opposite of
 * what a quality surface is for.
 */
import { describe, expect, it } from "bun:test";

import { allSuitesClear, scoreSurface, type SuiteResult } from "./surface-calibration";

/** The shape production actually holds: scores in the 68-91 band, bars at 70-80. */
const suite = (score: number | null, passThreshold = 75): SuiteResult => ({ score, passThreshold });

describe("a surface's score", () => {
  it("is a judge score out of 100 and is never rescaled", () => {
    // The production mean. If this ever comes back as 8463 or 0.8463, the
    // defect is back.
    const s = scoreSurface([suite(84.63)]);
    expect(s.avgScore).toBeCloseTo(84.63, 2);
    expect(Math.round(s.avgScore!)).toBe(85);
  });

  it("averages only the suites that actually ran", () => {
    const s = scoreSurface([suite(90), suite(null), suite(70)]);
    expect(s.avgScore).toBe(80);
    expect(s.runCount).toBe(2);
  });

  it("says nothing rather than zero when no suite has run", () => {
    // A surface with no runs is unmeasured, not failing. Rendering 0 would put
    // a verdict on a surface nobody has judged.
    const s = scoreSurface([suite(null), suite(null)]);
    expect(s.avgScore).toBeNull();
    expect(s.runCount).toBe(0);
    expect(allSuitesClear(s)).toBe(false);
  });
});

describe("the green verdict", () => {
  it("can come out the other way, which the old one could not", () => {
    expect(allSuitesClear(scoreSurface([suite(80, 75)]))).toBe(true);
    expect(allSuitesClear(scoreSurface([suite(70, 75)]))).toBe(false);
  });

  /*
   * THE CASE AVERAGING THE THRESHOLDS WOULD GET WRONG, and it is the reason
   * each suite is compared against its own bar rather than the surface being
   * compared once. Mean score 80, mean threshold 75, so a single comparison
   * says clear -- while the suite set to guard at 90 is failing by ten points.
   */
  it("is not carried by a lenient suite sitting next to a strict one", () => {
    const mixed = scoreSurface([suite(80, 90), suite(80, 60)]);
    expect(mixed.avgScore).toBe(80);
    expect(mixed.clearing).toBe(1);
    expect(allSuitesClear(mixed)).toBe(false);
  });

  it("holds for a surface whose suites all clear", () => {
    const s = scoreSurface([suite(91, 80), suite(84, 70), suite(88, 75)]);
    expect(s.clearing).toBe(3);
    expect(allSuitesClear(s)).toBe(true);
  });
});
