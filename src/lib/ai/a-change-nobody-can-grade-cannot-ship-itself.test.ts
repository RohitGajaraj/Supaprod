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

describe("without the standing decision, nothing has changed", () => {
  /**
   * THE REGRESSION TEST FOR 21 OF 21 WORKSPACES. `autonomous_ship_enabled` is
   * `NOT NULL DEFAULT false` and no workspace has turned it on, so this is the
   * behaviour every real workspace gets today and must keep getting.
   */
  it.each(ARCS)("keeps release.publish pinned to review on the %s arc", (arc) => {
    expect(resolveToolMode("release.publish", "auto", arc, false, false)).toBe("review");
    expect(resolveToolMode("release.publish", "confirm", arc, true, false)).toBe("review");
  });

  it.each(ARCS)("keeps studio.revert pinned to review on the %s arc", (arc) => {
    expect(resolveToolMode("studio.revert", "auto", arc, true, false)).toBe("review");
  });

  /**
   * FAIL CLOSED WHEN THE CALLER DOES NOT KNOW. `crew.functions.ts` resolves what
   * a mode picker may offer and has no workspace in hand; it passes four
   * arguments. The default must be the floor, not the exemption — R-22, applied
   * to a parameter instead of a column.
   */
  it("omitting the argument entirely is the same as refusing it", () => {
    expect(resolveToolMode("release.publish", "auto", "trusted", true)).toBe(
      resolveToolMode("release.publish", "auto", "trusted", true, false),
    );
    expect(resolveToolMode("release.publish", "auto", "trusted", true)).toBe("review");
  });
});

describe("with the standing decision, the arc decides rather than a click", () => {
  /**
   * IT GRANTS ELIGIBILITY, NOT AUTONOMY, and that distinction is the reason it
   * lands on `resolveApprovalMode("confirm", arc)` — the same shape
   * `AUTO_SHIP_ENABLED` already uses for the merge, so there is one pattern here
   * and not two. A workspace early in its arc keeps a gate on the publish even
   * with the flag on, and earns its way off it like every other tool.
   */
  it("releases release.publish to the trust arc", () => {
    expect(resolveToolMode("release.publish", "auto", "trusted", false, true)).not.toBe("review");
    // "proving" is the arc where resolveApprovalMode leaves confirm as confirm,
    // so the standing decision visibly does NOT hand out `auto` on its own.
    expect(resolveToolMode("release.publish", "auto", "proving", false, true)).toBe("confirm");
  });

  /**
   * THE UNDO IS FREED WITH THE DO, and leaving it out would have built a trap.
   * `AUTO_SHIP_ENABLED` un-pins the merge and not the revert, so before this
   * ruling the product could merge to a default branch by itself and could not
   * roll back by itself — the undo gated harder than the do. When something goes
   * wrong the loop then cannot fix it and must page a person, which is the exact
   * failure the gate exists to prevent.
   */
  it("frees studio.revert on the same decision", () => {
    expect(resolveToolMode("studio.revert", "auto", "trusted", false, true)).not.toBe("review");
  });

  /**
   * THE DELIBERATE EXCLUSION, and it is the one that keeps this a ruling rather
   * than a blanket un-pinning. Handing work to a third-party agent is a
   * different act from deploying our own reviewed change: none of the four
   * preconditions says anything about what somebody else's agent will do, so the
   * standing decision cannot speak for it.
   */
  it.each(ARCS)("still refuses delegate.openhands on the %s arc", (arc) => {
    expect(resolveToolMode("delegate.openhands", "auto", arc, true, true)).toBe("review");
  });

  /**
   * The merge keeps its own switch. Two flags governing one tool would be two
   * places to look when somebody asks why a PR merged itself.
   */
  it("does not take over the merge gate, which has its own flag", () => {
    const withDecision = resolveToolMode("studio.pr.merge", "auto", "trusted", false, true);
    const withoutDecision = resolveToolMode("studio.pr.merge", "auto", "trusted", false, false);
    expect(withDecision).toBe(withoutDecision);
  });

  /**
   * A seeded `review` is sticky before this chain runs at all
   * (`resolveApprovalMode`), so the standing decision cannot reach past an
   * explicit per-tool review a person set.
   */
  it("cannot override a tool a person explicitly set to review", () => {
    expect(resolveToolMode("release.publish", "review", "trusted", true, true)).toBe("review");
  });
});
