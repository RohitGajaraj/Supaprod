/**
 * Nothing in the rail may look pressable and do nothing.
 *
 * ── THE DEFECT THIS PINS, WHICH THE RAIL SHIPPED WITH ───────────────────────
 * The workspace row was a `<button>` with no handler on it, carrying
 * `aria-label="<name>, switch workspace"` when collapsed. So it had a hover wash, a
 * press scale, a focus ring, a tab stop, a switcher chevron, and a promise read out
 * loud to a screen reader -- and pressing it did nothing at all.
 *
 * What makes that worth a test rather than a quiet fix: this component's own source
 * criticises the REFERENCE for exactly this shape, calling its quick-add "an
 * affordance that looks pressable, is not, and cannot be reached from the keyboard
 * at all", and then shipped a worse version two hundred lines further up. A silent
 * inert span at least does not announce a capability.
 *
 * A control that does nothing is not a small bug. The reader presses it, nothing
 * happens, and they stop trusting every other control in the rail. ContextCards makes
 * the same argument about a source chip with no link, and reaches the same answer:
 * state the fact, do not dress it as a control.
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "bun:test";

const source = readFileSync(new URL("../SidebarNav.tsx", import.meta.url), "utf8");

/** The WorkspaceRow definition only, so an assertion cannot be satisfied elsewhere. */
function workspaceRow(): string {
  const from = source.indexOf("function WorkspaceRow(");
  expect(from, "WorkspaceRow is gone; the inert button may be back").toBeGreaterThan(-1);
  const after = source.indexOf("\nfunction ", from + 10);
  return source.slice(from, after === -1 ? undefined : after);
}

describe("the workspace row is a control only when it has somewhere to go", () => {
  const row = workspaceRow();

  it("renders a non-interactive element when no handler is given", () => {
    expect(row.includes("if (!onClick)"), "the row is always a button").toBe(true);
    expect(row.includes("<div className={shared}")).toBe(true);
  });

  it("gives the inert version none of a control's clothes", () => {
    // Everything before the early return is what the plain version renders. A hover
    // wash or a press scale on a non-control is the visual half of the same lie.
    const inert = row.slice(row.indexOf("if (!onClick)"), row.indexOf("return (\n    <button"));
    expect(inert.includes("hover:bg-mrd-hover"), "the inert row still washes on hover").toBe(false);
    expect(inert.includes("active:scale"), "the inert row still presses").toBe(false);
    expect(inert.includes("focusRing"), "the inert row still takes a focus ring").toBe(false);
  });

  it("never announces switching on something that cannot switch", () => {
    /*
     * THE WORST HALF OF THE ORIGINAL DEFECT. A sighted person sees a dead button; a
     * screen reader user is TOLD it switches workspace. The label belongs only to the
     * branch that has a handler.
     */
    const inert = row.slice(row.indexOf("if (!onClick)"), row.indexOf("return (\n    <button"));
    expect(inert.includes("switch workspace"), "the inert row promises a switch").toBe(false);
    expect(row.includes("aria-label={collapsed ? `${name}, switch workspace`")).toBe(true);
  });

  it("passes the handler through when there is one", () => {
    expect(row.includes("onClick={onClick}")).toBe(true);
  });
});

describe("the chevron is a promise the row has to be able to keep", () => {
  it("draws only when the row switches something", () => {
    // A switcher glyph beside a name that cannot be switched is the same lie drawn
    // instead of announced.
    expect(source.includes("{onWorkspaceClick && (")).toBe(true);
  });
});

describe("the quick-add stays a real button, which is the reference's own bug", () => {
  it("carries a handler and an accessible name", () => {
    // The reference draws a hover-revealed span with no handler. This must not drift
    // back toward it.
    expect(source.includes("onClick={item.onAdd}")).toBe(true);
    expect(source.includes("aria-label={item.addLabel ?? `New ${item.label}`}")).toBe(true);
  });

  it("stops swallowing clicks when it is invisible", () => {
    // An invisible button that still takes the pointer is a hole in the row's edge
    // that nobody can see.
    expect(source.includes("pointerEvents: isActive || hovered === item.key")).toBe(true);
  });
});
