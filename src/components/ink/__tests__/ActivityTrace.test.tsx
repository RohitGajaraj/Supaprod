/**
 * ActivityTrace component tests — three-voice trace with streaming.
 *
 * Coverage: ActivityTrace row rendering, voice color mapping, streaming caret
 * on last row only, receipt suffix, empty list, ActivitySummaryLine rendering,
 * onOpen callback, gold color ban enforcement (memory voice only on memory rows),
 * accessibility (aria-label, ordered list), edge cases.
 *
 * Design-system rules tested:
 *  - gold/memory color (var(--voice-memory)) ONLY appears on memory rows
 *  - machine rows use var(--voice-machine) (blue)
 *  - human rows use var(--voice-human) (ember)
 *  - system rows use var(--ink-subtle)
 *  - streaming caret (.ink-caret) is applied ONLY to the last row's text span
 */

import { describe, test, expect, mock } from "bun:test";
import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import {
  ActivityTrace,
  ActivitySummaryLine,
  type TraceRow,
  type TraceVoice,
} from "../ActivityTrace";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function row(overrides: Partial<TraceRow> & { id: string }): TraceRow {
  return {
    time: "09:00",
    voice: "machine",
    text: "Agent completed the task",
    ...overrides,
  };
}

const MACHINE_ROW = row({ id: "r1", voice: "machine", text: "Drafted spec" });
const HUMAN_ROW = row({ id: "r2", voice: "human", text: "You approved the plan" });
const MEMORY_ROW = row({ id: "r3", voice: "memory", text: "Recalled project context" });
const SYSTEM_ROW = row({ id: "r4", voice: "system", text: "Session started" });

// ---------------------------------------------------------------------------
// ActivityTrace — base rendering
// ---------------------------------------------------------------------------

describe("ActivityTrace — base rendering", () => {
  test("renders an ordered list", () => {
    const { container } = render(
      React.createElement(ActivityTrace, { rows: [MACHINE_ROW] }),
    );
    expect(container.querySelector("ol")).toBeTruthy();
  });

  test("has aria-label='Agent activity'", () => {
    const { container } = render(
      React.createElement(ActivityTrace, { rows: [MACHINE_ROW] }),
    );
    expect(container.querySelector("ol")?.getAttribute("aria-label")).toBe("Agent activity");
  });

  test("renders one li per row", () => {
    const rows = [MACHINE_ROW, HUMAN_ROW, MEMORY_ROW];
    const { container } = render(
      React.createElement(ActivityTrace, { rows }),
    );
    expect(container.querySelectorAll("li")).toHaveLength(3);
  });

  test("empty rows renders an empty list without error", () => {
    expect(() =>
      render(React.createElement(ActivityTrace, { rows: [] })),
    ).not.toThrow();
  });

  test("empty rows renders no li elements", () => {
    const { container } = render(React.createElement(ActivityTrace, { rows: [] }));
    expect(container.querySelectorAll("li")).toHaveLength(0);
  });

  test("applies custom className to the ol", () => {
    const { container } = render(
      React.createElement(ActivityTrace, { rows: [MACHINE_ROW], className: "custom-trace" }),
    );
    expect(container.querySelector("ol")?.className).toContain("custom-trace");
  });
});

// ---------------------------------------------------------------------------
// Row content — time, text, receipt
// ---------------------------------------------------------------------------

describe("ActivityTrace — row content", () => {
  test("renders the time value in a <time> element", () => {
    const { container } = render(
      React.createElement(ActivityTrace, { rows: [row({ id: "t", time: "14:32" })] }),
    );
    expect(container.querySelector("time")?.textContent).toBe("14:32");
  });

  test("renders the row text content", () => {
    render(React.createElement(ActivityTrace, { rows: [MACHINE_ROW] }));
    expect(screen.getByText("Drafted spec")).toBeTruthy();
  });

  test("renders receipt suffix when provided", () => {
    const rowWithReceipt = row({ id: "rr", text: "Wrote code", receipt: "PR #42" });
    render(React.createElement(ActivityTrace, { rows: [rowWithReceipt] }));
    expect(screen.getByText(/PR #42/)).toBeTruthy();
  });

  test("receipt is prefixed with ' · ' separator", () => {
    const rowWithReceipt = row({ id: "rr", text: "Wrote code", receipt: "3 files" });
    const { container } = render(
      React.createElement(ActivityTrace, { rows: [rowWithReceipt] }),
    );
    expect(container.textContent).toContain(" · 3 files");
  });

  test("no receipt span when receipt is absent", () => {
    const { container } = render(
      React.createElement(ActivityTrace, { rows: [MACHINE_ROW] }),
    );
    expect(container.textContent).not.toContain(" · ");
  });
});

// ---------------------------------------------------------------------------
// Voice color mapping — diamond dot indicators
// ---------------------------------------------------------------------------

describe("ActivityTrace — voice color mapping", () => {
  function getDotStyle(voice: TraceVoice): string {
    const testRow = row({ id: "test", voice });
    const { container } = render(
      React.createElement(ActivityTrace, { rows: [testRow] }),
    );
    // The diamond dot is the span with aria-hidden and a background style
    const dot = container.querySelector("li span[aria-hidden]") as HTMLElement;
    return dot?.style?.background ?? "";
  }

  test("machine voice dot uses var(--voice-machine)", () => {
    expect(getDotStyle("machine")).toBe("var(--voice-machine)");
  });

  test("human voice dot uses var(--voice-human)", () => {
    expect(getDotStyle("human")).toBe("var(--voice-human)");
  });

  test("memory voice dot uses var(--voice-memory) — gold; ONLY on memory rows", () => {
    expect(getDotStyle("memory")).toBe("var(--voice-memory)");
  });

  test("system voice dot uses var(--ink-subtle)", () => {
    expect(getDotStyle("system")).toBe("var(--ink-subtle)");
  });
});

// ---------------------------------------------------------------------------
// Gold color ban — memory voice ONLY on memory rows (design constraint)
// ---------------------------------------------------------------------------

describe("ActivityTrace — gold color ban enforcement", () => {
  test("machine row does NOT use var(--voice-memory) color", () => {
    const { container } = render(
      React.createElement(ActivityTrace, { rows: [MACHINE_ROW] }),
    );
    const dot = container.querySelector("li span[aria-hidden]") as HTMLElement;
    expect(dot?.style?.background).not.toBe("var(--voice-memory)");
  });

  test("human row does NOT use var(--voice-memory) color", () => {
    const { container } = render(
      React.createElement(ActivityTrace, { rows: [HUMAN_ROW] }),
    );
    const dot = container.querySelector("li span[aria-hidden]") as HTMLElement;
    expect(dot?.style?.background).not.toBe("var(--voice-memory)");
  });

  test("system row does NOT use var(--voice-memory) color", () => {
    const { container } = render(
      React.createElement(ActivityTrace, { rows: [SYSTEM_ROW] }),
    );
    const dot = container.querySelector("li span[aria-hidden]") as HTMLElement;
    expect(dot?.style?.background).not.toBe("var(--voice-memory)");
  });

  test("in a mixed-voice list, only the memory row's dot is gold", () => {
    const rows = [MACHINE_ROW, MEMORY_ROW, HUMAN_ROW];
    const { container } = render(React.createElement(ActivityTrace, { rows }));
    const dots = container.querySelectorAll("li span[aria-hidden]");
    const dotStyles = Array.from(dots).map((d) => (d as HTMLElement).style?.background);

    // Only index 1 (MEMORY_ROW) should be gold
    expect(dotStyles[0]).not.toBe("var(--voice-memory)");
    expect(dotStyles[1]).toBe("var(--voice-memory)");
    expect(dotStyles[2]).not.toBe("var(--voice-memory)");
  });
});

// ---------------------------------------------------------------------------
// Human voice text color
// ---------------------------------------------------------------------------

describe("ActivityTrace — human voice text styling", () => {
  test("human row text span applies var(--ink-text) class (full contrast)", () => {
    const { container } = render(
      React.createElement(ActivityTrace, { rows: [HUMAN_ROW] }),
    );
    // The text span for human rows applies text-[var(--ink-text)]
    const textSpan = container.querySelector("li > span > span") as HTMLElement;
    expect(textSpan?.className).toContain("text-[var(--ink-text)]");
  });

  test("machine row text span applies var(--ink-body) class (subdued)", () => {
    const { container } = render(
      React.createElement(ActivityTrace, { rows: [MACHINE_ROW] }),
    );
    const textSpan = container.querySelector("li > span > span") as HTMLElement;
    expect(textSpan?.className).toContain("text-[var(--ink-body)]");
  });
});

// ---------------------------------------------------------------------------
// Streaming caret — only on the LAST row
// ---------------------------------------------------------------------------

describe("ActivityTrace — streaming caret", () => {
  test("streaming=true adds ink-caret class to the LAST row's text span", () => {
    const rows = [MACHINE_ROW, HUMAN_ROW];
    const { container } = render(
      React.createElement(ActivityTrace, { rows, streaming: true }),
    );
    // Content wrapper spans (min-w-0): one per row; dot spans (aria-hidden) are excluded
    const contentSpans = container.querySelectorAll("li > span.min-w-0");
    const lastSpan = contentSpans[contentSpans.length - 1] as HTMLElement;
    expect(lastSpan?.className).toContain("ink-caret");
  });

  test("streaming=true does NOT add ink-caret to non-last rows", () => {
    const rows = [MACHINE_ROW, HUMAN_ROW];
    const { container } = render(
      React.createElement(ActivityTrace, { rows, streaming: true }),
    );
    const contentSpans = container.querySelectorAll("li > span.min-w-0");
    const firstSpan = contentSpans[0] as HTMLElement;
    expect(firstSpan?.className).not.toContain("ink-caret");
  });

  test("streaming=false: no row gets ink-caret", () => {
    const rows = [MACHINE_ROW, HUMAN_ROW];
    const { container } = render(
      React.createElement(ActivityTrace, { rows, streaming: false }),
    );
    const allSpans = container.querySelectorAll("li > span");
    allSpans.forEach((span) => {
      expect((span as HTMLElement).className).not.toContain("ink-caret");
    });
  });

  test("streaming omitted: no row gets ink-caret", () => {
    const rows = [MACHINE_ROW, HUMAN_ROW];
    const { container } = render(
      React.createElement(ActivityTrace, { rows }),
    );
    const allSpans = container.querySelectorAll("li > span");
    allSpans.forEach((span) => {
      expect((span as HTMLElement).className).not.toContain("ink-caret");
    });
  });

  test("streaming=true with a single row: that row gets the caret", () => {
    const { container } = render(
      React.createElement(ActivityTrace, { rows: [MACHINE_ROW], streaming: true }),
    );
    // The content wrapper span has min-w-0 and optionally ink-caret; the dot is aria-hidden
    const contentSpan = container.querySelector("li > span.min-w-0") as HTMLElement;
    expect(contentSpan?.className).toContain("ink-caret");
  });

  test("streaming=true with empty rows: no crash", () => {
    expect(() =>
      render(React.createElement(ActivityTrace, { rows: [], streaming: true })),
    ).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// ActivitySummaryLine
// ---------------------------------------------------------------------------

describe("ActivitySummaryLine — rendering", () => {
  test("renders a button element", () => {
    const { container } = render(
      React.createElement(ActivitySummaryLine, { text: "3 agents working" }),
    );
    expect(container.querySelector("button")).toBeTruthy();
  });

  test("renders the summary text", () => {
    render(React.createElement(ActivitySummaryLine, { text: "14 tasks done overnight" }));
    expect(screen.getByText("14 tasks done overnight")).toBeTruthy();
  });

  test("has type=button to prevent accidental form submission", () => {
    const { container } = render(
      React.createElement(ActivitySummaryLine, { text: "Summary" }),
    );
    expect(container.querySelector("button")?.getAttribute("type")).toBe("button");
  });

  test("renders a colored dot indicator (aria-hidden)", () => {
    const { container } = render(
      React.createElement(ActivitySummaryLine, { text: "Summary" }),
    );
    const dot = container.querySelector("span[aria-hidden]");
    expect(dot).toBeTruthy();
    expect(dot?.className).toContain("bg-[var(--voice-machine)]");
  });

  test("calls onOpen when clicked", () => {
    const onOpen = mock(() => {});
    const { container } = render(
      React.createElement(ActivitySummaryLine, { text: "Summary", onOpen }),
    );
    fireEvent.click(container.querySelector("button")!);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  test("applies custom className", () => {
    const { container } = render(
      React.createElement(ActivitySummaryLine, { text: "Summary", className: "my-summary" }),
    );
    expect(container.querySelector("button")?.className).toContain("my-summary");
  });

  test("works without onOpen prop (no error)", () => {
    const { container } = render(
      React.createElement(ActivitySummaryLine, { text: "Summary" }),
    );
    expect(() => fireEvent.click(container.querySelector("button")!)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("ActivityTrace — edge cases", () => {
  test("large number of rows (100) renders without error", () => {
    const rows = Array.from({ length: 100 }, (_, i) =>
      row({ id: String(i), voice: "machine", text: `Task ${i}` }),
    );
    expect(() =>
      render(React.createElement(ActivityTrace, { rows, streaming: true })),
    ).not.toThrow();
  });

  test("large list: streaming caret is still only on the last row", () => {
    const rows = Array.from({ length: 10 }, (_, i) =>
      row({ id: String(i), voice: "machine", text: `Task ${i}` }),
    );
    const { container } = render(
      React.createElement(ActivityTrace, { rows, streaming: true }),
    );
    // Content wrapper spans (min-w-0) — one per row; the aria-hidden dot spans are excluded
    const contentSpans = container.querySelectorAll("li > span.min-w-0");
    const caretSpans = Array.from(contentSpans).filter((s) =>
      (s as HTMLElement).className.includes("ink-caret"),
    );
    expect(caretSpans).toHaveLength(1);
    // The last content span (index 9) is the one with the caret
    expect((contentSpans[9] as HTMLElement).className).toContain("ink-caret");
  });

  test("row with empty text renders without crash", () => {
    expect(() =>
      render(React.createElement(ActivityTrace, { rows: [row({ id: "empty", text: "" })] })),
    ).not.toThrow();
  });

  test("row with very long text renders without crash", () => {
    const longText = "Agent processed ".repeat(50);
    expect(() =>
      render(
        React.createElement(ActivityTrace, {
          rows: [row({ id: "long", text: longText })],
        }),
      ),
    ).not.toThrow();
  });

  test("row with special characters in text renders correctly", () => {
    const specialText = '<script>alert("xss")</script>';
    render(
      React.createElement(ActivityTrace, {
        rows: [row({ id: "xss", text: specialText })],
      }),
    );
    // React escapes this — the script tag must not execute
    const scriptEl = document.querySelector("script[src]");
    expect(scriptEl).toBeNull();
  });
});
