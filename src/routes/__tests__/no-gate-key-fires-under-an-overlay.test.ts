import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * THE SHORTCUT SHEET DOCUMENTED A DESTRUCTIVE KEY AND LEFT IT ARMED.
 *
 * THE DEFECT, and it is the sharpest thing this session shipped. Press `?` on
 * Today. The sheet opens and prints, in its own words, "a -- Approves the call
 * in front of you. COMMITS". Press `a` to confirm you read that right, and the
 * call behind the scrim is approved. The surface built to teach the keyboard
 * safely was the one that fired it.
 *
 * `BoardPanel` has the identical shape and opens on an ordinary rail click, so
 * this was reachable without going near the help sheet at all.
 *
 * WHY EVERY EXISTING GUARD MISSED IT. The gates stand down when focus is in an
 * INPUT, TEXTAREA or SELECT, and both overlays are made of BUTTONs and a scrim,
 * so focus is never in a field. `useFocusTrap` constrains Tab and says nothing
 * about other keys. `ShortcutSheet`'s own capture handler returns unless the
 * key is Escape. Each layer was correct about its own job and none of them was
 * about this.
 *
 * The chord handler has stood down under `OPEN_MODAL_SELECTOR` for hours -- it
 * was taught after `g d` on Today was found to navigate AND decline the call
 * behind it. The gates were never taught the same thing, which is the same
 * defect twice with different keys.
 */

const ROOT = join(import.meta.dir, "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

/** Every surface that binds a bare key to something that commits.
 *
 *  NAMED BY THE FILE THAT HOLDS THE LISTENER, not by the route. Today's
 *  decisions moved into `DecisionQueue` so the keycaps and the keys they
 *  promise sit together — `key-model.ts` declares the same file for the same
 *  reason — and Discover has always been listed as its component. If a
 *  surface's keyboard moves, this path moves with it, or the guard quietly
 *  starts checking a file that binds nothing and passes on an unguarded one. */
// "Decide" and "Design" left this list (P-14, A-QUEUE.md, R-34): each gate
// and every key it bound are deleted, not rehomed.
const GATES = [
  ["Today", "components/today/DecisionQueue.tsx"],
  ["Approvals", "routes/_authenticated.approvals.tsx"],
  ["Crew", "routes/_authenticated.crew.tsx"],
  ["Discover", "components/discover/DiscoverSurface.tsx"],
] as const;

describe("no gate key fires while something is open over it", () => {
  for (const [name, rel] of GATES) {
    it(`${name} stands down under an open overlay`, () => {
      expect(read(rel)).toContain("if (isModalOpen()) return;");
    });
  }

  for (const [name, rel] of GATES) {
    it(`${name} checks it BEFORE reading the key`, () => {
      // A guard after the key comparison is a guard that has already acted.
      const src = read(rel);
      const guard = src.indexOf("if (isModalOpen()) return;");
      const firstKey = src.indexOf('e.key === "', guard - 4000 > 0 ? guard - 4000 : 0);
      expect(guard).toBeGreaterThan(-1);
      expect({ name, guardBeforeKey: guard < src.indexOf('e.key === "', guard) }).toEqual({
        name,
        guardBeforeKey: true,
      });
      void firstKey;
    });
  }

  it("all four share one selector rather than four copies of it", () => {
    // This repo has twice paid for a guard that existed in two ages. The helper
    // lives in src/lib/overlay.ts and the chord uses the same constant.
    for (const [, rel] of GATES) {
      expect(read(rel)).toMatch(/import \{ isModalOpen \} from "@\/lib\/overlay";/);
    }
  });

  it("the selector still recognises both overlay shapes", () => {
    // Radix marks an open layer with data-state; the repo's hand-rolled
    // overlays declare aria-modal and have no data-state. Neither clause covers
    // the other, and the shortcut sheet is one of the hand-rolled ones.
    const overlay = read(join("lib", "overlay.ts"));
    expect(overlay).toContain('[role="dialog"][aria-modal="true"]');
    expect(overlay).toContain('[role="alertdialog"][data-state="open"]');
  });

  it("the sheet and the board still declare themselves as modal", () => {
    // If either stopped declaring it, the guards above would silently stop
    // firing and the keys would arm again with nothing failing.
    for (const rel of [
      join("components", "shell", "ShortcutSheet.tsx"),
      join("components", "shell", "BoardPanel.tsx"),
    ]) {
      expect(read(rel)).toContain('aria-modal="true"');
    }
  });
});
