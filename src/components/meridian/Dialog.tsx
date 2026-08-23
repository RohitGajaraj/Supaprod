import type { ReactNode } from "react";
import { useCallback, useEffect, useId, useRef } from "react";

/*
 * THE DIALOG: the one place this product may ask a question that blocks.
 *
 * ── WHY IT HAD TO BE BUILT ──────────────────────────────────────────────
 * NO MERIDIAN-LAYER COMPONENT CONSUMED `--mrd-scrim` OR `--mrd-shadow-pane`.
 *
 * That is the claim that survives measurement, and the first version of this
 * comment made a stronger one that was false: it said the pane shadow was "read
 * by NOTHING" and the scrim had "exactly one caller". Re-measured 2026-08-20,
 * both are live outside `components/meridian/`. The pane shadow has five
 * consumers: `shell.css` :2200, :2271, :2380, :2848, and `RewindButton.tsx:120`
 * through the `shadow-mrd-pane` utility. The scrim has three: `shell.css:2176`
 * (`.sp-boardpanel-scrim`), `shell.css:2836` (`.sp-keys-scrim`), and
 * `RewindButton.tsx:112`.
 *
 * Every one of those is either the retired shell layer or a Radix `AlertDialog`
 * drawn in retired primitives. So the deepest shadow in the system and the token
 * for dimming a page behind a question had been measured, argued for, and then
 * never spent by anything in Meridian, because Meridian had no surface that
 * floats. And the other half of the reason was never in doubt: every dialog in
 * the product is still legacy.
 *
 * The product cannot ask "stop this run and discard forty minutes of work?"
 * without one. `alert`, `confirm`, `prompt` and the native `<dialog>` are banned
 * repo-wide and ESLint enforces it, so there was literally nowhere for that
 * question to go.
 *
 * ── WHAT THIS IS NOT ────────────────────────────────────────────────────
 * It is not `useConfirm`. That hook is the app-level confirm 32 surfaces already
 * share, and it is a Radix alert dialog drawn in `components/shell/primitives`,
 * the retired layer. Adopting this component underneath it is the right next
 * move and it is a different change: `hooks/use-confirm.tsx` is not this item's
 * to touch, and swapping the drawing under 32 live surfaces is not a thing to do
 * in the same commit as introducing the part.
 *
 * ── IT DOES NOT PORTAL, AND THAT IS DELIBERATE ──────────────────────────
 * The reflex is `createPortal` to `document.body`, and it is wrong here for a
 * reason specific to this system: `[data-theme="light"]` is an ATTRIBUTE
 * SELECTOR, not a document-level switch, so every `--mrd-*` token resolves from
 * wherever the element sits in the tree. A dialog portalled to `body` leaves the
 * subtree that set the ground and comes out wearing the dark theme on a paper
 * page. It also makes it impossible to render this in both grounds side by side,
 * which is the one thing the gallery exists to do and the reason a 1.19:1 button
 * label was caught rather than shipped.
 *
 * THE COST OF NOT PORTALLING, stated so nobody has to rediscover it: a
 * `position: fixed` element is positioned against the nearest ancestor with a
 * `transform`, `filter`, `perspective`, `backdrop-filter` or `container-type`,
 * not against the viewport. If a caller mounts this inside a transformed
 * ancestor, the overlay will be trapped inside that box. Mount it from a
 * surface's own root rather than from deep inside a card.
 *
 * ── THE FOCUS CONTRACT, WHICH IS THE COMPONENT ──────────────────────────
 * Focus moves in on open, cannot leave while it is open, and returns to whatever
 * opened it on close. That last one is the half everybody drops, and dropping it
 * strands a keyboard reader at the top of the document after every question.
 */

/**
 * Everything a keyboard can land on. Order matters: this is used to find the
 * first and last stop, so it has to match DOM order, which `querySelectorAll`
 * guarantees.
 */
const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function Dialog({
  open,
  onClose,
  title,
  children,
  actions,
  labelledBy,
}: {
  open: boolean;
  /**
   * Called by Escape, by a click on the scrim, and by nothing else. The dialog
   * never closes itself on a decision: the caller owns whether pressing an
   * action closes the question, because "keep it open and show what went wrong"
   * is a real answer and a component cannot know when it applies.
   */
  onClose: () => void;
  /** The question, as a question. One line. */
  title: ReactNode;
  /** The consequence, in a sentence a person can act on. */
  children: ReactNode;
  /**
   * The controls, passed in rather than built here. `Action` and `Approve` are
   * the vocabulary; a dialog that hard-coded its own buttons would be a fifth
   * copy of the control faces and would make its own call about which of them is
   * the accent, which is exactly what `surface-parts.tsx` was written to stop.
   *
   * THE RULE, AND IT IS NOT OPTIONAL: pass the way out FIRST and the confirming
   * action LAST. The row is right-aligned by this component, so last means
   * rightmost, and rightmost is where every confirming action in this product
   * already lives. See the block above the actions row for why.
   */
  actions?: ReactNode;
  /** Overrides the generated title id, for a caller that titles it elsewhere. */
  labelledBy?: string;
}) {
  const titleId = useId();
  const bodyId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  /*
   * WHAT OPENED THIS. Captured on the transition into open rather than on every
   * render, because by the second render the active element is already inside
   * the dialog and restoring focus to it would put the reader back on a button
   * that no longer exists.
   */
  const returnTo = useRef<HTMLElement | null>(null);

  const focusables = useCallback((): HTMLElement[] => {
    const panel = panelRef.current;
    if (!panel) return [];
    return [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)];
  }, []);

  useEffect(() => {
    if (!open) return;

    const opener = document.activeElement;
    returnTo.current = opener instanceof HTMLElement ? opener : null;

    /*
     * Focus the first control if there is one, and the panel itself if there is
     * not. The panel carries `tabIndex={-1}` for exactly this: a dialog with
     * nothing focusable in it still has to take focus, or the reader stays
     * outside a modal that has taken over the screen.
     */
    const first = focusables()[0];
    (first ?? panelRef.current)?.focus();

    /*
     * The page behind must not scroll. Its previous value is put back rather
     * than cleared, so a surface that had already locked the body for its own
     * reasons is not silently unlocked by this dialog closing.
     */
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
      /*
       * THE HALF EVERYBODY DROPS. Without this a keyboard reader is returned to
       * the top of the document after every question, and on a long surface that
       * means tabbing back down through everything they had already passed.
       */
      returnTo.current?.focus();
    };
  }, [open, focusables]);

  if (!open) return null;

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }

    if (event.key !== "Tab") return;

    /*
     * THE TRAP, and it only intervenes at the two edges. Taking over every Tab
     * would mean reimplementing the browser's own focus order, which is where
     * hand-rolled traps go wrong: a radio group, a `contenteditable` and a
     * horizontally scrolling toolbar all move focus in ways a selector list does
     * not predict. At the edges there is no ambiguity, so that is the only place
     * this touches.
     */
    const stops = focusables();
    if (stops.length === 0) {
      event.preventDefault();
      return;
    }

    const first = stops[0];
    const last = stops[stops.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || active === panelRef.current)) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      data-mrd=""
      className="fixed inset-0 z-50 flex items-center justify-center p-mrd-5 font-mrd"
      onKeyDown={onKeyDown}
    >
      {/*
       * THE SCRIM, and it is a plain dim rather than a blur. `--mrd-scrim` was
       * measured for this and the glass ban is a standing ruling: a blurred
       * backdrop makes the text behind it into texture, which reads as decoration
       * and costs a compositor pass on every surface it covers.
       *
       * It is a `<button>` because it is a real control: clicking it closes.
       * `aria-hidden` keeps it out of the accessible tree, because Escape is the
       * documented way out for anyone not using a pointer and a second unnamed
       * dismiss control in the tab order is noise. It carries `tabIndex={-1}` so
       * it never becomes a tab stop inside the trap.
       */}
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-mrd-scrim"
        style={{ animation: "mrd-fade-in 160ms var(--mrd-ease-soft) both" }}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy ?? titleId}
        aria-describedby={bodyId}
        tabIndex={-1}
        /*
         * `stopPropagation` and NOT `onClick={() => {}}`: a click inside must not
         * reach the scrim, and the scrim is a sibling rather than a parent, so
         * this is belt and braces for a caller that nests this differently. The
         * acceptance criterion is explicit that a click inside does not close.
         */
        onClick={(event) => event.stopPropagation()}
        /*
         * IT CAPS ITS OWN HEIGHT AND SCROLLS ITS BODY, and the first version did
         * neither, which made a tall panel UNRECOVERABLE rather than merely ugly.
         * The overlay centres, so a panel taller than the viewport overflowed
         * both edges at once; the effect on the mount above locks
         * `document.body`, so the page behind could not be scrolled either; and a
         * centred flex item cannot be scrolled back up to by any means. The half
         * that went off the top edge is the QUESTION. Three gallery cases all
         * fitted, so it looked fine.
         *
         * `max-h-full` against the padded overlay, `flex-col`, and the body as
         * the only `min-h-0 overflow-y-auto` child. That keeps the title and the
         * controls pinned while the consequence scrolls, which is what both
         * siblings that can grow already do (`RunTimeline.tsx`, `ToolStream.tsx`)
         * and what the product's own summoned sheet does (`shell.css:2195`).
         */
        className="relative flex max-h-full w-full max-w-[420px] flex-col rounded-mrd-pane border border-mrd-line bg-mrd-float px-mrd-6 py-mrd-5"
        style={{
          /* The deepest shadow in the system, which until now had no caller.
             A pane that floats over a dimmed page is what it was measured for. */
          boxShadow: "var(--mrd-shadow-pane)",
          /* Inline, so meridian.css's reduced-motion block reaches it. An
             animation declared in a utility class keeps playing for somebody who
             asked it not to, which is a defect this repo has already paid for in
             six files. */
          animation: "mrd-pop-in 180ms var(--mrd-ease) both",
        }}
      >
        <h2 id={titleId} className="shrink-0 mrd-title">
          {title}
        </h2>

        <div
          id={bodyId}
          className="mt-mrd-3 max-w-[62ch] min-h-0 overflow-y-auto mrd-copy"
        >
          {children}
        </div>

        {/*
         * THE CONFIRMING ACTION IS ALWAYS ON THE RIGHT. One side, every dialog,
         * no exceptions, and this row is where that is enforced rather than
         * requested.
         *
         * The first version left the side to the caller and the caller moved it:
         * across this component's own three gallery cases the confirming button
         * was right, then LEFT, then right. This is the one component whose whole
         * job is to make a click deliberate, and it was putting that click under
         * a different part of the pointer's travel from one question to the next.
         *
         * RIGHT rather than left, decided by what already ships instead of by
         * taste: `hooks/use-confirm.tsx` is the confirm 32 surfaces share and it
         * has always put cancel first and the confirming action last, in a
         * right-aligned footer. A new rule that contradicts 32 live surfaces is a
         * second convention, not a convention.
         *
         * SO THIS ROW DELIBERATELY DOES NOT USE `Actions`' `trailing` SLOT, and
         * that is a departure worth naming. `trailing` protects a destructive
         * control with DISTANCE, which is right on a card, where a click destroys
         * immediately. In a dialog the distance has already been paid: the
         * question itself is the confirmation step, and the reader arrived here by
         * asking to. Spending the protection twice buys nothing and costs the
         * fixed side, which is worth more. A caller who passes `trailing` anyway
         * gets the same geometry regardless, because `ml-auto` has no free space
         * to work with inside a shrink-to-fit row.
         */}
        {actions ? <div className="mt-mrd-5 flex shrink-0 justify-end">{actions}</div> : null}
      </div>
    </div>
  );
}

export default Dialog;
