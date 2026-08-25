/**
 * A REFUSED TURN DOES NOT READ AS A QUIET ONE.
 *
 * ── THE DEFECT, LIVE ON TRACK `7977dc06` ────────────────────────────────
 * `completed_with_failures` mapped to the `partly` outcome, and `partly` fell
 * through `chipOf` to `null`. So this row:
 *
 *   status  completed_with_failures
 *   filed   nothing
 *   said    "Repository access failed: GitHub 404. I cannot proceed with
 *            implementation work without mapping the project structure first."
 *
 * drew a plain grey line, with no chip, reading *"Studio finished, filing
 * nothing"* -- visually identical to the Critique seat two rows above it, which
 * had run cleanly, had nothing to add, and was entirely fine. A person scanning
 * the column could not tell the locked door from the shrug.
 *
 * ── WHAT THIS PINS, AND WHY EACH ONE IS A REGRESSION SOMEBODY WOULD MAKE ─
 *
 *   THE DISCRIMINATOR IS TWO RECORDS AGREEING, never one. Chipping every
 *   `completed_with_failures` row would put a chip on 810 of the 2,272
 *   track-linked runs, most of which filed their work perfectly well; chipping
 *   every empty-handed turn would chip the Critique and Verify seats, whose job
 *   is to return a verdict and file nothing. Either alone buries the row this
 *   exists to surface, so both are asserted in the negative as well.
 *
 *   THE MEANING IS IN THE WORD, not the hue. Law 3: remove all colour and the
 *   chip must still say what it says. So the assertion is on `textContent`, and
 *   the tone is checked separately through `data-status` rather than instead.
 *
 *   A STOP SURVIVES FILING SOMETHING. The headline used to test `made.length`
 *   first, so a run that filed a code change and was then stopped read as a
 *   clean filing and left the stop to a chip alone.
 *
 *   A MISSING FIGURE PRINTS NOTHING, not a zero and not a stray separator.
 *
 * happy-dom carries no stylesheet, so a class name is the honest limit on what
 * a render can prove about paint. That is the precedent `catalog-parts.test.tsx`
 * and `refused.test.tsx` already set in this repo.
 */
import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";

import type { Turn } from "@/lib/spine/activity";
import { RunRollup } from "@/components/meridian/run-rows";
import { chipOf, headline, rollupOf, type TitleBook } from "./TrackActivity";

const turn = (o: Partial<Turn>): Turn => ({
  runId: "r1",
  agentSlug: "builder",
  agentName: "Studio",
  station: "build",
  stationName: "Build",
  at: "2026-08-25T11:26:23.941Z",
  outcome: "done",
  made: [],
  said: null,
  tookMs: null,
  tokens: null,
  stopLine: null,
  usd: 0,
  ...o,
});

/** The real Build seat turn that drew a neutral entry. */
const REFUSED = turn({
  outcome: "partly",
  made: [],
  said: "Repository access failed: GitHub 404 on /repos/RohitGajaraj/helio-prism-build. I cannot proceed with implementation work without mapping the project structure first.",
  tookMs: 8228,
  tokens: 19411,
});

/** The Discovery Scout turn: same status, and it did the work. */
const DID_THE_WORK = turn({
  agentName: "Discovery Scout",
  station: "sense",
  stationName: "Discover",
  outcome: "partly",
  made: [
    { kind: "signal", word: "signal", id: "162fc64d" },
    { kind: "signal", word: "signal", id: "d676c37c" },
  ],
  tookMs: 76207,
  tokens: 65732,
});

/** The Critique seat: clean run, nothing to file, and nothing wrong. */
const CLEAN_VERDICT = turn({
  agentName: "Critique",
  station: "design",
  stationName: "Design",
  outcome: "done",
  made: [],
  said: "The design is sound.",
  tookMs: 26197,
  tokens: 19300,
});

function chipMarkup(t: Turn): HTMLElement | null {
  const node = chipOf(t);
  if (!node) return null;
  const { container } = render(node);
  return container.firstElementChild as HTMLElement;
}

function rollupText(t: Turn, titles: TitleBook = new Map()): string {
  const { container } = render(<RunRollup items={rollupOf(t, titles)} />);
  return container.textContent ?? "";
}

describe("the turn that hit a locked door", () => {
  it("wears a chip, where it used to wear none at all", () => {
    const chip = chipMarkup(REFUSED);
    expect(chip, "a refused turn is back to being a plain grey line").not.toBeNull();
  });

  it("says what happened in words, so it survives greyscale", () => {
    expect(chipMarkup(REFUSED)?.textContent).toBe("Nothing filed");
  });

  it("carries the outcome tone, which is fail and not hold", () => {
    // `hold` means stopped and waiting on a condition. This turn is over.
    expect(chipMarkup(REFUSED)?.getAttribute("data-status")).toBe("fail");
  });

  it("names the empty hands in the headline rather than burying them", () => {
    expect(headline(REFUSED)).toBe("Studio filed nothing");
  });

  it("still shows the seat's own claim, which is the disagreement a reader judges", () => {
    // The record says nothing was filed. The seat says it could not proceed.
    // Both are on the row. Neither is graded by the other.
    expect(REFUSED.said).toContain("I cannot proceed");
  });
});

describe("what must NOT get a chip, or the chip stops meaning anything", () => {
  it("leaves a with-failures turn that filed its work alone", () => {
    // 810 of 2,272 track-linked runs carry this status and most did the job.
    expect(chipMarkup(DID_THE_WORK)).toBeNull();
    expect(headline(DID_THE_WORK)).toBe("Discovery Scout filed 2 signals");
  });

  it("leaves a clean run that had nothing to add alone", () => {
    // Critique and Verify return verdicts. Filing nothing is the job, not a fault.
    expect(chipMarkup(CLEAN_VERDICT)).toBeNull();
    expect(headline(CLEAN_VERDICT)).toBe("Critique filed nothing");
  });
});

describe("a turn the platform stopped", () => {
  const HALTED = turn({
    outcome: "stopped",
    stopLine: "Stopped: out of credit.",
    tookMs: 895,
    tokens: null,
  });

  it("reads as stopped and not as a finish", () => {
    expect(chipMarkup(HALTED)?.textContent).toBe("Stopped");
    expect(chipMarkup(HALTED)?.getAttribute("data-status")).toBe("fail");
    expect(headline(HALTED)).toBe("Studio was stopped, filing nothing");
  });

  it("keeps the stop in the sentence even when the turn DID file something", () => {
    // The regression: `made.length` was tested first, so this read as a clean
    // filing and the stop survived only in a chip.
    const stoppedAfterFiling = turn({
      outcome: "stopped",
      made: [{ kind: "changeset", word: "code change", id: "f9354439" }],
    });
    expect(headline(stoppedAfterFiling)).toBe("Studio was stopped after filing a code change");
  });
});

describe("the rollup prints measurements and never placeholders", () => {
  it("gives the duration and the token count in one line", () => {
    const text = rollupText(DID_THE_WORK);
    expect(text).toContain("Worked for 1m 16s");
    expect(text).toContain("65,732 tokens");
  });

  it("prints no duration at all when nothing measured one", () => {
    // THE FAIL DIRECTION, and the one that matters most: 917 of 2,272
    // track-linked runs carry a null or a hardcoded zero here.
    const text = rollupText(turn({ tookMs: null, tokens: 19411 }));
    expect(text).not.toContain("0s");
    expect(text).not.toContain("Worked");
    expect(text).toContain("19,411 tokens");
  });

  it("drops a missing figure without leaving its separator behind", () => {
    const text = rollupText(turn({ tookMs: null, tokens: null }));
    expect(text.trim()).toBe("");
  });

  it("draws nothing whatsoever when a turn has no facts to roll up", () => {
    const { container } = render(<RunRollup items={[null, false, undefined]} />);
    expect(container.innerHTML).toBe("");
  });
});

describe("the artifact chip is the record's account, not the agent's", () => {
  const FILED = turn({
    agentName: "Draft",
    station: "define",
    stationName: "Plan",
    made: [{ kind: "prd", word: "spec", id: "b401ccd4" }],
    tookMs: 35353,
  });

  it("names the thing that was filed, by its own title", () => {
    const titles: TitleBook = new Map([
      ["b401ccd4", { title: "Homeowners abandon checkout on the address screen", missing: false }],
    ]);
    const text = rollupText(FILED, titles);
    expect(text).toContain("spec");
    expect(text).toContain("Homeowners abandon checkout on the address screen");
  });

  it("shows the kind alone when the title has not been resolved yet", () => {
    // The chain read is a separate query. A freshly filed artifact has a kind
    // before it has a name, and a chip with no name beats a chip with a guess.
    const text = rollupText(FILED, new Map());
    expect(text).toContain("spec");
    expect(text).not.toContain("undefined");
    expect(text).not.toContain("null");
  });

  it("says so when the artifact no longer resolves", () => {
    // `missing` means the lookup RAN and the row was gone, which is a different
    // fact from a lookup that never happened.
    const titles: TitleBook = new Map([["b401ccd4", { title: null, missing: true }]]);
    expect(rollupText(FILED, titles)).toContain("no longer on file");
  });

  it("draws one chip per artifact, in filing order", () => {
    const titles: TitleBook = new Map([
      ["162fc64d", { title: "41 percent of abandonments happened on that screen", missing: false }],
      ["d676c37c", { title: "session replays showed people re-typing an address", missing: false }],
    ]);
    const text = rollupText(DID_THE_WORK, titles);
    expect(text.indexOf("41 percent")).toBeLessThan(text.indexOf("session replays"));
  });
});
