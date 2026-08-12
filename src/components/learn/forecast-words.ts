import type { ForecastResolution } from "@/lib/brain/forecast-resolution";

/**
 * The product's three words for a forecast, in one place, for the same reason
 * verdict-words.ts exists: two surfaces must never call one thing two things.
 *
 * THESE ARE NOT THE SPEC-OUTCOME VERDICTS AND MUST NEVER BE MAPPED ONTO THEM.
 * A spec outcome answers "did shipping this pay off" (validated, mixed, missed).
 * A forecast answers "was the belief correct" (hit, miss, inconclusive). Those
 * are orthogonal, and a single event can take different values in each: forecast
 * "this will not move activation", it does not move, and the forecast is a HIT
 * while the spec outcome is MISSED, both correct at once. A mapping function
 * cannot express that, so writing one would silently pick a winner and corrupt
 * both records. `mixed` is a result; `inconclusive` is the absence of one.
 *
 * There is deliberately no fourth key. "Too early" is a check date, not a
 * verdict, exactly as verdict-words.ts says of its own three: see
 * `deferForecastCheck`, which moves `forecast_next_check_at` and writes no
 * resolution at all.
 *
 * A .ts module and not an export from a component, because a component file that
 * also exports constants breaks Fast Refresh for every component in it
 * (`react-refresh/only-export-components`), and the warning is right.
 *
 * The type is imported as a TYPE ONLY. forecast-resolution.ts imports nothing by
 * design, so this file stays safe to reach from a client component; a value
 * import from anywhere in that graph would be the leak.
 */
export const FORECAST_SAYS: Record<ForecastResolution, string> = {
  hit: "you called it",
  miss: "it went the other way",
  inconclusive: "the evidence did not settle it",
};
