import * as React from "react";
import { render, fireEvent, cleanup, act } from "@testing-library/react";
import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * THE QUESTION STAYS, AND SO DOES THE PAGE THAT ASKED IT.
 *
 * THE DEFECT, found 2026-08-06. GotoShortcuts already refused to navigate under
 * an open overlay, but it looked for `[role="dialog"]` and Radix gives a
 * DESTRUCTIVE confirmation `role="alertdialog"` instead. So the overlays the
 * guard was blind to were exactly the ones that matter: "Revoke token", "Delete
 * this page?", "Cancel subscription?". Press `g` then a letter and the router
 * left while ConfirmProvider -- mounted above `<Outlet/>` in __root.tsx, so it
 * outlives any route -- kept the confirmation on screen, floating over a page
 * that never named the thing being deleted, with Confirm still holding the
 * promise resolver of the surface you had just left. Unmounting a component
 * does not cancel an awaited promise, so pressing Confirm there still deleted.
 *
 * WHY NOTHING CAUGHT IT. A CSS selector that matches fewer nodes than intended
 * FAILS OPEN. Navigation kept working, the chord kept firing, every existing
 * test stayed green, and the keycap reveal that shipped the same morning made
 * it worse by lighting every keycap under the scrim. The chord's tests asked
 * only whether it navigated -- which it did, correctly, the whole time. Nothing
 * anywhere asserted what the guard must REFUSE. That is what this file is.
 *
 * IT IS A DOM TEST AND NOT A STRING MATCH, deliberately: the bug was a selector
 * that read as correct. Only a real element with the real attributes Radix
 * writes can tell the difference between a guard and a guard-shaped string.
 */

const navigateSpy = mock((_: unknown) => {});
const routerActual = await import("@tanstack/react-router");
mock.module("@tanstack/react-router", () => ({
  ...routerActual,
  useNavigate: () => navigateSpy,
}));

const { GotoShortcuts } = await import("./CommandPalette");

/** A key press the way a person makes one: on the window, no modifiers. */
const press = (key: string) =>
  act(() => {
    fireEvent.keyDown(window, { key });
  });

/** The armed marker GotoShortcuts stamps, which is what lights every keycap. */
const chordAttr = () => document.documentElement.getAttribute("data-chord");

const navigatedTo = () => navigateSpy.mock.calls.map((c) => (c[0] as { to: string }).to).join(",");

/**
 * A stand-in for a portalled overlay, built from the attributes Radix actually
 * writes rather than by rendering the component: pulling AlertDialog in here
 * would drag ConfirmProvider and its 32 calling surfaces into a test about four
 * attributes. The shapes below are copied from what Radix emits, and the DOM is
 * the only thing the guard reads.
 */
function openOverlay(attrs: Record<string, string>) {
  const el = document.createElement("div");
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  document.body.appendChild(el);
  return el;
}

beforeEach(() => {
  navigateSpy.mockClear();
  document.documentElement.removeAttribute("data-chord");
});

afterEach(() => {
  cleanup();
  // replaceChildren, not innerHTML: this only has to take the appended overlay
  // back out, and assigning markup to a body is the habit that becomes an XSS
  // the day someone interpolates a value into it.
  document.body.replaceChildren();
  document.documentElement.removeAttribute("data-chord");
});

describe("a chord under an open overlay never moves the router", () => {
  /**
   * THE CONTROL, and it is not a formality. Every other case in this block
   * passes if the chord is broken outright, so without this one a typo that
   * disabled navigation entirely would read as four green refusals.
   */
  test("with nothing open, `g` then `d` goes to Discover", () => {
    render(<GotoShortcuts />);
    press("g");
    expect(chordAttr()).toBe("armed");
    press("d");
    expect(navigatedTo()).toBe("/discover");
    expect(chordAttr()).toBe(null);
  });

  test("a destructive confirmation blocks it: role=alertdialog, data-state=open", () => {
    render(<GotoShortcuts />);
    // Exactly what ConfirmProvider's AlertDialogContent renders while open.
    openOverlay({ role: "alertdialog", "data-state": "open", "aria-modal": "true" });
    press("g");
    press("d");
    expect(navigatedTo()).toBe("");
    // And the keycaps never lit, so nothing under the scrim invited the press.
    expect(chordAttr()).toBe(null);
  });

  test("blocks a confirmation carrying only aria-modal, mid close animation", () => {
    render(<GotoShortcuts />);
    // Radix keeps the node mounted with data-state="closed" for the 300ms exit
    // animation while aria-modal stays true. It still owns the keyboard there:
    // the resolver has fired but the scrim is still on screen, and a navigation
    // landing in that window looks to a person exactly like the bug above.
    openOverlay({ role: "alertdialog", "data-state": "closed", "aria-modal": "true" });
    press("g");
    press("d");
    expect(navigatedTo()).toBe("");
  });

  test("blocks a non-modal alertdialog, which carries data-state and no aria-modal", () => {
    render(<GotoShortcuts />);
    openOverlay({ role: "alertdialog", "data-state": "open" });
    press("g");
    press("d");
    expect(navigatedTo()).toBe("");
  });

  test("still blocks a plain dialog, which is the half that already worked", () => {
    render(<GotoShortcuts />);
    openOverlay({ role: "dialog", "data-state": "open", "aria-modal": "true" });
    press("g");
    press("d");
    expect(navigatedTo()).toBe("");
  });

  /**
   * THE RESIDUE OF THE SAME BUG, and it survives the selector fix on its own.
   * An overlay can open in the two seconds AFTER `g`: press `g`, then reach for
   * the mouse and click Revoke token. The selector now refuses the letter, but
   * a bare `return` left the chord armed, so every keycap in the product stayed
   * lit under the scrim until the window expired. A keycap that does nothing is
   * a lie; this one lied for up to two seconds, at the exact moment a person is
   * being asked to confirm a deletion.
   */
  test("a confirmation opening mid-chord puts the keycaps out at once", () => {
    render(<GotoShortcuts />);
    press("g");
    expect(chordAttr()).toBe("armed");

    openOverlay({ role: "alertdialog", "data-state": "open", "aria-modal": "true" });
    press("d");

    expect(navigatedTo()).toBe("");
    expect(chordAttr()).toBe(null);
  });
});

describe("a pane you consult beside the work keeps the keyboard alive", () => {
  /**
   * THE DELIBERATE CARVE-OUT, recorded as a test so the next person to widen
   * the selector has to argue with it rather than discover it.
   *
   * AskPane and AuditLineageSheet are `role="complementary"`, and both chose
   * that on purpose. Ask: "KILL the scrim, the focus trap and `aria-modal` ...
   * the page behind it stays live and readable". Lineage: "the pane, not a
   * modal sheet ... a person tracing provenance is comparing it against what
   * they were already looking at". A surface built to sit BESIDE the work must
   * not confiscate the keyboard that moves the work. A lineage trail that
   * outlives a navigation is also still true: it holds its own audit id and its
   * own trail, and those are workspace facts, not page facts.
   *
   * `complementary` is a plain landmark role besides, which any future sidebar
   * may take. Putting it in the selector would let one such sidebar silently
   * disable navigation on every page it mounts.
   */
  test("a lineage pane does not block the chord", () => {
    render(<GotoShortcuts />);
    openOverlay({ role: "complementary", "aria-label": "Lineage" });
    press("g");
    press("d");
    expect(navigatedTo()).toBe("/discover");
  });
});

describe("one guard, not two copies of a guard", () => {
  const MISSION_SHELL = readFileSync(
    join(import.meta.dir, "..", "mission", "MissionShell.tsx"),
    "utf8",
  );

  /**
   * MissionShell runs the identical guard for its 1-7 Spine keys and carried a
   * hand-copied duplicate of the selector string. A copy is a guard with its
   * own age: it was written the same day and then stopped learning, so the
   * alertdialog blindness above lived on in the retired shell after the live
   * one was fixed. This asserts the string is imported, never retyped, so the
   * next role that needs adding is added once.
   */
  /**
   * WHERE IT IS IMPORTED FROM STOPPED MATTERING, and pinning the path was this
   * test asking the wrong question.
   *
   * The selector moved to `@/lib/overlay` an hour after this was written. Not
   * tidying: three unrelated layers needed it, and importing it from
   * CommandPalette meant pulling an entire React component -- its catalog, its
   * recents, its Radix dialog and everything they touch -- into whatever asked.
   * That broke AskPane's own suite the moment AskPane reached for one string.
   *
   * So the assertion is now the RULE rather than the address: imported from
   * somewhere, never retyped. The sibling test below is what actually forbids a
   * hand-written copy, and it is the one carrying the weight.
   */
  test("MissionShell imports the selector rather than retyping it", () => {
    expect(MISSION_SHELL).toMatch(/import \{ OPEN_MODAL_SELECTOR \} from "[^"]+";/);
    expect(MISSION_SHELL).toContain("document.querySelector(OPEN_MODAL_SELECTOR)");
  });

  test("MissionShell hand-writes no role selector of its own", () => {
    // Comments are stripped first: the one above the guard NAMES the roles in
    // prose, and a raw scan would read that explanation as the offence.
    const code = MISSION_SHELL.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    expect(code).not.toMatch(/\[role="(dialog|alertdialog)"\]/);
  });
});
