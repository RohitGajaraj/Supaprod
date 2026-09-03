import { describe, it, expect } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  listDueForecastsImpl,
  settleForecastImpl,
  deferForecastCheckImpl,
  listAgentSettledForecastsImpl,
  getForecastCallRateImpl,
  FORECAST_COLS,
} from "./forecast.functions";

const NOW = "2026-08-12T12:00:00.000Z";
const NOW_MS = Date.parse(NOW);
const PAST = "2026-08-09T12:00:00.000Z";
const FUTURE = "2026-08-20T12:00:00.000Z";

type Captured = { table: string; patch: Record<string, unknown> | null; filters: string[] };

/**
 * Chainable Supabase mock for the forecast desk.
 *
 * The write chains end in `.select("id")` and refuse an empty result, because a
 * write refused by RLS RESOLVES in supabase-js rather than throwing. So the mock
 * has to model the returned rows too: a chain answering `data: null` on the happy
 * path would make every write look refused and fail the test for the opposite of
 * the real reason. This is the exact shape whose absence made an earlier pin's
 * test unreachable.
 */
function mockDb(config: {
  rows?: unknown[];
  error?: { message: string } | null;
  priorCount?: number | null;
  writeRefused?: boolean;
  captured?: Captured;
}): SupabaseClient {
  const err = config.error ?? null;
  const cap = config.captured;

  type Chain = {
    select: () => Chain;
    not: () => Chain;
    is: () => Chain;
    eq: () => Chain;
    neq: () => Chain;
    lte: () => Chain;
    or: (s: string) => Chain;
    order: () => Chain;
    limit: () => Chain;
    maybeSingle: () => Promise<{ data: unknown; error: null }>;
    then: (resolve: (v: unknown) => unknown) => Promise<unknown>;
  };

  const makeChain = (table: string, patch: Record<string, unknown> | null): Chain => {
    const chain: Chain = {
      select: () => chain,
      not: () => chain,
      is: () => chain,
      eq: () => chain,
      neq: () => chain,
      lte: () => chain,
      or: (s: string) => {
        cap?.filters.push(s);
        return chain;
      },
      order: () => chain,
      limit: () => chain,
      maybeSingle: () =>
        Promise.resolve({
          data:
            config.priorCount === null || config.priorCount === undefined
              ? null
              : { forecast_deferred_count: config.priorCount },
          error: null,
        }),
      then: (resolve: (v: unknown) => unknown) => {
        if (patch !== null && cap) {
          cap.table = table;
          cap.patch = patch;
        }
        // A write chain answers rows; a read chain answers the configured rows.
        if (patch !== null) {
          return Promise.resolve({
            data: err || config.writeRefused ? [] : [{ id: "dec-1" }],
            error: err,
          }).then(resolve);
        }
        return Promise.resolve({ data: err ? null : (config.rows ?? []), error: err }).then(
          resolve,
        );
      },
    };
    return chain;
  };

  return {
    from: (table: string) => ({
      select: (...args: unknown[]) => {
        void args;
        return makeChain(table, null);
      },
      update: (patch: Record<string, unknown>) => makeChain(table, patch),
    }),
  } as unknown as SupabaseClient;
}

const dueRow = {
  id: "dec-1",
  title: "Ship the narrow onboarding",
  forecast_claim: "Activation clears 20 percent in week one",
  forecast_how_we_will_know: "The activation panel for the cohort",
  forecast_horizon_date: PAST,
  forecast_resolution: null,
  forecast_next_check_at: null,
  forecast_deferred_count: 0,
  forecast_resolution_suggestion: null,
  workspace_id: "ws-1",
};

describe("listDueForecastsImpl (FC-01)", () => {
  it("maps a due row and reads lateness off the frozen horizon", async () => {
    const { due } = await listDueForecastsImpl(mockDb({ rows: [dueRow] }), NOW);
    expect(due).toHaveLength(1);
    expect(due[0].claim).toBe("Activation clears 20 percent in week one");
    expect(due[0].howWeWillKnow).toBe("The activation panel for the cohort");
    expect(due[0].daysLate).toBe(3);
    expect(due[0].suggestion).toBeNull();
  });

  it("exposes a drafted verdict when the tick has left one", async () => {
    const withDraft = {
      ...dueRow,
      forecast_resolution_suggestion: {
        verdict: "miss",
        rationale: "It sat at 11 percent.",
        confidence: 0.82,
      },
    };
    const { due } = await listDueForecastsImpl(mockDb({ rows: [withDraft] }), NOW);
    expect(due[0].suggestion).toEqual({
      verdict: "miss",
      rationale: "It sat at 11 percent.",
      confidence: 0.82,
      // A draft now says which of three things it is. 0.82 clears the
      // auto-settle floor, so this one is a considered judgment rather than a
      // reading or the empty shape parseAuditReply writes for a reply it had to
      // correct. Those three used to render identically.
      quality: "considered",
      /*
       * P-42. A suggestion now carries what the grader read and which of it the
       * verdict leaned on. Empty here BECAUSE this fixture is a pre-P-42 draft,
       * and that reads correctly rather than as a gap: those were graded on one
       * line of evidence, which is the defect P-42 exists to end. A draft made
       * after it carries rows.
       */
      read: [],
      cited: [],
    });
  });

  it("carries what the grader read, and which of it the verdict used", async () => {
    // The two are kept apart because "it saw nine things and leaned on two" and
    // "it saw two things" are different facts about the same verdict, and a
    // person deciding whether to accept a draft needs both.
    const withSources = {
      ...dueRow,
      forecast_resolution_suggestion: {
        verdict: "hit",
        rationale: "Completion rose, per [signal:s-1].",
        confidence: 0.9,
        read: [
          { kind: "signal", id: "s-1", line: "Completion rate rose to 62 percent" },
          { kind: "deployment", id: "dep-1", line: "succeeded to production" },
        ],
        cited: ["signal:s-1"],
      },
    };
    const { due } = await listDueForecastsImpl(mockDb({ rows: [withSources] }), NOW);
    expect(due[0].suggestion?.read.map((r) => r.id)).toEqual(["s-1", "dep-1"]);
    expect(due[0].suggestion?.cited).toEqual(["signal:s-1"]);
  });

  it("applies the pure predicate, so a deferred row cannot slip through", async () => {
    const deferred = { ...dueRow, forecast_next_check_at: FUTURE };
    const { due } = await listDueForecastsImpl(mockDb({ rows: [deferred] }), NOW);
    expect(due).toEqual([]);
  });

  /**
   * The ordering hazard. Migrations and deploys are two switches with no enforced
   * order, and PostgREST answers an unknown column with an error rather than a
   * null. Throwing here would take the whole Learn desk down, spec outcomes
   * included, because both live on one route.
   */
  it("fails soft on a MISSING COLUMN, so the desk stands before the migration lands", async () => {
    const { due } = await listDueForecastsImpl(
      mockDb({ error: { message: "column does not exist", code: "42703" } }),
      NOW,
    );
    expect(due).toEqual([]);
  });

  /*
   * THE OTHER HALF, WHICH THE ORIGINAL TEST DID NOT DISTINGUISH (F-120).
   *
   * The soft fail above is right and its reason is unchanged. But it used to
   * cover EVERY error, including a timeout or a refused read, and that half was
   * a lie with teeth: `ForecastDeskPanel` returns null when all three of its
   * reads come back empty, so a total read failure did not render an error and
   * did not render zero. The desk disappeared from the page.
   *
   * A missing column is a deployment-ordering fact. Anything else is a runtime
   * fact, and reporting zero overdue calls on the one desk whose whole purpose
   * is that overdue calls get answered is the worst place to guess.
   */
  it("but a REAL failure is raised, because an empty desk would be a claim", async () => {
    await expect(
      listDueForecastsImpl(mockDb({ error: { message: "statement timeout" } }), NOW),
    ).rejects.toThrow(/could not be read/);
  });

  it("asks for the deferral clause NULL-safely", async () => {
    const captured: Captured = { table: "", patch: null, filters: [] };
    await listDueForecastsImpl(mockDb({ rows: [], captured }), NOW);
    expect(captured.filters[0]).toBe(
      `forecast_next_check_at.is.null,forecast_next_check_at.lte.${NOW}`,
    );
  });
});

describe("settleForecastImpl (FC-01)", () => {
  it("writes the verdict and leaves no agent fingerprint", async () => {
    const captured: Captured = { table: "", patch: null, filters: [] };
    const r = await settleForecastImpl(
      mockDb({ captured }),
      { decisionId: "dec-1", resolution: "miss", rationale: "It sat at 11 percent." },
      NOW,
    );
    expect(r.ok).toBe(true);
    expect(captured.table).toBe("decisions");
    expect(captured.patch?.forecast_resolution).toBe("miss");
    expect(captured.patch?.forecast_resolved_by_agent_slug).toBeNull();
    expect(captured.patch?.forecast_resolved_at).toBe(NOW);
  });

  /**
   * Loud on writes, on purpose. A refused write RESOLVES with zero rows, and
   * reporting success over it is the defect deferOutcomeCheck was fixed for.
   */
  it("throws when the write is refused and changes nothing", async () => {
    await expect(
      settleForecastImpl(
        mockDb({ writeRefused: true }),
        { decisionId: "dec-1", resolution: "hit", rationale: "x" },
        NOW,
      ),
    ).rejects.toThrow(/rights on this decision/);
  });
});

describe("deferForecastCheckImpl (FC-01 integrity pin)", () => {
  it("moves the check date, counts the deferral, and writes no verdict", async () => {
    const captured: Captured = { table: "", patch: null, filters: [] };
    const r = await deferForecastCheckImpl(
      mockDb({ priorCount: 2, captured }),
      { decisionId: "dec-1", days: 14 },
      NOW_MS,
    );
    expect(r.checkBy).toBe("2026-08-26T12:00:00.000Z");
    expect(r.deferredCount).toBe(3);
    expect(captured.patch).not.toBeNull();
    expect("forecast_resolution" in (captured.patch ?? {})).toBe(false);
    expect("forecast_resolved_at" in (captured.patch ?? {})).toBe(false);
  });

  it("counts from zero when the forecast has never been deferred", async () => {
    const r = await deferForecastCheckImpl(
      mockDb({ priorCount: null }),
      { decisionId: "dec-1", days: 7 },
      NOW_MS,
    );
    expect(r.deferredCount).toBe(1);
  });

  it("throws when the check date did not actually move", async () => {
    await expect(
      deferForecastCheckImpl(
        mockDb({ priorCount: 0, writeRefused: true }),
        { decisionId: "dec-1", days: 14 },
        NOW_MS,
      ),
    ).rejects.toThrow(/check date did not move/);
  });
});

describe("getForecastCallRateImpl (FC-01)", () => {
  it("attributes resolved calls to the team", async () => {
    const rows = [
      { forecast_resolution: "hit" },
      { forecast_resolution: "hit" },
      { forecast_resolution: "miss" },
    ];
    const s = await getForecastCallRateImpl(mockDb({ rows }));
    expect(s.label).toBe("You called 2 of the last 3");
  });

  it("fails soft to the honest zero state on a missing column", async () => {
    const s = await getForecastCallRateImpl(
      mockDb({ error: { message: "column does not exist", code: "42703" } }),
    );
    expect(s.resolved).toBe(0);
    expect(s.label).toBe("Not enough resolved calls yet");
  });

  it("but raises a real failure, which was the most misleading of the four", async () => {
    // Summarising an EMPTY array produces a real-looking rate built on no rows,
    // so an unreadable table used to render as a confident score.
    await expect(getForecastCallRateImpl(mockDb({ error: { message: "boom" } }))).rejects.toThrow(
      /could not be read/,
    );
  });
});

describe("listAgentSettledForecastsImpl (FC-01)", () => {
  it("returns what an agent settled, so the set can be reconsidered", async () => {
    const rows = [{ id: "dec-9", forecast_resolved_by_agent_slug: "forecast-auditor" }];
    const { settled } = await listAgentSettledForecastsImpl(mockDb({ rows }));
    expect(settled).toHaveLength(1);
  });

  it("fails soft on a missing column", async () => {
    const { settled } = await listAgentSettledForecastsImpl(
      mockDb({ error: { message: "column does not exist", code: "PGRST204" } }),
    );
    expect(settled).toEqual([]);
  });

  it("but raises a real failure rather than claiming the crew settled nothing", async () => {
    await expect(
      listAgentSettledForecastsImpl(mockDb({ error: { message: "boom" } })),
    ).rejects.toThrow(/could not be read/);
  });
});

describe("FORECAST_COLS (FC-01)", () => {
  it("requests every field the desk renders", () => {
    for (const col of [
      "forecast_claim",
      "forecast_how_we_will_know",
      "forecast_horizon_date",
      "forecast_next_check_at",
      "forecast_deferred_count",
      "forecast_resolution_suggestion",
    ]) {
      expect(FORECAST_COLS).toContain(col);
    }
  });
});
