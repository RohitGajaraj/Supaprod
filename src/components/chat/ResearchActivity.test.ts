import { describe, it, expect } from "bun:test";
import {
  parseResearchStatus,
  summarySegments,
  ResearchActivityLine,
  ResearchSummaryRow,
} from "./ResearchActivity";
import type { ChatMeta } from "@/components/chat/MessageMeta";

describe("ResearchActivity", () => {
  describe("parseResearchStatus", () => {
    it("should reject null/undefined input", () => {
      expect(parseResearchStatus(null)).toBeNull();
      expect(parseResearchStatus(undefined)).toBeNull();
    });

    it("should reject non-object input", () => {
      expect(parseResearchStatus("plan")).toBeNull();
      expect(parseResearchStatus(123)).toBeNull();
      expect(parseResearchStatus(true)).toBeNull();
    });

    it("should reject objects without required fields", () => {
      expect(parseResearchStatus({})).toBeNull();
      expect(parseResearchStatus({ phase: "plan" })).toBeNull(); // missing label
      expect(parseResearchStatus({ label: "Planning..." })).toBeNull(); // missing phase
    });

    it("should reject invalid phase values", () => {
      expect(parseResearchStatus({ phase: "invalid", label: "Doing something" })).toBeNull();
      expect(parseResearchStatus({ phase: "planning", label: "Planning..." })).toBeNull(); // wrong case
      expect(parseResearchStatus({ phase: "unknown", label: "Searching..." })).toBeNull();
    });

    it("should reject non-string label", () => {
      expect(parseResearchStatus({ phase: "plan", label: 123 })).toBeNull();
      expect(parseResearchStatus({ phase: "search", label: null })).toBeNull();
      expect(parseResearchStatus({ phase: "read", label: undefined })).toBeNull();
    });

    it("should parse all valid phases", () => {
      const validPhases = ["plan", "search", "read", "workspace", "synthesize"];
      for (const phase of validPhases) {
        const result = parseResearchStatus({ phase, label: `Doing ${phase}` });
        expect(result).not.toBeNull();
        expect(result?.phase).toBe(phase);
      }
    });

    it("should parse valid status with empty label", () => {
      const result = parseResearchStatus({ phase: "plan", label: "" });
      expect(result).not.toBeNull();
      expect(result?.label).toBe("");
    });

    it("should parse valid status with complex label", () => {
      const label = "Searching: 'machine learning' AND 'neural networks'";
      const result = parseResearchStatus({ phase: "search", label });
      expect(result?.label).toBe(label);
    });

    it("should parse all research phases in order", () => {
      const statuses = [
        parseResearchStatus({ phase: "plan", label: "Planning research..." }),
        parseResearchStatus({ phase: "search", label: "Searching web..." }),
        parseResearchStatus({ phase: "read", label: "Reading sources..." }),
        parseResearchStatus({ phase: "workspace", label: "Grounding in workspace..." }),
        parseResearchStatus({ phase: "synthesize", label: "Synthesizing answer..." }),
      ];
      expect(statuses).toHaveLength(5);
      statuses.forEach((s) => expect(s).not.toBeNull());
    });
  });

  describe("summarySegments", () => {
    it("should return empty array when all counts are zero/false", () => {
      expect(summarySegments(0, 0, false)).toEqual([]);
    });

    it("should format single search query", () => {
      expect(summarySegments(1, 0, false)).toEqual(["Searched 1 query"]);
    });

    it("should format multiple search queries", () => {
      expect(summarySegments(2, 0, false)).toEqual(["Searched 2 queries"]);
      expect(summarySegments(10, 0, false)).toEqual(["Searched 10 queries"]);
    });

    it("should format single read source", () => {
      expect(summarySegments(0, 1, false)).toEqual(["Read 1 source"]);
    });

    it("should format multiple read sources", () => {
      expect(summarySegments(0, 2, false)).toEqual(["Read 2 sources"]);
      expect(summarySegments(0, 5, false)).toEqual(["Read 5 sources"]);
    });

    it("should format workspace when true", () => {
      expect(summarySegments(0, 0, true)).toEqual(["Workspace"]);
    });

    it("should combine searches and reads", () => {
      expect(summarySegments(1, 1, false)).toEqual(["Searched 1 query", "Read 1 source"]);
      expect(summarySegments(3, 2, false)).toEqual(["Searched 3 queries", "Read 2 sources"]);
    });

    it("should combine searches and workspace", () => {
      expect(summarySegments(1, 0, true)).toEqual(["Searched 1 query", "Workspace"]);
    });

    it("should combine reads and workspace", () => {
      expect(summarySegments(0, 1, true)).toEqual(["Read 1 source", "Workspace"]);
    });

    it("should combine all three segments", () => {
      expect(summarySegments(2, 3, true)).toEqual([
        "Searched 2 queries",
        "Read 3 sources",
        "Workspace",
      ]);
    });

    it("should maintain segment order: searches, reads, workspace", () => {
      const result = summarySegments(5, 10, true);
      expect(result[0]).toContain("Searched");
      expect(result[1]).toContain("Read");
      expect(result[2]).toContain("Workspace");
    });

    it("should handle large numbers", () => {
      expect(summarySegments(100, 500, false)).toEqual([
        "Searched 100 queries",
        "Read 500 sources",
      ]);
    });

    it("should use correct pluralization", () => {
      // Single
      const single = summarySegments(1, 1, false);
      expect(single[0]).toBe("Searched 1 query");
      expect(single[1]).toBe("Read 1 source");

      // Multiple
      const multiple = summarySegments(2, 2, false);
      expect(multiple[0]).toBe("Searched 2 queries");
      expect(multiple[1]).toBe("Read 2 sources");
    });

    it("should handle zero-indexed but non-zero workspace", () => {
      // Even though workspace is boolean, it should still format correctly
      expect(summarySegments(0, 0, true)).toEqual(["Workspace"]);
      expect(summarySegments(0, 0, false)).toEqual([]);
    });
  });

  describe("ResearchActivityLine", () => {
    it("should return null when statuses array is empty", () => {
      const result = ResearchActivityLine({ statuses: [] });
      expect(result).toBeNull();
    });

    it("should render a div when statuses exist", () => {
      const statuses = [
        { phase: "plan" as const, label: "Planning..." },
        { phase: "search" as const, label: "Searching web..." },
      ];
      const result = ResearchActivityLine({ statuses });
      expect(result?.type).toBe("div");
      expect(result?.props).toBeDefined();
      expect(result?.props.className).toBe("fade-up");
    });

    it("should display the latest (last) status label in a span", () => {
      const statuses = [
        { phase: "plan" as const, label: "Planning..." },
        { phase: "search" as const, label: "Searching web..." },
        { phase: "read" as const, label: "Reading sources..." },
      ];
      const result = ResearchActivityLine({ statuses });
      expect(result?.type).toBe("div");
      // The latest status is the last one in the array
      const children = Array.isArray(result?.props.children)
        ? result.props.children
        : [result?.props.children];
      const labelSpan = children.find(
        (child: any) => child?.type === "span" && child?.props?.children === "Reading sources...",
      );
      expect(labelSpan).toBeDefined();
    });

    it("should render completed phases as summary segments", () => {
      const statuses = [
        { phase: "plan" as const, label: "Planning..." },
        { phase: "search" as const, label: "Searching web..." },
        { phase: "read" as const, label: "Reading sources..." },
      ];
      const result = ResearchActivityLine({ statuses });
      expect(result?.type).toBe("div");
      // plan and search are completed (not read which is current)
      // Should show summary of completed work
      const children = Array.isArray(result?.props.children)
        ? result.props.children
        : [result?.props.children];
      const summarySpan = children.find(
        (child: any) => child?.type === "span" && child?.props?.className?.includes("mono-label"),
      );
      expect(summarySpan).toBeDefined();
      expect(summarySpan?.props.children).toContain("Searched 1 query");
    });

    it("should include a spinner element for active research", () => {
      const statuses = [{ phase: "search" as const, label: "Searching..." }];
      const result = ResearchActivityLine({ statuses });
      expect(result?.type).toBe("div");
      // Check for spinner className in children
      const children = Array.isArray(result?.props.children)
        ? result.props.children
        : [result?.props.children];
      const spinner = children.find((child: any) => child?.props?.className === "spinner");
      expect(spinner).toBeDefined();
    });
  });

  describe("ResearchSummaryRow", () => {
    it("should return null when research mode is 'chat'", () => {
      const meta: ChatMeta = {
        research: { mode: "chat", sub_queries: [] },
        sources: [],
        workspace_chunks: 0,
      };
      const result = ResearchSummaryRow({ meta });
      expect(result).toBeNull();
    });

    it("should return null when research is null", () => {
      const meta: ChatMeta = {
        research: null,
        sources: [],
        workspace_chunks: 0,
      };
      const result = ResearchSummaryRow({ meta });
      expect(result).toBeNull();
    });

    it("should render chips when research mode is 'internal'", () => {
      const meta: ChatMeta = {
        research: { mode: "internal", sub_queries: ["query1"] },
        sources: [],
        workspace_chunks: 2,
      };
      const result = ResearchSummaryRow({ meta });
      expect(result?.type).toBe("div");
    });

    it("should render chips when research mode is 'both'", () => {
      const meta: ChatMeta = {
        research: { mode: "both", sub_queries: [] },
        sources: [{ kind: "web", title: "Source", url: "http://example.com" }],
        workspace_chunks: 0,
      };
      const result = ResearchSummaryRow({ meta });
      expect(result?.type).toBe("div");
    });

    it("should detect workspace usage via workspace_chunks", () => {
      const meta: ChatMeta = {
        research: { mode: "web", sub_queries: ["q1", "q2"] },
        sources: [],
        workspace_chunks: 5,
      };
      const result = ResearchSummaryRow({ meta });
      expect(result?.type).toBe("div");
    });

    it("should detect workspace usage via non-web sources", () => {
      const meta: ChatMeta = {
        research: { mode: "web", sub_queries: [] },
        sources: [
          {
            kind: "internal" as const,
            title: "Internal doc",
            url: "internal://doc",
          },
        ],
        workspace_chunks: 0,
      };
      const result = ResearchSummaryRow({ meta });
      expect(result?.type).toBe("div");
    });

    it("should render when there is at least one web source", () => {
      const meta: ChatMeta = {
        research: { mode: "web", sub_queries: [] },
        sources: [{ kind: "web", title: "Source", url: "http://example.com" }],
        workspace_chunks: 0,
      };
      const result = ResearchSummaryRow({ meta });
      // One web source → "Read 1 source" segment → should render
      expect(result?.type).toBe("div");
      expect(result?.props).toBeDefined();
    });

    it("should return null when truly no research activity to report", () => {
      const meta: ChatMeta = {
        research: { mode: "web", sub_queries: [] },
        sources: [],
        workspace_chunks: 0,
      };
      const result = ResearchSummaryRow({ meta });
      // No sources, no queries, no workspace → no segments → return null
      expect(result).toBeNull();
    });

    it("should render chips with correct structure for research activity", () => {
      const meta: ChatMeta = {
        research: { mode: "web", sub_queries: ["query1", "query2"] },
        sources: [{ kind: "web", title: "Source", url: "http://example.com" }],
        workspace_chunks: 0,
      };
      const result = ResearchSummaryRow({ meta });
      expect(result?.type).toBe("div");
      expect(result?.props.className).toContain("flex");
      // Should have children that are span chips
      const children = Array.isArray(result?.props.children)
        ? result?.props.children
        : [result?.props.children];
      expect(children.length).toBeGreaterThan(0);
      const firstChip = children[0];
      expect(firstChip?.type).toBe("span");
      expect(firstChip?.props.className).toContain("inline-flex");
      expect(firstChip?.props.className).toContain("rounded-full");
    });

    it("should render correct text content in chips", () => {
      const meta: ChatMeta = {
        research: { mode: "web", sub_queries: ["q1"] },
        sources: [
          { kind: "web", title: "Source 1", url: "http://example.com" },
          { kind: "web", title: "Source 2", url: "http://example.com" },
        ],
        workspace_chunks: 3,
      };
      const result = ResearchSummaryRow({ meta });
      const children = Array.isArray(result?.props.children)
        ? result?.props.children
        : [result?.props.children];
      const chipTexts = children.map((chip: any) => chip?.props?.children);
      expect(chipTexts).toContain("Searched 1 query");
      expect(chipTexts).toContain("Read 2 sources");
      expect(chipTexts).toContain("Workspace");
    });
  });
});
