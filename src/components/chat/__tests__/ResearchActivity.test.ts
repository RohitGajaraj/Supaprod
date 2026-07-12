import { describe, expect, test } from "bun:test";
import {
  parseResearchStatus,
  summarySegments,
  ResearchActivityLine,
  ResearchSummaryRow,
  type ResearchStatus,
  type ResearchPhase,
} from "../ResearchActivity";
import type { ChatMeta } from "../MessageMeta";

// ─────────────────────────────────────────────────────────────────────────────
// parseResearchStatus - Tolerant parser for SSE protocol
// ─────────────────────────────────────────────────────────────────────────────
describe("parseResearchStatus", () => {
  test("parses valid status object", () => {
    const input = { phase: "search", label: "Searching for answers..." };
    const result = parseResearchStatus(input);
    expect(result).toEqual({ phase: "search", label: "Searching for answers..." });
  });

  test("returns null for null input", () => {
    expect(parseResearchStatus(null)).toBe(null);
  });

  test("returns null for undefined input", () => {
    expect(parseResearchStatus(undefined)).toBe(null);
  });

  test("returns null for non-object input", () => {
    expect(parseResearchStatus("string")).toBe(null);
    expect(parseResearchStatus(123)).toBe(null);
    expect(parseResearchStatus([])).toBe(null);
  });

  test("returns null when phase is missing", () => {
    const input = { label: "Searching..." };
    expect(parseResearchStatus(input)).toBe(null);
  });

  test("returns null when label is missing", () => {
    const input = { phase: "search" };
    expect(parseResearchStatus(input)).toBe(null);
  });

  test("returns null when phase is not a string", () => {
    const input = { phase: 123, label: "Searching..." };
    expect(parseResearchStatus(input)).toBe(null);
  });

  test("returns null when label is not a string", () => {
    const input = { phase: "search", label: 123 };
    expect(parseResearchStatus(input)).toBe(null);
  });

  test("returns null when phase is not a valid phase", () => {
    const input = { phase: "invalid", label: "Searching..." };
    expect(parseResearchStatus(input)).toBe(null);
  });

  test("accepts all valid phases", () => {
    const phases: ResearchPhase[] = ["plan", "search", "read", "workspace", "synthesize"];
    phases.forEach((phase) => {
      const input = { phase, label: "Label" };
      const result = parseResearchStatus(input);
      expect(result).not.toBe(null);
      expect(result?.phase).toBe(phase);
    });
  });

  test("tolerates extra properties", () => {
    const input = { phase: "search", label: "Searching...", extra: "ignored" };
    const result = parseResearchStatus(input);
    expect(result).toEqual({ phase: "search", label: "Searching..." });
  });

  test("handles empty label string", () => {
    const input = { phase: "search", label: "" };
    const result = parseResearchStatus(input);
    expect(result).toEqual({ phase: "search", label: "" });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// summarySegments - Format research counts
// ─────────────────────────────────────────────────────────────────────────────
describe("summarySegments", () => {
  test("returns empty array when all counts are zero/false", () => {
    const result = summarySegments(0, 0, false);
    expect(result).toEqual([]);
  });

  test("includes singular 'query' for searched=1", () => {
    const result = summarySegments(1, 0, false);
    expect(result).toContain("Searched 1 query");
  });

  test("includes plural 'queries' for searched>1", () => {
    const result = summarySegments(3, 0, false);
    expect(result).toContain("Searched 3 queries");
  });

  test("includes singular 'source' for read=1", () => {
    const result = summarySegments(0, 1, false);
    expect(result).toContain("Read 1 source");
  });

  test("includes plural 'sources' for read>1", () => {
    const result = summarySegments(0, 3, false);
    expect(result).toContain("Read 3 sources");
  });

  test("includes 'Workspace' when workspace=true", () => {
    const result = summarySegments(0, 0, true);
    expect(result).toContain("Workspace");
  });

  test("combines multiple segments in order", () => {
    const result = summarySegments(2, 3, true);
    expect(result.length).toBe(3);
    expect(result[0]).toContain("Searched");
    expect(result[1]).toContain("Read");
    expect(result[2]).toBe("Workspace");
  });

  test("handles large counts", () => {
    const result = summarySegments(100, 200, false);
    expect(result).toContain("Searched 100 queries");
    expect(result).toContain("Read 200 sources");
  });

  test("returns segments in consistent order", () => {
    const result1 = summarySegments(1, 1, true);
    const result2 = summarySegments(1, 1, true);
    expect(result1).toEqual(result2);
  });
});

// Note: React components (ResearchActivityLine, ResearchSummaryRow) cannot be
// tested as plain functions without a React rendering context.
// Their integration testing should be done via e2e or visual tests.
// The pure functions (parseResearchStatus, summarySegments) exercise the
// core logic that these components depend on, providing comprehensive coverage
// of the computation and data extraction paths.
