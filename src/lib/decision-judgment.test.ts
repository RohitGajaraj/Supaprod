import { describe, it, expect } from "bun:test";
import {
  assemblePrecedentBlock,
  parseAlternativesConsidered,
  planPrecedentCitations,
  summarizePrecedentCitation,
  JUDGMENT_PRECEDENT_MAX,
  type JudgmentPrecedent,
  type PrecedentMatchLike,
} from "./decision-judgment";

// SW-3 mission 3.2: the pure judgment-loop assembly behind the decision card.

function match(over: Partial<PrecedentMatchLike> = {}): PrecedentMatchLike {
  return {
    id: "mem-1",
    title: "Ship dark mode",
    verdict: "validated",
    summary: 'Outcome on the spec "Ship dark mode": VALIDATED. Adoption doubled.',
    prdId: "prd-1",
    opportunityId: "opp-1",
    score: 0.8,
    ...over,
  };
}

describe("assemblePrecedentBlock", () => {
  it("returns [] on empty input", () => {
    expect(assemblePrecedentBlock([])).toEqual([]);
  });

  it("maps match fields onto render rows, keeping order", () => {
    const rows = assemblePrecedentBlock([
      match({ id: "a", score: 0.9 }),
      match({ id: "b", score: 0.7, verdict: "missed", title: null, prdId: "prd-2" }),
    ]);
    expect(rows.map((r) => r.memoryId)).toEqual(["a", "b"]);
    expect(rows[0].verdict).toBe("validated");
    expect(rows[1].verdict).toBe("missed");
    expect(rows[1].title).toBeNull();
    expect(rows[0].prdId).toBe("prd-1");
  });

  it("caps at JUDGMENT_PRECEDENT_MAX", () => {
    const rows = assemblePrecedentBlock([
      match({ id: "a" }),
      match({ id: "b", prdId: "p2" }),
      match({ id: "c", prdId: "p3" }),
      match({ id: "d", prdId: "p4" }),
    ]);
    expect(rows.length).toBe(JUDGMENT_PRECEDENT_MAX);
  });

  it("excludes the decision's own spec from its precedent", () => {
    const rows = assemblePrecedentBlock(
      [match({ id: "own", prdId: "prd-self" }), match({ id: "other", prdId: "prd-other" })],
      { ownPrdId: "prd-self" },
    );
    expect(rows.map((r) => r.memoryId)).toEqual(["other"]);
  });

  it("trims and truncates the summary, normalizes a blank title to null", () => {
    const long = "x".repeat(500);
    const rows = assemblePrecedentBlock([match({ title: "   ", summary: `  ${long}  ` })]);
    expect(rows[0].title).toBeNull();
    expect(rows[0].summary.length).toBe(240);
  });
});

describe("parseAlternativesConsidered", () => {
  it("returns [] for non-arrays and malformed items", () => {
    expect(parseAlternativesConsidered(null)).toEqual([]);
    expect(parseAlternativesConsidered("nope")).toEqual([]);
    expect(parseAlternativesConsidered([{ reason_rejected: "no title" }, 42, null])).toEqual([]);
  });

  it("keeps valid rows and truncates fields", () => {
    const rows = parseAlternativesConsidered([
      { title: "  Polling  ", reason_rejected: "  Too slow  " },
      { title: "t".repeat(400), reason_rejected: "r".repeat(600) },
    ]);
    expect(rows[0]).toEqual({ title: "Polling", reason_rejected: "Too slow" });
    expect(rows[1].title.length).toBe(280);
    expect(rows[1].reason_rejected.length).toBe(500);
  });

  it("caps at 8 rows", () => {
    const rows = parseAlternativesConsidered(
      Array.from({ length: 12 }, (_, i) => ({ title: `alt ${i}`, reason_rejected: "r" })),
    );
    expect(rows.length).toBe(8);
  });
});

describe("planPrecedentCitations", () => {
  const learnings = [
    { id: "lrn-1", prd_id: "prd-1", opportunity_id: null },
    { id: "lrn-2", prd_id: null, opportunity_id: "opp-2" },
  ];
  const decisions = [
    { id: "dec-past", prd_id: "prd-1" },
    { id: "dec-viewing", prd_id: "prd-1" },
    { id: "dec-unrelated", prd_id: "prd-9" },
  ];

  it("cites the learning resolved by prd first, then opportunity fallback", () => {
    const plan = planPrecedentCitations({
      precedents: [
        { prdId: "prd-1", opportunityId: null },
        { prdId: null, opportunityId: "opp-2" },
      ],
      learnings,
      alreadyCitedLearningIds: new Set(),
      decisions,
      viewingDecisionId: "dec-viewing",
    });
    expect(plan.citeLearningIds).toEqual(["lrn-1", "lrn-2"]);
  });

  it("bumps past decisions on the precedent's spec, never the viewing decision", () => {
    const plan = planPrecedentCitations({
      precedents: [{ prdId: "prd-1", opportunityId: null }],
      learnings,
      alreadyCitedLearningIds: new Set(),
      decisions,
      viewingDecisionId: "dec-viewing",
    });
    expect(plan.bumpDecisionIds).toEqual(["dec-past"]);
  });

  it("an unresolved precedent produces no receipt and no bump", () => {
    const plan = planPrecedentCitations({
      precedents: [{ prdId: "prd-none", opportunityId: "opp-none" }],
      learnings,
      alreadyCitedLearningIds: new Set(),
      decisions,
      viewingDecisionId: "dec-viewing",
    });
    expect(plan.citeLearningIds).toEqual([]);
    expect(plan.bumpDecisionIds).toEqual([]);
  });

  it("an already-cited learning is not re-cited and bumps nothing (idempotent card opens)", () => {
    const plan = planPrecedentCitations({
      precedents: [{ prdId: "prd-1", opportunityId: null }],
      learnings,
      alreadyCitedLearningIds: new Set(["lrn-1"]),
      decisions,
      viewingDecisionId: "dec-viewing",
    });
    expect(plan.citeLearningIds).toEqual([]);
    expect(plan.bumpDecisionIds).toEqual([]);
  });

  it("dedupes learnings and bumps across precedents sharing a spec", () => {
    const plan = planPrecedentCitations({
      precedents: [
        { prdId: "prd-1", opportunityId: null },
        { prdId: "prd-1", opportunityId: null },
      ],
      learnings,
      alreadyCitedLearningIds: new Set(),
      decisions,
      viewingDecisionId: "dec-viewing",
    });
    expect(plan.citeLearningIds).toEqual(["lrn-1"]);
    expect(plan.bumpDecisionIds).toEqual(["dec-past"]);
  });
});

describe("summarizePrecedentCitation", () => {
  function jp(over: Partial<JudgmentPrecedent> = {}): JudgmentPrecedent {
    return {
      memoryId: "mem-1",
      title: "Faster checkout flow",
      verdict: "missed",
      summary: "under-performed",
      score: 0.8,
      prdId: null,
      opportunityId: null,
      ...over,
    };
  }

  it("returns null on no precedents (never fabricates)", () => {
    expect(summarizePrecedentCitation([])).toBeNull();
  });

  it("cites a single missed precedent by its title", () => {
    const text = summarizePrecedentCitation([jp({ verdict: "missed" })]);
    expect(text).toBe(
      'Your last 1 similar bet underperformed. This most closely mirrors "Faster checkout flow".',
    );
  });

  it("pluralizes and reports the majority verdict across several matches", () => {
    const text = summarizePrecedentCitation([
      jp({ memoryId: "a", verdict: "missed" }),
      jp({ memoryId: "b", verdict: "missed" }),
      jp({ memoryId: "c", verdict: "validated" }),
    ]);
    expect(text).toBe(
      'Your last 3 similar bets underperformed. This most closely mirrors "Faster checkout flow".',
    );
  });

  it("reports validated when that is the majority", () => {
    const text = summarizePrecedentCitation([
      jp({ memoryId: "a", verdict: "validated" }),
      jp({ memoryId: "b", verdict: "validated" }),
    ]);
    expect(text).toBe(
      'Your last 2 similar bets were validated. This most closely mirrors "Faster checkout flow".',
    );
  });

  it("breaks a tie toward the more cautionary read (missed over mixed over validated)", () => {
    const text = summarizePrecedentCitation([
      jp({ memoryId: "a", verdict: "mixed" }),
      jp({ memoryId: "b", verdict: "missed" }),
    ]);
    expect(text).toContain("underperformed");
  });

  it("omits the mirror clause when the nearest match has no title", () => {
    const text = summarizePrecedentCitation([jp({ title: null })]);
    expect(text).toBe("Your last 1 similar bet underperformed.");
  });
});
