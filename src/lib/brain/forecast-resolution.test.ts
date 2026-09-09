import { describe, expect, it, test } from "bun:test";
import {
  isForecastDue,
  NO_CALLS_YET,
  canAutoSettle,
  summarizeForecastCalls,
  buildDeferPatch,
  buildSettlePatch,
  dueCheckFilter,
} from "./forecast-resolution";
// Imported by the TEST only, never by the module under test, which is what keeps
// the AI runtime out of the client bundle while still pinning the string.
import { summarizeResolutions } from "./calibrate-insights.server";

const NOW = "2026-08-12T12:00:00.000Z";
const PAST = "2026-08-10T12:00:00.000Z";
const FUTURE = "2026-08-20T12:00:00.000Z";

describe("isForecastDue (FC-01)", () => {
  test("a passed horizon with no resolution is due", () => {
    expect(
      isForecastDue(
        {
          forecast_claim: "x",
          forecast_horizon_date: PAST,
          forecast_resolution: null,
          forecast_next_check_at: null,
        },
        NOW,
      ),
    ).toBe(true);
  });

  test("a future horizon is not due", () => {
    expect(
      isForecastDue(
        {
          forecast_claim: "x",
          forecast_horizon_date: FUTURE,
          forecast_resolution: null,
          forecast_next_check_at: null,
        },
        NOW,
      ),
    ).toBe(false);
  });

  test("an already resolved forecast is never due", () => {
    expect(
      isForecastDue(
        {
          forecast_claim: "x",
          forecast_horizon_date: PAST,
          forecast_resolution: "hit",
          forecast_next_check_at: null,
        },
        NOW,
      ),
    ).toBe(false);
  });

  test("a deferral into the future suppresses it without a verdict", () => {
    expect(
      isForecastDue(
        {
          forecast_claim: "x",
          forecast_horizon_date: PAST,
          forecast_resolution: null,
          forecast_next_check_at: FUTURE,
        },
        NOW,
      ),
    ).toBe(false);
  });

  test("a deferral that has itself come due is due again", () => {
    expect(
      isForecastDue(
        {
          forecast_claim: "x",
          forecast_horizon_date: PAST,
          forecast_resolution: null,
          forecast_next_check_at: PAST,
        },
        NOW,
      ),
    ).toBe(true);
  });

  test("a decision carrying no forecast is never due", () => {
    expect(
      isForecastDue(
        {
          forecast_claim: null,
          forecast_horizon_date: null,
          forecast_resolution: null,
          forecast_next_check_at: null,
        },
        NOW,
      ),
    ).toBe(false);
  });
});

describe("canAutoSettle (FC-01)", () => {
  test("settles when a person already settled the linked spec and confidence clears", () => {
    expect(canAutoSettle({ linkedOutcomeSettled: true, confidence: 0.9 })).toBe(true);
  });

  test("refuses when the linked spec outcome is not settled, however confident", () => {
    expect(canAutoSettle({ linkedOutcomeSettled: false, confidence: 0.99 })).toBe(false);
  });

  test("refuses on low confidence even with a settled linked outcome", () => {
    expect(canAutoSettle({ linkedOutcomeSettled: true, confidence: 0.4 })).toBe(false);
  });

  test("refuses when confidence is missing", () => {
    expect(canAutoSettle({ linkedOutcomeSettled: true, confidence: null })).toBe(false);
  });
});

describe("dueCheckFilter (FC-01)", () => {
  /**
   * forecast_next_check_at is NULL for every forecast nobody deferred, which is
   * the overwhelming majority. A bare .lte() drops NULLs in SQL, which would
   * narrow the desk to previously-deferred forecasts only and still look like it
   * works. The same mistake shipped twice on the spec queue; see the two
   * comments inside listPendingOutcomes.
   */
  test("admits both an unset check date and one that has come due", () => {
    expect(dueCheckFilter(NOW)).toBe(
      `forecast_next_check_at.is.null,forecast_next_check_at.lte.${NOW}`,
    );
  });

  test("the null branch comes first and is never omitted", () => {
    expect(dueCheckFilter(NOW).startsWith("forecast_next_check_at.is.null")).toBe(true);
  });
});

describe("summarizeForecastCalls (FC-01)", () => {
  test("attributes the calls to the team, not to the product", () => {
    const s = summarizeForecastCalls([
      { resolution: "hit" },
      { resolution: "hit" },
      { resolution: "miss" },
    ]);
    expect(s.resolved).toBe(3);
    expect(s.hits).toBe(2);
    /* THE IDIOM WHOLE, NEVER THE BARE VERB. "You called 2 of the last 3" reads
       as "you MADE two of the last three calls" under an eyebrow that says
       "Your calls" -- and agents make calls here too. `FORECAST_SAYS.hit` is
       "you called it", and the "it" is what makes it mean got-it-right. */
    expect(s.label).toBe("You called it on 2 of the last 3");
    expect(s.label).not.toContain("Supaprod");
  });

  test("keeps the shared honest zero state", () => {
    const s = summarizeForecastCalls([]);
    expect(s.hitRate).toBeNull();
    expect(s.label).toBe("Not enough resolved calls yet");
  });

  /**
   * The counting is duplicated rather than imported, so that this module can
   * import nothing and stay safe for the client bundle. This pins the one thing
   * that could then drift silently: the wording of the zero state.
   */
  test("the zero state still matches the insight calibrator's wording", () => {
    const shared = summarizeResolutions([], "prediction");
    expect(summarizeForecastCalls([]).label).toBe(shared.recentLabel);
  });
});

describe("a deferral writes no verdict (FC-01 integrity pin)", () => {
  test("the defer patch touches the check date and never the resolution", () => {
    const patch = buildDeferPatch({
      days: 14,
      priorCount: 2,
      nowMs: Date.parse("2026-08-12T12:00:00.000Z"),
    });
    expect(patch.forecast_next_check_at).toBe("2026-08-26T12:00:00.000Z");
    expect(patch.forecast_deferred_count).toBe(3);
    expect("forecast_resolution" in patch).toBe(false);
    expect("forecast_resolved_at" in patch).toBe(false);
    expect("forecast_resolution_rationale" in patch).toBe(false);
  });

  test("a first deferral counts from zero", () => {
    const patch = buildDeferPatch({
      days: 7,
      priorCount: 0,
      nowMs: Date.parse("2026-08-12T12:00:00.000Z"),
    });
    expect(patch.forecast_deferred_count).toBe(1);
  });
});

describe("a human settle leaves no agent fingerprint (FC-01)", () => {
  test("settling by hand records a NULL agent slug", () => {
    const patch = buildSettlePatch({
      resolution: "miss",
      rationale: "Activation sat at 11 percent through the window.",
      nowIso: NOW,
      agentSlug: null,
    });
    expect(patch.forecast_resolution).toBe("miss");
    expect(patch.forecast_resolved_by_agent_slug).toBeNull();
    expect(patch.forecast_resolved_at).toBe(NOW);
  });

  test("an agent settle is stamped, so the set stays reversible in one query", () => {
    const patch = buildSettlePatch({
      resolution: "hit",
      rationale: "The linked spec outcome was settled by a person.",
      nowIso: NOW,
      agentSlug: "forecast-auditor",
    });
    expect(patch.forecast_resolved_by_agent_slug).toBe("forecast-auditor");
  });
});

/*
 * ── THE SUMMARY MUST NOT BE READABLE AS A COUNT OF DECISIONS ──────────────
 *
 * The defect this pins is not a spelling, it is an AMBIGUITY, so it is asserted
 * as one: the sentence has to survive being read by somebody who knows that a
 * "call" in this product is a decision and that agents make them too.
 */
describe("the calibration line says got-it-right and cannot be read another way", () => {
  const rows = (hits: number, total: number) =>
    Array.from({ length: total }, (_, i) => ({ resolution: i < hits ? "hit" : "miss" }));

  it("uses the canon's own idiom, whole", () => {
    // `FORECAST_SAYS.hit` is "you called it". Two surfaces must never call one
    // thing two things, and the "it" is the half that carries the meaning.
    expect(summarizeForecastCalls(rows(6, 9)).label).toContain("called it");
  });

  it("never leaves `called` sitting directly on a number", () => {
    /*
     * THE MIRROR, AND IT IS THE ASSERTION THAT WOULD HAVE CAUGHT THE ORIGINAL.
     * "You called 6 of the last 9" parses as a count of calls made. Anything of
     * the form `called <number>` reopens that reading, whatever else the
     * sentence says.
     */
    for (const [h, t] of [
      [0, 3],
      [1, 1],
      [6, 9],
      [12, 12],
    ]) {
      const label = summarizeForecastCalls(rows(h!, t!)).label;
      expect({ h, t, ambiguous: /called\s+\d/.test(label) }).toEqual({ h, t, ambiguous: false });
    }
  });

  it("still says nothing at all before anything has resolved", () => {
    // A rate from zero observations is the claim `calibration-claim.ts` exists
    // to refuse.
    expect(summarizeForecastCalls([]).label).toBe(NO_CALLS_YET);
  });
});
