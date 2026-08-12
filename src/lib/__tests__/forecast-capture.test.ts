import { describe, test, expect } from "bun:test";

import { forecastRefusal } from "@/lib/decisions.functions";

/**
 * FC-01: the rule that stops an unresolvable forecast being counted as one.
 *
 * WHY THIS FILE EXISTS AT ALL. Migration 20260810180000 shipped the five
 * `decisions.forecast_*` columns, the resolution CHECK and the immutability
 * trigger on 2026-08-10 under a founder ruling reading "Build now, P0", and
 * until 2026-08-11 not one line of application code referenced any of them. The
 * moat had a schema, a guard, and no writer. These tests pin the half the
 * database cannot enforce.
 *
 * `now` is injected rather than read from the clock, so the horizon cases are
 * deterministic. A test that builds a date from `Date.now()` and asserts about
 * it is a test that passes for the wrong reason on a slow machine.
 */

const NOW = Date.parse("2026-08-11T12:00:00.000Z");
const FUTURE = "2026-09-11T12:00:00.000Z";
const PAST = "2026-07-11T12:00:00.000Z";

const whole = {
  forecast_claim: "Checkout completion rises above 70 percent for returning homeowners.",
  forecast_how_we_will_know: "The weekly funnel report for returning users, four weeks after ship.",
  forecast_horizon_date: FUTURE,
  now: NOW,
};

describe("forecastRefusal: a decision may carry no forecast", () => {
  test("nothing supplied is fine, and is NOT the same as invalid", () => {
    // Deliberate: the moment the field is mandatory, people write "it will go
    // well" to get past it, which is a forecast-shaped object that settles
    // nothing. An absent forecast is honest; a vacuous one is noise in the
    // calibration record.
    expect(forecastRefusal({ now: NOW })).toBeNull();
  });

  test("an explicit null triple is also fine", () => {
    expect(
      forecastRefusal({
        forecast_claim: null,
        forecast_how_we_will_know: null,
        forecast_horizon_date: null,
        now: NOW,
      }),
    ).toBeNull();
  });
});

describe("forecastRefusal: all three or none", () => {
  test("a complete forecast passes", () => {
    expect(forecastRefusal(whole)).toBeNull();
  });

  test("a claim with no observable is refused, because it resolves as an argument", () => {
    const bad = forecastRefusal({ ...whole, forecast_how_we_will_know: undefined });
    expect(bad?.path).toBe("forecast_claim");
    expect(bad?.message).toContain("all three parts");
  });

  test("a claim with no horizon is refused, because it never comes due", () => {
    // This is the quiet one. Without a horizon the calibrator's partial index
    // idx_decisions_forecast_due never surfaces the row, so it is never graded
    // and never appears as overdue either. It would inflate the count of
    // forecasts while adding nothing that can ever be settled.
    const bad = forecastRefusal({ ...whole, forecast_horizon_date: undefined });
    expect(bad?.path).toBe("forecast_claim");
  });

  test("a horizon and an observable with no claim is refused", () => {
    expect(forecastRefusal({ ...whole, forecast_claim: undefined })).not.toBeNull();
  });

  test("exactly one field supplied is refused, whichever one it is", () => {
    for (const key of [
      "forecast_claim",
      "forecast_how_we_will_know",
      "forecast_horizon_date",
    ] as const) {
      const only = { [key]: key === "forecast_horizon_date" ? FUTURE : "x", now: NOW };
      expect(forecastRefusal(only)).not.toBeNull();
    }
  });
});

describe("forecastRefusal: the horizon must still be open", () => {
  test("a horizon already past is refused", () => {
    const bad = forecastRefusal({ ...whole, forecast_horizon_date: PAST });
    expect(bad?.path).toBe("forecast_horizon_date");
    expect(bad?.message).toContain("answer available");
  });

  test("a horizon exactly now is refused, not accepted", () => {
    // The boundary belongs on the refusing side. A window that closes at this
    // instant is not one anybody can still be wrong about.
    const bad = forecastRefusal({
      ...whole,
      forecast_horizon_date: "2026-08-11T12:00:00.000Z",
    });
    expect(bad?.path).toBe("forecast_horizon_date");
  });

  test("one second in the future is accepted", () => {
    expect(
      forecastRefusal({ ...whole, forecast_horizon_date: "2026-08-11T12:00:01.000Z" }),
    ).toBeNull();
  });

  test("the all-three rule is checked BEFORE the horizon rule", () => {
    // Order matters for the message the person reads. A lone past horizon is
    // wrong in two ways at once, and "you are missing two fields" is the more
    // actionable of the two.
    const bad = forecastRefusal({ forecast_horizon_date: PAST, now: NOW });
    expect(bad?.path).toBe("forecast_claim");
  });
});
