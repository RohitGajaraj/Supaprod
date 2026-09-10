/**
 * ── DEBT THAT LOOKS LIKE PROGRESS TO EVERY CHECK WE OWN ──────────────────────
 *
 * `src/components/prds/RewindButton.tsx` moved off `components/ui` on
 * 2026-08-10 by importing raw `@radix-ui/react-alert-dialog` and hand-drawing
 * the overlay, the panel, the title stop and the pad in Meridian tokens. That
 * was the only thing available at the time: **Meridian shipped its Dialog on
 * 2026-08-20, ten days later.**
 *
 * ── WHY NOTHING SAW IT FOR A MONTH ──────────────────────────────────────────
 *
 * Every marker the Meridian ratchet counts names a LINEAGE -- `class:sp-`,
 * `import:components/ui`, `usage:components/ui`, `raw-colour`. That file carried
 * none of them, so it read as fully migrated while being the only hand-rolled
 * modal left in the product. Re-freezing the baseline after porting it moved
 * **zero counts**, which is the measurement that proves the point rather than
 * asserting it.
 *
 * **A guard that watches two lineages is blind to a third.** The ratchet asks
 * "did this come from the retired system?", and the honest question underneath
 * is "did this come from the system at all?".
 *
 * ── WHAT THIS FORBIDS, AND IT IS DELIBERATELY NARROW ─────────────────────────
 *
 * One rule: outside `components/ui`, nothing imports `@radix-ui/*` directly.
 * `components/ui` is the retired shadcn layer and the ratchet already counts
 * every import of it, by file, with a number that may only go down. A file that
 * reaches past it to Radix is buying the same dependency with none of the
 * accounting -- it is not on the ratchet, it is not on the way to Meridian, and
 * nobody is counting it.
 *
 * This does NOT forbid Radix. It says the product has exactly two places a modal
 * may come from: Meridian, or the retired layer the ratchet is draining. A third
 * is a fork that no number is tracking.
 *
 * ── THE DOMAIN IS WALKED, NOT LISTED ────────────────────────────────────────
 *
 * 2026-09-10 cost three separate findings to one shape: `COMPONENTS.md` went
 * stale and produced a false gap, `every-field-announces-itself` named eleven
 * directories by hand out of forty and hid fifteen findings, and that file's own
 * header named a `Block` that had been renamed to `Region`. The Meridian ratchet
 * derives its domain from the tree and is the only one of the three that never
 * lied. So this walks `src`.
 *
 * ── AND IT READS CODE, NOT PROSE ────────────────────────────────────────────
 *
 * `stripComments` is not an optimisation here, it is the difference between a
 * working guard and a broken one. THIS RULE'S OWN COMMITS DISCUSS
 * `@radix-ui/react-alert-dialog` IN PROSE, in both RewindButtons, so a raw
 * text scan fails on the files it was written to bless. That trap has been paid
 * for four times in one night across two lanes -- twice by me, on the words "a
 * native select element" and on this very import name.
 */
import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { stripComments } from "./meridian-ratchet-scan";

const ROOT = join(import.meta.dir, "..", "..");
const SRC = join(ROOT, "src");

/** The one place allowed to wrap Radix: the retired layer the ratchet drains. */
const THE_WRAPPER = join("src", "components", "ui");

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      walk(full, out);
      continue;
    }
    if (/\.tsx?$/.test(e.name)) out.push(full);
  }
  return out;
}

const RADIX_IMPORT = /(?:^|\n)\s*import[^;]*?from\s*["']@radix-ui\/[^"']+["']/;

describe("a modal comes from Meridian or from the layer the ratchet is draining", () => {
  const files = walk(SRC).map((f) => f.slice(ROOT.length + 1));

  it("finds the tree, so it cannot pass by walking nothing", () => {
    expect(files.length).toBeGreaterThan(500);
    expect(files.some((f) => f.startsWith(THE_WRAPPER))).toBe(true);
  });

  it("nothing outside components/ui imports @radix-ui directly", () => {
    const offenders = files.filter((rel) => {
      if (rel.startsWith(THE_WRAPPER)) return false;
      return RADIX_IMPORT.test(stripComments(readFileSync(join(ROOT, rel), "utf8")));
    });
    expect(offenders.sort()).toEqual([]);
  });

  /*
   * THE MIRROR. The rule above passes trivially if `components/ui` stops
   * importing Radix -- at which point the exemption is about nothing and this
   * guard is watching an empty world. Claiming the other side keeps the two
   * halves honest: the wrapper still wraps, so "outside it" still means
   * something.
   */
  it("and components/ui really is where Radix lives, so the exemption is not vacuous", () => {
    const wrappers = files.filter(
      (rel) =>
        rel.startsWith(THE_WRAPPER) &&
        RADIX_IMPORT.test(stripComments(readFileSync(join(ROOT, rel), "utf8"))),
    );
    expect(wrappers.length).toBeGreaterThan(5);
  });

  /*
   * AND THE READER SKIPS PROSE, asserted directly rather than trusted. Both
   * RewindButtons name this import in their headers explaining why they no
   * longer use it, so a scan that read text would fail on the two files this
   * rule exists to bless.
   */
  it("reads code and not the comments that discuss it", () => {
    const withProse = `// import Foo from "@radix-ui/react-alert-dialog";\nconst a = 1;\n`;
    expect(RADIX_IMPORT.test(stripComments(withProse))).toBe(false);
    const real = `import * as D from "@radix-ui/react-alert-dialog";\n`;
    expect(RADIX_IMPORT.test(stripComments(real))).toBe(true);
  });
});
