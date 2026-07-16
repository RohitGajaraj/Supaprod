import { describe, expect, it } from "bun:test";
import { contextForPath, scopeForPath } from "./ask-context";

describe("ask-context - contextForPath", () => {
  it("maps each canonical destination to its plain-words label", () => {
    expect(contextForPath("/today", null)).toBe("Today");
    expect(contextForPath("/discover", null)).toBe("Discover");
    expect(contextForPath("/plan", null)).toBe("Plan");
    expect(contextForPath("/knowledge", null)).toBe("Brain");
  });

  it("Build without an open mission reads as Build", () => {
    expect(contextForPath("/build", null)).toBe("Build");
  });

  it("Build with an open ?mission= reads as a mission", () => {
    expect(contextForPath("/build", "m-1")).toBe("a mission");
  });

  it("maps both engine-room paths to the same plain-words label", () => {
    expect(contextForPath("/engine-room", null)).toBe("Pulse");
    expect(contextForPath("/govern", null)).toBe("Pulse");
  });

  it("falls back to a generic label for an unrecognized path", () => {
    expect(contextForPath("/settings", null)).toBe("this screen");
  });
});

describe("ask-context - scopeForPath (PC-36 workstream B)", () => {
  it("scopes to the exact mission by source_id when one is open", () => {
    expect(scopeForPath("/build", "m-1")).toEqual({
      kinds: ["mission"],
      sourceId: "m-1",
      label: "this mission",
    });
  });

  it("does not scope Build when no mission is open (nothing to pin to)", () => {
    expect(scopeForPath("/build", null)).toBeNull();
  });

  it("scopes Plan to PRDs", () => {
    expect(scopeForPath("/plan", null)).toEqual({ kinds: ["prd"], label: "PRDs" });
  });

  it("scopes Brain/knowledge to doc/note/finding", () => {
    expect(scopeForPath("/brain", null)).toEqual({
      kinds: ["doc", "note", "finding"],
      label: "Brain",
    });
    expect(scopeForPath("/knowledge", null)).toEqual({
      kinds: ["doc", "note", "finding"],
      label: "Brain",
    });
  });

  it("stays unscoped for screens without a confident kind mapping", () => {
    expect(scopeForPath("/today", null)).toBeNull();
    expect(scopeForPath("/discover", null)).toBeNull();
    expect(scopeForPath("/engine-room", null)).toBeNull();
    expect(scopeForPath("/settings", null)).toBeNull();
  });
});
