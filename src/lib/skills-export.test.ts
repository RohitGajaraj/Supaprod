import { describe, expect, it } from "bun:test";
import { buildSkillsMarkdown } from "./skills-export.functions";

const GENERATED_AT = "2026-07-11T12:00:00.000Z";

describe("skills-export - buildSkillsMarkdown", () => {
  it("renders a header naming the workspace and the generation date", () => {
    const md = buildSkillsMarkdown({
      workspaceName: "Acme",
      decisions: [],
      learnings: [],
      houseRules: [],
      generatedAt: GENERATED_AT,
    });
    expect(md).toContain("# Acme - Agent Context Bundle");
    expect(md).toContain("Generated 2026-07-11");
  });

  it("falls back to a generic name when the workspace has none", () => {
    const md = buildSkillsMarkdown({
      workspaceName: null,
      decisions: [],
      learnings: [],
      houseRules: [],
      generatedAt: GENERATED_AT,
    });
    expect(md).toContain("# Cadence - Agent Context Bundle");
  });

  it("renders each decision with status, date, and rationale", () => {
    const md = buildSkillsMarkdown({
      workspaceName: "Acme",
      decisions: [
        {
          title: "Ship the wedge first",
          rationale: "The first receipt is the first-session proof.",
          status: "approved",
          decided_by_agent_slug: "critic",
          created_at: "2026-07-01T00:00:00.000Z",
        },
      ],
      learnings: [],
      houseRules: [],
      generatedAt: GENERATED_AT,
    });
    expect(md).toContain("### Ship the wedge first");
    expect(md).toContain("- Status: approved");
    expect(md).toContain("- Decided: 2026-07-01");
    expect(md).toContain("- Decided by: critic");
    expect(md).toContain("The first receipt is the first-session proof.");
  });

  it("omits the decided-by line when there is no agent attribution", () => {
    const md = buildSkillsMarkdown({
      workspaceName: "Acme",
      decisions: [
        {
          title: "Human call",
          rationale: null,
          status: "approved",
          decided_by_agent_slug: null,
          created_at: "2026-07-01T00:00:00.000Z",
        },
      ],
      learnings: [],
      houseRules: [],
      generatedAt: GENERATED_AT,
    });
    expect(md).not.toContain("Decided by:");
  });

  it("shows a placeholder line when a section is empty", () => {
    const md = buildSkillsMarkdown({
      workspaceName: "Acme",
      decisions: [],
      learnings: [],
      houseRules: [],
      generatedAt: GENERATED_AT,
    });
    expect(md).toContain("_No decisions recorded yet._");
    expect(md).toContain("_No recorded outcomes yet._");
    expect(md).toContain("_No standing house rules yet._");
  });

  it("resolves the opportunity title from a single joined object", () => {
    const md = buildSkillsMarkdown({
      workspaceName: "Acme",
      decisions: [],
      learnings: [
        {
          verdict: "validated",
          summary: "Adoption doubled.",
          metric_label: "WAU",
          metric_value: "+120%",
          created_at: "2026-07-05T00:00:00.000Z",
          opportunity: { title: "Faster onboarding" },
        },
      ],
      houseRules: [],
      generatedAt: GENERATED_AT,
    });
    expect(md).toContain("### Faster onboarding - validated");
    expect(md).toContain("- Metric: WAU = +120%");
    expect(md).toContain("Adoption doubled.");
  });

  it("resolves the opportunity title from a joined array (the Supabase FK shape)", () => {
    const md = buildSkillsMarkdown({
      workspaceName: "Acme",
      decisions: [],
      learnings: [
        {
          verdict: "missed",
          summary: null,
          metric_label: null,
          metric_value: null,
          created_at: "2026-07-05T00:00:00.000Z",
          opportunity: [{ title: "Retry flow" }],
        },
      ],
      houseRules: [],
      generatedAt: GENERATED_AT,
    });
    expect(md).toContain("### Retry flow - missed");
  });

  it("falls back to a generic outcome title when the opportunity is missing", () => {
    const md = buildSkillsMarkdown({
      workspaceName: "Acme",
      decisions: [],
      learnings: [
        {
          verdict: "mixed",
          summary: null,
          metric_label: null,
          metric_value: null,
          created_at: "2026-07-05T00:00:00.000Z",
          opportunity: null,
        },
      ],
      houseRules: [],
      generatedAt: GENERATED_AT,
    });
    expect(md).toContain("### Outcome - mixed");
  });

  it("renders every active house rule as a bullet", () => {
    const md = buildSkillsMarkdown({
      workspaceName: "Acme",
      decisions: [],
      learnings: [],
      houseRules: [
        {
          id: "1",
          workspace_id: "w1",
          rule_text: "Never use em dashes in generated copy.",
          rationale: null,
          status: "approved",
          source_learning_ids: [],
          decided_by: null,
          decided_at: null,
          created_at: GENERATED_AT,
        },
      ],
      generatedAt: GENERATED_AT,
    });
    expect(md).toContain("- Never use em dashes in generated copy.");
  });
});
