/**
 * TWO RULES IN THIS REPO NAMED TOKENS THAT DO NOT EXIST, AND BOTH LOOKED FINE.
 *
 * A bare `var(--x)` naming an undeclared custom property resolves to the EMPTY
 * STRING. The declaration is dropped and the element inherits. The rule
 * typechecks, lints, builds, passes review and does not exist on screen, which
 * is the one failure a stylesheet can have that nothing downstream reports.
 *
 * Raised by S4, who found them by widening a guard that had only ever scanned
 * the retired `--sp-` family, so the whole Meridian namespace was outside its
 * scope:
 *
 *   --mrd-raised    styles.css `.today-hero`, the band on the most-read screen
 *   --mrd-you-text  DesignScaffoldPanel, the PENDING arm of a gate chip
 *
 * Both are fixed. This is the narrow guard for the two files this session owns;
 * S4's wider one covers the namespace and lands with their lane.
 *
 * ── WHY THE REPLACEMENTS ARE NOT A JUDGEMENT CALL ─────────────────────────
 * Meridian's own declarations name them. `--mrd-lift` is commented "a raised
 * control, secondary button", which is what `--mrd-raised` was reaching for.
 * `--mrd-you` is "ORCHID: a person is required", which is what a gate sitting
 * at pending means; `--mrd-hold` is "AMBER: stopped, and not on you", which is
 * the opposite. Picking by the token's own comment rather than by inference is
 * the point: S4 warned that two confident readings had already changed the
 * wrong thing tonight, and my own U-087 was one of them.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..", "..", "..");
const MERIDIAN = readFileSync(join(ROOT, "src/styles/meridian.css"), "utf8");

/** Every `--mrd-*` this repo actually declares. */
function declared(): Set<string> {
  const out = new Set<string>();
  for (const m of MERIDIAN.matchAll(/(--mrd-[a-z0-9-]+)\s*:/gi)) out.add(m[1]);
  return out;
}

const FILES = ["src/styles.css", "src/components/product/DesignScaffoldPanel.tsx"];

/** Comments quote the dead names to explain them, so they are stripped first. */
function code(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
}

describe("a token that resolves to nothing", () => {
  it("every bare var(--mrd-*) in the repaired files is declared", () => {
    const known = declared();
    const orphans: string[] = [];
    for (const rel of FILES) {
      const src = code(readFileSync(join(ROOT, rel), "utf8"));
      for (const m of src.matchAll(/var\(\s*(--mrd-[a-z0-9-]+)\s*\)/gi)) {
        if (!known.has(m[1])) orphans.push(`${rel}: ${m[1]}`);
      }
    }
    expect(orphans.sort()).toEqual([]);
  });

  it("the two dead names are gone from the code, comments aside", () => {
    for (const rel of FILES) {
      const src = code(readFileSync(join(ROOT, rel), "utf8"));
      expect(src, `${rel} still uses --mrd-raised`).not.toContain("--mrd-raised");
      expect(src, `${rel} still uses --mrd-you-text`).not.toContain("--mrd-you-text");
    }
  });

  /**
   * The parser, asserted. A guard that reads its own source for the answer
   * would pass whatever the stylesheet said, so this proves it can fail.
   */
  it("it really would catch an undeclared name", () => {
    const known = declared();
    expect(known.has("--mrd-lift")).toBe(true);
    expect(known.has("--mrd-you")).toBe(true);
    expect(known.has("--mrd-raised")).toBe(false);
    expect(known.has("--mrd-you-text")).toBe(false);
  });
});
