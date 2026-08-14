import { describe, expect, test } from "bun:test";
import { reopenForecastImpl, getForecastHistoryImpl } from "./forecast.functions";
import { suggestionQuality, AUTO_SETTLE_CONFIDENCE_FLOOR } from "./brain/forecast-resolution";

/**
 * FC-01: reopening a settled forecast.
 *
 * The tension these pin is real rather than theoretical. Letting a caller
 * overwrite a settled verdict in place would make the grade mutable, and the
 * whole feature rests on a forecast being unrevisable once the answer is known.
 * But a wrong verdict nobody may correct is also a false entry, and the surface
 * refusing to let anyone fix it does not make the record more honest.
 *
 * The resolution is that reopening APPENDS. Everything below asserts that the
 * prior verdict survives.
 */

type Captured = { logged?: Record<string, unknown>; patch?: Record<string, unknown> };

function db(
  current: Record<string, unknown> | null,
  captured: Captured,
  opts: { logFails?: boolean; clearedRows?: unknown[] } = {},
) {
  return {
    from: (table: string) => {
      if (table === "forecast_resolution_log") {
        return {
          insert: async (row: Record<string, unknown>) => {
            captured.logged = row;
            return opts.logFails ? { error: { message: "log write refused" } } : { error: null };
          },
        };
      }
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: current, error: null }),
          }),
        }),
        update: (patch: Record<string, unknown>) => {
          captured.patch = patch;
          return {
            eq: () => ({
              eq: () => ({
                select: async () => ({
                  data: opts.clearedRows ?? [{ id: "d1" }],
                  error: null,
                }),
              }),
            }),
          };
        },
      };
    },
  } as never;
}

const settled = {
  workspace_id: "w1",
  forecast_resolution: "miss",
  forecast_resolution_rationale: "Activation stayed at 12 percent.",
  forecast_resolved_at: "2026-08-13T10:00:00.000Z",
  forecast_resolved_by_agent_slug: "forecast-auditor",
};

describe("reopenForecastImpl", () => {
  test("files the prior verdict in full before clearing it", async () => {
    const c: Captured = {};
    const r = await reopenForecastImpl(
      db(settled, c),
      { decisionId: "11111111-1111-1111-1111-111111111111", reason: "The dashboard was misread." },
      "user-1",
      "2026-08-14T12:00:00.000Z",
    );
    expect(r.priorResolution).toBe("miss");
    // Verbatim, including who settled it and when. A reader disagreeing with a
    // verdict needs to see exactly what they are disagreeing with.
    expect(c.logged).toMatchObject({
      resolution: "miss",
      resolution_rationale: "Activation stayed at 12 percent.",
      resolved_at: "2026-08-13T10:00:00.000Z",
      resolved_by_agent_slug: "forecast-auditor",
      reopened_by: "user-1",
      reason: "The dashboard was misread.",
    });
  });

  test("clears the live verdict so the forecast returns to the desk", async () => {
    const c: Captured = {};
    await reopenForecastImpl(
      db(settled, c),
      { decisionId: "11111111-1111-1111-1111-111111111111", reason: "Wrong observable." },
      null,
      "2026-08-14T12:00:00.000Z",
    );
    expect(c.patch).toMatchObject({
      forecast_resolution: null,
      forecast_resolved_at: null,
      forecast_resolved_by_agent_slug: null,
      // Back on the desk now, not behind an old deferral.
      forecast_next_check_at: null,
    });
  });

  /**
   * THE ORDER IS THE SAFETY PROPERTY, and this is the test that proves it.
   * Clearing first and logging second would lose the verdict entirely on exactly
   * this failure, which is the one outcome the whole design exists to prevent.
   */
  test("a failed history write leaves the verdict untouched", async () => {
    const c: Captured = {};
    await expect(
      reopenForecastImpl(
        db(settled, c, { logFails: true }),
        { decisionId: "11111111-1111-1111-1111-111111111111", reason: "Nope." },
        null,
        "2026-08-14T12:00:00.000Z",
      ),
    ).rejects.toThrow(/could not be filed.*nothing was lost/);
    // The clear never ran.
    expect(c.patch).toBeUndefined();
  });

  test("refuses a forecast that carries no verdict", async () => {
    const c: Captured = {};
    await expect(
      reopenForecastImpl(
        db({ ...settled, forecast_resolution: null }, c),
        { decisionId: "11111111-1111-1111-1111-111111111111", reason: "x" },
        null,
        "2026-08-14T12:00:00.000Z",
      ),
    ).rejects.toThrow(/no verdict to reopen/);
    expect(c.logged).toBeUndefined();
  });

  test("a lost race is reported, not silently swallowed", async () => {
    // Somebody reopened it between the read and the write, so the guarded
    // update matches nothing.
    const c: Captured = {};
    await expect(
      reopenForecastImpl(
        db(settled, c, { clearedRows: [] }),
        { decisionId: "11111111-1111-1111-1111-111111111111", reason: "x" },
        null,
        "2026-08-14T12:00:00.000Z",
      ),
    ).rejects.toThrow(/did not move/);
  });

  test("an unknown decision changes nothing", async () => {
    const c: Captured = {};
    await expect(
      reopenForecastImpl(
        db(null, c),
        { decisionId: "11111111-1111-1111-1111-111111111111", reason: "x" },
        null,
        "2026-08-14T12:00:00.000Z",
      ),
    ).rejects.toThrow(/could not find that decision/);
  });
});

describe("getForecastHistoryImpl", () => {
  test("fails soft, because the desk must stand before the migration lands", async () => {
    const failing = {
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => ({ limit: async () => ({ data: null, error: { message: "no table" } }) }),
          }),
        }),
      }),
    } as never;
    expect(await getForecastHistoryImpl(failing, "d1")).toEqual({ history: [] });
  });
});

/**
 * THREE STATES, NOT A BOOLEAN. parseAuditReply coerces an unparseable reply to
 * `{verdict:"inconclusive", rationale:"", confidence:0}`, which renders
 * identically to a considered judgment that genuinely could not settle the
 * claim. Those are opposites, and collapsing them teaches people to distrust the
 * drafts worth reading.
 */
describe("suggestionQuality", () => {
  test("a confident verdict is a considered judgment", () => {
    expect(
      suggestionQuality({
        verdict: "hit",
        rationale: "Activation cleared 22 percent.",
        confidence: 0.9,
      }),
    ).toBe("considered");
  });

  test("the floor is the boundary, and it is shared with auto-settle", () => {
    expect(
      suggestionQuality({
        verdict: "hit",
        rationale: "x",
        confidence: AUTO_SETTLE_CONFIDENCE_FLOOR,
      }),
    ).toBe("considered");
    expect(
      suggestionQuality({
        verdict: "hit",
        rationale: "x",
        confidence: AUTO_SETTLE_CONFIDENCE_FLOOR - 0.01,
      }),
    ).toBe("low-confidence");
  });

  test("the shape a corrected reply produces is no answer at all", () => {
    // Exactly what parseAuditReply writes when it had to correct the model.
    expect(suggestionQuality({ verdict: "inconclusive", rationale: "", confidence: 0 })).toBe(
      "no-answer",
    );
  });

  test("a genuine inconclusive with reasoning is NOT the same as no answer", () => {
    expect(
      suggestionQuality({
        verdict: "inconclusive",
        rationale: "The cohort data never arrived, so the observable cannot settle it.",
        confidence: 0.8,
      }),
    ).toBe("considered");
  });

  test("an absent verdict is no answer", () => {
    expect(suggestionQuality({ verdict: null, rationale: "x", confidence: 0.9 })).toBe("no-answer");
  });

  test("a non-finite confidence is treated as none rather than trusted", () => {
    expect(suggestionQuality({ verdict: "hit", rationale: "", confidence: NaN })).toBe("no-answer");
  });
});
