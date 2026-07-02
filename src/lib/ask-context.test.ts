import { describe, expect, it } from "bun:test";
import { contextForPath } from "./ask-context";

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
    expect(contextForPath("/engine-room", null)).toBe("the Engine Room");
    expect(contextForPath("/govern", null)).toBe("the Engine Room");
  });

  it("falls back to a generic label for an unrecognized path", () => {
    expect(contextForPath("/settings", null)).toBe("this screen");
  });
});
