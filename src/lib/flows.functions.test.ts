import { describe, it, expect } from "bun:test";
import { parseGeneratedFlow } from "./flows.functions";

describe("parseGeneratedFlow", () => {
  it("returns an empty flow for missing or malformed input", () => {
    expect(parseGeneratedFlow(null)).toEqual({ steps: [], edges: [] });
    expect(parseGeneratedFlow(undefined)).toEqual({ steps: [], edges: [] });
    expect(parseGeneratedFlow({})).toEqual({ steps: [], edges: [] });
    expect(parseGeneratedFlow({ steps: "not an array" })).toEqual({ steps: [], edges: [] });
  });

  it("accepts a well-formed step/edge graph", () => {
    const out = parseGeneratedFlow({
      steps: [
        { id: "s1", kind: "step", label: "Open the app" },
        { id: "s2", kind: "decision", label: "Has a workspace?" },
        { id: "s3", kind: "state", label: "Onboarded" },
      ],
      edges: [
        { from: "s1", to: "s2" },
        { from: "s2", to: "s3", label: "yes" },
      ],
    });
    expect(out.steps).toHaveLength(3);
    expect(out.edges).toEqual([
      { from: "s1", to: "s2" },
      { from: "s2", to: "s3", label: "yes" },
    ]);
  });

  it("drops a step with an invalid kind", () => {
    const out = parseGeneratedFlow({
      steps: [
        { id: "s1", kind: "step", label: "Good" },
        { id: "s2", kind: "banana", label: "Bad kind" },
      ],
      edges: [],
    });
    expect(out.steps.map((s) => s.id)).toEqual(["s1"]);
  });

  it("drops a duplicate step id, keeping the first", () => {
    const out = parseGeneratedFlow({
      steps: [
        { id: "s1", kind: "step", label: "First" },
        { id: "s1", kind: "step", label: "Duplicate" },
      ],
      edges: [],
    });
    expect(out.steps).toHaveLength(1);
    expect(out.steps[0].label).toBe("First");
  });

  it("drops an edge referencing an id that was never accepted as a step", () => {
    const out = parseGeneratedFlow({
      steps: [{ id: "s1", kind: "step", label: "Only step" }],
      edges: [
        { from: "s1", to: "ghost" },
        { from: "ghost", to: "s1" },
      ],
    });
    expect(out.edges).toEqual([]);
  });

  it("caps steps at MAX_STEPS (10) rather than trusting an oversized list", () => {
    const steps = Array.from({ length: 20 }, (_, i) => ({
      id: `s${i}`,
      kind: "step",
      label: `Step ${i}`,
    }));
    const out = parseGeneratedFlow({ steps, edges: [] });
    expect(out.steps).toHaveLength(10);
  });

  it("drops an edge label that is blank after trimming", () => {
    const out = parseGeneratedFlow({
      steps: [
        { id: "s1", kind: "step", label: "A" },
        { id: "s2", kind: "step", label: "B" },
      ],
      edges: [{ from: "s1", to: "s2", label: "   " }],
    });
    expect(out.edges).toEqual([{ from: "s1", to: "s2" }]);
  });

  it("allows an empty steps array (no real flow in this PRD, never invented)", () => {
    const out = parseGeneratedFlow({ steps: [], edges: [] });
    expect(out.steps).toEqual([]);
    expect(out.edges).toEqual([]);
  });
});
