/**
 * THIRTEEN RUNS WAITING ON A QUESTION THAT HAD BEEN ANSWERED.
 *
 * Counted live at 06:01 UTC on 2026-09-04: fourteen `waiting_approval` runs,
 * thirteen with no pending approval. Their gates were cancelled, expired,
 * failed, and in one case approved and executed two days earlier -- the tool
 * ran, the change landed, and the run that asked never heard.
 *
 * Four things kept it that way, and each has a guard here.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import {
  GATE_STILL_HOLDS,
  gateHasBeenAnswered,
  stillHeldByAGate,
} from "@/lib/ai/a-decided-gate-releases-its-run";
import {
  CI_GATED_TOOLS,
  failingCheckNames,
  refusalForRaisingOverRedChecks,
} from "@/lib/ai/a-gate-nobody-can-answer-is-not-raised";

const strip = (f: string) =>
  readFileSync(f, "utf8")
    /* Comments first: these explanations quote the shapes they forbid. */
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ");

describe("which approval states still hold a run", () => {
  it("undecided and decided-but-unrun both hold", () => {
    // `approved` still holds: the tool fires in executeApproval, so a run let
    // go here would resume alongside its own tool call.
    expect(stillHeldByAGate(["pending"])).toBe(true);
    expect(stillHeldByAGate(["approved"])).toBe(true);
  });

  it("every terminal outcome releases, including the ones nobody chose", () => {
    for (const s of ["executed", "failed", "expired", "cancelled", "denied", "rejected"]) {
      expect(stillHeldByAGate([s]), `${s} should release the run`).toBe(false);
    }
  });

  it("one live gate among many answered ones still holds", () => {
    expect(stillHeldByAGate(["executed", "cancelled", "pending"])).toBe(true);
  });

  it("a run not at a gate is not released by this rule", () => {
    expect(gateHasBeenAnswered({ runStatus: "running", approvalStatuses: [], known: true })).toBe(
      false,
    );
  });

  it("an unreadable approvals list never releases anything", () => {
    /*
     * The one mistake here that spends somebody else's money: resuming a run
     * into a tool call a person has not answered. A failed read is not evidence
     * that nothing is pending.
     */
    expect(
      gateHasBeenAnswered({ runStatus: "waiting_approval", approvalStatuses: [], known: false }),
    ).toBe(false);
  });

  it("an answered gate releases the run it was holding", () => {
    expect(
      gateHasBeenAnswered({
        runStatus: "waiting_approval",
        approvalStatuses: ["executed"],
        known: true,
      }),
    ).toBe(true);
  });
});

describe("the resume sweep and the decision path ask the same question", () => {
  const SWEEP = strip("src/routes/api/public/hooks/resume-runs.ts");
  const GOV = strip("src/lib/governance.functions.ts");

  it("the sweep filters on the shared set, not its own literal", () => {
    expect(SWEEP).toContain("GATE_STILL_HOLDS");
    expect(SWEEP).not.toMatch(/\[\s*"pending"\s*,\s*"approved"\s*\]/);
  });

  it("a decision releases the run without waiting for the sweep", () => {
    // Both outcomes: a run is entitled to hear the answer it did not want as
    // promptly as the one it did.
    expect([...GOV.matchAll(/releaseRunIfGateAnswered\(/g)].length).toBeGreaterThanOrEqual(2);
  });

  it("the sweep treats a failed approvals read as blocking", () => {
    expect(SWEEP).toContain("blockedErr");
  });
});

describe("a run whose agent is gone does not hold a slot", () => {
  const LOOP = strip("src/lib/ai/loop.server.ts");

  it("settles the run instead of throwing", () => {
    /*
     * THE STARVATION. `resume-runs` takes BATCH (5) `waiting_approval` runs
     * ordered `created_at ASC`. Seven rows dated 2026-07-20 with `agent_id`
     * NULL reached the throw below before the promotion, filled every slot, and
     * no run behind them was considered from July until this was fixed. The
     * tick reported ok 96,773 times.
     */
    expect(LOOP).not.toContain("throw new Error(`agent not found for run ${runId}`)");
    expect(LOOP).toContain("no longer exists, so it was cancelled instead of resumed");
  });

  it("uses the same compare-and-swap the disabled-agent branch does", () => {
    // A run that finished between the read and this write must not be reopened.
    expect(
      [...LOOP.matchAll(/\.not\("status", "in", terminalStatusFilter\(\)\)/g)].length,
    ).toBeGreaterThanOrEqual(2);
  });
});

describe("a merge gate is not raised over red checks", () => {
  /*
   * No measured instance: the gate that prompted this rose SEVEN SECONDS after
   * its checks went green, and two of us misread a two-commit-stale result. The
   * guard stands on the general rule -- `mergeReadinessFromCi` refuses a red
   * merge after the press -- rather than on that incident.
   */
  it("names the checks the seat just watched fail", () => {
    const said = refusalForRaisingOverRedChecks({
      toolName: "studio.pr.merge",
      lastChecks: {
        checks: [
          { name: "typecheck", passed: false },
          { name: "test", passed: false },
          { name: "lint", passed: false },
        ],
      },
    });
    expect(said).toContain("typecheck, test, lint");
    expect(said).toContain("already made");
  });

  it("green, pending and unreadable all still raise the gate", () => {
    /*
     * The asymmetry that makes this safe: only RED withholds. A stale red
     * costs one cycle; a stale green would be a merge on evidence nobody
     * re-read, so this file can never approve anything.
     */
    for (const lastChecks of [
      { checks: [{ name: "typecheck", passed: true }] },
      { checks: [] },
      null,
      {} as { checks?: never },
    ]) {
      expect(
        refusalForRaisingOverRedChecks({ toolName: "studio.pr.merge", lastChecks }),
      ).toBeNull();
    }
  });

  it("leaves every other gated tool alone", () => {
    expect(
      refusalForRaisingOverRedChecks({
        toolName: "studio.commit",
        lastChecks: { checks: [{ name: "test", passed: false }] },
      }),
    ).toBeNull();
    expect(CI_GATED_TOOLS.has("studio.commit")).toBe(false);
  });

  it("an unparseable result reports nothing failing rather than guessing", () => {
    expect(failingCheckNames({ checks: null })).toEqual([]);
    expect(failingCheckNames(null)).toEqual([]);
  });

  it("the loop asks before it inserts the approval", () => {
    const LOOP = strip("src/lib/ai/loop.server.ts");
    const asked = LOOP.indexOf("refusalForRaisingOverRedChecks(");
    const inserted = LOOP.indexOf('.from("agent_approvals")\n        .insert(');
    expect(asked, "the withhold check is gone; re-point this guard").toBeGreaterThan(-1);
    expect(inserted, "the approval insert moved; re-point this guard").toBeGreaterThan(-1);
    expect(asked).toBeLessThan(inserted);
  });
});

describe("a run parked at a gate is not a worker", () => {
  const TICK = strip("src/routes/api/public/hooks/ci-poll-tick.ts");

  it("the worker count excludes the gate state", () => {
    expect(TICK).toContain("OCCUPIED_BY_A_WORKER");
    expect(TICK).toContain('filter((s) => s !== "waiting_approval")');
  });

  it("and 'still alive' still includes it, because that is a different question", () => {
    expect(TICK).toContain('"queued", "running", "in_progress", "waiting_approval"');
  });

  it("no worker count reads the alive set directly any more", () => {
    // Both call sites moved; a third added later against NON_TERMINAL_RUN would
    // recreate the deadlock silently.
    expect(TICK).not.toMatch(/liveRuns\w*[\s\S]{0,200}?NON_TERMINAL_RUN/);
  });
});
