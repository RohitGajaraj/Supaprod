import { MAX_STATION_ATTEMPTS } from "@/lib/spine/driver";

/*
 * WHICH TRY THIS IS (queue 66's component half). `spine_tracks.attempts`
 * counts real failures against MAX_STATION_ATTEMPTS, and until now only SQL
 * could tell a person how close a held run is to stopping for good.
 *
 * The line states the count and stops: no drama, no countdown theatrics --
 * "the next failure is the last" reads differently to someone whose money is
 * on the line than to the run itself. Zero or unknown claims nothing, which
 * is also what rows older than the counter need.
 */
const WORDS = ["zero", "one", "two", "three"] as const;

export function triesLine(attempts: number | null | undefined, stationName: string): string | null {
  if (attempts === null || attempts === undefined || !Number.isFinite(attempts)) return null;
  const n = Math.floor(attempts);
  if (n <= 0) return null;
  if (n >= MAX_STATION_ATTEMPTS) {
    const max = WORDS[MAX_STATION_ATTEMPTS] ?? String(MAX_STATION_ATTEMPTS);
    return `All ${max} tries at ${stationName} are spent.`;
  }
  const word = WORDS[n] ?? String(n);
  return `${word[0].toUpperCase()}${word.slice(1)} ${
    n === 1 ? "try" : "tries"
  } at ${stationName} ${n === 1 ? "has" : "have"} not cleared it.`;
}
