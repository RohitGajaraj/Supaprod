/**
 * THE WHOLE PRODUCT OBEYED A SWITCH NOBODY COULD SET.
 *
 * `html[data-motion="off"]` gates motion in eight rules across styles.css and
 * ink.css -- the live pulse, the shimmer, the sketch draw, the lift press --
 * and `usePrefersReducedMotion` in graph-visual.ts watches the attribute with a
 * MutationObserver so a change lands without a reload. Several comments in this
 * repo call it "the in-product data-motion toggle".
 *
 * NOTHING IN src/ EVER WROTE IT. The only non-CSS reference was the observer's
 * own `attributeFilter`. The CSS was written, the hook was written, the watcher
 * was written, and the switch was not. A person who wanted motion stopped had
 * exactly one route: change an operating-system preference.
 *
 * Same class as `MessageMetaFooter` losing its mount and `BoundaryTool.chosen`
 * shipping into nothing -- a capability wired end to end with no way in. This
 * one is an accessibility control, and R-19 says accessibility is not deferred.
 */
import { describe, it, expect } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { computeReducedMotion } from "@/components/knowledge/graph-visual";

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) {
      out.push(...walk(p));
      continue;
    }
    if ((p.endsWith(".ts") || p.endsWith(".tsx")) && !p.includes(".test.")) out.push(p);
  }
  return out;
}

function code(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
}

describe("the motion switch nobody could set", () => {
  it("something now writes the attribute the CSS reads", () => {
    const writers = walk("src").filter((f) =>
      /setAttribute\(\s*"data-motion"|removeAttribute\(\s*"data-motion"/.test(
        code(readFileSync(f, "utf8")),
      ),
    );
    expect(writers).toContain("src/hooks/use-motion-preference.ts");
  });

  it("and a surface offers it", () => {
    const pane = code(readFileSync("src/routes/_authenticated.settings.tsx", "utf8"));
    expect(pane).toContain("useMotionPreference");
    expect(pane).toContain("MOTION_CHOICES");
  });

  /**
   * THE ASYMMETRY IS THE REASON THIS IS SAFE. `computeReducedMotion` is
   * `mq.matches || dataset === "off"`, so the OS preference always wins toward
   * LESS motion and the toggle can only agree with it. "On" means "do not add
   * a second reason to stop", never "ignore what the system asked for".
   */
  it("the toggle can never override the operating system toward more motion", () => {
    // OS asks for reduced motion: reduced, whatever the toggle says.
    expect(computeReducedMotion(true, undefined)).toBe(true);
    expect(computeReducedMotion(true, "off")).toBe(true);
    // OS is silent: the toggle is the only voice, and only toward less.
    expect(computeReducedMotion(false, "off")).toBe(true);
    expect(computeReducedMotion(false, undefined)).toBe(false);
  });

  /* The CSS this switch drives has to still be there, or the control does
     nothing and we are back where we started with the arrow reversed. */
  it("the rules it drives still exist", () => {
    const styles = readFileSync("src/styles.css", "utf8");
    expect(styles).toContain('html[data-motion="off"]');
  });
});
