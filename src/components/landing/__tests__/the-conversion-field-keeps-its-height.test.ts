/**
 * THE SITE'S ONLY CONVERSION FIELD RENDERED 19 PIXELS TALL ON A PHONE.
 *
 * Measured by S4 at 390x844: `input.flex-1.h-12` came out 358x19 while its own
 * class asked for 48. Reproduced and then re-measured after the fix in a real
 * browser at the same viewport: 358x48.
 *
 * ── THE CAUSE, BECAUSE IT WILL HAPPEN AGAIN ───────────────────────────────
 *
 * The parent is `flex flex-col sm:flex-row`. `flex-1` is `flex: 1 1 0%`, and
 * FLEX-BASIS APPLIES TO THE MAIN AXIS -- which in a column is the HEIGHT. Below
 * `sm` the basis of 0 governed the height and `h-12` never got a say. Above
 * `sm` the row makes the main axis horizontal, `flex-1` fills the width as
 * intended and `h-12` holds.
 *
 * That is why it only ever failed on a phone, and why nobody caught it on a
 * laptop: the class is correct at every width anyone was looking at.
 *
 * `flex-1` and `h-12` together were two different requests made with one class
 * -- fill the row, and keep your own height -- so the fix scopes the grow to
 * the breakpoint where the axis is horizontal rather than fighting it with a
 * `min-h`.
 *
 * This guard cannot measure a browser, so it pins the SHAPE: no element in a
 * direction-switching flex parent may combine an unscoped `flex-1` with a fixed
 * height. That is the rule the bug broke, and it is checkable from source.
 */
import { describe, it, expect } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const DIRS = ["src/components/landing", "src/components/plg", "src/components/supaprod"];
const ROUTES = ["src/routes/demo.tsx", "src/routes/film.tsx", "src/routes/product.tsx"];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) {
      out.push(...walk(p));
      continue;
    }
    if (p.endsWith(".tsx") && !p.includes(".test.")) out.push(p);
  }
  return out;
}

/** Every className string literal in a file, with its line. */
function classNames(src: string): { text: string; line: number }[] {
  const out: { text: string; line: number }[] = [];
  for (const m of src.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
    out.push({ text: m[1] ?? m[2] ?? "", line: src.slice(0, m.index).split("\n").length });
  }
  return out;
}

const FIXED_HEIGHT = /\bh-\d+(?:\.\d+)?\b|\bh-\[/;
const UNSCOPED_GROW = /(?:^|\s)flex-1(?:\s|$)/;

describe("the conversion field keeps its height", () => {
  it("the field that broke is fixed, and scoped to the row", () => {
    const src = readFileSync("src/components/landing/WaitlistForm.tsx", "utf8");
    const email = classNames(src).find(
      (c) =>
        c.text.includes("rounded-full") &&
        c.text.includes("h-12") &&
        c.text.includes("bg-[#0d0d0e]"),
    );
    expect(email, "the email field's class moved").toBeDefined();
    expect(email!.text).toContain("sm:flex-1");
    expect(email!.text).not.toMatch(UNSCOPED_GROW);
  });

  /**
   * The shape, across every public surface. An unscoped `flex-1` beside a fixed
   * height is only safe when the parent is a row at every width, and a class
   * string cannot prove that -- so this flags the pair and each exception has to
   * be scoped or justified rather than assumed.
   */
  it("no public surface pairs an unscoped flex-1 with a fixed height", () => {
    const offenders: string[] = [];
    const files = [
      ...DIRS.flatMap((d) =>
        (() => {
          try {
            return walk(d);
          } catch {
            return [];
          }
        })(),
      ),
      ...ROUTES,
    ];
    for (const file of files) {
      let src: string;
      try {
        src = readFileSync(file, "utf8");
      } catch {
        continue;
      }
      for (const c of classNames(src)) {
        if (UNSCOPED_GROW.test(c.text) && FIXED_HEIGHT.test(c.text)) {
          offenders.push(`${file}:${c.line}`);
        }
      }
    }
    /*
     * Each entry is a READ SOMEBODY MADE, not a pattern exclusion. A parent's
     * flex direction is not knowable from the child's class, so the only honest
     * form of this list is one line per case with the parent named. Both below
     * sit in a parent that is `flex` with no `flex-col` at any width, so the
     * main axis is horizontal everywhere and the fixed height governs the cross
     * axis, which is what `h-` is for.
     *
     * A line number moving is not a failure of the code, but it does mean
     * somebody edited the file, and re-reading the parent at that moment is the
     * whole point of pinning it this precisely.
     */
    expect(offenders.sort()).toEqual([
      // parent: `flex gap-1` — the station progress bar, h-2 is the bar's thickness
      "src/components/landing/HeroLoopDemo.tsx:201",
      // parent: `flex gap-2` — the referral link row, h-10 is the field height
      "src/components/landing/WaitlistForm.tsx:99",
    ]);
  });
});
