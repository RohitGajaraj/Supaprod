import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { SIGNED_IN_HOME } from "../post-auth-home";

const ROOT = join(import.meta.dir, "..", "..", "..");
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

/**
 * THE POST-AUTH HOME HAS ONE DEFINITION (R-15 mechanism 2).
 *
 * Promotion of `/start` is promised to be ONE reversible line. That promise
 * only holds while every "go to the app's home" door reads the same constant;
 * the drift this guard prevents is real — before it existed the answer was
 * spelled independently in login, signup, the public landing and seven
 * retired-route redirects. A future editor who needs the home should import
 * the constant, not re-type a literal that promotion will then miss.
 */
describe("the signed-in home is one value in one place", () => {
  /**
   * FLIPPED 2026-08-25. This assertion tracks the VALUE; the invariant this file
   * actually protects is the one in the header — **the home has one definition**
   * — and that is untouched by the flip. The three assertions below, which are
   * the anti-drift guard, are unchanged and still do all the work.
   *
   * WHY IT MOVED, in one line: an audit of the real first sixty seconds found a
   * new account lands on `/today`, whose empty state opens with **five
   * negations** and offers **no control that starts a run**, while `/start` —
   * live, auto-driving, 500ms transcript, character present — sat behind a rail
   * label a new user has no reason to press. We built the right first screen and
   * made it the side door.
   *
   * Reversing is still one line, which is the promise this seam exists to keep.
   */
  it("is /start — the flip R-15 built this seam for", () => {
    expect(SIGNED_IN_HOME).toBe("/start");
  });

  /**
   * The compare link must survive the flip in BOTH directions. R-15 put it on
   * `/start` so the two landings can be seen side by side; now that `/start` is
   * the home, that link is how anyone reaches the old one to compare.
   */
  it("keeps the deliberate compare link to the other landing", () => {
    expect(read("routes/_authenticated.start.tsx")).toContain("/today");
  });

  it("login and signup import it instead of defining their own", () => {
    for (const f of ["routes/login.tsx", "routes/signup.tsx"]) {
      const s = read(f);
      expect(s).toContain('from "@/components/shell/post-auth-home"');
      expect(s).not.toMatch(/const SIGNED_IN_HOME/);
    }
  });

  it("no route file hardcodes the old home as a redirect target any more", () => {
    // The deliberate exceptions live OUTSIDE routes/: start.tsx's compare link
    // names /today on purpose so the founder can see both landings (R-15).
    //
    // P-10 (A-QUEUE.md, 2026-09-02) deleted every pure-redirect stub this test
    // used to check, chat/govern/inbox/tasks/m.index/m.$productId and
    // $workspaceSlug.$productSlug among them: their redirect logic is gone
    // along with the file, so the question "does this file hardcode /today"
    // no longer has anything to ask it of.
    const offenders: string[] = [];
    for (const f of ["routes/index.tsx", "routes/_authenticated.settings.tsx"]) {
      if (read(f).includes('"/today"')) offenders.push(f);
    }
    expect(offenders).toEqual([]);
  });
});
