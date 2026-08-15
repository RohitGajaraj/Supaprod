/**
 * A track member with no text must not push a spec out of the brief.
 *
 * THE DEFECT, at the station that writes the code. `HANDOFF_BODIES` is 2, and the
 * rule was `upstream.length - HANDOFF_BODIES`: it reserved the last two POSITIONS
 * whether or not the artifacts in them carried any text.
 *
 * Several kinds have no body column at all in `ARTIFACT_SOURCE` (chain.ts). A
 * `mission` is `{ table: "missions", title: "title" }` -- a container, no text. A
 * `deployment` is an address with a parent title. Both are legitimate members and
 * neither has anything to inline.
 *
 * `missionForTrack` files the mission as a track member AT BUILD. So from Build's
 * SECOND tick onward the newest two were the prototype and the mission, the mission
 * spent a body slot on nothing, and the SPEC dropped to a bare `prd "title" (id
 * ...)`. Build's first attempt saw the spec and every retry did not -- and the retry
 * is the attempt that needs it most, because the first one failed.
 *
 * The constant is called HANDOFF_BODIES. Counting bodies is what it always claimed
 * to do, and counting positions is what it did.
 *
 * FIXTURES HERE MATCH `ARTIFACT_SOURCE` RATHER THAN CONVENIENCE. A mission and a
 * deployment are constructed with `body: null` because that is what `loadUpstream`
 * can actually produce for them; a fixture that handed them text would be testing a
 * shape the schema cannot make.
 */
import { describe, expect, it } from "bun:test";

import { ARTIFACT_SOURCE } from "./chain";
import { describeUpstream, HANDOFF_BODIES, stationGoal, type UpstreamArtifact } from "./driver";

const art = (kind: string, title: string, body: string | null): UpstreamArtifact => ({
  kind,
  id: `${kind}-id`,
  title,
  body,
});

const SPEC_TEXT = "SUCCESS METRIC: cart completion up 4 points in 30 days.";
const track = { title: "Address re-confirm", origin: "Nine people lost a saved address." };

/** What Build's second tick sees: the mission it opened is now a member. */
function historyAtBuildRetry(): UpstreamArtifact[] {
  return [
    art("theme", "Saved address drops at checkout", "THEME BODY: nine reports."),
    art("decision", "Fix the address step", "DECISION BODY: rebuild the re-confirm step."),
    art("prd", "Address re-confirm", SPEC_TEXT),
    art("prototype", "Re-confirm screen", "PROTOTYPE BODY: two fields, one confirm."),
    // No body, and that is the schema, not a shortcut. See the file header.
    art("mission", "Address re-confirm", null),
  ];
}

describe("the kinds that genuinely have no text", () => {
  it("mission carries no body column, so it can never be inlined", () => {
    // If a body column is ever added to missions this test fails, which is the
    // moment to decide whether a mission's goal belongs in a brief.
    expect("body" in ARTIFACT_SOURCE.mission).toBe(false);
  });

  it("deployment carries no body column either", () => {
    expect("body" in ARTIFACT_SOURCE.deployment).toBe(false);
  });
});

describe("Build keeps the spec on its retry", () => {
  it("inlines the spec even though the mission is newer", () => {
    // THE DEFECT, stated exactly. Under the old rule the newest two were the
    // prototype and the mission, and this line was absent.
    const goal = stationGoal("build", track, historyAtBuildRetry());
    expect(goal).toContain(SPEC_TEXT);
  });

  it("still inlines the prototype, because it is real work and it is newest", () => {
    const goal = stationGoal("build", track, historyAtBuildRetry());
    expect(goal).toContain("PROTOTYPE BODY: two fields, one confirm.");
  });

  it("does not silently widen the brief past two bodies", () => {
    // The whole point of the constant is that a track round the loop several times
    // must not carry its entire history into every prompt. Two bodies, and the
    // oldest members still arrive named only.
    const goal = stationGoal("build", track, historyAtBuildRetry());
    expect(goal).not.toContain("THEME BODY: nine reports.");
    expect(goal).not.toContain("DECISION BODY: rebuild the re-confirm step.");
  });

  it("names the mission without pretending it had something to say", () => {
    // It is still a member and still worth naming: the head is how an agent knows a
    // mission exists at all. What it must not do is occupy a slot for text.
    const goal = stationGoal("build", track, historyAtBuildRetry());
    expect(goal).toContain('mission "Address re-confirm"');
  });
});

describe("the rule, stated directly", () => {
  it("counts bodies rather than trailing positions", () => {
    const out = describeUpstream([
      art("prd", "The spec", SPEC_TEXT),
      art("mission", "m", null),
      art("deployment", "d", null),
    ]);
    // Two bodyless members are newest. Under a position count the spec would be
    // named only; there is exactly one body available and it must be the spec's.
    expect(out).toContain(SPEC_TEXT);
  });

  it("hands over at most HANDOFF_BODIES bodies", () => {
    const out = describeUpstream([
      art("theme", "t", "BODY ONE"),
      art("decision", "d", "BODY TWO"),
      art("prd", "p", "BODY THREE"),
      art("changeset", "c", "BODY FOUR"),
    ]);
    const inlined = ["BODY ONE", "BODY TWO", "BODY THREE", "BODY FOUR"].filter((b) =>
      out.includes(b),
    );
    expect(inlined.length).toBe(HANDOFF_BODIES);
    // And they are the NEWEST two, because the freshest work is what a handoff is.
    expect(inlined).toEqual(["BODY THREE", "BODY FOUR"]);
  });

  it("says nothing at all about an empty record", () => {
    expect(describeUpstream([])).toBe("");
  });

  it("survives a record made entirely of bodyless members", () => {
    const out = describeUpstream([art("mission", "m", null), art("deployment", "d", null)]);
    expect(out).toContain('mission "m"');
    expect(out).toContain('deployment "d"');
  });
});
