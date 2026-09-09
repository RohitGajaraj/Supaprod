/**
 * ── WHICH WAY THE CALL WENT, IN WORDS A PERSON WOULD USE ─────────────────────
 *
 * `decisions.call` holds `build` or `do-not-build`. A downstream station's
 * brief is prose a seat reads, so the column's own value must not appear in
 * it: that is a machine name in human prose, which the system prompt forbids
 * outright, and `do-not-build` read quickly is one hyphen from its opposite.
 *
 * ITS OWN FILE SO THE GUARD CAN DRIVE IT. Inlined in `driver.server.ts` this
 * could only be tested by reading the source or by a test writing its own copy
 * of the branch, and a test that carries its own copy passes when the real one
 * is wrong. That is the defect this lane named twice on 2026-09-09: a check
 * pointed one step away from the thing that decides the outcome.
 */

/**
 * The brief's line for a decision's direction, or null when there is nothing
 * to say.
 *
 * NULL IS THE COMMON CASE AND IT IS DELIBERATE. 33 of 61 agent decisions carry
 * no direction, because it was never recorded before the column existed, and
 * "nobody wrote one down" is not "they decided to build". A line invented for
 * those rows would be the exact fact this column was added to stop being
 * invented, and the brief skips a null rather than printing it.
 */
export function theCallLine(value: unknown): string | null {
  if (value === "do-not-build") return "The call: not to build this";
  if (value === "build") return "The call: to build this";
  return null;
}
