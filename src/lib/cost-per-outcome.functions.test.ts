import { describe, it, expect } from "bun:test";
import { getCostPerOutcomeImpl, type CostPerOutcome } from "./cost-per-outcome.functions";

/**
 * Unit tests for getCostPerOutcome cost-per-outcome calculation.
 *
 * SCOPE: Tests the pure logic (getCostPerOutcomeImpl) with mocked Supabase
 * to verify outcome counting (specs, decisions, missions) and spend aggregation.
 *
 * RATIONALE: The Impl function is extracted so it can be tested independently
 * of TanStack Server Functions and the real Supabase API. Tests use a mock
 * SupabaseClient that returns controlled fixture data.
 *
 * TEST STRUCTURE:
 * 1. Mock SupabaseClient with fixture responses
 * 2. Call getCostPerOutcomeImpl(mockSupabase, userId)
 * 3. Assert returned CostPerOutcome shape and values
 */

/**
 * Helper: Create a mock Supabase client that returns fixture responses.
 *
 * The mock handles the Supabase query builder chain pattern:
 *   supabase.from(table).select(...).eq(...).gte(...) etc.
 *
 * It returns the appropriate fixture based on which table was queried.
 */
function createMockSupabase(fixture: {
  specsCount: number;
  decisionsCount: number;
  missionsCount: number;
  runs: Array<{ spend_used_usd: string }>;
  budget: { monthly_usd_used: string; monthly_usd_cap: string } | null;
}) {
  // Generic chainable builder that accepts any method and returns itself
  const createChainable = (table: string): any => {
    const chainable = {
      select: () => chainable,
      eq: () => chainable,
      gte: () => chainable,
      gt: () => chainable,
      lt: () => chainable,
      lte: () => chainable,
      order: () => chainable,
      limit: () => chainable,
      maybeSingle: async () => {
        if (table === "ai_budgets") return { error: null, data: fixture.budget };
        return { error: null, data: null };
      },
      // These are awaited in Promise.all(), so return them as thenable.
      // `onFulfilled` was typed `Function`, which accepts ANY function-like value --
      // including a zero-arg one, or a constructor -- and types its own call as
      // returning `any`, so a mis-shaped continuation here would type-check and then
      // blow up at await time. The one thing a thenable actually promises about
      // `onFulfilled` is that it takes the resolved value and returns something, and
      // `unknown` in argument position is the widest honest form of "takes the value".
      then: (onFulfilled: (value: unknown) => unknown) => {
        let result;
        if (table === "prds") result = { error: null, data: null, count: fixture.specsCount };
        else if (table === "decisions")
          result = { error: null, data: null, count: fixture.decisionsCount };
        else if (table === "missions")
          result = { error: null, data: null, count: fixture.missionsCount };
        else if (table === "agent_runs") result = { error: null, data: fixture.runs };
        else result = { error: null, data: null };
        return Promise.resolve(result).then(onFulfilled);
      },
    };
    return chainable;
  };

  return {
    from: (table: string) => createChainable(table),
  } as any; // Type assertion for mock
}

describe("getCostPerOutcomeImpl (unit, no TanStack/real Supabase)", () => {
  it("counts outcomes and aggregates spend correctly", async () => {
    const mock = createMockSupabase({
      specsCount: 5,
      decisionsCount: 3,
      missionsCount: 2,
      runs: [{ spend_used_usd: "10.50" }, { spend_used_usd: "5.25" }, { spend_used_usd: "3.00" }],
      budget: { monthly_usd_used: "150.00", monthly_usd_cap: "500.00" },
    });

    const result = await getCostPerOutcomeImpl(mock, "user-123");

    expect(result.specs).toBe(5);
    expect(result.decisions).toBe(3);
    expect(result.missions).toBe(2);
    expect(result.weekSpendUsd).toBe(18.75); // 10.50 + 5.25 + 3.00
    expect(result.monthUsedUsd).toBe(150);
    expect(result.monthCapUsd).toBe(500);
  });

  it("returns zero counts when no outcomes exist", async () => {
    const mock = createMockSupabase({
      specsCount: 0,
      decisionsCount: 0,
      missionsCount: 0,
      runs: [],
      budget: { monthly_usd_used: "0.00", monthly_usd_cap: "100.00" },
    });

    const result = await getCostPerOutcomeImpl(mock, "user-456");

    expect(result.specs).toBe(0);
    expect(result.decisions).toBe(0);
    expect(result.missions).toBe(0);
    expect(result.weekSpendUsd).toBe(0);
    expect(result.monthUsedUsd).toBe(0);
    expect(result.monthCapUsd).toBe(100);
  });

  it("handles null budget (no budget set by user)", async () => {
    const mock = createMockSupabase({
      specsCount: 2,
      decisionsCount: 1,
      missionsCount: 1,
      runs: [{ spend_used_usd: "5.00" }],
      budget: null, // User has not set a budget
    });

    const result = await getCostPerOutcomeImpl(mock, "user-789");

    expect(result.specs).toBe(2);
    expect(result.monthUsedUsd).toBe(0); // Defaults to 0
    expect(result.monthCapUsd).toBeNull(); // No cap set
  });

  it("correctly sums multiple agent runs spending", async () => {
    const mock = createMockSupabase({
      specsCount: 1,
      decisionsCount: 1,
      missionsCount: 1,
      runs: [
        { spend_used_usd: "1.11" },
        { spend_used_usd: "2.22" },
        { spend_used_usd: "3.33" },
        { spend_used_usd: "4.44" },
      ],
      budget: null,
    });

    const result = await getCostPerOutcomeImpl(mock, "user-multi-run");

    expect(result.weekSpendUsd).toBeCloseTo(11.1, 1); // 1.11 + 2.22 + 3.33 + 4.44
  });

  it("returns expected CostPerOutcome shape", async () => {
    const mock = createMockSupabase({
      specsCount: 1,
      decisionsCount: 1,
      missionsCount: 1,
      runs: [{ spend_used_usd: "1.00" }],
      budget: { monthly_usd_used: "50.00", monthly_usd_cap: "500.00" },
    });

    const result = await getCostPerOutcomeImpl(mock, "user-shape");

    // Verify the returned object has all required properties
    expect(result).toHaveProperty("specs");
    expect(result).toHaveProperty("decisions");
    expect(result).toHaveProperty("missions");
    expect(result).toHaveProperty("weekSpendUsd");
    expect(result).toHaveProperty("monthUsedUsd");
    expect(result).toHaveProperty("monthCapUsd");

    // Verify types
    expect(typeof result.specs).toBe("number");
    expect(typeof result.decisions).toBe("number");
    expect(typeof result.missions).toBe("number");
    expect(typeof result.weekSpendUsd).toBe("number");
    expect(typeof result.monthUsedUsd).toBe("number");
    expect(typeof result.monthCapUsd).toBe("number" || "object"); // number | null
  });
});

/**
 * INTEGRATION TEST SKELETON (requires real Supabase or advanced mocking)
 *
 * These would test the full createServerFn handler with TanStack context:
 *
 * 1. "getCostPerOutcome.handler calls Impl with correct context"
 *    - Render a component that calls getCostPerOutcome()
 *    - Wrap in QueryClientProvider + provide mock Supabase client
 *    - Verify Impl was invoked with userId from context
 *
 * 2. "getCostPerOutcome requires authentication"
 *    - Call getCostPerOutcome without auth context
 *    - Expect requireSupabaseAuth middleware to reject
 *
 * 3. "getCostPerOutcome returns error if any Supabase query fails"
 *    - Mock Supabase to return an error on one query
 *    - Verify the error is propagated (not swallowed)
 */
