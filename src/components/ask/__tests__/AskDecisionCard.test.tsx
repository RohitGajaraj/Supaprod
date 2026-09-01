import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AskDecisionCard } from "../AskDecisionCard";
import type { Database } from "@/integrations/supabase/types";

type Decision = Database["public"]["Tables"]["decisions"]["Row"];
type Learning = Database["public"]["Tables"]["learnings"]["Row"];

describe("AskDecisionCard", () => {
  const mockDecision: Decision = {
    id: "dec-1",
    track_id: "track-1",
    mission_id: "mission-1",
    forecast_claim: "API response time will be under 100ms",
    forecast_horizon_date: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    // Other required fields with defaults
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
    id: "learn-1",
    decision_id: "dec-1",
    verdict: "correct - API consistently under 100ms",
    summary: "API performance met the forecast target",
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it("renders without learning (pending state)", () => {
    render(<AskDecisionCard decision={mockDecision} />);

    expect(screen.getByText(/PENDING/)).toBeTruthy();
    expect(screen.getByText(/API response time/)).toBeTruthy();
  });

  it("displays verdict when learning is resolved", () => {
    render(<AskDecisionCard decision={mockDecision} learning={mockLearning} />);

    expect(screen.getByText(/RIGHT/)).toBeTruthy();
    expect(screen.getByText(/consistently under 100ms/)).toBeTruthy();
  });

  it("shows wrong verdict for incorrect outcome", () => {
    const wrongLearning: Learning = {
      ...mockLearning,
      verdict: "wrong - API averaged 250ms response time",
    };

    render(<AskDecisionCard decision={mockDecision} learning={wrongLearning} />);

    expect(screen.getByText(/WRONG/)).toBeTruthy();
  });

  it("shows inconclusive verdict for unclear outcomes", () => {
    const inconclusiveLearning: Learning = {
      ...mockLearning,
      verdict: "inconclusive - network issues masked API performance",
    };

    render(<AskDecisionCard decision={mockDecision} learning={inconclusiveLearning} />);

    expect(screen.getByText(/INCONCLUSIVE/)).toBeTruthy();
  });

  it("shows agent-resolved indicator when recorded_by_agent_slug is set", () => {
    render(<AskDecisionCard decision={mockDecision} learning={mockLearning} />);

    expect(screen.getByText(/auto-graded/i)).toBeTruthy();
  });

  it("hides verdict when showResolution is false", () => {
    render(
      <AskDecisionCard decision={mockDecision} learning={mockLearning} showResolution={false} />,
    );

    expect(screen.queryByText(/RIGHT/)).toBeFalsy();
  });

  it("displays PREDICTED and ACTUAL labels", () => {
    render(<AskDecisionCard decision={mockDecision} learning={mockLearning} />);

    expect(screen.getByText(/PREDICTED/)).toBeTruthy();
    expect(screen.getByText(/ACTUAL/)).toBeTruthy();
  });

  it("renders with no learning and no error", () => {
    render(<AskDecisionCard decision={mockDecision} learning={null} />);

    expect(screen.getByText(/PENDING/)).toBeTruthy();
  });

  it("handles missing forecast claim gracefully", () => {
    const noClaimDecision: Decision = {
      ...mockDecision,
      forecast_claim: null,
    };

    render(<AskDecisionCard decision={noClaimDecision} learning={mockLearning} />);

    expect(screen.getByText(/No forecast recorded/)).toBeTruthy();
  });
});
