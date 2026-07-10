import { describe, expect, test } from "bun:test";
import {
  MAX_VERIFY_CYCLES,
  agentScopeVerdict,
  decideVerifyAction,
  uatLeftovers,
  unmetClauses,
} from "./verify-green.server";
import type { MissionTestPlan } from "@/lib/test-station.functions";

describe("decideVerifyAction (PC-07 caps and outcomes)", () => {
  const base = {
    killSwitchOff: false,
    planAvailable: true,
    verifyCycles: 0,
    missionSpendUsd: 0,
    spendCapUsd: 5,
  };

  test("no compiled contract -> not applicable (pre-PC-07 behavior preserved)", () => {
    expect(decideVerifyAction({ ...base, planAvailable: false, verdict: null })).toBe(
      "not_applicable",
    );
  });

  test("kill switch off -> not applicable regardless of the checklist", () => {
    expect(decideVerifyAction({ ...base, killSwitchOff: true, verdict: "blocked" })).toBe(
      "not_applicable",
    );
  });

  test("green checklist -> green, at any cycle count", () => {
    expect(decideVerifyAction({ ...base, verdict: "passing" })).toBe("green");
    expect(decideVerifyAction({ ...base, verdict: "passing", verifyCycles: 3 })).toBe("green");
  });

  test("failing checklist under the caps -> dispatch a corrective cycle", () => {
    expect(decideVerifyAction({ ...base, verdict: "blocked" })).toBe("cycle_dispatched");
    expect(decideVerifyAction({ ...base, verdict: "pending", verifyCycles: 2 })).toBe(
      "cycle_dispatched",
    );
  });

  test(`the hard cycle cap (${MAX_VERIFY_CYCLES}) ends the loop honestly`, () => {
    expect(
      decideVerifyAction({ ...base, verdict: "blocked", verifyCycles: MAX_VERIFY_CYCLES }),
    ).toBe("caps_exhausted");
    expect(
      decideVerifyAction({ ...base, verdict: "pending", verifyCycles: MAX_VERIFY_CYCLES + 1 }),
    ).toBe("caps_exhausted");
  });

  test("the spend cap ends the loop even with cycles remaining", () => {
    expect(
      decideVerifyAction({ ...base, verdict: "blocked", missionSpendUsd: 5.01, spendCapUsd: 5 }),
    ).toBe("caps_exhausted");
  });
});

describe("unmetClauses (the feedback source)", () => {
  const plan: Extract<MissionTestPlan, { available: true }> = {
    available: true,
    prdId: "prd-1",
    prdTitle: "Checkout revamp",
    verdict: "blocked",
    eval: [
      { clauseId: "c1", text: "Conversion eval passes", caseId: "e1", result: "failed" },
      { clauseId: "c2", text: "Latency eval passes", caseId: "e2", result: "passed" },
      { clauseId: "c3", text: "A11y eval passes", caseId: "e3", result: "pending" },
    ],
    ci: [{ clauseId: "c4", text: "CI is green on the release branch" }],
    uat: [
      { clauseId: "c5", text: "Founder walks the flow", checked: false, checkedAt: null },
      { clauseId: "c6", text: "Support signs off", checked: true, checkedAt: "2026-07-10" },
    ],
    alreadyRecorded: false,
  };

  test("collects the agent-fixable evals only: never ci (satisfied by construction), never uat (the human's lane)", () => {
    const unmet = unmetClauses(plan);
    expect(unmet.map((u) => u.clauseId)).toEqual(["c1", "c3"]);
    expect(unmet[0].why).toContain("failed");
    expect(unmet[1].why).toContain("not run");
  });

  test("uatLeftovers lists only the unchecked human items", () => {
    expect(uatLeftovers(plan)).toEqual(["Founder walks the flow"]);
  });
});

describe("agentScopeVerdict (what the corrective loop actually keys on)", () => {
  const base: Extract<MissionTestPlan, { available: true }> = {
    available: true,
    prdId: "prd-1",
    prdTitle: "Checkout revamp",
    verdict: "pending",
    eval: [{ clauseId: "c1", text: "Conversion eval passes", caseId: "e1", result: "passed" }],
    ci: [{ clauseId: "c4", text: "CI is green" }],
    uat: [{ clauseId: "c5", text: "Founder walks the flow", checked: false, checkedAt: null }],
    alreadyRecorded: false,
  };

  test("uat-only pending reads green for the agent scope (no wasted cycles on human checkboxes)", () => {
    // The full station verdict is pending (uat unchecked), but every
    // agent-fixable clause is satisfied: the mission may complete.
    expect(agentScopeVerdict(base)).toBe("passing");
  });

  test("ci clauses never block the agent scope at verify time (mission steps already succeeded)", () => {
    expect(agentScopeVerdict({ ...base, uat: [] })).toBe("passing");
  });

  test("a failing eval still blocks", () => {
    expect(
      agentScopeVerdict({
        ...base,
        eval: [{ clauseId: "c1", text: "Conversion eval passes", caseId: "e1", result: "failed" }],
      }),
    ).toBe("blocked");
  });
});
