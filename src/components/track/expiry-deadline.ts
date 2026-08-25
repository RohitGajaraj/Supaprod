/**
 * The deadline a person can act on, not one they must decode.
 *
 * Ruled by MAIN (INBOX answer 6, 2026-08-25): the consent expiry line reads
 * "by Wed 27 Aug, 15:41" in the viewer's own locale and zone, and the raw ISO
 * instant rides in a title attribute for anyone who needs the exact record.
 * `expiryNote` interpolates whatever it is handed, so this is where the
 * client-side spelling happens -- the lib keeps taking an opaque string.
 */
export function formatExpiryDeadline(epochMs: number | null | undefined): string | null {
  if (epochMs === null || epochMs === undefined || !Number.isFinite(epochMs)) return null;
  // h23, not hour12:false -- some ICU builds spell midnight as 24:xx with the
  // boolean form, which would put a false time on a sentence about a deadline.
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(epochMs));
}

/**
 * A horizon DATE, spelled without a time it does not have.
 *
 * `forecast_horizon_date` is a calendar day, so rendering it through
 * `formatExpiryDeadline` would put a midnight on a sentence that never carried
 * one. Same viewer locale, weekday kept so "8 Sep" also says which day of the
 * week the wait ends.
 */
export function formatDeadlineDate(epochMs: number | null | undefined): string | null {
  if (epochMs === null || epochMs === undefined || !Number.isFinite(epochMs)) return null;
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(epochMs));
}
