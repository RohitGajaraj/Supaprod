import { describe, expect, it } from "bun:test";

import { forecastRefusal } from "@/lib/decisions.functions";

/**
 * The run screen's forecast form now asks this the moment all three parts are
 * filled, instead of letting the round trip answer. These pin the behaviour the
 * form depends on, so a change to the shared rule cannot silently stop the
 * commitment moment refusing in place.
 */
const DAY = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString();

describe("a forecast refuses before you commit, not after", () => {
  const now = Date.parse("2026-08-27T12:00:00Z");

  it("refuses a horizon that has already passed, which is the case the form can hit", () => {
    const bad = forecastRefusal({
      forecast_claim: "Escalations fall",
      forecast_how_we_will_know: "Escalation rate under 10%",
      forecast_horizon_date: iso(now - 3 * DAY),
      now,
    });
    expect(bad?.path).toBe("forecast_horizon_date");
    expect(bad?.message).toContain("already passed");
  });

  it("accepts a horizon still ahead", () => {
    expect(
      forecastRefusal({
        forecast_claim: "Escalations fall",
        forecast_how_we_will_know: "Escalation rate under 10%",
        forecast_horizon_date: iso(now + 14 * DAY),
        now,
      }),
    ).toBeNull();
  });

  it("says nothing at all about an empty form", () => {
    /*
     * The form only asks once all three parts are filled. If this ever started
     * refusing the empty shape, the moat's own field would open carrying a
     * complaint about work the person has not done yet.
     */
    expect(forecastRefusal({ now })).toBeNull();
  });

  it("still guards the partial shape for every other door", () => {
    const bad = forecastRefusal({ forecast_claim: "Escalations fall", now });
    expect(bad?.path).toBe("forecast_claim");
    expect(bad?.message).toContain("all three parts");
  });

  it("treats today as already passed, because a forecast needs the outcome unknown", () => {
    // Midday UTC is the form's stated convention for a date input.
    expect(
      forecastRefusal({
        forecast_claim: "Escalations fall",
        forecast_how_we_will_know: "Escalation rate under 10%",
        forecast_horizon_date: iso(now),
        now,
      }),
    ).not.toBeNull();
  });
});
