/**
 * "COMPARED 4 FILES" WAS THE DENOMINATOR, AND IT IS NOT THE ONE THAT MATTERS.
 *
 * `verdict-reading.ts` said so about itself, in its own header, before this
 * landed: *"'Compared N files' is the denominator the review actually recorded.
 * It is NOT 'compared N acceptance lines', which is what the verdict should
 * eventually be measured against and which no row carries today."*
 *
 * A file count is the size of what was READ. It says nothing about whether the
 * change does what was asked, which is the only question Build exists to answer.
 * Now that the row carries the acceptance lines, the sharper denominator is real
 * and the file count is what a review falls back to when there are none.
 *
 * ── WHAT THIS FILE HOLDS ───────────────────────────────────────────────────
 * That the strip and the pane read ONE source. They are two surfaces on one
 * screen and the failure that matters is not either of them being wrong alone --
 * it is them disagreeing, because then neither can be believed and a person has
 * to go and check. `verdictLine` and `verdictProps` both go through
 * `comparedLines`, and these tests are what keeps that true.
 */
import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import { Verdict } from "@/components/meridian/verdict";
import {
  comparedLine,
  comparedLines,
  parseReview,
  verdictLine,
  verdictProps,
} from "@/components/track/verdict-reading";

const review = (compared: unknown, extra: Record<string, unknown> = {}) => ({
  verdict: "revise",
  summary: "Adds Amex to the card form.",
  files_reviewed: 4,
  compared,
  ...extra,
});

const LINES = [
  { line: "The card form accepts an Amex number", held: true },
  { line: "The error names the failing field", held: false, why: "no field is named" },
];

describe("the denominator is what was asked for, when there is one", () => {
  it("counts the lines, and says how they went", () => {
    expect(comparedLine(review(LINES))).toBe(
      "Compared 2 lines of what was asked for · 1 held · 1 did not",
    );
  });

  it("says all held rather than '2 held · 0 did not'", () => {
    // A zero is not a figure. Printing "0 did not" makes a reader look for the
    // thing that failed, and there isn't one.
    expect(comparedLine(review([LINES[0]]))).toBe(
      "Compared 1 line of what was asked for · all held",
    );
  });

  it("falls back to the file count for a review written before any of this", () => {
    /*
     * Every `code_review` on the database today. The file count is a weaker
     * sentence and it is still a true one, which is the whole reason it stays:
     * "nothing was compared" would be false.
     */
    expect(comparedLine(review(undefined))).toBe("Compared 4 files against the change");
    expect(comparedLine(review([]))).toBe("Compared 4 files against the change");
  });

  it("says nothing when it has neither", () => {
    expect(comparedLine({ verdict: "approve" })).toBeNull();
  });
});

describe("the strip and the pane cannot disagree", () => {
  it("both read the same lines from the same column", () => {
    const raw = review(LINES);
    expect(verdictProps(raw).checks).toEqual(comparedLines(parseReview(raw)));
    expect(verdictProps(raw).compared).toBe(comparedLine(parseReview(raw)));
  });

  it("the strip spends its one clause on the miss, not on the findings", () => {
    /*
     * The clause a person reads decides where they go next. "2 lines did not
     * hold" sends them to the spec; "3 findings" sends them to the diff, and
     * somebody who reads the second and acts on it has fixed the wrong thing.
     */
    const raw = review(LINES, {
      findings: [{ severity: "minor", category: "convention", issue: "naming" }],
    });
    expect(verdictLine(parseReview(raw))).toBe("Verdict at Build: revise, 1 line did not hold");
  });

  it("names the findings only when nothing was asked for", () => {
    const raw = review(undefined, {
      verdict: "revise",
      findings: [{ severity: "major", category: "correctness", issue: "off by one" }],
    });
    expect(verdictLine(parseReview(raw))).toBe("Verdict at Build: revise, 1 finding");
  });

  it("says every line held when every line held", () => {
    const raw = review([LINES[0]], { verdict: "approve", findings: [] });
    expect(verdictLine(parseReview(raw))).toBe(
      "Verdict at Build: nothing blocking, all 1 line held",
    );
  });
});

describe("a clean pass is not claimed over a line that missed", () => {
  it("does not say 'every line held' when one did not", () => {
    /*
     * `clean` draws when there are NO findings, and a change can raise no
     * findings and still miss two acceptance lines. Printing "every line held"
     * underneath those two is the block arguing with itself.
     */
    const p = verdictProps(review(LINES, { findings: [] }));
    expect(p.clean).toBe("It raised nothing else against the code itself.");
  });

  it("does say it when they all held", () => {
    const p = verdictProps(review([LINES[0]], { findings: [] }));
    expect(p.clean).toBe("Every line it was asked to check held, and it raised nothing.");
  });
});

describe("what a person sees", () => {
  it("prints each line in the author's words, with its verdict beside it", () => {
    render(<Verdict label="The verdict on this change" {...verdictProps(review(LINES))} />);
    expect(screen.getByText("The card form accepts an Amex number")).toBeTruthy();
    expect(screen.getByText("The error names the failing field")).toBeTruthy();
    // The reason, only on the one that did not hold.
    expect(screen.getByText("no field is named")).toBeTruthy();
    expect(screen.getByText("holds")).toBeTruthy();
    expect(screen.getByText("did not")).toBeTruthy();
  });

  it("draws nothing extra for a review that carries no lines", () => {
    const { container } = render(
      <Verdict label="The verdict on this change" {...verdictProps(review(undefined))} />,
    );
    expect(container.querySelector("ul")).toBeNull();
    expect(screen.getByText("Compared 4 files against the change")).toBeTruthy();
  });

  it("still says why there is no verdict at all, which is the common case", () => {
    render(<Verdict label="The verdict on this change" {...verdictProps(null)} />);
    expect(screen.getByText(/has not run on this change yet/)).toBeTruthy();
  });
});

describe("the column, in every shape it arrives in", () => {
  it("drops a line with no text rather than drawing an empty row", () => {
    expect(comparedLines(parseReview(review([{ line: "  ", held: true }, LINES[0]])))).toHaveLength(
      1,
    );
  });

  it("treats a missing held as not held, never as a pass", () => {
    // The safe direction: an unreadable judgment must not read as approval.
    expect(comparedLines(parseReview(review([{ line: "x" }])))[0].held).toBe(false);
  });

  it("survives anything at all in the column", () => {
    for (const raw of ["nope", 3, null, [null], {}]) {
      expect(comparedLines(parseReview(review(raw)))).toEqual([]);
    }
  });
});
