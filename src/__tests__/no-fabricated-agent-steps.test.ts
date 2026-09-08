import { describe, it, expect } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname, relative } from "node:path";

/**
 * AGENT THEATER GUARD.
 *
 * THE DEFECT THIS EXISTS TO KILL, found 2026-08-05. Two surfaces narrated agent
 * work that was never reported by any server event:
 *
 *   SelfImprovementPanel cycled ["Screening the fix for safety...", "Writing the
 *   house rule...", "Recording it on the Trust Ledger..."] on a 1500ms
 *   setInterval. "Recording it on the Trust Ledger" appeared while nothing had
 *   been recorded, then UN-appeared as the modulo wrapped.
 *
 *   ObsidianOnboarding (the first-run screen before FirstRun; deleted
 *   2026-09-08) stepped through ["Reading your belief", "Hunting
 *   counter-evidence", "Scoring confidence"] on a 2400ms timer, tied only to a
 *   mutation's isPending. The critic call's catch swallows its error, so the
 *   full three-step performance also played when the critic had already failed
 *   and there would be no review at the end of it. That was the first thing a
 *   brand-new account ever watched this product do.
 *
 * WHY IT IS WORTH A BUILD-FAILING TEST rather than a review note. This product's
 * entire claim is that you can see what the agents are actually doing. Invented
 * narration is the precise screenshot a skeptical reviewer needs to argue it is
 * a wrapper with theater on top, and that argument would be fair. It is also the
 * easiest defect in the world to reintroduce, because a cycling label genuinely
 * does look better than a static one, and the founder's own rule that a still
 * label reads as stalled pushes in that direction.
 *
 * THE LINE THIS DRAWS. A timer that advances a COUNT is fine and is what both
 * surfaces use now: an elapsed second-count is measurably true and cannot be
 * right while the work is wrong. A timer that advances an INDEX INTO A LIST OF
 * STEP LABELS is a fabrication. So this bans the shape, not the setInterval.
 *
 * Modelled on design-tempo-font-guard.test.ts: scan source as TEXT, strip
 * comments first (this file and the two fixed ones legitimately describe the
 * banned pattern in prose), and accumulate offenders so one failure names every
 * offending file at once.
 */

const SRC_ROOT = join(import.meta.dir, "..");
const SCAN_EXTENSIONS = new Set([".ts", ".tsx"]);
const SKIP_DIRS = new Set(["__tests__", "node_modules", "fonts"]);

/** Strip comments so prose that NAMES the banned pattern does not trip it. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

function collectFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) collectFiles(full, out);
    else if (
      SCAN_EXTENSIONS.has(extname(entry)) &&
      !entry.endsWith(".test.ts") &&
      !entry.endsWith(".test.tsx")
    ) {
      out.push(full);
    }
  }
  return out;
}

/**
 * A timer callback that walks an index through a list of labels.
 *
 * Matches the two real shapes that shipped:
 *   setI((v) => (v + 1) % messages.length)          modulo cycle, wraps forever
 *   setStage((s) => Math.min(s + 1, STAGES.length - 1))   clamped walk
 * Both are "advance a pointer into an array of strings on a clock", which is the
 * fabrication. `setSeconds((s) => s + 1)` is deliberately NOT matched.
 */
const FABRICATED_STEP_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  {
    name: "modulo cycle through a label list on a timer",
    pattern: /set\w+\s*\(\s*\(\s*\w+\s*\)\s*=>\s*\(?\s*\w+\s*\+\s*1\s*\)?\s*%\s*\w+\.length/,
  },
  {
    name: "clamped walk through a label list on a timer",
    pattern: /Math\.min\s*\(\s*\w+\s*\+\s*1\s*,\s*\w+\.length\s*-\s*1\s*\)/,
  },
];

describe("agent theater guard", () => {
  const files = collectFiles(SRC_ROOT);

  // A broken walker returning [] would make every ban below pass vacuously.
  it("actually walks the source tree", () => {
    expect(files.length).toBeGreaterThan(200);
    expect(files.some((f) => f.endsWith("AppFrame.tsx"))).toBe(true);
  });

  for (const { name, pattern } of FABRICATED_STEP_PATTERNS) {
    it(`no surface fabricates agent steps: ${name}`, () => {
      const offenders: string[] = [];
      for (const file of files) {
        const src = stripComments(readFileSync(file, "utf8"));
        // Only a match INSIDE a timer is a fabrication; the same index walk is
        // legitimate in a carousel driven by a user press.
        if (!/setInterval|setTimeout/.test(src)) continue;
        if (pattern.test(src)) offenders.push(relative(SRC_ROOT, file));
      }
      expect(offenders).toEqual([]);
    });
  }

  // Proves the matcher works, rather than only that the tree happens to be clean.
  it("catches the exact code that shipped, and spares an honest elapsed counter", () => {
    const shipped = `
      const t = setInterval(() => setI((v) => (v + 1) % messages.length), 1500);
    `;
    const alsoShipped = `
      const t = window.setInterval(
        () => setCriticStage((s) => Math.min(s + 1, CRITIC_STAGES.length - 1)),
        2400,
      );
    `;
    const honest = `
      const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    `;
    expect(FABRICATED_STEP_PATTERNS.some((p) => p.pattern.test(shipped))).toBe(true);
    expect(FABRICATED_STEP_PATTERNS.some((p) => p.pattern.test(alsoShipped))).toBe(true);
    expect(FABRICATED_STEP_PATTERNS.some((p) => p.pattern.test(honest))).toBe(false);
  });
});
