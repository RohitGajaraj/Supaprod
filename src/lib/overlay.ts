/**
 * WHAT COUNTS AS SOMETHING BEING OPEN OVER THE PAGE.
 *
 * One selector, in a leaf module, because five handlers need the same answer
 * and this repo has already paid twice for that answer existing in two ages.
 * MissionShell carried a hand-copied duplicate of the old string, which is how
 * one guard came to be older than the other; then the chord's copy learned
 * about `alertdialog` and the copies disagreed again.
 *
 * WHY A FILE OF ITS OWN, rather than living in CommandPalette.tsx where it
 * started (that file is `components/supaprod/GotoShortcuts.tsx` now -- its
 * palette was retired on 2026-08-21 and it was renamed for what it holds). It was exported from there and three unrelated modules imported it,
 * which meant importing a large React component -- with its catalog, its
 * recents, its Radix dialog and their transitive graph -- to read one string.
 * That is not a style objection: it broke AskPane's own test suite the moment
 * AskPane reached for the constant, because a component module pulled into a
 * jsdom test brings everything it touches with it. A constant that several
 * layers depend on has to sit BELOW all of them.
 *
 * WHY BOTH `data-state` AND `aria-modal` FOR EACH ROLE. Radix marks an open
 * layer with `data-state="open"` and keeps it mounted through its exit
 * animation, when the attribute flips to "closed". The repo's own hand-rolled
 * overlays -- BoardPanel, ShortcutSheet -- declare `aria-modal="true"` and have
 * no data-state at all. Neither clause covers the other, so both are here.
 *
 * `alertdialog` IS THE ONE THAT WAS MISSING and it was the expensive one:
 * Radix renders every DESTRUCTIVE confirmation with that role, so "Delete this
 * page?" and "Revoke token" were precisely the dialogs the guard could not see.
 * Pressing a navigation chord over one of them left the page while the
 * confirmation stayed on screen, now floating over a surface that had never
 * named the thing being deleted.
 */
export const OPEN_MODAL_SELECTOR = [
  '[role="dialog"][data-state="open"]',
  '[role="dialog"][aria-modal="true"]',
  '[role="alertdialog"][data-state="open"]',
  '[role="alertdialog"][aria-modal="true"]',
].join(", ");

/** True when anything modal is on screen. The question every Escape and every
 *  bare-key handler in the shell has to ask before it claims a keystroke. */
export function isModalOpen(): boolean {
  if (typeof document === "undefined") return false;
  return document.querySelector(OPEN_MODAL_SELECTOR) !== null;
}
