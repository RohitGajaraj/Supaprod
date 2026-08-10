/**
 * THE CLOCK FACTS THIS SURFACE IS ALLOWED TO STATE.
 *
 * Three functions, in a leaf module, because the route and the queue both need
 * the same answers and this repo has already paid for one fact living in two
 * files more than once.
 *
 * `withinLastDay` IS THE SESSION BOUNDARY, AND IT IS DELIBERATELY NOT
 * "SINCE YOU LAST LOOKED". The sharpest idea in the research on this surface is
 * that a person returning after agents worked all night wants the diff since
 * their own last read, and this product cannot draw that line yet: there is no
 * per-user last-seen watermark in the database. `today-lanes.functions.ts:542`
 * says so in as many words, and every window the server offers is a fixed 24
 * hours.
 *
 * So the surface says "in the last 24 hours" and means it. Claiming a boundary
 * we cannot compute would be the one kind of lie this product cannot afford: a
 * morning brief that says "this is everything you missed" while silently
 * meaning "this is everything from a rolling day" is wrong precisely for the
 * person who was away for three.
 */

const DAY_MS = 86_400_000;

/** A short elapsed time, or null when the timestamp is missing or in the
 *  future. Null rather than "0m", because a clock skew is not a fact. */
export function ago(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

/** Whole days since a timestamp. Null when unknown, so a caller can leave the
 *  claim out entirely rather than printing a zero it did not measure. */
export function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS);
  return Number.isFinite(days) && days >= 0 ? days : null;
}

/** The honest window. See the note at the top of this file. */
export function withinLastDay(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const ms = Date.now() - new Date(iso).getTime();
  return Number.isFinite(ms) && ms >= 0 && ms < DAY_MS;
}
