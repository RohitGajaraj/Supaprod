import { describe, expect, it } from "bun:test";
import { SPEC_SECTION_ORDER } from "./spec-sections";
import { buildPrdSystemPrompt, CONTRACT_FROM_INTENT_SYSTEM } from "./discovery.functions";

describe("SPEC_SECTION_ORDER", () => {
  it("is the one canonical section sequence", () => {
    expect([...SPEC_SECTION_ORDER]).toEqual([
      "Problem",
      "Target Users",
      "Hypothesis",
      "User Stories",
      "Solution Sketch",
      "Success Metrics",
      "Scope (MVP)",
      "Out of Scope",
      "Risks & Open Questions",
      "Milestones",
    ]);
  });
});

describe("spec-writing prompts derive their sections from SPEC_SECTION_ORDER", () => {
  const headings = SPEC_SECTION_ORDER.map((section) => `## ${section}`);

  it("generatePrd's system prompt enumerates every section, in order, and nothing else", () => {
    const prompt = buildPrdSystemPrompt(false);
    const found = [...prompt.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
    expect(found).toEqual([...SPEC_SECTION_ORDER]);
  });

  it("generatePrd's system prompt keeps its surrounding instructions intact", () => {
    const plain = buildPrdSystemPrompt(false);
    expect(plain).toContain("Be concrete, terse, and useful.");
    expect(plain).toContain("Do not invent citation numbers.");
    expect(plain).not.toContain("PRIOR REVIEW block");

    const carried = buildPrdSystemPrompt(true);
    expect(carried).toContain("PRIOR REVIEW block");
    expect(carried).toContain('"## Risks & Open Questions"');
  });

  it("draftContractFromIntent's narrative enumerates the same sections", () => {
    for (const heading of headings) {
      expect(CONTRACT_FROM_INTENT_SYSTEM).toContain(heading);
    }
    const listed = CONTRACT_FROM_INTENT_SYSTEM.match(/\((## .+?)\), under 400 words/);
    expect(listed).toBeTruthy();
    expect(listed![1].split(", ").map((s) => s.replace(/^## /, ""))).toEqual([
      ...SPEC_SECTION_ORDER,
    ]);
    expect(CONTRACT_FROM_INTENT_SYSTEM).toContain('"narrative"');
  });
});
