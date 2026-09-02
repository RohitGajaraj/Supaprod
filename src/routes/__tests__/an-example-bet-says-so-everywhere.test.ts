import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * A SEEDED BET MUST SAY IT IS SEEDED ON EVERY SURFACE THAT SHOWS IT.
 *
 * WHAT ONBOARDING DOES. It writes four invented opportunities into the new
 * user's REAL workspace. That is a reasonable thing to do and a dangerous
 * thing to do silently: the first screens a Product Hunt visitor sees would
 * otherwise present fiction about a product they do not have, identically to
 * their own work.
 *
 * WHAT THIS FILE ONCE ALSO COVERED, BEFORE P-14 (A-QUEUE.md, R-34). `/decide`
 * -- its gate, its ranked list, and the ordering between its own sample mark
 * and the detail sheet's -- carried three of this file's original five tests.
 * The page and its ranking are deleted, not rehomed; those tests went with it.
 *
 * WHAT REMAINS. THE DETAIL SHEET declared `is_sample` on its own interface
 * and once rendered it nowhere -- the surface someone opens to STUDY a bet
 * before acting. Fixed, and still the one surviving surface this file proves.
 *
 * Measured live while wiring it: 20 sample opportunities across 5 workspaces,
 * with `select("*")` carrying the flag to the client the whole time. The data
 * was never the problem.
 */

const ROOT = join(import.meta.dir, "..", "..");
const SHEET = readFileSync(
  join(ROOT, "components", "discover", "OpportunityDetailSheet.tsx"),
  "utf8",
);

describe("every surface that shows a bet says when it is an example", () => {
  it("the detail sheet renders the flag it declares", () => {
    // It typed `is_sample` and showed nothing. A field on an interface that no
    // JSX reads is the same defect as an uncalled export, one layer down.
    expect(SHEET).toMatch(/opportunity\.is_sample \?/);
    expect(SHEET).toMatch(/This is an example/);
  });

  it("an unknown flag reads as NOT a sample, never as one", () => {
    // The field's own note: mislabelling a real bet as fiction is worse than
    // leaving one example unmarked. The surface must test truthiness rather
    // than absence.
    expect(SHEET).not.toMatch(/is_sample\s*!==\s*false/);
  });
});
