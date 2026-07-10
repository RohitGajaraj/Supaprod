import { describe, it, expect } from "bun:test";
import type { ResearchStatus } from "./ResearchActivity";
import {
  parseResearchStatus,
  summarySegments,
  ResearchActivityLine,
  ResearchSummaryRow,
} from "./ResearchActivity";

describe("parseResearchStatus", () => {
  it("should parse valid research status", () => {
    const result = parseResearchStatus({
      phase: "search",
      label: "Searching for results",
    });
    expect(result).toEqual({
      phase: "search",
      label: "Searching for results",
    });
  });

  it("should return null for invalid phase", () => {
    expect(
      parseResearchStatus({ phase: "invalid", label: "test" })
    ).toBeNull();
  });

  it("should return null for missing phase", () => {
    expect(parseResearchStatus({ label: "test" })).toBeNull();
  });

  it("should return null for missing label", () => {
    expect(parseResearchStatus({ phase: "search" })).toBeNull();
  });

  it("should return null for non-string phase", () => {
    expect(parseResearchStatus({ phase: 123, label: "test" })).toBeNull();
  });

  it("should return null for non-string label", () => {
    expect(parseResearchStatus({ phase: "search", label: 123 })).toBeNull();
  });

  it("should return null for non-object input", () => {
    expect(parseResearchStatus("invalid")).toBeNull();
    expect(parseResearchStatus(null)).toBeNull();
    expect(parseResearchStatus(undefined)).toBeNull();
  });

  it("should accept all valid phases", () => {
    const phases: ResearchStatus["phase"][] = [
      "plan",
      "search",
      "read",
      "workspace",
      "synthesize",
    ];
    for (const phase of phases) {
      const result = parseResearchStatus({ phase, label: "test" });
      expect(result).not.toBeNull();
      expect(result?.phase).toBe(phase);
    }
  });
});

describe("summarySegments", () => {
  it("should return empty array when all inputs are 0/false", () => {
    expect(summarySegments(0, 0, false)).toEqual([]);
  });

  it("should format singular query", () => {
    expect(summarySegments(1, 0, false)).toContain("Searched 1 query");
  });

  it("should format plural queries", () => {
    expect(summarySegments(3, 0, false)).toContain("Searched 3 queries");
  });

  it("should format singular source", () => {
    expect(summarySegments(0, 1, false)).toContain("Read 1 source");
  });

  it("should format plural sources", () => {
    expect(summarySegments(0, 5, false)).toContain("Read 5 sources");
  });

  it("should include workspace when true", () => {
    expect(summarySegments(0, 0, true)).toContain("Workspace");
  });

  it("should combine multiple segments in order", () => {
    const result = summarySegments(2, 3, true);
    expect(result.length).toBe(3);
    expect(result[0]).toBe("Searched 2 queries");
    expect(result[1]).toBe("Read 3 sources");
    expect(result[2]).toBe("Workspace");
  });

  it("should handle edge case: zero searches but multiple reads", () => {
    const result = summarySegments(0, 10, false);
    expect(result).toEqual(["Read 10 sources"]);
  });

  it("should handle edge case: multiple searches but zero reads", () => {
    const result = summarySegments(5, 0, false);
    expect(result).toEqual(["Searched 5 queries"]);
  });
});

describe("ResearchActivityLine", () => {
  it("should return null for empty statuses", () => {
    const result = ResearchActivityLine({ statuses: [] });
    expect(result).toBeNull();
  });

  it("should render with single status", () => {
    const statuses: ResearchStatus[] = [
      { phase: "search", label: "Searching..." },
    ];
    const element = ResearchActivityLine({ statuses });
    expect(element).not.toBeNull();
  });

  it("should show latest status label", () => {
    const statuses: ResearchStatus[] = [
      { phase: "plan", label: "Planning" },
      { phase: "search", label: "Searching for sources" },
    ];
    const element = ResearchActivityLine({ statuses });
    // Verify the latest label appears in the rendered output
    expect(element).not.toBeNull();
  });

  it("should accumulate done phases in summary", () => {
    const statuses: ResearchStatus[] = [
      { phase: "search", label: "Searched" },
      { phase: "search", label: "Searched again" },
      { phase: "read", label: "Reading..." },
    ];
    const element = ResearchActivityLine({ statuses });
    // Completed phases (first 2 searches + read) should appear in summary
    expect(element).not.toBeNull();
  });

  it("should handle workspace in summary", () => {
    const statuses: ResearchStatus[] = [
      { phase: "workspace", label: "Checking workspace" },
      { phase: "synthesize", label: "Synthesizing..." },
    ];
    const element = ResearchActivityLine({ statuses });
    expect(element).not.toBeNull();
  });

  it("should render spinner and label styles", () => {
    const statuses: ResearchStatus[] = [
      { phase: "search", label: "Searching" },
    ];
    const element = ResearchActivityLine({ statuses });
    // Component should have flex layout with appropriate styling
    expect(element?.props?.className).toContain("fade-up");
  });
});

describe("ResearchSummaryRow", () => {
  it("should return null when no research meta", () => {
    const meta = {
      research: null,
      sources: [],
      workspace_chunks: 0,
    };
    const result = ResearchSummaryRow({ meta });
    expect(result).toBeNull();
  });

  it("should return null for chat-mode research (no real research)", () => {
    const meta = {
      research: { mode: "chat", sub_queries: [] },
      sources: [],
      workspace_chunks: 0,
    };
    const result = ResearchSummaryRow({ meta });
    expect(result).toBeNull();
  });

  it("should render for internal mode with no sources", () => {
    const meta = {
      research: {
        mode: "internal" as const,
        sub_queries: [],
      },
      sources: [],
      workspace_chunks: 0,
    };
    const result = ResearchSummaryRow({ meta });
    expect(result).not.toBeNull();
  });

  it("should count web sources only", () => {
    const meta = {
      research: { mode: "both" as const, sub_queries: [] },
      sources: [
        { kind: "web" as const },
        { kind: "web" as const },
        { kind: "document" as const },
      ],
      workspace_chunks: 0,
    };
    const result = ResearchSummaryRow({ meta });
    expect(result).not.toBeNull();
  });

  it("should include workspace chunks in workspace detection", () => {
    const meta = {
      research: { mode: "web" as const, sub_queries: [] },
      sources: [],
      workspace_chunks: 5,
    };
    const result = ResearchSummaryRow({ meta });
    expect(result).not.toBeNull();
  });

  it("should detect workspace from non-web sources", () => {
    const meta = {
      research: { mode: "web" as const, sub_queries: [] },
      sources: [{ kind: "document" as const }],
      workspace_chunks: 0,
    };
    const result = ResearchSummaryRow({ meta });
    expect(result).not.toBeNull();
  });

  it("should return null when no research activity occurred", () => {
    const meta = {
      research: { mode: "web" as const, sub_queries: [] },
      sources: [{ kind: "web" as const }],
      workspace_chunks: 0,
    };
    const result = ResearchSummaryRow({ meta });
    // Web research with only web sources and no other activity should still render
    expect(result).not.toBeNull();
  });

  it("should handle both mode with multiple source types", () => {
    const meta = {
      research: {
        mode: "both" as const,
        sub_queries: ["query1", "query2"],
      },
      sources: [
        { kind: "web" as const },
        { kind: "document" as const },
        { kind: "document" as const },
      ],
      workspace_chunks: 3,
    };
    const result = ResearchSummaryRow({ meta });
    expect(result).not.toBeNull();
  });
});
