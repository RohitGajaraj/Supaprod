import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { stripCssComments } from "@/__tests__/meridian-ratchet-scan";

/**
 * TWO RULES CAN SHARE ONE CLASS NAME, AND TAILWIND WILL EMIT BOTH.
 *
 * THE DEFECT, measured in the built stylesheet on 2026-08-21. Meridian declares
 * its type scale as thirteen explicit `@utility text-mrd-*` rules, each setting
 * `font-size`. It separately declares sixty colours as `--color-mrd-*`, and
 * Tailwind turns every one of those into a `text-mrd-*` rule setting `color`.
 * One name falls in both sets: `body`. So `.text-mrd-body` compiles to TWO
 * rules, `font-size: var(--mrd-t-body)` and `color: var(--mrd-body)`, and both
 * always apply.
 *
 * It is not a "which one wins" bug, which is the thing that makes it hard to
 * see. Different properties do not conflict, so the class silently does two
 * jobs and every caller gets both. The bill lands on a caller who wanted only
 * one of them AND named a different size: `text-mrd-base text-mrd-body` asks
 * for 13px and paints at 14px, because the second rule sets `font-size` too and
 * later source order wins. Class order in the attribute cannot fix it. Ten call
 * sites were in that state when this guard was written, including a card
 * subject in six components and a 12.5px label in `Spend` rendering at 14px.
 *
 * WHY NOTHING ELSE COULD CATCH IT. Both halves are individually correct and
 * intentional. `tsc` sees valid strings. The ratchet sees no retired token,
 * because both names are current Meridian. The undeclared-name guards in this
 * directory look for names that resolve to NOTHING, and this is the opposite
 * failure: a name that resolves to two things. Every gate was green.
 *
 * WHAT THIS GUARD DOES NOT DO. It does not fix `body`, because choosing which
 * of the two loses its name is a Meridian naming decision and not a bug fix.
 * It pins the collision set so the count cannot grow, and so the fourteenth
 * colour that happens to be called `lead` or `small` fails the build on the day
 * it is added rather than in a screenshot months later.
 */

const ROOT = join(import.meta.dir, "..", "..", "..");
const MERIDIAN = readFileSync(join(ROOT, "src", "styles", "meridian.css"), "utf8");

/** Names Tailwind will turn into a `text-mrd-*` COLOUR utility. */
function colourNames(css: string): Set<string> {
  return new Set(
    [...css.matchAll(/--color-mrd-([a-z0-9-]+)\s*:/g)].map((m) => m[1]),
  );
}

/** Names declared as an explicit `@utility text-mrd-*` FONT SIZE. */
function sizeNames(css: string): Set<string> {
  return new Set(
    [...css.matchAll(/@utility\s+text-mrd-([a-z0-9-]+)\s*\{/g)].map((m) => m[1]),
  );
}

/**
 * The collisions that exist today, and the ONLY ones permitted.
 *
 * **EMPTIED 2026-08-21, which was this guard's own acceptance test.** It held
 * `["body"]` while `--mrd-t-body` and `--color-mrd-body` both existed. The size
 * stop was renamed to `--mrd-t-prose` and `text-mrd-body` is now the colour and
 * nothing else, so there is no permitted collision left.
 *
 * The list is a ratchet and it only ever gets shorter. An addition here is a
 * decision to ship a class that does two jobs, and it needs the reasoning beside
 * it rather than a name on its own.
 */
const KNOWN_COLLISIONS: string[] = [];

describe("a text-mrd-* name means either a colour or a size, never both", () => {
  const css = stripCssComments(MERIDIAN);

  it("no NEW name is both a colour and a font size", () => {
    const clash = [...colourNames(css)].filter((n) => sizeNames(css).has(n)).sort();
    // Sorted, so a failure reads the same way twice.
    expect(clash).toEqual([...KNOWN_COLLISIONS].sort());
  });

  it("both sets are actually found, so this cannot pass by finding nothing", () => {
    // A guard whose inputs are empty is decoration. Both regexes are pinned
    // against the real shape of the file, so a refactor that renames
    // `@utility` or `--color-mrd-` breaks the test rather than silencing it.
    expect(sizeNames(css).size).toBeGreaterThanOrEqual(13);
    expect(colourNames(css).size).toBeGreaterThanOrEqual(50);
    expect(sizeNames(css).has("base")).toBe(true);
    expect(colourNames(css).has("ink")).toBe(true);
  });

  it("`body` is a colour and no longer a size, which is what the rename bought", () => {
    // This pinned `["body"]` and the collision itself until 2026-08-21. It is
    // inverted rather than deleted, because the invariant worth guarding is not
    // "the list is empty" but WHICH WAY the one fixed name resolved: the size
    // stop gave up the name and the colour kept it. Asserting the halves
    // separately means a regression says which one came back.
    expect(KNOWN_COLLISIONS).toEqual([]);
    expect(colourNames(css).has("body")).toBe(true);
    expect(sizeNames(css).has("body")).toBe(false);
    // And the size stop landed under its new name rather than vanishing, which
    // is the failure a bare `has("body") === false` would have passed.
    expect(sizeNames(css).has("prose")).toBe(true);
    expect(colourNames(css).has("prose")).toBe(false);
  });
});
