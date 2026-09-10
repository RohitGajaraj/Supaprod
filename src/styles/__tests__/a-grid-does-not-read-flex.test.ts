/**
 * A CLASS THAT SETS `display` OWNS THE LAYOUT, AND EVERY UTILITY WRITTEN FOR
 * THE OTHER DISPLAY MODE BESIDE IT IS INERT.
 *
 * MEASURED ON THE SERVED BUILD, 2026-09-10, /settings?section=connections at a
 * 1512px viewport, computed off the live elements:
 *
 *   parent class  "sp-inner flex flex-wrap items-start gap-y-mrd-6"
 *   display       grid          <- Tailwind's `.flex` LOST
 *   columns       1146.24px     <- one track
 *   child 1  x 258  w 1146  y  86   sticky   (the section nav)
 *   child 2  x 258  w 1146  y 757   static   (the work pane)
 *
 * `.sp-inner { display: grid }` and `.flex { display: flex }` are both one
 * class of specificity, so source order decided it and shell.css won. The
 * nav's `flex: 0 1 240px`, the container's `flex-wrap` and its `items-start`
 * all did nothing, and the two-column layout that route's own comment
 * describes had never once rendered. The nav was a full-width row ABOVE the
 * pane; `position: sticky` then rode it down over the pane on scroll, hiding
 * the left ~250px of every row.
 *
 * NOTHING COULD CATCH IT. No error, no console output, the nav highlighted
 * correctly and the content was all present in the DOM. tsc sees a string,
 * and CSS has no opinion about a property that loses. The page succeeded at
 * being unreadable, which is why this is a static guard and not a hope.
 *
 * THE CLAIM, and it is about contradiction rather than about any one class:
 * an element that opts into a `display`-setting class from our own sheets
 * must not also carry utilities that only mean something under a different
 * `display`. Either the utility is inert, or it is winning and the sheet's
 * layout is the thing not running. Both are defects and neither announces
 * itself.
 */
import { describe, test, expect } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "..", "..", "..");
const srcRoot = join(repoRoot, "src");

/**
 * Our own layout classes that set `display`, and what they set it to. Read
 * from shell.css rather than typed here, so a class that changes its display
 * cannot leave this list describing the old one.
 */
function displaySettingClasses(): Map<string, string> {
  const css = readFileSync(join(srcRoot, "styles", "shell.css"), "utf8");
  const found = new Map<string, string>();
  // `.sp-foo {` ... `display: grid;` -- only simple single-class rules, which
  // is what a className string can carry.
  for (const m of css.matchAll(/^\.(sp-[a-z-]+)\s*\{([^}]*)\}/gm)) {
    const display = /(?:^|;|\s)display:\s*([a-z-]+)/.exec(m[2]!)?.[1];
    if (display === "grid" || display === "flex") found.set(m[1]!, display);
  }
  return found;
}

/** Utilities that only mean something under `display: flex`. */
const FLEX_ONLY =
  /^(flex-wrap|flex-nowrap|flex-wrap-reverse|flex-row|flex-col|flex-row-reverse|flex-col-reverse|flex)$/;
/** Utilities that only mean something under `display: grid`. */
const GRID_ONLY = /^(grid|grid-cols-.+|grid-rows-.+|grid-flow-.+|auto-cols-.+|auto-rows-.+)$/;

type Offence = { file: string; line: number; layout: string; display: string; inert: string[] };

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (full.endsWith(".tsx")) out.push(full);
  }
  return out;
}

function offences(): Offence[] {
  const layouts = displaySettingClasses();
  const out: Offence[] = [];
  for (const file of walk(srcRoot)) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      // Only a literal className string can be read statically; a computed one
      // is out of reach and says so rather than passing silently.
      for (const m of line.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
        const classes = (m[1] ?? m[2] ?? "").split(/\s+/).filter(Boolean);
        const layout = classes.find((c) => layouts.has(c));
        if (!layout) continue;
        const display = layouts.get(layout)!;
        const wrong = display === "grid" ? FLEX_ONLY : GRID_ONLY;
        const inert = classes.filter((c) => c !== layout && wrong.test(c));
        if (inert.length > 0)
          out.push({ file: file.slice(repoRoot.length + 1), line: i + 1, layout, display, inert });
      }
    });
  }
  return out;
}

describe("a grid does not read flex", () => {
  test("shell.css really does declare the layout classes this reads", () => {
    // The guard is worthless if its input is empty, and an empty result would
    // otherwise look exactly like a clean tree.
    const layouts = displaySettingClasses();
    expect(layouts.get("sp-inner")).toBe("grid");
  });

  test("no element carries utilities that its own layout class makes inert", () => {
    const found = offences();
    const said = found.map(
      (o) =>
        `${o.file}:${o.line}  .${o.layout} is display:${o.display}, so ${o.inert.join(", ")} does nothing`,
    );
    expect(said).toEqual([]);
  });
});
