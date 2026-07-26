import * as React from "react";
import { render, screen } from "@testing-library/react";
import { AgentActivityTimeline, TimelineEntry } from "../AgentActivityTimeline";
import { describe, test, expect } from "bun:test";

describe("AgentActivityTimeline Container", () => {
  describe("Rendering", () => {
    test("renders the container element", () => {
      const { container } = render(
        <AgentActivityTimeline>
          <TimelineEntry timestamp="14:32:45" agent="Builder" status="success" action="Ran tests" />
        </AgentActivityTimeline>,
      );
      const timeline = container.querySelector("div");
      expect(timeline).toBeTruthy();
    });

    test("renders child timeline entries", () => {
      render(
        <AgentActivityTimeline>
          <TimelineEntry
            timestamp="14:32:45"
            agent="Builder"
            status="success"
            action="Ran tests"
            result="287/287 passing"
          />
          <TimelineEntry
            timestamp="14:33:10"
            agent="Deploy"
            status="running"
            action="Publishing build"
          />
        </AgentActivityTimeline>,
      );
      expect(screen.getByText("Ran tests")).toBeTruthy();
      expect(screen.getByText("Publishing build")).toBeTruthy();
    });

    test("applies engineering grid background styling", () => {
      const { container } = render(
        <AgentActivityTimeline>
          <TimelineEntry timestamp="10:00:00" agent="Builder" status="success" action="Test" />
        </AgentActivityTimeline>,
      );
      const timeline = container.querySelector("div");
      expect(timeline?.className).toContain("bg-[length:4px_4px]");
      expect(timeline?.className).toContain("bg-[image:linear-gradient(0deg,transparent");
    });

    test("applies border and padding", () => {
      const { container } = render(
        <AgentActivityTimeline>
          <TimelineEntry timestamp="10:00:00" agent="Builder" status="success" action="Test" />
        </AgentActivityTimeline>,
      );
      const timeline = container.querySelector("div");
      expect(timeline?.className).toContain("border");
      expect(timeline?.className).toContain("rounded-md");
      expect(timeline?.className).toContain("p-4");
    });

    test("applies monospace font styling", () => {
      const { container } = render(
        <AgentActivityTimeline>
          <TimelineEntry timestamp="10:00:00" agent="Builder" status="success" action="Test" />
        </AgentActivityTimeline>,
      );
      const timeline = container.querySelector("div");
      expect(timeline?.className).toContain("font-mono");
      expect(timeline?.className).toContain("text-label-13");
    });

    test("applies custom className alongside default styles", () => {
      const { container } = render(
        <AgentActivityTimeline className="custom-timeline">
          <TimelineEntry timestamp="10:00:00" agent="Builder" status="success" action="Test" />
        </AgentActivityTimeline>,
      );
      const timeline = container.querySelector("div");
      expect(timeline?.className).toContain("custom-timeline");
      expect(timeline?.className).toContain("font-mono");
    });

    test("forwards ref to DOM element", () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <AgentActivityTimeline ref={ref}>
          <TimelineEntry timestamp="10:00:00" agent="Builder" status="success" action="Test" />
        </AgentActivityTimeline>,
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe("Edge Cases", () => {
    test("renders with no children", () => {
      const { container } = render(<AgentActivityTimeline />);
      const timeline = container.querySelector("div");
      expect(timeline).toBeTruthy();
    });

    test("renders with many child entries", () => {
      render(
        <AgentActivityTimeline>
          {Array.from({ length: 10 }, (_, i) => (
            <TimelineEntry
              key={i}
              timestamp={`${10 + i}:00:00`}
              agent="Agent"
              status="success"
              action={`Action ${i}`}
            />
          ))}
        </AgentActivityTimeline>,
      );
      expect(screen.getByText("Action 0")).toBeTruthy();
      expect(screen.getByText("Action 9")).toBeTruthy();
    });

    test("handles mixed content children", () => {
      render(
        <AgentActivityTimeline>
          <TimelineEntry timestamp="10:00:00" agent="Builder" status="success" action="Test" />
          <div>Custom content</div>
          <TimelineEntry timestamp="10:01:00" agent="Deploy" status="pending" action="Deploy" />
        </AgentActivityTimeline>,
      );
      expect(screen.getByText("Test")).toBeTruthy();
      expect(screen.getByText("Custom content")).toBeTruthy();
    });
  });
});

describe("TimelineEntry Component", () => {
  describe("Rendering", () => {
    test("renders timestamp, agent, and action", () => {
      render(
        <TimelineEntry timestamp="14:32:45" agent="Builder" status="success" action="Ran tests" />,
      );
      expect(screen.getByText("14:32:45")).toBeTruthy();
      expect(screen.getByText("Builder")).toBeTruthy();
      expect(screen.getByText("Ran tests")).toBeTruthy();
    });

    test("renders result line when result prop is provided", () => {
      render(
        <TimelineEntry
          timestamp="14:32:45"
          agent="Builder"
          status="success"
          action="Ran tests"
          result="287/287 passing"
        />,
      );
      expect(screen.getByText("→ 287/287 passing")).toBeTruthy();
    });

    test("does not render result line when result prop is undefined", () => {
      const { container } = render(
        <TimelineEntry timestamp="14:32:45" agent="Builder" status="success" action="Ran tests" />,
      );
      expect(!container.textContent?.includes("→ ")).toBe(true);
    });

    test("does not render result line when result is empty string", () => {
      const { container } = render(
        <TimelineEntry
          timestamp="14:32:45"
          agent="Builder"
          status="success"
          action="Ran tests"
          result=""
        />,
      );
      const divs = container.querySelectorAll("div");
      const hasResultLine = Array.from(divs).some((div) => div.textContent?.includes("→"));
      expect(!hasResultLine).toBe(true);
    });
  });

  describe("Status Icons", () => {
    test("renders pending status icon (○)", () => {
      render(
        <TimelineEntry timestamp="10:00:00" agent="Builder" status="pending" action="Waiting" />,
      );
      expect(screen.getByText("○")).toBeTruthy();
    });

    test("renders running status icon (◐)", () => {
      render(
        <TimelineEntry timestamp="10:00:00" agent="Builder" status="running" action="Processing" />,
      );
      expect(screen.getByText("◐")).toBeTruthy();
    });

    test("renders success status icon (✓)", () => {
      render(
        <TimelineEntry timestamp="10:00:00" agent="Builder" status="success" action="Complete" />,
      );
      expect(screen.getByText("✓")).toBeTruthy();
    });

    test("renders error status icon (✗)", () => {
      render(<TimelineEntry timestamp="10:00:00" agent="Builder" status="error" action="Failed" />);
      expect(screen.getByText("✗")).toBeTruthy();
    });
  });

  describe("Status Colors", () => {
    test("applies gray color for pending status", () => {
      const { container } = render(
        <TimelineEntry timestamp="10:00:00" agent="Builder" status="pending" action="Waiting" />,
      );
      const iconSpan = Array.from(container.querySelectorAll("span")).find(
        (s) => s.textContent === "○",
      );
      expect(iconSpan?.className).toContain("text-[var(--ds-gray-600)]");
    });

    test("applies blue color and animation for running status", () => {
      const { container } = render(
        <TimelineEntry timestamp="10:00:00" agent="Builder" status="running" action="Processing" />,
      );
      const iconSpan = Array.from(container.querySelectorAll("span")).find(
        (s) => s.textContent === "◐",
      );
      expect(iconSpan?.className).toContain("text-[var(--ds-blue-600)]");
      expect(iconSpan?.className).toContain("animate-spin");
    });

    test("applies green color for success status", () => {
      const { container } = render(
        <TimelineEntry timestamp="10:00:00" agent="Builder" status="success" action="Complete" />,
      );
      const iconSpan = Array.from(container.querySelectorAll("span")).find(
        (s) => s.textContent === "✓",
      );
      expect(iconSpan?.className).toContain("text-[var(--ds-green-600)]");
    });

    test("applies red color for error status", () => {
      const { container } = render(
        <TimelineEntry timestamp="10:00:00" agent="Builder" status="error" action="Failed" />,
      );
      const iconSpan = Array.from(container.querySelectorAll("span")).find(
        (s) => s.textContent === "✗",
      );
      expect(iconSpan?.className).toContain("text-[var(--ds-red-600)]");
    });
  });

  describe("Text Styling", () => {
    test("applies gray styling to timestamp", () => {
      const { container } = render(
        <TimelineEntry timestamp="14:32:45" agent="Builder" status="success" action="Test" />,
      );
      const timestampSpan = Array.from(container.querySelectorAll("span")).find(
        (s) => s.textContent === "14:32:45",
      );
      expect(timestampSpan?.className).toContain("text-[var(--ds-gray-600)]");
    });

    test("applies consistent width to timestamp column", () => {
      const { container } = render(
        <TimelineEntry timestamp="10:00:00" agent="Builder" status="success" action="Test" />,
      );
      const timestampSpan = Array.from(container.querySelectorAll("span")).find(
        (s) => s.textContent === "10:00:00",
      );
      expect(timestampSpan?.className).toContain("w-12");
      expect(timestampSpan?.className).toContain("flex-shrink-0");
    });

    test("allows action text to wrap if needed", () => {
      const { container } = render(
        <TimelineEntry
          timestamp="10:00:00"
          agent="Builder"
          status="success"
          action="Very long action text"
        />,
      );
      const actionSpan = Array.from(container.querySelectorAll("span")).find((s) =>
        s.textContent?.includes("Very long action"),
      );
      expect(actionSpan?.className).toContain("break-words");
    });

    test("applies subtle styling to result", () => {
      const { container } = render(
        <TimelineEntry
          timestamp="10:00:00"
          agent="Builder"
          status="success"
          action="Test"
          result="Result data"
        />,
      );
      const resultSpan = Array.from(container.querySelectorAll("span")).find((s) =>
        s.textContent?.includes("Result data"),
      );
      expect(resultSpan?.className).toContain("text-[var(--ds-gray-600)]");
    });
  });

  describe("Edge Cases", () => {
    test("handles very long timestamp", () => {
      render(
        <TimelineEntry
          timestamp="2026-07-18T14:32:45.123456Z"
          agent="Builder"
          status="success"
          action="Test"
        />,
      );
      expect(screen.getByText("2026-07-18T14:32:45.123456Z")).toBeTruthy();
    });

    test("handles very long agent name", () => {
      const longAgent = "A".repeat(100);
      render(
        <TimelineEntry timestamp="10:00:00" agent={longAgent} status="success" action="Test" />,
      );
      expect(screen.getByText(longAgent)).toBeTruthy();
    });

    test("handles very long action description", () => {
      const longAction = "Processing: " + "x".repeat(500);
      render(
        <TimelineEntry timestamp="10:00:00" agent="Builder" status="success" action={longAction} />,
      );
      expect(screen.getByText(longAction)).toBeTruthy();
    });

    test("handles very long result", () => {
      const longResult = "Output: " + "y".repeat(500);
      render(
        <TimelineEntry
          timestamp="10:00:00"
          agent="Builder"
          status="success"
          action="Test"
          result={longResult}
        />,
      );
      expect(screen.getByText("→ " + longResult)).toBeTruthy();
    });

    test("handles special characters in text", () => {
      render(
        <TimelineEntry
          timestamp="10:00:00"
          agent="Builder"
          status="success"
          action="Test → Deploy • Check ✓"
          result="Result: $1,234.56 (100%)"
        />,
      );
      expect(screen.getByText("Test → Deploy • Check ✓")).toBeTruthy();
      expect(screen.getByText("→ Result: $1,234.56 (100%)")).toBeTruthy();
    });

    test("handles unicode emoji in text", () => {
      render(
        <TimelineEntry
          timestamp="10:00:00"
          agent="Builder"
          status="success"
          action="🚀 Deploy 🎉"
          result="✨ Success ✨"
        />,
      );
      expect(screen.getByText("🚀 Deploy 🎉")).toBeTruthy();
    });

    test("handles null/undefined safely", () => {
      render(
        <TimelineEntry
          timestamp="10:00:00"
          agent="Builder"
          status="success"
          action="Test"
          result={undefined}
        />,
      );
      expect(screen.getByText("Test")).toBeTruthy();
      const resultInDocument = screen.queryByText(/^→/);
      expect(!resultInDocument).toBe(true);
    });
  });

  describe("Multiple Entries", () => {
    test("renders multiple entries with correct spacing", () => {
      const { container } = render(
        <>
          <TimelineEntry
            timestamp="14:32:00"
            agent="Agent1"
            status="success"
            action="Step 1"
            result="Done"
          />
          <TimelineEntry timestamp="14:33:00" agent="Agent2" status="running" action="Step 2" />
          <TimelineEntry timestamp="14:34:00" agent="Agent3" status="pending" action="Step 3" />
        </>,
      );
      const entries = container.querySelectorAll(":scope > div");
      expect(entries.length > 0).toBe(true);
    });
  });
});
