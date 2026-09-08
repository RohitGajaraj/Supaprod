/**
 * The on-ramp primitives, and the one number that made this a review worth doing.
 *
 * `PickCard` and `Composer` were built locally by LANE 1 while shipping `/start`
 * and filed under R-17 for promotion. Review changed three things; two were
 * tidying and one was a design regression.
 *
 * **THE ONE THAT MATTERED.** The local card set `leading-[1.4]` on both lines and
 * described that in its request as keeping "`Row`'s type rhythm". Meridian's own
 * token says otherwise, at the definition:
 *
 *   --mrd-lh-snug: 1.5;  /* UI rows. Was 1.4; the reference's air lives here *␘/
 *
 * The value was raised **deliberately**, to stop UI rows reading as stuck
 * together, and meridian.css records that raise as the founder's own complaint
 * with a number attached — it also finds six sites silently rendering at
 * Tailwind's 1.375 and calls that "tighter than the value Meridian replaced".
 *
 * So a hardcoded 1.4 is not merely off-scale: it reverts a decision the design
 * system made on purpose, on the highest-traffic new surface in the product.
 * That is exactly what R-20's "ported, not eyeballed" exists to catch — the
 * number was copied off an older component rather than taken from the token that
 * replaced it.
 *
 * These tests read the source, because every one of these failures is a WRONG
 * OR MISSING STRING in a className. A render test would happily pass with 1.4 in
 * place; only the literal can fail.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "bun:test";

import { COMPOSER_MAX_LINES, composerMaxHeight } from "../composer-height";

const SRC = readFileSync(fileURLToPath(new URL("../onramp-parts.tsx", import.meta.url)), "utf8");

/**
 * The file with its prose removed.
 *
 * Every assertion below bans a literal, and the header of the file under test
 * QUOTES several of those literals to explain why they were removed. Scanning the
 * whole file therefore fails on its own documentation, which would leave two bad
 * options: delete the explanation, or weaken the test. Stripping comments keeps
 * both — the ban is enforced on code, and the reasoning stays where the next
 * reader will find it.
 */
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
const CSS = readFileSync(
  fileURLToPath(new URL("../../../styles/meridian.css", import.meta.url)),
  "utf8",
);

describe("the type scale is taken from the token, not from an older component", () => {
  it("carries no raw line height anywhere", () => {
    expect(CODE).not.toContain("leading-[");
  });

  it("uses the Meridian leading utility on both lines of a card", () => {
    const card = CODE.slice(
      CODE.indexOf("export function PickCard"),
      CODE.indexOf("export function Composer"),
    );
    expect(card.match(/leading-mrd-snug/g)?.length).toBe(2);
  });

  /**
   * The premise, asserted so this test tells the truth if the token ever moves.
   * If `--mrd-lh-snug` were ever set back to 1.4 the argument above would be
   * wrong, and this fails rather than quietly enshrining a stale claim.
   */
  it("is arguing about a real token whose value is still 1.5", () => {
    expect(CSS).toContain("--mrd-lh-snug: 1.5");
  });

  /** Tailwind's `leading-snug` is 1.375 and is NOT Meridian's. */
  it("never reaches for Tailwind's colliding name", () => {
    expect(CODE).not.toMatch(/\bleading-snug\b/);
    expect(CODE).not.toMatch(/\bleading-tight\b/);
  });
});

describe("no raw values, and no dead ones", () => {
  /**
   * The local build had `gap-[13px]` on a flex row with a single child, so it
   * was a raw number that also spaced nothing. Both halves are worth refusing:
   * the raw number drifts off the scale, and the dead style teaches the next
   * reader that the scale is optional.
   */
  it("carries no arbitrary spacing", () => {
    expect(CODE).not.toContain("gap-[");
    expect(CODE).not.toMatch(/\bmt-\d\b/);
    expect(CODE).not.toMatch(/\bgap-\d\b/);
  });

  it("spaces the sub line on the Meridian scale", () => {
    expect(SRC).toContain("mt-mrd-2");
    expect(CSS).toContain("--spacing-mrd-2");
  });

  it("moves on the Meridian duration token rather than a raw one", () => {
    expect(SRC).toContain("var(--mrd-d-press)");
    expect(CODE).not.toMatch(/transitionDuration: "\d/);
  });
});

describe("the controls stay reachable", () => {
  /** A toggle button says it is pressed, or a screen reader cannot tell picked from unpicked. */
  it("declares selection to assistive tech, not only in colour", () => {
    /* 2026-09-08: `selected` is optional, so a card that is a plain press (a
       starter run, an example) announces as a button and not as a toggle
       that is never pressed; a real toggle still declares its state. */
    expect(SRC).toContain("aria-pressed={selected === undefined ? undefined : selected}");
    expect(SRC).toContain("data-selected={selected === undefined ? undefined : selected}");
  });

  /** R-20's touch floor. Two wrapped lines still clear it; one line still meets it. */
  it("keeps the 44px floor through wrapping", () => {
    expect(SRC).toContain("min-h-11");
  });

  /**
   * Selection is a ring drawn as an overlay, never an inset shadow: the app-wide
   * focus rule sets `box-shadow: none` unlayered, so a shadow-drawn selection
   * vanishes exactly when a keyboard reader arrives on the control.
   */
  it("draws selection as an overlay that the focus rule cannot erase", () => {
    expect(SRC).toContain("before:border-mrd-ink");
    expect(CODE).not.toContain("shadow-[inset");
  });

  /** The composer's label is required rather than optional, so it cannot ship unlabelled. */
  it("makes the composer's accessible name a required prop", () => {
    const props = SRC.slice(SRC.indexOf("export function Composer"));
    expect(props).toContain("label: string;");
    expect(props).not.toContain("label?: string;");
    expect(props).toContain("aria-label={label}");
  });

  /** A keyboard contract nobody states is a keyboard contract nobody uses. */
  it("states the keyboard contract on screen", () => {
    expect(SRC).toContain("Shift+Enter");
  });
});

describe("the composer's ceiling follows the scale", () => {
  it("is three lines", () => {
    expect(COMPOSER_MAX_LINES).toBe(3);
  });

  it("derives from the element's line height and padding", () => {
    const el = {
      scrollHeight: 999,
    } as unknown as HTMLTextAreaElement;
    const orig = globalThis.getComputedStyle;
    (globalThis as { getComputedStyle: unknown }).getComputedStyle = () => ({
      lineHeight: "26px",
      paddingTop: "6px",
      paddingBottom: "4px",
    });
    try {
      expect(composerMaxHeight(el)).toBe(26 * 3 + 10);
      expect(composerMaxHeight(el, 1)).toBe(26 + 10);
    } finally {
      (globalThis as { getComputedStyle: unknown }).getComputedStyle = orig;
    }
  });

  /**
   * THE DIRECTION THIS HAS TO FAIL IN. A ceiling that cannot be computed must
   * never become zero — that collapses the field to nothing, which is far worse
   * than letting it grow one line too far.
   */
  it("falls back to the element's own height rather than to zero", () => {
    const el = { scrollHeight: 41 } as unknown as HTMLTextAreaElement;
    const orig = globalThis.getComputedStyle;
    (globalThis as { getComputedStyle: unknown }).getComputedStyle = () => ({
      lineHeight: "normal",
      paddingTop: "",
      paddingBottom: "",
    });
    try {
      expect(composerMaxHeight(el)).toBe(41);
    } finally {
      (globalThis as { getComputedStyle: unknown }).getComputedStyle = orig;
    }
  });

  it("carries no magic pixel ceiling", () => {
    expect(CODE).not.toContain("112");
  });
});
