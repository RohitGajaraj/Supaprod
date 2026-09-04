/**
 * THE FOUR SURFACES NOTHING IN THIS REPO HAD EVER RENDERED.
 *
 * Until the port they were module-local functions handed to `errorComponent:`
 * and `notFoundComponent:` inside two route files, so no test could mount them
 * and every claim about them was a claim about source text. They are the
 * boundary for all 112 routes.
 *
 * What is asserted here is what a reader cannot check by looking:
 *
 *   `data-mrd` on the ROOT of each one, because `AuthedLayout` mounts
 *   `data-obsidian` on `<html>` and the unlayered `[data-obsidian]
 *   :focus-visible` rule beats every Tailwind utility. Without the attribute on
 *   an ancestor, the one control on each of these screens takes the legacy ring.
 *
 *   THE TWO STATES DO NOT CONVERGE. A failed read carries a fail mark and a
 *   retry; a missing route carries neither and offers a door. One component
 *   serving both is the defect the standard exists to prevent.
 *
 *   NO GROUND-SPECIFIC LITERAL ANYWHERE, checked by rendering each surface in
 *   both grounds and comparing the markup. The code this replaced wrote
 *   `var(--text-body, #C6C0B8)` on every line; a hex cannot answer the paper
 *   ground, and identical markup in both is the only proof that none is left.
 *
 * The root error's retry is checked at its CALL SITE in `__root.tsx` rather than
 * here, because the thing that can regress is the closure passed in: calling
 * `reset()` without `router.invalidate()` looks identical and recovers nothing.
 */
import * as React from "react";
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { fireEvent, render, screen } from "@testing-library/react";

import {
  PageReadFailed,
  PageRouteMissing,
  ShellReadFailed,
  ShellRouteMissing,
} from "../boundary-states";

/**
 * The markup of one surface, WITHOUT the brand mark.
 *
 * `SupaprodMark` is dropped and it is the only exclusion here. It is a 4KB
 * inline SVG that carries `var(--text-primary, #f2f0ed)` on its stroke and mints
 * a fresh `useId` gradient id on every render, so leaving it in would make both
 * of the assertions below report on a file this port does not own and cannot
 * fix. It is also the one element on these screens that is theme-invariant by
 * founder ruling, so it has nothing to say about whether the COMPOSITION
 * answers both grounds. Noted rather than swallowed: its `--text-primary`
 * stroke is real debt, in `src/components/supaprod/SupaprodMark.tsx`.
 */
function paintOf(node: React.ReactElement): string {
  const { container, unmount } = render(node);
  container.querySelector('[aria-label="Supaprod"]')?.remove();
  const markup = container.innerHTML;
  unmount();
  return markup;
}

/** The same surface in each ground. The tokens are declared on `:root` and
 *  re-declared under `[data-theme="light"]`, so a composition that leans on them
 *  rather than on literals produces the same tree twice. */
function inBothGrounds(node: React.ReactElement): { dark: string; light: string } {
  const root = document.documentElement;
  root.removeAttribute("data-theme");
  const dark = paintOf(node);

  root.setAttribute("data-theme", "light");
  const light = paintOf(node);
  root.removeAttribute("data-theme");

  return { dark, light };
}

const SURFACES: ReadonlyArray<{ name: string; node: React.ReactElement }> = [
  { name: "ShellReadFailed", node: <ShellReadFailed error={new Error("read timed out")} /> },
  { name: "ShellRouteMissing", node: <ShellRouteMissing /> },
  {
    name: "PageReadFailed",
    node: <PageReadFailed error={new Error("read timed out")} onRetry={() => {}} />,
  },
  { name: "PageRouteMissing", node: <PageRouteMissing /> },
];

describe("every failure surface is inside the system", () => {
  for (const { name, node } of SURFACES) {
    it(`${name} carries data-mrd on its root, or its controls lose the ring`, () => {
      const { container, unmount } = render(node);
      expect(
        (container.firstElementChild as HTMLElement).hasAttribute("data-mrd"),
        `${name} rendered outside Meridian, so its buttons take the legacy [data-obsidian] ring`,
      ).toBe(true);
      unmount();
    });

    it(`${name} renders identically in both grounds`, () => {
      const { dark, light } = inBothGrounds(node);
      expect(dark, `${name} drew something ground-specific`).toBe(light);
    });

    it(`${name} writes no raw colour and no retired token`, () => {
      const markup = paintOf(node);
      for (const marker of [
        "--text-",
        "--ds-",
        "--sp-",
        "--hairline",
        "--font-pixel",
        "data-obsidian",
      ]) {
        expect(markup, `${name} still speaks ${marker}`).not.toContain(marker);
      }
      expect(markup, `${name} still carries a frozen hex`).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    });
  }
});

describe("a failed read and a missing route are never the same component", () => {
  it("says the read stopped, and offers to run it again", () => {
    render(<ShellReadFailed error={new Error("session read timed out")} />);
    expect(screen.getByText(/stopped part way through loading/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reload the page" })).toBeTruthy();
    expect(screen.getByText(/session read timed out/)).toBeTruthy();
  });

  it("announces a failed read, because it arrived while the reader was waiting", () => {
    const { container } = render(<ShellReadFailed error={new Error("boom")} />);
    expect(container.querySelector('[role="status"]')).toBeTruthy();
  });

  it("does not tell a 404 that its read failed, and offers no retry", () => {
    const { container } = render(<ShellRouteMissing />);
    expect(container.textContent).toContain("no screen at this address");
    expect(screen.queryByRole("button", { name: /Reload|Try again/ })).toBeNull();
    expect(
      container.querySelector('[role="status"]'),
      "an empty state announced itself, which no empty state in this system does",
    ).toBeNull();
  });

  it("hands the missing screen one real door and not a plausible-looking one", () => {
    let went = 0;
    render(<ShellRouteMissing onGoToToday={() => went++} />);
    fireEvent.click(screen.getByRole("button", { name: "Back to Start" }));
    expect(went).toBe(1);
  });
});

describe("the two whole-page boundaries", () => {
  it("keeps the retry the caller handed over, and does not invent one", () => {
    let retried = 0;
    render(<PageReadFailed error={new Error("x")} onRetry={() => retried++} />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retried).toBe(1);
  });

  it("offers a way out as well as a way back in", () => {
    let home = 0;
    render(<PageReadFailed error={new Error("x")} onRetry={() => {}} onGoHome={() => home++} />);
    fireEvent.click(screen.getByRole("button", { name: "Go home" }));
    expect(home).toBe(1);
  });

  it("states the cause, because it is the one thing a person can send on", () => {
    render(<PageReadFailed error={new Error("worker returned 500")} onRetry={() => {}} />);
    expect(screen.getByText(/worker returned 500/)).toBeTruthy();
  });

  it("says something when the error carried no message of its own", () => {
    render(<PageReadFailed error={new Error("")} onRetry={() => {}} />);
    expect(screen.getByText(/no message of its own/)).toBeTruthy();
  });

  it("keeps the status code on the 404, and both of its doors", () => {
    let home = 0;
    let signIn = 0;
    const { container } = render(
      <PageRouteMissing onGoHome={() => home++} onSignIn={() => signIn++} />,
    );
    expect(container.textContent).toContain("404");
    fireEvent.click(screen.getByRole("button", { name: "Go home" }));
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect([home, signIn]).toEqual([1, 1]);
  });

  it("gives the page one h1, which the state component's h2 sits under", () => {
    render(<PageRouteMissing />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
      "no page at this address",
    );
  });
});

describe("nothing a person reads on these screens apologises decoratively", () => {
  it("carries no em or en dash on any of the four", () => {
    for (const { name, node } of SURFACES) {
      const { container, unmount } = render(node);
      expect(container.textContent ?? "", `${name} carries a dash a person can see`).not.toMatch(
        /[\u2013\u2014]/,
      );
      unmount();
    }
  });

  it("says what it cost, on every screen that reports a failure", () => {
    /* The rule these were failing: "This part of Supaprod hit an error" told a
       person something broke and left them to guess whether their work survived.
       Both failure surfaces now answer that in the same breath as the fact. */
    for (const node of [
      <ShellReadFailed key="s" error={new Error("x")} />,
      <PageReadFailed key="p" error={new Error("x")} onRetry={() => {}} />,
    ]) {
      const { container, unmount } = render(node);
      expect(
        container.textContent,
        "a failure reported itself without saying what it cost",
      ).toMatch(/nothing was (saved|lost)/i);
      unmount();
    }
  });
});

describe("the root boundary spends both halves of its retry", () => {
  /*
   * A source read, and the reason it is one: the closure lives inside a route
   * OPTION in `__root.tsx`, which cannot be mounted without a router. What can
   * regress is dropping one of the two calls, and that regression is invisible
   * in a rendered tree because the button still exists and still does something.
   */
  const source = readFileSync(
    fileURLToPath(new URL("../../../routes/__root.tsx", import.meta.url)),
    "utf8",
  );

  it("calls router.invalidate() and reset() together", () => {
    const at = source.indexOf("onRetry={");
    expect(at, "the root error boundary no longer hands a retry to anything").toBeGreaterThan(-1);
    const retry = source.slice(at, source.indexOf("}}", at));
    expect(retry, "the router cache was left holding the failed load").toContain(
      "router.invalidate()",
    );
    expect(retry, "the boundary was left holding the error").toContain("reset()");
  });

  it("no longer names the archived Tempo contract as its authority", () => {
    expect(source).not.toContain("DESIGN-TEMPO.md");
  });

  it("has no BoundaryShell left to drift", () => {
    expect(source).not.toContain("function BoundaryShell");
  });
});
