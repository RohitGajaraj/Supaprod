/**
 * AN EMPTY ACCOUNT MUST NOT COUNT AGAINST AN AGENT.
 *
 * Measured in production 2026-08-22, and it is the entire dataset rather than a
 * skew: `agent_runs.failure_kind` has ONE distinct value in its whole history,
 * `model_error`, across 389 rows, and all 389 carry the credit-refusal
 * sentence. Not one genuine model failure has ever been recorded. On `status`
 * it is the same: 584 of 588 `failed` runs -- 99.3% -- are the account being
 * empty.
 *
 * The consequence is not a dashboard nuisance. `computeAllAgentTrust` counts
 * `status === "completed"`, so every other status counts against the agent, and
 * an agent's autonomy ladder was being driven by the workspace's credit
 * balance. An agent that did nothing wrong, on a run that never started, lost
 * ground it then had to earn back.
 *
 * `GovernanceHaltError` already models a run stopped by a boundary rather than
 * by a fault. A spend cap biting and a credit pool emptying are the same event
 * at two scopes, so they get the same treatment.
 *
 * These are source assertions rather than behavioural ones because
 * `runAgentLoop` needs a live provider, a workspace and a Supabase client to
 * reach its own catch block. What they pin is the ORDER and the STATUS, which
 * is the whole of the defect: the generic path below writes `failed`, so a
 * branch that lands after it, or writes the wrong status, restores it exactly.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SRC = readFileSync(join(import.meta.dir, "loop.server.ts"), "utf8");
const AT = SRC.indexOf("e instanceof CreditExhaustedError");
const BODY = AT > -1 ? SRC.slice(AT, AT + 1800) : "";

describe("running out of money is a halt, not a failure", () => {
  it("the loop names the error at all", () => {
    // It extends Error rather than GovernanceHaltError, and this file never
    // mentioned it, which is precisely why it fell through to the generic path.
    expect(SRC).toMatch(/import\s*\{[^}]*CreditExhaustedError/s);
  });

  it("marks the run halted, and never failed", () => {
    expect(AT).toBeGreaterThan(-1);
    expect(BODY).toContain('status: "halted"');
    expect(BODY).not.toContain('status: "failed"');
    expect(BODY).toContain("halted_reason");
  });

  it("refunds the draw, because a run that never started delivered nothing", () => {
    expect(BODY).toContain("refundIfAbandoned");
  });

  it("is reached BEFORE the generic failure path, or it never runs", () => {
    expect(AT).toBeGreaterThan(-1);
    const generic = SRC.indexOf('status: "failed"', AT);
    expect(generic).toBeGreaterThan(AT);
  });

  it("stores the taxonomy, not the sentence", () => {
    // `halted_reason` is grouped by a reader; the human wording lives in `output`.
    expect(BODY).toMatch(/halted_reason:\s*reason/);
    expect(BODY).not.toMatch(/halted_reason:\s*e\.message/);
  });
});
