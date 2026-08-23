import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const PARTS = join(import.meta.dir, "..", "surface-parts.tsx");

/**
 * A TIERED CONTROL IS AT LEAST 44px ON A PHONE.
 *
 * ── HOW THIS WAS FOUND, WHICH IS THE PART WORTH KEEPING ─────────────────
 * By a port going the wrong way. `CONTROL_SHAPE` was `inline-flex h-8`, a FIXED
 * 32px, with no mobile branch. The retired Obsidian layer's `.loom-press`
 * carries `min-height: 44px; min-width: 44px` under 768px, and `data-obsidian`
 * is still mounted on `<html>` for the whole authenticated tree, so that rule is
 * LIVE, not dead. A native `<button className="loom-press">` was therefore a
 * 44px target on a phone and moving it onto `<Action>` took it to 32px.
 *
 * Both lanes are porting controls onto these tiers right now on MAIN LANE's own
 * instruction (M07, M10), so every such port was shrinking a tap target. LANE 0's
 * unit L0-002 moved nine controls that way in a single file, correctly, against
 * a design system that was wrong underneath them.
 *
 * ── WHY 44 AND NOT A TASTE PICK ─────────────────────────────────────────
 * WCAG 2.1 AAA target size, and Meridian's own argument. `surface-parts.tsx`
 * defends the decision bar's move to 44px in its own words: "a row carrying a
 * decision earns the height, and 44px is the smallest square a finger reliably
 * hits". Rows were given that floor. The controls a finger actually lands on
 * were not, which is the contradiction this closes.
 *
 * ── PINNED TO THE CLAIM ─────────────────────────────────────────────────
 * It resolves the Tailwind step to pixels rather than asserting the string
 * `min-h-11`, so renaming the step to an equivalent one passes and quietly
 * dropping to `min-h-9` fails. Four guards in this directory failed a correct
 * change on 2026-08-23 by pinning a spelling; this one does not repeat it.
 */

/** Tailwind's spacing scale: one step is 0.25rem, and the root is 16px. */
const STEP_PX = 4;
const WCAG_AAA_TARGET_PX = 44;

function controlShape(src: string): string {
  const m = src.match(/export const CONTROL_SHAPE\s*=\s*\n?\s*"([^"]+)"/);
  if (!m) {
    throw new Error(
      "CONTROL_SHAPE is gone or no longer a plain string; this guard needs rewriting rather than deleting",
    );
  }
  return m[1];
}

/** `max-md:min-h-11` -> 44. Returns null when no mobile floor is declared. */
function mobileFloorPx(shape: string, prop: "h" | "w"): number | null {
  const m = shape.match(new RegExp(`max-md:min-${prop}-(\\d+(?:\\.\\d+)?)`));
  if (m) return Number(m[1]) * STEP_PX;
  const arb = shape.match(new RegExp(`max-md:min-${prop}-\\[(\\d+)px\\]`));
  return arb ? Number(arb[1]) : null;
}

describe("a tiered control is big enough to hit", () => {
  const src = readFileSync(PARTS, "utf8");

  it("reads CONTROL_SHAPE at all, so a rename cannot make this pass vacuously", () => {
    expect(controlShape(src).length).toBeGreaterThan(20);
  });

  it("declares a mobile height floor of at least the WCAG AAA target", () => {
    const px = mobileFloorPx(controlShape(src), "h");
    expect(px).not.toBeNull();
    expect(px!).toBeGreaterThanOrEqual(WCAG_AAA_TARGET_PX);
  });

  it("declares a mobile width floor too, because an icon-only control is square", () => {
    const px = mobileFloorPx(controlShape(src), "w");
    expect(px).not.toBeNull();
    expect(px!).toBeGreaterThanOrEqual(WCAG_AAA_TARGET_PX);
  });

  it("keeps the floor as a MINIMUM, so the desktop height is untouched", () => {
    // `height` and `min-height` together are the whole trick: min-height wins in
    // the cascade on a phone and does nothing on a desktop, so h-8 stays the
    // desktop figure. A shape that dropped h-8 for a plain h-11 would make every
    // desktop control taller, which is not what this is for.
    const shape = controlShape(src);
    expect(shape).toContain("h-8");
    expect(shape).toMatch(/max-md:min-h-/);
  });

  it("both tiers compose the shape, so neither can drift off the floor", () => {
    // Action and Approve are the two things a person presses. If either stopped
    // composing CONTROL_SHAPE it would silently lose the floor.
    for (const name of ["Action", "Approve"]) {
      const fn = src.slice(src.indexOf(`export function ${name}`));
      expect(fn.slice(0, 2500)).toContain("CONTROL_SHAPE");
    }
  });

  it("still carries the press, so a control leaving loom-press loses nothing", () => {
    // `.loom-press` also gives `transform: scale(0.98)` on :active. Meridian
    // duplicates it at the same 0.98 on purpose; this records that it must stay
    // for as long as controls are being ported off the retired class.
    expect(controlShape(src)).toContain("active:scale-[0.98]");
  });
});
