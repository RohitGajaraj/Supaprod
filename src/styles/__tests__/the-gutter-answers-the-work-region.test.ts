import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * THE WORK REGION'S GUTTER TRACKS THE SPACE IT WAS GIVEN, NOT THE WINDOW.
 *
 * THE DEFECT THIS EXISTS TO KILL. `--sp-work-pad-x` was a flat `40px` at every
 * size. That is right at a desk and indefensible on a phone: on a 320px viewport
 * it spent 80px, a quarter of the screen, on empty margin, and the measure left
 * over could not hold a row. It is now `clamp(20px, 2.9cqi, 44px)`.
 *
 * WHY THIS NEEDS A TEST AND NOT JUST A COMMENT. The fluid value depends on a
 * precondition declared in a DIFFERENT FILE: `.sp-work` sets `container-type:
 * inline-size` in shell.css. Delete that one line and nothing breaks, nothing
 * warns, and no layout visibly collapses. `cqi` simply stops finding a query
 * container and falls back to the small viewport, so the padding silently starts
 * answering the window again and the rail-aware behaviour is gone. That is the
 * worst shape a regression can have: correct-looking, silent, and in a file
 * nobody edits while thinking about padding.
 *
 * `vw` WOULD HAVE BEEN THE WRONG UNIT, which is the whole reason for the
 * coupling. The rail is 236px open and 64px collapsed, so two windows of
 * identical width can hand this region 172px of difference. Only a container
 * unit sees that.
 *
 * MEASURED, NOT ASSUMED (2026-08-11). A custom property is an unparsed token
 * stream, so `cqi` resolves where the value is USED rather than where it is
 * declared. Declared at `:root` and used on `.sp-inner`, it could plausibly have
 * resolved against the viewport. In the browser, a 1376px container inside a
 * 1440px window returned 44.03px, against a container prediction of 44.03px and
 * a viewport prediction of 46.08px.
 */

const MERIDIAN = readFileSync(join(import.meta.dir, "..", "meridian.css"), "utf8");
const SHELL = readFileSync(join(import.meta.dir, "..", "shell.css"), "utf8");

/** Strip comments, so prose that names a banned shape in order to ban it does
 *  not trip the assertions below. */
function code(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

const meridian = code(MERIDIAN);
const shell = code(SHELL);

function token(name: string): string {
  const hit = new RegExp(`--${name}\\s*:\\s*([^;]+);`).exec(meridian);
  expect(hit, `--${name} is not declared in meridian.css`).not.toBeNull();
  return hit![1].trim();
}

describe("the work region's gutter answers its container", () => {
  it("keeps the container-type that the fluid padding silently depends on", () => {
    // The coupling. `.sp-work` is the query container for `.sp-inner`'s padding.
    // Without this line `cqi` resolves against the viewport and the rail stops
    // being visible to the layout, with no error anywhere.
    expect(shell).toMatch(/\.sp-work\s*\{[^}]*container-type:\s*inline-size/);
  });

  it("scales the horizontal and vertical gutters with the container", () => {
    for (const name of ["mrd-shell-work-pad-x", "mrd-shell-work-pad-y"]) {
      const value = token(name);
      expect(value, `--${name} is back to a fixed length`).toContain("clamp(");
      // `cqi`, never `vw`: the window is the wrong question when a 236px rail
      // can open and close underneath it.
      expect(value, `--${name} asks the window instead of the container`).toContain("cqi");
      expect(value).not.toMatch(/\d(vw|vi)\b/);
    }
  });

  it("keeps a floor a phone can live with and a ceiling a desk already had", () => {
    const parse = (name: string) => {
      const m = /clamp\(\s*(\d+)px\s*,\s*([\d.]+)cqi\s*,\s*(\d+)px\s*\)/.exec(token(name));
      expect(m, `--${name} is not a three-part px/cqi/px clamp`).not.toBeNull();
      return { min: +m![1], rate: +m![2], max: +m![3] };
    };

    const x = parse("mrd-shell-work-pad-x");
    const y = parse("mrd-shell-work-pad-y");

    // A 320px phone must keep a usable measure. Two 20px gutters spend 12.5% of
    // it; the 40px each side that used to be here spent 25%.
    expect(x.min).toBeLessThanOrEqual(24);
    // ...and still be a margin rather than a hairline.
    expect(x.min).toBeGreaterThanOrEqual(16);
    expect(y.min).toBeGreaterThanOrEqual(16);

    // THE DESK DOES NOT MOVE. At the 1376px container a 1440px window gives,
    // these rates reproduce the 40px and 34px that were hard-coded before, so
    // this change buys the narrow end and pays nothing at the wide end.
    expect(Math.round(1376 * (x.rate / 100))).toBe(40);
    expect(Math.round(1376 * (y.rate / 100))).toBe(34);
  });

  it("leaves the floor fixed, because it is clearance and not rhythm", () => {
    // `--sp-work-pad-bottom` clears the dock. Shrinking it on a narrow screen
    // does not tighten a layout, it puts the last row under the dock.
    const bottom = token("mrd-shell-work-pad-bottom");
    expect(bottom).toMatch(/^\d+px$/);
  });
});
