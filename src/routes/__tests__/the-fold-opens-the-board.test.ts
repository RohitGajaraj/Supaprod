import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

/**
 * THE FOLD SENDS `/runs` TO THE BOARD, NOT TO WHEREVER HOME HAPPENS TO BE.
 *
 * This drifted once already and the file's own comment did not stop it. It read
 * "/runs folds into /today (the board)" while redirecting to `SIGNED_IN_HOME`,
 * so when the home flipped to `/start` on 2026-08-25 the fold quietly went with
 * it, and a person clicking **Runs** in the rail landed on the composer. A fold
 * that replaces two doors with a third is worse than the two.
 *
 * The two constants answer different questions. `SIGNED_IN_HOME` is "where does
 * a signed-in person land", and it must stay free to change. This route is
 * "where did this surface's content go", and that answer is permanent, because
 * the content is on the board.
 */

const SRC = readFileSync("src/routes/_authenticated.runs.index.tsx", "utf8");

describe("the fold opens the board", () => {
  it("redirects to /today by name", () => {
    expect(SRC).toContain('redirect({ to: "/today" })');
  });

  it("does NOT couple itself to the home constant", () => {
    /*
     * The CODE, not the prose. The comment above the route explains why the two
     * questions are different and names the constant to do it, so a bare string
     * search fails on the explanation rather than on the defect. The coupling is
     * an import and a redirect target; those are what must stay absent.
     */
    expect(SRC).not.toMatch(/import\s*\{[^}]*SIGNED_IN_HOME[^}]*\}/);
    expect(SRC).not.toMatch(/redirect\(\{\s*to:\s*SIGNED_IN_HOME/);
  });

  it("is still a redirect and renders no surface of its own", () => {
    expect(SRC).toContain("beforeLoad");
    expect(SRC).not.toContain("component:");
  });
});
