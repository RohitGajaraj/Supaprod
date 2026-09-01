import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * ── ONE ELEMENT, ONE TYPE SIZE ────────────────────────────────────────────
 *
 * ── WHY THIS GUARD EXISTS, AND IT IS NOT A NEW RULE ───────────────────────
 * Commit `8669c4829` set out to remove exactly this and said so in its own
 * closing line: *"Routes now hold zero hard-coded sizes and zero double-size
 * arrangements."* It removed the doubles it was looking for -- an ARBITRARY
 * size beside a typed one -- and introduced a second kind nobody was looking
 * for: two TYPED stops on one element. Seven sites carried
 * `text-mrd-base leading-mrd-prose text-mrd-prose text-mrd-body`, which asks
 * for 13px and 14px at once.
 *
 * Nothing failed, because nothing was watching. That is the whole reason this
 * file is a test rather than a sweep: the goal was stated, achieved for one
 * shape, and quietly lost for another within the same commit.
 *
 * ── WHY THE BUG IS INVISIBLE IN REVIEW ────────────────────────────────────
 * Both classes emit a bare `font-size` at equal specificity, so the winner is
 * decided by STYLESHEET order, not by the order they appear in the markup.
 * Measured in the browser 2026-09-01 against the built stylesheet:
 *
 *   text-mrd-prose            -> 14px
 *   text-mrd-base             -> 13px
 *   text-mrd-base text-mrd-prose  -> 14px
 *   text-mrd-prose text-mrd-base  -> 14px   <- same, order reversed
 *
 * So a reader cannot tell from the markup which size will paint, and moving the
 * classes around does not change it. The author's intent is simply gone.
 *
 * ── HOW THE SEVEN WERE RESOLVED, because it is the opposite of the obvious way
 * The tempting fix is to drop `text-mrd-prose`, since it looks like the
 * intruder -- it is the one that reads like a colour, and `--mrd-t-body` was
 * renamed to `--mrd-t-prose` on 2026-08-21 precisely because `text-mrd-body`
 * used to compile to a size AND a colour.
 *
 * That fix would have been a silent visual regression. `8669c4829` VERIFIED the
 * rendered result -- *"prose at 14/1.625 body, screenshot taken"* -- so 14px is
 * the intended, checked paint on those surfaces, and `text-mrd-prose` is the
 * class delivering it. The LOSING class was removed instead, so not one pixel
 * moved and seven dead declarations went.
 */
const SRC = join(import.meta.dir, "..");

/** Every `--mrd-t-*` stop Tailwind exposes as a `text-mrd-*` size utility. */
const SIZE_STOPS = [
  "nano",
  "micro",
  "tiny",
  "data",
  "small",
  "label",
  "base",
  "prose",
  "lead",
  "h3",
  "h2",
  "h1",
] as const;

function tsxFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) tsxFiles(full, out);
    else if (entry.endsWith(".tsx")) out.push(full);
  }
  return out;
}

describe("one element carries one type size", () => {
  it("no className string sets two --mrd-t-* stops at once", () => {
    const offenders: string[] = [];
    for (const file of tsxFiles(SRC)) {
      const body = readFileSync(file, "utf8");
      /*
       * Scans double-quoted class strings, which is how every Meridian call
       * site in this repo is written. A template literal building classes
       * conditionally cannot be judged statically -- two stops in one template
       * may be mutually exclusive branches -- so those are deliberately out of
       * scope rather than reported as false positives.
       */
      for (const [, cls] of body.matchAll(/"([^"\n]*\btext-mrd-[^"\n]*)"/g)) {
        /*
         * UNPREFIXED CLASSES ONLY, and the lookbehind is the whole difference
         * between a guard people keep and one they switch off.
         *
         * `text-mrd-tiny md:text-mrd-small` is a RESPONSIVE PAIR and entirely
         * correct: the two never apply at the same width, so there is no
         * collision and no ambiguity about what paints. Same for `hover:`,
         * `dark:`, container and group variants. Without `(?<![\w:-])` this
         * reported eleven of those in `landing/Hero.tsx` alone -- and a guard
         * whose first run is mostly false positives gets deleted rather than
         * obeyed.
         */
        const hit = SIZE_STOPS.filter((stop) =>
          new RegExp(`(?<![\\w:-])text-mrd-${stop}\\b`).test(cls),
        );
        if (hit.length > 1) {
          offenders.push(
            `${file.replace(SRC, "src")}\n    "${cls.slice(0, 120)}"\n    sets: ${hit.join(", ")}`,
          );
        }
      }
    }

    expect(
      offenders.join("\n\n"),
      [
        "An element asks for two type sizes at once.",
        "",
        "Both emit a bare font-size at equal specificity, so which one paints is",
        "decided by STYLESHEET order and not by the order in the markup. Moving",
        "the classes will not change it, and a reader cannot tell what will",
        "render. The author's intent is unrecoverable from the file.",
        "",
        "Keep the size you actually want and delete the other. Check which one is",
        "painting TODAY before you choose, because the class that looks like the",
        "intruder may be the one delivering the verified design:",
        "",
        "  text-mrd-body is COLOUR ONLY since the 2026-08-21 rename, and",
        "  text-mrd-prose is the 14px SIZE. A pair reading",
        '  "text-mrd-base ... text-mrd-prose text-mrd-body" renders at 14px, so',
        "  dropping text-mrd-prose there is a visual change, not a cleanup.",
      ].join("\n"),
    ).toBe("");
  });
});
