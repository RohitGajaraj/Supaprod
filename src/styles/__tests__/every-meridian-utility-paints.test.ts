import { describe, it, expect } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
/* Comments are stripped before counting, for the reason the ratchet's own
 * scanner gives: the good commits are full of lines like "`space-y-mrd-s3` is
 * inert, the stop is `mrd-3`", and a guard that failed on its own explanation
 * would delete the reasoning behind the migration. This file tripped on its
 * own header the first time it ran, which is the argument in miniature.
 * Imported rather than re-written, so the two guards can never disagree about
 * what a comment is. */
import { stripComments } from "@/__tests__/meridian-ratchet-scan";

/**
 * A MERIDIAN UTILITY CLASS THAT NAMES NO TOKEN PAINTS NOTHING, AND TAILWIND
 * HELPS IT.
 *
 * ── THE SIBLING DEFECT ──────────────────────────────────────────────────
 * `every-token-used-is-defined.test.ts` catches `var(--mrd-thing)` where
 * `--mrd-thing` was never declared. This catches the other half, which is
 * commoner and quieter: `text-mrd-t-body` as a CLASS NAME.
 *
 * Tailwind generates a utility only when a matching `@theme` entry exists. Ask
 * for one that does not and you get no error, no warning and no rule -- just a
 * class attribute containing a string that matches nothing in the stylesheet.
 * The element renders at browser defaults. Nothing in `tsc`, `bun test`, ESLint
 * or the production build has any opinion about it, because to every one of
 * those tools it is an ordinary string.
 *
 * ── MEASURED THE DAY THIS WAS WRITTEN, 2026-08-18 ───────────────────────
 * Three components had been added to `src/components/meridian/` that morning,
 * described in their own headers as "Meridian design system component" with
 * "premium styling". Between them they carried SIXTEEN distinct inert classes,
 * and in one of the three EVERY styling class was inert:
 *
 *   space-y-mrd-s3   the spacing scale is `--spacing-mrd-3`. There is no `s`.
 *   text-mrd-t-body  there is no type bridge at all. `--mrd-t-*` exists as a
 *                    RAW CUSTOM PROPERTY and was never exposed to Tailwind.
 *   font-mrd-w-600   likewise for weight.
 *   leading-mrd-lh-relaxed, gap-mrd-s2, px-mrd-s3, rounded-mrd-pill ...
 *
 * So a component written to replace a retired one rendered as unstyled text,
 * and it looked finished in the diff. That is the same shape as the `FOCUS_RING`
 * constant that sat inert in six files for months -- spelled correctly, aimed
 * at the right token, painting nothing -- which `DESIGN-SYSTEM.md` records as
 * the defect that proved doctrine must be enforced rather than written down.
 *
 * ── WHY THE FIX IS A GUARD AND NOT SIXTEEN EDITS ────────────────────────
 * The sixteen are trivial to correct. The reason they happened is not: the
 * token file spells a stop `--mrd-s3` and the Tailwind bridge exposes it as
 * `--spacing-mrd-3`, so the name a person reads in `meridian.css` is NOT the
 * name they must type in a class. Anyone porting a surface will reach for the
 * name they just read. This test is the thing that tells them, in the second
 * before they commit, that the name they read is not the name that paints.
 *
 * ── WHAT IT DELIBERATELY DOES NOT DO ────────────────────────────────────
 * It says nothing about whether a class is the RIGHT one. `bg-mrd-hover` used
 * as a selected state is a real defect and this test will pass it happily; that
 * is a reading, and readings are what review is for. This only asserts that
 * every Meridian utility in the product corresponds to something that exists.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..", "..", "..");

/**
 * Every `mrd-*` name Tailwind has actually been told about.
 *
 * Read out of the `@theme` bridge rather than from the raw `--mrd-*`
 * declarations, and the difference is the whole point of the test: the raw
 * declarations are what a person reads, the bridge is what generates a utility.
 */
function bridgedTokens(): Set<string> {
  const css = readFileSync(join(REPO_ROOT, "src/styles/meridian.css"), "utf8");
  const names = new Set<string>();
  for (const m of css.matchAll(
    /^\s+--(?:color|spacing|text|font|font-weight|leading|tracking|radius|shadow|ease|duration|breakpoint)-(mrd[a-z0-9-]*)\s*:/gm,
  )) {
    names.add(m[1]);
  }
  return names;
}

/**
 * The utility prefixes that resolve through the theme. `space-y`, `divide-x`
 * and the like are included because they consume the spacing scale exactly as
 * `gap` does, and they are where the `-s` typo showed up first.
 */
const UTILITY = new RegExp(
  String.raw`\b(?:bg|text|border|border-[xytrbl]|ring|outline|fill|stroke|shadow|from|via|to|` +
    String.raw`gap|gap-[xy]|space-[xy]|divide-[xy]|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|` +
    String.raw`w|h|size|min-w|min-h|max-w|max-h|inset|top|right|bottom|left|` +
    String.raw`rounded|rounded-[trbl]|rounded-[tb][lr]|font|leading|tracking|decoration|` +
    String.raw`caret|accent|placeholder|duration|ease)-(mrd-[a-z0-9-]+)`,
  "g",
);

function sourceFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const s = statSync(full);
      if (s.isDirectory()) {
        if (entry === "__tests__") continue;
        walk(full);
      } else if (full.endsWith(".tsx") && !full.includes(".test.")) {
        out.push(full);
      }
    }
  };
  walk(join(REPO_ROOT, "src/components"));
  walk(join(REPO_ROOT, "src/routes"));
  return out;
}

describe("every Meridian utility class paints", () => {
  it("names a token the @theme bridge actually exposes", () => {
    const bridged = bridgedTokens();

    // A sanity floor. If the bridge parse ever silently returns nothing, this
    // test would pass by finding no violations, which is the failure mode a
    // guard may not have.
    expect(bridged.size).toBeGreaterThan(30);
    expect(bridged.has("mrd-ink")).toBe(true);
    expect(bridged.has("mrd-3")).toBe(true);

    const offences: string[] = [];
    for (const file of sourceFiles()) {
      const text = stripComments(readFileSync(file, "utf8"));
      const seen = new Set<string>();
      for (const m of text.matchAll(UTILITY)) {
        if (bridged.has(m[1]) || seen.has(m[0])) continue;
        seen.add(m[0]);
        offences.push(`  ${file.slice(REPO_ROOT.length + 1)}  ->  ${m[0]}`);
      }
    }

    expect(
      offences,
      offences.length === 0
        ? ""
        : [
            "",
            "A MERIDIAN UTILITY CLASS NAMES A TOKEN THAT DOES NOT EXIST.",
            "",
            "Tailwind emits a utility only for names declared in the `@theme`",
            "block of src/styles/meridian.css. These match nothing, so they",
            "generate no rule and the element renders at browser defaults.",
            "Nothing else in the toolchain can see this: to tsc, ESLint and the",
            "bundler a class attribute is an ordinary string.",
            "",
            ...offences,
            "",
            "The usual cause is reading a name in meridian.css and typing it",
            "verbatim. The raw custom property and the Tailwind name differ:",
            "  --mrd-s3            ->  spacing utilities say  mrd-3   (no `s`)",
            "  --mrd-t-body        ->  NOT bridged. Use an explicit size,",
            "                          text-[13px], as the ported surfaces do.",
            "  --mrd-w-600         ->  NOT bridged. Use font-medium / font-[650].",
            "  --mrd-lh-relaxed    ->  NOT bridged. Use leading-relaxed.",
            "  a pill             ->  rounded-full. The radius scale is",
            "                          xs / chip / ctl / card / pane.",
            "",
            "If Meridian genuinely lacks the stop you need, add it to the",
            "@theme bridge with its reasoning, per docs/design/DESIGN-SYSTEM.md.",
            "",
          ].join("\n"),
    ).toEqual([]);
  });
});
