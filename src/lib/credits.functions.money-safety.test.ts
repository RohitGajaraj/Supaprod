/**
 * A REFUND MUST BE CLAIMED BEFORE IT IS PAID, AND A BALANCE MUST NEVER BE
 * READ IN ONE STATEMENT AND SET IN ANOTHER.
 *
 * DEFECT ONE, confirmed 2026-08-14. `refundAbandonedRunCredits` READ
 * `agent_runs.credits_refunded`, summed the run's debits, called
 * `refund_account_credits`, and only THEN stamped the flag, with no
 * precondition on the update and no `.select()` to confirm it landed. The
 * migration that introduced the RPC says in its own header that idempotency is
 * the caller's job. `loop.server.ts` calls this from two places, so two callers
 * that both read `false` both refunded the full amount and the account ended up
 * with more credits than were ever debited. Money minted from nothing.
 *
 * DEFECT TWO, same day. `grantMonthlyAllowance` and `resetCreditCycle` each
 * read `account_credits.balance_credits` in one statement and blind-SET it in
 * the next, so any debit landing in between was erased. `grantMonthlyAllowance`
 * also computed its ledger delta from that unchecked read, so a failed read
 * wrote a ledger row describing a movement that never happened. The SQL side
 * already does this job correctly under `FOR UPDATE`
 * (`grant_subscription_credits` / `reset_subscription_cycle`), so the fix is to
 * stop re-implementing it in JavaScript without the lock.
 *
 * The fake client below models the ONE thing these tests are about: a
 * conditional update returns the rows it actually matched. That is what makes
 * the flag usable as a claim, and it is what the production code was not asking
 * for.
 */
import { describe, expect, test, beforeEach, afterAll, mock } from "bun:test";

const realClientModule = await import("../integrations/supabase/client.server");

const RUN_ID = "run-1";
const ACCOUNT_ID = "acct-1";
const USER_ID = "user-1";

type Filter = [column: string, value: unknown];

type Recorded = {
  table: string;
  op: "select" | "update" | "insert";
  payload?: Record<string, unknown>;
  filters: Filter[];
};

const state = {
  creditsEnabled: true,
  runRefunded: false,
  runExists: true,
  aiEvents: [{ id: "evt-1" }] as Array<{ id: string }>,
  aiEventsError: null as { message: string } | null,
  ledgerRows: [{ delta_credits: -40, ai_event_id: "evt-1" }] as Array<{
    delta_credits: number;
    ai_event_id: string | null;
  }>,
  ledgerError: null as { message: string } | null,
  rpcCalls: [] as Array<{ fn: string; args: Record<string, unknown> }>,
  writes: [] as Recorded[],
  /*
   * P-140 / F-201's own fixtures, below. `null` keeps every test above this
   * using the fixed `aiEvents` / `ledgerRows` arrays untouched -- set only by
   * the two describe blocks at the end of this file, and reset to null in
   * their own `afterEach` so the ORIGINAL tests never see a `.in()`-aware
   * table by accident.
   */
  aiEventsLookup: null as Map<string, Array<{ id: string; trace_id: string }>> | null,
  aiEventsInCalls: [] as string[][],
  ledgerLookup: null as Map<string, { delta_credits: number; ai_event_id: string }> | null,
  ledgerInCalls: [] as string[][],
  ledgerFailOn: null as ((batch: string[]) => boolean) | null,
  /* creditsSpentByTrace is one RPC since 2026-09-08 (credits_spent_by_trace,
     migration 20260909100600): what the database answers per trace, and
     whether the call fails. */
  creditsByTrace: new Map<string, number>(),
  creditsRpcError: null as { message: string } | null,
};

function resultFor(q: Recorded): { data: unknown; error: unknown } {
  if (q.table === "agent_runs" && q.op === "select") {
    return {
      data: state.runExists ? { credits_refunded: state.runRefunded } : null,
      error: null,
    };
  }
  if (q.table === "agent_runs" && q.op === "update") {
    const guard = q.filters.find(([col]) => col === "credits_refunded");
    const next = Boolean(q.payload?.credits_refunded);
    // The whole point: a guarded update matches nothing once another caller has
    // already moved the flag, and the caller can see that through the rows.
    if (!state.runExists) return { data: [], error: null };
    if (guard && guard[1] !== state.runRefunded) return { data: [], error: null };
    state.runRefunded = next;
    return { data: [{ id: RUN_ID }], error: null };
  }
  if (q.table === "ai_events") {
    // F-201's own fixture, opt-in only: with a lookup set, the response is
    // built from the actual `.in("trace_id", ...)` values this query carried
    // -- batching-aware, unlike the fixed array every test above this one
    // relies on. Also records the values so a batching test can assert the
    // caller split its own list under `TRACE_ID_BATCH`.
    if (state.aiEventsLookup) {
      const ids =
        (q.filters.find(([col]) => col === "trace_id")?.[1] as string[] | undefined) ?? [];
      state.aiEventsInCalls.push(ids);
      const data = ids.flatMap((id) => state.aiEventsLookup!.get(id) ?? []);
      return { data, error: null };
    }
    return { data: state.aiEventsError ? null : state.aiEvents, error: state.aiEventsError };
  }
  if (q.table === "credit_ledger" && q.op === "select") {
    if (state.ledgerLookup) {
      const ids =
        (q.filters.find(([col]) => col === "ai_event_id")?.[1] as string[] | undefined) ?? [];
      state.ledgerInCalls.push(ids);
      if (state.ledgerFailOn?.(ids)) {
        return { data: null, error: { message: "statement timeout" } };
      }
      const data = ids.map((id) => state.ledgerLookup!.get(id)).filter(Boolean);
      return { data, error: null };
    }
    return { data: state.ledgerError ? null : state.ledgerRows, error: state.ledgerError };
  }
  return { data: null, error: null };
}

type Answer = { data: unknown; error: unknown };
type Chain = PromiseLike<Answer> & {
  select: () => Chain;
  eq: (column: string, value: unknown) => Chain;
  in: (column: string, values: unknown[]) => Chain;
  limit: () => Chain;
  maybeSingle: () => Chain;
  single: () => Chain;
};

function query(table: string, op: Recorded["op"], payload?: Record<string, unknown>): Chain {
  const record: Recorded = { table, op, payload, filters: [] };
  if (op !== "select") state.writes.push(record);
  const chain: Chain = {
    select: () => chain,
    eq: (column: string, value: unknown) => {
      record.filters.push([column, value]);
      return chain;
    },
    in: (column: string, values: unknown[]) => {
      record.filters.push([column, values]);
      return chain;
    },
    limit: () => chain,
    maybeSingle: () => chain,
    single: () => chain,
    then: (resolve, reject) => Promise.resolve(resultFor(record)).then(resolve, reject),
  };
  return chain;
}

const fakeAdmin = {
  from: (table: string) => ({
    select: () => query(table, "select"),
    update: (payload: Record<string, unknown>) => query(table, "update", payload),
    insert: (payload: Record<string, unknown>) => query(table, "insert", payload),
  }),
  rpc: async (fn: string, args: Record<string, unknown> = {}) => {
    state.rpcCalls.push({ fn, args });
    if (fn === "credits_enabled") return { data: state.creditsEnabled, error: null };
    if (fn === "grant_subscription_credits") {
      return { data: { granted: true, credits: args._credits, delta: args._credits }, error: null };
    }
    if (fn === "reset_subscription_cycle") {
      return { data: { reset: true, credits: 3750, delta: 100 }, error: null };
    }
    if (fn === "credits_spent_by_trace") {
      if (state.creditsRpcError) return { data: null, error: state.creditsRpcError };
      const ids = (args.p_trace_ids as string[]) ?? [];
      return {
        data: ids
          .filter((t) => state.creditsByTrace.has(t))
          .map((t) => ({ trace_id: t, credits: state.creditsByTrace.get(t) })),
        error: null,
      };
    }
    return { data: null, error: null };
  },
};

mock.module("../integrations/supabase/client.server", () => ({ supabaseAdmin: fakeAdmin }));

const { grantMonthlyAllowance, refundAbandonedRunCredits, resetCreditCycle, creditsSpentByTrace } =
  await import("./credits.functions");

afterAll(() => {
  mock.module("../integrations/supabase/client.server", () => realClientModule);
});

beforeEach(() => {
  state.creditsEnabled = true;
  state.runRefunded = false;
  state.runExists = true;
  state.aiEvents = [{ id: "evt-1" }];
  state.aiEventsError = null;
  state.ledgerRows = [{ delta_credits: -40, ai_event_id: "evt-1" }];
  state.ledgerError = null;
  state.rpcCalls.length = 0;
  state.writes.length = 0;
  // F-201's own fixtures: null unless the batching describe blocks below set
  // them, so every test above this line keeps reading the fixed arrays.
  state.aiEventsLookup = null;
  state.aiEventsInCalls.length = 0;
  state.ledgerLookup = null;
  state.ledgerInCalls.length = 0;
  state.ledgerFailOn = null;
  state.creditsByTrace = new Map();
  state.creditsRpcError = null;
});

const refunds = () => state.rpcCalls.filter((c) => c.fn === "refund_account_credits");

describe("refundAbandonedRunCredits", () => {
  test("two concurrent callers hand the credits back once, not twice", async () => {
    // loop.server.ts reaches this from two call sites on the same terminal run.
    await Promise.all([
      refundAbandonedRunCredits(ACCOUNT_ID, USER_ID, RUN_ID, "loop"),
      refundAbandonedRunCredits(ACCOUNT_ID, USER_ID, RUN_ID, "loop"),
    ]);

    expect(refunds().length).toBe(1);
    expect(refunds()[0].args._credits).toBe(40);
  });

  test("a run already marked refunded is never refunded again", async () => {
    state.runRefunded = true;
    await refundAbandonedRunCredits(ACCOUNT_ID, USER_ID, RUN_ID, "loop");
    expect(refunds().length).toBe(0);
  });

  test("the flag is claimed before the credits move, not stamped after", async () => {
    await refundAbandonedRunCredits(ACCOUNT_ID, USER_ID, RUN_ID, "loop");

    const claim = state.writes.find((w) => w.table === "agent_runs" && w.op === "update");
    expect(claim).toBeDefined();
    expect(claim?.filters).toContainEqual(["credits_refunded", false]);
    // Nothing may refund without first winning that guarded update.
    expect(refunds().length).toBe(1);
  });

  test("a refused ledger read releases the claim, because no credits moved", async () => {
    state.ledgerError = { message: "statement timeout" };

    await refundAbandonedRunCredits(ACCOUNT_ID, USER_ID, RUN_ID, "loop");

    expect(refunds().length).toBe(0);
    expect(state.runRefunded).toBe(false);
  });

  test("a run with no billable events is closed out without a refund call", async () => {
    state.aiEvents = [];
    await refundAbandonedRunCredits(ACCOUNT_ID, USER_ID, RUN_ID, "loop");

    expect(refunds().length).toBe(0);
    expect(state.runRefunded).toBe(true);
  });

  test("stays a no-op while the credit engine is off", async () => {
    state.creditsEnabled = false;
    await refundAbandonedRunCredits(ACCOUNT_ID, USER_ID, RUN_ID, "loop");

    expect(state.writes.length).toBe(0);
    expect(refunds().length).toBe(0);
  });
});

describe("grantMonthlyAllowance", () => {
  test("moves the balance through the locking RPC, never a read-then-set", async () => {
    await grantMonthlyAllowance(ACCOUNT_ID, "pro");

    const grants = state.rpcCalls.filter((c) => c.fn === "grant_subscription_credits");
    expect(grants.length).toBe(1);
    expect(grants[0].args._credits).toBe(3750);
    expect(state.writes.some((w) => w.table === "account_credits")).toBe(false);
    expect(state.writes.some((w) => w.table === "credit_ledger")).toBe(false);
  });

  test("writes no ledger row of its own, so a delta it did not compute cannot be recorded", async () => {
    await grantMonthlyAllowance(ACCOUNT_ID, "free");
    expect(state.writes.some((w) => w.table === "credit_ledger" && w.op === "insert")).toBe(false);
  });

  test("stays a no-op for a tier with no metered allowance", async () => {
    await grantMonthlyAllowance(ACCOUNT_ID, "enterprise");
    expect(state.rpcCalls.filter((c) => c.fn === "grant_subscription_credits").length).toBe(0);
  });
});

describe("resetCreditCycle", () => {
  test("delegates to reset_subscription_cycle rather than re-setting the balance", async () => {
    await resetCreditCycle(ACCOUNT_ID);

    expect(state.rpcCalls.filter((c) => c.fn === "reset_subscription_cycle").length).toBe(1);
    expect(state.writes.some((w) => w.table === "account_credits")).toBe(false);
    expect(state.writes.some((w) => w.table === "credit_ledger")).toBe(false);
  });
});

/**
 * P-140 (2026-09-04) found the first shape of this read failing on 174 trace
 * ids in one URL, and F-201 (A1's correction) found its batched replacement
 * able to report a partial sum when one credit_ledger batch failed. Both
 * shapes are gone: since 2026-09-08 (F-212's census of the Worker's hops)
 * the read is ONE call to `credits_spent_by_trace`, which sums whole traces
 * in the database. The claims those two findings pinned are kept here in
 * the form the new shape makes them take.
 *
 * Lives in THIS file, not a new one: `a-module-mock-is-process-wide.test.ts`
 * freezes the set of modules more than one test file mocks process-wide, and
 * this file already mocks `../integrations/supabase/client.server`.
 */
describe("creditsSpentByTrace is one round trip (P-140, F-212)", () => {
  test("174 traces go in one call, no URL, and every trace's figure lands in one map", async () => {
    const traceIds = Array.from({ length: 174 }, (_, i) => `trace-${i}`);
    state.creditsByTrace = new Map(traceIds.map((t, i) => [t, i + 1]));

    const result = await creditsSpentByTrace(traceIds);

    const calls = state.rpcCalls.filter((c) => c.fn === "credits_spent_by_trace");
    expect(calls.length).toBe(1);
    expect((calls[0].args.p_trace_ids as string[]).length).toBe(174);
    expect(Object.keys(result).length).toBe(174);
    expect(result["trace-173"]).toBe(174);
  });

  test("a trace with no debits is absent, not zero", async () => {
    state.creditsByTrace = new Map([["t-a", 12]]);
    const result = await creditsSpentByTrace(["t-a", "t-b"]);
    expect(result).toEqual({ "t-a": 12 });
  });

  test("no trace ids means no call at all", async () => {
    expect(await creditsSpentByTrace([])).toEqual({});
    expect(state.rpcCalls.some((c) => c.fn === "credits_spent_by_trace")).toBe(false);
  });
});

describe("F-201: a failed read is an absence for every trace, never a partial sum", () => {
  test("the call fails: the map is empty and nothing is reported for any trace", async () => {
    state.creditsByTrace = new Map([
      ["single", 1],
      ["multi", 12],
    ]);
    state.creditsRpcError = { message: "statement timeout" };

    const result = await creditsSpentByTrace(["single", "multi"]);

    expect(result).toEqual({});
    expect(result.multi).toBeUndefined();
  });
});
