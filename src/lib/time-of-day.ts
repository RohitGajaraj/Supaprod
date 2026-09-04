/**
 * The UTC clock reading of an ISO instant, "HH:MM" (24-hour, zero-padded).
 *
 * Pure and locale-independent on purpose (P-126, A-QUEUE.md): a sentence
 * built from `toLocaleTimeString` renders one thing in a test running in UTC
 * and another on a reader's own machine, and a "went live at 12:28" this
 * repo cannot pin to a fixture is a claim it cannot guard. Every caller that
 * needs a short clock reading inside a sentence (Start's home answers, a
 * shipped bet's card, a run row) reads this one function rather than each
 * carrying its own `toLocaleTimeString` call.
 */
export function utcClock(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
