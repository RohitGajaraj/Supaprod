import { describe, it, expect } from "bun:test";
import {
  sourceLabel,
  sourceBlurb,
  statusTone,
  statusLabel,
  supersedesPreview,
  willSupersede,
} from "./memory-candidates";

describe("sourceLabel / sourceBlurb", () => {
  it("labels the three known sources", () => {
    expect(sourceLabel("user")).toBe("You saved this");
    expect(sourceLabel("agent")).toBe("Agent proposed");
    expect(sourceLabel("outcome")).toBe("Distilled outcome");
  });

  it("falls back to a plain word for an unknown source", () => {
    expect(sourceLabel("mystery")).toBe("Proposed");
  });

  it("gives a blurb for known sources and '' for unknown", () => {
    expect(sourceBlurb("user").length).toBeGreaterThan(0);
    expect(sourceBlurb("agent").length).toBeGreaterThan(0);
    expect(sourceBlurb("outcome").length).toBeGreaterThan(0);
    expect(sourceBlurb("mystery")).toBe("");
  });
});

describe("statusTone / statusLabel", () => {
  it("maps each status to its VerdictChip tone", () => {
    expect(statusTone("pending")).toBe("PENDING");
    expect(statusTone("approved")).toBe("KEPT");
    expect(statusTone("rejected")).toBe("KILL");
  });

  it("labels each status honestly", () => {
    expect(statusLabel("pending")).toBe("Awaiting your review");
    expect(statusLabel("approved")).toBe("Approved");
    expect(statusLabel("rejected")).toBe("Rejected");
  });
});

describe("supersedesPreview", () => {
  it("returns '' for empty/blank/nullish input", () => {
    expect(supersedesPreview(null)).toBe("");
    expect(supersedesPreview(undefined)).toBe("");
    expect(supersedesPreview("")).toBe("");
    expect(supersedesPreview("   \n  ")).toBe("");
  });

  it("normalizes whitespace and keeps short content whole", () => {
    expect(supersedesPreview("  keep   this\n  line ")).toBe("keep this line");
  });

  it("truncates overlong content with an ellipsis", () => {
    const long = "a".repeat(200);
    const out = supersedesPreview(long, 90);
    expect(out.length).toBe(90);
    expect(out.endsWith("…")).toBe(true);
  });

  it("does not truncate content exactly at the cap", () => {
    const exact = "b".repeat(90);
    expect(supersedesPreview(exact, 90)).toBe(exact);
  });
});

describe("willSupersede", () => {
  it("is true only for a non-empty memory id", () => {
    expect(willSupersede("mem-1")).toBe(true);
    expect(willSupersede(null)).toBe(false);
    expect(willSupersede(undefined)).toBe(false);
    expect(willSupersede("")).toBe(false);
  });
});
