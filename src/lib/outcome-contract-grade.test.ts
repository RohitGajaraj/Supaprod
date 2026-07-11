import { expect, test, describe } from "bun:test";
import { gradeOutcomeContract, verifiabilityLabel } from "./outcome-contract-grade";
import type { ContractClause, OutcomeContract } from "./discovery.functions";

function clause(over: Partial<ContractClause> = {}): ContractClause {
  return {
    id: crypto.randomUUID(),
    text: "A success metric",
    status: "standing",
    superseded_by: null,
    oracle_kind: null,
    oracle_ref: null,
    created_at: "2026-07-11T00:00:00.000Z",
    ...over,
  };
}

function contract(metrics: ContractClause[]): Pick<OutcomeContract, "success_metrics"> {
  return { success_metrics: metrics };
}

describe("gradeOutcomeContract (RPT-23) — verifiability at the approve gate", () => {
  test("null / undefined contract grades as empty and never blocks", () => {
    for (const input of [null, undefined, {} as Pick<OutcomeContract, "success_metrics">]) {
      const g = gradeOutcomeContract(input);
      expect(g.verdict).toBe("empty");
      expect(g.blocksApproval).toBe(false);
      expect(g.total).toBe(0);
    }
  });

  test("all metrics compiled to eval/ci is machine-checkable and does not block", () => {
    const g = gradeOutcomeContract(
      contract([clause({ oracle_kind: "eval" }), clause({ oracle_kind: "ci" })]),
    );
    expect(g.verdict).toBe("verifiable");
    expect(g.machine).toBe(2);
    expect(g.machineCheckable).toBe(true);
    expect(g.blocksApproval).toBe(false);
    expect(verifiabilityLabel(g)).toBe("Machine-checkable");
  });

  test("all metrics are UAT is human-verified, verifiable, and does not block", () => {
    const g = gradeOutcomeContract(contract([clause({ oracle_kind: "uat" })]));
    expect(g.verdict).toBe("verifiable");
    expect(g.human).toBe(1);
    expect(g.machineCheckable).toBe(false);
    expect(g.blocksApproval).toBe(false);
    expect(verifiabilityLabel(g)).toBe("Human-verified");
  });

  test("metrics present but all uncompiled (null oracle) is HAZY but does NOT block (pending != unfalsifiable)", () => {
    const g = gradeOutcomeContract(contract([clause(), clause()]));
    expect(g.verdict).toBe("hazy");
    expect(g.pending).toBe(2);
    expect(g.verifiable).toBe(0);
    // A gate refuses what it can prove is bad, not what it has not confirmed is
    // good: not-yet-compiled metrics may still be checkable, so approval is NOT
    // blocked purely on pending metrics (that would freeze fresh + legacy specs).
    expect(g.blocksApproval).toBe(false);
    expect(g.unverifiableClauses).toHaveLength(2);
    expect(g.unverifiableClauses.every((c) => c.pending)).toBe(true);
    expect(g.reason).toContain("Compile the oracles");
  });

  test("mixed pending + unfalsifiable with no verifiable is HAZY but does NOT block (a pending one may compile checkable)", () => {
    const g = gradeOutcomeContract(contract([clause(), clause({ oracle_kind: "unverifiable" })]));
    expect(g.verdict).toBe("hazy");
    expect(g.verifiable).toBe(0);
    expect(g.pending).toBe(1);
    expect(g.unfalsifiable).toBe(1);
    expect(g.blocksApproval).toBe(false);
  });

  test("metrics present but all unfalsifiable (watched assumptions) is HAZY and BLOCKS", () => {
    const g = gradeOutcomeContract(
      contract([clause({ oracle_kind: "unverifiable" }), clause({ oracle_kind: "unverifiable" })]),
    );
    expect(g.verdict).toBe("hazy");
    expect(g.unfalsifiable).toBe(2);
    expect(g.blocksApproval).toBe(true);
    expect(g.unverifiableClauses.every((c) => !c.pending)).toBe(true);
    expect(g.reason).toContain("watched assumption");
  });

  test("at least one verifiable metric alongside hazy ones is PARTIAL and does NOT block", () => {
    const g = gradeOutcomeContract(
      contract([
        clause({ oracle_kind: "eval" }),
        clause({ oracle_kind: "unverifiable" }),
        clause(),
      ]),
    );
    expect(g.verdict).toBe("partial");
    expect(g.verifiable).toBe(1);
    expect(g.blocksApproval).toBe(false);
    expect(g.unverifiableClauses).toHaveLength(2); // the unverifiable + the pending
    expect(verifiabilityLabel(g)).toBe("Partly verifiable");
  });

  test("empty success_metrics does not block (weaker signal, not a broken one)", () => {
    const g = gradeOutcomeContract(contract([]));
    expect(g.verdict).toBe("empty");
    expect(g.blocksApproval).toBe(false);
    expect(verifiabilityLabel(g)).toBe("No metric to verify");
  });

  test("superseded clauses are ignored — only standing metrics are graded", () => {
    const g = gradeOutcomeContract(
      contract([
        clause({ oracle_kind: "eval", status: "superseded" }),
        clause({ oracle_kind: "unverifiable" }),
      ]),
    );
    // Only the standing unverifiable one counts -> hazy, blocks.
    expect(g.total).toBe(1);
    expect(g.verdict).toBe("hazy");
    expect(g.blocksApproval).toBe(true);
  });

  test("a superseded-only contract grades empty (no standing metric)", () => {
    const g = gradeOutcomeContract(
      contract([clause({ oracle_kind: "eval", status: "superseded" })]),
    );
    expect(g.verdict).toBe("empty");
    expect(g.blocksApproval).toBe(false);
  });

  test("machine + human mix with no hazy is fully verifiable", () => {
    const g = gradeOutcomeContract(
      contract([clause({ oracle_kind: "eval" }), clause({ oracle_kind: "uat" })]),
    );
    expect(g.verdict).toBe("verifiable");
    expect(g.verifiable).toBe(2);
    expect(g.machineCheckable).toBe(true);
    expect(g.blocksApproval).toBe(false);
  });
});
