import { expect, test, describe } from "bun:test";
import {
  buildGateEventRow,
  summarizeGateSignals,
  CORRECTION_GATE_TYPES,
  type GateType,
} from "./gate-signals";

const USER = "11111111-1111-1111-1111-111111111111";

describe("buildGateEventRow (RPT-32): normalize a gate decision into a row", () => {
  test("maps a full input to snake_case columns and clamps long text", () => {
    const row = buildGateEventRow(USER, {
      gateType: "edit",
      subjectType: "spec",
      subjectRef: "prd-1",
      agentSlug: "builder",
      toolName: "prd.draft",
      verdict: "edited",
      diffSummary: "x".repeat(5000),
      workspaceId: "ws-1",
    });
    expect(row.user_id).toBe(USER);
    expect(row.gate_type).toBe("edit");
    expect(row.subject_type).toBe("spec");
    expect(row.agent_slug).toBe("builder");
    expect(row.workspace_id).toBe("ws-1");
    expect(row.diff_summary!.length).toBe(2000); // clamped
  });

  test("blank / missing optionals become null, not empty strings", () => {
    const row = buildGateEventRow(USER, {
      gateType: "approval",
      subjectType: "tool_call",
      subjectRef: "   ",
      agentSlug: "",
      diffSummary: undefined,
      workspaceId: null,
    });
    expect(row.subject_ref).toBeNull();
    expect(row.agent_slug).toBeNull();
    expect(row.diff_summary).toBeNull();
    expect(row.workspace_id).toBeNull();
    expect(row.tool_name).toBeNull();
  });

  test("an unknown gate_type falls back to override (a correction), never a clean approval", () => {
    const row = buildGateEventRow(USER, {
      gateType: "nonsense" as GateType,
      subjectType: "spec",
      workspaceId: null,
    });
    expect(row.gate_type).toBe("override");
    expect(CORRECTION_GATE_TYPES.has(row.gate_type)).toBe(true);
  });

  test("an empty subject_type falls back to 'unknown' (NOT NULL column)", () => {
    const row = buildGateEventRow(USER, {
      gateType: "approval",
      subjectType: "  ",
      workspaceId: null,
    });
    expect(row.subject_type).toBe("unknown");
  });
});

describe("summarizeGateSignals (RPT-32): per-agent correction rate feeds the ranking", () => {
  test("counts approvals vs corrections (rejection/edit/override) per agent", () => {
    const rows = [
      { gate_type: "approval", agent_slug: "builder" },
      { gate_type: "approval", agent_slug: "builder" },
      { gate_type: "edit", agent_slug: "builder" },
      { gate_type: "rejection", agent_slug: "critic" },
      { gate_type: "override", agent_slug: "critic" },
    ];
    const { perAgent, overall } = summarizeGateSignals(rows);
    expect(perAgent.builder).toEqual({
      approved: 2,
      corrected: 1,
      total: 3,
      correctionRate: 1 / 3,
    });
    expect(perAgent.critic).toEqual({
      approved: 0,
      corrected: 2,
      total: 2,
      correctionRate: 1,
    });
    expect(overall).toEqual({ approved: 2, corrected: 3, total: 5, correctionRate: 3 / 5 });
  });

  test("rows with no agent_slug roll into '(unattributed)' so totals reconcile", () => {
    const rows = [{ gate_type: "approval", agent_slug: null }, { gate_type: "rejection" }];
    const { perAgent, overall } = summarizeGateSignals(rows);
    expect(perAgent["(unattributed)"].total).toBe(2);
    expect(overall.total).toBe(2);
    expect(overall.corrected).toBe(1);
  });

  test("unrecognized gate_type rows are ignored, never miscounted as approvals", () => {
    const rows = [
      { gate_type: "approval", agent_slug: "a" },
      { gate_type: "bogus", agent_slug: "a" },
      { gate_type: null, agent_slug: "a" },
    ];
    const { perAgent, overall } = summarizeGateSignals(rows);
    expect(perAgent.a.total).toBe(1);
    expect(perAgent.a.approved).toBe(1);
    expect(overall.total).toBe(1);
  });

  test("empty input yields zeroed stats with a 0 correction rate (no divide-by-zero)", () => {
    const { perAgent, overall } = summarizeGateSignals([]);
    expect(Object.keys(perAgent)).toHaveLength(0);
    expect(overall).toEqual({ approved: 0, corrected: 0, total: 0, correctionRate: 0 });
  });
});
