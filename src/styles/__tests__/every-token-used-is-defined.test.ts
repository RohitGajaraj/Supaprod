import { describe, it, expect } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
/* Comments are stripped before counting, for the reason the ratchet gives:
 * "a legacy token inside a comment paints nothing. Only code ships." This
 * mattered the moment `--sp-hue` was deleted on 2026-08-18, because three
 * files DOCUMENT that removal and the sentence explaining it looked identical
 * to the defect it describes. A guard that fails on its own post-mortem
 * teaches people to delete the post-mortem. */
import { stripComments, stripCssComments } from "@/__tests__/meridian-ratchet-scan";

/**
 * A TOKEN THAT IS USED AND NEVER DEFINED FAILS SILENTLY, AND CSS HELPS IT.
 *
 * THE DEFECT. `var(--sp-radius-lg)` with no fallback resolves to nothing, and
 * `border-radius` with nothing resolves to 0. So the Ask bar on Today -- the
 * surface whose own comment calls it "PRIMARY INTERFACE: Ask bar (agentic-first
 * entry point)" -- rendered with SQUARE CORNERS while every other card in the
 * product sat at 10 or 12px. It also carried `borderLeft: 4px solid
 * var(--sp-accent)`, another token defined nowhere, so the border collapsed
 * entirely. Six tokens were referenced across the app and defined in no
 * stylesheet.
 *
 * Nothing could catch it. CSS has no notion of an undeclared custom property:
 * an unresolvable `var()` is not an error, it is the empty string, and a
 * declaration that cannot parse is simply dropped. Every file typechecked,
 * every test passed, the build was clean, and the product's stated primary
 * interface was the one square object on the page.
 *
 * WHAT THE FIX WAS NOT. Four of the six were size-named aliases for a scale
 * that already exists and is SEMANTIC: `--sp-radius-card` is commented "agent
 * card, ask composer", `--sp-radius-pane` is "floating panes", `--sp-shadow` is
 * the shadow. Defining `--sp-radius-lg` beside `--sp-radius-card` would have
 * given the system two vocabularies for one idea and guaranteed they drift, so
 * the call sites moved to the names that exist. Only `--sp-scrim` was a real
 * gap, and only it was added.
 */

const ROOT = join(import.meta.dir, "..", "..", "..");
const STYLES = join(ROOT, "src", "styles");

/**
 * Every custom property DECLARED anywhere -- in a stylesheet OR set inline at
 * runtime from TSX.
 *
 * The inline half matters and the first version of this test missed it, which
 * made the guard cry wolf on correct code. `--sp-hue` is declared nowhere in
 * CSS: it is set per-element as `style={{ "--sp-hue": hue }}` on a stage chip
 * and on a crew station group, and the children inherit it. That is a
 * legitimate and deliberate pattern -- one rule, many hues -- and a guard that
 * fails on it would be deleted by the next person in a hurry, taking the real
 * rule with it.
 */
function declaredTokens(): Set<string> {
  const out = new Set<string>();
  for (const f of readdirSync(STYLES)) {
    if (!f.endsWith(".css")) continue;
    const css = readFileSync(join(STYLES, f), "utf8");
    for (const m of css.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gim)) out.add(m[1]);
  }
  // Set from TSX: style={{ "--sp-hue": … }}
  const walkTsx = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        walkTsx(full);
        continue;
      }
      if (!e.name.endsWith(".tsx")) continue;
      for (const m of readFileSync(full, "utf8").matchAll(/"(--sp-[a-z0-9-]+)"\s*:/gi)) {
        out.add(m[1]);
      }
    }
  };
  walkTsx(join(ROOT, "src"));
  return out;
}

/** Every `var(--x)` USED with NO fallback, across the stylesheets and the app.
 *  A use WITH a fallback is not a defect: it degrades to something chosen. */
function usedWithoutFallback(): Map<string, string[]> {
  const found = new Map<string, string[]>();
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.(css|tsx|ts)$/.test(e.name)) continue;
      if (/\.test\.(ts|tsx)$/.test(e.name)) continue;
      const raw = readFileSync(full, "utf8");
      const src = e.name.endsWith(".css") ? stripCssComments(raw) : stripComments(raw);
      // `var(--x)` where the next non-space character closes the call.
      for (const m of src.matchAll(/var\(\s*(--sp-[a-z0-9-]+)\s*\)/gi)) {
        const list = found.get(m[1]) ?? [];
        list.push(full.slice(ROOT.length + 1));
        found.set(m[1], list);
      }
    }
  };
  walk(join(ROOT, "src"));
  return found;
}

describe("no --sp- token is used without a fallback unless it is defined", () => {
  it("every bare var(--sp-*) resolves to something", () => {
    const declared = declaredTokens();
    const used = usedWithoutFallback();
    const orphans: string[] = [];
    for (const [token, files] of used) {
      if (declared.has(token)) continue;
      orphans.push(`${token} used bare in ${[...new Set(files)].slice(0, 3).join(", ")}`);
    }
    // Sorted so a failure reads the same way twice and a diff is legible.
    expect(orphans.sort()).toEqual([]);
  });

  it("the scale is still declared, so this test cannot pass by finding nothing", () => {
    // A guard that passes because its inputs are empty is decoration. These
    // two are load-bearing: the first proves tokens are being found, the
    // second proves uses are.
    const declared = declaredTokens();
    expect(declared.has("--sp-radius-card")).toBe(true);
    expect(declared.has("--sp-scrim")).toBe(true);
    expect(usedWithoutFallback().size).toBeGreaterThan(20);
  });

  it("the two that were invented are gone from the code", () => {
    // `--sp-radius-lg` and `--sp-accent` were never in any stylesheet. They are
    // named only in the comments explaining their removal, so a bare `var()`
    // for either is a regression.
    const used = usedWithoutFallback();
    expect(used.has("--sp-radius-lg")).toBe(false);
    expect(used.has("--sp-accent")).toBe(false);
  });
});

describe("the scrim belongs to its theme", () => {
  const INK = readFileSync(join(STYLES, "ink.css"), "utf8");

  it("is defined in both themes, not once and shared", () => {
    // Pure black at 58% is right on the dark theme and wrong on paper: over a
    // warm ground it reads as a hole cut in the page rather than a dimming,
    // and the light theme's whole argument is that it is paper.
    expect(INK.match(/--sp-scrim:/g) ?? []).toHaveLength(2);
  });

  it("the light one is warm rather than black", () => {
    const light = INK.slice(INK.lastIndexOf("--sp-scrim:"));
    expect(light.slice(0, 60)).not.toMatch(/rgb\(0[ ,]/);
  });
});
