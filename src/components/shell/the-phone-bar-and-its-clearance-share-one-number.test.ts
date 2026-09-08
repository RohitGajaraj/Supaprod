import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

/**
 * THE PHONE BAR AND THE WORK REGION'S CLEARANCE READ ONE NUMBER.
 *
 * Found on a 390px phone (fourth review, 2026-09-09): the live line was fixed
 * at `bottom-[calc(3.75rem+env(safe-area-inset-bottom))]`, a number typed
 * when the doors were 39px tall. The doors grew to 44 in the phone review and
 * the offset did not move, so the line floated 15px above the nav with the
 * page scrolling through the slit, and shell.css reserved the same unmeasured
 * 3.75rem under the work region. Two fixed surfaces, three hand-typed copies
 * of one height, none of them measured.
 *
 * Now the line and the doors are children of ONE fixed box, so there is no
 * offset left to drift, and the clearance is one token,
 * `--mrd-shell-phone-bar-h`, pinned here to the bar's own arithmetic: a 1px
 * border, a 44px line, 44px doors. Change the bar's height and this fails
 * until the token follows, which is the point.
 */
const BAR = readFileSync("src/components/shell/RailPhoneBar.tsx", "utf8");
const SHELL = readFileSync("src/styles/shell.css", "utf8");
const MERIDIAN = readFileSync("src/styles/meridian.css", "utf8");
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
const css = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "");

describe("the phone bar is one fixed box", () => {
  it("fixes one element to the bottom edge and offsets nothing above it", () => {
    const c = code(BAR);
    expect(c.match(/fixed inset-x-0 bottom-0/g)?.length).toBe(1);
    expect(c).not.toContain("bottom-[");
    expect(c).not.toContain("3.75rem");
  });

  it("gives the live line a finger's height, the same as the doors", () => {
    const c = code(BAR);
    const line = /onLiveClick \? "button" : "div",[\s\S]*?className:\s*"([^"]+)"/.exec(c)?.[1];
    const door = /const ITEM_CLASS =\s*"([^"]+)"/.exec(c)?.[1];
    expect(line).toContain("min-h-11");
    expect(door).toContain("min-h-11");
  });
});

describe("the clearance is the bar's own height", () => {
  it("declares the token as the bar's arithmetic: a border, the line, the doors", () => {
    const m = /^\s*--mrd-shell-phone-bar-h:\s*(\d+)px;/m.exec(MERIDIAN);
    expect(m).not.toBeNull();
    expect(Number(m![1])).toBe(1 + 44 + 44);
  });

  it("the work region's phone padding reads the token and no rem", () => {
    const shell = css(SHELL);
    expect(shell).not.toContain("3.75rem");
    expect(shell).toMatch(
      /@media \(max-width: 640px\) \{\s*\.sp-work,\s*body:has\(\[data-page-composer\]\) \.sp-work \{\s*padding-bottom: calc\(\s*var\(--mrd-shell-phone-bar-h\)\s*\+\s*env\(safe-area-inset-bottom\)/,
    );
  });
});
