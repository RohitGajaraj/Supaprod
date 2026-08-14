/**
 * THE SAME APPROVAL COULD BE EXECUTED TWICE, AND THE SAME LIVE RUN REPLAYED.
 *
 * Both are one defect wearing two hats: a read that establishes a right, and a
 * write taken later that assumes the right still holds. Between them sits an
 * await, and in production that await is a merge against the GitHub API.
 *
 * WHAT THE PRODUCT DOES WHEN THIS IS OPEN. A person approves a call in
 * /approvals while a teammate approves the same call in the Govern panel. Both
 * executeApproval calls read status='approved'. Both call def.run(). If the
 * tool is studio.pr.merge the customer's pull request is merged twice; if it is
 * studio.commit the branch gets the commit twice; if it is delegate.openhands a
 * second PAID external job is dispatched. Then the second result blob
 * overwrites the first, so the audit trail keeps one of the two real
 * executions and nothing records that the other happened.
 *
 * The resume half needs no second person at all. resume-runs selects runs at
 * status='running' with a stale checkpoint every 60 seconds and the
 * compare-and-swap inside resumeAgentLoop only covered 'queued' and
 * 'waiting_approval'. Two overlapping ticks replay one checkpoint in parallel:
 * doubled model calls, doubled credit debits, doubled tool execution.
 *
 * These tests plant the interleaving rather than describing it. The fake in
 * fake-postgrest.test.ts applies filter chains to writes, so an unguarded
 * update matches the row whatever it now says and a guarded one matches
 * nothing once the other caller has moved it.
 */
import { describe, expect, test, beforeEach, afterAll, mock } from "bun:test";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { makeFakeDb, type FakeDb } from "./fake-postgrest.test";
import {
  executeApproval,
  claimApprovalDecision,
  claimApprovalExecution,
  resumeAgentLoop,
  resetRaceColumnProbes,
} from "./loop.server";
import { TOOL_REGISTRY, type ToolDef } from "./tools/registry.server";

const USER = "11111111-1111-1111-1111-111111111111";
const APPROVAL = "22222222-2222-2222-2222-222222222222";
const TOOL = "test.race.probe";

/**
 * A stand-in for studio.pr.merge: it counts its own calls and takes long enough
 * to be overlapped. Registered into the live registry because the seam under
 * test is executeApproval's ordering around def.run, not the registry itself.
 */
let toolRuns = 0;
const probeTool = {
  name: TOOL,
  description: "counts executions so a double run is visible",
  category: "write",
  argsSchema: z.object({}),
  preview: () => "probe",
  // The latency is the thing under test, not a wait for one: the window this
  // whole file is about IS the duration of the tool call, so the stub has to
  // have one. Same shape ApprovalCard.test.tsx uses to hold a button in flight.
  run: mock(async () => {
    toolRuns++;
    await new Promise((r) => setTimeout(r, 5));
    return { merged: true, at: toolRuns };
  }),
} as unknown as ToolDef;
TOOL_REGISTRY[TOOL] = probeTool;
afterAll(() => {
  delete TOOL_REGISTRY[TOOL];
});

const approvalRow = (over: Record<string, unknown> = {}) => ({
  id: APPROVAL,
  user_id: USER,
  tool_name: TOOL,
  args: {},
  agent_id: null,
  agent_slug: "builder",
  trace_id: null,
  status: "approved",
  run_id: null,
  mission_id: null,
  workspace_id: null,
  result: null,
  error: null,
  decided_at: "2026-08-14T10:00:00.000Z",
  escalation_state: "resolved",
  execution_claimed_at: null,
  ...over,
});

beforeEach(() => {
  toolRuns = 0;
  resetRaceColumnProbes();
});

describe("executeApproval: the claim is what authorizes the tool run", () => {
  test("two callers on one approved gate run the tool exactly once", async () => {
    const db = makeFakeDb({ agent_approvals: [approvalRow()] });
    const results = await Promise.allSettled([
      executeApproval(db as unknown as SupabaseClient, USER, APPROVAL),
      executeApproval(db as unknown as SupabaseClient, USER, APPROVAL),
    ]);
    // The whole point. Before the fix this is 2, and in production the second
    // one is a second merge commit on a customer's branch.
    expect(toolRuns).toBe(1);
    // And neither caller crashes: losing a race is an ordinary outcome here,
    // not an exception a person should see in a toast.
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
  });

  test("the loser says someone else has it, and does not overwrite the winner's result", async () => {
    const db = makeFakeDb({ agent_approvals: [approvalRow()] });
    const [a, b] = await Promise.all([
      executeApproval(db as unknown as SupabaseClient, USER, APPROVAL),
      executeApproval(db as unknown as SupabaseClient, USER, APPROVAL),
    ]);
    const outcomes = [a, b] as { merged?: boolean; already_handled?: boolean }[];
    expect(outcomes.filter((o) => o?.merged === true).length).toBe(1);
    expect(outcomes.filter((o) => o?.already_handled === true).length).toBe(1);
    // The stored record is the execution that really happened.
    const row = db.tables.agent_approvals[0];
    expect(row.status).toBe("executed");
    expect((row.result as { merged?: boolean } | null)?.merged).toBe(true);
  });

  test("a gate already executed is reported, not re-run and not thrown", async () => {
    const db = makeFakeDb({
      agent_approvals: [
        approvalRow({
          status: "executed",
          result: { merged: true },
          execution_claimed_at: "2026-08-14T10:00:01.000Z",
        }),
      ],
    });
    const out = (await executeApproval(db as unknown as SupabaseClient, USER, APPROVAL)) as {
      merged?: boolean;
    };
    expect(toolRuns).toBe(0);
    expect(out?.merged).toBe(true);
  });

  test("bad args are refused BEFORE the claim, so the gate is not left unrunnable", async () => {
    // Ordering matters: a claim spent on a call that can never run would strand
    // the approval at 'approved' with the claim held and nothing able to take
    // it, which is a worse failure than the one being fixed.
    const strict = { ...probeTool, argsSchema: z.object({ required: z.string() }) } as ToolDef;
    TOOL_REGISTRY[TOOL] = strict;
    try {
      const db = makeFakeDb({ agent_approvals: [approvalRow()] });
      await expect(
        executeApproval(db as unknown as SupabaseClient, USER, APPROVAL),
      ).rejects.toThrow(/Bad args/);
      expect(db.tables.agent_approvals[0].execution_claimed_at).toBeNull();
    } finally {
      TOOL_REGISTRY[TOOL] = probeTool;
    }
  });

  test("before the migration lands, the tool still runs (the guard degrades, it does not brick)", async () => {
    const db = makeFakeDb(
      { agent_approvals: [approvalRow()] },
      { missingColumns: { agent_approvals: ["execution_claimed_at"] } },
    );
    const out = (await executeApproval(db as unknown as SupabaseClient, USER, APPROVAL)) as {
      merged?: boolean;
    };
    expect(out?.merged).toBe(true);
    expect(toolRuns).toBe(1);
  });
});

describe("claimApprovalExecution", () => {
  test("only one of two concurrent claims wins", async () => {
    const db = makeFakeDb({ agent_approvals: [approvalRow()] });
    const both = await Promise.all([
      claimApprovalExecution(db as unknown as SupabaseClient, USER, APPROVAL),
      claimApprovalExecution(db as unknown as SupabaseClient, USER, APPROVAL),
    ]);
    expect(both.filter((c) => c.claimed).length).toBe(1);
  });

  test("a gate that is not approved cannot be claimed", async () => {
    const db = makeFakeDb({ agent_approvals: [approvalRow({ status: "pending" })] });
    const claim = await claimApprovalExecution(db as unknown as SupabaseClient, USER, APPROVAL);
    expect(claim.claimed).toBe(false);
  });
});

describe("claimApprovalDecision: a gate can only be decided once", () => {
  test("two decisions on one pending gate, one winner", async () => {
    const db = makeFakeDb({
      agent_approvals: [approvalRow({ status: "pending", decided_at: null })],
    });
    const both = await Promise.all([
      claimApprovalDecision(db as unknown as SupabaseClient, USER, APPROVAL, "approved"),
      claimApprovalDecision(db as unknown as SupabaseClient, USER, APPROVAL, "rejected"),
    ]);
    expect(both.filter((c) => c.claimed).length).toBe(1);
    // Whichever won, the row carries exactly one verdict and one timestamp.
    const row = db.tables.agent_approvals[0];
    expect(["approved", "rejected"]).toContain(row.status as string);
    expect(row.decided_by).toBe(USER);
  });

  test("a gate belonging to someone else is never decided", async () => {
    const db = makeFakeDb({
      agent_approvals: [approvalRow({ status: "pending", decided_at: null })],
    });
    const claim = await claimApprovalDecision(
      db as unknown as SupabaseClient,
      "99999999-9999-9999-9999-999999999999",
      APPROVAL,
      "approved",
    );
    expect(claim.claimed).toBe(false);
    expect(db.tables.agent_approvals[0].status).toBe("pending");
  });

  test("an already-decided gate reports the loss instead of re-stamping it", async () => {
    const db = makeFakeDb({
      agent_approvals: [
        approvalRow({ status: "rejected", decided_at: "2026-08-14T09:00:00.000Z" }),
      ],
    });
    const claim = await claimApprovalDecision(
      db as unknown as SupabaseClient,
      USER,
      APPROVAL,
      "approved",
    );
    expect(claim.claimed).toBe(false);
    expect(db.tables.agent_approvals[0].status).toBe("rejected");
  });
});

describe("resumeAgentLoop: a live run carries a lease", () => {
  const RUN = "33333333-3333-3333-3333-333333333333";
  const runRow = (over: Record<string, unknown> = {}) => ({
    id: RUN,
    user_id: USER,
    agent_id: "44444444-4444-4444-4444-444444444444",
    agent_slug: "builder",
    agent_name: "Studio",
    input: "ship it",
    workspace_id: null,
    status: "running",
    mission_id: null,
    mission_spend_cap_usd: null,
    mission_token_cap: null,
    model: "auto",
    created_at: "2026-08-14T09:00:00.000Z",
    last_checkpoint_at: "2026-08-14T09:50:00.000Z",
    resume_lease_at: "-infinity",
    attempt: null,
    resume_count: null,
    ...over,
  });
  const agentRow = {
    id: "44444444-4444-4444-4444-444444444444",
    user_id: USER,
    slug: "builder",
    name: "Studio",
    role: "builder",
    system_prompt: "build",
    max_tool_risk: "low",
  };

  test("a run already leased by another worker is not resumed at all", async () => {
    const db = makeFakeDb({
      agent_runs: [runRow({ resume_lease_at: new Date().toISOString() })],
      agents: [agentRow],
    });
    const res = await resumeAgentLoop(db as unknown as SupabaseClient, RUN);
    expect(res.claim_lost).toBe(true);
    // The proof that it stopped BEFORE doing the work: replaying a checkpoint
    // is the first thing a resume does, and it never read one.
    expect(db.statements.some((s) => s.table === "agent_run_checkpoints")).toBe(false);
  });

  test("an expired lease is reclaimable, so an evicted worker does not strand the run", async () => {
    const db = makeFakeDb({
      agent_runs: [runRow({ resume_lease_at: "2026-08-14T00:00:00.000Z" })],
      agents: [agentRow],
    });
    /**
     * KNOWN LIMITATION, NAMED RATHER THAN PAPERED OVER (2026-08-14).
     *
     * It proceeds past the lease and then fails somewhere in the loop, which is
     * not what this asserts: the lease must not be the thing stopping it, or a
     * worker that died mid-step would hold the run forever.
     *
     * BUT "somewhere in the loop" is not a place. Past the lease the loop keeps
     * going, and on a machine that HAS a `.env` carrying real Supabase
     * credentials it reaches a live call and hangs to the 5s timeout. So the
     * outcome depends on whether an untracked file exists: Lane 1 saw this fail
     * while this lane read 0 fail on the same commit, and neither number was
     * wrong. CI cannot see it, because CI has no credentials.
     *
     * TWO REPAIRS WERE TRIED AND BOTH REJECTED, which is why this is documented
     * instead of fixed in a hurry:
     *
     *   1. Racing the loop against a one second sleep. Rejected by
     *      a-timeout-is-not-a-wait.test.ts, correctly: that is a bet about the
     *      machine and is the exact idiom that guard exists to stop.
     *   2. Flushing microtasks until the lease moves. The claim does not settle
     *      on the microtask queue, so the condition never becomes true.
     *
     * THE REAL FIX is one of two things, and both are bigger than a test edit:
     * complete the fake so the loop terminates on its own, or stop the loop
     * reading process env when a client was handed to it. Filed rather than
     * rushed at session close.
     */
    await resumeAgentLoop(db as unknown as SupabaseClient, RUN).catch(() => {});
    expect(db.statements.some((s) => s.table === "agent_run_checkpoints")).toBe(true);
    expect(db.tables.agent_runs[0].resume_lease_at).not.toBe("2026-08-14T00:00:00.000Z");
  });
});
