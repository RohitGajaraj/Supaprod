/**
 * ONE FORMATTER, ONE SOURCE OF THE ZONE (P-130, A-QUEUE.md).
 *
 * Start's own run row (P-126, one file over) read *Live since 06:58* for a
 * promote the founder pressed at 12:28 IST, while the run screen's
 * transcript read *11:20* for the same morning's commits, in the browser's
 * own local zone. Two surfaces, two sources: P-126's own `utcClock` hard-
 * coded UTC, and every other clock reading in this repo trusted whatever
 * zone the browser happened to be in -- never the profile's own saved
 * `timezone` column (Settings, `profile.functions.ts`), which is the one
 * fact this product actually asks a person to state.
 *
 * Every function here takes the zone as an explicit IANA string, never
 * reads it itself, so the SOURCE is a single decision made once, by
 * `useTimezone()` (`hooks/use-timezone.ts`) -- the profile's own zone,
 * defaulting to the browser's when unset, the same defaulting Settings'
 * own `ProfileSection` already does for the field itself.
 */

/** "HH:MM" (24-hour, zero-padded) for an ISO instant, read in `zone`. */
export function clockInZone(iso: string, zone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const hh = parts.find((p) => p.type === "hour")?.value ?? "00";
  const mm = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${hh}:${mm}`;
}

/** The calendar date (YYYY-MM-DD) an ISO instant falls on, in `zone`. Two
 *  instants compare equal by this whenever a person in `zone` would call
 *  them "the same day", which a raw UTC slice cannot promise near midnight. */
function calendarDate(iso: string, zone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

/**
 * Whole days from `fromIso` to `toIso`, counted in CALENDAR DAYS in `zone`.
 *
 * NOT `(b - a) / 86_400_000`, and the difference is the whole reason this is
 * here. A forecast horizon is stored at midnight UTC; a person in IST is five
 * and a half hours ahead, so a horizon "two days away" by subtraction can be
 * one or three days away on their calendar depending on the hour they look.
 * A date a product commits to has to be counted the way the person reading it
 * counts, which is by days on a wall, not by elapsed milliseconds.
 *
 * Negative when `toIso` is already behind `fromIso`.
 */
export function daysBetweenInZone(fromIso: string, toIso: string, zone: string): number {
  const from = calendarDate(fromIso, zone);
  const to = calendarDate(toIso, zone);
  /* Both are YYYY-MM-DD in the person's zone, so anchoring them at UTC
     midnight compares the DAYS rather than the instants and no offset can
     re-enter through the subtraction. */
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** Whether two ISO instants fall on the same calendar day in `zone`. */
export function sameCalendarDay(a: string, b: string, zone: string): boolean {
  return calendarDate(a, zone) === calendarDate(b, zone);
}

/** "Sep 21" for an ISO instant, read in `zone` -- the far-side half of
 *  `dateTimeInZone` on its own, for a caller that wants the day without a
 *  clock riding along (a horizon is a date, not a moment). */
export function monthDayInZone(iso: string, zone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

/**
 * The day-and-clock idiom every surface should read a time through: the
 * bare clock when `iso` falls on `nowIso`'s own calendar day in `zone`,
 * `"yesterday HH:MM"` the day before that, and `"Mon D, HH:MM"` further
 * back -- never a bare date with no year old enough to need one, and never
 * silently wrong near a midnight the two instants straddle in `zone` but
 * not in UTC.
 */
export function dateTimeInZone(iso: string, zone: string, nowIso: string): string {
  const clock = clockInZone(iso, zone);
  const today = calendarDate(nowIso, zone);
  const target = calendarDate(iso, zone);
  if (target === today) return clock;

  const yesterday = new Date(`${today}T00:00:00Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  if (target === yesterday.toISOString().slice(0, 10)) return `yesterday ${clock}`;

  const monthDay = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
  return `${monthDay}, ${clock}`;
}

/** "Monday, September 8", in the person's zone: the day a briefing is for. */
export function longDayInZone(iso: string, zone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

/** The weekday alone ("M", "Mon", "Monday"), in the person's zone. */
export function weekdayInZone(
  iso: string,
  zone: string,
  width: "narrow" | "short" | "long",
): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: zone, weekday: width }).format(new Date(iso));
}
