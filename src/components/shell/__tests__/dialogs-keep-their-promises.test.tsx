import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test, expect, afterEach } from "bun:test";
import { render, cleanup, screen } from "@testing-library/react";

import { useFocusTrap } from "@/hooks/use-focus-trap";

/**
 * A DIALOG THAT SAYS `aria-modal` HAS TO MEAN IT.
 *
 * THE DEFECT, found by an accessibility audit on 2026-08-06 and true of BOTH
 * hand-rolled overlays in the shell. `BoardPanel` and the `?` shortcut sheet
 * each declared `role="dialog"` and `aria-modal="true"`. Neither moved focus in
 * on open, neither constrained Tab, and neither gave focus back on close.
 *
 * That is worse than having no dialog semantics, because the two halves
 * disagree about reality. `aria-modal="true"` tells a screen reader that
 * everything outside is inert, so it stops offering it. Nothing made it inert,
 * so a sighted keyboard user could Tab past the scrim and operate controls
 * underneath that their screen reader had just been told did not exist. Both
 * overlays render as the LAST children of `.sp-app`, after the rail and the
 * whole work region, so tabbing forward from the trigger walked the entire page
 * before arriving at the dialog it had opened.
 *
 * NOTHING COULD SEE IT. tsc cannot; no test asserted focus; and on screen
 * nothing looks wrong, because the scrim is drawn and the mouse works. It is
 * only reachable by pressing Tab, which is the one input nobody was testing.
 */

const SRC = join(import.meta.dir, "..", "..", "..", "..");
const read = (rel: string) => readFileSync(join(SRC, rel), "utf8");

afterEach(cleanup);

/* --------------------------------------------------------- the trap itself */

function Harness({ open }: { open: boolean }) {
  const trap = useFocusTrap(open);
  return (
    <div>
      <button data-testid="outside-before">before</button>
      {open ? (
        <div ref={trap} role="dialog" aria-modal="true" aria-label="Test dialog">
          <button data-testid="in-1">one</button>
          <button data-testid="in-2">two</button>
          <button data-testid="in-3">three</button>
        </div>
      ) : null}
      <button data-testid="outside-after">after</button>
    </div>
  );
}

const tab = (shift = false) =>
  document.activeElement?.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Tab", shiftKey: shift, bubbles: true, cancelable: true }),
  );

describe("the focus trap keeps focus where the dialog claims it is", () => {
  test("focus moves inside the moment it opens", () => {
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    outside.focus();
    render(<Harness open />);
    expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true);
    outside.remove();
  });

  test("Tab wraps at the end instead of leaving for the page behind", () => {
    render(<Harness open />);
    const dialog = screen.getByRole("dialog");
    screen.getByTestId("in-3").focus();
    tab();
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).toBe(screen.getByTestId("in-1"));
  });

  test("Shift+Tab wraps backwards the same way", () => {
    render(<Harness open />);
    screen.getByTestId("in-1").focus();
    tab(true);
    expect(document.activeElement).toBe(screen.getByTestId("in-3"));
  });

  test("many tabs never reach a control outside the dialog", () => {
    // The original defect exactly: Tab walked the whole page. Twenty presses is
    // more than enough to cross three in-dialog stops and reach the two outside.
    render(<Harness open />);
    const dialog = screen.getByRole("dialog");
    for (let i = 0; i < 20; i++) {
      tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });

  test("focus goes back to where it came from when the dialog closes", () => {
    const trigger = document.createElement("button");
    trigger.id = "trigger";
    document.body.appendChild(trigger);
    trigger.focus();
    const r = render(<Harness open />);
    expect(document.activeElement).not.toBe(trigger);
    r.rerender(<Harness open={false} />);
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  test("a trigger that has left the DOM is not focused, so focus is not thrown to body", () => {
    // Focusing a detached node silently sends focus to <body>, which a screen
    // reader reads as the page starting over. A dialog that navigates away tears
    // its own trigger out, so this is the normal case, not the exotic one.
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();
    const r = render(<Harness open />);
    trigger.remove();
    expect(() => r.rerender(<Harness open={false} />)).not.toThrow();
  });
});

/* ------------------------------------------------- the two real dialogs use it */

describe("both hand-rolled dialogs actually use the trap", () => {
  const SHEET = read(join("src", "components", "shell", "ShortcutSheet.tsx"));
  const BOARD = read(join("src", "components", "shell", "BoardPanel.tsx"));

  for (const [name, src] of [
    ["the shortcut sheet", SHEET],
    ["the board panel", BOARD],
  ] as const) {
    test(`${name} declares aria-modal and traps focus`, () => {
      // The pair is the point. Either alone is a defect: aria-modal without a
      // trap is the lie, and a trap without aria-modal leaves a screen reader
      // still offering the page behind.
      expect(src).toContain('aria-modal="true"');
      expect(src).toContain("useFocusTrap");
      expect(src).toMatch(/ref=\{trap\}/);
    });
  }
});

/* ------------------------------------------------------ decisions are spoken */

describe("a decision committed by keyboard is announced", () => {
  // Repointed 2026-08-24: shell/primitives.tsx was deleted (R013 item 1) and
  // Receipt survived into Meridian at components/meridian/Receipt.tsx:85.
  const RECEIPT = read(join("src", "components", "meridian", "Receipt.tsx"));

  test("Receipt is a live region, so every gate announces without six edits", () => {
    // Six surfaces committed irreversible decisions in total silence: Today,
    // Approvals, Decide, Design, Crew and Discover. Every one of those
    // mutations ends in a Receipt, so this primitive is the one place that
    // covers all of them and every gate built after tonight.
    expect(RECEIPT).toContain('role="status"');
    expect(RECEIPT).toContain('aria-live="polite"');
  });

  test("polite, not assertive: it answers a keypress rather than interrupting", () => {
    expect(RECEIPT).not.toContain('aria-live="assertive"');
  });
});

/* --------------------------------------------------------- a visible control */

describe("a text field can be seen before it is focused", () => {
  const INK = read(join("src", "styles", "ink.css"));
  const PRIM = read(join("src", "styles", "primitives.css"));

  test("fields use the field edge, not the hairline that measured 1.2 to 1", () => {
    // --sp-line is rgba(255,255,255,0.1). The fill (--sp-sink) and the page
    // (--sp-bg) are two shades of the same near-black, so the border was the
    // only thing making the control perceivable and it was invisible.
    const block = PRIM.slice(PRIM.indexOf(".sp-input,"));
    expect(block.slice(0, 900)).toContain("border: 1px solid var(--sp-field-edge)");
  });

  test("both themes define the edge and a stronger focus edge", () => {
    // Raising the resting edge broke focus on paper: it used --sp-mute, which
    // is LIGHTER than the new rest, so a focused field read as weaker than an
    // idle one. Measured in a browser: rest 3.73 dark / 4.08 light against the
    // ground, focus 8.0 and 7.83 against the fill.
    expect(INK.match(/--sp-field-edge:/g) ?? []).toHaveLength(2);
    expect(INK.match(/--sp-field-edge-focus:/g) ?? []).toHaveLength(2);
    const focusBlock = PRIM.slice(PRIM.indexOf(".sp-input:focus,"));
    expect(focusBlock.slice(0, 500)).toContain("border-color: var(--sp-field-edge-focus)");
  });
});
