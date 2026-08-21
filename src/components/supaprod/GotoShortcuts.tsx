import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { OPEN_MODAL_SELECTOR } from "@/lib/overlay";
import { PRIMARY_NAV, FOOTER_NAV, navKeyHint, NAV_CHORD_PREFIX } from "@/lib/nav-model";

// GO-THEN-THE-LETTER, and the overlay guard that keeps it honest.
//
// THE COMMAND PALETTE THIS FILE IS NAMED FOR IS GONE, retired by ruling on
// 2026-08-21. `CommandPalette()` rendered the glass ⌘K palette -- JUMP,
// SETTINGS, ACT, ASK and the capability CATALOG -- and it had ZERO call sites:
// nothing in `src/` ever rendered it, and Rollup tree-shook it out of the
// production build entirely. The reasoning, the two written contracts it
// reverses, and the evidence for each is in
// `docs/decisions/palette-retired-2026-08.md`.
//
// WHAT IS LEFT IS A DIFFERENT FEATURE THAT MERELY SHARED THE FILE, and that
// sharing is most of why the palette was misread as live twice. `GotoShortcuts`
// is the `g`-then-letter chord navigation. It IS mounted, at
// `_authenticated.tsx`, and it works. Reading "is CommandPalette.tsx in the
// route tree?" answered yes for a year while the palette was unreachable,
// because this is what the route was importing.
//
// THE DELETE IS A ONE-WAY DOOR, and the next reader should know before trying
// to undo it. All nineteen of this file's retired-design references sat in the
// deleted region; what remains scans clean, so `bun run design:ratchet` drops
// its baseline key. Restoring the old palette file would then trip rule 1 of
// `src/__tests__/meridian-ratchet.test.ts` -- a NEW file speaking a retired
// vocabulary -- with no sanctioned repair, and hand-widening the baseline is
// banned. `git revert` will not land it. That is accepted: every review of the
// palette priced a remount as a full Meridian repaint of 644 lines, so what is
// locked out is a shell nobody wanted back unported. The data it read survives
// on purpose in `lib/palette-catalog.ts` and `lib/palette-sections.ts`.
/**
 * GO, THEN THE LETTER. The one way a key reaches a destination.
 *
 * DERIVED from PRIMARY_NAV + FOOTER_NAV via `navKeyHint`, never hand-copied,
 * so the keycap the rail draws and the key this binds cannot drift.
 *
 * WHY A CHORD AND NOT A BARE KEY (founder ruling 2026-08-05, full reasoning on
 * NAV_CHORD_PREFIX in nav-model.ts). A bare navigation key is a WINDOW
 * listener, so it fires on every surface at once and competes with whatever
 * that surface bound. Navigation kept losing that contest: `a` was surrendered
 * to Approve, `r` to Reject, `c` to Challenge, leaving Runs on `u` and Crew on
 * `e`, which nobody can guess. Requiring `g` first puts navigation in its own
 * namespace, so `r` alone still rejects and `g` then `r` goes to Runs.
 *
 * THE WINDOW IS DELIBERATE. `g` arms the chord for two seconds and then
 * disarms. Without a timeout a stray `g` would silently swallow the next
 * keystroke minutes later, turning an Approve into a navigation. Any key that
 * is not a bound letter also disarms immediately, so a mistyped chord costs
 * nothing and never leaves the keyboard in a state the person cannot see.
 *
 * Mount once at app root.
 */
const CHORD_WINDOW_MS = 2000;

/**
 * PRESS `g` AND THE PRODUCT SHOWS YOU ITS LETTERS.
 *
 * THE DEFECT THIS CLOSES, founder-reported 2026-08-06: "I could see those
 * things only for the app panels — Today, Runs, accept/reject. Don't we have
 * those for the seven strips, Discover, Decide and so on?" He was reading the
 * screen correctly. Thirteen doors are bound; only the five RAIL ROWS draw a
 * keycap, and the seven loop stations are not rail rows — they are chips on the
 * spine strip, which drew number, name, note and dot and no key. So `g d`
 * through `g l` have been firing, undrawn, since the chord shipped. AppFrame's
 * own comment admitted it and left it open.
 *
 * WHY NOT SIMPLY PRINT THEM. Seven chips share the strip's width, the note
 * already drops under a container query at 880px, and the founder's other
 * standing complaint about this exact strip is noise. A permanent eighth mark
 * per chip pays for discoverability with the clutter he asked us to remove.
 *
 * SO THE CHORD ANNOUNCES ITSELF. Arming `g` stamps `data-chord="armed"` on the
 * document element, and CSS reveals every keycap in the product for the two
 * seconds the chord is live. At rest the strip is exactly as quiet as it is
 * today; the instant a person signals navigation intent, every door shows the
 * letter that opens it. Discovery costs nothing until it is wanted, and the
 * chord teaches itself on first use rather than needing a tour.
 *
 * A DOM ATTRIBUTE, NOT REACT STATE, and that is deliberate. This fires on
 * `keydown` for a key the person may be pressing by accident; routing it
 * through context would re-render every subscriber of the shell twice per
 * stray `g`. One attribute write reaches every surface at once, including
 * surfaces this component knows nothing about, and costs no reconciliation.
 * `prefers-reduced-motion` is respected in the stylesheet, not here.
 */
const CHORD_ATTR = "data-chord";

/**
 * WHAT COUNTS AS AN OPEN OVERLAY, and it was not what the old selector said.
 *
 * THE DEFECT, found 2026-08-06. The guard below stood down under
 * `[role="dialog"]` and nothing else. Radix gives a DESTRUCTIVE confirmation
 * `role="alertdialog"` instead, which is the entire purpose of that role, so
 * "Revoke token", "Delete this page?" and "Cancel subscription?" were precisely
 * the overlays this guard could not see. Every confirmation in the product goes
 * through ConfirmProvider's AlertDialog (use-confirm.tsx, "used by 32
 * surfaces"), mounted above `<Outlet/>` in __root.tsx and therefore OUTSIDE the
 * route that renders it. So `g` then a letter moved the router while the
 * question stayed on screen, and what was left was a confirmation floating over
 * a page that never named the thing being deleted -- with Confirm still live
 * and still holding the promise resolver of the surface you just left, because
 * unmounting a component does not cancel an awaited promise. Pressing it there
 * would have performed the deletion.
 *
 * IT GOT LOUDER THIS MORNING. Since the keycap reveal shipped, arming the chord
 * lights every keycap in the product; under an alertdialog it lit them UNDER
 * the scrim, which reads as the product inviting the press that breaks it.
 *
 * WHY NOTHING CAUGHT IT. A CSS selector that matches fewer nodes than intended
 * fails OPEN: navigation kept working, the chord kept firing, and every test
 * stayed green. Nothing in the repo asserted what this guard must REFUSE, only
 * what it must allow, so the one case it got wrong was the one nobody looked
 * at. `chord-stands-down-under-a-confirmation.test.tsx` asserts the refusal.
 *
 * WHY `[role="complementary"]` IS NOT HERE, considered and rejected. AskPane
 * and AuditLineageSheet are complementary regions, and both are deliberately
 * NOT modal: Ask records "KILL the scrim, the focus trap and `aria-modal` ...
 * the page behind it stays live and readable", lineage records "the pane, not a
 * modal sheet ... a person tracing provenance is comparing it against what they
 * were already looking at". A surface built to sit BESIDE the work must not
 * confiscate the keyboard that moves the work; adding it would answer a dialog
 * bug by making two working surfaces less capable, which is the ratchet run
 * backwards. `complementary` is also a plain landmark role that any future
 * sidebar may take, and one such sidebar would silently kill navigation
 * everywhere it mounts. A lineage trail surviving a navigation is correct: it
 * holds its own audit id and its own trail, and it stays true on any page.
 *
 * ONE CONSTANT, TWO CALL SITES. MissionShell.tsx runs the identical guard for
 * its 1-7 spine keys and carried a hand-copied duplicate of the old string,
 * which is how one guard came to have two ages. It imports this now, so the
 * next role that needs adding gets added once instead of remembered twice.
 */
/**
 * MOVED TO `@/lib/overlay`, re-exported here so the modules that already import
 * it from this file keep working. It left because three unrelated layers needed
 * it and reaching for it meant importing this entire component -- catalog,
 * recents, Radix dialog and all -- which broke AskPane's test suite the moment
 * AskPane asked for one string. A constant several layers depend on belongs
 * below all of them.
 */
export { OPEN_MODAL_SELECTOR } from "@/lib/overlay";

export function GotoShortcuts() {
  const navigate = useNavigate();
  useEffect(() => {
    let armedAt = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const disarm = () => {
      armedAt = 0;
      if (timer) clearTimeout(timer);
      timer = undefined;
      // Unconditional, and it is the reason this is a function rather than
      // three inline lines: EVERY exit from the armed state routes through
      // here -- the second key, a key that is not a letter, the timeout, and
      // unmount. A keycap left lit after the window closed would promise a
      // shortcut that no longer fires.
      document.documentElement.removeAttribute(CHORD_ATTR);
    };

    const onKey = (e: KeyboardEvent) => {
      /* SELECT WAS MISSING, and this handler is the one place it costs most.
         The house guard is `/^(INPUT|TEXTAREA|SELECT)$/` (today.tsx, decide.tsx,
         design.tsx, crew.tsx). This wrote its own three-way check and left the
         third out, so with a native dropdown focused, the browser's own
         type-ahead -- typing letters to jump to an option -- also fed this
         handler. Type "g" then "d" into a select looking for "Google Docs" and
         you left the page. Every surface that wrote its own variant of this
         guard has now been wrong once; the regex is the version that is right. */
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // LOOM W4: never fire surface switches under an open dialog/overlay - a
      // keystroke into a focused-but-non-input dialog must not yank the user
      // to another station and drop their in-flight decision. What counts as
      // open, and why alertdialog had to join it, is on OPEN_MODAL_SELECTOR.
      if (document.querySelector(OPEN_MODAL_SELECTOR)) {
        // DISARM ON THE WAY OUT, rather than the bare `return` this used to be.
        // An overlay can open in the two seconds AFTER `g`: press `g`, then
        // reach for the mouse and click Revoke token. The chord is still armed,
        // so every keycap in the product stays lit under the scrim until the
        // window expires -- advertising letters that the line above is already
        // refusing to act on. A keycap that does nothing is a lie, and it was
        // one for up to two seconds. disarm() is the single funnel out of the
        // armed state, so this exits exactly the way every other dead chord
        // does rather than hand-clearing the attribute here.
        disarm();
        return;
      }

      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const armed = armedAt !== 0 && Date.now() - armedAt < CHORD_WINDOW_MS;

      if (!armed) {
        if (key === NAV_CHORD_PREFIX) {
          // Arm, and do NOT preventDefault: `g` on its own belongs to whatever
          // surface is open until the second key proves this was navigation.
          armedAt = Date.now();
          document.documentElement.setAttribute(CHORD_ATTR, "armed");
          timer = setTimeout(disarm, CHORD_WINDOW_MS);
        }
        return;
      }

      disarm();

      /**
       * THE SECOND KEY BELONGS TO NAVIGATION, AND NOTHING ELSE MAY HAVE IT.
       *
       * THE DEFECT, proven live 2026-08-06 with the network blocked so it could
       * not commit: pressing `g` then `d` on /today navigated to Discover AND
       * fired `decideApprovalItem` with `verdict: "reject"` on the waiting
       * call. One keystroke, two acts, and the destructive one was silent and
       * irreversible. The same shape on /approvals (`g r` rejects the focused
       * call), on /decide (`g k` drafts a spec and spends money, `g c` runs the
       * Critic) and on /discover.
       *
       * WHY THE OLD CODE COULD NOT PREVENT IT. `preventDefault` stops the
       * BROWSER's default action; it does nothing to other listeners. Both this
       * handler and the surfaces' handlers bind `keydown` on `window`, so both
       * always ran. The armed marker could not rescue it either: `disarm()`
       * fires above before the key is resolved, so a page handler reading the
       * attribute would always see it already cleared.
       *
       * WHY CAPTURE, and why nothing weaker works. `stopPropagation` in the
       * bubble phase only silences listeners registered AFTER this one on the
       * same target, and `defaultPrevented` is only visible to those same later
       * listeners -- both depend on registration order, which is decided by
       * where React happens to mount things. A window CAPTURE listener runs
       * before every bubble listener in the document, always, whatever the tree
       * looks like. That is why the listener below is registered with
       * `capture: true`: it is the only position from which this can be settled
       * once rather than re-argued in every surface that ever binds a letter.
       *
       * A MISTYPED CHORD NOW COSTS NOTHING, which is what the comment on
       * CHORD_WINDOW_MS already promised. Any single-character key pressed
       * while armed is consumed: it navigates if it is bound, and if it is not,
       * it does nothing at all. Before this, `g` then a typo'd `x` on /decide
       * dropped a bet. Keys that cannot be a chord's second key -- Escape,
       * Enter, Tab, the arrows -- disarm and pass straight through, so a chord
       * left armed can never swallow an Escape out of a dialog.
       */
      if (key.length !== 1) return;
      e.preventDefault();
      e.stopPropagation();

      const target = [...PRIMARY_NAV, ...FOOTER_NAV].find((item) => {
        const hint = navKeyHint(item);
        return hint !== "" && hint === key;
      });
      if (target) navigate({ to: target.to, search: target.search as never });
    };

    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      disarm();
    };
  }, [navigate]);
  return null;
}
