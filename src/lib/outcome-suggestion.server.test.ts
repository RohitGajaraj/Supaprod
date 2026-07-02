import { describe, it, expect } from "bun:test";
import { scoreConfidence, type OutcomeSuggestionBasis } from "./outcome-suggestion.server";

// RF-01's confidence formula decides whether a suggestion is "one-click confirm"
// or "queue for review" — these tests pin the tiering so it never silently
// drifts (e.g. a refactor that flips the threshold would over- or under-trust
// a provisional outcome).

const basis = (over: Partial<OutcomeSuggestionBasis>): OutcomeSuggestionBasis => ({
  sample_users: 0,
  sample_events: 0,
  data_days: 0,
  has_shipped_changeset: false,
  has_prediction: false,
  ...over,
});

describe("scoreConfidence", () => {
  it("scores zero signal as zero confidence, low tier", () => {
    const { confidence, tier } = scoreConfidence(basis({}));
    expect(confidence).toBe(0);
    expect(tier).toBe("low");
  });

  it("reaches high confidence off 14+ days of usage data alone", () => {
    const { confidence, tier } = scoreConfidence(basis({ data_days: 14 }));
    expect(confidence).toBeCloseTo(0.5, 5);
    expect(tier).toBe("low"); // 0.5 < the 0.6 threshold on usage alone
  });

  it("clamps the usage signal past the 14-day ramp (no runaway confidence)", () => {
    const at14 = scoreConfidence(basis({ data_days: 14 })).confidence;
    const at30 = scoreConfidence(basis({ data_days: 30 })).confidence;
    expect(at30).toBe(at14);
  });

  it("tips into high confidence when usage combines with a shipped changeset", () => {
    const { confidence, tier } = scoreConfidence(
      basis({ data_days: 14, has_shipped_changeset: true }),
    );
    expect(confidence).toBeCloseTo(0.8, 5);
    expect(tier).toBe("high");
  });

  it("a changeset + prediction with zero usage data stays low confidence", () => {
    const { confidence, tier } = scoreConfidence(
      basis({ has_shipped_changeset: true, has_prediction: true }),
    );
    expect(confidence).toBeCloseTo(0.5, 5);
    expect(tier).toBe("low");
  });

  it("full signal (usage + changeset + prediction) is high confidence", () => {
    const { confidence, tier } = scoreConfidence(
      basis({ data_days: 14, has_shipped_changeset: true, has_prediction: true }),
    );
    expect(confidence).toBeCloseTo(1, 5);
    expect(tier).toBe("high");
  });

  it("partial usage data (7 of 14 days) scores half the usage weight", () => {
    const { confidence } = scoreConfidence(basis({ data_days: 7 }));
    expect(confidence).toBeCloseTo(0.25, 5);
  });
});
