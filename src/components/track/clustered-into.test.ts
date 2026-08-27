import { describe, it, expect } from "bun:test";
import { clusteredInto } from "./clustered-into";

describe("which pattern a signal was clustered into", () => {
  it("names the pattern, from the title that travels with the signal", () => {
    expect(clusteredInto("t1", "Redundant Address Re-entry Causing Checkout Abandonment")).toBe(
      "clustered into Redundant Address Re-entry Causing Checkout Abandonment",
    );
  });

  it("says the plain fact when the name could not be read", () => {
    /*
     * `theme_title` is ABSENT when the theme read failed and null when the
     * theme is genuinely gone. Both mean the same thing to a reader -- we
     * cannot name it -- and neither is a reason to claim the signal joined
     * nothing, because `theme_id` says it did.
     */
    expect(clusteredInto("t1", undefined)).toBe("clustered");
    expect(clusteredInto("t1", null)).toBe("clustered");
    expect(clusteredInto("t1", "   ")).toBe("clustered");
  });

  it("says nothing at all about a signal that joined no pattern", () => {
    // No theme_id is a fact about the signal, not a gap in our reading.
    expect(clusteredInto(null, "Something")).toBe("");
    expect(clusteredInto(undefined, undefined)).toBe("");
    expect(clusteredInto("", "Something")).toBe("");
  });
});
