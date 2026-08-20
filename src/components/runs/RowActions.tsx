import * as React from "react";

/*
 * ROW ACTIONS, the controls that belong to one row of a dense grid.
 *
 * ── WHAT THIS REPLACES ──────────────────────────────────────────────────
 * /runs drew a row's two Manage controls as raw `<button className="sp-block-more">`
 * and pushed the irreversible one sideways with an inline margin. The comment
 * beside them recorded the real constraint, and that constraint is still true:
 * the house Button is a 38px control, and dropping one into a dense row would
 * roughly double the row's height. So the row went without a primitive, and
 * paid for it in two places.
 *
 *   DELETE WAS SEPARATED BY DISTANCE ALONE. Distance is the one separator a
 *   narrow column, a wrapped line or a zoomed page can quietly take away, and
 *   when it goes, the act that cannot be undone is simply the word beside the
 *   act that can.
 *   NOTHING NAMED THE ROW. "Archive" and "Delete" repeated down forty rows are
 *   forty identical accessible names, so a reader moving by control heard
 *   "Delete, button" with no way to know which run was about to go.
 *
 * ── WHY THE ANSWER IS NOT COLOUR ────────────────────────────────────────
 * Red reports an OUTCOME in this system: it says something failed. A control
 * that has not been pressed has no outcome to report, so a red Delete would
 * state something untrue and would spend the one hue that means "it broke" on
 * a button at rest. There is no warn colour here and no amber to reach for
 * either, and there is not going to be one.
 *
 * So the separation is structural, three ways at once, and every one of them
 * survives greyscale:
 *   a rule between the safe controls and the irreversible one, drawn by this
 *     component rather than by the caller, so it cannot be forgotten;
 *   an EDGE on the destructive control, which is the only bordered thing in
 *     the row, so it reads as a deliberate object rather than as another word;
 *   position, last, after the rule.
 *
 * ── AND IT STAYS SHORT ──────────────────────────────────────────────────
 * 22px, the same height as a status pill, so a row carrying controls is about
 * three pixels taller than one that does not. The original constraint is
 * answered rather than reverted.
 */

/*
 * ── THE RING IS INHERITED, AND THE CONSTANT THAT USED TO BE HERE PAINTED
 *    NOTHING ────────────────────────────────────────────────────────────
 * A `FOCUS` constant declaring `focus-visible:outline-*` sat here, spelled
 * correctly and pointing at the right token. It was inert. The authenticated
 * app mounts `[data-obsidian]` on <html>, `src/styles.css` carries an UNLAYERED
 * `[data-obsidian] :focus-visible` rule, and unlayered CSS beats every layer
 * whatever the specificity, so a Tailwind utility could not win. `data-mrd` on
 * the root is the mechanism that actually paints.
 *
 * `mrd-focus-inset` STAYS AS A CLASS, and it is not a focus utility. It is a
 * real class in meridian.css that needs a `data-mrd` ANCESTOR rather than the
 * attribute on itself, and it moves the ring inside the control. A run row sits
 * in a column that clips, and an outset ring there comes back sheared in half.
 * The attribute is on the strip AND on the button so a `RowAction` dropped
 * somewhere on its own still takes a ring: inside the strip the inset rule
 * scores (0,3,1) and wins the offset, standing alone the button's own (0,3,0)
 * rule paints the outset ring. Both draw something, which is the point.
 */

export function RowAction({
  destructive = false,
  className,
  children,
  ...rest
}: {
  /** The act that cannot be undone. At most one per row. */
  destructive?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      data-mrd=""
      className={`mrd-focus-inset inline-flex h-[22px] shrink-0 items-center rounded-mrd-xs px-1.5 text-[12px] font-medium whitespace-nowrap transition-colors hover:bg-mrd-hover hover:text-mrd-ink disabled:pointer-events-none disabled:opacity-45 ${
        destructive ? "border border-mrd-edge text-mrd-body" : "text-mrd-mute"
      } ${className ?? ""}`}
      style={{ transitionDuration: "var(--mrd-d-press)" }}
      {...rest}
    >
      {children}
    </button>
  );
}

/**
 * The row's control strip. It draws the rule itself, because a separation
 * every caller has to remember is a separation that gets forgotten on the
 * fortieth row, and the one it gets forgotten in front of is Delete.
 */
export function RowActions({
  children,
  destructive,
}: {
  /** The reversible controls, in reading order. */
  children?: React.ReactNode;
  /** The one act that cannot be undone, if this row has one. */
  destructive?: React.ReactNode;
}) {
  return (
    <span data-mrd="" className="flex items-center justify-end gap-1.5">
      {children}
      {destructive ? (
        <>
          <span aria-hidden className="mx-0.5 h-4 w-px shrink-0 bg-mrd-line" />
          {destructive}
        </>
      ) : null}
    </span>
  );
}
