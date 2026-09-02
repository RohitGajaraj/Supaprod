/**
 * A VERDICT ON A MEASURED CLAIM, PRINTED WITHOUT THE MEASUREMENT.
 *
 * The Learn tab reads "Predicted → Actually". The Predicted block states the
 * observable the forecast named ("How we will know: checkout completion for
 * saved-address customers"). The Actually block stated the verdict and the
 * grader's rationale — and the NUMBER it read was rendered two blocks further
 * down, under the spec-outcome chip.
 *
 * That is a different question. `forecast-words.ts` is emphatic that "did
 * shipping this pay off" and "was the belief correct" are orthogonal, and a
 * single event can take different values in each. So the reading sat beside the
 * wrong verdict, and the forecast verdict — the one this product calls its moat
 * — was an assertion with its evidence somewhere else on the page.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const SRC = readFileSync("src/components/track/ArtifactPane.tsx", "utf8");
const code = SRC.replace(/\{\/\*[\s\S]*?\*\/\}/g, " ").replace(/\/\*[\s\S]*?\*\//g, " ");

/** The Learn body's "Actually" block, where the forecast verdict is drawn. */
const ACTUALLY = code.slice(
  code.indexOf('<span className="mrd-eyebrow">Actually</span>'),
  code.indexOf("{!resolution && nextCheck ?"),
);

describe("the forecast verdict carries the reading it was decided on", () => {
  it("draws the measured value inside the Actually block", () => {
    expect(ACTUALLY).toContain("metricLabel && metricValue");
    expect(ACTUALLY).toContain("{metricLabel}: {metricValue}");
  });

  it("draws it beside the verdict chip, not under the rationale", () => {
    // The chip and the number are one line: the answer and what it was read
    // from. The rationale is prose underneath and belongs on its own.
    const chipAt = ACTUALLY.indexOf("forecastSays(resolution)");
    const metricAt = ACTUALLY.indexOf("{metricLabel}: {metricValue}");
    const rationaleAt = ACTUALLY.indexOf("{rationale}");
    expect(chipAt).toBeLessThan(metricAt);
    expect(metricAt).toBeLessThan(rationaleAt);
  });

  it("says nothing rather than an empty rationale line", () => {
    // `forecast_resolution_rationale` is nullable, and an empty grey line under
    // a verdict reads as a component that failed to finish drawing.
    expect(ACTUALLY).toContain("{rationale ? (");
  });
});

describe("and it is not printed twice on one screen", () => {
  const OUTCOME = code.slice(code.indexOf('<StatusChip status="pass">Held up</StatusChip>'));

  it("the spec-outcome chip shows the number only when no forecast verdict does", () => {
    /*
     * One number rendered twice on one page reads as a bug. The outcome chip
     * already answers its own question in words ("Held up", "Did not hold"), so
     * it yields the reading to the forecast verdict when there is one.
     */
    expect(OUTCOME).toContain("!resolution && metricLabel && metricValue");
  });

  it("but still shows it when there is no forecast verdict to sit beside", () => {
    // Then this IS its only home, and dropping it would lose the measurement
    // from the screen entirely.
    expect(OUTCOME).toContain("{metricLabel}: {metricValue}");
  });
});

describe("what the block already did and must keep doing", () => {
  it("still names who graded it, agent or person", () => {
    expect(ACTUALLY).toContain("Graded by the ${agentDisplayName(resolvedBy)} agent");
    expect(ACTUALLY).toContain('"Graded by you"');
  });

  it("still tells an ungraded bet apart from an undue one", () => {
    // Two different facts and two different sentences: past its date and nobody
    // graded it, versus not due yet. Flattening them would hide the first.
    expect(ACTUALLY).toContain("and not graded.");
    expect(ACTUALLY).toContain("Not due until");
  });

  it("still says when there was nothing to check against at all", () => {
    expect(ACTUALLY).toContain("Nothing was recorded as expected");
  });
});
