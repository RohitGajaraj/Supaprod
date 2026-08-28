/**
 * THE MOTION SWITCH WORKED EVERYWHERE EXCEPT THE SCREEN IT MATTERS ON.
 *
 * MEASURED 2026-08-28. `data-motion` appears in `src/styles.css` five times,
 * gating `.lift:active`, `.sketch-draw`, `.sketch-dot`, `.agent-live` and
 * `.ai-pulse-text`. It appears **ZERO times in all of `src/styles/`**, meridian.css
 * included. So the in-product toggle reaches five legacy classes in the root
 * stylesheet and nothing in the only design system this product has.
 *
 * Every animation on the run screen is an inline style, and the block that does
 * catch those, `[style*="mrd-fade-up"]` at meridian.css:2089, sits under
 * `@media (prefers-reduced-motion: reduce)`. That is the OPERATING SYSTEM's
 * preference. A person who turned motion off in Settings was told it was off and
 * then watched the transcript animate every arriving entry, the Discover pane
 * animate every pattern, and the character mark run `mrd-attention ... infinite`
 * in the four states they look at most, which never stops at all.
 *
 * R-19 says accessibility is not deferred, and a switch that reports success and
 * changes nothing is worse than no switch.
 *
 * ── THE GUARD IS THE POINT ─────────────────────────────────────────────────
 * The unit test below could pass forever while a new inline animation lands
 * ungated in a component nobody thought about, which is exactly how this
 * happened: seven copies of one literal accreted across three files and each new
 * one looked like the last. So the second half reads the sources instead. An
 * invariant in prose decays; one in a check does not.
 */
import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { ENTER_MOTION, enterMotion } from "./enter-motion";

describe("nothing asks for motion that was not wanted", () => {
  it("an arrival animates when motion is allowed", () => {
    expect(enterMotion(true, false)).toEqual({ animation: ENTER_MOTION });
  });

  it("the same arrival asks for nothing when motion is reduced", () => {
    expect(enterMotion(true, true)).toBeUndefined();
  });

  it("something already on screen never animates, whatever the preference", () => {
    // The transcript's rule: nothing already there is an event.
    expect(enterMotion(false, false)).toBeUndefined();
    expect(enterMotion(false, true)).toBeUndefined();
  });

  it("returns undefined rather than an empty object, so no element carries a style it did not need", () => {
    expect(enterMotion(true, true)).not.toEqual({});
  });
});

/** The run screen's own directories. Every one of them is S1's. */
const RUN_DIRS = ["track", "spine", "presence", "discover", "decisions", "learn", "ask"];
const COMPONENTS = join(import.meta.dir, "..");

function tsxIn(dir: string, out: string[] = []): string[] {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      tsxIn(full, out);
      continue;
    }
    if (!e.name.endsWith(".tsx")) continue;
    if (/\.test\.tsx$/.test(e.name)) continue;
    out.push(full);
  }
  return out;
}

describe("no inline animation on the run screen escapes the toggle", () => {
  it("no component names a Meridian keyframe in a raw inline style", () => {
    /*
     * A raw `animation: "mrd-..."` in a style object is the shape that cannot
     * see the preference. Going through `enterMotion`, or gating on
     * `reducedMotion` at the call site as `Character` does for its infinite
     * pulse, both read the toggle. Either is fine; a bare literal is not.
     */
    const offenders: string[] = [];
    for (const dir of RUN_DIRS) {
      for (const file of tsxIn(join(COMPONENTS, dir))) {
        const src = readFileSync(file, "utf8");
        for (const [i, line] of src.split("\n").entries()) {
          if (/animation:\s*"mrd-/.test(line)) {
            offenders.push(`${file.slice(file.indexOf("src/"))}:${i + 1} ${line.trim()}`);
          }
        }
      }
    }
    expect(offenders.sort()).toEqual([]);
  });

  it("the one arrival string is declared once, not copied", () => {
    // It was written out seven times across three files before this. A
    // duplicated literal is how two of them drift apart and nobody notices.
    const decl = readFileSync(join(import.meta.dir, "enter-motion.ts"), "utf8");
    expect(decl).toContain("mrd-fade-up");
    expect(ENTER_MOTION).toBe("mrd-fade-up var(--mrd-d-enter) var(--mrd-ease) both");
  });
});
