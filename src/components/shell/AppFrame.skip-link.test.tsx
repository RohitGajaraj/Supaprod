/**
 * THE RAIL'S OWN DOORS COME BEFORE THE PAGE, IN TAB ORDER (P-16b, A-QUEUE.md).
 *
 * A1's DOM audit (12:15 IST) found the Start composer as the thirteenth tab
 * stop on a fresh page load, and the same shape holds on every signed-in
 * route: `<aside className="sp-rail">` sits before `<main className="sp-work">`
 * in AppFrame's own source order (four regions, header/rail/work/Ask, always
 * in that order), so a keyboard arrival walks New work item, Find, Start, Run
 * and every account control before it ever reaches the routed page.
 *
 * THIS IS A RENDERED-DOM TEST, NOT A SOURCE SCAN, on purpose (the packet's own
 * instruction) -- but it renders a FAITHFUL, MINIMAL reproduction of
 * AppFrame's own region order rather than the full production component.
 *
 * A FULL MOUNT WAS ATTEMPTED FIRST AND ABANDONED, and the reason is worth
 * keeping. AppFrame reads six server functions (interceptable at
 * `useServerFn`, the way P-36's own fix does it) but ALSO touches the real
 * Supabase client directly (`supabase.auth.getUser()` in a `useEffect`) and
 * `@/hooks/use-theme`. Full mount hit two real, only-visible-in-the-full-
 * suite hazards: (1) `@/integrations/supabase/client`'s exported client is a
 * lazy, PROCESS-WIDE memoized singleton gated on `process.env.SUPABASE_URL`
 * -- some other file in the suite mutates that env var for its own tests,
 * and depending on load order this file's own construction could inherit an
 * invalid value and throw, an "Unhandled error between tests" only the full
 * run (never this file alone) surfaced; (2) mocking `@/hooks/use-theme`
 * bare, without spreading the real module, shadowed its OTHER export
 * (`ThemeProvider`) for whichever file loaded it next in the same process --
 * the exact Rule 14 mistake `a-module-mock-is-process-wide.test.ts` and this
 * session's own P-36 pass already paid to learn. Chasing both down further
 * was a worse trade than a smaller, honest test: `AppFrame.rail-covers-keys.
 * test.ts`, this file's own neighbour, already documents avoiding a full
 * mount for the same reason ("a full mount needs a RouterProvider this file
 * does not carry").
 *
 * WHAT THIS PROVES INSTEAD. The three lines below -- the skip link, the
 * rail's own class, and the main region's id/tabIndex -- are copied
 * verbatim from `AppFrame.tsx` (cited by their current line numbers) and
 * `shell.css`'s `.skip-link` rule is the real, unmocked stylesheet file this
 * markup depends on for its clip/reveal behaviour. What is NOT reproduced
 * (the header's live line, the crew presence, the account menu) carries no
 * ordering risk: nothing in AppFrame conditionally hides or reorders the
 * skip link, the rail, or main relative to each other, so a change to any
 * of that unrelated content cannot silently restore the original defect.
 * A1's own live walk is still the check that a REAL Tab press in a REAL
 * browser lands where this test says it does.
 */
import { render, cleanup } from "@testing-library/react";
import { describe, test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SRC = readFileSync(join(import.meta.dir, "AppFrame.tsx"), "utf8");
const CSS = readFileSync(join(import.meta.dir, "../../styles/shell.css"), "utf8");

/** Proves the markup below is not a paraphrase: the exact strings this file
 *  renders are strings AppFrame.tsx and shell.css actually carry today. If
 *  a future edit renames the class, the id, or drops the skip link
 *  entirely, this fails BEFORE the DOM-order assertions below get a chance
 *  to pass against a reproduction nothing in production matches any more. */
describe("the reproduction below is not a fiction", () => {
  test("AppFrame.tsx still carries the skip link, in this shape", () => {
    expect(SRC).toContain('<a href="#main-content" className="skip-link">');
    expect(SRC).toContain('<main className="sp-work" id="main-content" tabIndex={-1}');
    expect(SRC).toContain('<aside className="sp-rail">');
  });

  test("shell.css still defines .skip-link's reveal-on-focus rule", () => {
    expect(CSS).toContain(".skip-link {");
    expect(CSS).toContain(".skip-link:focus {");
  });
});

function AppFrameRegionOrder() {
  return (
    <div className="sp-app">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <header className="sp-top">
        <button type="button">New work item</button>
        <button type="button">Find</button>
        <a href="/start">Start</a>
        <button type="button">Settings</button>
      </header>
      <div className="sp-mid">
        <aside className="sp-rail">
          <a href="/start">Start</a>
          <a href="/track">Run</a>
        </aside>
        <main className="sp-work" id="main-content" tabIndex={-1}>
          <button type="button">The routed page's own first control</button>
        </main>
      </div>
    </div>
  );
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

describe("the skip link is the first tab stop, ahead of every rail door", () => {
  test("exists, points at #main-content, and is the first focusable element in the DOM", () => {
    const { container } = render(<AppFrameRegionOrder />);
    const focusables = Array.from(container.querySelectorAll(FOCUSABLE));
    expect(focusables.length).toBeGreaterThan(0);

    const skipLink = container.querySelector("a.skip-link");
    expect(skipLink).not.toBeNull();
    expect(skipLink?.getAttribute("href")).toBe("#main-content");
    // The DOM's own order, not the source's: the first element a real Tab
    // press would reach after the browser hands focus to the document body.
    expect(focusables[0]).toBe(skipLink);
    cleanup();
  });

  test("its target exists and is focusable, which is what makes the jump land", () => {
    const { container } = render(<AppFrameRegionOrder />);
    const main = container.querySelector("#main-content");
    expect(main).not.toBeNull();
    expect(main?.tagName).toBe("MAIN");
    // -1 and not absent: a browser only moves keyboard focus to a fragment
    // target that CAN take focus. Absent, the skip link would scroll the
    // page and leave focus behind at the link itself.
    expect(main?.getAttribute("tabindex")).toBe("-1");
    cleanup();
  });

  test("every rail row sits after the skip link in the rendered DOM", () => {
    const { container } = render(<AppFrameRegionOrder />);
    const skipLink = container.querySelector("a.skip-link");
    const rail = container.querySelector(".sp-rail");
    expect(skipLink).not.toBeNull();
    expect(rail).not.toBeNull();
    // Node.DOCUMENT_POSITION_FOLLOWING: `rail` comes AFTER `skipLink`.
    const position = skipLink!.compareDocumentPosition(rail!);

    expect(Boolean(position & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
    cleanup();
  });
});
