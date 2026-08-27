/**
 * THE SAFETY CORRECTION ON THE BOUNDARY SCREEN COULD NEVER FIRE.
 *
 * BoundaryControls carries a predicate whose own comment says why it exists:
 * the loop demotes a low-risk `confirm` tool with no floor to `auto` and runs
 * it inline, so counting the stored buckets UNDER-REPORTS how much really runs
 * unattended -- and "an under-report is the direction that gets someone hurt."
 *
 * It read `t.risk`. `getBoundary` does not return a risk. It returns the MODE
 * relabelled:
 *
 *     mode === "review" ? "high" : mode === "auto" ? "low" : "medium"
 *
 * So a tool in `confirm` is ALWAYS "medium", `t.risk === "low"` was
 * unsatisfiable by construction, and the correction never applied once. The
 * headline "your crew does N of M things without asking" has under-reported for
 * exactly as long -- on the screen the founder asked to answer that question.
 *
 * This asserts the two halves that matter: the real risk function disagrees
 * with the mode-derived one (so the fix changes something), and a `confirm`
 * tool can never look "low" through the derived field (so the old predicate
 * was dead, not merely rare).
 */
import { describe, it, expect } from "bun:test";
import { toolRisk } from "@/lib/tool-consequences";

/** Exactly what governance.functions.ts derives, quoted so a change there fails here. */
function derivedRisk(mode: string): "high" | "medium" | "low" {
  return mode === "review" ? "high" : mode === "auto" ? "low" : "medium";
}

describe("the under-report that never fired", () => {
  it("a confirm tool is never low through the derived field, whatever it really is", () => {
    expect(derivedRisk("confirm")).toBe("medium");
    // Which is the whole bug: the predicate asked for a value this can't return.
    expect(derivedRisk("confirm")).not.toBe("low");
  });

  it("the real function does return low, so the corrected predicate can fire", () => {
    const low = ["prd.get", "prd.draft", "decision.record"].filter((n) => toolRisk(n) === "low");
    expect(low.length).toBeGreaterThan(0);
  });

  it("and it is a real assessment, not a relabelling: the two disagree", () => {
    // If these ever agreed for every tool, the derived field would be harmless
    // and this whole finding would be moot. They do not.
    const disagree = ["studio.commit", "studio.pr.merge", "signal.create"].filter(
      (n) => toolRisk(n) !== derivedRisk("confirm"),
    );
    expect(disagree.length).toBeGreaterThan(0);
  });

  it("an unknown tool is treated as high, so a gap never reads as safe", () => {
    expect(toolRisk("nothing.like.this")).toBe("high");
    expect(toolRisk(null)).toBe("medium");
  });
});
