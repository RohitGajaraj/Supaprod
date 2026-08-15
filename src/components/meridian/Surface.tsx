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
}) {
  return (
    <div className="sp-inner">
      <div className={wide ? "sp-wide" : "sp-main"}>{children}</div>
      {context ? <aside className="sp-ctx">{context}</aside> : null}
    </div>
  );
}

export default Surface;
