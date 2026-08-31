/**
 * AN EXEMPTION ONE SCREEN UP IS NOT REVERSED HERE — F-152, 2026-08-31.
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

import { resolveApprovalPolicy } from "./approval-policy";
import { MODE_RULED_ABOVE_WINS, resolveToolMode } from "./loop.server";

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

describe("F-152 · and the hole stays exactly one tool wide", () => {
  it("the set holds one entry, and adding a second needs its own founder ruling", () => {
    expect([...MODE_RULED_ABOVE_WINS]).toEqual(["studio.fix.commit"]);
  });

  it("THE GUARANTEE THAT SURVIVES: the decisive merge gate is not exempted", () => {
    /*
     * This is the whole reason the fix was safe to make. `studio.fix.commit`
     * appends to a branch whose PR a human opened; it is `studio.pr.merge` that
     * decides whether any of it lands, and that stays review-pinned however
     * trusted the arc gets. A person still decides the WHAT.
     */
    expect(MODE_RULED_ABOVE_WINS.has("studio.pr.merge")).toBe(false);
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
    expect(resolveApprovalPolicy({ tool: "delegate.openhands" }).decision).toBe("always-human");
  });
});
