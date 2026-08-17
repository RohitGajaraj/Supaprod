/**
 * The rail's fade must mean "there is more this way", and nothing else.
 *
 * WHAT THIS IS PROTECTING. On the reference (beautifului.dev) the rail does not
 * end, it dissolves: rows further down lose contrast progressively until the last
 * is barely there. It is the most recognisable thing about that column, and the
 * first port of it had none — a long list ended in a hard edge and a scrollbar.
 *
 * THE FAILURE MODE IS THE EASY IMPLEMENTATION. A gradient painted permanently at
 * the bottom looks identical in a screenshot and is a lie: it dims the final row
 * of a list that already fits, telling a reader there is more below when there is
 * not. Worse, it is invisible to review, because the only way to tell the honest
 * version from the decorative one is to check a list SHORT enough to fit.
 *
 * There is a second reason this is a test and not a look. `shell.css` carries a
 * founder ruling that scrollbars stay thin and NOT invisible, because the bar is
 * "the only standing signal that a surface has more content below the fold". This
 * rail hides its scrollbar, and the only thing that makes that legitimate is the
 * fade being a truthful replacement for exactly that signal. If the fade stops
 * being state-driven, the rail silently loses both signals at once.
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "bun:test";

import { edgeMask } from "../SidebarNav";

const source = readFileSync(new URL("../SidebarNav.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../../../styles/meridian.css", import.meta.url), "utf8");

describe("the fade says what is true and no more", () => {
  it("draws nothing when the column fits", () => {
    // THE CASE THAT CATCHES A DECORATIVE FADE. A permanent gradient passes every
    // other assertion in this file and fails this one.
    expect(edgeMask({ top: false, bottom: false })).toBe("none");
  });

  it("softens only the bottom when there is more below", () => {
    const mask = edgeMask({ top: false, bottom: true });
    expect(mask).toContain("transparent 100%");
    // The top must stay hard: softening it would say content is scrolled off
    // above when the column is sitting at its start.
    expect(mask).not.toContain("transparent 0");
  });

  it("softens only the top when there is more above", () => {
    const mask = edgeMask({ top: true, bottom: false });
    expect(mask).toContain("transparent 0");
    expect(mask).not.toContain("transparent 100%");
  });

  it("softens both when the column is scrolled into the middle", () => {
    const mask = edgeMask({ top: true, bottom: true });
    expect(mask).toContain("transparent 0");
    expect(mask).toContain("transparent 100%");
  });

  it("spends the distance token rather than a literal", () => {
    // The distance is a fact about geometry that a second scrolling column will
    // want, and meridian.css argues it out. A hard-coded 44px here would be the
    // start of the next divergence.
    expect(edgeMask({ top: true, bottom: true })).toContain("var(--mrd-fade-rail)");
  });
});

describe("the edges are measured, not assumed", () => {
  it("reads the element rather than counting items", () => {
    // Counting items and guessing a height would be wrong the moment a label
    // wraps, a section heading appears, or the rail collapses.
    expect(source).toContain("scrollHeight");
    expect(source).toContain("clientHeight");
  });

  it("watches for resize as well as scroll, because the rail changes without scrolling", () => {
    // Collapsing hides the labels, a section arrives, the window shortens. With a
    // scroll listener alone a list that becomes scrollable after mount would go on
    // reporting that it fits.
    expect(source).toContain("ResizeObserver");
    // And guarded, because jsdom has none and Settings tests run there.
    expect(source).toContain('typeof ResizeObserver === "function"');
    expect(source).toContain('addEventListener("scroll"');
  });

  it("tears both of them down", () => {
    // A rail unmounted mid-scroll must leave nothing attached to the element, or a
    // surface that mounts and drops rails (Settings switching sections) leaks one
    // listener and one observer per visit.
    expect(source).toContain('removeEventListener("scroll"');
    expect(source).toMatch(/observer\?\.disconnect\(\)|observer\.disconnect\(\)/);
  });

  it("tolerates fractional layout, so a fully scrolled column is not left soft", () => {
    // Fractional heights land scrollTop a hair under the arithmetic, so an exact
    // comparison leaves a permanent bottom fade at the true bottom, which is the
    // same lie this file exists to prevent.
    expect(source).toMatch(/scrollHeight - clientHeight > 1/);
  });
});

describe("the scrolled box is not the measured box", () => {
  it("keeps the selection blocks positioned against a box that does not scroll", () => {
    /*
     * `measure()` subtracts two viewport rectangles, and an absolutely positioned
     * child of a SCROLLED box is placed from the content origin rather than the
     * visible top. If one element did both jobs, every selection and hover block
     * would sit one scrollTop out of place — worst exactly when a person has
     * scrolled to reach the row they are clicking.
     *
     * So the wrapper scrolls and `navRef` does not. Asserted by order: the scroll
     * container must open before the measured container.
     */
    const scroller = source.indexOf("ref={scrollRef}");
    const measured = source.indexOf("ref={navRef}");
    expect(scroller).toBeGreaterThan(-1);
    expect(measured).toBeGreaterThan(-1);
    expect(scroller, "navRef is now the scrolling box, which puts every block one scrollTop out")
      .toBeLessThan(measured);
  });

  it("lets the flex child actually shrink, which is the part always left out", () => {
    /*
     * A flex item defaults to min-height:auto and refuses to shrink below its
     * content, so the box grows to fit the rows and never scrolls. meridian.css
     * records this as a shipped defect once already.
     *
     * READ OFF THE CONTAINER'S OWN className, not the file. The first draft of
     * this assertion was `source.toContain("min-h-0")`, and it kept passing after
     * the class was deleted from the element -- because the paragraph explaining
     * why it is needed still contained the string. A guard that a comment can
     * satisfy is not a guard.
     */
    const at = source.indexOf("mrd-fade-scroll");
    expect(at, "the scroll container is gone").toBeGreaterThan(-1);
    const className = source.slice(at, source.indexOf('"', at));
    expect(className, `the scroll container's classes are "${className}"`).toContain("min-h-0");
    expect(className).toContain("overflow-y-auto");
  });
});

describe("hiding the scrollbar is paid for", () => {
  it("hides it only through the class that carries the reasoning", () => {
    expect(source).toContain("mrd-fade-scroll");
    expect(css).toContain(".mrd-fade-scroll");
    expect(css).toContain("scrollbar-width: none");
  });

  it("keeps the keyboard's position visible inside a masked box", () => {
    // A mask clips an outset ring, which would take away the only indicator a
    // keyboard user has while moving down a scrolling list of rows.
    expect(css).toContain(".mrd-fade-scroll :focus-visible");
    expect(css).toContain("outline-offset: -2px");
  });

  it("names the founder ruling it is standing against", () => {
    // shell.css refuses `scrollbar-width: none` on purpose. A later reader must be
    // able to find out why this one is allowed without re-deriving the argument.
    const block = css.slice(css.indexOf("A COLUMN THAT DISSOLVES"), css.indexOf(".mrd-fade-scroll"));
    expect(block).toContain("shell.css");
    expect(block.toLowerCase()).toContain("founder ruling");
  });
});
