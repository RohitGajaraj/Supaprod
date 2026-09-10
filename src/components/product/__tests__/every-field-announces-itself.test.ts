/**
 * EIGHT FIELDS ON THE PRODUCT SURFACES ANNOUNCED AS NOTHING.
 *
 * A placeholder is not a label. It disappears the moment somebody types, it is
 * not consistently announced, and two of the eight did not even have one: a
 * bare number box on LaunchPlanPanel and an edit box on OutcomeContractPanel
 * reached a screen reader as an unnamed control. R-19 says accessibility is not
 * deferred.
 *
 * ── THE PARSER IS THE POINT, AND IT IS WHY THIS SCAN IS TRUSTWORTHY ────────
 *
 * Two earlier attempts at this check in this repo reported false positives, and
 * both made the same mistake: reading a JSX opening tag as "everything up to the
 * first `>`". That lands INSIDE an arrow function -- `onChange={(e) => ...}` --
 * so the attribute text is truncated and a labelled element reads as unlabelled.
 * S4 hit it, and I reproduced it, and the finding wasted both of our time.
 *
 * This balances braces and skips string literals, so the tag it examines is the
 * whole tag. It is fifteen lines and it is the difference between a check people
 * act on and a check people learn to ignore.
 *
 * ── TWO THINGS THAT ARE NOT DEFECTS, AND WHY ──────────────────────────────
 *
 * `aria-hidden` elements are excluded: WaitlistForm's honeypot is deliberately
 * invisible to assistive technology and labelling it would defeat it.
 *
 * A primitive that spreads `...rest` is excluded: `EngineChrome`'s `TextInput`
 * passes every attribute through, so the label belongs at the call site and
 * demanding one here would put a wrong label on every use of it.
 */
import { describe, it, expect } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** Every directory this session owns that draws form controls. */
const DIRS = [
  "src/components/product",
  "src/components/governance",
  "src/components/knowledge",
  "src/components/brain",
  "src/components/memory",
  "src/components/onboarding",
  "src/components/connections",
  "src/components/plg",
  "src/components/landing",
  "src/components/system",
  "src/components/trust",
  /* Added 2026-09-10, with the defect it caught: RedeemCodeCard's promo field
     had a placeholder and no name, and a placeholder is gone the moment a
     character is typed. This list is a SECOND SOURCE -- eleven directories
     written by hand beside a tree that has forty -- and widening it to
     `src/components` finds FIFTEEN more today. That is a packet rather than a
     line, so it is measured in the queue and not silently swallowed here. */
  "src/components/settings",
];

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

/**
 * The whole JSX opening tag, by balancing braces and skipping string literals.
 * Reading to the first `>` is the bug this exists to avoid.
 */
function openingTag(src: string, start: number): string {
  let depth = 0;
  let i = start;
  while (i < src.length) {
    const c = src[i];
    if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === ">" && depth === 0) return src.slice(start, i + 1);
    else if (c === '"' || c === "'" || c === "`") {
      const q = c;
      i++;
      while (i < src.length && src[i] !== q) {
        if (src[i] === "\\") i++;
        i++;
      }
    }
    i++;
  }
  return src.slice(start, Math.min(src.length, start + 4000));
}

const TAGS = ["input", "textarea", "select"];

describe("every field announces itself", () => {
  it("no form control in these directories reaches a person unnamed", () => {
    const unnamed: string[] = [];
    for (const dir of DIRS) {
      let files: string[] = [];
      try {
        files = walk(dir);
      } catch {
        continue; // a directory this session no longer owns is not a failure
      }
      for (const file of files) {
        const src = readFileSync(file, "utf8");
        for (const tag of TAGS) {
          const re = new RegExp(`<${tag}(?=[\\s/>])`, "gi");
          let m: RegExpExecArray | null;
          while ((m = re.exec(src))) {
            const t = openingTag(src, m.index);
            if (/aria-hidden\s*=\s*(\{?\s*true|"true")/.test(t)) continue;
            if (/\{\s*\.\.\.\w+\s*\}/.test(t)) continue; // a pass-through primitive
            if (/aria-label(?:ledby)?\s*=/.test(t)) continue;
            if (/\bid\s*=/.test(t)) continue; // a Field/label points at it
            unnamed.push(`${file}:${src.slice(0, m.index).split("\n").length} <${tag}>`);
          }
        }
      }
    }
    expect(unnamed).toEqual([]);
  });

  /**
   * The parser itself, asserted, because a scan that silently stops working
   * reports a clean sweep forever. Both cases below are real shapes from the
   * files above.
   */
  it("reads a whole tag past an arrow function, which is where the old scans broke", () => {
    const src = `<input onChange={(e) => setX(e.target.value)} aria-label="Named" />`;
    const t = openingTag(src, 0);
    expect(t).toContain('aria-label="Named"');
    // The naive version stops at the `>` inside the arrow and sees no label.
    expect(src.slice(0, src.indexOf(">") + 1)).not.toContain("aria-label");
  });

  it("does not run past the tag it is reading", () => {
    const src = `<input aria-label="A" />\n<input placeholder="B" />`;
    expect(openingTag(src, 0)).not.toContain('placeholder="B"');
  });
});
