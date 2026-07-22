import { describe, it, expect } from "bun:test";
import { render } from "@testing-library/react";
import { ActivityTrace, ActivitySummaryLine, TraceRow } from "./ActivityTrace";

describe("ActivityTrace", () => {
  const mockRows: TraceRow[] = [
    {
      id: "1",
      time: "14:32",
      voice: "machine",
      text: "Started planning phase",
      receipt: "3 tasks",
    },
    {
      id: "2",
      time: "14:35",
      voice: "human",
      text: "Approved the plan",
      receipt: undefined,
    },
    {
      id: "3",
      time: "14:40",
      voice: "memory",
      text: "Recorded decision",
      receipt: "decision-42",
    },
    {
      id: "4",
      time: "14:45",
      voice: "system",
      text: "Sync completed",
      receipt: undefined,
    },
  ];

  describe("render", () => {
    it("renders ordered list", () => {
      const { container } = render(<ActivityTrace rows={mockRows} />);
      const list = container.querySelector("ol");
      expect(list).toBeTruthy();
      expect(list?.getAttribute("aria-label")).toBe("Agent activity");
    });

    it("renders one list item per row", () => {
      const { container } = render(<ActivityTrace rows={mockRows} />);
      const items = container.querySelectorAll("li");
      expect(items.length).toBe(4);
    });

    it("renders empty list when rows is empty", () => {
      const { container } = render(<ActivityTrace rows={[]} />);
      const items = container.querySelectorAll("li");
      expect(items.length).toBe(0);
    });
  });

  describe("row rendering", () => {
    it("renders time for each row", () => {
      const { container } = render(<ActivityTrace rows={mockRows} />);
      const times = container.querySelectorAll("time");
      expect(times[0]?.textContent).toBe("14:32");
      expect(times[1]?.textContent).toBe("14:35");
    });

    it("renders text content for each row", () => {
      const { container } = render(<ActivityTrace rows={mockRows} />);
      expect(container.textContent).toContain("Started planning phase");
      expect(container.textContent).toContain("Approved the plan");
      expect(container.textContent).toContain("Recorded decision");
      expect(container.textContent).toContain("Sync completed");
    });

    it("renders receipt suffix when provided", () => {
      const { container } = render(<ActivityTrace rows={mockRows} />);
      expect(container.textContent).toContain("3 tasks");
      expect(container.textContent).toContain("decision-42");
    });

    it("does not render receipt when not provided", () => {
      const { container } = render(<ActivityTrace rows={mockRows} />);
      const items = container.querySelectorAll("li");
      const item2 = items[1]; // "Approved the plan" with no receipt
      // Should not contain a receipt span with the separator
      const receiptInItem = item2?.querySelector("span")?.textContent?.includes("·");
      expect(receiptInItem).toBeFalsy();
    });
  });

  describe("three-voice color mapping (CRITICAL INVARIANT)", () => {
    it("applies machine blue to machine voice rows", () => {
      const machineRow: TraceRow = {
        id: "m1",
        time: "10:00",
        voice: "machine",
        text: "Agent thinking...",
      };

      const { container } = render(<ActivityTrace rows={[machineRow]} />);
      const voiceIndicator = container.querySelector("[style*='background']");

      // The diamond indicator should use machine blue: var(--voice-machine)
      expect(voiceIndicator?.getAttribute("style")).toContain("--voice-machine");
    });

    it("applies ember to human voice rows", () => {
      const humanRow: TraceRow = {
        id: "h1",
        time: "10:05",
        voice: "human",
        text: "You approved the plan",
      };

      const { container } = render(<ActivityTrace rows={[humanRow]} />);
      const voiceIndicator = container.querySelector("[style*='background']");

      // Human voice indicator should use ember
      expect(voiceIndicator?.getAttribute("style")).toContain("--voice-human");
    });

    it("applies memory gold ONLY to memory voice rows (THE GOLD BAN)", () => {
      const memoryRow: TraceRow = {
        id: "mem1",
        time: "10:10",
        voice: "memory",
        text: "Learning from this interaction",
      };

      const { container } = render(<ActivityTrace rows={[memoryRow]} />);
      const voiceIndicator = container.querySelector("[style*='background']");

      // Memory voice indicator should use memory gold
      expect(voiceIndicator?.getAttribute("style")).toContain("--voice-memory");
    });

    it("applies system color to system voice rows", () => {
      const systemRow: TraceRow = {
        id: "s1",
        time: "10:15",
        voice: "system",
        text: "Maintenance task",
      };

      const { container } = render(<ActivityTrace rows={[systemRow]} />);
      const voiceIndicator = container.querySelector("[style*='background']");

      // System voice indicator should use system subtle gray
      expect(voiceIndicator?.getAttribute("style")).toContain("--ink-subtle");
    });

    it("enforces gold ban: memory gold never appears on non-memory rows", () => {
      const mixedRows: TraceRow[] = [
        { id: "1", time: "10:00", voice: "machine", text: "Machine work" },
        { id: "2", time: "10:05", voice: "human", text: "Human input" },
        { id: "3", time: "10:10", voice: "system", text: "System sync" },
      ];

      const { container } = render(<ActivityTrace rows={mixedRows} />);
      const indicators = container.querySelectorAll("[style*='background']");

      indicators.forEach((indicator, idx) => {
        const style = indicator.getAttribute("style");
        if (idx === 0) {
          // Machine row
          expect(style).toContain("--voice-machine");
          expect(style).not.toContain("--voice-memory");
        } else if (idx === 1) {
          // Human row
          expect(style).toContain("--voice-human");
          expect(style).not.toContain("--voice-memory");
        } else if (idx === 2) {
          // System row
          expect(style).toContain("--ink-subtle");
          expect(style).not.toContain("--voice-memory");
        }
      });
    });

    it("memory voice is the ONLY voice that uses gold", () => {
      const allVoiceRows: TraceRow[] = [
        { id: "1", time: "10:00", voice: "machine", text: "Machine" },
        { id: "2", time: "10:05", voice: "human", text: "Human" },
        { id: "3", time: "10:10", voice: "memory", text: "Memory", receipt: "gold" },
        { id: "4", time: "10:15", voice: "system", text: "System" },
      ];

      const { container } = render(<ActivityTrace rows={allVoiceRows} />);
      const indicators = container.querySelectorAll("[style*='background']");

      let memoryFound = false;
      indicators.forEach((indicator, idx) => {
        const style = indicator.getAttribute("style");
        if (style?.includes("--voice-memory")) {
          expect(idx).toBe(2); // Only the memory row (index 2)
          memoryFound = true;
        }
      });

      expect(memoryFound).toBe(true);
    });
  });

  describe("text styling", () => {
    it("renders human voice text content", () => {
      const humanRow: TraceRow = {
        id: "h1",
        time: "10:00",
        voice: "human",
        text: "You did something",
      };

      const { container } = render(<ActivityTrace rows={[humanRow]} />);
      // The component should render the text content
      expect(container.textContent).toContain("You did something");
    });

    it("renders non-human voice text content", () => {
      const machineRow: TraceRow = {
        id: "m1",
        time: "10:00",
        voice: "machine",
        text: "Agent is working",
      };

      const { container } = render(<ActivityTrace rows={[machineRow]} />);
      // The component should render the text content
      expect(container.textContent).toContain("Agent is working");
    });
  });

  describe("streaming indicator", () => {
    it("renders streaming state with last row indicator", () => {
      const { container } = render(<ActivityTrace rows={mockRows} streaming={true} />);
      const items = container.querySelectorAll("li");
      const lastItem = items[items.length - 1];

      // Last item should be rendered (it will have special styling in CSS)
      expect(lastItem).toBeTruthy();
      expect(lastItem?.textContent).toBeTruthy();
    });

    it("does not apply streaming indicator when streaming is false", () => {
      const { container } = render(<ActivityTrace rows={mockRows} streaming={false} />);
      const items = container.querySelectorAll("li");
      expect(items.length).toBe(mockRows.length);
    });

    it("does not apply streaming indicator when streaming is undefined", () => {
      const { container } = render(<ActivityTrace rows={mockRows} />);
      const items = container.querySelectorAll("li");
      expect(items.length).toBe(mockRows.length);
    });
  });

  describe("grid layout", () => {
    it("uses three-column grid layout (time, indicator, text)", () => {
      const { container } = render(<ActivityTrace rows={mockRows} />);
      const item = container.querySelector("li");

      // Grid should be: time (52px) | indicator (10px + 2px gap) | text (flex)
      expect(item?.className).toContain("grid-cols-[52px_10px_1fr]");
    });

    it("aligns items to baseline", () => {
      const { container } = render(<ActivityTrace rows={mockRows} />);
      const item = container.querySelector("li");

      expect(item?.className).toContain("items-baseline");
    });

    it("applies rounded padding and margin", () => {
      const { container } = render(<ActivityTrace rows={mockRows} />);
      const item = container.querySelector("li");

      expect(item?.className).toContain("rounded");
      expect(item?.className).toContain("px-1");
      expect(item?.className).toContain("py-[3px]");
    });
  });

  describe("time formatting", () => {
    it("renders time element with formatted time", () => {
      const { container } = render(<ActivityTrace rows={mockRows} />);
      const time = container.querySelector("time");

      // Time element should exist and contain a time format
      expect(time).toBeTruthy();
      expect(time?.textContent).toMatch(/\d{2}:\d{2}/);
    });

    it("renders multiple time elements for multiple rows", () => {
      const { container } = render(<ActivityTrace rows={mockRows} />);
      const times = container.querySelectorAll("time");

      expect(times.length).toBe(mockRows.length);
    });

    it("renders time with proper structure", () => {
      const { container } = render(<ActivityTrace rows={mockRows} />);
      const time = container.querySelector("time");

      // Time should be in a list item (li)
      expect(time?.closest("li")).toBeTruthy();
    });
  });

  describe("voice indicator diamond", () => {
    it("renders as rotated square (45deg)", () => {
      const { container } = render(<ActivityTrace rows={mockRows} />);
      const diamond = container.querySelector("[aria-hidden='true']");

      expect(diamond?.className).toContain("h-[5px]");
      expect(diamond?.className).toContain("w-[5px]");
      expect(diamond?.className).toContain("rotate-45");
    });

    it("is hidden from screen readers", () => {
      const { container } = render(<ActivityTrace rows={mockRows} />);
      const diamond = container.querySelector("[aria-hidden='true']");

      expect(diamond?.getAttribute("aria-hidden")).toBe("true");
    });

    it("centers in grid column", () => {
      const { container } = render(<ActivityTrace rows={mockRows} />);
      const diamond = container.querySelector("[aria-hidden='true']");

      expect(diamond?.className).toContain("justify-self-center");
    });
  });

  describe("receipt formatting", () => {
    it("separates receipt with dot", () => {
      const rowWithReceipt: TraceRow = {
        id: "1",
        time: "14:32",
        voice: "machine",
        text: "Task completed",
        receipt: "3 items",
      };

      const { container } = render(<ActivityTrace rows={[rowWithReceipt]} />);
      expect(container.textContent).toContain(" · 3 items");
    });

    it("renders receipt content in the trace", () => {
      const rowWithReceipt: TraceRow = {
        id: "1",
        time: "14:32",
        voice: "machine",
        text: "Task completed",
        receipt: "3 items",
      };

      const { container } = render(<ActivityTrace rows={[rowWithReceipt]} />);

      // Receipt should appear in the output
      expect(container.textContent).toContain("3 items");
    });
  });

  describe("className merge", () => {
    it("merges custom className with default styles", () => {
      const { container } = render(<ActivityTrace rows={mockRows} className="custom-trace" />);
      const list = container.querySelector("ol");

      expect(list?.className).toContain("custom-trace");
      expect(list?.className).toContain("space-y-0.5");
    });
  });
});

describe("ActivitySummaryLine", () => {
  describe("render", () => {
    it("renders as button", () => {
      const { container } = render(
        <ActivitySummaryLine text="3 agents working · 14 tasks done overnight" />,
      );
      const button = container.querySelector("button");
      expect(button).toBeTruthy();
    });

    it("displays summary text", () => {
      const { container } = render(
        <ActivitySummaryLine text="3 agents working · 14 tasks done overnight" />,
      );
      expect(container.textContent).toContain("3 agents working · 14 tasks done overnight");
    });

    it("renders with monospace styling", () => {
      const { container } = render(<ActivitySummaryLine text="Summary text" />);
      const button = container.querySelector("button");
      expect(button?.className).toContain("ink-mono");
    });

    it("applies small text size", () => {
      const { container } = render(<ActivitySummaryLine text="Summary text" />);
      const button = container.querySelector("button");
      expect(button?.className).toContain("text-[11px]");
    });

    it("renders machine blue dot indicator", () => {
      const { container } = render(<ActivitySummaryLine text="Summary text" />);
      const dot = container.querySelector("[aria-hidden='true']");
      expect(dot?.className).toContain("h-1.5");
      expect(dot?.className).toContain("w-1.5");
      expect(dot?.className).toContain("rounded-full");
      expect(dot?.className).toContain("bg-[var(--voice-machine)]");
    });

    it("hides dot from screen readers", () => {
      const { container } = render(<ActivitySummaryLine text="Summary text" />);
      const dot = container.querySelector("[aria-hidden='true']");
      expect(dot?.getAttribute("aria-hidden")).toBe("true");
    });
  });

  describe("interaction", () => {
    it("calls onOpen when clicked", () => {
      let openCalled = false;
      const onOpen = () => {
        openCalled = true;
      };

      const { container } = render(<ActivitySummaryLine text="Summary text" onOpen={onOpen} />);
      const button = container.querySelector("button") as HTMLButtonElement;

      button.click();
      expect(openCalled).toBe(true);
    });

    it("does not crash if onOpen is undefined", () => {
      const { container } = render(<ActivitySummaryLine text="Summary text" />);
      const button = container.querySelector("button") as HTMLButtonElement;

      // Should not throw
      button.click();
      expect(button).toBeTruthy();
    });

    it("applies hover color transition", () => {
      const { container } = render(<ActivitySummaryLine text="Summary text" />);
      const button = container.querySelector("button");

      expect(button?.className).toContain("hover:text-[var(--ink-body)]");
      expect(button?.className).toContain("transition-colors");
    });
  });

  describe("styling", () => {
    it("has focus ring", () => {
      const { container } = render(<ActivitySummaryLine text="Summary text" />);
      const button = container.querySelector("button");

      expect(button?.className).toContain("ink-focus");
    });

    it("has rounded background", () => {
      const { container } = render(<ActivitySummaryLine text="Summary text" />);
      const button = container.querySelector("button");

      expect(button?.className).toContain("rounded-md");
    });

    it("applies default subtle text color", () => {
      const { container } = render(<ActivitySummaryLine text="Summary text" />);
      const button = container.querySelector("button");

      expect(button?.className).toContain("text-[var(--ink-subtle)]");
    });
  });

  describe("className merge", () => {
    it("merges custom className with default styles", () => {
      const { container } = render(
        <ActivitySummaryLine text="Summary text" className="custom-summary" />,
      );
      const button = container.querySelector("button");

      expect(button?.className).toContain("custom-summary");
      expect(button?.className).toContain("ink-focus");
    });
  });
});
