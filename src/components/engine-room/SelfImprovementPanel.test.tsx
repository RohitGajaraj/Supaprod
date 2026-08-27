import { describe, test, expect } from "bun:test";
import { SelfImprovementPanel } from "./SelfImprovementPanel";

// Smoke test only: this repo has no DOM renderer, and the panel pulls the active
// workspace from a React context + a server fn, so a mount test is not viable
// here. Asserting the export is a callable component guards the import graph
// (server-fn import, obsidian primitives, room-parts helpers) from breaking.
describe("SelfImprovementPanel", () => {
  test("is a React component function", () => {
    expect(typeof SelfImprovementPanel).toBe("function");
  });
});
