/**
 * THE DEFECT THIS FILE EXISTS TO PREVENT.
 *
 * `agent_memory` has held ZERO rows of kind "outcome" since the table existed,
 * and "outcome" is the kind every precedent path filters on. The only automatic
 * writer of those rows is this sweep: `runOutcomeReviews` -> `applyOutcome` ->
 * `rememberOutcome`. It drew its candidates from `launch_plans.check_by` alone,
 * and NOTHING ON THE SHIP PATH CREATES A LAUNCH PLAN — the merge stamp writes
 * `prds.shipped_at` and no plan, and the production promote that does arm one is
 * unreachable on a customer's own repo, which is why the merge stamp exists at
 * all. So a spec could ship and never once be looked at by the agent whose whole
 * job is to look at it.
 *
 * Measured on production the day these tests were written: 7 rows carry
 * `shipped_at`, there are exactly 7 launch plans, every one of their `check_by`
 * values is in the FUTURE, and the hourly cron had run clean and empty for
 * weeks. The queue a human reads (`listPendingOutcomes`) had already been
 * widened to the union of both populations; this sweep had not, which inverted
 * the invariant that queue is written to hold — it may not show a reason the
 * sweep did not act on.
 *
 * The first test here fails on the old code by returning zero reviews. The rest
 * pin the properties that must NOT loosen because the population widened:
 * nothing settles more easily, one settlement per spec, and a workspace that
 * switched the routine off is still not swept.
 */
import { describe, test, expect, afterAll, mock } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";

// Captured BEFORE the mock is installed so `afterAll` can put the real module
// back: bun's module mocks are process-wide and this file shares a process with
// the suites that exercise the genuine outcome path.
const realOutcome = await import("@/lib/outcome.functions");

type ApplyCall = { userId: string; prdId: string; verdict: string; by: unknown };
let applyCalls: ApplyCall[] = [];
let draftCalls = 0;

mock.module("@/lib/outcome.functions", () => ({
  ...realOutcome,
  applyOutcome: async (
    _db: unknown,
    userId: string,
    data: { prdId: string; verdict: string; by: unknown },
  ) => {
    applyCalls.push({ userId, prdId: data.prdId, verdict: data.verdict, by: data.by });
    return { learning: { id: "learn-1" }, memory_id: "mem-1", memory_error: null };
  },
  // No AI key in a unit test. Throwing is the real "model unavailable" path and
  // makes the deterministic skeleton stand in, which is what we want to assert.
  draftOutcomeVerdict: async () => {
    draftCalls++;
    throw new Error("no model in tests");
  },
  decidingAgentSlug: async () => null,
  agentArc: async () => "trusted",
}));

const { runOutcomeReviews } = await import("@/lib/ai/outcome-review.server");

const NOW = new Date("2026-08-05T18:00:00.000Z");
const SHIPPED_PRD = "aaaaaaaa-1111-4111-8111-111111111111";
const WINDOW_PRD = "bbbbbbbb-2222-4222-8222-222222222222";

type Row = Record<string, unknown>;

/**
 * Minimal Supabase stand-in. Every filter method is chainable and the builder is
 * thenable, so `await q.order().limit()` resolves to a list while
 * `await q.maybeSingle()` resolves to a single row — which is exactly how the
 * sweep tells its two `prds` reads (the candidate list and the per-spec read)
 * and its two `workspaces` reads (the policy batch and the owner lookup) apart.
 */
function fakeDb(opts: {
  launchPlans?: Row[];
  /** Rows the `prds` candidate query returns (shipped, no outcome). */
  shippedPrds?: Row[];
  prdById?: Record<string, Row | null>;
  /** Rows of `workspace_routine_prefs` with the routine switched OFF. */
  routineOff?: Row[];
  /** Existing `learnings` rows, i.e. specs already settled. */
  learnings?: Row[];
}) {
  const seen: Array<{ table: string; ops: Array<[string, unknown[]]> }> = [];

  const from = (table: string) => {
    const ops: Array<[string, unknown[]]> = [];
    seen.push({ table, ops });

    const listData = (): unknown[] => {
      switch (table) {
        case "launch_plans":
          return opts.launchPlans ?? [];
        case "prds":
          return opts.shippedPrds ?? [];
        case "workspace_routine_prefs":
          return opts.routineOff ?? [];
        case "learnings":
          return opts.learnings ?? [];
        default:
          // `workspaces` (the autonomy-policy batch) and `opportunities` (theme
          // siblings) both read as "nothing stated", which is the shipped bar.
          return [];
      }
    };

    const singleData = (): unknown => {
      switch (table) {
        case "prds": {
          const eq = ops.find(([n, a]) => n === "eq" && a[0] === "id");
          return opts.prdById?.[String(eq?.[1][1] ?? "")] ?? null;
        }
        case "workspaces":
          return { owner_id: "owner-1" };
        default:
          return null;
      }
    };

    const builder: Record<string, unknown> = {
      then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
        Promise.resolve({ data: listData(), error: null }).then(res, rej),
      maybeSingle: async () => ({ data: singleData(), error: null }),
      single: async () => ({ data: singleData(), error: null }),
    };
    for (const m of ["select", "not", "is", "eq", "in", "lte", "gte", "filter", "order", "limit"]) {
      builder[m] = (...args: unknown[]) => {
        ops.push([m, args]);
        return builder;
      };
    }
    return builder;
  };

  return { client: { from } as unknown as SupabaseClient, seen };
}

/** A spec that merged and was stamped shipped. No launch plan: the merge stamp
 *  does not create one, and no other reachable writer does either. */
const shippedSpecRow = (over: Row = {}): Row => ({
  id: SHIPPED_PRD,
  title: "Inline approvals",
  user_id: "user-1",
  workspace_id: "ws-1",
  opportunity_id: null,
  shipped_at: "2026-07-20T10:00:00.000Z",
  outcome: null,
  outcome_suggestion: null,
  contract: null,
  ...over,
});

/** The RF-01 suggestion outcome-tick drafts for a shipped spec, carrying a
 *  number that was actually read. This is what lets a verdict clear the gates. */
const readMetricSuggestion = {
  verdict: "validated",
  summary: "Approvals cleared in a day instead of five.",
  confidence_tier: "high",
  metric_label: "Median approval time",
  metric_value: "1.1 days",
  basis: {
    data_days: 30,
    sample_users: 12,
    has_shipped_changeset: true,
    has_prediction: true,
  },
};

const reset = () => {
  applyCalls = [];
  draftCalls = 0;
};

afterAll(() => {
  mock.module("@/lib/outcome.functions", () => realOutcome);
});

describe("runOutcomeReviews: a shipped spec is reviewed even with no launch plan", () => {
  test("reaches a decision on a spec whose only fact is that it shipped", async () => {
    reset();
    const { client } = fakeDb({
      launchPlans: [],
      shippedPrds: [{ id: SHIPPED_PRD, workspace_id: "ws-1" }],
      prdById: { [SHIPPED_PRD]: shippedSpecRow() },
    });

    const r = await runOutcomeReviews(client, NOW);

    // THE REGRESSION. On the old code there were no launch plans, so the sweep
    // returned early and this was 0 — which is why the moat stayed empty while
    // the cron reported success every hour.
    expect(r.reviewed).toBe(1);
    expect(r.settled + r.escalated).toBe(1);
  });

  test("settles it and calls applyOutcome, the only path to an outcome memory", async () => {
    reset();
    const { client } = fakeDb({
      launchPlans: [],
      shippedPrds: [{ id: SHIPPED_PRD, workspace_id: "ws-1" }],
      prdById: {
        [SHIPPED_PRD]: shippedSpecRow({ outcome_suggestion: readMetricSuggestion }),
      },
    });

    const r = await runOutcomeReviews(client, NOW);

    expect(r.settled).toBe(1);
    expect(r.escalated).toBe(0);
    expect(applyCalls).toHaveLength(1);
    expect(applyCalls[0].prdId).toBe(SHIPPED_PRD);
    expect(applyCalls[0].verdict).toBe("validated");
    // The owner of the workspace, not the spec's author: the learning lands
    // under the identity the Historian bills against, same as the RF-01 pass.
    expect(applyCalls[0].userId).toBe("owner-1");
    // A drafted suggestion is reused rather than re-asking the model hourly.
    expect(draftCalls).toBe(0);
  });

  test("widening the population does not lower the bar: no metric still escalates", async () => {
    reset();
    const { client } = fakeDb({
      launchPlans: [],
      shippedPrds: [{ id: SHIPPED_PRD, workspace_id: "ws-1" }],
      prdById: { [SHIPPED_PRD]: shippedSpecRow() },
    });

    const r = await runOutcomeReviews(client, NOW);

    expect(r.escalated).toBe(1);
    expect(r.settled).toBe(0);
    // An escalation writes NOTHING on purpose, so the spec stays in the human
    // queue and comes back next tick with whatever evidence has arrived.
    expect(applyCalls).toHaveLength(0);
  });

  test("a spec that already has a learning is not settled twice", async () => {
    reset();
    const { client } = fakeDb({
      launchPlans: [],
      shippedPrds: [{ id: SHIPPED_PRD, workspace_id: "ws-1" }],
      prdById: {
        [SHIPPED_PRD]: shippedSpecRow({ outcome_suggestion: readMetricSuggestion }),
      },
      learnings: [{ prd_id: SHIPPED_PRD }],
    });

    const r = await runOutcomeReviews(client, NOW);

    expect(r.reviewed).toBe(0);
    expect(applyCalls).toHaveLength(0);
  });

  test("a workspace that switched the outcome routine off is still not swept", async () => {
    reset();
    const { client } = fakeDb({
      launchPlans: [],
      shippedPrds: [{ id: SHIPPED_PRD, workspace_id: "ws-1" }],
      prdById: {
        [SHIPPED_PRD]: shippedSpecRow({ outcome_suggestion: readMetricSuggestion }),
      },
      routineOff: [{ workspace_id: "ws-1", enabled: false }],
    });

    const r = await runOutcomeReviews(client, NOW);

    expect(r.reviewed).toBe(0);
    expect(applyCalls).toHaveLength(0);
  });

  test("a lapsed launch-plan window still works, and a spec in both halves is reviewed once", async () => {
    reset();
    const { client } = fakeDb({
      launchPlans: [
        {
          prd_id: WINDOW_PRD,
          workspace_id: "ws-1",
          check_by: "2026-08-01T00:00:00.000Z",
          success_metric: "Median approval time",
        },
        {
          prd_id: SHIPPED_PRD,
          workspace_id: "ws-1",
          check_by: "2026-08-02T00:00:00.000Z",
          success_metric: "Median approval time",
        },
      ],
      // SHIPPED_PRD appears in BOTH halves; it must not be reviewed twice.
      shippedPrds: [{ id: SHIPPED_PRD, workspace_id: "ws-1" }],
      prdById: {
        [WINDOW_PRD]: shippedSpecRow({ id: WINDOW_PRD, shipped_at: null }),
        [SHIPPED_PRD]: shippedSpecRow({ outcome_suggestion: readMetricSuggestion }),
      },
    });

    const r = await runOutcomeReviews(client, NOW);

    expect(r.reviewed).toBe(2);
    expect(applyCalls.map((c) => c.prdId).sort()).toEqual([SHIPPED_PRD, WINDOW_PRD].sort());
  });
});
