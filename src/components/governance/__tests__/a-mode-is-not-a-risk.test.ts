/**
 * THE APPROVALS QUEUE CALLED A SUPERVISION SETTING A RISK.
 *
 * `listGovernApprovals` built its `risk` field by relabelling the effective
 * mode -- review high, auto low, everything else medium -- and ApprovalsPanel
 * renders that as both a chip ("High risk") and a consequence line from
 * RISK_NOTE ("Hard to walk back", "Stays in this workspace, and you can undo
 * it"). How closely a person decided to WATCH a tool is not how hard it is to
 * UNDO, and printing one as the other on the screen where approvals are decided
 * is the worst place in the product to be wrong about it.
 *
 * Measured across the 74 registered tools: 23 got the wrong word and 14 of them
 * were UNDERSTATED. studio.commit, studio.pr.merge, studio.revert,
 * release.publish and agent.spawn all seed to `confirm`, so all five printed
 * "medium: Reaches outside, and it can be walked back" beside an irreversible
 * act.
 */
import { describe, it, expect } from "bun:test";
import { toolRisk } from "@/lib/tool-consequences";
import { RISK_NOTE } from "@/components/governance/governance-shared";

/** Exactly what the queue used to do, quoted so this test states the defect. */
const asMode = (mode: string) => (mode === "review" ? "high" : mode === "auto" ? "low" : "medium");

describe("a mode is not a risk", () => {
  it("the five that mattered most were all called walk-back-able", () => {
    for (const tool of [
      "studio.commit",
      "studio.pr.merge",
      "studio.revert",
      "release.publish",
      "agent.spawn",
    ]) {
      // Each seeds to `confirm`, which the old map turned into "medium".
      expect(asMode("confirm")).toBe("medium");
      expect(RISK_NOTE.medium).toContain("walked back");
      // And each is actually hard to walk back.
      expect(toolRisk(tool), `${tool} is not high`).toBe("high");
      expect(RISK_NOTE.high).toBe("Hard to walk back.");
    }
  });

  it("a tool nobody catalogued warns rather than reassures", () => {
    // The old default was a literal "medium" fallback. toolRisk fails closed.
    expect(toolRisk("something.added.tomorrow")).toBe("high");
  });

  it("the two answers are genuinely different, so this was never cosmetic", () => {
    const differ = ["studio.commit", "release.publish", "notes.create"].filter(
      (t) => toolRisk(t) !== asMode("confirm"),
    );
    expect(differ.length).toBe(3);
  });
});
