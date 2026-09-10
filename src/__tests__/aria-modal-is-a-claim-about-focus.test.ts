/**
 * `aria-modal="true"` IS A CLAIM ABOUT FOCUS, AND IT MUST BE TRUE.
 *
 * It tells assistive technology that everything behind this element is inert.
 * Without a focus trap that is a lie told to exactly the people who cannot see
 * that it is one: a screen reader announces the page as blocked while Tab
 * walks straight out of the dialog into the surface underneath. It is the
 * product asserting a state the record does not hold — the same rule that
 * keeps status colour off a bet with no verdict.
 *
 * ── WHY A GUARD AND NOT A CODE REVIEW ────────────────────────────────────
 * This is the shape Lane 3 named for `@radix-ui` on 2026-09-10 and it
 * generalises past that import: **the Meridian ratchet's markers each name a
 * LINEAGE** — `class:sp-`, `import:components/ui`, `raw-colour`. A control
 * hand-rolled in a third way carries none of them, so the ratchet reads it as
 * fully migrated. Porting the one direct-Radix file moved the counts by
 * exactly zero, which is the proof.
 *
 * MEASURED 2026-09-10, every file outside `meridian/` and `ui/` carrying
 * `role="dialog"`:
 *
 *   ShortcutSheet      useFocusTrap
 *   SendBack           useFocusTrap
 *   GotoShortcuts      lib/overlay
 *   AskPane            lib/overlay
 *   _authenticated.inbox  lib/overlay
 *   RailPhoneBar       a complete trap written inline
 *   BriefFormationFlow **nothing at all**
 *
 * Six of seven already manage focus. The seventh had a scrim,
 * a fixed inset, its own Escape handler and no trap — and it is the same file
 * that failed `every-field-announces-itself` an hour earlier, once that guard
 * could see the directory it lives in. A surface that has never been brought
 * onto the system shows up independently in every scan that can reach it.
 *
 * WHAT THIS DOES NOT DO: forbid a hand-rolled dialog. Meridian's `Dialog` is
 * the right answer and the port is a named packet, but a surface is allowed to
 * compose `useFocusTrap` or `lib/overlay` directly, or write the trap itself as
 * `RailPhoneBar` does. What is not allowed is claiming `aria-modal` while doing
 * none of them.
 */
import { describe, test, expect } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "..", "..");
const srcRoot = join(repoRoot, "src");

/** Comments blanked, offsets preserved, string literals stepped over. */
function stripComments(src: string): string {
  let out = "";
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (c === '"' || c === "'" || c === "`") {
      const q = c;
      out += c;
      i++;
      while (i < src.length && src[i] !== q) {
        if (src[i] === "\\") {
          out += src[i];
          i++;
        }
        out += src[i] ?? "";
        i++;
      }
      out += src[i] ?? "";
      i++;
      continue;
    }
    if (c === "/" && n === "/") {
      while (i < src.length && src[i] !== "\n") {
        out += " ";
        i++;
      }
      continue;
    }
    if (c === "/" && n === "*") {
      while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) {
        out += src[i] === "\n" ? "\n" : " ";
        i++;
      }
      out += "  ";
      i += 2;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx$/.test(full) && !full.includes(".test.")) out.push(full);
  }
  return out;
}

/**
 * WHAT COUNTS AS TRAPPING FOCUS — a MECHANISM, never a list of blessed files.
 *
 * The first version of this checked only the three shared helpers and named
 * `RailPhoneBar` as an offender. It is not one: it implements a complete trap
 * inline — `focusables()`, Tab with shift, first/last wrap, and focus return
 * to the opener — and its own header records the deliberate choice. So the
 * guard was too narrow in exactly the way I had corrected the field-labelling
 * guard for an hour earlier, and it named a file doing the right thing.
 *
 * The fix is NOT an exemption list. A hand-written exemption is the same
 * second source as a hand-written domain, and it drifts the same way. What
 * the rule actually cares about is that focus is MANAGED, so it detects the
 * management: a shared helper, or Tab handling paired with a real `.focus()`
 * call. A surface that does neither is claiming `aria-modal` about nothing.
 *
 * (Note also that `RailPhoneBar` mentions `meridian/Dialog` only in PROSE.
 * The first version matched it and would have passed the file for the wrong
 * reason — a right answer from a broken instrument. Stripping comments is
 * what turned that into a visible failure.)
 */
const SHARED_TRAP = [/use-focus-trap|useFocusTrap/, /lib\/overlay/, /meridian\/Dialog/];
function managesFocus(src: string): boolean {
  if (SHARED_TRAP.some((t) => t.test(src))) return true;
  return /["']Tab["']/.test(src) && /\.focus\(\)/.test(src);
}

function claimsWithoutTrapping(): string[] {
  const out: string[] = [];
  for (const file of walk(srcRoot)) {
    // The design system and the retired layer are where a trap is IMPLEMENTED.
    if (file.includes("/components/meridian/") || file.includes("/components/ui/")) continue;
    const src = stripComments(readFileSync(file, "utf8"));
    if (!/aria-modal\s*=\s*(\{?\s*true|"true")/.test(src)) continue;
    if (managesFocus(src)) continue;
    out.push(file.slice(repoRoot.length + 1));
  }
  return out;
}

describe("aria-modal is a claim about focus", () => {
  test("the scan reaches real files, so an empty result means something", () => {
    // A domain that walks nothing reports a clean sweep in the same words as a
    // domain that walks everything.
    expect(walk(srcRoot).length).toBeGreaterThan(200);
  });

  test("nothing claims aria-modal while composing no trap", () => {
    expect(claimsWithoutTrapping()).toEqual([]);
  });

  test("prose about aria-modal is not a claim", () => {
    // Both RewindButtons name @radix-ui in headers explaining why they no
    // longer use it; a text scan that reads comments fails on exactly the
    // files a rule exists to bless. Same trap, one rule over.
    const commented = `// <div aria-modal="true">\nconst a = 1;\n`;
    const real = `<div aria-modal="true">`;
    expect(/aria-modal\s*=\s*"true"/.test(stripComments(commented))).toBe(false);
    expect(/aria-modal\s*=\s*"true"/.test(stripComments(real))).toBe(true);
  });
});
