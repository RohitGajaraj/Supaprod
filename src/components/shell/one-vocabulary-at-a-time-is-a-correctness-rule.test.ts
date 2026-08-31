/**
 * "ONE VOCABULARY AT A TIME; NEVER BOTH ON SCREEN" IS NOT A STYLE PREFERENCE.
 *
 * `RANKED-BACKLOG.md` states it as a rule for gap #26 and does not say why.
 * The why is measurable and this file measures it: **two words exist in both
 * vocabularies meaning different stations**, so a screen carrying both is
 * ambiguous in a way the reader cannot detect — each word is correct in its own
 * vocabulary and names a different step in each.
 *
 * That is the difference between clutter and a defect, and it is the reason
 * `vocabularyClash` is derived from S1's map rather than written down here.
 */
import { describe, expect, it } from "bun:test";
import { answerForArtifact, theirStrip, vocabularyClash } from "./sdlc-strip";
import { AGENT_STATION_ORDER } from "@/lib/agent-vocabulary";

describe("the clash, which is the argument for the rule", () => {
  it("finds the two words that mean different steps in the two vocabularies", () => {
    /*
     * "Plan"   ours = `define` (third)   theirs = our `decide` (second)
     * "Design" ours = `design` (fourth)  theirs = our `define` AND `design`
     *
     * A person reading "Plan" on a screen carrying both cannot tell which step
     * is meant, and BOTH readings are correct. Derived from the map, so if S1
     * changes it this test changes with it rather than going stale.
     */
    expect(vocabularyClash()).toEqual(["Design", "Plan"]);
  });
});

describe("their strip is honest about all three asymmetries", () => {
  const strip = theirStrip();

  it("collapses the two stations their Design absorbs into ONE stage", () => {
    /* Their Design covers our Plan AND our Design. Two adjacent chips both
       reading "Design" would read as a rendering bug; one stage naming two
       stations is what is actually true. */
    const design = strip.filter((s) => s.label === "Design");
    expect(design).toHaveLength(1);
    expect(design[0]!.stations).toEqual(["define", "design"]);
    expect(design[0]!.ours).toEqual(["Plan", "Design"]);
  });

  it("draws their Test and marks it uncovered, rather than dropping it", () => {
    /* sdlc-words: "a six-stage list rendered as five is a claim that the sixth
       did not exist." */
    const test = strip.find((s) => s.label === "Test");
    expect(test).toBeDefined();
    expect(test!.covered).toBe(false);
    expect(test!.stations).toEqual([]);
    expect(test!.because).toContain("do not cover this stage");
  });

  it("puts their Test after Build, where their pipeline puts it", () => {
    /* Appending it at the end would place it after Maintain and misdescribe
       their pipeline while claiming to speak it. */
    const labels = strip.map((s) => s.label);
    expect(labels.indexOf("Test")).toBe(labels.indexOf("Build") + 1);
    expect(labels.indexOf("Test")).toBeLessThan(labels.indexOf("Deploy"));
  });

  it("marks Discover as OUR word, because their playbook has none for it", () => {
    /* "The half they do not have" - their pipeline starts with someone who
       already knows the problem. A surface ignoring `borrowed` puts our word in
       their column while looking like neither vocabulary. */
    const discover = strip.find((s) => s.stations[0] === "sense");
    expect(discover).toBeDefined();
    expect(discover!.borrowed).toBe(false);
    expect(discover!.label).toBe("Discover");
  });

  it("keeps every one of our seven stations, and loses none to the collapse", () => {
    /* The collapse is the risky operation here: it merges entries, so the test
       that matters is that nothing vanished. */
    const covered = strip.filter((s) => s.covered).flatMap((s) => s.stations);
    expect(covered).toEqual(AGENT_STATION_ORDER);
  });

  it("never collapses two stages that are not adjacent", () => {
    /* A repeated word that is NOT adjacent would mean the route revisits a
       stage, and merging those would hide it. Asserted on the shape rather
       than on today's map, so it still holds if the map grows. */
    const seen = new Map<string, number>();
    strip.forEach((s, i) => {
      const prev = seen.get(s.label);
      if (prev !== undefined) expect(i - prev).toBeGreaterThan(1);
      seen.set(s.label, i);
    });
  });
});

describe('the question this item exists to answer: "where is my spec.md"', () => {
  it("names both stations for spec.md, because their Design covers two of ours", () => {
    expect(answerForArtifact("spec.md")).toBe("Plan and Design file your spec.md.");
  });

  it("names one station for a file only one of ours produces", () => {
    expect(answerForArtifact("intent.md")).toBe("Decide files your intent.md.");
    expect(answerForArtifact("plan.md")).toBe("Build files your plan.md.");
  });

  it("quotes their noun back and says everything else in our words", () => {
    /* The only combination that is not two vocabularies on one screen: they
       asked using their filename, so the filename is theirs and the stations
       are ours. */
    const answer = answerForArtifact("spec.md")!;
    expect(answer).toContain("spec.md");
    expect(answer).not.toContain("Design.md");
    for (const theirStage of ["Deploy", "Maintain"]) expect(answer).not.toContain(theirStage);
  });

  it("says nothing rather than guessing at a file we do not produce", () => {
    /* A file we have never heard of and one we deliberately do not emit are
       both "not here". Inventing a station for either is the fabrication this
       repo deletes features over. `verdict.md` is real but it is gap #27 and
       unbuilt, so it must not resolve to a station today. */
    expect(answerForArtifact("verdict.md")).toBeNull();
    expect(answerForArtifact("Cargo.toml")).toBeNull();
    expect(answerForArtifact("")).toBeNull();
    expect(answerForArtifact("   ")).toBeNull();
  });

  it("is case- and whitespace-forgiving, because a person types it", () => {
    expect(answerForArtifact("  SPEC.MD  ")).toBe("Plan and Design file your SPEC.MD.");
  });
});
