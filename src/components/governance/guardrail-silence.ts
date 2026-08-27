/**
 * A SCREEN THAT HAS STOPPED SCREENING LOOKS EXACTLY LIKE ONE NOTHING TRIPS.
 *
 * The guardrails surface lists what the rules caught, newest first, and says
 * nothing at all about the gap between the newest one and today. Both readings
 * of an empty or stale list are consistent with what is on screen:
 *
 *   "nothing has tried anything, and the rules are fine"
 *   "the rules have not been consulted in a month"
 *
 * MEASURED ON THE LIVE DATABASE ON 2026-08-27, IT IS THE SECOND. `guardrail_hits`
 * holds 10 rows in June and 8,525 in July across 9 workspaces, and then stops
 * dead: the last row is 2026-07-25, 33 days ago, while `agent_runs` carries
 * 2,570 runs in the last 30 days against 27 enabled rules. Not a taper, a cliff.
 * A person standing on that page today reads a page of July rows and concludes
 * their rules work.
 *
 * SO THIS SPEAKS ONLY WHEN SOMETHING IS WRONG, and is silent when the list is
 * doing its own job. A line reading "last fired 2 hours ago" over a list whose
 * first row already says "2h" is noise, and noise is how a page teaches people
 * to skim past the one line that matters.
 *
 * WHAT IT WILL NOT DO. It does not say the rules are broken. This module can
 * see when a rule last fired and cannot see whether any call was made since, so
 * "quiet" is the honest word and the diagnosis is left to the person, who is
 * pointed at the one control that settles it: the per-rule tester, which runs a
 * sample through the real matcher. Naming a cause we cannot prove would be the
 * same defect one register up from the one being fixed.
 */

/** A row of `guardrail_hits` as `getGuardrailOverview` returns it. */
export interface GuardrailHitTime {
  created_at: string;
}

export interface GuardrailSilence {
  /** The headline above the list, or null when the list speaks for itself. */
  said: string | null;
  /** What settles it, said only when something is said at all. */
  action: string | null;
  /** Whole days since the newest hit. Null when there has never been one. */
  quietDays: number | null;
}

const SILENT: GuardrailSilence = { said: null, action: null, quietDays: null };

/**
 * A WEEK, and the reason is the population rather than a round number. These
 * rules screen every model call, and a workspace running agents at all makes
 * calls daily -- the live database carries 2,570 runs in 30 days. Seven quiet
 * days is therefore roughly two thousand unscreened opportunities, which is
 * well past "nothing happened to trip one" and into "worth a look". Shorter
 * than this and a genuinely quiet weekend raises an alarm that costs the line
 * its credibility the first time it is wrong.
 */
export const QUIET_DAYS = 7;

/** The one control that settles it, named where a person can act on it. */
const HOW_TO_TELL =
  "Open any rule and run a sample through Try it first: that goes through the same matcher a real call does.";

function daysBetween(thenMs: number, nowMs: number): number | null {
  if (!Number.isFinite(thenMs) || !Number.isFinite(nowMs)) return null;
  return Math.floor((nowMs - thenMs) / 86_400_000);
}

function days(n: number): string {
  return n === 1 ? "a day" : `${n} days`;
}

export function guardrailSilence(
  hits: readonly GuardrailHitTime[] | null | undefined,
  nowMs: number,
): GuardrailSilence {
  if (!hits || hits.length === 0) {
    return {
      said: "No rule has caught anything here.",
      action: HOW_TO_TELL,
      quietDays: null,
    };
  }

  /* Newest first is the read's own order, but a caller that changed it would
     silently turn this into "days since the OLDEST hit", which reads as alarm
     forever. Take the maximum instead of trusting the sort. */
  const newest = Math.max(...hits.map((h) => new Date(h.created_at).getTime()));
  const quietDays = daysBetween(newest, nowMs);
  if (quietDays === null || quietDays < QUIET_DAYS) return SILENT;

  return {
    said: `Nothing has tripped a rule in ${days(quietDays)}.`,
    action: HOW_TO_TELL,
    quietDays,
  };
}
