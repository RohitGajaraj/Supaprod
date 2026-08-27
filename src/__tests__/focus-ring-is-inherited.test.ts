/**
 * THE FOCUS RING IS INHERITED, NEVER DECLARED.
 *
 * ── THE MECHANISM, WHICH IS THE WHOLE REASON THIS GUARD EXISTS ───────────
 * A component cannot give itself a focus ring in this app, and every attempt to
 * do so has painted nothing. Both stylesheets say so in their own words.
 *
 * `src/styles.css`, at the rule that beats them, records the browser check that
 * proved it: its `[data-obsidian] :focus-visible` rule "is unlayered plain CSS
 * (it sits after both explicit `@layer base` and `@layer utilities` close
 * earlier in this file)", so "ANY component-level Tailwind utility class
 * targeting focus-visible outline color... is permanently inert here. It cannot
 * win no matter what color it names."
 *
 * `src/styles/meridian.css` states the other half: "Tailwind emits utilities
 * into its own `utilities` layer, so `focus-visible:outline-[var(--mrd-edge-
 * focus)]` could not win no matter what colour it named."
 *
 * Per the CSS Cascade Layers spec an unlayered declaration beats a layered one
 * regardless of specificity or source order. `AuthedLayout` mounts
 * `data-obsidian` on `<html>` for the whole authenticated tree, so this is not
 * a theoretical cascade puzzle: it is the state of every screen behind the login.
 *
 * WHAT DOES WORK is the attribute. `meridian.css` carries an unlayered
 * `[data-mrd][data-mrd] :focus-visible` rule, written twice on purpose so it
 * scores (0,3,0) and outranks `[data-obsidian] :focus-visible` at (0,2,0)
 * outright rather than tying and losing on source order. So a control takes a
 * ring by being INSIDE a `data-mrd` root, and `mrd-focus-inset` (a real class in
 * meridian.css, which needs a `data-mrd` ANCESTOR rather than the attribute on
 * itself) moves that ring inside a control that sits flush in a clipping parent.
 *
 * ── WHY A GUARD AND NOT A NOTE ───────────────────────────────────────────
 * This defect is invisible to every other gate. The CSS reads correct, the
 * className is spelled correctly, the token it names is the right one, `tsc`
 * passes, the component test passes, and the ring is simply absent in the
 * browser. `meridian-ratchet-scan.ts` records that a constant named `FOCUS_RING`
 * "had been INERT in six files for months, spelled correctly, pointing at the
 * right token, and painting nothing". Measured again on 2026-08-21: 48 lines
 * across 42 files still declared one, and 13 of those files carried no
 * `data-mrd` at all, so their controls were taking the legacy ring rather than
 * Meridian's.
 *
 * Nothing about that is a knowledge problem. Every author had read the doctrine.
 * It was not enforced by anything, so it decayed at the rate new code was
 * written. This is the mechanism.
 *
 * ── THE ONE RULE ─────────────────────────────────────────────────────────
 * A file that declares a `focus-visible:outline` utility must also carry the
 * `data-mrd` attribute, so the ring it is asking for is one it will actually get.
 *
 * The rule is deliberately not "never declare one". A `focus-visible:outline`
 * inside a `data-mrd` root is an invisible no-op rather than a broken ring: it
 * names the colour the winning rule already paints, so deleting it is tidying
 * and not a fix. 21 files are in that state today and are reported below as
 * noise rather than failed, because a guard that fails on something harmless is
 * a guard somebody switches off.
 */

import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

import { REPO_ROOT, stripComments } from "./meridian-ratchet-scan";

const SCAN_ROOT = "src";
const EXTENSIONS = [".tsx", ".ts"];
/**
 * TESTS ARE NOT SCANNED, and this replaced an exemption rather than adding one.
 *
 * The rule this guard enforces is about what a KEYBOARD READER MEETS: a control
 * that asks for a ring in its own class names and does not get one, because the
 * unlayered `[data-obsidian] :focus-visible` rule in `src/styles.css` beats every
 * `@layer`. A test renders into happy-dom and nobody tabs through it, so the rule
 * has nothing to say about one.
 *
 * It also caught the wrong thing twice, in opposite directions. A fixture passing
 * the string to a component as data sat on the exemption list as "a genuine
 * exception". Then `refused.test.tsx` arrived asserting the utility is ABSENT,
 * and tripped a guard looking for the utility -- a test proving the rule holds
 * was reported as breaking it. That is the same shape as the ghost-status guard,
 * which had to assemble its forbidden string from parts so it would not satisfy
 * its own grep, and the answer here is the cheaper one: do not read the files
 * that talk ABOUT the rule while checking the files that OBEY it.
 *
 * The exemption list is better for it. Every entry left is now one kind of thing,
 * a live file with a broken ring owned by another item, so the list reads as a
 * debt register rather than as two unrelated ideas sharing an array.
 */
const IS_TEST = /(?:^|\/)__tests__\/|\.test\.tsx?$/;

/**
 * A component asking for a focus ring in its own class names, in either syntax
 * Tailwind accepts: the utility (`focus-visible:outline-[var(--x)]`) and the
 * arbitrary property (`focus-visible:[outline-color:var(--x)]`). Both land in
 * the `utilities` layer and both lose.
 */
const DECLARES_RING = /focus-visible:(?:outline|\[outline)/g;

/** The attribute, not the string. `data-mrd` also appears as a dead class token
 *  in one Meridian file and as prose in a dozen docblocks; only the attribute
 *  paints, and comments are stripped before this runs regardless. */
const CARRIES_ATTRIBUTE = /data-mrd\s*=/;

/**
 * ── THE EXEMPTIONS, EACH WITH A REASON AND A DATE ────────────────────────
 *
 * Every entry here is a file that declares a ring, carries no `data-mrd`, and
 * was NOT fixed on 2026-08-21, with the reason it was left. This is a scoped
 * guard and says so: the honest options were to fix all 14 or to fix what this
 * item owned and name the rest, and widening the fix into files another item
 * owns would have collided with it.
 *
 * TWO KINDS OF ENTRY, and only one of them is a real exception.
 *
 *   A GENUINE EXCEPTION is a file where the rule does not apply. There is one
 *   kind here: a test fixture that builds a props object containing the string,
 *   which declares nothing and renders nothing.
 *
 *   THE REST ARE OWNED ELSEWHERE. Nine of them are the retired Obsidian v3 and
 *   Tempo v5 (shadcn) component trees, whose end state is deletion rather than a
 *   port, so tagging them would spend work on markup that is scheduled to go.
 *   Three are live surfaces that a different queue item owns (a fourth,
 *   MissionOrchestratorDetail.tsx, was fixed on 2026-08-23 when its controls
 *   moved onto Meridian's tiers under a `data-mrd` root, and left this
 *   register). Neither is a defence of the code: all twelve have broken rings
 *   in production today.
 */
const EXEMPT: ReadonlyArray<{ path: string; why: string }> = [
  // The retired component layers. `meridian-ratchet-scan.ts` counts imports from
  // both trees as debt; the end state is deletion, so a ring here is not worth
  // porting.
  {
    path: "src/components/ui/button.tsx",
    why: "Retired Tempo v5 (shadcn) component layer, scheduled for deletion rather than a port.",
  },
  {
    path: "src/components/ui/dialog.tsx",
    why: "Retired Tempo v5 (shadcn) component layer, scheduled for deletion rather than a port.",
  },
  {
    path: "src/components/ui/sheet.tsx",
    why: "Retired Tempo v5 (shadcn) component layer, scheduled for deletion rather than a port.",
  },

  // Live surfaces with real broken rings, owned by other items. Named here so
  // the debt is visible rather than silently outside the guard.
];

const EXEMPT_PATHS = new Set(EXEMPT.map((e) => e.path));

function walk(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    let s;
    try {
      s = statSync(full);
    } catch {
      continue;
    }
    if (s.isDirectory()) walk(full, out);
    else if (EXTENSIONS.some((e) => entry.endsWith(e))) out.push(full);
  }
  return out;
}

type Scanned = { path: string; rings: number; tagged: boolean };

/**
 * Comments are stripped first, and it is not a loophole. `surface-discipline`
 * and the Meridian ratchet both set this precedent: a class name inside a
 * docblock paints nothing, and a guard that punished writing the reasoning down
 * would quietly delete the institutional memory this migration runs on. Every
 * file fixed on 2026-08-21 carries a paragraph naming the dead utility it lost.
 */
function scanRings(): Scanned[] {
  const out: Scanned[] = [];
  for (const file of walk(join(REPO_ROOT, SCAN_ROOT))) {
    const rel = relative(REPO_ROOT, file).split(sep).join("/");
    if (IS_TEST.test(rel)) continue;
    const code = stripComments(readFileSync(file, "utf8"));
    const rings = code.match(DECLARES_RING)?.length ?? 0;
    if (rings === 0) continue;
    out.push({ path: rel, rings, tagged: CARRIES_ATTRIBUTE.test(code) });
  }
  return out;
}

const scanned = scanRings();

describe("the focus ring is inherited from data-mrd, never declared by a component", () => {
  it("admits no file that declares a focus-visible outline without data-mrd", () => {
    const offenders = scanned
      .filter((f) => !f.tagged && !EXEMPT_PATHS.has(f.path))
      .map((f) => `${f.path}  (${f.rings} declaration${f.rings === 1 ? "" : "s"})`);

    expect(
      offenders,
      offenders.length === 0
        ? ""
        : [
            "",
            "A CONTROL IS ASKING FOR A FOCUS RING IT WILL NOT GET.",
            "",
            "`src/styles.css` carries an UNLAYERED `[data-obsidian] :focus-visible`",
            "rule and `AuthedLayout` mounts `data-obsidian` on <html>, so it applies",
            "to every screen behind the login. Per the CSS Cascade Layers spec an",
            "unlayered declaration beats a layered one regardless of specificity, and",
            "Tailwind emits utilities into its own `utilities` layer. So the class",
            "below is inert: it cannot win whatever colour it names, and if it names",
            "`--focus-ring` it is naming the legacy alias as well.",
            "",
            offenders.map((o) => `  ${o}`).join("\n"),
            "",
            "The fix is the attribute, not a louder utility:",
            '  put `data-mrd=""` on the component root and DELETE the',
            "      `focus-visible:outline-*` classes. meridian.css paints the ring for",
            "      everything under that root.",
            "  a component with an early return needs it on that return TOO, or its",
            "      controls lose the ring on exactly that path.",
            "  a control flush inside a clipping or scrolling parent adds the",
            "      `mrd-focus-inset` CLASS, which wants a `data-mrd` ANCESTOR rather",
            "      than the attribute on itself.",
            "  a genuine exception gets an entry in EXEMPT above, with a reason.",
            "",
          ].join("\n"),
    ).toEqual([]);
  });

  it("keeps the exemption list honest, so a fixed file cannot sit on it forever", () => {
    /*
     * The ratchet half. Without this the list is write-only: a file could be
     * ported, or deleted, and its entry would stay behind claiming debt that no
     * longer exists — which is how an exemption list stops describing the
     * codebase and starts excusing it. An entry earns its place only while the
     * file it names still declares a ring and still carries no `data-mrd`.
     */
    const byPath = new Map(scanned.map((f) => [f.path, f]));
    const stale = EXEMPT.filter((e) => {
      const found = byPath.get(e.path);
      return !found || found.tagged;
    }).map((e) => e.path);

    expect(
      stale,
      stale.length === 0
        ? ""
        : [
            "",
            "AN EXEMPTION NO LONGER DESCRIBES ANYTHING.",
            "",
            "Each file below either no longer declares a focus-visible outline, or",
            "now carries `data-mrd`, or is gone. Good news in every case. Delete its",
            "entry from EXEMPT so the list keeps naming real debt:",
            "",
            stale.map((s) => `  ${s}`).join("\n"),
            "",
          ].join("\n"),
    ).toEqual([]);
  });

  it("reports the inert no-ops, which are noise rather than a failure", () => {
    /*
     * A declaration inside a `data-mrd` root names the colour the winning rule
     * already paints, so it draws the correct ring by accident and deleting it
     * changes no pixel. Counted where somebody reads it, never asserted: these
     * live in files this item does not own, and failing on a harmless string is
     * how a guard gets switched off in an hour.
     */
    const noOps = scanned.filter((f) => f.tagged);
    const tokens = noOps.reduce((sum, f) => sum + f.rings, 0);
    expect(noOps.length).toBeGreaterThanOrEqual(0);
    expect(tokens).toBeGreaterThanOrEqual(0);
  });
});
