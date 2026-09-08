import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { listOf, platformCoverageLine } from "./byokeys-words";

const labels = [
  { id: "anthropic", label: "Claude (Anthropic)" },
  { id: "openai", label: "OpenAI" },
  { id: "google", label: "Gemini (Google)" },
];

describe("what Supaprod's own keys cover", () => {
  it("names the providers by the picker's own words, short form, in a list", () => {
    expect(
      platformCoverageLine({
        providers: ["anthropic", "openai", "google"],
        recommendedModel: "anthropic/claude-haiku-4",
        labels,
        canAddOwn: false,
      }),
    ).toBe(
      "Supaprod's own keys cover Claude, OpenAI and Gemini. Agents run on anthropic/claude-haiku-4 unless a run names another model.",
    );
  });

  it("an id the picker does not know is shown as its id, never dropped", () => {
    expect(
      platformCoverageLine({
        providers: ["nebius"],
        recommendedModel: null,
        labels,
        canAddOwn: false,
      }),
    ).toBe("Supaprod's own keys cover nebius.");
  });

  it("no key at all is said as the fault it is", () => {
    expect(
      platformCoverageLine({ providers: [], recommendedModel: null, labels, canAddOwn: true }),
    ).toBe("No provider key is configured on this deployment, so no run can start until one is.");
  });

  it("a plan that can add its own key is told what that changes", () => {
    const line = platformCoverageLine({
      providers: ["anthropic"],
      recommendedModel: "anthropic/claude-haiku-4",
      labels,
      canAddOwn: true,
    });
    expect(line).toContain("A key you add takes precedence for its provider and is billed to you.");
  });

  it("lists read as English", () => {
    expect(listOf([])).toBe("");
    expect(listOf(["A"])).toBe("A");
    expect(listOf(["A", "B"])).toBe("A and B");
    expect(listOf(["A", "B", "C"])).toBe("A, B and C");
  });

  it("the settings page reads the platform providers and draws the line (P-155)", () => {
    const src = readFileSync("src/routes/_authenticated.settings.tsx", "utf8");
    expect(src).toContain("listPlatformProviders");
    expect(src).toContain("platformCoverageLine(");
    // The read is keyed once, so the page cannot ask twice under two names.
    expect(src).toContain('queryKey: ["platform-providers"]');
  });
});
