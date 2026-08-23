import { describe, expect, it } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const CSS = join(import.meta.dir, "..", "..", "..", "styles", "meridian.css");
const ROUTES = join(import.meta.dir, "..", "..", "..", "routes");

/**
 * THE PINNED-DARK SCOPE CANNOT DRIFT FROM THE VALUES IT COPIES.
 *
 * ── WHAT IT GUARDS, AND WHY A COPY WAS THE ONLY OPTION ──────────────────
 * `[data-mrd-pinned-dark]` exists because a public route scopes none of
 * Meridian's adaptive tokens (REQ-007). A page there pins its ground dark via
 * `PUBLIC_INK_THEME`, which covers the ink family and NOT the outcome ladder,
 * so `d.$slug` rendered approved / rejected / pending in light-tuned hues on a
 * dark ground for any visitor carrying a stored light theme.
 *
 * CSS has no way to say "the value this token had before `[data-theme=light]`
 * re-declared it", so the scope holds literal copies of the `:root` values.
 * Duplication is therefore not preventable here. **This guard makes divergence
 * loud instead**, which is the same bargain `COMPONENTS.md`'s porting map
 * takes: do not forbid the second copy, make the second copy fail out loud the
 * moment it stops matching.
 *
 * ── THE SECOND ASSERTION IS THE ONE THAT WILL ACTUALLY FIRE ─────────────
 * The scope is deliberately FIVE tokens and not the whole ramp:
 * `[data-theme="light"]` re-declares 67, and the public routes read five. But
 * "five" is a fact about today's routes, not a law. The moment a public page
 * reads a sixth adaptive token it is silently half-themed again, with nothing
 * to say so -- which is exactly how this defect arrived the first time.
 *
 * So the second test reads the public routes and fails if any of them reads an
 * adaptive `--mrd-*` the scope does not pin. That turns "remember to widen the
 * scope" into a failing command.
 *
 * ── WHY IT RESOLVES POSITIONS RATHER THAN GREPPING ──────────────────────
 * `--mrd-pass` appears three times in this file: once in `:root`, once in the
 * pinned scope, once in `[data-theme="light"]`. A grep cannot tell them apart,
 * and picking the wrong one would make this guard pass while the bug is live.
 * Each block is sliced by its own braces first, then read.
 */

const css = readFileSync(CSS, "utf8");

/** The body of a top-level block, sliced by brace depth from its selector. */
function blockBody(selector: string): string {
  const start = css.indexOf(selector + " {");
  if (start === -1) throw new Error(`meridian.css has no \`${selector}\` block`);
  let depth = 0;
  for (let i = css.indexOf("{", start); i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") {
      depth--;
      if (depth === 0) return css.slice(css.indexOf("{", start) + 1, i);
    }
  }
  throw new Error(`\`${selector}\` block is never closed`);
}

/** Declared custom properties in one block, value trimmed of its trailing comment. */
function declarations(body: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of body.matchAll(/^\s*(--mrd-[a-z0-9-]+)\s*:\s*([^;]+);/gm)) {
    out.set(m[1], m[2].trim());
  }
  return out;
}

const root = declarations(blockBody(":root"));
const pinned = declarations(blockBody("[data-mrd-pinned-dark]"));
const light = declarations(blockBody('[data-theme="light"]'));

describe("the pinned-dark scope", () => {
  it("pins at least the outcome ladder and the ground", () => {
    for (const token of ["--mrd-bg", "--mrd-edge", "--mrd-pass", "--mrd-fail", "--mrd-hold"]) {
      expect(pinned.has(token)).toBe(true);
    }
  });

  it("holds values byte-identical to :root, so a dark value cannot change under it", () => {
    for (const [token, value] of pinned) {
      expect(root.has(token)).toBe(true);
      // If this fails, `:root` moved and the copy below it did not. Update the
      // pinned block to match; do NOT relax this to a fuzzy compare.
      expect(`${token}: ${value}`).toBe(`${token}: ${root.get(token)}`);
    }
  });

  it("pins only tokens that actually flip, so it stays five and not sixty-seven", () => {
    // A token the light block never re-declares needs no pin: pinning it would
    // be a copy that can drift for no benefit at all.
    for (const token of pinned.keys()) {
      expect(light.has(token)).toBe(true);
    }
  });
});

/**
 * The routes that PIN a ground, which is a much smaller set than "public".
 *
 * ── THIS DISTINCTION IS THE GUARD, AND THE FIRST DRAFT GOT IT WRONG ─────
 * The first version of this test asked every non-`_authenticated` route, and
 * reported 30 unpinned reads across `signup`, `forgot-password`,
 * `reset-password` and `join.$token`. Every one was a FALSE POSITIVE. Those
 * four follow the app theme: they pin nothing, so their `--mrd-*` reads adapt
 * with the ground exactly as intended, and "fixing" them would have frozen four
 * auth surfaces to one theme.
 *
 * A token read is only half-themed when the ground is PINNED and the token is
 * not. So the set is routes that pin, detected by what actually does the
 * pinning rather than by a hand-kept list that would go stale the first time a
 * public page was added.
 */
const PINS_A_GROUND = /PUBLIC_INK_THEME|data-mrd-pinned-dark|landing-root/;

function pinnedRouteSources(): { file: string; text: string }[] {
  return readdirSync(ROUTES)
    .filter((f) => /\.tsx$/.test(f) && !f.startsWith("__"))
    .map((f) => ({ file: f, text: readFileSync(join(ROUTES, f), "utf8") }))
    .filter(({ text }) => PINS_A_GROUND.test(text));
}

describe("a route that pins its ground never reads an adaptive token the scope leaves free", () => {
  it("has no half-themed public surface", () => {
    const unpinned: string[] = [];
    for (const { file, text } of pinnedRouteSources()) {
      for (const m of text.matchAll(/var\(\s*(--mrd-[a-z0-9-]+)/g)) {
        const token = m[1];
        // Only adaptive tokens matter. One the light block leaves alone reads
        // the same on both grounds and cannot be half-themed.
        if (!light.has(token)) continue;
        if (pinned.has(token)) continue;
        unpinned.push(`${file} pins a ground but reads ${token}`);
      }
    }
    // If this fails, either pin the token in `[data-mrd-pinned-dark]` or stop
    // reading it on a public route. Do not add it to the ignore list; there
    // isn't one, deliberately.
    expect([...new Set(unpinned)]).toEqual([]);
  });
});
