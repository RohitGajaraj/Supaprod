import type { ReactNode } from "react";

/**
 * THE TWO ROWS THE PRODUCT IS MOSTLY MADE OF.
 *
 * ── WHY THESE TWO, AND WHY TOGETHER ─────────────────────────────────────
 * Measured 2026-08-16 across `src/components` and `src/routes`: 111 files
 * still import the retired `components/shell/primitives`, and their MEDIAN
 * BASKET IS NINE SYMBOLS. That number is the whole shape of the problem. It
 * means no single component is a lever — building the twelve most-imported
 * primitives frees fourteen files, because the twelve travel together.
 *
 * The task this file closes was originally written as "build Row and Line,
 * which block 127 files". That framing was wrong and the measurement says so:
 * they do not BLOCK, they CO-OCCUR. What makes them first is not that they
 * unblock the most files alone, but that fifteen of the retired layer's
 * thirty-nine symbols ALREADY have shipping Meridian equivalents, and once you
 * subtract those, `Row` (73 files) and `Line` (54) are what is left standing in
 * front of everything else. Building the pair takes the portable set from six
 * files to twenty-five.
 *
 * ── THIS IS A REBUILD, NOT A MOVE, AND THAT IS THE DIFFERENCE FROM Surface ──
 * `Surface` was moved into Meridian untouched, because its classes live in
 * `shell.css`, which was ported to `--mrd-*` and is not retired. These two are
 * different: `.sp-row` and `.sp-line` live in `primitives.css`, which IS the
 * retired sheet. There is nothing to point at, so the layout is re-expressed in
 * utilities against Meridian tokens.
 *
 * Every value below is carried across deliberately rather than reinvented, and
 * the ones that encode a founder ruling or a measurement are called out where
 * they appear. A rebuild is the moment those get silently rounded off.
 */

/* ------------------------------------------------------------------ *
 * Row: who did what, and when
 * ------------------------------------------------------------------ */

/**
 * The divider between consecutive rows.
 *
 * `.sp-row + .sp-row { border-top }` in the retired sheet. Expressed here as a
 * sibling variant so it stays with the component instead of becoming a rule a
 * caller has to remember, which is what a list of 73 call sites cannot afford.
 *
 * NOTE THE SELECTOR DIRECTION. Tailwind compiles this to
 * `.<cls> + [data-mrd-row] { border-top: … }`, so the border lands on the
 * FOLLOWING row, never the first. That is the same shape as the CSS it
 * replaces, and it is why the attribute has to be on the outermost element of
 * every branch below — a row that renders a different root would silently drop
 * out of the sequence and take its divider with it.
 */
const ROW_DIVIDER = "[&+[data-mrd-row]]:border-t [&+[data-mrd-row]]:border-mrd-line-soft";

/**
 * The horizontal bleed.
 *
 * `-mx-2.5 w-[calc(100%+20px)] px-2.5` reproduces the retired
 * `margin: 0 -10px; width: calc(100% + 20px); padding: … 10px`. It exists so the
 * hover wash and the focused state reach past the text into the region's own
 * padding: a highlight that stops exactly at the first glyph reads as a
 * selected WORD rather than a selected row.
 */
const ROW_BLEED = "-mx-2.5 w-[calc(100%+20px)] px-2.5";

/**
 * `min-h-11` is 44px, and it is two rulings at once rather than a round number.
 * `--sp-row-h-decision` was set at 44px because "a row carrying a decision earns
 * the height", and 44px is also the smallest square a finger reliably hits. A
 * clickable row is the one element where those two agree, so it is the floor for
 * every branch, clickable or not, and the row does not resize when it gains a
 * door.
 *
 * `py-[9px]` and `gap-[13px]` are carried across unrounded on purpose. Rounding
 * them to `py-2`/`gap-3` would move every row in the product by a pixel or two
 * inside a commit whose subject is a port, and density here was measured rather
 * than chosen — see the note on `Line` below, which is the same story with the
 * numbers written down.
 */
const ROW_SHAPE =
  "flex items-center gap-[13px] min-h-11 py-[9px] rounded-mrd-ctl text-left transition-colors";

export function Row({
  marks,
  lead,
  sub,
  time,
  onClick,
  tight = false,
  focused = false,
  action,
  leadTitle,
  subTitle,
}: {
  /** The mark slot is a fixed width, so text starts on the same line whether
   *  the row carries one mark or two. */
  marks?: ReactNode;
  lead: ReactNode;
  sub?: ReactNode;
  time?: string | null;
  onClick?: () => void;
  /** A row in a LIST never wraps. Founder ruling: one or two lines, and depth
   *  is a click away rather than showcased on the surface. Pass tight for any
   *  row whose full content has a detail view to open. */
  tight?: boolean;
  focused?: boolean;
  /** A control belonging to THIS row (revert, copy, open elsewhere). It sits
   *  outside the clickable region so it is never a button inside a button. */
  action?: ReactNode;
  /**
   * The plain-text form of `lead` / `sub`, for a caller whose value is a
   * fragment rather than a string.
   *
   * ── WHY THESE EXIST, AND WHO WAS LEFT OUT WITHOUT THEM (2026-09-01) ─────
   * The tooltip below is guarded on `typeof value === "string"`, and that
   * guard is right: `title` on a fragment is either a type error or the
   * literal text "[object Object]". But it means the rows with the MOST to
   * hide are the ones that get no tooltip, because a row is a fragment
   * exactly when it is composing several facts onto one line.
   *
   * Measured on Discover: every ranking row carries its rank, score, volume,
   * which sources it came from and its novelty on a single line, built as a
   * fragment, cut by `truncate` with an ellipsis leading nowhere. The
   * founder's report is about that class of row specifically -- *"everywhere,
   * the text is getting truncated ... either shorten it or give only the
   * summary that it has required. Use wherever that's necessary to get to the
   * inside and give a clickable action."*
   *
   * So the caller that knows the plain text can hand it over. Optional, and
   * still governed by `tight`: a row whose content is fully on screen gets no
   * tooltip whatever it passes, because a tooltip repeating visible text is
   * how a reader learns to stop believing tooltips.
   */
  leadTitle?: string;
  subTitle?: string;
}) {
  const clamp = tight ? "truncate" : "";

  /*
   * THE CUT TEXT GETS A WAY BACK, AND UNTIL THIS LINE IT HAD NONE.
   *
   * `truncate` above ends the line with an ellipsis, which is a promise that
   * there is more. This file set no `title` anywhere and neither did its
   * callers, so across the 73 files that import `Row` the promise was empty:
   * the ellipsis advertised text the reader had no way to reach. Founder's
   * report, 2026-09-01: *"everywhere, the text is getting truncated ... that's
   * not the right UI/UX part."*
   *
   * `title` IS THE FLOOR, NOT THE ANSWER, and saying so is the honest part of
   * this fix. It never appears on touch, it never appears for a keyboard user,
   * and screen readers treat it inconsistently. It is the right fix on THIS
   * component because a `Row` is a scan line whose full content has a detail
   * view to open -- that is exactly what a caller asserts by passing `tight`.
   * Where the cut text has no elsewhere, the fix is `meridian/Reveal`, whose
   * affordance is a real focusable button; five such surfaces were converted in
   * the same commit.
   *
   * TWO GUARDS, AND BOTH MATTER.
   *   - Only when `tight`. A tooltip repeating text already fully on screen is
   *     noise, and noise is how a reader learns to stop believing tooltips on
   *     the one row where something really is hidden.
   *   - Only for a plain string. `lead` and `sub` are `ReactNode`, and most of
   *     the call sites pass a fragment; `title` on one of those is either a
   *     type error or the literal string "[object Object]".
   */
  const hint = (value: ReactNode, explicit?: string): string | undefined => {
    if (!tight) return undefined;
    /* The explicit form wins: a caller that passes both has composed a
       fragment for the eye and a sentence for the tooltip, and the sentence is
       the one that survives being read out of context. */
    if (explicit) return explicit;
    return typeof value === "string" ? value : undefined;
  };

  const body = (
    <>
      <span className="flex w-[34px] flex-none items-center">{marks}</span>
      <span className="min-w-0 flex-1">
        <span
          title={hint(lead, leadTitle)}
          className={`block text-mrd-prose leading-[1.4] text-mrd-ink ${clamp}`}
        >
          {lead}
        </span>
        {sub ? (
          <span
            title={hint(sub, subTitle)}
            className={`mt-0.5 block text-mrd-base leading-[1.4] text-mrd-mute ${clamp}`}
          >
            {sub}
          </span>
        ) : null}
      </span>
      {time ? (
        <span className="font-mrd-mono flex-none text-mrd-small tabular-nums text-mrd-mute">
          {time}
        </span>
      ) : null}
    </>
  );

  /*
   * A row that is clickable AND carries its own control cannot be one button: a
   * button inside a button is invalid, and a 38px control would double the row
   * height. So the row becomes a container, the readable part becomes the
   * clickable region, and the control sits outside it at the trailing edge.
   *
   * The container keeps `cursor-default`; only the inner region is a pointer,
   * because the trailing control is not part of what "open this" means.
   */
  if (onClick && action) {
    return (
      <div
        data-mrd=""
        data-mrd-row=""
        data-tight={tight}
        data-focused={focused}
        data-has-action="true"
        className={`${ROW_SHAPE} ${ROW_BLEED} ${ROW_DIVIDER} cursor-default ${
          focused ? "bg-mrd-hover shadow-[inset_0_0_0_1px_var(--mrd-line)]" : ""
        }`}
        style={{ transitionDuration: "var(--mrd-d-press)" }}
      >
        <button
          type="button"
          onClick={onClick}
          className="flex min-w-0 flex-1 items-center gap-[13px] rounded-mrd-ctl text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--mrd-focus)]"
        >
          {body}
        </button>
        <span className="flex flex-none items-center gap-mrd-2">{action}</span>
      </div>
    );
  }

  const interactive = Boolean(onClick);
  const Tag = interactive ? "button" : "div";

  return (
    <Tag
      data-mrd=""
      data-mrd-row=""
      data-tight={tight}
      data-focused={focused}
      onClick={onClick}
      {...(interactive ? { type: "button" as const } : {})}
      className={`${ROW_SHAPE} ${ROW_BLEED} ${ROW_DIVIDER} ${
        interactive
          ? "cursor-pointer hover:bg-mrd-hover focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--mrd-focus)]"
          : "cursor-default"
      } ${focused ? "bg-mrd-hover shadow-[inset_0_0_0_1px_var(--mrd-line)]" : ""}`}
      style={{ transitionDuration: "var(--mrd-d-press)" }}
    >
      {body}
      {action ? <span className="flex flex-none items-center gap-mrd-2">{action}</span> : null}
    </Tag>
  );
}

/**
 * The actor's name inside a row lead.
 *
 * Ported alongside `Row` rather than in its own wave, though the build order put
 * it fifteenth. It is one span, it is meaningless outside a row lead, and
 * leaving it behind would mean a file could take Meridian's `Row` and still be
 * held on the retired layer by the word inside it.
 */
export function Who({ children }: { children: ReactNode }) {
  return <span className="font-semibold">{children}</span>;
}

/* ------------------------------------------------------------------ *
 * Line: a boundary you can read, with a control at the end of it
 * ------------------------------------------------------------------ */

const LINE_DIVIDER = "[&+[data-mrd-line]]:border-t [&+[data-mrd-line]]:border-mrd-line-soft";

/**
 * A setting, a policy, a fact with a switch at the end of it.
 *
 * Reported from Settings as the most-used shape on that surface. The governance
 * canon is the reason it is a line and not a card: policy is set in advance and
 * does not block, so a boundary reads as a sentence with a switch at the end of
 * it, not as a panel demanding attention. `sub` says WHY it matters or what it
 * currently lets through, never a restatement.
 *
 * ── THE DENSITY HERE IS MEASURED, AND THE NUMBERS SURVIVE THE PORT ───────
 * The retired sheet records this component as the most-used row in the app at
 * 42 call sites, and as the worst offender for height at 46.9px — inside the
 * 45-55px band that ink.css's own density research says "appeared almost
 * nowhere in shipped products". Row leading took it to 44.9px, and the padding
 * step from 13px to 11px took it to 40.9px, which is in the band the research
 * actually found.
 *
 * That is why this is `py-[11px]` and `leading-[1.4]` and not a tidier pair.
 * Those two values ARE the fix, and a port that rounded them would quietly
 * re-open a defect somebody measured to close.
 */
export function Line({
  label,
  sub,
  htmlFor,
  children,
}: {
  label: ReactNode;
  sub?: ReactNode;
  /** The id of the control on the right, when there is exactly one and it is a
   *  real form control.
   *
   *  Reported as a defect: Line rendered its label in a `<span>`, so a Line
   *  wrapping an Input or a Select had no `<label for>` at all and every lane
   *  patched it with `aria-label`, which duplicates the text a sighted person is
   *  already reading and leaves the label unclickable. Passing an id promotes
   *  the span to a real `<label>`.
   *
   *  ADDITIVE ON PURPOSE. Omitting it renders the same markup a plain Line
   *  always rendered, so the dozens of Lines whose right side is an action, a
   *  value or nothing at all are untouched: a `<label for>` pointing at a button
   *  would make the label a second way to fire it, which is wrong for a control
   *  that acts rather than holds a value. */
  htmlFor?: string;
  children?: ReactNode;
}) {
  const labelBody = (
    <>
      {label}
      {sub ? (
        /*
         * ITS OWN LEADING, AND THIS DOES NOT REOPEN THE MEASURED FIX ABOVE.
         * The row sets `leading-[1.4]` to land a single-line Line at 40.9px, and
         * that number is defended in this file's header. It was an argument about
         * a ROW'S BOX HEIGHT. This is a wrapped sentence up to 56 characters wide
         * that happened to inherit the same value, and 1.4 is the figure Meridian
         * deliberately left behind: `--mrd-lh-snug` reads "was 1.4; the reference's
         * air lives here". A Line with no `sub` is unchanged, which is the case the
         * 40.9px was measured on.
         */
        <span className="mt-0.5 block max-w-[56ch] text-mrd-label leading-mrd-snug text-mrd-mute">
          {sub}
        </span>
      ) : null}
    </>
  );

  const labelClass = "min-w-0 text-mrd-body text-mrd-ink";

  return (
    <div
      data-mrd=""
      data-mrd-line=""
      className={`flex min-h-9 items-center justify-between gap-[18px] py-[11px] leading-[1.4] ${LINE_DIVIDER}`}
    >
      {htmlFor ? (
        <label className={labelClass} htmlFor={htmlFor}>
          {labelBody}
        </label>
      ) : (
        <span className={labelClass}>{labelBody}</span>
      )}
      {children ? <span className="flex flex-none items-center gap-mrd-2">{children}</span> : null}
    </div>
  );
}
