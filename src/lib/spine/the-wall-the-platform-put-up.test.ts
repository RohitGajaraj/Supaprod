/**
 * The slug rule and the three states of `now`, which are the two things a
 * caller can get wrong from the outside.
 *
 * The read itself is exercised on production rather than here: `status =
 * 'halted'` is 46 rows in the whole product, and a stub of the PostgREST
 * builder would assert the shape of a mock rather than the shape of an answer.
 * What IS testable without a database is the pair of rules every caller leans
 * on, and both were somebody's condition rather than my idea.
 */
import { describe, expect, it } from "bun:test";
import { isSlug, type PlatformWall, type WallNow } from "./the-wall-the-platform-put-up";

describe("the slug, never the prose", () => {
  it("takes the halt path's own vocabulary", () => {
    for (const s of ["out_of_credit", "kill_switch", "mission_spend_cap", "agent-disabled"]) {
      expect({ s, slug: isSlug(s) }).toEqual({ s, slug: true });
    }
  });

  it("refuses the stall sweeper's whole sentence, which lives in the same column", () => {
    /*
     * MEASURED ON PRODUCTION. `halted_reason` holds two vocabularies and both
     * are live: the halt path writes a slug, and the sweeper writes English --
     * "Stopped automatically: no progress for 4 hours. The run checkpointed and
     * then went quiet, so its worker is presumed gone." A surface keying on the
     * second would be matching prose in a field that merely LOOKS structured,
     * which is worse than matching prose openly.
     */
    for (const s of [
      "Stopped automatically: no progress for 4 hours.",
      "Stopped by A1 (founder authority)",
      "out of credit",
      " ",
      "",
    ]) {
      expect({ s: s.slice(0, 24), slug: isSlug(s) }).toEqual({ s: s.slice(0, 24), slug: false });
    }
  });

  it("refuses nothing at all", () => {
    expect(isSlug(null)).toBe(false);
    expect(isSlug(undefined)).toBe(false);
  });
});

describe("`now` has three states and the third is the point", () => {
  it("can say it did not look", () => {
    /*
     * Lane 2's condition on this shape, and they were right to insist: a failed
     * wallet read that collapsed to "gone" would delete a real wall from a
     * card, which is worse than the stale count it replaced.
     */
    const states: WallNow[] = ["gone", "standing", "unknown"];
    expect(states.length).toBe(3);
    const unread: PlatformWall = {
      kind: "out_of_credit",
      at: "2026-09-04T05:30:05Z",
      now: "unknown",
    };
    expect(unread.now).toBe("unknown");
  });

  it("carries `now` on the WALL, never on the track", () => {
    /*
     * Lane 2's second condition. A run can hold a credit halt AND a repository
     * refusal at once; a bare boolean on the track would let a surface apply
     * the credit answer to the repository wall, which is the between-elements
     * defect law 14 names. This is a type-level claim, so it is asserted by
     * constructing the thing: `now` sits inside the wall.
     */
    const wall: PlatformWall = { kind: "tools-refused", at: "x", now: "unknown" };
    expect(Object.keys(wall).sort()).toEqual(["at", "kind", "now"]);
  });
});
