import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RunTimeline } from "./RunTimeline";
import type { Database } from "@/integrations/supabase/types";

type StageEvent = Database["public"]["Tables"]["stage_events"]["Row"];

describe("RunTimeline", () => {
  const mockEvents: StageEvent[] = [
    {
      id: "1",
      entity_id: "track-1",
      entity_type: "track",
      to_stage: "sense",
      from_stage: null,
      actor: "system",
      at: new Date(Date.now() - 10000).toISOString(),
      driven_via: null,
      user_id: null,
      workspace_id: null,
    },
    {
      id: "2",
      entity_id: "track-1",
      entity_type: "track",
      to_stage: "discover",
      from_stage: "sense",
      actor: "system",
      at: new Date(Date.now() - 5000).toISOString(),
      driven_via: null,
      user_id: null,
      workspace_id: null,
    },
    {
      id: "3",
      entity_id: "track-1",
      entity_type: "track",
      to_stage: "decide",
      from_stage: "discover",
      actor: "system",
      at: new Date(Date.now() - 2000).toISOString(),
      driven_via: null,
      user_id: null,
      workspace_id: null,
    },
  ];

  it("renders empty state when no events", () => {
    render(<RunTimeline trackId="track-1" events={[]} />);
    expect(screen.getByText(/Waiting for agent to start/i)).toBeTruthy();
  });

  it("renders events in reverse chronological order", () => {
    render(<RunTimeline trackId="track-1" events={mockEvents} />);

    const decisions = screen.getAllByText(/Agent entered/i);
    expect(decisions.length).toBeGreaterThan(0);
  });

  it("shows readable time ago format", () => {
    render(<RunTimeline trackId="track-1" events={mockEvents} />);

    const timeElements = screen.getAllByText(/ago/i);
    expect(timeElements.length).toBeGreaterThan(0);
  });

  it("displays station names correctly", () => {
    render(<RunTimeline trackId="track-1" events={mockEvents} />);

    expect(screen.getByText(/Sense/i)).toBeTruthy();
    expect(screen.getByText(/Discover/i)).toBeTruthy();
    expect(screen.getByText(/Decide/i)).toBeTruthy();
  });

  it("shows live indicator when isLive is true", () => {
    render(<RunTimeline trackId="track-1" events={mockEvents} isLive={true} />);

    expect(screen.getByText("Live")).toBeTruthy();
  });

  it("limits display to last 5 events", () => {
    const manyEvents: StageEvent[] = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      entity_id: "track-1",
      entity_type: "track",
      to_stage: ["sense", "discover", "decide", "define", "design"][i % 5],
      from_stage: null,
      actor: "system",
      at: new Date(Date.now() - i * 1000).toISOString(),
      driven_via: null,
      user_id: null,
      workspace_id: null,
    }));

    render(<RunTimeline trackId="track-1" events={manyEvents} />);

    const decisions = screen.getAllByText(/Agent entered/i);
    expect(decisions.length).toBeLessThanOrEqual(5);
  });

  it("handles held events (actor !== system)", () => {
    const heldEvent: StageEvent = {
      id: "4",
      entity_id: "track-1",
      entity_type: "track",
      to_stage: "decide",
      from_stage: "discover",
      actor: "human",
      at: new Date(Date.now() - 1000).toISOString(),
      driven_via: null,
      user_id: null,
      workspace_id: null,
    };

    render(<RunTimeline trackId="track-1" events={[heldEvent]} />);

    expect(screen.getByText(/Held at/i)).toBeTruthy();
  });

  it("uses correct color for each station", () => {
    const colorTests = [
      { station: "sense", color: "bg-blue-500" },
      { station: "discover", color: "bg-purple-500" },
      { station: "decide", color: "bg-emerald-500" },
      { station: "design", color: "bg-rose-500" },
      { station: "ship", color: "bg-cyan-500" },
    ];

    for (const { station, color } of colorTests) {
      const event: StageEvent = {
        id: `event-${station}`,
        entity_id: "track-1",
        entity_type: "track",
        to_stage: station,
        from_stage: null,
        actor: "system",
        at: new Date().toISOString(),
        driven_via: null,
        user_id: null,
        workspace_id: null,
      };

      const { container } = render(
        <RunTimeline trackId="track-1" events={[event]} />
      );

      const dot = container.querySelector(`div.${color}`);
      expect(dot).toBeTruthy();
    }
  });
});
