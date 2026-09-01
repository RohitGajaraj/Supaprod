import * as React from "react";

/**
 * THE TIME-OF-DAY GREETING, LIFTED OUT OF THE BOARD 2026-09-01.
 *
 * ── WHY IT MOVED ─────────────────────────────────────────────────────────
 * FOUNDER: *"you're saying 'Good afternoon, 70 decisions are ready for you',
 * and 'good afternoon' is AFTER 'what needs doing'. That's not the right
 * thing. It has to be somewhere at the top."*
 *
 * He is describing the cost of a fold that was never finished. The greeting
 * belonged to `/today`, where it was the first thing on the page and read
 * correctly. When the board folded into the home it carried the greeting down
 * with it, so the page opened with a question ("What needs doing?"), a field
 * and four cards, and THEN said good afternoon -- roughly 700px in, greeting a
 * person who has been on the screen for a while and may already have typed.
 *
 * A greeting is the first thing said or it is not a greeting. It is a property
 * of the PAGE rather than of the board, so it lives where any surface can take
 * it and the board no longer draws its own.
 *
 * ── THE CLOCK IS THE READER'S, DELIBERATELY ──────────────────────────────
 * `getHours()` is local time on the reader's own machine. That is correct here
 * and would be wrong almost anywhere else in this product: every other time on
 * screen describes when something HAPPENED and must be read in the workspace's
 * terms, but a greeting describes the person reading it. The database is UTC
 * and this is not a database fact.
 */
export function greetingFor(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning.";
  if (hour < 18) return "Good afternoon.";
  return "Good evening.";
}

/**
 * The greeting, resolved on the reader's clock AFTER mount.
 *
 * ── THE DEFERRAL IS LOAD-BEARING, AND IT CAME WITH THE MOVE ──────────────
 * Carried verbatim from the board, whose own note explains it: the server
 * renders this in ITS timezone, and *"a server that says 'Good evening' to
 * someone eating breakfast is worse than a first frame that says morning and
 * corrects itself."* This database is UTC and the reader is not.
 *
 * The pre-mount value is deliberately the morning branch rather than an empty
 * string: same line, same height, so the correction on hydration changes a
 * word and moves nothing. A blank that fills in is a layout shift on the first
 * line of the product.
 */
export function useGreeting(): string {
  const [clock, setClock] = React.useState<Date | null>(null);
  React.useEffect(() => setClock(new Date()), []);
  return clock ? greetingFor(clock) : greetingFor(new Date(2000, 0, 1, 8));
}
