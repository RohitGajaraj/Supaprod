import { describe, expect, test } from "bun:test";
import { ciGateStatus, computeVerdict, type EvalPlanItem, type UatPlanItem } from "./test-station.functions";

describe("ciGateStatus", () => {
  test("done and completed are satisfied", () => {
    expect(ciGateStatus("done")).toBe("satisfied");
    expect(ciGateStatus("completed")).toBe("satisfied");
  });
  test("failed and cancelled are blocked", () => {
    expect(ciGateStatus("failed")).toBe("blocked");
    expect(ciGateStatus("cancelled")).toBe("blocked");
    expect(ciGateStatus("canceled")).toBe("blocked");
  });
  test("running or unknown statuses are pending", () => {
    expect(ciGateStatus("running")).toBe("pending");
    expect(ciGateStatus("blocked")).toBe("pending");
    expect(ciGateStatus("queued")).toBe("pending");
  });
});

describe("computeVerdict", () => {
  const evalPass: EvalPlanItem = { clauseId: "e1", text: "x", caseId: "c1", result: "passed" };
  const evalFail: EvalPlanItem = { clauseId: "e2", text: "x", caseId: "c2", result: "failed" };
  const evalPending: EvalPlanItem = { clauseId: "e3", text: "x", caseId: "c3", result: "pending" };
  const uatChecked: UatPlanItem = { clauseId: "u1", text: "x", checked: true, checkedAt: "now" };
  const uatUnchecked: UatPlanItem = { clauseId: "u2", text: "x", checked: false, checkedAt: null };

  test("passing when every eval passed, ci satisfied, every uat checked", () => {
    const verdict = computeVerdict({
      evalItems: [evalPass],
      ci: [{ clauseId: "c1", text: "gate" }],
      ciStatus: "satisfied",
      uatItems: [uatChecked],
    });
    expect(verdict).toBe("passing");
  });

  test("passing with no ci clauses at all (ciStatus never checked)", () => {
    const verdict = computeVerdict({
      evalItems: [evalPass],
      ci: [],
      ciStatus: "pending",
      uatItems: [uatChecked],
    });
    expect(verdict).toBe("passing");
  });

  test("blocked when any eval case failed, regardless of everything else", () => {
    const verdict = computeVerdict({
      evalItems: [evalPass, evalFail],
      ci: [{ clauseId: "c1", text: "gate" }],
      ciStatus: "satisfied",
      uatItems: [uatChecked],
    });
    expect(verdict).toBe("blocked");
  });

  test("blocked when the mission gate failed and there are ci clauses", () => {
    const verdict = computeVerdict({
      evalItems: [],
      ci: [{ clauseId: "c1", text: "gate" }],
      ciStatus: "blocked",
      uatItems: [],
    });
    expect(verdict).toBe("blocked");
  });

  test("pending when an eval case has not resolved yet", () => {
    const verdict = computeVerdict({
      evalItems: [evalPass, evalPending],
      ci: [],
      ciStatus: "satisfied",
      uatItems: [],
    });
    expect(verdict).toBe("pending");
  });

  test("pending when the mission is still running and there are ci clauses", () => {
    const verdict = computeVerdict({
      evalItems: [],
      ci: [{ clauseId: "c1", text: "gate" }],
      ciStatus: "pending",
      uatItems: [],
    });
    expect(verdict).toBe("pending");
  });

  test("pending when a uat item is unchecked", () => {
    const verdict = computeVerdict({
      evalItems: [],
      ci: [],
      ciStatus: "satisfied",
      uatItems: [uatChecked, uatUnchecked],
    });
    expect(verdict).toBe("pending");
  });

  test("passing when there is nothing to check at all", () => {
    const verdict = computeVerdict({ evalItems: [], ci: [], ciStatus: "pending", uatItems: [] });
    expect(verdict).toBe("passing");
  });
});
