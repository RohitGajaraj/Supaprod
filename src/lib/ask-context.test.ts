import { describe, expect, it } from "bun:test";
import { chipLabel, contextForPath, scopeForPath } from "./ask-context";

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
    expect(contextForPath("/engine-room", null)).toBe("Guardrails");
    expect(contextForPath("/govern", null)).toBe("Guardrails");
  });

  it("falls back to a generic label for an unrecognized path", () => {
    expect(contextForPath("/settings", null)).toBe("this screen");
  });
});

describe("ask-context - scopeForPath", () => {
  // The prototype's chip reads "this run" on the run screen, and /build was
  // renamed to /runs. The old expectation ("this mission", keyed on /build)
  // described a path a person no longer lands on, so the LABEL moved with the
  // product and the PATHS grew; the intent of the case is unchanged.
  it("scopes to the exact run by source_id, at the route it lives on now", () => {
    expect(scopeForPath("/runs/m-1", null)).toEqual({
      kinds: ["mission"],
      sourceId: "m-1",
      label: "this run",
    });
  });

  it("still resolves the legacy /build URLs, because the redirect keeps them live", () => {
    expect(scopeForPath("/build/m-1", null)).toEqual({
      kinds: ["mission"],
      sourceId: "m-1",
      label: "this run",
    });
    expect(scopeForPath("/build", "m-1")).toEqual({
      kinds: ["mission"],
      sourceId: "m-1",
      label: "this run",
    });
    expect(scopeForPath("/studio/m-1", null)?.sourceId).toBe("m-1");
    expect(scopeForPath("/missions/m-1", null)?.sourceId).toBe("m-1");
  });

  it("the run index scopes to runs without pinning one", () => {
    expect(scopeForPath("/runs", null)).toEqual({ kinds: ["mission"], label: "your runs" });
    expect(scopeForPath("/build", null)).toEqual({ kinds: ["mission"], label: "your runs" });
  });

  it("scopes to the exact spec when one is open", () => {
    expect(scopeForPath("/prds/p-9", null)).toEqual({
      kinds: ["prd"],
      sourceId: "p-9",
      label: "this spec",
    });
    expect(scopeForPath("/plan/spec/p-9", null)?.label).toBe("this spec");
  });

  it("scopes to the exact decision the Brain has open", () => {
    expect(scopeForPath("/brain", null, { decision: "d-3" })).toEqual({
      kinds: ["decision"],
      sourceId: "d-3",
      label: "this decision",
    });
  });

  // "PRDs" was an internal word on a user-facing chip (question 7). Same scope,
  // words a stranger has.
  it("scopes Plan to specs, in plain words", () => {
    expect(scopeForPath("/plan", null)).toEqual({ kinds: ["prd"], label: "your specs" });
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

  // Discover keeps its NAME on the chip and stays unscoped for retrieval:
  // nothing here proves signals are chunked, and a scope that returns nothing
  // is worse than no scope.
  it("names Discover without narrowing retrieval to a kind it cannot prove", () => {
    expect(scopeForPath("/discover", null)).toEqual({ label: "Discover" });
    expect(scopeForPath("/discover", null)?.kinds).toBeUndefined();
  });

  it("stays unscoped for screens with nothing to pin to", () => {
    expect(scopeForPath("/today", null)).toBeNull();
    expect(scopeForPath("/engine-room", null)).toBeNull();
    expect(scopeForPath("/settings", null)).toBeNull();
    expect(scopeForPath("/threads", null)).toBeNull();
  });
});

describe("ask-context - chipLabel", () => {
  it("says the scope when there is one", () => {
    expect(chipLabel({ kinds: ["mission"], sourceId: "m-1", label: "this run" }, "Helio")).toBe(
      "this run",
    );
  });

  it("falls back to the workspace BY NAME, which a person recognises", () => {
    expect(chipLabel(null, "Helio Labs")).toBe("Helio Labs");
  });

  it("says a fact rather than nothing when even the name has not loaded", () => {
    expect(chipLabel(null, null)).toBe("this workspace");
    expect(chipLabel(null, "   ")).toBe("this workspace");
  });
});
