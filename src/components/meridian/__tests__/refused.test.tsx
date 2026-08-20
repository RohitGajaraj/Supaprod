/**
 * `Refused`: THE READ SUCCEEDED AND THE ANSWER IS NO.
 *
 * What is asserted here is what a reader cannot check by looking, and what a
 * later edit could quietly undo.
 *
 *   IT DOES NOT CONVERGE ON ITS NEIGHBOURS. A refusal, a failed read and an
 *   empty region are three facts that send a person in three directions, and
 *   this repo has already been caught collapsing two of them: one surface
 *   rendered a READ FAILURE through an empty state, telling a reader a thing did
 *   not exist when the truth was that it could not be loaded. The regression to
 *   guard against here is the same shape one step over, so the mark, the hue and
 *   the absence of a retry are all pinned.
 *
 *   THE HUE IS AMBER AND NOT RED, and the greyscale carrier is the SILHOUETTE.
 *   Law 3 says colour must survive a greyscale test, so the glyph is asserted
 *   separately from the token: `FailMark` is a circle and `RefusedMark` is a
 *   padlock, and a future edit that reuses the ring would pass a colour check and
 *   still leave two states indistinguishable at 14px.
 *
 *   `data-mrd` ON THE ROOT, because `AuthedLayout` mounts `data-obsidian` on
 *   `<html>` and the unlayered `[data-obsidian] :focus-visible` rule beats every
 *   Tailwind utility. Without the attribute on an ancestor the one control this
 *   state can carry, the admin bootstrap claim, takes the legacy ring.
 *
 *   BOTH GROUNDS, by rendering twice and comparing the markup. The gallery at
 *   /meridian is where a person LOOKS at that, and this is the machine half:
 *   identical markup is the only proof that no ground-specific literal is left.
 *
 * happy-dom carries no stylesheet, so `getComputedStyle` cannot answer what a
 * Tailwind utility paints. Reading the class name is the honest limit, and it is
 * the precedent `catalog-parts.test.tsx` already set in this directory.
 */
import * as React from "react";
import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";

import { Action, NothingHere, ReadFailed, Refused } from "../surface-parts";

/** The markup of one node, with the document's ground set first. */
function paintOf(node: React.ReactElement): string {
  const { container, unmount } = render(node);
  const markup = container.innerHTML;
  unmount();
  return markup;
}

/** The same node in each ground. The tokens are declared on `:root` and
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

const REFUSAL = (
  <Refused detail="Ask one of them to add you, and the console opens the next time this page loads.">
    You are not an admin of this workspace.
  </Refused>
);

describe("Refused is inside the system", () => {
  it("carries data-mrd on its root, or the control it can hold loses the ring", () => {
    const { container, unmount } = render(REFUSAL);
    expect(
      (container.firstElementChild as HTMLElement).hasAttribute("data-mrd"),
      "Refused rendered outside Meridian, so any button on it takes the legacy [data-obsidian] ring",
    ).toBe(true);
    unmount();
  });

  it("renders identically in both grounds", () => {
    const { dark, light } = inBothGrounds(REFUSAL);
    expect(dark, "Refused drew something ground-specific").toBe(light);
  });

  it("writes no raw colour and no retired token", () => {
    const markup = paintOf(REFUSAL);
    for (const marker of [
      "--sp-",
      "--ds-",
      "--text-",
      "--hairline",
      "--madder",
      "--glacier",
      "--font-pixel",
      "--raised",
      "data-obsidian",
    ]) {
      expect(markup, `Refused still speaks ${marker}`).not.toContain(marker);
    }
    expect(markup, "Refused still carries a frozen hex").not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it("declares no focus utility, which would be permanently inert here", () => {
    expect(paintOf(REFUSAL)).not.toContain("focus-visible:outline");
  });
});

describe("a refusal is never a failure and never an empty region", () => {
  it("wears hold and not fail, because nothing went wrong", () => {
    const refused = paintOf(REFUSAL);
    expect(refused, "the refusal mark lost its amber").toContain("text-mrd-hold");
    expect(
      refused,
      "the refusal borrowed ReadFailed's red, so a person cannot tell a verdict from a broken read",
    ).not.toContain("text-mrd-fail");
  });

  it("keeps a silhouette of its own, so the two survive a greyscale test", () => {
    const refused = render(REFUSAL);
    const lock = refused.container.querySelector("svg");
    expect(lock, "the refusal lost its mark entirely").toBeTruthy();
    expect(
      lock!.querySelector("circle"),
      "the refusal reused FailMark's ring, so in greyscale it reads as a failure",
    ).toBeNull();
    expect(lock!.querySelector("rect"), "the padlock body is gone").toBeTruthy();
    refused.unmount();

    const failed = render(<ReadFailed>The read did not finish.</ReadFailed>);
    expect(
      failed.container.querySelector("svg circle"),
      "ReadFailed lost its ring, so this comparison no longer proves anything",
    ).toBeTruthy();
    failed.unmount();
  });

  it("offers no retry, because running the same read returns the same no", () => {
    render(REFUSAL);
    expect(screen.queryByRole("button", { name: /Try again|Retry|Reload/ })).toBeNull();
  });

  it("announces itself, which an empty state in this system never does", () => {
    const { container: refusal } = render(REFUSAL);
    expect(refusal.querySelector('[role="status"]')).toBeTruthy();

    const { container: empty } = render(<NothingHere>No signals since Tuesday.</NothingHere>);
    expect(
      empty.querySelector('[role="status"]'),
      "an empty state announced itself, which no empty state in this system does",
    ).toBeNull();
  });
});

describe("the way out, where there is one", () => {
  it("draws no door at all rather than a plausible-looking one", () => {
    const { container } = render(REFUSAL);
    expect(container.querySelectorAll("button").length).toBe(0);
  });

  it("carries the one real act when a caller hands it over", () => {
    let claimed = 0;
    render(
      <Refused
        detail="Nobody holds it in this workspace yet, so there is nobody to ask."
        action={
          <Action variant="primary" onClick={() => claimed++}>
            Claim admin · one-time setup
          </Action>
        }
      >
        You are not an admin of this workspace.
      </Refused>,
    );
    screen.getByRole("button", { name: /Claim admin/ }).click();
    expect(claimed).toBe(1);
  });
});

describe("what a person reads on a refusal", () => {
  it("says what was refused and what happens next, in one place each", () => {
    render(REFUSAL);
    expect(screen.getByRole("heading", { level: 2 }).textContent).toContain(
      "You are not an admin of this workspace",
    );
    expect(screen.getByText(/opens the next time this page loads/)).toBeTruthy();
  });

  it("carries no dash a person can see, and no invisible character", () => {
    const { container } = render(
      <Refused
        detail="Nobody holds it in this workspace yet, so there is nobody to ask: the first person to claim it becomes the admin."
        action={<Action variant="primary">Claim admin · one-time setup</Action>}
      >
        You are not an admin of this workspace.
      </Refused>,
    );
    const text = container.textContent ?? "";
    expect(text, "a refusal carries a dash a person can see").not.toMatch(/[\u2013\u2014]/);
    expect(text, "a refusal carries an invisible character").not.toMatch(
      /[\u200B\u200C\u200D\u2060\uFEFF\u00A0\u202F\u00AD\u200E\u200F\uFFFD]/,
    );
  });

  it("never apologises and never sends the reader round the loop again", () => {
    const text = (paintOf(REFUSAL).match(/>[^<]+</g) ?? []).join(" ");
    for (const slop of ["Sorry", "sorry", "unfortunately", "Oops", "!", "An error occurred"]) {
      expect(text, `a refusal said "${slop}"`).not.toContain(slop);
    }
  });
});
