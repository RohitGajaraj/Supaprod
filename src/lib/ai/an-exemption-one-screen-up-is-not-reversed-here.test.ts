/**
 * AN EXEMPTION ONE SCREEN UP IS NOT REVERSED HERE — F-152, 2026-08-31,
 * AND AGAIN ON ITS SIBLING `studio.commit` — R-30, 2026-09-03.
 *
 * ── THE DEFECT ─────────────────────────────────────────────────────────────
 * Two subsystems disagreed about `studio.fix.commit`, and neither was wrong on
 * its own terms:
 *
 *   `resolveToolMode` (loop.server.ts:309, shipped 07-07) carries a branch
 *   written FOR this tool, whose comment says the generic high-risk floor
 *   "would park the autonomous fix loop at a gate every iteration".  -> auto
 *
 *   `axisDefault` (approval-policy.ts) reads its axes — external, partially
 *   reversible — and returns `always-human`, which the tightening at
 *   loop.server.ts:1972 then let win.                                -> review
 *
 * So the exemption written specifically to stop the stall was reversed one
 * screen later, and the fix loop parked at a gate every iteration exactly as
 * the 07-07 comment predicted. Measured 2026-08-31: two `studio.fix.commit`
 * approvals raised three minutes apart (09:29:48 and 09:32:41 UTC), both
 * pending — and those two are the ONLY ones in the tool's entire history.
 *
 * Nothing was learned to cause it. `resolveApprovalPolicy` returns its axis
 * base when there is no record, so "nobody has ruled on this" produced the
 * strictest available answer, arriving through a line whose own comment reads
 * "the record can tighten an auto call".
 *
 * ── WHY THIS FILE EXISTS RATHER THAN A COMMENT ─────────────────────────────
 * The fix puts the first hole in "the record can only tighten", which is an
 * invariant worth more than any second tool would be. These tests are what
 * keeps the hole one tool wide, and what will TELL somebody if the collision
 * ever stops being real — reclassify the axis and test 1 fails, which is the
 * signal to delete the exemption rather than carry a dead one.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

import { resolveApprovalPolicy } from "./approval-policy";
import { MODE_RULED_ABOVE_WINS, RULED_AUTO_STAYS_AUTO, resolveToolMode } from "./loop.server";

describe("F-152 · the collision the exemption exists for", () => {
  it("1. the axis default really does say always-human for studio.fix.commit", () => {
    /*
     * If this ever fails, the axes were reclassified and the exemption below is
     * dead weight — DELETE IT rather than leaving a hole nothing needs. That is
     * option (b) from the 2026-08-31 ruling, taken later.
     */
    expect(resolveApprovalPolicy({ tool: "studio.fix.commit" }).decision).toBe("always-human");
  });

  it("2. and the mode ruled one screen up really does say auto, so the exemption is load-bearing", () => {
    expect(resolveToolMode("studio.fix.commit", "auto", "trusted", false)).toBe("auto");
  });

  it("3. so the tool is named in the set the tightening honours", () => {
    expect(MODE_RULED_ABOVE_WINS.has("studio.fix.commit")).toBe(true);
  });
});

/**
 * ── IT HAPPENED AGAIN, ON THE SIBLING TOOL, THREE DAYS LATER ───────────────
 *
 * R-30 seeded `studio.commit` to `auto` on 2026-09-02. On 2026-09-03 at 19:50
 * UTC the sweep drove track `2fdf93b6` to Build with nobody pressing anything
 * and stopped at a `studio.commit` gate -- the gate R-30 had removed.
 *
 * The same collision, tool for tool: the seed says auto, `axisDefault` reads
 * external + partially-reversible as always-human, and the tightening let the
 * axis win. `defaults.test.ts` could not see it because the seed was never
 * wrong; the reversal is two subsystems away at call time.
 *
 * ── AND THE FIRST FIX WENT IN THE WRONG SET ────────────────────────────────
 * Adding `studio.commit` to `MODE_RULED_ABOVE_WINS` fixed the stall and broke
 * something else, which `resolve-tool-mode.test.ts` caught: that set is read
 * inside an `else if` chain in `resolveToolMode`, so joining it short-circuits
 * the later one-motion-consent branch that lifts a confirm-seeded
 * `studio.commit` to auto once a contract is approved.
 *
 * So there are two sets now, and the difference is the lesson:
 *
 *   MODE_RULED_ABOVE_WINS   run at the SEEDED mode, skipping the risk floors
 *   RULED_AUTO_STAYS_AUTO   the approval RECORD does not tighten an auto that
 *                           `resolveToolMode` already returned
 *
 * `studio.commit` needed the second. Its seed was never the problem.
 */
describe("R-30 · the same collision on studio.commit", () => {
  it("1. its axis default says always-human too, so the collision is real", () => {
    // Asserted, not changed. A commit IS external and partially reversible;
    // softening the axes to get a different answer downstream would make the
    // consequence model lie about the tool.
    expect(resolveApprovalPolicy({ tool: "studio.commit" }).decision).toBe("always-human");
  });

  it("2. and R-30's seed really does resolve to auto, so the exemption is load-bearing", () => {
    expect(resolveToolMode("studio.commit", "auto", "trusted", false)).toBe("auto");
  });

  it("3. so the record no longer tightens it back to a gate", () => {
    expect(RULED_AUTO_STAYS_AUTO.has("studio.commit")).toBe(true);
  });

  it("4. but its SEED is untouched, which is where the first fix went wrong", () => {
    expect(MODE_RULED_ABOVE_WINS.has("studio.commit")).toBe(false);
    // The one-motion consent, still reachable. The first fix had removed it.
    expect(resolveToolMode("studio.commit", "confirm", "proving", true)).toBe("auto");
  });
});

describe("F-152 · and the hole stays exactly as wide as it was ruled", () => {
  it("the seed-level set still holds one entry, and a second needs its own ruling", () => {
    expect([...MODE_RULED_ABOVE_WINS]).toEqual(["studio.fix.commit"]);
  });

  it("the tightening exemption holds two, both named in this file with a ruling", () => {
    // Not a count for its own sake. This set is the hole in "the record can only
    // tighten"; a member arriving without a ruling is the failure it guards
    // against, and adding one means editing this file and saying why.
    expect([...RULED_AUTO_STAYS_AUTO].sort()).toEqual(["studio.commit", "studio.fix.commit"]);
  });

  it("THE GUARANTEE THAT SURVIVES: the decisive merge gate is not exempted", () => {
    /*
     * This is the whole reason both fixes were safe to make. `studio.fix.commit`
     * appends to a branch whose PR a human opened and `studio.commit` writes to
     * an unmerged branch; it is `studio.pr.merge` that decides whether any of it
     * lands, and that stays review-pinned however trusted the arc gets. A person
     * still decides the WHAT.
     */
    expect(MODE_RULED_ABOVE_WINS.has("studio.pr.merge")).toBe(false);
    expect(RULED_AUTO_STAYS_AUTO.has("studio.pr.merge")).toBe(false);
    expect(resolveToolMode("studio.pr.merge", "auto", "trusted", false)).toBe("review");
    expect(resolveToolMode("studio.pr.merge", "confirm", "ambient", true)).toBe("review");
  });

  it("and a tool nobody exempted is still tightened by its axis default", () => {
    /*
     * `delegate.openhands` is the honest control here, and picking it took a
     * failed assertion: `calendar.create` reads as always-human from its refusal
     * record (0 approved / 7 rejected) but its AXIS default is `earn-it`, because
     * it reaches outside the workspace and is fully reversible. The two are
     * different claims and only the axis one is what this file is about.
     */
    expect(MODE_RULED_ABOVE_WINS.has("delegate.openhands")).toBe(false);
    expect(RULED_AUTO_STAYS_AUTO.has("delegate.openhands")).toBe(false);
    expect(resolveApprovalPolicy({ tool: "delegate.openhands" }).decision).toBe("always-human");
  });

  it("and the call site still reads the set, so these assertions are not decorative", () => {
    /*
     * Everything above tests the SETS. This tests that the branch consulting
     * them is still there -- without it, both sets could be perfect and the
     * tightening could have been rewritten to ignore them entirely.
     */
    const src = readFileSync("src/lib/ai/loop.server.ts", "utf8").replace(/\s+/g, " ");
    expect(src).toContain('policy.decision === "always-human" && mode === "auto" &&');
    expect(src).toContain("!RULED_AUTO_STAYS_AUTO.has(call.name)");
  });
});
