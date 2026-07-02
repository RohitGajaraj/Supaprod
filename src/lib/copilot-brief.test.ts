import { expect, test, describe } from "bun:test";
import { summarizeGateStakes, describeStakes, describeRisk } from "./copilot-brief";

describe("summarizeGateStakes — pending gates into a stakes summary", () => {
  // Catalogue ground truth (tool-consequences.ts): prd.draft=reversible,
  // github.commit.append=partial, studio.pr.merge=irreversible.
  test("tallies by reversibility and picks the most consequential call", () => {
    const s = summarizeGateStakes([
      { tool_name: "prd.draft" }, // reversible
      { tool_name: "github.commit.append" }, // partial
      { tool_name: "studio.pr.merge" }, // irreversible
    ]);
    expect(s.total).toBe(3);
    expect(s.reversible).toBe(1);
    expect(s.partial).toBe(1);
    expect(s.irreversible).toBe(1);
    expect(s.top?.toolName).toBe("studio.pr.merge"); // the scariest leads
  });

  test("an irreversible call outranks reversible ones for the lead", () => {
    const s = summarizeGateStakes([
      { tool_name: "prd.draft" }, // reversible
      { tool_name: "studio.pr.merge" }, // irreversible
    ]);
    expect(s.top?.toolName).toBe("studio.pr.merge");
  });

  test("unknown tools are treated conservatively (never silently dropped)", () => {
    const s = summarizeGateStakes([{ tool_name: "totally_unknown_tool" }]);
    expect(s.total).toBe(1);
    expect(s.top?.toolName).toBe("totally_unknown_tool");
  });

  test("blank/missing tool names and malformed input are safe", () => {
    expect(summarizeGateStakes([{ tool_name: "" }, { tool_name: null }]).total).toBe(0);
    expect(summarizeGateStakes(null).total).toBe(0);
    expect(summarizeGateStakes(undefined).top).toBeNull();
  });
});

describe("describeStakes — deterministic plain-language lead", () => {
  test("clear queue is honest, no fabricated urgency", () => {
    expect(describeStakes(summarizeGateStakes([]))).toContain("queue is clear");
  });
  test("leads with the most consequential call + an honest breakdown", () => {
    const line = describeStakes(
      summarizeGateStakes([{ tool_name: "prd.draft" }, { tool_name: "prd.draft" }]),
    );
    expect(line).toContain("Most consequential:");
    expect(line).toMatch(/2 calls await you/);
    expect(line).toContain("reversible");
  });
  test("singular phrasing for one call", () => {
    const line = describeStakes(summarizeGateStakes([{ tool_name: "prd.draft" }]));
    expect(line).toMatch(/1 call await you/);
  });
});

describe("describeRisk (FS-04) — the brief's risk lead, credibility-checked", () => {
  test("honest when there is no open risk (no fabricated urgency)", () => {
    expect(describeRisk(null, null)).toBe("No open risk flagged.");
  });

  test("leads with the risk, no calibration clause when nothing has resolved yet", () => {
    const line = describeRisk(
      { headline: "Churn risk in the onboarding cohort", detail: "Signups drop after step 3." },
      { resolved: 0, recentLabel: "Not enough resolved calls yet" },
    );
    expect(line).toBe("Watch: Churn risk in the onboarding cohort. Signups drop after step 3.");
    expect(line).not.toContain("resolved calls yet");
  });

  test("cites the calibration hit rate once at least one call has resolved", () => {
    const line = describeRisk(
      { headline: "Churn risk in the onboarding cohort", detail: "Signups drop after step 3." },
      { resolved: 9, recentLabel: "Cadence called 7 of the last 9" },
    );
    expect(line).toContain("Cadence called 7 of the last 9");
  });

  test("never invents a hit rate when calibration is null", () => {
    const line = describeRisk({ headline: "Risk", detail: "Detail." }, null);
    expect(line).not.toContain("called");
  });

  test("handles an empty detail without a dangling space", () => {
    const line = describeRisk({ headline: "Risk with no detail", detail: "" }, null);
    expect(line).toBe("Watch: Risk with no detail.");
  });
});
