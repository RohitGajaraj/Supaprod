/**
 * THE VERDICT AT BUILD, AND THE TWO WAYS IT CAN BE ABSENT.
 *
 * ── THE ABSENCE IS THE COMMON CASE, MEASURED ──────────────────────────────
 * `track.functions.ts:1224` records it: **0 of 45 changesets carry a review**,
 * because `studio.review` has never once run successfully. So the sentence a
 * person will actually meet on this pane is the absence, and most of this file
 * is about that sentence rather than about the verdict.
 *
 * ── AND THERE ARE TWO ABSENCES, WHICH ARE NOT THE SAME FACT ───────────────
 *
 *   no `code_review` at all     the reviewer never ran on this change
 *   `verdict: "unreviewed"`     it ran and returned no judgment
 *
 * `studio.review`'s own tool description is explicit that the second **"is not
 * a pass"**. Collapsing them into one line is the substitution this repo keeps
 * paying for: it turns "nobody checked" and "the check could not conclude" into
 * one shrug, and only one of those is a reason to look at the diff yourself.
 */
import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";

import { Verdict } from "@/components/meridian/verdict";
import {
  hasVerdict,
  parseReview,
  verdictLine,
  verdictProps,
  whyNoVerdict,
} from "./verdict-reading";

/*
 * ── THE BLOCK IS MERIDIAN'S NOW, THE READING IS NOT (P-19) ────────────────
 * These render the primitive through the reading, which is exactly the seam the
 * promotion created: `verdictProps` turns a `code_review` column into facts, and
 * `meridian/verdict.tsx` draws facts and has never heard of the column. Testing
 * them together is the right grain, because the thing worth protecting is that a
 * person sees the same sentence either way.
 */
const render_ = (raw: unknown) => (
  <Verdict label="The verdict on this change" {...verdictProps(raw)} />
);

describe("reading the column", () => {
  it("takes the object PostgREST returns and the string some writers store", () => {
    expect(parseReview({ verdict: "approve" })?.verdict).toBe("approve");
    expect(parseReview('{"verdict":"block"}')?.verdict).toBe("block");
  });

  it("returns null on anything it cannot trust, rather than half a review", () => {
    // A half-parsed review rendered as a verdict is the one output worse than
    // none: it is a judgment nobody made, printed with a chip beside it.
    expect(parseReview("{not json")).toBeNull();
    expect(parseReview(null)).toBeNull();
    expect(parseReview(7)).toBeNull();
  });

  it("does not count `unreviewed` as a verdict", () => {
    expect(hasVerdict(parseReview({ verdict: "unreviewed" }))).toBe(false);
    expect(hasVerdict(parseReview({ verdict: "approve" }))).toBe(true);
    expect(hasVerdict(null)).toBe(false);
  });
});

describe("the two absences say different things", () => {
  it("distinguishes never-ran from ran-and-concluded-nothing", () => {
    const neverRan = whyNoVerdict(null);
    const ranAndSaidNothing = whyNoVerdict(parseReview({ verdict: "unreviewed" }));
    expect(neverRan).not.toBe(ranAndSaidNothing);
    expect(neverRan).toContain("has not run");
    expect(ranAndSaidNothing).toContain("is not a pass");
  });

  it("renders one line and names the reason, never a chip", () => {
    const { container } = render(render_(null));
    const text = container.textContent ?? "";
    expect(text).toContain("has not run on this change yet");
    // No chip: there is no verdict to wear one, and a chip over an absence is a
    // judgment the record did not make.
    expect(container.querySelectorAll("[data-status]").length).toBe(0);
  });
});

describe("a verdict states what it compared before what it concluded", () => {
  const review = {
    verdict: "revise",
    summary: "Two things to look at before this merges.",
    files_reviewed: 6,
    reviewer_model: "gemini-2.5-pro",
    findings: [
      {
        severity: "minor",
        category: "convention",
        path: "src/b.ts",
        line: 12,
        issue: "Names the tool id at the user.",
        deterministic: false,
      },
      {
        severity: "blocker",
        category: "security",
        path: "src/a.ts",
        line: 40,
        issue: "A credential on an added line.",
        fix: "Move it to an env var.",
        deterministic: true,
      },
    ],
  };

  it("prints the denominator, because a verdict without one is an opinion", () => {
    const { container } = render(render_(review));
    expect(container.textContent).toContain("Compared 6 files against the change");
  });

  it("puts the blocker above the minor finding", () => {
    const { container } = render(render_(review));
    const text = container.textContent ?? "";
    expect(text.indexOf("credential")).toBeLessThan(text.indexOf("Names the tool id"));
  });

  it("cites the line each finding read, so the claim can be followed back", () => {
    const { container } = render(render_(review));
    const text = container.textContent ?? "";
    expect(text).toContain("src/a.ts:40");
    expect(text).toContain("src/b.ts:12");
  });

  it("says whether a finding was checked or judged", () => {
    const { container } = render(render_(review));
    const text = container.textContent ?? "";
    expect(text).toContain("checked");
    expect(text).toContain("judged");
  });

  it("says a clean pass out loud rather than leaving an empty space", () => {
    const { container } = render(render_({ verdict: "approve", findings: [], files_reviewed: 4 }));
    expect(container.textContent).toContain("Every line it checked held");
  });

  it("wears exactly one chip, which is the verdict's own", () => {
    const { container } = render(render_(review));
    expect(container.querySelectorAll("[data-status]").length).toBe(1);
  });
});

describe("the one-line form the strip above the pane uses", () => {
  it("says the verdict and how much it raised", () => {
    expect(verdictLine(parseReview({ verdict: "approve", findings: [] }))).toBe(
      "Verdict at Build: nothing blocking",
    );
    expect(verdictLine(parseReview({ verdict: "block", findings: [{}, {}] }))).toBe(
      "Verdict at Build: blocked, 2 findings",
    );
    expect(verdictLine(parseReview({ verdict: "revise", findings: [{}] }))).toBe(
      "Verdict at Build: revise, 1 finding",
    );
  });

  it("is silent on both absences, because the strip lists what you got", () => {
    expect(verdictLine(null)).toBeNull();
    expect(verdictLine(parseReview({ verdict: "unreviewed" }))).toBeNull();
  });
});
