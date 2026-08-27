/**
 * THE GRAPH KEPT ITS OWN WORD FOR EVERY KIND, AND TWO OF THEM HAD DRIFTED.
 *
 * `artifact-words.ts` is the canonical map: it exists because half the kind
 * strings are table names wearing a badge, and printing them raw is the engine
 * talking on a surface that exists to be legible. The graph carried a second
 * map, and it said "Signal" -- which §12 bans outright and S0 renamed to
 * "finding" -- and "Changeset", which is exactly the schema word the canonical
 * map exists to translate. Raised by S1 on 2026-08-27, who hit the same shape
 * in the design vocabulary.
 *
 * DELETING THE LOCAL MAP WOULD HAVE FIXED TWO DRIFTS AND CAUSED SEVEN. A graph
 * node badge is a few characters wide and several kinds are deliberately
 * shorter here than the canonical sentence word. So the overrides stay, and
 * this test is the thing that keeps them honest: an override that has stopped
 * overriding anything is how the NEXT divergence hides, because it looks
 * deliberate.
 */
import { describe, it, expect } from "bun:test";
import { kindLabel } from "../graph-visual";
import { artifactWord } from "@/lib/artifact-words";

/**
 * Every kind whose graph word deliberately differs from the canonical one, with
 * the reason. Adding a row here is a decision; the test below makes it one that
 * cannot be made by accident.
 */
const DELIBERATE: Record<string, string> = {
  roadmap_item: "A node badge has no room for 'roadmap item', and 'Roadmap' loses nothing.",
  design_memory: "'Design rule' wraps in a badge; the node's colour already says which family.",
  deployment: "'Deploy' is the station's own word and fits.",
  prototype: "'Mockup' is what the Design station calls it on every other surface.",
  prd_scaffold: "'Drawing' is right mid-sentence and unreadable as a badge beside a spec node.",
  prd_flow: "'Flow' alone is ambiguous in a graph where every edge is a flow.",
};

/** The kinds the graph draws. Deliberately listed rather than exported from the
 *  map, so a kind added there without a decision about its word shows up here
 *  as a missing entry rather than passing silently. */
const DRAWN = [
  "decision",
  "signal",
  "theme",
  "opportunity",
  "prd",
  "roadmap_item",
  "task",
  "meeting",
  "mission",
  "design_memory",
  "learning",
  "deployment",
  "changeset",
  "prototype",
  "prd_scaffold",
  "prd_flow",
];

describe("a graph node says what everything else says", () => {
  it("every kind not deliberately overridden matches the canonical word", () => {
    const drifted = DRAWN.filter((k) => !(k in DELIBERATE)).filter(
      (k) => kindLabel(k).toLowerCase() !== artifactWord(k).toLowerCase(),
    );
    expect(drifted).toEqual([]);
  });

  it("the two that were wrong now say what §12 and the canonical map say", () => {
    expect(kindLabel("signal")).toBe("Finding");
    expect(kindLabel("changeset")).toBe("Code change");
  });

  /**
   * S1's point, and the reason this file is worth its length: an override that
   * has stopped overriding is indistinguishable from a deliberate one until it
   * hides the next drift.
   */
  it("no override has quietly stopped overriding anything", () => {
    const inert = Object.keys(DELIBERATE).filter(
      (k) => kindLabel(k).toLowerCase() === artifactWord(k).toLowerCase(),
    );
    expect(inert).toEqual([]);
  });

  it("and every override still has a reason written beside it", () => {
    for (const [kind, why] of Object.entries(DELIBERATE)) {
      expect(why.length, `${kind} has no reason`).toBeGreaterThan(20);
    }
  });
});
