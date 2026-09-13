import { describe, it, expect } from "bun:test";
import { bandReading, bandShape } from "./forecast-band-words";
import { MIN_OBSERVATIONS_FOR_A_BAND, type ForecastBand } from "@/lib/spine/forecast-band";

const lower = (over: Partial<ForecastBand> = {}): ForecastBand => ({
  direction: "lower-is-better",
  driftingAt: 22,
  missedAt: 26,
  observations: MIN_OBSERVATIONS_FOR_A_BAND,
  recordedReadings: MIN_OBSERVATIONS_FOR_A_BAND,
  ...over,
});

describe("what the band says, and what the system did about it", () => {
  it("shows the ACTION beside the verdict, which is the half nobody has seen", () => {
    /*
     * U8: "On-track, drifting, missed -- and what the system did at each, which
     * is the half nobody has ever seen." The action is written from TierAction
     * rather than from the verdict, because the SAME verdict does different
     * things depending on whether the band is well founded, and that is the
     * distinction deciding whether a person gets interrupted.
     */
    const missed = bandReading(30, lower());
    expect(missed.verdict).toBe("missed");
    expect(missed.did).toBe("Came back as a new piece of work you can decline like any other.");

    const drift = bandReading(24, lower());
    expect(drift.verdict).toBe("drifting");
    // Read-only on purpose: a drift that opens a change every time trains a
    // person to ignore it.
    expect(drift.did).toBe("Looked into, and nothing was opened. A drift is read, not acted on.");
    expect(drift.action).toBe("diagnose");

    const ok = bandReading(20, lower());
    expect(ok.verdict).toBe("on-track");
    expect(ok.did).toBe("Recorded, and nothing was raised.");
  });

  it("a THIN band never opens work, and says why on screen", () => {
    // The same miss, on one reading instead of three. tierActionFor downgrades
    // it to log, and the standing line explains the downgrade rather than
    // leaving a person to wonder why nothing happened.
    const thin = bandReading(30, lower({ recordedReadings: 1 }));
    expect(thin.verdict).toBe("missed");
    expect(thin.action).toBe("log");
    expect(thin.did).toBe("Recorded, and nothing was raised.");
    expect(thin.standing).toBe(
      "This band comes from a single reading, so it can tell you the direction and not the size.",
    );
  });

  it("NEVER reads as fine when it cannot tell", () => {
    /*
     * F-76: not knowing and being fine are different values. forecast-band.ts
     * returns `unknown` on a missing direction or threshold rather than
     * defaulting, and the words follow it rather than softening it.
     */
    const noBand = bandReading(30, lower({ driftingAt: null, missedAt: null }));
    expect(noBand.verdict).toBe("unknown");
    expect(noBand.action).toBe("none");
    expect(noBand.did).toBeNull();
    expect(noBand.says).not.toContain("track");
    expect(noBand.says).toBe(
      "This was recorded as a single number, so it can say right or wrong and not how far off.",
    );
  });

  it("says nothing twice about one absence", () => {
    /*
     * With no band at all, `says` has already explained the absence. Adding
     * "this band comes from 0 readings" underneath would be two sentences about
     * one fact, which is the three-copies-of-one-fact defect this lane has been
     * removing all day.
     */
    const noBand = bandReading(null, lower({ driftingAt: null, missedAt: null, observations: 0 }));
    expect(noBand.standing).toBeNull();
  });

  it("covers the 182 forecasts on record today, which carry no band at all", () => {
    // Measured when the columns landed: 182 decisions have a forecast claim and
    // ZERO have a predicted value, a threshold, an observation count, a metric
    // or a direction. This is what every one of them renders as.
    const asRecordedToday = bandReading(null, {
      direction: null,
      driftingAt: null,
      missedAt: null,
      observations: null,
      recordedReadings: null,
    });
    expect(asRecordedToday.verdict).toBe("unknown");
    expect(asRecordedToday.did).toBeNull();
    expect(asRecordedToday.standing).toBeNull();
  });
});

describe("the shape of the band, when there is one", () => {
  it("reads as a sentence rather than an axis", () => {
    // Three numbers read faster as a sentence than as a chart a person decodes.
    expect(bandShape(lower())).toBe(
      "On track at or below 22. Drifting up to 26. Missed above that.",
    );
    expect(
      bandShape({ ...lower(), direction: "higher-is-better", driftingAt: 80, missedAt: 60 }),
    ).toBe("On track at or above 80. Drifting down to 60. Missed below that.");
  });

  it("draws nothing when there is no band, rather than a half one", () => {
    expect(bandShape(lower({ driftingAt: null }))).toBeNull();
    expect(bandShape(lower({ direction: null }))).toBeNull();
  });
});
