import type { ReactNode } from "react";

/**
 * THE WORK REGION'S LAYOUT: a prose column, and a context column beside it.
 *
 * ── WHY THIS MOVED, AND WHY IT IS THE HIGHEST-LEVERAGE MOVE AVAILABLE ────
 * Measured 2026-08-15: `Surface` was the single symbol keeping SEVEN files
 * importing `components/shell/primitives`, the retired Cadence/ink component
 * layer. SIX OF THOSE SEVEN ARE SURFACES THAT ARE OTHERWISE FULLY PORTED --
 * Brain, Approvals, Crew, the Engine Room and both Runs routes. Each porting
 * agent kept it on the same reasoning, written down independently each time:
 * it is the work region's LAYOUT rather than a paint, so it is not what a
 * design-system port is about.
 *
 * That reasoning was right about the component and wrong about the
 * consequence. One shared judgement call, repeated by five agents who never
 * spoke to each other, held six finished surfaces on the retired layer.
 *
 * ── THIS IS A MOVE, NOT A REWRITE, AND THAT IS DELIBERATE ────────────────
 * The markup and the class names are unchanged. `.sp-inner`, `.sp-main`,
 * `.sp-wide` and `.sp-ctx` live in `src/styles/shell.css`, WHICH IS NOT A
 * RETIRED LAYER: it was ported to `--mrd-*` on 2026-08-15 and is the app
 * shell's own stylesheet. What was retired is `shell/primitives.tsx`, the ink
 * COMPONENT layer, and that dependency is what actually goes away here.
 *
 * Rebuilding this grid in utilities was the obvious alternative and it was
 * refused. It would have re-derived a working two-column layout, its padding,
 * its container max and its narrow-region stacking behaviour, across seven
 * surfaces at once, to gain nothing a reader could see. The class names also
 * have to survive: four guards in this repo parse them as SOURCE TEXT,
 * including exact selectors like
 * `:root[data-chord="armed"] .sp-app[data-rail="narrow"] .sp-navrow > svg`.
 *
 * ── ONE THING THIS MOVE DOES NOT SETTLE, ON PURPOSE ──────────────────────
 * The product has TWO measures and they disagree: `--sp-main-max` is 74ch
 * ("measure, not pixels: it tracks the type") and `--mrd-measure` is 68ch
 * ("prose only, never a table or a row"). This still reads the 74ch one,
 * because changing it here would narrow the prose column on seven surfaces in
 * a commit whose subject is a component move, and a layout change nobody asked
 * for does not belong inside a refactor. It is a real open question and it is
 * recorded here rather than resolved quietly.
 */
export function Surface({
  children,
  context,
  wide = false,
  rhythm = false,
}: {
  children: ReactNode;
  /**
   * NEVER DISAPPEARS. On a narrow region it stacks under the main column
   * rather than hiding, because hiding it loses information a 14 inch laptop
   * needs just as much as a 32 inch one.
   */
  context?: ReactNode;
  /**
   * Drop the measure. It exists so a LINE OF PROSE stays readable, and it is
   * the wrong constraint for a grid, a table or a canvas, which want the room.
   * Caught on the Crew roster, where the cap squeezed a 13-card grid into two
   * columns with half the screen empty. Prose keeps the measure; anything laid
   * out in columns of its own passes `wide`.
   */
  wide?: boolean;
  /**
   * ── VERTICAL RHYTHM, WHICH THIS PRIMITIVE HAD NO ANSWER FOR ─────────────
   * Added 2026-09-01.
   *
   * THE MEASUREMENT THAT FOUND IT. `.sp-main` and `.sp-wide` set `min-width`
   * and a measure and nothing else -- no display, no gap -- so a page that does
   * not space its own blocks gets NO separation at all. Measured on the
   * rendered `/discover` at 1512px: eight top-level sections, and the gaps
   * between them were **10, 0, 0, 0, 0, 0, 0**. Seven of eight boundaries were
   * zero pixels. The heading, the sources, the review queue, the ranking,
   * Settled, Capture and the boundary were physically touching.
   *
   * That is not the "uniform rhythm" the founder's flat-rhythm complaint
   * describes. It is the absence of rhythm, and it is invisible in review
   * because each region looks correct in isolation.
   *
   * OPT-IN, AND THAT IS DELIBERATE RATHER THAN TIMID. Most ported surfaces
   * already space their own children -- with their own wrapper, or with
   * per-block margins -- so a default gap here would DOUBLE their spacing
   * silently across a hundred routes, which trades one invisible defect for
   * another. A surface that needs it says so.
   *
   * `--mrd-s7` (40px) between PEER sections, which is the ramp used correctly:
   * uniform spacing between siblings of equal rank is right, and it is only
   * uniform spacing between a group and its own members that flattens a page.
   * Each region still owns its internal rhythm.
   */
  rhythm?: boolean;
}) {
  return (
    <div className="sp-inner">
      <div className={`${wide ? "sp-wide" : "sp-main"}${rhythm ? " flex flex-col gap-mrd-7" : ""}`}>
        {children}
      </div>
      {context ? <aside className="sp-ctx">{context}</aside> : null}
    </div>
  );
}

export default Surface;
