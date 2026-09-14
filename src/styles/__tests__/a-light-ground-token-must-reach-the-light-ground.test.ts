import { describe, expect, it } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * A THEME OVERRIDE KEYED ON A SELECTOR NOBODY SETS PAINTS NOTHING.
 *
 * ── THE DEFECT THIS EXISTS FOR, MEASURED 2026-09-14 ───────────────────────
 * `meridian.css` carried a light-ground block keyed on
 * `:root[data-mrd-theme="light"], .mrd-light`. **Nothing in the product has ever
 * set either one.** The ground is `[data-theme="light"]`, written by
 * `__root.tsx` and the pre-hydration bootstrap beside it.
 *
 * So the block was inert and two tokens resolved to their DARK values on paper.
 * Read out of `getComputedStyle` in a browser on the light ground, both were
 * byte-identical to the dark ground:
 *
 *   --mrd-bloom   oklch(98% .004 70 / .16)   a near-white wash on a 98.5% sheet
 *   --mrd-sketch  oklch(72% .11 42)          a dark-ground ink against white
 *
 * The first is the composer's glow, which the founder asked for by name and
 * which therefore did not exist on paper; the second is the hand-drawn glyph
 * ink. Both were invisible for as long as dark was the default, because dark is
 * the ground where the un-overridden values are the correct ones. The day light
 * became the default they were on the first screen of the product.
 *
 * ── WHY A TEST AND NOT JUST THE FIX ───────────────────────────────────────
 * This is the `FOCUS_RING` shape the design-system doctrine already names: a
 * declaration spelled correctly, aimed at the right token, painting nothing,
 * looking finished in the diff. `every-meridian-utility-paints.test.ts` catches
 * a class that names no token and `every-token-used-is-defined.test.ts` catches
 * a token that was never declared. Neither can see a token that IS declared, IS
 * used, and sits behind a selector that never matches. This is that third hole.
 */

const STYLES = join(import.meta.dir, "..");

/**
 * Every stylesheet the app ships, read as text with comments removed.
 *
 * STRIPPING IS NOT OPTIONAL, and the first version of this test proved it by
 * failing on its own subject matter: these files explain the light ground at
 * length, so a scan that reads comments captures the prose describing a block as
 * though it were the block's selector. It reported two "offenders" that were
 * both docblocks. The sibling guards in this folder strip for the same reason,
 * and `every-meridian-utility-paints.test.ts` records tripping on its own header.
 */
function sheets(): Array<[name: string, css: string]> {
  return readdirSync(STYLES)
    .filter((f) => f.endsWith(".css"))
    .map((f) => [f, readFileSync(join(STYLES, f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "")]);
}

/**
 * The selectors the product actually puts on the document for the light ground.
 *
 * Read from the two files that write them rather than hard-coded, so renaming
 * the ground in one place fails this test instead of quietly orphaning every
 * override again.
 */
const GROUND_ATTRIBUTE = 'data-theme="light"';

describe("the ground the product sets is the ground the tokens key on", () => {
  it("the app really does set the attribute this test is built on", () => {
    /* If this ever stops being true the assertions below are meaningless, so it
       is checked first and against both writers. */
    const root = readFileSync(join(STYLES, "..", "routes", "__root.tsx"), "utf8");
    expect(root).toContain(GROUND_ATTRIBUTE);
    /* The bootstrap sets it imperatively, with the attribute name and value
       apart, so both halves are checked rather than the pair. */
    expect(root).toContain("setAttribute('data-theme','light')");
  });

  it("every light-ground block names a selector the product sets", () => {
    /*
     * A "light-ground block" is any selector list that mentions light and
     * declares tokens. The rule: at least one selector in that list has to be
     * one the document actually carries.
     *
     * `.light-theme` counts as legacy-but-harmless only where the block ALSO
     * names the real attribute, which is the shape `styles.css` already has.
     */
    const offenders: string[] = [];
    for (const [name, css] of sheets()) {
      /* Selector lists ending in `{`, captured with their declarations, so a
         block can be tested for whether it declares anything at all. */
      for (const match of css.matchAll(/(^|\})([^{}]*?)\{([^{}]*)\}/g)) {
        const selector = match[2];
        const body = match[3];
        /* Only blocks that mention a light ground AND declare custom properties.
           A plain `.light-theme p { }` layout rule is not a token override. */
        if (!/light/i.test(selector)) continue;
        if (!/--[\w-]+\s*:/.test(body)) continue;
        /* An @media or @supports preamble is not a selector list. */
        if (selector.includes("@")) continue;
        if (selector.includes(GROUND_ATTRIBUTE)) continue;
        offenders.push(`${name}: ${selector.trim().replace(/\s+/g, " ").slice(0, 120)}`);
      }
    }
    expect(
      offenders,
      [
        "A block declares light-ground tokens behind a selector the product never sets.",
        "",
        `The document carries [${GROUND_ATTRIBUTE}]. A block keyed only on`,
        "data-mrd-theme, .mrd-light or .light-theme is inert: its tokens silently",
        "keep their dark values, which is invisible for as long as dark is the",
        "default and wrong on the first screen the day it is not.",
        "",
        "Add the real attribute to the selector list. Keeping the others beside",
        "it is fine; leading with them is not.",
      ].join("\n"),
    ).toEqual([]);
  });

  it("the two tokens that were inert now differ between the grounds", () => {
    /*
     * THE MIRROR, and it is the assertion that would have caught the original
     * defect. The rule above is about selectors; this is about the outcome, so a
     * future refactor that satisfies the selector rule while flattening the
     * values still fails.
     *
     * Both are read out of `meridian.css` by name rather than compared in a
     * browser: a text read is deterministic and this is a declaration-level
     * claim. The browser measurement is in the docblock above and is what
     * established the defect.
     */
    const css = readFileSync(join(STYLES, "meridian.css"), "utf8");
    const declared = (token: string) =>
      [...css.matchAll(new RegExp(`${token}\\s*:\\s*([^;]+);`, "g"))].map((m) => m[1].trim());

    for (const token of ["--mrd-bloom", "--mrd-sketch"]) {
      const values = declared(token);
      /* Declared at least twice: once for the dark root, once for paper. */
      expect({ token, declarations: values.length }).toEqual({ token, declarations: 2 });
      /* And the two are genuinely different values, not a copied line. */
      expect({ token, distinct: new Set(values).size }).toEqual({ token, distinct: 2 });
    }
  });
});
