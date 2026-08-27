/**
 * Learn must be shown the spec it is grading against.
 *
 * THE DEFECT, AND IT IS THE ONE driver.ts ALREADY CLAIMED TO HAVE FIXED.
 * `describeUpstream`'s header says the old failure was that "Design never saw the
 * spec, Build never saw the design, and Learn was asked to 'compare against what
 * the spec said' while never being shown the spec", and that the handoff ended it.
 *
 * It did not end it at Learn. `HANDOFF_BODIES` is 2 and is counted FROM THE END, so
 * the two newest artifacts arrive whole and everything older arrives as a bare
 * `kind "title" (id ...)`. By the time a track reaches Learn the record holds the
 * cluster, the decision, the spec, the prototype, the changeset and the deployment.
 * The two newest are the changeset and the deployment. The spec, which is the only
 * thing Learn can grade against, was pushed out by a constant.
 *
 * "Counted from the end" is correct for a HANDOFF and wrong for a YARDSTICK. At
 * Build the two newest are the spec and the prototype, which is exactly right. At
 * Learn the measure is four artifacts back, and a measure is not stale context.
 *
 * The other half of this file guards the reason the constant exists: a track that
 * has been round the loop several times must not carry its entire history into
 * every prompt, and the fix must not quietly become "inline everything".
 */
import { describe, expect, it } from "bun:test";

import { describeUpstream, stationGoal, HANDOFF_BODIES, type UpstreamArtifact } from "./driver";

const artifact = (kind: string, title: string, body: string | null): UpstreamArtifact => ({
  kind,
  id: `${kind}-id`,
  title,
  body,
});

/** What the record holds by the time a track reaches Learn, oldest first. */
function historyAtLearn(): UpstreamArtifact[] {
  return [
    // The body is deliberately NOT the track's origin sentence. The origin is
    // interpolated into the goal separately, so a fixture that reused it would let
    // that line satisfy the assertion below and the test would prove nothing.
    artifact("theme", "Saved address drops at checkout", "THEME BODY: nine reports, four sources."),
    artifact("decision", "Fix the address step", "We will rebuild the re-confirm step."),
    artifact(
      "prd",
      "Address re-confirm",
      "SUCCESS METRIC: cart completion up 4 points in 30 days.",
    ),
    artifact("prototype", "Re-confirm screen", "Two fields, one confirm."),
    artifact("changeset", "address-reconfirm", "Rewrote the address form."),
    artifact("deployment", "v41", "Live at app.example.com."),
  ];
}

const track = { title: "Address re-confirm", origin: "Nine people lost a saved address." };

describe("the spec reaches Learn whole", () => {
  it("carries the spec's own words, not just its id", () => {
    // THE ASSERTION THAT WAS FAILING IN PRODUCTION LOGIC. Without the yardstick rule
    // this line is absent and Learn is grading against a title.
    const goal = stationGoal("learn", track, historyAtLearn());
    expect(goal).toContain("SUCCESS METRIC: cart completion up 4 points in 30 days.");
  });

  it("still carries what shipped, because that is the other half of the comparison", () => {
    const goal = stationGoal("learn", track, historyAtLearn());
    expect(goal).toContain("Live at app.example.com.");
    expect(goal).toContain("Rewrote the address form.");
  });

  it("does not start inlining everything to get there", () => {
    /*
     * The constant exists for a reason and this still guards it: the cluster and
     * the prototype are neither a yardstick nor one of the newest two, and must
     * arrive named only, or this has become "send the whole history" and the
     * prompt grows with every lap.
     *
     * THE DECISION MOVED OUT OF THIS LIST 2026-08-27, and that is the fix rather
     * than a loosening. It used to be here as one of "the oldest two", stale
     * context by position. It is not stale: it carries the FORECAST, and a
     * verdict at Learn settles that forecast. S4 measured what its absence cost —
     * 18 of 18 runs by the two grading seats had no forecast anywhere in their
     * input, so no verdict this product has written was ever measured against a
     * prediction.
     *
     * One artifact moved from "stale context" to "yardstick". The budget is
     * otherwise untouched, and the two assertions below still hold it.
     */
    const goal = stationGoal("learn", track, historyAtLearn());
    expect(goal).not.toContain("THEME BODY: nine reports, four sources.");
    expect(goal).not.toContain("Two fields, one confirm.");
  });

  it("but the decision DOES arrive whole, because the forecast is the measure", () => {
    const goal = stationGoal("learn", track, historyAtLearn());
    expect(goal).toContain("We will rebuild the re-confirm step.");
  });

  it("inlines the newest spec only, when a track has been round the loop", () => {
    // A reworked track carries several specs. Inlining all of them would put a
    // superseded document in the same prompt as the one that replaced it and let
    // the older one contradict the newer.
    const history = [
      artifact("prd", "Address re-confirm v1", "OLD METRIC: nobody measured this."),
      artifact("prd", "Address re-confirm v2", "NEW METRIC: cart completion up 4 points."),
      artifact("changeset", "address-reconfirm", "Rewrote the address form."),
      artifact("deployment", "v41", "Live at app.example.com."),
    ];
    const goal = stationGoal("learn", track, history);
    expect(goal).toContain("NEW METRIC: cart completion up 4 points.");
    expect(goal).not.toContain("OLD METRIC: nobody measured this.");
  });
});

describe("no other station's brief changes", () => {
  it("leaves Build with the two newest, which are already the right two", () => {
    // Design runs after Plan, so at Build the spec and the prototype ARE the newest
    // two. The two-newest rule was never wrong here, and a yardstick rule applied
    // everywhere would have been a change with no defect behind it.
    const upToBuild = historyAtLearn().slice(0, 4);
    const goal = stationGoal("build", track, upToBuild);
    expect(goal).toContain("SUCCESS METRIC: cart completion up 4 points in 30 days.");
    expect(goal).toContain("Two fields, one confirm.");
    expect(goal).not.toContain("We will rebuild the re-confirm step.");
  });

  it("leaves Ship exactly as it was", () => {
    // Ship's newest two are the prototype and the changeset. It has no yardstick and
    // must not acquire one.
    const upToShip = historyAtLearn().slice(0, 5);
    const goal = stationGoal("ship", track, upToShip);
    expect(goal).not.toContain("SUCCESS METRIC");
  });
});

describe("describeUpstream's own contract", () => {
  it("inlines the two newest with no yardstick asked for", () => {
    const out = describeUpstream(historyAtLearn());
    expect(out).toContain("Live at app.example.com.");
    expect(out).not.toContain("SUCCESS METRIC");
  });

  it("keeps the constant at two, so the yardstick is an addition and not a raise", () => {
    // If someone "fixes" this by raising HANDOFF_BODIES instead, every station's
    // prompt grows and this test says so.
    expect(HANDOFF_BODIES).toBe(2);
  });

  it("ignores a yardstick kind the record does not hold", () => {
    const out = describeUpstream([artifact("changeset", "c", "body")], ["prd"]);
    expect(out).toContain("body");
  });

  it("ignores a yardstick whose body is empty rather than inlining a heading twice", () => {
    const out = describeUpstream(
      [artifact("prd", "Empty spec", ""), artifact("changeset", "c", "shipped it")],
      ["prd"],
    );
    expect(out).toContain("shipped it");
    expect(out).toContain('prd "Empty spec"');
  });

  it("does not duplicate a yardstick that is already one of the newest two", () => {
    const history = [
      artifact("prd", "The spec", "THE MEASURE"),
      artifact("changeset", "c", "did it"),
    ];
    const out = describeUpstream(history, ["prd"]);
    expect(out.split("THE MEASURE").length - 1).toBe(1);
  });
});
