import { describe, it, expect } from "bun:test";
import { buildSystemPrompt } from "./design-scaffold.functions";

describe("buildSystemPrompt", () => {
  it("omits the design-memory guidance when the workspace has no standing memory", () => {
    const prompt = buildSystemPrompt(false);
    expect(prompt).not.toContain("Workspace design language");
    expect(prompt).toContain("generate a COMPLETE self-contained HTML page");
  });

  it("appends the design-memory guidance when the workspace has standing memory", () => {
    const prompt = buildSystemPrompt(true);
    expect(prompt).toContain("Workspace design language");
    expect(prompt.startsWith(buildSystemPrompt(false))).toBe(true);
  });
});
