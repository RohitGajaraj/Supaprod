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

/**
 * The literal "[Product Name]" was rendered on the live Design station, in a
 * mockup for a workspace whose product is called Relay, while the same surface
 * reported six brand rules "in force". The prompt was instructing the model to
 * write the placeholder, and it obeyed.
 */
describe("buildSystemPrompt: the product's real name", () => {
  it("tells the model the actual name when there is one", () => {
    const p = buildSystemPrompt(false, "mockup", "Relay");
    expect(p).toContain('"Relay"');
    expect(p).toContain("never a placeholder");
    expect(p).not.toContain("[Product Name]");
  });

  it("keeps the placeholder when the name could not be resolved", () => {
    // Honest beats invented: a guessed brand printed as fact is worse than a
    // visible blank, so the fallback is deliberate rather than a gap.
    const p = buildSystemPrompt(false, "mockup", null);
    expect(p).toContain("[Product Name]");
  });

  it("treats an empty or whitespace name as no name", () => {
    expect(buildSystemPrompt(false, "mockup", "")).toContain("[Product Name]");
  });
});
