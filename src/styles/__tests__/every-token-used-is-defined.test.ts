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
  const sheets = readdirSync(STYLES)
    .filter((f) => f.endsWith(".css"))
    .map((f) => join(STYLES, f));
  // `src/styles.css` is a sibling of the styles/ DIRECTORY, not inside it, and
  // it declares tokens too. Reading only the directory made this guard blind to
  // the largest stylesheet in the repo.
  sheets.push(join(ROOT, "src", "styles.css"));
  for (const sheet of sheets) {
    const css = readFileSync(sheet, "utf8");
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
      for (const m of readFileSync(full, "utf8").matchAll(/"(--(?:sp|mrd)-[a-z0-9-]+)"\s*:/gi)) {
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
      /*
       * THIS REGEX SAID `--sp-` UNTIL 2026-08-27, AND `--sp-*` IS THE RETIRED
       * SYSTEM.
       *
       * CLAUDE.md: "Meridian is the only design system, and this is enforced,
       * not requested." The guard against a token that resolves to nothing was
       * watching the family being REMOVED and not the one being written. Its
       * own anti-vacuity test could not notice, because the `--sp-` inputs it
       * checks are genuinely non-empty; the whole `--mrd-` family was simply
       * outside its scope.
       *
       * Widening it found four live orphans on six call sites. See
       * MERIDIAN_ORPHANS below.
       */
      for (const m of src.matchAll(/var\(\s*(--(?:sp|mrd)-[a-z0-9-]+)\s*\)/gi)) {
        const list = found.get(m[1]) ?? [];
        list.push(full.slice(ROOT.length + 1));
        found.set(m[1], list);
      }
    }
  };
  walk(join(ROOT, "src"));
  return found;
}

/**
 * THE ALLOWLIST IS EMPTY, AND KEEPING IT EMPTY IS THE POINT.
 *
 * Four Meridian tokens were excused here on 2026-08-27, the day this guard
 * learned to see the `--mrd-` family at all: `--mrd-raised`, `--mrd-you-text`,
 * `--mrd-fail-bright` and `--mrd-pass-bright`. Each rendered NOTHING, because
 * an unresolvable `var()` is the empty string and the declaration is dropped.
 * They were listed rather than fixed because picking the replacement is a
 * Meridian decision and the lane that found them does not get to make it.
 *
 * ALL FOUR NOW HAVE ZERO BARE CALL SITES, measured 2026-08-28 with this file's
 * own `usedWithoutFallback()` rather than with grep, so comments describing the
 * removals are not counted as uses. `--mrd-raised` was repointed at
 * `--mrd-lift`; the other three call sites are gone.
 *
 * ── AND THE TEST BELOW WAS ASKING THE WRONG QUESTION ─────────────────────
 * The header on this list has always said "THIS LIST MAY ONLY EVER SHRINK …
 * removing one from here without fixing the call site fails it too, because
 * the guard then sees it." The test that enforced it asserted
 * `!declared.has(token)` -- whether the token is DECLARED. That is not the
 * same question. A token can be undeclared forever while its last call site
 * disappears, and on that day the excuse outlives the defect: the entry sits
 * here looking like a live exemption, the main test above skips a name nothing
 * uses, and the next real orphan to reuse that name is waved straight through.
 * All four entries were in exactly that state when this was written.
 *
 * So the question is now "is this token STILL USED BARE", which is the thing
 * an exemption is actually excusing. An entry whose call site is fixed fails
 * and must be deleted, which is what the header always promised.
 */
const MERIDIAN_ORPHANS = new Set<string>([]);

describe("no design-system token is used bare unless something declares it", () => {
  it("every bare var(--sp-*) and var(--mrd-*) resolves to something", () => {
    const declared = declaredTokens();
    const used = usedWithoutFallback();
    const orphans: string[] = [];
    for (const [token, files] of used) {
      if (declared.has(token)) continue;
      if (MERIDIAN_ORPHANS.has(token)) continue;
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

  it("watches the CURRENT design system, not only the retired one", () => {
    // The regression this guards: the scan said `--sp-` for months while
    // Meridian was the only system anybody was writing. If this drops to zero,
    // the guard has quietly gone back to watching nothing that ships.
    const used = usedWithoutFallback();
    const meridian = [...used.keys()].filter((t) => t.startsWith("--mrd-"));
    expect(meridian.length).toBeGreaterThan(20);
  });

  it("nothing is excused that no longer has a call site", () => {
    /*
     * MERGED FROM TWO LANES AND STRICTLY STRONGER THAN EITHER.
     *
     * S3's framing is the right one and it is theirs: an exemption excuses a
     * USE, so the only thing that keeps one alive is a use. If a name here has
     * no bare call site left, the defect is fixed and the entry must go, or it
     * silently pre-approves the next orphan that reuses the name.
     *
     * The `declared` clause is S4's and covers the other way an entry dies: a
     * token that gets DECLARED is no longer an orphan even though it is still
     * used, and excusing it would then hide a real reference behind a stale
     * exemption. Neither lane's version caught both.
     */
    const declared = declaredTokens();
    const used = usedWithoutFallback();
    const stale = [...MERIDIAN_ORPHANS].filter((t) => !used.has(t) || declared.has(t));
    expect(stale.sort()).toEqual([]);
  });

  it("the four that were excused are fixed, not merely delisted", () => {
    // Emptying the list would be worthless if the call sites were still there,
    // so this names the four by hand and proves each is gone. Pinned to the
    // NAMES rather than to the count, because a list that only checks its own
    // length passes when somebody swaps one orphan for another.
    const used = usedWithoutFallback();
    for (const token of [
      "--mrd-raised",
      "--mrd-you-text",
      "--mrd-fail-bright",
      "--mrd-pass-bright",
    ]) {
      expect([token, used.has(token)]).toEqual([token, false]);
    }
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
/**
 * A UTILITY CLASS THAT IS USED AND NEVER DECLARED FAILS THE SAME SILENT WAY.
 *
 * THE DEFECT. `className="text-heading-26"` matches no rule, and a selector
 * that matches nothing is not a fallback, it is nothing. Tailwind's preflight
 * has already reset `h1` to inherit its size, so the page title in
 * `SurfaceHeader` would have painted at body size and `DrillHeader`'s title
 * `<div>` always would. The declared scale is 14/16/20/24 for headings and
 * 13/14 for copy; 26 and 21 were never in it.
 *
 * Nothing above this line could catch it, and neither could anything else.
 * `--sp-*` at least names a custom property, so the guard in this file has a
 * token to look for. A class name is a plain string: to `tsc` it is a valid
 * string, to the CSS parser it is a selector that simply never matches, and to
 * the build it is nothing at all. Every file typechecked, every test passed.
 *
 * WHY IT COST NOTHING YET, AND WHY IT WAS STILL WORTH FIXING. Both call sites
 * live in components with zero importers, so no user has seen a body-sized
 * page title. The bill arrives the day somebody gives `SurfaceHeader` the door
 * it is missing, and then it is a page title, on a surface nobody would think
 * to re-check. Free to fix now, quietly wrong later.
 */

/* Both grounds have to be read, and this is the trap AGENTS.md section 9
 * records: `src/styles.css` is a FILE and `src/styles/` is a DIRECTORY, and
 * both exist in this repo. `declaredTokens()` above reads only the directory,
 * which is correct for what it looks for and would be a hole here: all six
 * heading and copy classes are declared in the 123 KB root sheet and none in
 * the directory. A collector that walked only `src/styles/` would find zero
 * declared classes, call every live use an orphan, and get deleted for crying
 * wolf. */
const ROOT_SHEET = join(ROOT, "src", "styles.css");

/** `.text-heading-<n>` / `.text-copy-<n>` rules that actually exist. */
function declaredTextClasses(): Set<string> {
  const out = new Set<string>();
  const collect = (raw: string) => {
    for (const m of stripCssComments(raw).matchAll(/\.(text-(?:heading|copy)-\d+)\b/g)) {
      out.add(m[1]);
    }
  };
  collect(readFileSync(ROOT_SHEET, "utf8"));
  for (const f of readdirSync(STYLES)) {
    if (!f.endsWith(".css")) continue;
    collect(readFileSync(join(STYLES, f), "utf8"));
  }
  return out;
}

/** Every quoted or backticked run inside a fragment of source. */
const LITERALS = /(["'`])((?:\\.|(?!\1)[\s\S])*?)\1/g;

/**
 * The class-name STRINGS a file hands to `className`, quotes removed.
 *
 * Attribute values come in three shapes here and all three carry classes:
 * a bare `"..."`, a `{cn("...", className)}` call that spans lines, and a
 * template literal. The bare shape is the one to watch, and the first version
 * of this collector got it wrong in the direction that matters: it returned
 * the region after `className=` and then looked for quoted runs INSIDE it, so
 * `className="text-heading-24"` contributed nothing and the guard found three
 * classes where twenty-two uses exist. It was caught only because the planted
 * defect went unreported. A collector that quietly finds less than it should
 * is the same failure as the one this file was written for.
 *
 * Braces are counted rather than matched by regex, because `{cn(...)}` nests
 * and a lazy regex stops at the first `}` it meets, which in practice is the
 * one closing an interpolation.
 */
function classNameLiterals(src: string): string[] {
  const out: string[] = [];
  for (const m of src.matchAll(/className\s*=\s*/g)) {
    let i = (m.index ?? 0) + m[0].length;
    const open = src[i];
    if (open === '"' || open === "'" || open === "`") {
      const end = src.indexOf(open, i + 1);
      if (end === -1) continue;
      out.push(src.slice(i + 1, end));
      continue;
    }
    if (open !== "{") continue;
    let depth = 0;
    const start = i;
    for (; i < src.length; i++) {
      if (src[i] === "{") depth++;
      else if (src[i] === "}" && --depth === 0) break;
    }
    // Only literal contents count inside an expression. A bare identifier
    // cannot be a class, and a variable holding one is not readable here.
    for (const lit of src.slice(start + 1, i).matchAll(LITERALS)) out.push(lit[2]);
  }
  return out;
}

/** Every text class NAMED in a className, mapped to the files naming it. */
function usedTextClasses(): Map<string, string[]> {
  const found = new Map<string, string[]>();
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.(tsx|ts)$/.test(e.name)) continue;
      if (/\.test\.(ts|tsx)$/.test(e.name)) continue;
      /* Comments are stripped for the same reason the ratchet strips them: a
       * class inside a comment paints nothing, and the notes explaining a
       * retired class read identically to the defect. `DataSection.tsx` names
       * `text-copy-13` in a header explaining what did not survive a rebuild. */
      const src = stripComments(readFileSync(full, "utf8"));
      for (const value of classNameLiterals(src)) {
        for (const c of value.matchAll(/\b(text-(?:heading|copy)-\d+)\b/g)) {
          const list = found.get(c[1]) ?? [];
          list.push(full.slice(ROOT.length + 1));
          found.set(c[1], list);
        }
      }
    }
  };
  walk(join(ROOT, "src"));
  return found;
}

describe("no text-heading/text-copy class is used unless a stylesheet declares it", () => {
  it("every className on the type scale matches a real rule", () => {
    const declared = declaredTextClasses();
    const orphans: string[] = [];
    for (const [cls, files] of usedTextClasses()) {
      if (declared.has(cls)) continue;
      orphans.push(`${cls} used in ${[...new Set(files)].slice(0, 3).join(", ")}`);
    }
    // Sorted so a failure reads the same way twice and a diff is legible.
    expect(orphans.sort()).toEqual([]);
  });

  it("the scale is still found in the sheets, so this cannot pass by finding nothing", () => {
    // A guard whose inputs are empty is decoration, and this one is one bad
    // path away from empty: the classes live in a file the sibling collector
    // never opens. Both halves are asserted, declared and used.
    const declared = declaredTextClasses();
    for (const cls of [
      "text-heading-14",
      "text-heading-16",
      "text-heading-20",
      "text-heading-24",
      "text-copy-13",
      "text-copy-14",
    ]) {
      expect(declared.has(cls)).toBe(true);
    }
    const used = usedTextClasses();
    expect(used.size).toBeGreaterThan(3);
    expect([...used.values()].reduce((n, f) => n + f.length, 0)).toBeGreaterThan(10);
  });

  it("watches the CURRENT design system, not only the retired one", () => {
    // The regression this guards: the scan said `--sp-` for months while
    // Meridian was the only system anybody was writing. If this drops to zero,
    // the guard has quietly gone back to watching nothing that ships.
    const used = usedWithoutFallback();
    const meridian = [...used.keys()].filter((t) => t.startsWith("--mrd-"));
    expect(meridian.length).toBeGreaterThan(20);
  });

  it("every excused token is one the scanner ACTUALLY sees, not one I assumed", () => {
    /*
     * THIS IS THE TEST THAT WOULD HAVE CAUGHT THE MISTAKE, so it replaces the
     * one that did not. The previous version asserted only that each excused
     * name was UNDECLARED, which is true of any string nobody has ever
     * defined -- including two that appeared solely inside a comment. It
     * passed happily while excusing two things that were never defects.
     *
     * An allowlist entry has to earn its place twice: undeclared AND actually
     * used bare in code the scanner reads. When a call site is fixed, this
     * fails until the name comes out of the list, so the excuse cannot outlive
     * the defect.
     */
    const declared = declaredTokens();
    const used = usedWithoutFallback();
    const notReal = [...MERIDIAN_ORPHANS].filter((t) => declared.has(t) || !used.has(t));
    expect(notReal.sort()).toEqual([]);
  });

  it("the two that were invented are gone from the code", () => {
    // 26 moved to 24 and 21 moved to 20, onto the scale that exists rather
    // than declaring two more stops nobody designed.
    const used = usedTextClasses();
    expect(used.has("text-heading-26")).toBe(false);
    expect(used.has("text-heading-21")).toBe(false);
  });
});
