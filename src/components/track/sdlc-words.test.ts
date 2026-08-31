import { describe, it, expect } from "bun:test";
import { oneVocabulary, sdlcWordsFor, stationsForArtifact, UNCOVERED_STAGE } from "./sdlc-words";
import { AGENT_STATIONS, AGENT_STATION_ORDER } from "@/lib/agent-vocabulary";

describe("the word that means two different stations", () => {
  it("keeps their Plan and our Plan apart, which is the whole risk", () => {
    /*
     * THE TRAP THIS MODULE EXISTS FOR. "Plan" is a word in both vocabularies
     * and it names different stations:
     *   their Plan (stage 1, intent.md) == our Decide
     *   our Plan   (`define`)           == their Design
     * A careless switch leaves one word meaning two things, which is F-150's
     * defect at vocabulary scale.
     */
    expect(sdlcWordsFor("decide")?.stage).toBe("Plan");
    expect(AGENT_STATIONS.decide.name).toBe("Decide");

    expect(AGENT_STATIONS.define.name).toBe("Plan");
    expect(sdlcWordsFor("define")?.stage).toBe("Design");

    // Stated as one assertion so the collision is visible in the failure.
    expect({
      ourPlanIsTheirs: sdlcWordsFor("define")?.stage,
      theirPlanIsOurs: AGENT_STATIONS.decide.name,
    }).toEqual({ ourPlanIsTheirs: "Design", theirPlanIsOurs: "Decide" });
  });

  it("answers 'where is my spec.md' with every station that writes one", () => {
    // §STATIONS names this exact question as what the translation is for. Two
    // of ours collapse into their Design, so the answer is a list, not a row.
    expect(stationsForArtifact("spec.md")).toEqual(["define", "design"]);
    expect(stationsForArtifact("intent.md")).toEqual(["decide"]);
    expect(stationsForArtifact("plan.md")).toEqual(["build"]);
    expect(stationsForArtifact("REVIEW.md")).toEqual(["ship"]);
    // Case and padding are a reader's typing, not a different question.
    expect(stationsForArtifact("  Spec.MD ")).toEqual(["define", "design"]);
    expect(stationsForArtifact("nothing.md")).toEqual([]);
  });
});

describe("the two gaps that are not allowed to go quiet", () => {
  it("gives Discover no borrowed word, because their playbook has none", () => {
    /*
     * §2: "Their Stage 1 starts with a person who already knows the problem.
     * Discover has no counterpart in their playbook at all. That is ours, it is
     * the harder half, and it stays." So it borrows nothing.
     */
    expect(sdlcWordsFor("sense")).toBeNull();
    const theirs = oneVocabulary("theirs");
    const discover = theirs.find((r) => r.station === "sense");
    // Still labelled — a blank row would be worse — but flagged as ours.
    expect(discover).toEqual({ station: "sense", label: "Discover", borrowed: false });
  });

  it("names their Test stage as uncovered rather than skipping it", () => {
    /*
     * F-148: `verifyStationOutput` compiles nothing and executes nothing, and
     * at Build it asks for artifact kind `mission` which the driver writes
     * before any seat runs, so Build's self-check cannot fail. A filing check
     * is not a verification check. A six-stage list rendered as five is a claim
     * that the sixth did not exist.
     */
    expect(UNCOVERED_STAGE.stage).toBe("Test");
    expect(UNCOVERED_STAGE.because).toContain("do not cover this stage yet");
    // And no station of ours claims it.
    for (const s of AGENT_STATION_ORDER) {
      expect(sdlcWordsFor(s)?.stage).not.toBe("Test");
    }
  });
});

describe("one vocabulary at a time, never both", () => {
  it("returns our seven, in route order, unchanged", () => {
    const ours = oneVocabulary("ours");
    expect(ours.map((r) => r.station)).toEqual(AGENT_STATION_ORDER);
    expect(ours.map((r) => r.label)).toEqual(
      AGENT_STATION_ORDER.map((s) => AGENT_STATIONS[s].name),
    );
    expect(ours.every((r) => r.borrowed)).toBe(true);
  });

  it("returns theirs for the six they name, and flags the one they do not", () => {
    const theirs = oneVocabulary("theirs");
    expect(theirs.map((r) => r.label)).toEqual([
      "Discover", // ours: they have no counterpart
      "Plan",
      "Design",
      "Design",
      "Build",
      "Deploy",
      "Maintain",
    ]);
    // Exactly one row is showing a word from the other vocabulary, and it says so.
    expect(theirs.filter((r) => !r.borrowed).map((r) => r.station)).toEqual(["sense"]);
  });

  it("never mixes the two on one list, which is §5's rule", () => {
    /*
     * The failure this prevents: a caller holding our word for one station and
     * theirs for the next, producing a list that is neither vocabulary and
     * reads as both. The choice is made once, for the whole list, so mixing is
     * not expressible at the call site.
     */
    const ours = oneVocabulary("ours").map((r) => r.label);
    const theirs = oneVocabulary("theirs").map((r) => r.label);
    // Decide is the sharpest disagreement: Decide here, Plan there.
    expect(ours[1]).toBe("Decide");
    expect(theirs[1]).toBe("Plan");
    // And our Plan is at a different index from their Plan, which is the trap.
    expect(ours.indexOf("Plan")).not.toBe(theirs.indexOf("Plan"));
  });

  it("honours a route that waives stations, rather than always showing seven", () => {
    // A route that skips Design must translate as the route it is. Passing the
    // stations in keeps this honest for a waived route without a second map.
    const partial = oneVocabulary("theirs", ["sense", "decide", "build"]);
    expect(partial.map((r) => r.label)).toEqual(["Discover", "Plan", "Build"]);
  });
});
