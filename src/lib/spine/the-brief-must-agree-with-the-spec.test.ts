/**
 * A station briefed on the opening sentence, against a spec that says otherwise,
 * refuses — and it is right to.
 *
 * MEASURED LIVE 2026-08-25 02:30 on track `897d1834`, with nothing arranged:
 *
 *   Decide  deferred "Add dark mode and a system-preference theme" pending
 *           telemetry, and recorded a forecast for it.
 *   Plan    honoured that and specced THE TELEMETRY WORK, marking
 *           "Dark Mode UI development" explicitly out of scope.
 *   Design  was told "Design the surface for 'Add dark mode and a
 *           system-preference theme'" and BOTH SEATS REFUSED:
 *             ux-architect  "I cannot design the dark mode surface at this time…
 *                            The PRD confirms this: its 'Out of Scope' section
 *                            states 'Dark Mode UI development'."
 *             design-critic "No surface design exists — and none should."
 *
 * The run held `produced-nothing` at four of seven stations with **nothing wrong
 * anywhere except the sentence at the top of the brief**. The agents had the
 * spec — `describeUpstream` inlines the two newest bodies — read that it
 * contradicted their instruction, and declined to invent.
 *
 * Re-scoping is a NORMAL outcome of deciding, so this was never an edge case; it
 * is what happens whenever Decide says "not that, this first".
 */
import { describe, expect, it } from "bun:test";

import { newestSpecTitle, stationGoal, stationSubject, type UpstreamArtifact } from "./driver";

const TRACK = {
  title: "Add dark mode and a system-preference theme",
  origin: "A customer asked for it in Canny on 2026-07-09.",
};

const SPEC: UpstreamArtifact = {
  kind: "prd",
  id: "bf198482-9d57-421b-8ae2-d6f35a6c81ad",
  title: "Restore Canny telemetry readiness",
  body: "Out of Scope: Dark Mode UI development.",
};

describe("the spec becomes the subject once one exists", () => {
  it("uses the spec's title, not the track's, when they differ", () => {
    const { subject } = stationSubject(TRACK, [SPEC]);
    expect(subject).toContain("Restore Canny telemetry readiness");
    expect(subject).not.toContain("Add dark mode");
  });

  /**
   * The opening sentence is what a person recognises their own work by, so it is
   * KEPT and NAMED rather than silently replaced. Renaming the track would lose
   * the thread from the thing they asked for to the thing being built (F-27).
   */
  it("keeps the original sentence and says which one governs", () => {
    const { note } = stationSubject(TRACK, [SPEC]);
    expect(note).toContain("Add dark mode and a system-preference theme");
    expect(note).toContain("Work to the spec");
  });

  /**
   * The instruction the two refusing seats needed and did not have: that finding
   * part of the original request out of scope is the ANSWER, not a reason to
   * down tools.
   */
  it("tells the station that an out-of-scope part is an answer, not a refusal", () => {
    const { note } = stationSubject(TRACK, [SPEC]);
    expect(note).toContain("out of scope here too");
    expect(note).toContain("right answer rather than a refusal");
  });

  it("carries the origin either way, because why it exists never changes", () => {
    expect(stationSubject(TRACK, [SPEC]).subject).toContain("Canny on 2026-07-09");
    expect(stationSubject(TRACK, []).subject).toContain("Canny on 2026-07-09");
  });
});

describe("it falls back to the title whenever there is no spec to follow", () => {
  it("uses the track title before Plan has filed anything", () => {
    const { subject, note } = stationSubject(TRACK, []);
    expect(subject).toContain("Add dark mode and a system-preference theme");
    expect(note).toBe("");
  });

  it("ignores upstream that is not a spec", () => {
    const signal: UpstreamArtifact = { kind: "signal", id: "s1", title: "Add Dark Mode", body: "" };
    expect(stationSubject(TRACK, [signal]).note).toBe("");
  });

  /**
   * A spec that says the same thing is NOT a re-scope, and adding the note there
   * would put a contradiction warning on a track that has none — noise that
   * teaches an agent to ignore the line that matters.
   */
  it("says nothing when the spec agrees with the title", () => {
    const same: UpstreamArtifact = {
      ...SPEC,
      title: "Add dark mode and a system-preference theme!",
    };
    expect(stationSubject(TRACK, [same]).note).toBe("");
  });

  it("treats punctuation and case alone as the same work", () => {
    const same: UpstreamArtifact = {
      ...SPEC,
      title: "ADD DARK MODE, AND A SYSTEM PREFERENCE THEME",
    };
    expect(stationSubject(TRACK, [same]).note).toBe("");
  });

  it("takes the NEWEST spec when a track has been round the loop", () => {
    const older: UpstreamArtifact = { ...SPEC, id: "old", title: "An earlier spec" };
    expect(newestSpecTitle([older, SPEC])).toBe("Restore Canny telemetry readiness");
  });

  it("ignores a spec with no usable title", () => {
    expect(newestSpecTitle([{ ...SPEC, title: "   " }])).toBeNull();
  });
});

describe("the station's own job now names the right work", () => {
  /** The exact instruction that stopped the live run, now correct. */
  it("asks Design for the surface of the SPEC", () => {
    const goal = stationGoal("design", TRACK, [SPEC]);
    expect(goal).toContain("Design the surface for");
    expect(goal).toContain("Restore Canny telemetry readiness");
    expect(goal).toContain("Work to the spec");
  });

  it("still asks Discover about the original sentence, which is all it has", () => {
    const goal = stationGoal("sense", TRACK, []);
    expect(goal).toContain("Add dark mode and a system-preference theme");
    expect(goal).not.toContain("Work to the spec");
  });

  /** The filing instruction is untouched: this changes the subject, not the job. */
  it("does not disturb what the station must file", () => {
    expect(stationGoal("design", TRACK, [SPEC])).toContain("design.draft");
  });
});
