import { expect, test, describe } from "bun:test";
import {
  buildIntentReceipt,
  extractIntentPoints,
  EVIDENCE_BASIS,
  type ContractLike,
} from "./intent-diff";

describe("buildIntentReceipt", () => {
  test("full coverage: every point's wording appears in the release notes", () => {
    const receipt = buildIntentReceipt(
      { title: "Export", points: ["Export reports as csv", "Add filter controls"] },
      {
        release_notes: "This release adds export of reports as csv and new filter controls.",
        summary: null,
      },
    );
    expect(receipt.points).toHaveLength(2);
    expect(receipt.points.every((p) => p.evidenced)).toBe(true);
    expect(receipt.coverage).toBe(1);
    expect(receipt.evidence_basis).toBe(EVIDENCE_BASIS);
    // The matched terms are the salient words actually found, lowercased.
    expect(receipt.points[0].matched_terms).toContain("csv");
    expect(receipt.points[0].matched_terms).toContain("export");
  });

  test("zero coverage: unrelated release notes evidence nothing", () => {
    const receipt = buildIntentReceipt(
      { title: "Export", points: ["Export reports as csv"] },
      { release_notes: "Refactored the database connection pool for reliability.", summary: null },
    );
    expect(receipt.points[0].evidenced).toBe(false);
    expect(receipt.points[0].matched_terms).toEqual([]);
    expect(receipt.coverage).toBe(0);
  });

  test("partial coverage: one point evidenced, one not", () => {
    const receipt = buildIntentReceipt(
      { title: "Mix", points: ["Export reports as csv", "Add dark mode toggle"] },
      { release_notes: "Added csv export of reports.", summary: null },
    );
    expect(receipt.points[0].evidenced).toBe(true);
    expect(receipt.points[1].evidenced).toBe(false);
    expect(receipt.coverage).toBe(0.5);
  });

  test("empty intent: no points means zero coverage and an empty list", () => {
    const receipt = buildIntentReceipt(
      { title: "Nothing", points: [] },
      {
        release_notes: "Anything at all here.",
        summary: "and here",
      },
    );
    expect(receipt.points).toEqual([]);
    expect(receipt.coverage).toBe(0);
    expect(receipt.evidence_basis).toBe(EVIDENCE_BASIS);
  });

  test("null built text: nothing can be evidenced against an empty corpus", () => {
    const receipt = buildIntentReceipt(
      { title: "Export", points: ["Export reports as csv"] },
      { release_notes: null, summary: null },
    );
    expect(receipt.points[0].evidenced).toBe(false);
    expect(receipt.points[0].matched_terms).toEqual([]);
    expect(receipt.coverage).toBe(0);
  });

  test("summary counts as built text when release notes are null", () => {
    const receipt = buildIntentReceipt(
      { title: "Export", points: ["Export reports as csv"] },
      { release_notes: null, summary: "Shipped csv export of reports." },
    );
    expect(receipt.points[0].evidenced).toBe(true);
  });

  test("case-insensitive: uppercase intent matches lowercase notes and vice versa", () => {
    const receipt = buildIntentReceipt(
      { title: "Export", points: ["EXPORT CSV"] },
      { release_notes: "we added export csv now", summary: null },
    );
    expect(receipt.points[0].evidenced).toBe(true);
    // Matched terms are normalized to lowercase regardless of input casing.
    expect(receipt.points[0].matched_terms).toContain("export");
    expect(receipt.points[0].matched_terms).toContain("csv");
  });

  test("strict majority: a two-word point with one coincidental match is NOT evidenced", () => {
    const receipt = buildIntentReceipt(
      { title: "SF", points: ["Export to Salesforce"] },
      { release_notes: "Added CSV export of reports.", summary: null },
    );
    // salient [export, salesforce]; only "export" matches (1/2 = 0.5, not > 0.5).
    expect(receipt.points[0].evidenced).toBe(false);
    expect(receipt.points[0].matched_terms).toEqual(["export"]);
    expect(receipt.coverage).toBe(0);
  });

  test("un-gradeable points (no salient words) are checkable:false and out of coverage", () => {
    const receipt = buildIntentReceipt(
      { title: "Mix", points: ["Export CSV", "P0"] },
      { release_notes: "Shipped CSV export.", summary: null },
    );
    const [csv, p0] = receipt.points;
    expect(csv.checkable).toBe(true);
    expect(csv.evidenced).toBe(true);
    expect(p0.checkable).toBe(false);
    expect(p0.evidenced).toBe(false);
    // Coverage is over checkable points only: 1 of 1, not 1 of 2.
    expect(receipt.coverage).toBe(1);
  });
});

describe("extractIntentPoints", () => {
  test("prefers standing success-metric texts and drops superseded clauses", () => {
    const contract: ContractLike = {
      success_metrics: [
        { text: "Metric one", status: "standing" },
        { text: "Old metric", status: "superseded" },
        { text: "Metric two", status: "standing" },
      ],
    };
    expect(extractIntentPoints(contract, "# unused body")).toEqual(["Metric one", "Metric two"]);
  });

  test("falls back to body acceptance criteria when there is no contract", () => {
    const body = [
      "# Spec",
      "",
      "## Acceptance Criteria",
      "- [ ] User can export CSV",
      "- [x] Report loads under 2s",
      "",
      "## Notes",
      "- some prose bullet that is out of scope",
    ].join("\n");
    expect(extractIntentPoints(null, body)).toEqual([
      "User can export CSV",
      "Report loads under 2s",
    ]);
  });

  test("falls back to body when every contract metric is superseded", () => {
    const contract: ContractLike = {
      success_metrics: [{ text: "Retired metric", status: "superseded" }],
    };
    const body = "## Acceptance\n- Ship the thing";
    expect(extractIntentPoints(contract, body)).toEqual(["Ship the thing"]);
  });

  test("falls back to every list item when no scoping heading is present", () => {
    const body = "# Spec\n\nSome intro prose.\n\n- First requirement\n- Second requirement";
    expect(extractIntentPoints({}, body)).toEqual(["First requirement", "Second requirement"]);
  });

  test("empty contract and empty body yields no points", () => {
    expect(extractIntentPoints(null, "")).toEqual([]);
    expect(extractIntentPoints({ success_metrics: [] }, "")).toEqual([]);
  });

  test("recognizes 'Definition of Done' as a scoping heading and never grades non-goals", () => {
    const body = ["## Definition of Done", "- Export works", "## Non-goals", "- No SSO"].join("\n");
    expect(extractIntentPoints(null, body)).toEqual(["Export works"]);
  });

  test("excludes non-goal / risk sections even in the document-wide fallback", () => {
    const body = ["# Spec", "- Ship the API", "## Risks", "- Might be slow"].join("\n");
    // No scoping heading matches, so the fallback runs; the Risks bullet drops out.
    expect(extractIntentPoints({}, body)).toEqual(["Ship the API"]);
  });
});
