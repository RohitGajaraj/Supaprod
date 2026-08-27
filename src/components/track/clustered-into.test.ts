import { describe, it, expect } from "bun:test";
import { clusteredInto } from "./clustered-into";

describe("which pattern a signal was clustered into", () => {
  it("names the pattern, from the title that travels with the signal", () => {
    expect(clusteredInto("t1", "Redundant Address Re-entry Causing Checkout Abandonment")).toBe(
      "grouped into Redundant Address Re-entry Causing Checkout Abandonment",
    );
  });

  it("says the plain fact when the name could not be read", () => {
    /*
     * `theme_title` is ABSENT when the theme read failed and null when the
     * theme is genuinely gone. Both mean the same thing to a reader -- we
     * cannot name it -- and neither is a reason to claim the signal joined
     * nothing, because `theme_id` says it did.
     */
    expect(clusteredInto("t1", undefined)).toBe("grouped");
    expect(clusteredInto("t1", null)).toBe("grouped");
    expect(clusteredInto("t1", "   ")).toBe("grouped");
  });

  it("says nothing at all about a signal that joined no pattern", () => {
    // No theme_id is a fact about the signal, not a gap in our reading.
    expect(clusteredInto(null, "Something")).toBe("");
    expect(clusteredInto(undefined, undefined)).toBe("");
    expect(clusteredInto("", "Something")).toBe("");
  });
});

describe("one verb for one action", () => {
  it("says grouped, which is the word the toggle already uses", () => {
    /*
     * The card said "clustered", the switch that turns the behaviour on says
     * "Group new findings without asking", and the artifact is a theme. §12
     * settles it: the word a person would say out loud is the one that goes on
     * the surface, and nobody says "clustered into".
     */
    expect(clusteredInto("t1", "Checkout drop-off")).toBe("grouped into Checkout drop-off");
    expect(clusteredInto("t1", null)).toBe("grouped");
    expect(clusteredInto("t1", undefined)).not.toContain("cluster");
  });

  it("still says nothing at all when there is no theme", () => {
    // Absent is not empty: a signal in no theme gets no meta line rather than
    // a line saying it was grouped into nothing.
    expect(clusteredInto(null, "Checkout drop-off")).toBe("");
    expect(clusteredInto(undefined, null)).toBe("");
  });
});
