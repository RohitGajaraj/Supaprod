import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AgentPresenceCard } from "./AgentPresenceCard";
import type { Database } from "@/integrations/supabase/types";

type AgentRun = Database["public"]["Tables"]["agent_runs"]["Row"];

describe("AgentPresenceCard", () => {
  const mockAgentRun: AgentRun = {
    id: "1",
    track_id: "track-1",
    mission_id: "mission-1",
    agent_name: "Claude",
    agent_slug: "calibrate-insights",
    agent_id: null,
    model: "claude-opus-4",
    status: "in_progress",
    delegate_meta: {
      confidence: "high",
      action: "planning",
      reasoning: "user specified high priority",
    },
    output: "Break down the task into three phases with clear acceptance criteria",
    input: "",
    attempt: null,
    credits_refunded: false,
    duration_ms: null,
    failure_kind: null,
    halted_at: null,
    halted_reason: null,
    last_checkpoint_at: null,
    mission_spend_cap_usd: null,
    mission_token_cap: null,
    resume_count: null,
    resume_lease_at: new Date().toISOString(),
    spend_used_usd: 0,
    step_index: 0,
    tokens_used: 0,
    user_id: "user-1",
    workspace_id: "ws-1",
    created_at: new Date(Date.now() - 5000).toISOString(),
  };

  it("renders no activity state when no agent run", () => {
    render(<AgentPresenceCard />);
    expect(screen.getByText(/No agent activity yet/i)).toBeTruthy();
  });

  it("displays agent name and model", () => {
    render(
      <AgentPresenceCard agentRun={mockAgentRun} station="Decide" />
    );

    expect(screen.getByText("Claude")).toBeTruthy();
    expect(screen.getByText("claude-opus-4")).toBeTruthy();
  });

  it("displays station name", () => {
    render(
      <AgentPresenceCard agentRun={mockAgentRun} station="Design" />
    );

    expect(screen.getByText("Design")).toBeTruthy();
  });

  it("displays decision text from delegate_meta action", () => {
    render(
      <AgentPresenceCard agentRun={mockAgentRun} station="Decide" />
    );

    // delegate_meta.action takes priority: "planning: user specified high priority"
    expect(screen.getByText(/planning/i)).toBeTruthy();
  });

  it("displays output text when delegate_meta has no action", () => {
    const runWithOutput: AgentRun = {
      ...mockAgentRun,
      delegate_meta: {},
      output: "Break down the task into phases",
    };

    render(
      <AgentPresenceCard agentRun={runWithOutput} station="Decide" />
    );

    expect(screen.getByText(/Break down the task/i)).toBeTruthy();
  });

  it("truncates long output to 150 chars", () => {
    const longOutput = "a".repeat(200);
    const runWithLongOutput: AgentRun = {
      ...mockAgentRun,
      delegate_meta: {},
      output: longOutput,
    };

    render(
      <AgentPresenceCard agentRun={runWithLongOutput} station="Decide" />
    );

    const text = screen.getByText(/^a+…$/);
    expect(text.textContent?.length).toBeLessThanOrEqual(152);
  });

  it("displays confidence tier", () => {
    render(
      <AgentPresenceCard agentRun={mockAgentRun} station="Decide" />
    );

    expect(screen.getByText(/High confidence/i)).toBeTruthy();
  });

  it("shows working indicator when isWorking is true", () => {
    render(
      <AgentPresenceCard
        agentRun={mockAgentRun}
        station="Decide"
        isWorking={true}
      />
    );

    expect(screen.getByText(/Deciding…/i)).toBeTruthy();
  });

  it("displays readable time ago format", () => {
    render(
      <AgentPresenceCard agentRun={mockAgentRun} station="Decide" />
    );

    const timeElements = screen.getAllByText(/ago/i);
    expect(timeElements.length).toBeGreaterThan(0);
  });

  it("handles different confidence levels", () => {
    const confidenceLevels = ["low", "medium", "high"];

    for (const level of confidenceLevels) {
      const run: AgentRun = {
        ...mockAgentRun,
        delegate_meta: { confidence: level },
      };

      render(
        <AgentPresenceCard agentRun={run} station="Decide" />
      );

      const expectedLabel = `${level.charAt(0).toUpperCase()}${level.slice(1)} confidence`;
      expect(screen.getByText(new RegExp(expectedLabel, "i"))).toBeTruthy();
    }
  });

  it("defaults to medium confidence if not specified", () => {
    const run: AgentRun = {
      ...mockAgentRun,
      delegate_meta: {},
    };

    render(
      <AgentPresenceCard agentRun={run} station="Decide" />
    );

    expect(screen.getByText(/Medium confidence/i)).toBeTruthy();
  });

  it("uses provided agent name", () => {
    const runWithCustomName: AgentRun = {
      ...mockAgentRun,
      agent_name: "Research Agent",
    };

    render(
      <AgentPresenceCard agentRun={runWithCustomName} station="Discover" />
    );

    expect(screen.getByText("Research Agent")).toBeTruthy();
  });

  it("shows provided agent name in the header", () => {
    render(
      <AgentPresenceCard agentRun={mockAgentRun} station="Discover" />
    );

    expect(screen.getByText("Claude")).toBeTruthy();
  });
});
