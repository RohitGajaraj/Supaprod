/**
 * FORTY-FIVE PER CENT OF THE RECORD WAS RAISED BY THE LOOP, AND THE LIST HID IT.
 *
 * Measured on the live database, 2026-08-28: 369 decisions, 166 carrying
 * `auto_origin`, and ZERO still carrying the stored "[auto]" prefix in their
 * title.
 *
 * Both halves matter. `stripAutoPrefix` removes the machine marker from the
 * title, which is right -- it is a dedup key, not a word for a person.
 * `AutoChip` exists to carry the origin instead, and its own header says "pair
 * with `isAutoTitle` at the call site". IT WAS MOUNTED NOWHERE.
 *
 * So the one visible trace of a machine-raised call was being taken off and the
 * thing meant to replace it never drawn. Nearly half the record looked
 * hand-raised on the surface whose job is recall, on a product whose claim is
 * that agents do the work.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";

function code(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
}

const PANEL = code(readFileSync("src/components/knowledge/DecisionsPanel.tsx", "utf8"));

describe("the loop raised this", () => {
  it("the list draws the origin it has always been given", () => {
    expect(PANEL).toContain("AutoChip");
    // Drawn from the row's own field, not inferred from the title, because the
    // title's marker is stripped two lines above.
    expect(PANEL).toMatch(/d\.auto_origin \?/);
  });

  it("and still strips the machine marker from the title", () => {
    // The chip REPLACES the prefix. Drawing both would put a dedup key on the
    // surface next to a chip that says the same thing.
    expect(PANEL).toContain("stripAutoPrefix(d.title)");
  });

  /**
   * The field has to survive the read for the chip to be drawable at all. It
   * has been in the select since before the chip was written, which is what
   * made this a rendering gap rather than a data one.
   */
  it("the read returns the field", () => {
    const fn = readFileSync("src/lib/decisions.functions.ts", "utf8");
    expect(fn).toContain("auto_origin");
  });
});
