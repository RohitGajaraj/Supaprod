// B3 naming honesty (Gate #1 decision B3, gap register I1): the one place a
// build driver is named for a user must never claim behavior the engine does
// not have. The shipped `claude-sdk` adapter is a single-shot patch generator,
// not the Claude Agent SDK, so it must NEVER be labeled "Claude Agent SDK".

import { describe, test, expect } from "bun:test";
import { buildDriverLabel, BUILD_DRIVER_LABEL } from "./driver";

describe("buildDriverLabel (B3 naming honesty)", () => {
  test("the claude-sdk id is labeled as the patch driver it is, never the Agent SDK", () => {
    expect(BUILD_DRIVER_LABEL["claude-sdk"]).toBe("single-shot patch");
    expect(buildDriverLabel("claude-sdk").toLowerCase()).not.toContain("agent sdk");
    expect(buildDriverLabel("claude-sdk").toLowerCase()).not.toContain("claude");
  });

  test("native reads as Supaprod native; known engines get their real names", () => {
    expect(buildDriverLabel("native")).toBe("Supaprod native");
    expect(buildDriverLabel("openhands")).toBe("OpenHands");
    expect(buildDriverLabel("devin")).toBe("Devin");
  });

  test("an unknown or empty value falls back to a neutral phrase, never a guess", () => {
    expect(buildDriverLabel(null)).toBe("the build engine");
    expect(buildDriverLabel("")).toBe("the build engine");
    expect(buildDriverLabel("some-future-engine")).toBe("the build engine");
  });

  test("normalization is case/space tolerant", () => {
    expect(buildDriverLabel("  NATIVE ")).toBe("Supaprod native");
  });
});
