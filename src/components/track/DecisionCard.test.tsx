import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DecisionCard } from "./DecisionCard";
import type { Database } from "@/integrations/supabase/types";

type Decision = Database["public"]["Tables"]["decisions"]["Row"];
type Learning = Database["public"]["Tables"]["learnings"]["Row"];

describe("DecisionCard", () => {
  const mockDecision: Decision = {
    id: "1",
    track_id: "track-1",
    mission_id: "mission-1",
    forecast_claim: "Market will adopt this feature within Q4 2026",
    forecast_horizon_date: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    title: "",
    rationale: null,
    status: "approved",
    source_kind: "agent",
    meeting_id: null,
    prd_id: null,
    decided_by_agent_slug: null,
    snapshot_before: null,
  };

  const mockLearning: Learning = {
    id: "1",
    decision_id: "1",
    verdict: "correct - feature adoption exceeded 40% in Q4",
    summary: "Adoption target met",
    new_ice: null,
    prior_ice: null,
    mission_id: null,
    opportunity_id: null,
    prd_id: null,
    product_id: null,
    user_id: "user-1",
    workspace_id: "ws-1",
    is_sample: false,
    embedding: null,
    embedding_model: null,
    metric_label: null,
    metric_value: null,
    recorded_by_agent_slug: "calibrate-insights",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  };

  it("renders no decision state when no decision provided", () => {
    render(<DecisionCard />);
    expect(screen.getByText(/No decision recorded yet/i)).toBeTruthy();
  });

  it("displays pending state when decision has no learning yet", () => {
    render(<DecisionCard decision={mockDecision} />);

    expect(screen.getByText(/PENDING/)).toBeTruthy();
    expect(screen.getByText(/Waiting for the horizon date/i)).toBeTruthy();
  });

  it("displays predicted forecast claim and date", () => {
    render(<DecisionCard decision={mockDecision} />);

    expect(screen.getByText(/Market will adopt this feature/)).toBeTruthy();
    expect(screen.getByText(/PREDICTED/)).toBeTruthy();
  });

  it("displays verdict as RIGHT when learning contains correct", () => {
    render(<DecisionCard decision={mockDecision} learning={mockLearning} />);

    expect(screen.getByText(/RIGHT/)).toBeTruthy();
  });

  it("displays verdict as WRONG when learning indicates incorrect", () => {
    const wrongLearning: Learning = {
      ...mockLearning,
      verdict: "wrong - adoption only reached 12%",
    };

    render(<DecisionCard decision={mockDecision} learning={wrongLearning} />);

    expect(screen.getByText(/WRONG/)).toBeTruthy();
  });

  it("displays verdict as INCONCLUSIVE when learning is unclear", () => {
    const inconclusiveLearning: Learning = {
      ...mockLearning,
      verdict: "inconclusive - data inconsistent across regions",
    };

    render(
      <DecisionCard
        decision={mockDecision}
        learning={inconclusiveLearning}
      />
    );

    expect(screen.getByText(/INCONCLUSIVE/)).toBeTruthy();
  });

  it("displays actual outcome text from learning verdict", () => {
    render(<DecisionCard decision={mockDecision} learning={mockLearning} />);

    expect(screen.getByText(/feature adoption exceeded/i)).toBeTruthy();
    expect(screen.getByText(/ACTUAL/)).toBeTruthy();
  });

  it("shows auto-graded indicator when recorded_by_agent_slug is set", () => {
    render(<DecisionCard decision={mockDecision} learning={mockLearning} />);

    expect(screen.getByText(/auto-graded/i)).toBeTruthy();
  });

  it("shows no auto-graded indicator when recorded_by_agent_slug is null", () => {
    const humanLearning: Learning = {
      ...mockLearning,
      recorded_by_agent_slug: null,
    };

    render(<DecisionCard decision={mockDecision} learning={humanLearning} />);

    expect(screen.queryByText(/auto-graded/i)).toBeFalsy();
  });

  it("hides verdict badge when showResolution is false", () => {
    render(
      <DecisionCard
        decision={mockDecision}
        learning={mockLearning}
        showResolution={false}
      />
    );

    expect(screen.queryByText(/RIGHT/)).toBeFalsy();
  });

  it("displays learning message when resolution is complete", () => {
    render(<DecisionCard decision={mockDecision} learning={mockLearning} />);

    expect(screen.getByText(/This is how you learn/i)).toBeTruthy();
  });

  it("displays verdict when forecast claim is missing", () => {
    const minimalDecision: Decision = {
      ...mockDecision,
      forecast_claim: null,
    };

    render(<DecisionCard decision={minimalDecision} learning={mockLearning} />);

    expect(screen.getByText(/No forecast recorded/i)).toBeTruthy();
  });

  it("displays horizon date when set", () => {
    const horizonDate = new Date(2026, 11, 31).toISOString();
    const decisionWithHorizon: Decision = {
      ...mockDecision,
      forecast_horizon_date: horizonDate,
    };

    render(<DecisionCard decision={decisionWithHorizon} />);

    expect(screen.getByText(/By:/)).toBeTruthy();
  });

  it("shows default text when horizon date is missing", () => {
    const noHorizonDecision: Decision = {
      ...mockDecision,
      forecast_horizon_date: null,
    };

    render(<DecisionCard decision={noHorizonDecision} />);

    expect(screen.getByText(/No horizon set/)).toBeTruthy();
  });
});
