/**
 * A recorded number can bring Learn forward only when the forecast and its
 * standing metric clause name each other explicitly. Missing or ambiguous
 * linkage keeps the horizon; metric prose is never used to guess ownership.
 *
 * Opening Learn spends work, so a band must answer and have at least three
 * valid, distinct, attributable readings on that clause. Declared population
 * sizes and caller-supplied counts cannot establish that evidence.
 */
import { bandFor, bandIsWellFounded, type ForecastBand } from "./forecast-band";
import { forecastReadings } from "./forecast-readings";

/** Why Learn did or did not come forward, in a form a caller can log. */
export type LiftDecision =
  | { readonly lift: true; readonly reading: number; readonly verdict: string }
  | { readonly lift: false; readonly because: string };

const KEEPS_THE_DATE = (because: string): LiftDecision => ({ lift: false, because });

/**
 * Whether this reading settles this forecast early.
 *
 * `band` null means the forecast is prose. That is a real forecast and it waits.
 */
export function aReadingCanBringLearnForward(
  contract: unknown,
  band: ForecastBand | null,
  link: { decisionId: string | null; clauseId: string | null } = {
    decisionId: null,
    clauseId: null,
  },
): LiftDecision {
  const { reading, count } = forecastReadings(contract, link);
  if (reading === null) {
    return KEEPS_THE_DATE(
      "no attributable reading on an unambiguously linked standing clause, so the date still governs",
    );
  }
  if (!band) {
    return KEEPS_THE_DATE(
      "this forecast is prose and carries no band, so a number cannot settle it early",
    );
  }

  const recordFoundedBand = { ...band, recordedReadings: count };
  const verdict = bandFor(reading.value, recordFoundedBand);
  if (verdict === "unknown") {
    return KEEPS_THE_DATE(
      "the band cannot answer this reading, and a band that guesses is worse than no band",
    );
  }
  if (!bandIsWellFounded(recordFoundedBand)) {
    return KEEPS_THE_DATE(
      "the band rests on too few recorded readings to open work, so the reading is recorded and the date still governs",
    );
  }
  return { lift: true, reading: reading.value, verdict };
}
