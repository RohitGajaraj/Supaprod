/**
 * State for the seven-station strip on the landing replay.
 *
 * The strip is a LIVE READOUT, not a diagram of the order. As the trace below
 * it plays, it answers three questions: where is the run now, where has it
 * been, and has it been here before.
 *
 * The third question is the one that matters, and the old code could not
 * answer it. It lit stations from `Math.max` over everything played, a
 * high-water mark that only ever rose. The failure replay walks
 *
 *     BUILD BUILD BUILD BUILD  PLAN  DESIGN  BUILD BUILD BUILD  SHIP  LEARN
 *       4     4     4     4      2      3      4     4     4      5     6
 *
 * so it steps back two stations and walks forward again. Under a high-water
 * mark nothing behind the cursor changed when it retreated, and Build read
 * identically on both visits. The one page whose whole argument is that the
 * loop is not a line was rendering the loop as a line.
 *
 * Deriving from the CURRENT position instead pays for itself twice:
 *
 *  - the retreat becomes visible for free. Stations ahead of the cursor go
 *    dim again, because after a correction they genuinely are unfinished
 *    again. Build was done; the correction undid it; Build is pending.
 *  - it needs no new colour, which matters here: colour in this product
 *    carries status only and must survive greyscale, so "we came back" could
 *    not have been spent on a hue.
 *
 * The visit tally carries what dimming alone would lose. A station showing
 * two visits is the product's actual claim in one glyph, and it is the one
 * thing no stepper in the reference set can express: every shipped progress
 * indicator surveyed assumes monotonic forward motion, so a station entered
 * twice is unrepresentable in all of them.
 */

export type StationProgress = {
  /**
   * How many times each station has been ENTERED. Consecutive steps inside
   * one station are a single visit; leaving and coming back is a second.
   * Indexed to match the station list passed as `count`.
   */
  visits: number[];
  /** Where the cursor is now, or -1 before the trace has started. */
  at: number;
  /** True once any station has been entered a second time. */
  returned: boolean;
};

/**
 * Reduce a played station path to strip state.
 *
 * `path` is the station of each log entry in order, and entries carry no
 * station at all when they are not station work (nulls are skipped rather
 * than treated as position 0, which would drag the cursor back to Discover).
 * Anything outside the station range is ignored rather than clamped: a bad
 * index is a bug in the log, and clamping would silently light a real station
 * that the run never touched.
 */
export function stationProgress(
  path: ReadonlyArray<number | null | undefined>,
  count: number,
): StationProgress {
  const visits = new Array<number>(Math.max(count, 0)).fill(0);
  let at = -1;
  let previous = -1;

  for (const station of path) {
    if (station == null) continue;
    if (!Number.isInteger(station)) continue;
    if (station < 0 || station >= visits.length) continue;

    // Only count an ENTRY. Four consecutive Build lines are one visit to
    // Build, otherwise the tally would report how chatty a station is rather
    // than how many times the run came back to it.
    if (station !== previous) {
      visits[station] += 1;
      previous = station;
    }
    at = station;
  }

  return { visits, at, returned: visits.some((v) => v > 1) };
}
