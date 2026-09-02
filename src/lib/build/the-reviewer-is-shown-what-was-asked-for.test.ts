/**
 * THE SEAT WHOSE JOB IS "CHECK THE CHANGE AGAINST THE SPEC" HAD NEVER SEEN ONE.
 *
 * ── THE GAP, MEASURED ──────────────────────────────────────────────────────
 * `CREW_ROLE.qa.job` opens with "Check the change against the spec before it
 * goes anywhere", and sends the seat to `studio.review`. That tool built its
 * `intent` from the changeset title and the mission's title and goal, and
 * nothing else: `grep -n "acceptance|spec|prd" code-review.server.ts` returned
 * nothing at all. The reviewer judged security, correctness, error handling,
 * scope and convention -- every one a property of the DIFF -- and the one
 * question Build exists to answer was not among them.
 *
 * So a changeset could be clean code that builds the wrong thing and come back
 * `approve`, and nothing downstream would disagree until Learn graded it months
 * later against lines the reviewer was never shown.
 *
 * ── WHY THE LINES COME FROM `intentPointsWithSource` ───────────────────────
 * Because Learn already grades with it. Two functions deriving acceptance lines
 * separately is exactly how Build passes what Learn then marks unmet, and once
 * those two disagree neither can be believed. Reusing the function is what makes
 * that impossible rather than unlikely.
 *
 * It also resolves the constraint `spec-contract.ts` documents: `prds.contract`
 * carries success metrics on 2 of 119 specs, and 94 of the other 117 carry
 * acceptance criteria in the body. A contract-only reader would have found
 * nothing on 117 specs and reported it as "no acceptance lines", which is the
 * common case described as a failure.
 *
 * ── AND WHY THIS IS NOT THE THING `spec-contract.ts` REFUSES TO DO ─────────
 * That file deliberately detects rather than extracts, and its reason is a
 * PRESENTATION reason, stated in its own header: extraction "would put text on
 * screen under a heading the author never agreed to, and a wrong parse would
 * then be a wrong promise". Nothing here presents extracted text as the author's
 * contract. The lines are what the REVIEWER says it compared, attributed to the
 * reviewer, printed beside its judgment of each -- which is the reviewer
 * disclosing its own reading, and is what makes a wrong reading visible instead
 * of hidden.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import {
  decideReviewVerdict,
  linesThatDidNotHold,
  parseComparedLines,
  type ChangesetReview,
} from "./code-review";
import { extractIntentPoints, intentPointsWithSource } from "@/lib/intent-diff";

const LINES = ["The card form accepts an Amex number", "The error names the failing field"];

describe("reading the per-line verdicts back", () => {
  it("matches on the line, not on position", () => {
    /*
     * THE ONE THAT MATTERS MOST. Zipping by index is the obvious parse and it
     * fails the way it always fails: a reviewer that returns verdicts out of
     * order shifts every judgment onto the wrong line and the result looks
     * complete. Here the second line's verdict arrives first.
     */
    const out = parseComparedLines(
      {
        acceptance: [
          { line: LINES[1], held: false, why: "no field is named" },
          { line: LINES[0], held: true },
        ],
      },
      LINES,
    );
    expect(out.map((c) => c.line)).toEqual(LINES);
    expect(out[0].held).toBe(true);
    expect(out[1].held).toBe(false);
  });

  it("tolerates a list marker and whitespace, which models add and remove freely", () => {
    const out = parseComparedLines({ acceptance: [{ line: `  - ${LINES[0]}  `, held: true }] }, [
      LINES[0],
    ]);
    expect(out[0].held).toBe(true);
  });

  it("discards a verdict on a line nobody sent", () => {
    // Otherwise the reviewer could invent an acceptance line, mark it held, and
    // raise the count of what was checked.
    const out = parseComparedLines(
      {
        acceptance: [
          { line: LINES[0], held: true },
          { line: "A line the spec never contained", held: true },
        ],
      },
      [LINES[0]],
    );
    expect(out).toHaveLength(1);
  });

  it("a line nobody judged did not hold, and says so", () => {
    // Dropping it would let a reviewer raise its own pass rate by saying less.
    const out = parseComparedLines({ acceptance: [{ line: LINES[0], held: true }] }, LINES);
    expect(out).toHaveLength(2);
    expect(out[1].held).toBe(false);
    expect(out[1].why).toBe("The reviewer did not say whether this holds.");
  });

  it("a 'did not' with no reason is treated as no verdict, not as a refusal", () => {
    /*
     * A refusal a builder cannot act on is worse than an admission that nothing
     * was said: it puts an unexplained "did not hold" in front of a person with
     * nothing to do about it. It still comes back false -- via the unjudged
     * sweep above -- but with a sentence that is true.
     */
    const out = parseComparedLines({ acceptance: [{ line: LINES[0], held: false }] }, [LINES[0]]);
    expect(out[0].held).toBe(false);
    expect(out[0].why).toBe("The reviewer did not say whether this holds.");
  });

  it("the first verdict on a line wins, so a repeat cannot overwrite a refusal", () => {
    const out = parseComparedLines(
      {
        acceptance: [
          { line: LINES[0], held: false, why: "the field is missing" },
          { line: LINES[0], held: true },
        ],
      },
      [LINES[0]],
    );
    expect(out[0].held).toBe(false);
  });

  it("no criteria means no comparison, which is not the same as none holding", () => {
    expect(parseComparedLines({ acceptance: [{ line: "x", held: true }] }, [])).toEqual([]);
  });

  it("survives a shape it cannot read", () => {
    for (const raw of [null, undefined, {}, { acceptance: "nope" }, { acceptance: [1, "x"] }]) {
      const out = parseComparedLines(raw, LINES);
      expect(out).toHaveLength(2);
      expect(out.every((c) => !c.held)).toBe(true);
    }
  });
});

describe("a line that did not hold cannot be approved", () => {
  const clean = { findings: [], modelRan: true, modelVerdict: "approve" };

  it("returns revise even when every other check is clean", () => {
    /*
     * The whole point of the packet. A reviewer that read the spec, found the
     * change does not meet it, and returned approve because no single line of
     * code was wrong is the exact failure this comparison was added to catch.
     */
    expect(
      decideReviewVerdict({
        ...clean,
        compared: [{ line: LINES[0], held: false, why: "not implemented" }],
      }),
    ).toBe("revise");
  });

  it("but not block, because a missed requirement is not a leaked credential", () => {
    // A gate that cannot tell those apart gets ignored on both.
    expect(
      decideReviewVerdict({
        ...clean,
        compared: [{ line: LINES[0], held: false, why: "not implemented" }],
      }),
    ).not.toBe("block");
  });

  it("still approves when every line held", () => {
    expect(
      decideReviewVerdict({
        ...clean,
        compared: LINES.map((l) => ({ line: l, held: true, why: null })),
      }),
    ).toBe("approve");
  });

  it("a blocker still outranks it, so the order of the checks is unchanged", () => {
    expect(
      decideReviewVerdict({
        findings: [
          {
            severity: "blocker",
            category: "security",
            path: null,
            line: null,
            issue: "x",
            fix: null,
            deterministic: true,
          },
        ],
        modelRan: true,
        compared: LINES.map((l) => ({ line: l, held: true, why: null })),
      }),
    ).toBe("block");
  });

  it("and a review with no lines behaves exactly as it did before", () => {
    // 117 of 119 specs, until this fills in. The change must not make the
    // ordinary case stricter by accident.
    expect(decideReviewVerdict({ ...clean, compared: [] })).toBe("approve");
    expect(decideReviewVerdict(clean)).toBe("approve");
  });
});

describe("where the lines come from", () => {
  it("prefers the author's own success metrics", () => {
    const found = intentPointsWithSource(
      { success_metrics: [{ text: "Amex is accepted", status: "standing" }] },
      "## Acceptance criteria\n- something else\n",
    );
    expect(found.source).toBe("contract");
    expect(found.points).toEqual(["Amex is accepted"]);
  });

  it("falls back to the body, which is where 94 of 117 specs keep them", () => {
    const found = intentPointsWithSource(null, "## Acceptance criteria\n- Amex is accepted\n");
    expect(found.source).toBe("body");
    expect(found.points).toEqual(["Amex is accepted"]);
  });

  it("says none when the spec says nothing, which is a different fact from none holding", () => {
    const found = intentPointsWithSource(null, "Just a paragraph.");
    expect(found.source).toBe("none");
    expect(found.points).toEqual([]);
  });

  it("is the same reading Learn grades with, so the two cannot drift", () => {
    // Not a restatement: `extractIntentPoints` now delegates, and this asserts
    // the delegation rather than trusting it.
    for (const [contract, body] of [
      [{ success_metrics: [{ text: "a" }] }, "## Acceptance criteria\n- b\n"],
      [null, "## Acceptance criteria\n- b\n"],
      [null, "nothing"],
    ] as const) {
      expect(extractIntentPoints(contract, body)).toEqual(
        intentPointsWithSource(contract, body).points,
      );
    }
  });
});

describe("what the seat is handed back", () => {
  it("names the lines that did not hold, because 'revise' is not actionable", () => {
    const review = {
      compared: [
        { line: LINES[0], held: true, why: null },
        { line: LINES[1], held: false, why: "no field is named" },
      ],
    } as ChangesetReview;
    expect(linesThatDidNotHold(review).map((c) => c.line)).toEqual([LINES[1]]);
  });

  it("is empty for a review written before any of this existed", () => {
    // Every `code_review` on the database today. It must read as "no lines",
    // never as a crash and never as "nothing held".
    expect(linesThatDidNotHold({ verdict: "approve" } as ChangesetReview)).toEqual([]);
    expect(linesThatDidNotHold(null)).toEqual([]);
  });
});

describe("the reviewer is actually given them", () => {
  it("puts the lines in the prompt before the diff, not after it", async () => {
    /*
     * A requirement placed underneath forty thousand characters of diff is a
     * requirement read last. The order is the point, so it is asserted rather
     * than left to whoever edits the template next.
     */
    const src = await Bun.file("src/lib/build/code-review.server.ts").text();
    const flat = src.replace(/\s+/g, " ");
    expect(flat).toContain("${intentBlock}\\n\\n${acceptanceBlock}STAGED DIFF");
  });

  it("tells the reviewer when it is seeing only some of them", () => {
    // A reviewer told it has 20 of 34 lines can say its verdict is partial. One
    // that was never told cannot, and would report a partial pass as a full one.
    const src = readFileSync("src/lib/build/code-review.server.ts", "utf8");
    expect(src).toContain("further acceptance line(s) not shown here");
  });

  it("studio.review reads the spec and hands them over", async () => {
    const src = await Bun.file("src/lib/ai/tools/registry.server.ts").text();
    const flat = src.replace(/\s+/g, " ");
    expect(flat).toContain("intentPointsWithSource(");
    expect(flat).toContain("acceptance, criteriaSource,");
  });

  it("and fails soft, because a spec it cannot read is not a reason to skip the review", () => {
    const src = readFileSync("src/lib/ai/tools/registry.server.ts", "utf8");
    expect(src).toContain("[studio.review] could not read the spec's acceptance lines:");
  });
});
