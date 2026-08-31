import {
  bandFor,
  thinBandNote,
  tierActionFor,
  type BandVerdict,
  type ForecastBand,
  type TierAction,
} from "@/lib/spine/forecast-band";

/**
 * A FORECAST READ AS A BAND, AND WHAT THE SYSTEM DID ABOUT IT. GAP #15, U8.
 *
 * `SESSION-1-THE-RUN.md` §U8: *"A forecast is a point and it should read as a
 * band. S0 builds the columns and the tick; **you build how it reads.**
 * On-track, drifting, missed — **and what the system did at each, which is the
 * half nobody has ever seen.** A band computed from too few observations must
 * say so on screen, and a tier that fires on noise is theatre, which ends the
 * feature rather than fixing it."*
 *
 * S0 shipped `src/lib/spine/forecast-band.ts` and migration
 * `20260831030000_a_forecast_is_a_band_not_a_point.sql` at ~21:00 today. **Zero
 * components read either.** This is the reading half and nothing more: every
 * judgement below is `forecast-band.ts`'s, and this file only chooses words.
 *
 * ── THE MEASUREMENT, AND IT DECIDES WHAT THIS SURFACE IS FOR ──────────────
 * Measured the minute the columns landed:
 *
 * | | |
 * | --- | --- |
 * | decisions carrying a forecast claim | **182** |
 * | with `forecast_predicted` | **0** |
 * | with either band threshold | **0** |
 * | with `forecast_observations` | **0** |
 * | with `forecast_metric` or `forecast_direction` | **0** |
 *
 * **So for all 182, `bandFor` returns `unknown` and `tierActionFor` returns
 * `none`** — correctly, because a band that guesses is worse than no band.
 *
 * **That is the content, not an obstacle.** A forecast with no band can only be
 * right or wrong; it cannot say how far off, and it cannot produce a tiered
 * response — so the miss that should have become work quietly cannot. Saying
 * that on screen for 182 forecasts is the argument for the feature, made from
 * the record rather than from a spec.
 *
 * ── WHY NOT "ON-TRACK" WHEN WE CANNOT TELL ────────────────────────────────
 * `forecast-band.ts` already refuses this and the words follow it: `unknown` is
 * a real answer and is never dressed as fine. F-76's rule — not knowing and
 * being fine are different values — and the whole reason `bandFor` returns
 * `unknown` on a missing direction rather than defaulting.
 */

export type BandReading = {
  verdict: BandVerdict;
  /** What the system does at this verdict, per `tierActionFor`. */
  action: TierAction;
  /** The verdict in the product's plain voice. */
  says: string;
  /** What the system did about it, or null where it does nothing. */
  did: string | null;
  /** The band's own standing, when it is thin or uncounted. */
  standing: string | null;
};

/** The verdict, in words a person would say out loud. */
const SAYS: Record<BandVerdict, string> = {
  "on-track": "It is tracking where we said it would.",
  drifting: "It is moving away from what we said, and it has not missed yet.",
  missed: "It went the other way.",
  /*
   * NOT "no data" and not "fine". The reason there is no band is the useful
   * part: a forecast recorded as a single number can only be right or wrong,
   * which is exactly what gap #15 exists to change.
   */
  unknown:
    "This was recorded as a single number, so it can say right or wrong and not how far off.",
};

/**
 * WHAT THE SYSTEM DID, and this is the half U8 says nobody has ever seen.
 *
 * Written from `TierAction` rather than from the verdict, because the same
 * verdict does different things depending on whether the band is well founded —
 * a missed forecast on one reading logs, and a missed forecast on three opens
 * work. **Showing the verdict without the action hides that distinction**, and
 * it is the distinction that decides whether a person is about to be
 * interrupted.
 */
const DID: Record<TierAction, string | null> = {
  none: null,
  log: "Recorded, and nothing was raised.",
  /*
   * Read-only on purpose, and the wording says so. `tierActionFor`'s own note:
   * a drift that opens a change every time trains a person to ignore it.
   */
  diagnose: "Looked into, and nothing was opened. A drift is read, not acted on.",
  "open-work": "Came back as a new piece of work you can decline like any other.",
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
    says: SAYS[verdict],
    did: DID[action],
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
  if (band.driftingAt === null || band.missedAt === null || !band.direction) return null;
  return band.direction === "lower-is-better"
    ? `On track at or below ${band.driftingAt}. Drifting up to ${band.missedAt}. Missed above that.`
    : `On track at or above ${band.driftingAt}. Drifting down to ${band.missedAt}. Missed below that.`;
}
