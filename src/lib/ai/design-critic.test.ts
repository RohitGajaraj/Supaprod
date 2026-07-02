import { describe, it, expect } from "bun:test";
import { parseDesignCriticReview } from "./design-critic";

describe("parseDesignCriticReview", () => {
  it("defaults to revise for a missing/invalid verdict", () => {
    expect(parseDesignCriticReview({}).verdict).toBe("revise");
    expect(parseDesignCriticReview({ verdict: "bogus" }).verdict).toBe("revise");
    expect(parseDesignCriticReview(null).verdict).toBe("revise");
  });

  it("passes through a valid verdict", () => {
    expect(parseDesignCriticReview({ verdict: "ship" }).verdict).toBe("ship");
    expect(parseDesignCriticReview({ verdict: "kill" }).verdict).toBe("kill");
  });

  it("returns [] findings for missing/non-array input", () => {
    expect(parseDesignCriticReview({}).findings).toEqual([]);
    expect(parseDesignCriticReview({ findings: "not an array" }).findings).toEqual([]);
  });

  it("keeps only findings with both issue and principle, dropping malformed entries", () => {
    const review = parseDesignCriticReview({
      verdict: "revise",
      findings: [
        { issue: "Fourth button style introduced", principle: "consistency", standing_decision: "Button styles" },
        { issue: "", principle: "hierarchy" },
        { issue: "No label on icon-only close button", principle: "accessibility" },
        { principle: "ia" },
        "not an object",
      ],
    });
    expect(review.findings).toEqual([
      {
        issue: "Fourth button style introduced",
        principle: "consistency",
        standing_decision: "Button styles",
      },
      { issue: "No label on icon-only close button", principle: "accessibility", standing_decision: null },
    ]);
  });

  it("caps at 8 findings", () => {
    const raw = Array.from({ length: 20 }, (_, i) => ({
      issue: `Issue ${i}`,
      principle: "hierarchy",
    }));
    expect(parseDesignCriticReview({ findings: raw }).findings).toHaveLength(8);
  });

  it("truncates overlong issue/principle/standing_decision", () => {
    const review = parseDesignCriticReview({
      findings: [
        {
          issue: "i".repeat(1000),
          principle: "p".repeat(500),
          standing_decision: "s".repeat(500),
        },
      ],
    });
    expect(review.findings[0].issue.length).toBe(400);
    expect(review.findings[0].principle.length).toBe(200);
    expect(review.findings[0].standing_decision?.length).toBe(200);
  });

  it("normalizes a blank standing_decision to null", () => {
    const review = parseDesignCriticReview({
      findings: [{ issue: "x", principle: "hierarchy", standing_decision: "   " }],
    });
    expect(review.findings[0].standing_decision).toBeNull();
  });
});
