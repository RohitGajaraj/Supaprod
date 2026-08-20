/**
 * A CTX ROW THAT DOES SOMETHING IS A REAL BUTTON, AND IT WAS NOT.
 *
 * THE DEFECT THIS PREVENTS. `CtxRow` rendered `<div onClick role="button"
 * tabIndex={0}>` with no `onKeyDown`. A div does not natively activate on Enter
 * or Space, so the row was reachable by Tab, announced itself to a screen reader
 * as a button and took the app-wide focus ring, then did nothing when operated.
 * Focusable and announced but inert is worse than never being focusable: it
 * offers a control and then refuses it.
 *
 * IT IS A REGRESSION RATHER THAN A GAP. The retired Cadence/ink `CtxRow` this
 * one replaced returns a real `<button>` (shell/primitives.tsx:1221) and states
 * the rule in its own docblock at :239 -- "It is a REAL `<button>` when it does
 * something, so it is tabbable, it answers Space and Enter, and it takes the
 * app-wide focus ring". The Meridian replacement lost it. No caller passes
 * `onClick` today, which is exactly why fixing it now is cheap.
 *
 * WHAT THIS RUNNER CANNOT ASSERT, AND IT IS THE OBVIOUS TEST. Neither happy-dom
 * nor jsdom synthesises Enter or Space activation of a native button: measured,
 * `fireEvent.keyDown(button, { key: "Enter" })` fires the handler ZERO times
 * while `fireEvent.click` fires it once. Enter-and-Space activation is browser
 * behaviour that comes WITH the element, so the assertion that stands in for it
 * is the element itself. And `getByRole("button")` matched the old div too, so
 * the role is not a discriminator either. Hence `tagName` and `type` below.
 * Do not "improve" this file by adding a keyDown case; it would pass on nothing.
 *
 * SCOPE. Three `CtxRow` exports exist. This one is Meridian's; `shell/
 * primitives.tsx:1182` and `crew/CrewChrome.tsx:452` are separate components
 * with their own callers and are not touched by this.
 */
import { describe, expect, it } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { CtxRow } from "../ContextColumn";

describe("a row that does something is a real button", () => {
  it("renders a native button, typed, when onClick is present", () => {
    render(<CtxRow name="Retention brief" onClick={() => {}} />);
    const el = screen.getByRole("button");

    // The whole fix, in the one assertion the old div fails.
    expect(el.tagName).toBe("BUTTON");
    expect(el.getAttribute("type")).toBe("button");
  });

  it("runs the handler when it is operated", () => {
    let clicked = 0;
    render(<CtxRow name="Retention brief" onClick={() => clicked++} />);
    fireEvent.click(screen.getByRole("button"));

    expect(clicked).toBe(1);
  });

  it("keeps the row text against the left edge", () => {
    // A button centres its content and shrinks to fit, so the element that
    // fixes the keyboard would have broken the layout without these two.
    render(<CtxRow name="Retention brief" sub="4 signals" onClick={() => {}} />);
    const el = screen.getByRole("button");

    expect(el.classList.contains("text-left")).toBe(true);
    expect(el.classList.contains("w-full")).toBe(true);
  });

  it("offers no control at all when there is nothing to do", () => {
    const { container } = render(<CtxRow name="Retention brief" sub="4 signals" />);

    expect(screen.queryByRole("button")).toBe(null);
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe("DIV");
    expect(root.hasAttribute("tabindex")).toBe(false);
  });

  it("carries data-mrd as the attribute and never as a class", () => {
    // `data-mrd` was in the className string. No `.data-mrd` rule exists in any
    // stylesheet, so it styled nothing, while the attribute it looks like is
    // what the focus ring is scoped to.
    render(<CtxRow name="Retention brief" onClick={() => {}} />);
    const el = screen.getByRole("button");

    expect(el.hasAttribute("data-mrd")).toBe(true);
    expect(el.classList.contains("data-mrd")).toBe(false);
  });

  it("stays an anchor where the row is a link", () => {
    const { container } = render(<CtxRow name="The spec" href="/plan/spec/abc" />);
    const el = container.firstElementChild as HTMLElement;

    expect(el.tagName).toBe("A");
    expect(el.getAttribute("href")).toBe("/plan/spec/abc");
    expect(el.classList.contains("data-mrd")).toBe(false);
  });
});
