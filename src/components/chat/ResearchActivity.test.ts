import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import React from "react";
import {
  parseResearchStatus,
  summarySegments,
  ResearchActivityLine,
  ResearchSummaryRow,
} from "./ResearchActivity";
import type { ChatMeta } from "@/lib/chat-meta";
import { ShimmerText } from "@/components/supaprod/ShimmerText";

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
        (child: unknown) =>
          child?.type === ShimmerText && child?.props?.children === "Reading sources...",
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
        (child: unknown) =>
          child?.type === "span" && child?.props?.className?.includes("mono-label"),
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
      const spinner = children.find((child: unknown) => child?.props?.className === "spinner");
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
      const chipTexts = children.map((chip: unknown) => chip?.props?.children);
      expect(chipTexts).toContain("Searched 1 query");
      expect(chipTexts).toContain("Read 2 sources");
      expect(chipTexts).toContain("Workspace");
    });

    it("should return null for mode='chat' even with sources and workspace_chunks present", () => {
      const meta: ChatMeta = {
        research: { mode: "chat", sub_queries: [] },
        sources: [{ kind: "web", title: "Source", url: "http://example.com" }],
        workspace_chunks: 5,
      };
      const result = ResearchSummaryRow({ meta });
      // chat mode short-circuits before segments are computed, regardless of sources/chunks
      expect(result).toBeNull();
    });

    it("should count only web-kind sources for the Read segment, excluding others", () => {
      const meta: ChatMeta = {
        research: { mode: "web", sub_queries: [] },
        sources: [
          { kind: "web", title: "Web 1", url: "http://example.com" },
          { kind: "web", title: "Web 2", url: "http://example.com" },
          { kind: "doc", title: "Doc", href: "/docs/1" },
        ],
        workspace_chunks: 0,
      };
      const result = ResearchSummaryRow({ meta });
      const children = Array.isArray(result?.props.children)
        ? result?.props.children
        : [result?.props.children];
      const chipTexts = children.map((chip: unknown) => chip?.props?.children);
      expect(chipTexts).toContain("Read 2 sources");
    });

    it("should render chips with the full expected class list (inline-flex, items-center, rounded-full, border, hairline)", () => {
      const meta: ChatMeta = {
        research: { mode: "web", sub_queries: ["q1"] },
        sources: [{ kind: "web", title: "Source", url: "http://example.com" }],
        workspace_chunks: 0,
      };
      const result = ResearchSummaryRow({ meta });
      const children = Array.isArray(result?.props.children)
        ? result?.props.children
        : [result?.props.children];
      const firstChip = children[0];
      expect(firstChip?.props.className).toContain("inline-flex");
      expect(firstChip?.props.className).toContain("items-center");
      expect(firstChip?.props.className).toContain("rounded-full");
      expect(firstChip?.props.className).toContain("border");
      expect(firstChip?.props.className).toContain("hairline");
    });

    it("should apply mono-font uppercase typography styles to chips", () => {
      const meta: ChatMeta = {
        research: { mode: "web", sub_queries: ["q1"] },
        sources: [],
        workspace_chunks: 0,
      };
      const result = ResearchSummaryRow({ meta });
      const children = Array.isArray(result?.props.children)
        ? result?.props.children
        : [result?.props.children];
      const firstChip = children[0];
      expect(firstChip?.props.style.fontFamily).toBe("var(--mrd-mono)");
      expect(firstChip?.props.style.letterSpacing).toBe("0.06em");
      expect(firstChip?.props.style.textTransform).toBe("uppercase");
    });

    it("should render the searched-queries chip when sources is empty but sub_queries is not", () => {
      const meta: ChatMeta = {
        research: { mode: "web", sub_queries: ["q1", "q2"] },
        sources: [],
        workspace_chunks: 0,
      };
      const result = ResearchSummaryRow({ meta });
      expect(result?.type).toBe("div");
      const children = Array.isArray(result?.props.children)
        ? result?.props.children
        : [result?.props.children];
      expect(
        children.some((chip: unknown) => chip?.props?.children?.includes?.("Searched 2 queries")),
      ).toBe(true);
    });

    it("should render the outer wrapper with the full expected flex-layout class list", () => {
      const meta: ChatMeta = {
        research: { mode: "web", sub_queries: ["q1"] },
        sources: [],
        workspace_chunks: 0,
      };
      const result = ResearchSummaryRow({ meta });
      expect(result?.props.className).toContain("flex");
      expect(result?.props.className).toContain("flex-wrap");
      expect(result?.props.className).toContain("items-center");
      expect(result?.props.className).toContain("gap-1.5");
    });
  });

  // ---------------------------------------------------------------------------
  // ResearchSummaryRow — workspace flag matrix
  // The workspace boolean is derived from 4 independent OR conditions:
  //   research.mode === "internal" ||
  //   research.mode === "both"     ||
  //   meta.workspace_chunks > 0   ||
  //   meta.sources.some(s => s.kind !== "web")
  // Each condition is tested individually, then combinations and boundaries.
  // ---------------------------------------------------------------------------
  describe("ResearchSummaryRow workspace flag", () => {
    // Helper: build a minimal ChatMeta with overridable fields.
    // sub_queries is kept non-empty so there is always a "Searched" segment
    // even when the workspace flag is false — that ensures render doesn't return
    // null prematurely and lets us inspect whether "Workspace" appears.
    function makeMeta(
      overrides: {
        mode?: "chat" | "web" | "internal" | "both";
        sub_queries?: string[];
        sources?: Array<{
          n?: number;
          kind:
            | "web"
            | "signal"
            | "prd"
            | "doc"
            | "meeting"
            | "opportunity"
            | "roadmap"
            | "decision"
            | "mission"
            | "finding";
          title: string;
          url?: string;
          href?: string;
        }>;
        workspace_chunks?: number;
      } = {},
    ): unknown {
      return {
        model: "claude-3-haiku",
        via: "gateway",
        latency_ms: 0,
        tokens_in: 0,
        tokens_out: 0,
        cost_usd: 0,
        web_used: false,
        sources: overrides.sources ?? [],
        workspace_chunks: overrides.workspace_chunks ?? 0,
        research: {
          mode: overrides.mode ?? "web",
          sub_queries: overrides.sub_queries ?? ["q1"],
        },
      };
    }

    function chipTextsOf(result: unknown): string[] {
      if (!result) return [];
      const children = Array.isArray(result.props.children)
        ? result.props.children
        : [result.props.children];
      return children.map((c: unknown) => c?.props?.children as string);
    }

    // --- Condition 1: research.mode === "internal" ---
    it("should set workspace=true when mode is 'internal'", () => {
      const result = ResearchSummaryRow({ meta: makeMeta({ mode: "internal" }) });
      expect(chipTextsOf(result)).toContain("Workspace");
    });

    // --- Condition 2: research.mode === "both" ---
    it("should set workspace=true when mode is 'both'", () => {
      const result = ResearchSummaryRow({ meta: makeMeta({ mode: "both" }) });
      expect(chipTextsOf(result)).toContain("Workspace");
    });

    // --- Condition 3: meta.workspace_chunks > 0 ---
    it("should set workspace=true when workspace_chunks > 0", () => {
      const result = ResearchSummaryRow({
        meta: makeMeta({ mode: "web", workspace_chunks: 1 }),
      });
      expect(chipTextsOf(result)).toContain("Workspace");
    });

    it("should set workspace=false when workspace_chunks === 0 (boundary)", () => {
      // mode=web, no non-web sources, chunks=0 — workspace must be absent
      const result = ResearchSummaryRow({
        meta: makeMeta({ mode: "web", workspace_chunks: 0 }),
      });
      expect(chipTextsOf(result)).not.toContain("Workspace");
    });

    it("should set workspace=true for workspace_chunks=5 (non-trivial positive)", () => {
      const result = ResearchSummaryRow({
        meta: makeMeta({ mode: "web", workspace_chunks: 5 }),
      });
      expect(chipTextsOf(result)).toContain("Workspace");
    });

    // --- Condition 4: meta.sources.some(s => s.kind !== "web") ---
    it("should set workspace=true when at least one source has kind !== 'web'", () => {
      const result = ResearchSummaryRow({
        meta: makeMeta({
          mode: "web",
          workspace_chunks: 0,
          sources: [{ kind: "doc", title: "Internal doc", href: "/docs/1" }],
        }),
      });
      expect(chipTextsOf(result)).toContain("Workspace");
    });

    it("should set workspace=false when all sources have kind === 'web'", () => {
      const result = ResearchSummaryRow({
        meta: makeMeta({
          mode: "web",
          workspace_chunks: 0,
          sources: [
            { kind: "web", title: "Page A", url: "https://a.com" },
            { kind: "web", title: "Page B", url: "https://b.com" },
          ],
        }),
      });
      expect(chipTextsOf(result)).not.toContain("Workspace");
    });

    it("should set workspace=true when sources array contains a mix of web and non-web", () => {
      const result = ResearchSummaryRow({
        meta: makeMeta({
          mode: "web",
          workspace_chunks: 0,
          sources: [
            { kind: "web", title: "Web page", url: "https://example.com" },
            { kind: "prd", title: "PRD doc", href: "/prds/123" },
          ],
        }),
      });
      expect(chipTextsOf(result)).toContain("Workspace");
    });

    it("should set workspace=false for an empty sources array (no non-web sources)", () => {
      const result = ResearchSummaryRow({
        meta: makeMeta({ mode: "web", workspace_chunks: 0, sources: [] }),
      });
      expect(chipTextsOf(result)).not.toContain("Workspace");
    });

    // --- Boundary: mode="chat" is excluded upstream ---
    it("should return null for mode='chat' (no research rendered at all)", () => {
      const result = ResearchSummaryRow({ meta: makeMeta({ mode: "chat" }) });
      expect(result).toBeNull();
    });

    it("should set workspace=false for mode='web' with no other triggers", () => {
      const result = ResearchSummaryRow({
        meta: makeMeta({ mode: "web", workspace_chunks: 0, sources: [] }),
      });
      expect(chipTextsOf(result)).not.toContain("Workspace");
    });

    // --- Combinations: multiple conditions true simultaneously ---
    it("should set workspace=true when mode='internal' AND workspace_chunks > 0", () => {
      const result = ResearchSummaryRow({
        meta: makeMeta({ mode: "internal", workspace_chunks: 3 }),
      });
      expect(chipTextsOf(result)).toContain("Workspace");
    });

    it("should set workspace=true when mode='both' AND non-web sources present", () => {
      const result = ResearchSummaryRow({
        meta: makeMeta({
          mode: "both",
          workspace_chunks: 0,
          sources: [{ kind: "signal", title: "What we found", href: "/signals/1" }],
        }),
      });
      expect(chipTextsOf(result)).toContain("Workspace");
    });

    it("should set workspace=true when all four conditions are true simultaneously", () => {
      const result = ResearchSummaryRow({
        meta: makeMeta({
          mode: "internal",
          workspace_chunks: 2,
          sources: [{ kind: "decision", title: "Decision doc", href: "/decisions/1" }],
        }),
      });
      expect(chipTextsOf(result)).toContain("Workspace");
    });

    // --- Non-web source kinds each independently trigger workspace ---
    it("should set workspace=true for kind='signal'", () => {
      const result = ResearchSummaryRow({
        meta: makeMeta({
          mode: "web",
          workspace_chunks: 0,
          sources: [{ kind: "signal", title: "What we found", href: "/signals/1" }],
        }),
      });
      expect(chipTextsOf(result)).toContain("Workspace");
    });

    it("should set workspace=true for kind='meeting'", () => {
      const result = ResearchSummaryRow({
        meta: makeMeta({
          mode: "web",
          workspace_chunks: 0,
          sources: [{ kind: "meeting", title: "Meeting notes", href: "/meetings/1" }],
        }),
      });
      expect(chipTextsOf(result)).toContain("Workspace");
    });

    it("should set workspace=true for kind='prd'", () => {
      const result = ResearchSummaryRow({
        meta: makeMeta({
          mode: "web",
          workspace_chunks: 0,
          sources: [{ kind: "prd", title: "Product Requirement", href: "/prds/1" }],
        }),
      });
      expect(chipTextsOf(result)).toContain("Workspace");
    });
  });

  // ---------------------------------------------------------------------------
  // ResearchActivityLine — component structure
  // Tests cover: null guard, single/multiple statuses, latest label, done phases,
  // segment join separator, no-trail case, plural/singular trail, ellipsis style.
  // ---------------------------------------------------------------------------
  describe("ResearchActivityLine extended", () => {
    it("should return null for an empty statuses array", () => {
      expect(ResearchActivityLine({ statuses: [] })).toBeNull();
    });

    it("should render when given a single status", () => {
      const result = ResearchActivityLine({
        statuses: [{ phase: "plan", label: "Planning..." }],
      });
      expect(result).not.toBeNull();
      expect(result?.type).toBe("div");
    });

    it("should show the single status label when there is only one status", () => {
      const result = ResearchActivityLine({
        statuses: [{ phase: "search", label: "Searching the web" }],
      });
      const children = Array.isArray(result?.props.children)
        ? result?.props.children
        : [result?.props.children];
      const labelSpan = children.find(
        (c: unknown) => c?.type === ShimmerText && c?.props?.children === "Searching the web",
      );
      expect(labelSpan).toBeDefined();
    });

    it("should not render a trail span when there is only one status (done is empty)", () => {
      // With a single status, done=[] → segments.length===0 → no trail span
      const result = ResearchActivityLine({
        statuses: [{ phase: "read", label: "Reading..." }],
      });
      const children = Array.isArray(result?.props.children)
        ? result?.props.children
        : [result?.props.children];
      const trailSpan = children.find(
        (c: unknown) => c?.type === "span" && c?.props?.className?.includes("mono-label"),
      );
      expect(trailSpan).toBeUndefined();
    });

    it("should use the last status as the latest label", () => {
      const statuses = [
        { phase: "plan" as const, label: "Planning..." },
        { phase: "search" as const, label: "Searching..." },
        { phase: "synthesize" as const, label: "Synthesizing answer" },
      ];
      const result = ResearchActivityLine({ statuses });
      const children = Array.isArray(result?.props.children)
        ? result?.props.children
        : [result?.props.children];
      const labelSpan = children.find(
        (c: unknown) => c?.type === ShimmerText && c?.props?.children === "Synthesizing answer",
      );
      expect(labelSpan).toBeDefined();
    });

    it("should count only search phases in done when building the trail", () => {
      // done contains 2 search and 1 plan — plan is not counted, so trail shows "Searched 2 queries"
      const statuses = [
        { phase: "plan" as const, label: "Planning..." },
        { phase: "search" as const, label: "Searching 1..." },
        { phase: "search" as const, label: "Searching 2..." },
        { phase: "synthesize" as const, label: "Synthesizing" },
      ];
      const result = ResearchActivityLine({ statuses });
      const children = Array.isArray(result?.props.children)
        ? result?.props.children
        : [result?.props.children];
      const trailSpan = children.find(
        (c: unknown) => c?.type === "span" && c?.props?.className?.includes("mono-label"),
      );
      expect(trailSpan?.props?.children).toContain("Searched 2 queries");
    });

    it("should count only read phases in done when building the trail", () => {
      const statuses = [
        { phase: "read" as const, label: "Reading 1..." },
        { phase: "read" as const, label: "Reading 2..." },
        { phase: "read" as const, label: "Reading 3..." },
        { phase: "synthesize" as const, label: "Synthesizing" },
      ];
      const result = ResearchActivityLine({ statuses });
      const children = Array.isArray(result?.props.children)
        ? result?.props.children
        : [result?.props.children];
      const trailSpan = children.find(
        (c: unknown) => c?.type === "span" && c?.props?.className?.includes("mono-label"),
      );
      expect(trailSpan?.props?.children).toContain("Read 3 sources");
    });

    it("should detect workspace phase in done and include 'Workspace' in trail", () => {
      const statuses = [
        { phase: "workspace" as const, label: "Grounding in workspace..." },
        { phase: "synthesize" as const, label: "Synthesizing" },
      ];
      const result = ResearchActivityLine({ statuses });
      const children = Array.isArray(result?.props.children)
        ? result?.props.children
        : [result?.props.children];
      const trailSpan = children.find(
        (c: unknown) => c?.type === "span" && c?.props?.className?.includes("mono-label"),
      );
      expect(trailSpan?.props?.children).toContain("Workspace");
    });

    it("should not render trail when done has 0 search, 0 read, no workspace", () => {
      // Only plan in done — contributes no segments
      const statuses = [
        { phase: "plan" as const, label: "Planning..." },
        { phase: "synthesize" as const, label: "Synthesizing" },
      ];
      const result = ResearchActivityLine({ statuses });
      const children = Array.isArray(result?.props.children)
        ? result?.props.children
        : [result?.props.children];
      const trailSpan = children.find(
        (c: unknown) => c?.type === "span" && c?.props?.className?.includes("mono-label"),
      );
      expect(trailSpan).toBeUndefined();
    });

    it("should join trail segments with ' · ' separator", () => {
      const statuses = [
        { phase: "search" as const, label: "Searching..." },
        { phase: "read" as const, label: "Reading..." },
        { phase: "workspace" as const, label: "Grounding..." },
        { phase: "synthesize" as const, label: "Synthesizing" },
      ];
      const result = ResearchActivityLine({ statuses });
      const children = Array.isArray(result?.props.children)
        ? result?.props.children
        : [result?.props.children];
      const trailSpan = children.find(
        (c: unknown) => c?.type === "span" && c?.props?.className?.includes("mono-label"),
      );
      const trail: string = trailSpan?.props?.children ?? "";
      expect(trail).toContain(" · ");
    });

    it("should include all three segment types in the trail when all phases are done", () => {
      const statuses = [
        { phase: "search" as const, label: "Searching..." },
        { phase: "read" as const, label: "Reading..." },
        { phase: "workspace" as const, label: "Grounding..." },
        { phase: "synthesize" as const, label: "Synthesizing" },
      ];
      const result = ResearchActivityLine({ statuses });
      const children = Array.isArray(result?.props.children)
        ? result?.props.children
        : [result?.props.children];
      const trailSpan = children.find(
        (c: unknown) => c?.type === "span" && c?.props?.className?.includes("mono-label"),
      );
      const trail: string = trailSpan?.props?.children ?? "";
      expect(trail).toContain("Searched 1 query");
      expect(trail).toContain("Read 1 source");
      expect(trail).toContain("Workspace");
    });

    it("should apply ellipsis styles to the label span", () => {
      const result = ResearchActivityLine({
        statuses: [{ phase: "search", label: "A very long label that could overflow" }],
      });
      const children = Array.isArray(result?.props.children)
        ? result?.props.children
        : [result?.props.children];
      const labelSpan = children.find(
        (c: unknown) =>
          c?.type === ShimmerText && c?.props?.children === "A very long label that could overflow",
      );
      expect(labelSpan?.props?.style?.maxWidth).toBe(420);
      expect(labelSpan?.props?.style?.overflow).toBe("hidden");
      expect(labelSpan?.props?.style?.textOverflow).toBe("ellipsis");
    });

    it("should render singular 'query' and 'source' in the trail for counts of 1", () => {
      const statuses = [
        { phase: "search" as const, label: "Searching..." },
        { phase: "read" as const, label: "Reading..." },
        { phase: "synthesize" as const, label: "Synthesizing" },
      ];
      const result = ResearchActivityLine({ statuses });
      const children = Array.isArray(result?.props.children)
        ? result?.props.children
        : [result?.props.children];
      const trailSpan = children.find(
        (c: unknown) => c?.type === "span" && c?.props?.className?.includes("mono-label"),
      );
      const trail: string = trailSpan?.props?.children ?? "";
      expect(trail).toContain("Searched 1 query");
      expect(trail).toContain("Read 1 source");
    });

    it("should render plural 'queries' and 'sources' in the trail for counts > 1", () => {
      const statuses = [
        { phase: "search" as const, label: "Search 1" },
        { phase: "search" as const, label: "Search 2" },
        { phase: "read" as const, label: "Read 1" },
        { phase: "read" as const, label: "Read 2" },
        { phase: "synthesize" as const, label: "Synthesizing" },
      ];
      const result = ResearchActivityLine({ statuses });
      const children = Array.isArray(result?.props.children)
        ? result?.props.children
        : [result?.props.children];
      const trailSpan = children.find(
        (c: unknown) => c?.type === "span" && c?.props?.className?.includes("mono-label"),
      );
      const trail: string = trailSpan?.props?.children ?? "";
      expect(trail).toContain("Searched 2 queries");
      expect(trail).toContain("Read 2 sources");
    });

    it("should always include a spinner span", () => {
      const result = ResearchActivityLine({
        statuses: [{ phase: "plan", label: "Planning" }],
      });
      const children = Array.isArray(result?.props.children)
        ? result?.props.children
        : [result?.props.children];
      const spinner = children.find((c: unknown) => c?.props?.className === "spinner");
      expect(spinner).toBeDefined();
    });

    it("should accumulate 3 completed search phases into 'Searched 3 queries'", () => {
      const statuses = [
        { phase: "search" as const, label: "Searching #1..." },
        { phase: "search" as const, label: "Searching #2..." },
        { phase: "search" as const, label: "Searching #3..." },
        { phase: "read" as const, label: "Reading..." },
      ];
      const result = ResearchActivityLine({ statuses });
      const children = Array.isArray(result?.props.children)
        ? result?.props.children
        : [result?.props.children];
      const trailSpan = children.find(
        (c: unknown) => c?.type === "span" && c?.props?.className?.includes("mono-label"),
      );
      expect(trailSpan?.props?.children).toContain("Searched 3 queries");
    });

    it("should count both search and read phases together when both are done (no workspace)", () => {
      const statuses = [
        { phase: "search" as const, label: "Searching..." },
        { phase: "read" as const, label: "Reading #1..." },
        { phase: "read" as const, label: "Reading #2..." },
        { phase: "synthesize" as const, label: "Synthesizing..." },
      ];
      const result = ResearchActivityLine({ statuses });
      const children = Array.isArray(result?.props.children)
        ? result?.props.children
        : [result?.props.children];
      const trailSpan = children.find(
        (c: unknown) => c?.type === "span" && c?.props?.className?.includes("mono-label"),
      );
      expect(trailSpan?.props?.children).toContain("Searched 1 query");
      expect(trailSpan?.props?.children).toContain("Read 2 sources");
    });
  });

  // ---------------------------------------------------------------------------
  // summarySegments — additional edge-case branches
  // ---------------------------------------------------------------------------
  describe("summarySegments additional edge cases", () => {
    it("should produce no search segment when searched === 0", () => {
      const segs = summarySegments(0, 2, false);
      expect(segs.some((s) => s.includes("Searched"))).toBe(false);
    });

    it("should produce no read segment when read === 0", () => {
      const segs = summarySegments(2, 0, false);
      expect(segs.some((s) => s.includes("Read"))).toBe(false);
    });

    it("should produce no workspace segment when workspace === false", () => {
      const segs = summarySegments(1, 1, false);
      expect(segs).not.toContain("Workspace");
    });

    it("should return exactly 3 segments when searched>0, read>0, workspace=true", () => {
      expect(summarySegments(3, 4, true)).toHaveLength(3);
    });

    it("should return exactly 1 segment when only searched > 0", () => {
      expect(summarySegments(1, 0, false)).toHaveLength(1);
    });

    it("should return exactly 1 segment when only read > 0", () => {
      expect(summarySegments(0, 1, false)).toHaveLength(1);
    });

    it("should return exactly 1 segment when only workspace is true", () => {
      expect(summarySegments(0, 0, true)).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------------------
  // parseResearchStatus — additional edge cases
  // ---------------------------------------------------------------------------
  describe("parseResearchStatus additional edge cases", () => {
    it("should return null for an invalid (unknown) phase string", () => {
      expect(parseResearchStatus({ phase: "scrape", label: "Scraping" })).toBeNull();
    });

    it("should return null when label is a number instead of string", () => {
      expect(parseResearchStatus({ phase: "search", label: 42 })).toBeNull();
    });

    it("should return null when label is a boolean instead of string", () => {
      expect(parseResearchStatus({ phase: "read", label: true })).toBeNull();
    });

    it("should return null when phase is present but label is missing entirely", () => {
      expect(parseResearchStatus({ phase: "plan" })).toBeNull();
    });

    it("should return null when label is present but phase is missing entirely", () => {
      expect(parseResearchStatus({ label: "Planning..." })).toBeNull();
    });

    it("should return only phase and label, ignoring extra fields on the object", () => {
      const result = parseResearchStatus({
        phase: "synthesize",
        label: "Synthesizing answer",
        extra: "ignored",
        timestamp: 12345,
        nested: { foo: "bar" },
      });
      expect(result).not.toBeNull();
      expect(result?.phase).toBe("synthesize");
      expect(result?.label).toBe("Synthesizing answer");
      // The returned object must not carry extra fields
      expect((result as Record<string, unknown>)?.extra).toBeUndefined();
      expect((result as Record<string, unknown>)?.timestamp).toBeUndefined();
    });

    it("should return null for an array input", () => {
      expect(parseResearchStatus(["plan", "Searching"])).toBeNull();
    });

    it("should return null for an empty object", () => {
      expect(parseResearchStatus({})).toBeNull();
    });

    it("should return null when phase is a valid string but wrong case ('Search' vs 'search')", () => {
      expect(parseResearchStatus({ phase: "Search", label: "Searching" })).toBeNull();
      expect(parseResearchStatus({ phase: "PLAN", label: "Planning" })).toBeNull();
    });

    it("should parse 'workspace' phase with an empty label string", () => {
      const result = parseResearchStatus({ phase: "workspace", label: "" });
      expect(result).not.toBeNull();
      expect(result?.phase).toBe("workspace");
      expect(result?.label).toBe("");
    });
  });

  describe("ResearchActivityLine (DOM rendering)", () => {
    it("renders spinner and status label when statuses exist", () => {
      const statuses = [{ phase: "search" as const, label: "Searching documents..." }];
      render(React.createElement(ResearchActivityLine, { statuses }));
      expect(screen.getByText("Searching documents...")).toBeTruthy();
      const spinner = document.querySelector(".spinner");
      expect(spinner).toBeTruthy();
    });

    it("renders status label with correct text content", () => {
      const statuses = [
        { phase: "plan" as const, label: "Planning..." },
        { phase: "read" as const, label: "Reading sources..." },
      ];
      render(React.createElement(ResearchActivityLine, { statuses }));
      expect(screen.getByText("Reading sources...")).toBeTruthy();
      expect(screen.queryByText("Planning...")).toBeNull();
    });

    it("renders summary segments joined by ' · ' separator", () => {
      const statuses = [
        { phase: "search" as const, label: "Searching..." },
        { phase: "search" as const, label: "Searching..." },
        { phase: "read" as const, label: "Reading..." },
        { phase: "read" as const, label: "Reading..." },
        { phase: "read" as const, label: "Reading..." },
        { phase: "synthesize" as const, label: "Synthesizing..." },
      ];
      render(React.createElement(ResearchActivityLine, { statuses }));
      expect(screen.getByText(/Searched 2 queries · Read 3 sources/)).toBeTruthy();
    });

    it("renders gap between spinner and status label", () => {
      const statuses = [{ phase: "search" as const, label: "Searching..." }];
      render(React.createElement(ResearchActivityLine, { statuses }));
      const container = screen.getByText("Searching...").parentElement;
      expect(container?.style.columnGap).toBe("8px");
    });

    it("renders no summary segment when no phases completed", () => {
      const statuses = [{ phase: "plan" as const, label: "Planning..." }];
      render(React.createElement(ResearchActivityLine, { statuses }));
      expect(screen.getByText("Planning...")).toBeTruthy();
      expect(screen.queryByText(/Searched|Read|Workspace/)).toBeNull();
    });
  });

  describe("ResearchSummaryRow (DOM rendering)", () => {
    it("renders research chips when research data exists", () => {
      const meta: ChatMeta = {
        research: { mode: "web", sub_queries: ["q1", "q2"] },
        sources: [
          { n: 1, title: "Source 1", kind: "web" },
          { n: 2, title: "Source 2", kind: "web" },
        ],
        workspace_chunks: 0,
      };
      render(React.createElement(ResearchSummaryRow, { meta }));
      expect(screen.getByText(/Searched 2 queries/)).toBeTruthy();
      expect(screen.getByText(/Read 2 sources/)).toBeTruthy();
    });

    it("renders workspace indicator chip when workspace chunks > 0", () => {
      const meta: ChatMeta = {
        research: { mode: "both", sub_queries: [] },
        sources: [],
        workspace_chunks: 3,
      };
      render(React.createElement(ResearchSummaryRow, { meta }));
      expect(screen.getByText("Workspace")).toBeTruthy();
    });

    it("renders chips with uppercase labels and mono font", () => {
      const meta: ChatMeta = {
        research: { mode: "internal", sub_queries: [] },
        sources: [],
        workspace_chunks: 0,
      };
      render(React.createElement(ResearchSummaryRow, { meta }));
      const chips = document.querySelectorAll('[style*="mrd-mono"], [class*="mono"]');
      expect(chips.length).toBeGreaterThan(0);
    });

    it("renders nothing when research mode is 'chat'", () => {
      const meta: ChatMeta = {
        research: { mode: "chat", sub_queries: [] },
        sources: [],
        workspace_chunks: 0,
      };
      render(React.createElement(ResearchSummaryRow, { meta }));
      const rendered = screen.queryByText(/Searched|Read|Workspace/);
      expect(rendered).toBeNull();
    });

    it("renders flex row with gap spacing", () => {
      const meta: ChatMeta = {
        research: { mode: "web", sub_queries: ["q1"] },
        sources: [{ n: 1, title: "S1", kind: "web" }],
        workspace_chunks: 0,
      };
      render(React.createElement(ResearchSummaryRow, { meta }));
      const container = screen.getByText(/Searched 1 query/).closest(".flex");
      expect(container?.className).toContain("gap");
    });
  });
});
