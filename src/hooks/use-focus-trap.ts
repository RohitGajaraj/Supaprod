import * as React from "react";

/**
 * WHAT `aria-modal="true"` PROMISES, AND WHAT THE SHELL WAS DELIVERING.
 *
 * THE DEFECT, found by an accessibility audit on 2026-08-06 and true of BOTH
 * hand-rolled overlays in the shell -- `BoardPanel` and the `?` shortcut sheet
 * shipped hours earlier the same night. Each declares `role="dialog"` and
 * `aria-modal="true"`. Neither moved focus in on open, neither constrained Tab,
 * and neither gave focus back on close.
 *
 * That combination is worse than having no dialog semantics at all, because the
 * two halves disagree about reality. `aria-modal="true"` tells a screen reader
 * that everything outside the dialog is inert, so it stops offering it. Nothing
 * actually made it inert -- no `inert` attribute, no `aria-hidden` -- so a
 * sighted keyboard user could Tab straight past the scrim and operate the page
 * underneath, in controls their screen reader had just been told do not exist.
 * Both overlays render as the LAST children of `.sp-app`, after the rail and
 * the whole work region, so tabbing forward from the trigger walked the entire
 * page before reaching the dialog it had just opened.
 *
 * WHY A HOOK AND NOT A LIBRARY. Radix already provides this for every dialog
 * the product builds on it; these two are hand-rolled because they predate that
 * choice and are wide overlays rather than centred ones. Pulling a focus-trap
 * dependency for two components would be a package for fifty lines. Rewriting
 * them onto Radix is the better answer and is a bigger change than one night.
 *
 * WHAT IT DOES, in the order the APG dialog pattern requires:
 *   - remembers what had focus BEFORE the dialog opened;
 *   - moves focus inside on open, preferring an element that asked for it;
 *   - keeps Tab and Shift+Tab inside, wrapping at both ends;
 *   - puts focus back where it was on close, so the trigger is under the
 *     person's hands again and the page has not moved beneath them.
 *
 * IT DOES NOT TOUCH ESCAPE. Each overlay owns its own dismissal, and the shell
 * has a deliberate Escape ladder with four rungs (see escape-layers.test.tsx).
 * A trap that also closed on Escape would add a fifth rung nobody declared.
 */

/** Everything a person can Tab to. Ordered as the DOM orders it, which is the
 *  order Tab uses, so no sorting is needed or wanted. */
const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

function focusableWithin(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    // `offsetParent` is null for anything `display: none`, which is the cheap
    // and correct test here: a hidden control is not a Tab stop, and a trap that
    // included one would send focus somewhere invisible.
    (el) => el.offsetParent !== null || el === document.activeElement,
  );
}

export function useFocusTrap(open: boolean): React.RefObject<HTMLDivElement | null> {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const root = ref.current;
    if (!root) return;

    /**
     * CAPTURED BEFORE ANYTHING MOVES, because by the time this effect runs the
     * dialog is already in the DOM and one bad ordering would record the
     * dialog's own first control as "where the person came from".
     */
    const returnTo = document.activeElement as HTMLElement | null;

    // Prefer an element that asked for focus; otherwise the first real control.
    // Falling back to the root itself (with tabindex -1) is what keeps a dialog
    // with no controls at all from leaving focus outside it.
    const wanted = root.querySelector<HTMLElement>("[data-autofocus]");
    const first = wanted ?? focusableWithin(root)[0] ?? root;
    if (first === root) root.tabIndex = -1;
    first.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = focusableWithin(root);
      if (items.length === 0) {
        // Nothing to move between: hold focus rather than letting Tab escape to
        // the page the dialog claims is inert.
        e.preventDefault();
        return;
      }
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const active = document.activeElement;

      // Wrap at both ends. The `!root.contains(active)` case matters: focus can
      // be outside already if the trigger kept it, and Tab should then enter the
      // dialog rather than continue down the page.
      if (e.shiftKey && (active === firstItem || !root.contains(active))) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && (active === lastItem || !root.contains(active))) {
        e.preventDefault();
        firstItem.focus();
      }
    };

    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      /**
       * GIVE IT BACK, and only if it is still there. A dialog that navigated
       * away has torn its own trigger out of the DOM, and focusing a detached
       * node silently sends focus to `body` -- which reads to a screen reader as
       * the page starting over. `isConnected` is the check that turns that into
       * a no-op instead.
       */
      if (returnTo && returnTo.isConnected) returnTo.focus();
    };
  }, [open]);

  return ref;
}
