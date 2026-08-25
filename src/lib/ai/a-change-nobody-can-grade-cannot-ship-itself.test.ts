/**
 * R-27. The production deploy is gated by PROOF, not by a click.
 *
 * `release.publish` sat in `HIGH_RISK_FORCE_REVIEW` and `resolveToolMode`
 * returned `"review"` for it unconditionally, so Ship queued an approval and the
 * track held `waiting-on-a-person`. The founder's stated reason was that it is
 * *"the only gate in the seven-station loop, which is what makes the autonomy of
 * the other six defensible instead of reckless."*
 *
 * WHAT THAT GATE IS WORTH, MEASURED. `SELECT status, count(*) FROM
 * agent_approvals WHERE tool_name='cluster.trigger'` -> 42 cancelled, 38
 * expired, 10 pending, **0 approved** (R-04). Ninety questions raised since July
 * and not one answered. A gate nobody answers is a stall wearing governance as a
 * costume.
 *
 * AND THE PRECEDENT IS THE FOUNDER'S OWN. `studio.pr.merge` already runs
 * unattended under `AUTO_SHIP_ENABLED` (`STUDIO_AUTO_SHIP=1`, live), after an
 * in-tool CI-green check read fresh at the head sha. `release.publish` has to
 * prove strictly MORE than that — merged, plus a live preview at the same commit
 * — and it was the one waiting for a person. The act with weaker proof ran; the
 * act with stronger proof waited.
 *
 * This file guards the ruling in the direction it can go wrong: LOOSENING. The
 * standing decision is worth exactly what it refuses to cover.
 */
import { describe, it, expect } from "bun:test";

import { resolveToolMode } from "./loop.server";

const ARCS = ["proving", "ambient", "trusted"] as const;

describe("the ship pair is live at platform level, and the arc sets the pace", () => {
  /**
   * REVISED THE DAY IT SHIPPED, on the founder's instruction: *"Whatever features
   * we are building should be live at a platform level, no matter whether a new
   * user onboards tomorrow or a new workspace gets created."*
   *
   * The first version of R-27 gated these behind `workspaces.autonomous_ship_enabled`,
   * default false. Measured two hours later: **false in 21 of 21 workspaces, one
   * enablement — a hand-written UPDATE by MAIN — and no surface in the product
   * that could ever set it.** That is R-22's own defect (*"a decision nobody had
   * made and no surface in the product can make"*) and R-23's (*"a function that
   * lands without a door is not finished"*), and this time it was self-inflicted.
   *
   * **What replaces it is not "on for everyone".** The gate is the PROOF and the
   * pace is the ARC.
   */
  it("does not hand out `auto` on its own — a new workspace starts gated", () => {
    // "proving" is the arc where resolveApprovalMode leaves confirm as confirm,
    // so this is exactly what a workspace created tomorrow gets.
    expect(resolveToolMode("release.publish", "auto", "proving", false)).toBe("confirm");
    expect(resolveToolMode("studio.revert", "auto", "proving", false)).toBe("confirm");
  });

  it("releases the pair to the trust ramp once an arc has been earned", () => {
    expect(resolveToolMode("release.publish", "auto", "trusted", false)).not.toBe("review");
    expect(resolveToolMode("studio.revert", "auto", "trusted", false)).not.toBe("review");
  });

  /**
   * NO FIFTH ARGUMENT. The signature must not grow a per-workspace escape hatch
   * back: that is the shape that shipped off in 21 of 21 and reachable only by
   * SQL, and a test is the cheapest way to stop it returning.
   */
  it("takes no per-workspace flag", () => {
    expect(resolveToolMode.length).toBe(4);
  });

  /**
   * THE DELIBERATE EXCLUSION, and the one that keeps this a ruling rather than a
   * blanket un-pinning. Handing work to a third-party agent is a different act
   * from deploying our own reviewed change: none of the four preconditions says
   * anything about what somebody else's agent will do.
   */
  it.each(ARCS)("still refuses delegate.openhands on the %s arc", (arc) => {
    expect(resolveToolMode("delegate.openhands", "auto", arc, true)).toBe("review");
  });

  /**
   * A seeded `review` is sticky before this chain runs at all, so nothing here
   * can reach past an explicit per-tool review a person set. This is the
   * assertion that caught my own loosening the first time: both branches were
   * substituting the released mode for the dialed one outright, so a tool
   * somebody had pinned came back `auto` on a trusted arc.
   */
  it("cannot override a tool a person explicitly set to review", () => {
    expect(resolveToolMode("release.publish", "review", "trusted", true)).toBe("review");
  });

  it("does not take over the merge gate, which has its own switch", () => {
    expect(resolveToolMode("studio.pr.merge", "auto", "trusted", false)).toBe(
      resolveToolMode("studio.pr.merge", "auto", "trusted", true),
    );
  });
});
