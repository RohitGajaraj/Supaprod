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

/**
 * The 49 inline Meridian animations OUTSIDE the run screen are not reachable
 * from a component fix, and rewriting twenty files would be the wrong shape
 * anyway. meridian.css gates them, and it gated them for the operating system
 * only. The twin block is the fix; this is what stops the two drifting.
 */
describe("the stylesheet stops motion for the toggle, not only for the OS", () => {
  const CSS = readFileSync(join(import.meta.dir, "..", "..", "styles", "meridian.css"), "utf8");

  /** Every `mrd-*` keyframe a `[style*="..."]` selector names, within one slice. */
  function gatedKeyframes(slice: string): string[] {
    return [...slice.matchAll(/\[style\*="(mrd-[\w-]+)"\]/g)].map((m) => m[1]).sort();
  }

  const osBlock = (() => {
    const start = CSS.indexOf(
      '@media (prefers-reduced-motion: reduce) {\n  [style*="mrd-pixel-on"]',
    );
    return CSS.slice(start, CSS.indexOf("\n}\n", start));
  })();
  const toggleBlock = (() => {
    const start = CSS.indexOf('html[data-motion="off"] [style*=');
    return CSS.slice(start, CSS.indexOf("THE POINTER", start));
  })();

  it("the in-product toggle reaches the stylesheet at all", () => {
    // It reached `src/styles.css` five times and `src/styles/` zero times.
    expect(CSS).toContain('html[data-motion="off"]');
  });

  it("both blocks gate the same keyframes, so neither can drift", () => {
    const os = [...new Set(gatedKeyframes(osBlock))];
    const toggle = [...new Set(gatedKeyframes(toggleBlock))];
    expect(os.length).toBeGreaterThan(0);
    expect(toggle).toEqual(os);
  });

  it("the toggle keeps the lattice visible, not merely still", () => {
    /*
     * The rule somebody drops by copying only the obvious one. Stopping
     * `mrd-pixel-on` parks each cell at its inline `opacity: 0.15`, the trough
     * of its own envelope, measured at 1.19:1 against the ground: the number
     * DESIGN-SYSTEM.md law 5 records as this system's caught catastrophe.
     */
    expect(toggleBlock).toContain("opacity: 1 !important");
  });

  it("and freezes the shimmer at its midpoint rather than against an edge", () => {
    expect(toggleBlock).toContain("background-position: 50% 0 !important");
  });
});
