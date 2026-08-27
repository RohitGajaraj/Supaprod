import { describe, expect, it } from "bun:test";

import { carriedByMission, oncePerId } from "@/components/spine/what-a-mission-carries";

/* The two shapes actually in `agent_messages`, and the kind that is not drawn. */
const missionSteer = { id: "s-mission", kind: "steer" };
const composerSteer = { id: "s-track", kind: "steer" };
const handoff = { id: "h-1", kind: "handoff" };
const kickoff = { id: "k-1", kind: "kickoff" };

describe("a steer is shown whichever way it was filed", () => {
  it("keeps a steer that arrived on a mission, which three of the four did", () => {
    expect(carriedByMission([handoff, missionSteer])).toEqual([handoff, missionSteer]);
  });

  it("still keeps handoffs, which was all it used to keep", () => {
    expect(carriedByMission([handoff])).toEqual([handoff]);
  });

  it("does not draw a kickoff, because the pane already shows its goal", () => {
    expect(carriedByMission([kickoff, handoff])).toEqual([handoff]);
  });

  it("draws nothing for a kind nobody has taught it", () => {
    /*
     * Seven message kinds are specified and three exist. An eighth arriving
     * must be a decision somebody makes here, not a row that appears in the
     * transcript because a filter was permissive.
     */
    expect(carriedByMission([{ id: "x", kind: "report" }])).toEqual([]);
  });

  it("shows a person's sentence once when both reads find it", () => {
    const both = oncePerId([missionSteer, handoff, missionSteer]);
    expect(both).toHaveLength(2);
    expect(both.map((m) => m.id)).toEqual(["s-mission", "h-1"]);
  });

  it("keeps two genuinely different steers apart", () => {
    expect(oncePerId([missionSteer, composerSteer])).toHaveLength(2);
  });
});
