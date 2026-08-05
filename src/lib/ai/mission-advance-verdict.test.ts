/**
 * RF-05 verdict stamping: proof that `playbook_runs.verdict` is now written, and
 * that it is written HONESTLY.
 *
 * Before this, `verdict` was NULL on every row that had ever existed (34/34 in
 * production), so `rankPlaybooksByOutcome` returned `winRate: null` for every
 * playbook, orchestrator playbook selection silently fell back to registry
 * order, and `self-improve.functions.ts` skipped every playbook on
 * `if (ranked.winRate === null) continue`. Every "old behaviour" test below
 * pins that dead state and fails the moment the mapping stops being honest.
 */
import { expect, test, describe } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { reflectStepStatusFromRuns } from "./mission-advance.server";
import {
  classifyRunOutcome,
  rankPlaybooksByOutcome,
  verdictForPlaybookAttempt,
  VERDICT_MISSED,
  VERDICT_VALIDATED,
  type PlaybookAttemptOutcome,
} from "@/lib/playbooks/registry";

const ALL_OUTCOMES: PlaybookAttemptOutcome[] = [
  "delivered",
  "work_failed",
  "interrupted",
  "never_started",
  "abandoned",
];

describe("classifyRunOutcome: read a child run's terminal status honestly", () => {
  test("a completed run is the method delivering", () => {
    expect(classifyRunOutcome("completed")).toBe("delivered");
  });

  test("a failed run is the work this method guided not standing up", () => {
    expect(classifyRunOutcome("failed")).toBe("work_failed");
  });

  test("a halted run was STOPPED (governance, stuck-run sweeper), not judged", () => {
    expect(classifyRunOutcome("halted")).toBe("interrupted");
  });

  test("a cancelled run is abandoned, never a loss for the playbook", () => {
    expect(classifyRunOutcome("cancelled")).toBe("abandoned");
    expect(classifyRunOutcome("canceled")).toBe("abandoned");
    expect(classifyRunOutcome("stopped")).toBe("abandoned");
  });

  test("tolerates case and surrounding whitespace", () => {
    expect(classifyRunOutcome("  COMPLETED ")).toBe("delivered");
    expect(classifyRunOutcome("Failed")).toBe("work_failed");
  });

  test("an unknown, empty or missing status is no evidence, never a verdict", () => {
    // A status this code has never seen must not be turned into a number.
    for (const s of ["", "   ", "queued", "running", "weird_new_status", null, undefined]) {
      expect(verdictForPlaybookAttempt(classifyRunOutcome(s))).toBeNull();
    }
  });
});

describe("verdictForPlaybookAttempt: only what actually reflects on the method counts", () => {
  test("delivered earns the validated verdict", () => {
    expect(verdictForPlaybookAttempt("delivered")).toBe(VERDICT_VALIDATED);
  });

  test("work_failed earns the missed verdict", () => {
    expect(verdictForPlaybookAttempt("work_failed")).toBe(VERDICT_MISSED);
  });

  test("a cancelled/abandoned attempt is NO evidence: not a loss, not a win", () => {
    expect(verdictForPlaybookAttempt("abandoned")).toBeNull();
  });

  test("an interrupted attempt (governance halt, stuck sweeper) is no evidence", () => {
    expect(verdictForPlaybookAttempt("interrupted")).toBeNull();
  });

  test("an attempt that never started is no evidence", () => {
    expect(verdictForPlaybookAttempt("never_started")).toBeNull();
  });

  test("EXACTLY two outcomes are decisive — nothing else may mint a verdict", () => {
    const decisive = ALL_OUTCOMES.filter((o) => verdictForPlaybookAttempt(o) !== null);
    expect(decisive.sort()).toEqual(["delivered", "work_failed"]);
  });

  test("never emits a verdict string the ranking does not understand", () => {
    // Vocabulary drift guard: if someone renames a verdict on one side only,
    // winRate silently reverts to null and the loop stops learning again.
    for (const outcome of ALL_OUTCOMES) {
      const v = verdictForPlaybookAttempt(outcome);
      if (v === null) continue;
      const [ranked] = rankPlaybooksByOutcome("prd", [{ playbook_id: "prd-spine", verdict: v }]);
      expect(ranked.playbook.id).toBe("prd-spine");
      expect(ranked.decisive).toBe(1);
    }
  });
});

describe("the mapping makes winRate real (and the old behaviour proves it was not)", () => {
  const attemptsToRuns = (playbookId: string, outcomes: PlaybookAttemptOutcome[]) =>
    outcomes.map((o) => ({ playbook_id: playbookId, verdict: verdictForPlaybookAttempt(o) }));

  test("OLD BEHAVIOUR: unstamped runs leave winRate null and self-improve skips them", () => {
    // Exactly the shape of the 34 production rows: recorded, never stamped.
    const unstamped = Array.from({ length: 19 }, () => ({
      playbook_id: "prd-spine",
      verdict: null,
    }));
    const ranked = rankPlaybooksByOutcome("prd", unstamped);
    const spine = ranked.find((r) => r.playbook.id === "prd-spine")!;
    expect(spine.runs).toBe(19);
    expect(spine.decisive).toBe(0);
    // src/lib/self-improve.functions.ts skips on exactly this.
    expect(spine.winRate).toBeNull();
  });

  test("NEW BEHAVIOUR: the same 19 attempts, stamped, produce a real win rate", () => {
    const outcomes: PlaybookAttemptOutcome[] = [
      ...Array.from({ length: 12 }, () => "delivered" as const),
      ...Array.from({ length: 4 }, () => "work_failed" as const),
      // Three attempts the infrastructure ended. Real runs, zero evidence.
      "never_started",
      "interrupted",
      "abandoned",
    ];
    const ranked = rankPlaybooksByOutcome("prd", attemptsToRuns("prd-spine", outcomes));
    const spine = ranked.find((r) => r.playbook.id === "prd-spine")!;
    expect(spine.runs).toBe(19); // every attempt is still recorded volume
    expect(spine.decisive).toBe(16); // only the 16 that reflect on the method
    expect(spine.validated).toBe(12);
    expect(spine.winRate).toBe(0.75); // 12/16, not 12/19
  });

  test("a run of pure infrastructure failures can never invent a 0% win rate", () => {
    const ranked = rankPlaybooksByOutcome(
      "prd",
      attemptsToRuns("prd-spine", ["never_started", "interrupted", "abandoned", "never_started"]),
    );
    const spine = ranked.find((r) => r.playbook.id === "prd-spine")!;
    expect(spine.runs).toBe(4);
    expect(spine.decisive).toBe(0);
    expect(spine.winRate).toBeNull(); // honest "not enough decisive runs yet"
  });

  test("a stamped playbook outranks an untried one, which is the whole point", () => {
    const ranked = rankPlaybooksByOutcome("discovery", [
      ...attemptsToRuns("discovery-interview", ["delivered", "delivered", "delivered"]),
      ...attemptsToRuns("jtbd", ["work_failed", "work_failed"]),
    ]);
    // discovery-interview (100%) first, jtbd (0%) second, untried ones behind.
    expect(ranked[0].playbook.id).toBe("discovery-interview");
    expect(ranked[0].winRate).toBe(1);
    expect(ranked[1].playbook.id).toBe("jtbd");
    expect(ranked[1].winRate).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// The write itself: reflectStepStatusFromRuns must put the verdict on the row.
// ---------------------------------------------------------------------------

type Row = Record<string, unknown>;

function makeClient(opts: { steps: Row[]; runs: Row[] }) {
  const inserts: { table: string; row: Row }[] = [];

  function node(result: unknown): Record<string, unknown> {
    const n: Record<string, unknown> = {
      eq: () => n,
      neq: () => n,
      is: () => n,
      in: () => n,
      lt: () => n,
      order: () => n,
      limit: () => n,
      select: () => n,
      maybeSingle: async () => result,
      then: (resolve: (v: unknown) => void) => resolve(result),
    };
    return n;
  }

  const client = {
    from: (table: string) => ({
      select: (cols?: string) => {
        // hasRetryColumns probe — answer "columns present" so the retry policy
        // is exercised for real rather than degraded away.
        if (table === "mission_steps" && cols === "max_attempts") {
          return node({ data: [], error: null });
        }
        if (table === "mission_steps") return node({ data: opts.steps, error: null });
        if (table === "agent_runs") return node({ data: opts.runs, error: null });
        return node({ data: [], error: null });
      },
      // Every CAS wins, so the record path is always reached.
      update: () => node({ data: [{ id: "won" }], error: null }),
      insert: (row: Row) => {
        inserts.push({ table, row });
        return node({ data: null, error: null });
      },
    }),
  } as unknown as SupabaseClient;

  return { client, playbookRows: () => inserts.filter((i) => i.table === "playbook_runs") };
}

const step = (over: Row = {}): Row => ({
  id: "s1",
  idx: 0,
  agent_slug: "scribe",
  sub_goal: "write the spec",
  depends_on: [],
  status: "running",
  run_id: "r1",
  rationale: null,
  dispatched_at: "2026-08-05T00:00:00.000Z",
  workspace_id: "w1",
  user_id: "u1",
  // Retries already spent, so a failure terminalizes instead of requeueing.
  attempts: 2,
  max_attempts: 2,
  playbook_id: "prd-spine",
  ...over,
});

describe("reflectStepStatusFromRuns writes the verdict onto playbook_runs", () => {
  test("a completed child run records verdict 'validated' with a resolution time", async () => {
    const { client, playbookRows } = makeClient({
      steps: [step()],
      runs: [{ id: "r1", status: "completed", output: "done", halted_reason: null }],
    });
    await reflectStepStatusFromRuns(client, "m1");
    const rows = playbookRows();
    expect(rows.length).toBe(1);
    expect(rows[0].row.playbook_id).toBe("prd-spine");
    expect(rows[0].row.verdict).toBe(VERDICT_VALIDATED);
    expect(rows[0].row.resolved_at).toBeTruthy();
  });

  test("a failed child run records verdict 'missed' — the registry learns from misses", async () => {
    const { client, playbookRows } = makeClient({
      steps: [step()],
      runs: [{ id: "r1", status: "failed", output: "blew up", halted_reason: null }],
    });
    await reflectStepStatusFromRuns(client, "m1");
    const rows = playbookRows();
    expect(rows.length).toBe(1);
    expect(rows[0].row.verdict).toBe(VERDICT_MISSED);
  });

  test("a HALTED child run records the run but no verdict (stopped, not judged)", async () => {
    const { client, playbookRows } = makeClient({
      steps: [step()],
      runs: [{ id: "r1", status: "halted", output: null, halted_reason: "no checkpoint in 20m" }],
    });
    await reflectStepStatusFromRuns(client, "m1");
    const rows = playbookRows();
    expect(rows.length).toBe(1); // the volume is real
    expect(rows[0].row.verdict).toBeNull(); // the evidence is not
    expect(rows[0].row.resolved_at).toBeNull();
  });

  test("a lost dispatch records the run but no verdict — the method never ran", async () => {
    // No run_id and dispatched long ago: the worker died before enqueue.
    const { client, playbookRows } = makeClient({
      steps: [step({ status: "dispatched", run_id: null })],
      runs: [],
    });
    await reflectStepStatusFromRuns(client, "m1");
    const rows = playbookRows();
    expect(rows.length).toBe(1);
    expect(rows[0].row.verdict).toBeNull();
  });

  test("a step with no playbook bound records nothing at all", async () => {
    const { client, playbookRows } = makeClient({
      steps: [step({ playbook_id: null })],
      runs: [{ id: "r1", status: "completed", output: "done", halted_reason: null }],
    });
    await reflectStepStatusFromRuns(client, "m1");
    expect(playbookRows().length).toBe(0);
  });

  test("a still-retryable failure records nothing yet — the attempt is not over", async () => {
    const { client, playbookRows } = makeClient({
      steps: [step({ attempts: 1, max_attempts: 3 })],
      runs: [{ id: "r1", status: "failed", output: "transient", halted_reason: null }],
    });
    await reflectStepStatusFromRuns(client, "m1");
    expect(playbookRows().length).toBe(0);
  });
});
