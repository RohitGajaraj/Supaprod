import {
  bandFor,
  thinBandNote,
  tierActionFor,
  type BandVerdict,
  type ForecastBand,
  type TierAction,
} from "@/lib/spine/forecast-band";

/** A recorded value and its suggested response, never an execution receipt. */
export type BandReading = {
  verdict: BandVerdict;
  /** What the system does at this verdict, per `tierActionFor`. */
  action: TierAction;
  /** The verdict in the product's plain voice. */
  says: string;
  /** Suggested response. This is not evidence that any action ran. */
  nextStep: string | null;
  /** The band's own standing, when it is thin or uncounted. */
  standing: string | null;
};

/** The verdict, in words a person would say out loud. */
const SAYS: Record<BandVerdict, string> = {
  "on-track": "The latest reading is within the expected range.",
  drifting:
    "The latest reading is outside the expected range, but has not crossed the miss threshold.",
  missed: "The latest reading has crossed the miss threshold.",
  /*
   * NOT "no data" and not "fine". The reason there is no band is the useful
   * part: a forecast recorded as a single number can only be right or wrong,
   * which is exactly what gap #15 exists to change.
   */
  unknown: "This forecast has no usable range to compare the reading against.",
};

/** A policy recommendation needs its own completed event before it can claim action. */
const NEXT: Record<TierAction, string | null> = {
  none: null,
  log: null,
  /*
   * Read-only on purpose, and the wording says so. `tierActionFor`'s own note:
   * a drift that opens a change every time trains a person to ignore it.
   */
  diagnose: "Suggested next step: investigate the drift before changing anything.",
  "open-work": "Suggested next step: open follow-up work to address the miss.",
};

/**
 * The whole reading, from the band and the number that was read.
 *
 * `reading` is the observable's current value. Null is normal and not an error:
 * nothing has probed the metric for any of the 182 forecasts on record, and
 * `bandFor` answers `unknown` for it rather than assuming.
 */
export function bandReading(reading: number | null | undefined, band: ForecastBand): BandReading {
  const verdict = bandFor(reading, band);
  const action = tierActionFor(verdict, band);
  return {
    verdict,
    action,
    says:
      typeof reading === "number" && Number.isFinite(reading)
        ? SAYS[verdict]
        : "No reading has been recorded for this forecast yet.",
    nextStep: NEXT[action],
    /*
     * The standing is suppressed on `unknown`, and that is not a gap. When
     * there is no band at all, `SAYS.unknown` has already said why; adding
     * "this band comes from 0 readings" underneath would be two sentences
     * about one absence, which is the three-copies defect this lane keeps
     * paying for.
     */
    standing: verdict === "unknown" ? null : thinBandNote(band),
  };
}

/**
 * The band's boundaries, said once, for a surface that wants to show the shape
 * rather than only the verdict. Null when there is nothing to draw.
 *
 * Deliberately NOT a chart. A two-threshold range is three numbers, and three
 * numbers read faster as a sentence than as an axis a person has to decode.
 */
export function bandShape(band: ForecastBand): string | null {
  if (bandFor(band.driftingAt, band) === "unknown") return null;
  return band.direction === "lower-is-better"
    ? `On track at or below ${band.driftingAt}. Drifting up to ${band.missedAt}. Missed above that.`
    : `On track at or above ${band.driftingAt}. Drifting down to ${band.missedAt}. Missed below that.`;
}
