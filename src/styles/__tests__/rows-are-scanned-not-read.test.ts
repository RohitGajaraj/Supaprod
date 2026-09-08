import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * A row's leading belongs to the row.
 *
 * Every row primitive in this app used to inherit `--sp-leading-body` (1.55)
 * from `.sp-app`. That is document leading, correct for a paragraph you read
 * and wrong for a line you scan, and the effect was measurable: `.sp-line`
 * rendered at 46.9px on a single line, landing inside the 45-55px band that
 * ink.css's own density research says appeared almost nowhere in the products
 * this one is measured against. The chrome (nav 38px, menu 34.9px) was
 * TIGHTER than the data rows, which is backwards.
 *
 * The failure mode is silent and it is the reason this file exists: a row that
 * forgets to declare its leading does not break, it just renders a few pixels
 * fatter than its neighbours, and nobody notices until the whole app reads as
 * slow. So the invariant is checked mechanically rather than left as prose,
 * which this repo has learned is the only kind of ruling that survives.
 *
 * This asserts the DOCTRINE, not pixel values: a row primitive must declare a
 * line-height, and it must be the row token. Padding stays free, because
 * ink.css deliberately keeps per-component padding literal and optical.
 */

const STYLES = join(import.meta.dir, "..");

function css(file: string): string {
  return readFileSync(join(STYLES, file), "utf8");
}

/**
 * Pull one rule's declaration block by selector. Deliberately naive: it takes
 * the first `{...}` after an exact selector match, which is all these files
 * need and keeps the test from growing a CSS parser of its own.
 */
function block(source: string, selector: string): string {
  const at = source.indexOf(`\n${selector} {`);
  if (at === -1) throw new Error(`selector not found: ${selector}`);
  const open = source.indexOf("{", at);
  const close = source.indexOf("}", open);
  return source.slice(open + 1, close);
}

/** Row primitives, and the file each one lives in. */
const ROWS: ReadonlyArray<{ selector: string; file: string }> = [
  { selector: ".sp-line", file: "primitives.css" },
  { selector: ".sp-cell", file: "primitives.css" },
  { selector: ".sp-ctx-row", file: "primitives.css" },
  { selector: ".sp-receipt", file: "primitives.css" },
  { selector: ".sp-dock-row", file: "shell.css" },
];

/**
 * Resolve a leading token to its number, through an alias if need be.
 *
 * Since ANS-001 (2026-08-23) ink.css declares these as `var(--mrd-lh-*)`
 * rather than literals, so the value that paints lives in meridian.css. The
 * doctrine is about the VALUES, not about where they are written, so an alias
 * resolves before comparing. A token that resolves to nothing fails below,
 * which is the safe direction.
 */
function resolveLeading(ink: string, meridian: string, token: string): number {
  const decl = new RegExp(`--${token}:\\s*([^;]+);`).exec(ink)?.[1]?.trim();
  if (!decl) return NaN;
  const direct = Number(decl);
  if (Number.isFinite(direct)) return direct;
  const ref = /^var\(--([a-z0-9-]+)\)$/.exec(decl)?.[1];
  if (!ref) return NaN;
  return Number(new RegExp(`--${ref}:\\s*([\\d.]+)`).exec(meridian)?.[1]);
}

describe("row primitives are scanned, not read", () => {
  for (const { selector, file } of ROWS) {
    it(`${selector} declares its own leading`, () => {
      const rule = block(css(file), selector);
      expect(rule).toContain("line-height:");
    });

    it(`${selector} uses row leading, not document leading`, () => {
      const rule = block(css(file), selector);
      const declared = /line-height:\s*([^;]+);/.exec(rule)?.[1]?.trim();
      /* Since 2026-09-08 the row reads Meridian's snug leading directly; the
         `--sp-leading-row` alias in ink.css was the retired sheet's name for it. */
      expect(declared).toBe("var(--mrd-lh-snug)");
    });
  }

  it("keeps row leading tighter than body leading", () => {
    // The whole change is worthless if these two tokens ever converge, and a
    // future tidy-up that "simplifies" the scale is exactly how that happens.
    // Resolved through aliases since 2026-08-23: snug (1.5) against prose
    // (1.625), wherever those values are declared.
    const ink = css("ink.css");
    const meridian = css("meridian.css");
    const row = resolveLeading(meridian, meridian, "mrd-lh-snug");
    const body = resolveLeading(ink, meridian, "sp-leading-body");
    expect(Number.isFinite(row)).toBe(true);
    expect(Number.isFinite(body)).toBe(true);
    expect(row).toBeLessThan(body);
  });

  it("keeps .sp-line out of the dead band the research names", () => {
    // 13.5px prose at 1.4 is 18.9px, so padding above 13px each side puts the
    // most-used row in the app back over 45px. Guards the padding step without
    // pinning an exact value.
    const rule = block(css("primitives.css"), ".sp-line");
    const padY = Number(/padding:\s*(\d+)px/.exec(rule)?.[1]);
    expect(Number.isFinite(padY)).toBe(true);
    expect(padY).toBeLessThanOrEqual(12);
  });
});
