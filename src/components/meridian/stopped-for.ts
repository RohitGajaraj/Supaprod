/*
 * HOW LONG A CALL HAS BEEN STOPPED, as a phrase.
 *
 * ── WHY THIS IS ITS OWN FILE, AND WHY IT LOOKS COPIED ───────────────────
 * It IS copied, deliberately and visibly, from the private helper of the same
 * name inside src/components/meridian/StalledWork.tsx. That component owns the
 * queue on /inbox and prints this phrase on every row; the gate at the top
 * of the same surface prints it for the call in front of you. Two places, one
 * sentence, and they must agree to the word or the surface contradicts itself
 * one inch apart.
 *
 * THAT DEBT IS PAID AND THIS IS THE SINGLE COPY, from 2026-08-27. The two were
 * verified byte-identical before collapsing, `StalledWork` now imports from
 * here, and its private helper is gone.
 *
 * ── WHY IT LIVES IN MERIDIAN AND NOT IN `approvals/` ───────────────────
 * It sat next to the surface that first needed it. **That surface folds**
 * (SURFACE-MAP, R-04), and a phrase four components depend on cannot live
 * inside a door that is being removed. It is also the wrong direction: `Gate`
 * is a primitive and now states this fact, and a primitive that imports from a
 * feature folder inverts the layering.
 *
 * So it sits beside the primitives that print it. Nothing about the words
 * changed in the move.
 *
 * ── WHY A PHRASE AND NOT A CLOCK TIME ───────────────────────────────────
 * "Since 18:31 on 10 August" makes a reader do arithmetic before they can feel
 * anything. "3 days" is the fact that changes what they do. The exact instant
 * still travels, as a `title` on the element, for anyone who needs it.
 */

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** How long it has been stopped, in the shortest true form. */
export function stoppedFor(since: number, now: number): string {
  const ms = Math.max(0, now - since);
  if (ms < HOUR) {
    const m = Math.max(1, Math.round(ms / 60_000));
    return m === 1 ? "1 minute" : `${m} minutes`;
  }
  if (ms < DAY) {
    const h = Math.round(ms / HOUR);
    return h === 1 ? "1 hour" : `${h} hours`;
  }
  const d = Math.floor(ms / DAY);
  return d === 1 ? "1 day" : `${d} days`;
}

/**
 * Past a day it has survived a night nobody looked, which is the boundary
 * StalledWork calls "late" and the point where its rows start carrying the
 * accent. The gate uses the same line so the loudest row and the call in front
 * of you never disagree about whether this one is overdue.
 */
export function isOverdue(since: number, now: number): boolean {
  return Math.max(0, now - since) >= DAY;
}

/**
 * Epoch ms a call has been waiting since, or null when nothing recorded it.
 *
 * NULL IS A REAL ANSWER AND MUST STAY ONE. Every gate family this queue
 * federates carries a timestamp today, so null is defensive rather than
 * expected, but a missing time may never be dressed as a fresh one: the whole
 * point of the age is that it is measured, and "0 minutes" on a call nobody
 * timed is the exact lie this surface was redesigned to stop telling.
 */
export function waitingSince(timestamp: string | null | undefined): number | null {
  if (!timestamp) return null;
  const t = Date.parse(timestamp);
  return Number.isNaN(t) ? null : t;
}
