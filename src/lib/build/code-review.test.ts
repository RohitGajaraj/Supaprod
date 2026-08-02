import { describe, it, expect } from "bun:test";
import {
  countReviewableFiles,
  decideReviewVerdict,
  deterministicFindings,
  parseReviewFindings,
  renderChangesetDiff,
  renderFileDiff,
  reviewGate,
  type ChangesetReview,
  type ReviewFinding,
} from "./code-review";
import { scanStagedChangesForSecrets } from "./secret-scan";
import { planChangesetTests } from "./test-plan";

const cleanScan = scanStagedChangesForSecrets([]);
const emptyPlan = planChangesetTests([]);

function review(over: Partial<ChangesetReview> = {}): ChangesetReview {
  return {
    verdict: "approve",
    summary: "",
    findings: [],
    files_reviewed: 1,
    reviewer_model: "m",
    reviewed_at: "2026-08-02T00:00:00.000Z",
    ...over,
  };
}

describe("renderFileDiff", () => {
  it("numbers added lines against the staged file so a finding can point at one", () => {
    const out = renderFileDiff({
      path: "a.ts",
      op: "update",
      base_content: "one\ntwo",
      new_content: "one\ntwo\nthree",
    });
    expect(out).toContain("--- a.ts (update)");
    expect(out).toContain("+3: three");
  });

  it("marks removed lines with their base line number", () => {
    const out = renderFileDiff({
      path: "a.ts",
      op: "update",
      base_content: "one\ntwo",
      new_content: "one",
    });
    expect(out).toContain("-2: two");
  });

  it("states a deletion instead of dumping the old file", () => {
    expect(renderFileDiff({ path: "a.ts", op: "delete", base_content: "x" })).toContain(
      "(file deleted)",
    );
  });

  it("refuses to diff a file too large to align, and says so rather than going quiet", () => {
    const huge = Array.from({ length: 3000 }, (_, i) => `l${i}`).join("\n");
    const out = renderFileDiff({
      path: "big.ts",
      op: "update",
      base_content: huge,
      new_content: `${huge}\nextra`,
    });
    expect(out).toContain("too large to diff inline");
    expect(out).toContain("Not reviewed line by line");
  });

  it("announces its own truncation", () => {
    const body = Array.from({ length: 200 }, (_, i) => `const x${i} = ${i};`).join("\n");
    const out = renderFileDiff({ path: "a.ts", op: "create", new_content: body }, 300);
    expect(out).toContain("diff truncated");
  });
});

describe("renderChangesetDiff", () => {
  it("renders every file and reports the count", () => {
    const out = renderChangesetDiff([
      { path: "a.ts", op: "create", new_content: "a" },
      { path: "b.ts", op: "create", new_content: "b" },
    ]);
    expect(out.files_rendered).toBe(2);
    expect(out.truncated).toBe(false);
    expect(out.text).toContain("--- a.ts");
    expect(out.text).toContain("--- b.ts");
  });

  it("states how many files it did NOT render when the budget runs out", () => {
    const changes = Array.from({ length: 6 }, (_, i) => ({
      path: `f${i}.ts`,
      op: "create",
      new_content: "x".repeat(400),
    }));
    const out = renderChangesetDiff(changes, 600);
    expect(out.truncated).toBe(true);
    expect(out.text).toContain("further file(s) not rendered");
  });
});

describe("deterministicFindings", () => {
  it("raises a blocker for every credential on an added line", () => {
    const secrets = scanStagedChangesForSecrets([
      { path: "c.ts", op: "create", new_content: `k = "AKIA${"A1B2C3D4E5F6G7H8"}"` },
    ]);
    const found = deterministicFindings({ changes: [], secrets, testPlan: emptyPlan });
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({
      severity: "blocker",
      category: "secret",
      path: "c.ts",
      line: 1,
      deterministic: true,
    });
  });

  it("raises a blocker for a path outside the Build write boundary", () => {
    const found = deterministicFindings({
      changes: [],
      secrets: cleanScan,
      testPlan: emptyPlan,
      forbiddenPaths: ["supabase/migrations/001.sql"],
    });
    expect(found[0]).toMatchObject({ severity: "blocker", category: "convention" });
    expect(found[0].issue).toContain("supabase/migrations/001.sql");
  });

  it("raises a MAJOR, never a blocker, for a missing test", () => {
    // The 2026-06-18 Inspector ruling settled that missing tests are flagged and
    // never hard-blocked. A review layer must not quietly overturn a decision
    // the merge gate already made.
    const plan = planChangesetTests([{ path: "src/a.ts", op: "create" }]);
    const found = deterministicFindings({ changes: [], secrets: cleanScan, testPlan: plan });
    expect(found).toHaveLength(1);
    expect(found[0].severity).toBe("major");
    expect(found[0].category).toBe("tests");
    expect(found[0].fix).toBe("Stage src/a.test.ts.");
  });

  it("flags a truncated secret scan instead of letting it read as clean", () => {
    const secrets = scanStagedChangesForSecrets(
      [{ path: "a.ts", op: "create", new_content: "a\nb\nc" }],
      { lineBudget: 1 },
    );
    const found = deterministicFindings({ changes: [], secrets, testPlan: emptyPlan });
    expect(found.some((f) => /ran out of line budget/.test(f.issue))).toBe(true);
  });

  it("finds nothing when there is nothing to find", () => {
    expect(deterministicFindings({ changes: [], secrets: cleanScan, testPlan: emptyPlan })).toEqual(
      [],
    );
  });
});

describe("parseReviewFindings", () => {
  it("reads a well-formed payload", () => {
    const got = parseReviewFindings({
      findings: [
        {
          severity: "blocker",
          category: "security",
          path: "src/a.ts",
          line: 12,
          issue: "no ownership check",
          fix: "filter by user_id",
        },
      ],
    });
    expect(got).toEqual([
      {
        severity: "blocker",
        category: "security",
        path: "src/a.ts",
        line: 12,
        issue: "no ownership check",
        fix: "filter by user_id",
        deterministic: false,
      },
    ]);
  });

  it("marks model findings as NOT deterministic", () => {
    // Load-bearing on the receipt trail: a deterministic finding is a fact about
    // the diff, a model finding is an opinion about it, and a reader deciding
    // whether to overrule one needs to know which they are looking at.
    const got = parseReviewFindings({ findings: [{ issue: "hmm" }] });
    expect(got[0].deterministic).toBe(false);
  });

  it("refuses to let the model raise a `secret` finding", () => {
    // That category belongs to the structural scanner alone, so every secret
    // finding on the trail is a match and never an inference.
    const got = parseReviewFindings({
      findings: [{ category: "secret", issue: "looks like a key to me" }],
    });
    expect(got[0].category).toBe("security");
  });

  it("falls back conservatively on an unrecognised severity or category", () => {
    const got = parseReviewFindings({
      findings: [{ severity: "catastrophic", category: "vibes", issue: "x" }],
    });
    expect(got[0].severity).toBe("minor");
    expect(got[0].category).toBe("correctness");
  });

  it("drops a finding with no issue text rather than emitting an empty one", () => {
    expect(parseReviewFindings({ findings: [{ severity: "blocker" }, { issue: "  " }] })).toEqual(
      [],
    );
  });

  it("returns [] for any malformed payload rather than fabricating a review", () => {
    for (const bad of [null, undefined, 3, "x", [], { findings: "no" }, { findings: null }]) {
      expect(parseReviewFindings(bad)).toEqual([]);
    }
  });

  it("caps the list so one runaway generation cannot flood the trail", () => {
    const findings = Array.from({ length: 100 }, (_, i) => ({ issue: `i${i}` }));
    expect(parseReviewFindings({ findings }, 5)).toHaveLength(5);
  });
});

describe("decideReviewVerdict", () => {
  const finding = (severity: ReviewFinding["severity"]): ReviewFinding => ({
    severity,
    category: "correctness",
    path: null,
    line: null,
    issue: "x",
    fix: null,
    deterministic: true,
  });

  it("blocks on any blocker, whatever the model called itself", () => {
    // A generation that lists a blocker and then says "approve" cannot talk its
    // way past: severity decides, not self-report.
    expect(
      decideReviewVerdict({
        findings: [finding("blocker")],
        modelRan: true,
        modelVerdict: "approve",
      }),
    ).toBe("block");
  });

  it("lets the model make the result stricter, never looser", () => {
    expect(decideReviewVerdict({ findings: [], modelRan: true, modelVerdict: "block" })).toBe(
      "block",
    );
    expect(decideReviewVerdict({ findings: [], modelRan: true, modelVerdict: "revise" })).toBe(
      "revise",
    );
  });

  it("approves only when the pass ran and nothing was found", () => {
    expect(decideReviewVerdict({ findings: [], modelRan: true, modelVerdict: "approve" })).toBe(
      "approve",
    );
  });

  it("NEVER approves when the judgment pass did not run", () => {
    // The single most important assertion in this file. "Nothing was found" and
    // "nothing looked" are different facts, and collapsing them is how a silent
    // green happens.
    expect(decideReviewVerdict({ findings: [], modelRan: false })).toBe("unreviewed");
    expect(decideReviewVerdict({ findings: [], modelRan: false, modelVerdict: "approve" })).toBe(
      "unreviewed",
    );
  });

  it("keeps deterministic findings standing when the model never ran", () => {
    expect(decideReviewVerdict({ findings: [finding("minor")], modelRan: false })).toBe("revise");
    expect(decideReviewVerdict({ findings: [finding("blocker")], modelRan: false })).toBe("block");
  });

  it("revises on a major even when the model approved", () => {
    expect(
      decideReviewVerdict({
        findings: [finding("major")],
        modelRan: true,
        modelVerdict: "approve",
      }),
    ).toBe("revise");
  });
});

describe("reviewGate", () => {
  it("clears only an approve", () => {
    expect(reviewGate(review({ verdict: "approve" })).mayOpenPr).toBe(true);
    expect(reviewGate(review({ verdict: "revise" })).mayOpenPr).toBe(false);
    expect(reviewGate(review({ verdict: "block" })).mayOpenPr).toBe(false);
  });

  it("says plainly that unreviewed is not a pass", () => {
    const gate = reviewGate(review({ verdict: "unreviewed" }));
    expect(gate.mayOpenPr).toBe(false);
    expect(gate.reason).toContain("not a clean result");
  });
});

describe("countReviewableFiles", () => {
  it("counts what a reviewer actually reads", () => {
    expect(
      countReviewableFiles([
        { path: "a.ts", op: "create" },
        { path: "a.test.ts", op: "create" },
        { path: "gone.ts", op: "delete" },
      ]),
    ).toBe(1);
  });
});
