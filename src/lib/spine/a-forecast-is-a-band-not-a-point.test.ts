/**
 * A FORECAST IS A BAND, NOT A POINT — gap #15.
 *
 * The finding underneath the gap is worse than "no band": `decisions` carried
 * eleven `forecast_*` columns and **not one held a number**. A forecast was
 * prose plus a deadline, so the grader could only ask a model to judge a
 * sentence — which is why it has processed zero workspaces in its life (F-51).
 *
 * These assert the two things a band has to get right: **`unknown` whenever it
 * cannot answer**, and **a thin band never opens work**.
 */
import { describe, expect, it } from "bun:test";

import {
  bandFor,
  bandIsWellFounded,
  thinBandNote,
  tierActionFor,
  MIN_OBSERVATIONS_FOR_A_BAND,
  type ForecastBand,
} from "./forecast-band";

/** Abandonment: 5% is on-track, 8% is drifting, worse is missed. */
const lower: ForecastBand = {
  direction: "lower-is-better",
  driftingAt: 5,
  missedAt: 8,
  observations: 12,
};
/** Conversion: 12% is on-track, 9% is drifting, worse is missed. */
const higher: ForecastBand = {
  direction: "higher-is-better",
  driftingAt: 12,
  missedAt: 9,
  observations: 12,
};

describe("where a reading lands", () => {
  it("reads a lower-is-better metric in all three bands", () => {
    expect(bandFor(4.2, lower)).toBe("on-track");
    expect(bandFor(6.5, lower)).toBe("drifting");
    expect(bandFor(31, lower)).toBe("missed");
  });

  it("reads a higher-is-better metric in all three bands", () => {
    expect(bandFor(14, higher)).toBe("on-track");
    expect(bandFor(10, higher)).toBe("drifting");
    expect(bandFor(2, higher)).toBe("missed");
  });

  it("the boundaries themselves are the KINDER band, not the harsher one", () => {
    // A reading exactly on the line has not crossed it. Grading it as the worse
    // band would make the threshold mean something different from what it says.
    expect(bandFor(5, lower)).toBe("on-track");
    expect(bandFor(8, lower)).toBe("drifting");
    expect(bandFor(12, higher)).toBe("on-track");
    expect(bandFor(9, higher)).toBe("drifting");
  });
});

describe("UNKNOWN is a real answer and is never on-track", () => {
  it("no reading", () => {
    expect(bandFor(null, lower)).toBe("unknown");
    expect(bandFor(undefined, lower)).toBe("unknown");
    expect(bandFor(Number.NaN, lower)).toBe("unknown");
    expect(bandFor(Number.POSITIVE_INFINITY, lower)).toBe("unknown");
  });

  it("no direction — and this is why direction is a column rather than inferred", () => {
    // Inferring it from predicted-vs-baseline is wrong exactly when the two are
    // equal, which is a real forecast: "hold the line".
    expect(bandFor(4, { ...lower, direction: null })).toBe("unknown");
  });

  it("a missing threshold", () => {
    expect(bandFor(4, { ...lower, driftingAt: null })).toBe("unknown");
    expect(bandFor(4, { ...lower, missedAt: null })).toBe("unknown");
  });

  it("THRESHOLDS ORDERED THE WRONG WAY are malformed, not merely odd", () => {
    /*
     * For lower-is-better, `missedAt` must be the larger number. If it is not,
     * the band contradicts its own direction and answering from it would invent
     * a verdict. F-76: not knowing and being fine are different values.
     */
    expect(bandFor(4, { ...lower, driftingAt: 8, missedAt: 5 })).toBe("unknown");
    expect(bandFor(14, { ...higher, driftingAt: 9, missedAt: 12 })).toBe("unknown");
  });
});

describe("a band has to say how well founded it is", () => {
  it("is well founded at the threshold and above", () => {
    expect(bandIsWellFounded({ ...lower, observations: MIN_OBSERVATIONS_FOR_A_BAND })).toBe(true);
    expect(bandIsWellFounded({ ...lower, observations: MIN_OBSERVATIONS_FOR_A_BAND - 1 })).toBe(
      false,
    );
  });

  it("NOBODY COUNTED is different from COUNTED AND THIN, and says so", () => {
    expect(thinBandNote({ ...lower, observations: null })).toContain("Nobody recorded");
    expect(thinBandNote({ ...lower, observations: 1 })).toContain("single reading");
    expect(thinBandNote({ ...lower, observations: 2 })).toContain("fewer than");
  });

  it("says nothing when it is well founded, rather than reassuring", () => {
    expect(thinBandNote(lower)).toBeNull();
  });
});

describe("what the system DOES, which is the half we never had", () => {
  it("on-track logs; drifting diagnoses READ-ONLY; missed opens work", () => {
    expect(tierActionFor("on-track", lower)).toBe("log");
    expect(tierActionFor("drifting", lower)).toBe("diagnose");
    expect(tierActionFor("missed", lower)).toBe("open-work");
  });

  it("drifting does NOT open work, and that is the distinction worth keeping", () => {
    // A drift that opens a change every time trains a person to ignore it.
    expect(tierActionFor("drifting", lower)).not.toBe("open-work");
  });

  it("A THIN BAND NEVER OPENS WORK — the tier firing on noise is what deletes the feature", () => {
    const thin = { ...lower, observations: 1 };
    expect(tierActionFor("missed", thin)).toBe("log");
    expect(tierActionFor("drifting", thin)).toBe("log");
    // It still logs, because recording that something moved costs nothing and
    // is true. What it must not do is spend a person's attention on it.
    expect(tierActionFor("missed", thin)).not.toBe("open-work");
  });

  it("unknown does nothing at all, and does not quietly log a verdict it does not have", () => {
    expect(tierActionFor("unknown", lower)).toBe("none");
  });
});
