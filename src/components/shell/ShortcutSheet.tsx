import * as React from "react";

import { useFocusTrap } from "@/hooks/use-focus-trap";

import {
  GLOBAL_KEYS,
  KEYBOARD_RULES,
  navChords,
  surfaceKeysFor,
  type SurfaceKey,
} from "@/lib/key-model";

/**
 * THE DOOR ONTO THE KEYBOARD, which this product did not have.
 *
 * FOUNDER, 2026-08-06, asking why the seven stations carried no keycaps: "what
 * is our plan and strategy for that? And what is the right way to do that?"
 * Drawing the keycaps was half the answer and shipped first. This is the other
 * half, and it is the bigger one.
 *
 * WHAT THE AUDIT FOUND. Thirty confirmed defects across twenty-six files that
 * bind keys, and underneath them one fact: THE PRODUCT HAD NO SURFACE ANYWHERE
 * THAT LISTED ITS OWN SHORTCUTS. The Cmd+K palette is the only place the chord
 * table was ever written on screen, in its JUMP section, and that palette is
 * not mounted -- `_authenticated.tsx` imports `GotoShortcuts` from that file
 * and nothing else, and calls the palette retired. Cmd+K belongs to Ask now. So
 * every key in this product was learnable only by reading its source.
 *
 * That is this repo's signature defect, named in AppFrame: "a capability with
 * no door". Fourteen bound keys, no door.
 *
 * `?` IS THE DOOR EVERY COMPARABLE PRODUCT ALREADY USES -- Gmail, GitHub,
 * Linear, Jira, Slack, Notion, Superhuman -- so for most people this is not a
 * new thing to learn but a thing they will try. It was bound to nothing.
 *
 * IT IS A `role="dialog"` WITH `aria-modal`, AND THAT IS NOT COSMETIC. The
 * chord handler stands down under exactly that selector, so declaring it this
 * way is what stops the help sheet becoming the next hole in the keyboard: with
 * any other role, pressing `g` then a letter over this sheet would navigate the
 * page underneath while the sheet stayed open. The audit found that precise bug
 * living in Radix's `alertdialog`, which the guard does not match, so the shape
 * of the mistake is not hypothetical.
 *
 * SECTION THREE IS THE ONE THAT EARNS THE SHEET, and it is honest about its
 * limit. `key-model.ts` declares what each surface binds and a drift test holds
 * the declaration to the code in both directions, so this cannot show a key
 * that does not fire or hide one that does. What it is NOT yet is the listener:
 * the surfaces still register their own. Until that refactor lands, a surface
 * with no entry says it has no keyboard, which is true of /design and /team and
 * is the finding rather than a gap in this file.
 */

export function ShortcutSheet({
  open,
  onClose,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
}) {
  /**
   * FOCUS, WHICH THIS SHIPPED WITHOUT AND SHOULD NOT HAVE.
   *
   * It declared `role="dialog" aria-modal="true"` and did none of what those
   * two attributes promise: focus never entered, Tab walked straight past the
   * scrim into the page underneath, and closing left focus wherever it happened
   * to be. `aria-modal` had meanwhile told a screen reader that the page behind
   * was inert, so the two halves of the same overlay disagreed about what
   * existed. Found by an accessibility audit the same night this was written.
   */
  const trap = useFocusTrap(open);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // `stopPropagation` because this is the innermost thing on screen when it
      // is open, and one Escape must close one layer. The audit found a single
      // press collapsing three at once elsewhere in the shell; this sheet does
      // not join them.
      e.preventDefault();
      e.stopPropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  if (!open) return null;

  const surface = surfaceKeysFor(pathname);
  const chords = navChords();

  return (
    <div
      className="sp-keys"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      ref={trap}
    >
      {/* The scrim closes, the same as the board's. Someone who opened this to
        check one key should not have to hunt for the way out of it. */}
      <button
        type="button"
        className="sp-keys-scrim"
        aria-label="Close the shortcuts"
        data-autofocus
        onClick={onClose}
      />
      <div className="sp-keys-sheet">
        <div className="sp-keys-head">
          <span className="sp-keys-title">Keyboard</span>
          <span className="sp-keys-esc">Esc closes</span>
        </div>

        <div className="sp-keys-body">
          {/* THE RULES FIRST, because three sentences explain the whole system
            and save reading the table at all. Every one of them is true today;
            see KEYBOARD_RULES for the fourth line that was cut for not being. */}
          <ul className="sp-keys-rules">
            {KEYBOARD_RULES.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>

          {/* ON THIS SURFACE, FIRST. The audit's draft put "go anywhere" at the
            top. Navigation is the section a person needs ONCE; the keys that
            act on what is in front of them are the ones they came to check, and
            they are also the ones that bite. So they lead. */}
          <Section
            name={surface ? `On ${surface.label}` : "On this surface"}
            note={surface ? undefined : "This surface has no keys of its own yet."}
          >
            {surface?.keys.map((k) => (
              <KeyRow key={k.key} entry={k} />
            ))}
          </Section>

          <Section name="Anywhere in the app">
            {GLOBAL_KEYS.map((k) => (
              <KeyRow key={k.key} entry={k} />
            ))}
          </Section>

          {/* GO ANYWHERE, derived from nav-model so the sheet cannot disagree
            with the keyboard. The prefix is drawn on every row rather than
            hoisted into the heading: a row reading a bare "d" is a promise the
            keyboard does not keep, which is the exact defect that put the wrong
            key in the rail's accessible name and on the Settings gear. */}
          <Section name={`Go anywhere (${chords.length} doors)`}>
            {chords.map((c) => (
              <KeyRow key={c.to} entry={{ key: c.keys, does: c.label }} />
            ))}
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  name,
  note,
  children,
}: {
  name: string;
  note?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="sp-keys-section" aria-label={name}>
      <h3 className="sp-keys-sectionname">{name}</h3>
      {note ? <p className="sp-keys-note">{note}</p> : null}
      {children ? <dl className="sp-keys-list">{children}</dl> : null}
    </section>
  );
}

function KeyRow({ entry }: { entry: SurfaceKey }) {
  return (
    <div className="sp-keys-row" data-bites={entry.destructive ? "true" : "false"}>
      <dt>
        <kbd className="sp-keys-cap">{entry.key}</kbd>
      </dt>
      {/* The mark is a word, not only a colour. "Commits" is said out loud so
        the warning survives a screen reader and a monochrome screen, which the
        red-dot version of this would not. */}
      <dd>
        {entry.does}
        {entry.destructive ? <span className="sp-keys-bites">Commits</span> : null}
      </dd>
    </div>
  );
}

/**
 * `?` OPENS IT, guarded the way every other bare key in the shell is guarded.
 *
 * Shift is NOT excluded, because `?` is Shift and `/` on every layout this
 * ships to: excluding it would bind a key nobody can press. The other three
 * modifiers are excluded so a browser or OS chord never opens this instead.
 *
 * CAPTURE, for the same reason the chord uses it: a surface that binds `?` in
 * future must not also fire. Nothing binds it today, which is the whole
 * problem this closes, so the guard is for the version of the product that
 * exists next month rather than this one.
 */
export function useShortcutSheetKey(onOpen: () => void) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "?") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable)
        return;
      // Not over an open dialog: a help sheet summoned on top of a
      // confirmation would bury the decision the person is in the middle of.
      if (document.querySelector('[role="dialog"][aria-modal="true"], [role="alertdialog"]'))
        return;
      e.preventDefault();
      onOpen();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onOpen]);
}
