/**
 * WHICH COLOUR A TEAMMATE IS, AND WHY THERE ARE ONLY TWO OF THEM.
 *
 * `SPEC-MULTIPLAYER-PRESENCE` §3.1: "Colour comes from a fixed palette of
 * Meridian accent tokens, assigned deterministically from the teammate's id so
 * the same teammate is the same colour on every surface and across reloads.
 * Never the brand ember - ember stays in the logo and is not an interaction
 * state."
 *
 * ── THIS IS A STAND-IN AND IT IS FILED AS ONE ─────────────────────────────
 * §4 of that spec assigns the colour to **S0**, in `src/lib/presence/**`,
 * "assigned here, once, so every surface agrees". Nothing in that directory
 * carries colour today. Asked in
 * `coordination/requests/S2/the-cursor-layer-needs-three-things-from-presence.md`
 * §2. **When S0's lands, this file is deleted and its callers take one import.**
 *
 * ── THE PALETTE IS TWO WIDE, MEASURED, NOT ASSUMED ────────────────────────
 * Meridian's only non-semantic palette is `--mrd-viz-1..4` (meridian.css:683).
 * Two of the four cannot carry an identity:
 *
 *   viz-1  #f68f3c  orange, commented "the dominant series". It reads as the
 *                   brand ember, which §3.1 forbids by name.
 *   viz-2  #3d9aff  USABLE
 *   viz-3  #3dbb72  USABLE
 *   viz-4  #ee5c61  red, and it sits beside `--mrd-fail` in meaning. A teammate
 *                   drawn in failure-red reads as a teammate that failed.
 *
 * §13 is explicit that a missing token is a gap in Meridian to file rather than
 * to invent around, so this uses the two that exist and **does not author a
 * third.**
 *
 * ── WHAT HAPPENS TO THE THIRD TEAMMATE, AND WHY IT IS NOT A REPEAT ────────
 * With two hues, a deterministic assignment gives the third concurrent teammate
 * a colour somebody else already has. **Two teammates in one colour is worse
 * than no colour**: §3.1 makes colour carry identity, so a repeat actively
 * asserts something false, and a person tracking "the blue one" would be
 * watching two different workers.
 *
 * So beyond the palette a teammate is drawn in the neutral agent token instead.
 * It says "a teammate, and this surface is out of colours" rather than "the
 * same teammate as that one". **The NAME is always drawn, on every chip**, so
 * identity never depends on the colour being distinct - the colour is
 * redundancy, and it degrades to honest rather than to wrong.
 *
 * ── DETERMINISTIC MEANS ACROSS RELOADS, NOT ACROSS A SESSION ──────────────
 * The index comes from a hash of the slug, never from arrival order. Ordering
 * by arrival would give a teammate a different colour on every page load and on
 * every surface at once, which is the opposite of what §3.1 asks for.
 *
 * **Do not stop reading here and take that as full stability.** A two-wide
 * palette cannot give it, and the exact limit is stated at the collision
 * resolution below rather than glossed: a colour is stable for a given set of
 * active teammates, and can move when that set changes.
 */

/** The tokens that can carry an identity. Ordered, and the order is stable. */
export const TEAMMATE_COLOURS = ["--mrd-viz-2", "--mrd-viz-3"] as const;

/** Drawn for a teammate past the end of the palette. Not an identity. */
export const TEAMMATE_COLOUR_OVERFLOW = "--mrd-agent";

/**
 * FNV-1a, 32-bit. Chosen because it is four lines and has no dependency, and
 * because the requirement is only "same slug, same bucket, forever" - not
 * distribution quality and certainly not secrecy.
 */
function hash(slug: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * The CSS custom property naming this teammate's colour.
 *
 * `active` is every teammate drawn right now, and it is a parameter rather than
 * module state because the overflow rule is about CROWDING, not about the
 * teammate: a slug that is blue on its own must still be blue when a second
 * teammate arrives. Passing the set keeps that decision in one place and keeps
 * this function pure, which is the only reason it can be tested.
 */
export function teammateColour(slug: string, active: readonly string[]): string {
  /* Sorted, so the answer does not depend on the order the rows came back in -
     the same defect `displayKindOf` was written to avoid one layer down. */
  const ranked = [...new Set(active)].sort();
  const seat = ranked.indexOf(slug);
  /* Not drawn, or past the end of a two-wide palette. Neither is an identity
     claim, and both say so with the same neutral. */
  if (seat < 0 || seat >= TEAMMATE_COLOURS.length) return TEAMMATE_COLOUR_OVERFLOW;

  /* THE HUE COMES FROM THE HASH, NOT FROM THE SEAT, so a teammate does not
     change colour merely because it moved down the list when another one
     appeared. Two slugs can want one hue; the first in rank keeps it and the
     other takes the next free one.

     THE LIMIT, STATED RATHER THAN CLAIMED AWAY: with only two hues, that
     resolution means a colour CAN move when the set of active teammates
     changes. It is stable for a given set, on every surface and across
     reloads, which is what §3.1's "same teammate, same colour" is for; it is
     not stable across a teammate arriving. A wider palette removes the case
     entirely, which is what the ask to S0 is for. */
  const taken = new Set<number>();
  for (const s of ranked.slice(0, TEAMMATE_COLOURS.length)) {
    let at = hash(s) % TEAMMATE_COLOURS.length;
    while (taken.has(at)) at = (at + 1) % TEAMMATE_COLOURS.length;
    taken.add(at);
    if (s === slug) return TEAMMATE_COLOURS[at]!;
  }
  /* Unreachable: `seat` is inside the slice we just walked. Neutral rather
     than a non-null assertion, because an unreachable branch that lies is
     worse than one that is merely dull. */
  return TEAMMATE_COLOUR_OVERFLOW;
}
