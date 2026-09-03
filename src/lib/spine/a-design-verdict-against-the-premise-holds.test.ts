/**
 * On the tablet track the Design critic said the spec's premise -- a layout fix
 * -- contradicts the brief, which is about removing a re-confirmation step. The
 * track recorded that as a NOTE, passed Design, walked to Build, and what
 * reached a customer's repository was 90 lines of CSS for a component that does
 * not exist.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import {
  designVerdictHolds,
  designHoldLine,
  findingIsAgainstThePremise,
} from "./a-design-verdict-against-the-premise-holds";
import type { DesignCriticReview } from "@/lib/ai/design-critic";

const code = (src: string): string =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const DRIVER = code(readFileSync("src/lib/spine/driver.server.ts", "utf8"));

const review = (
  verdict: DesignCriticReview["verdict"],
  issues: string[] = [],
): DesignCriticReview => ({
  verdict,
  findings: issues.map((issue) => ({ issue, principle: "clarity" })) as never,
});

describe("a design verdict against the premise holds the track", () => {
  it("holds on the tablet track's actual finding", () => {
    expect(
      designVerdictHolds(
        review("revise", ["The spec's premise is a layout fix, which contradicts the brief."]),
      ),
    ).toBe(true);
  });

  it("holds on kill without interpreting anything", () => {
    // The critic was given three words and chose the one that means stop.
    expect(designVerdictHolds(review("kill"))).toBe(true);
  });

  it("lets an ordinary revise through", () => {
    // A critic improving a drawing has not found that the next station should
    // not run. A wrong hold costs one press; this must stay cheap.
    expect(
      designVerdictHolds(
        review("revise", [
          "The primary control is too small at 320px and the label wraps.",
          "Spacing between the two cards is inconsistent with the rest of the flow.",
        ]),
      ),
    ).toBe(false);
    expect(designVerdictHolds(review("ship"))).toBe(false);
  });

  it("treats a MISSING verdict as no verdict, never as one against", () => {
    // Holding on an unreadable review would stop every track whose critic
    // failed for its own reasons.
    expect(designVerdictHolds(null)).toBe(false);
    expect(designVerdictHolds(undefined)).toBe(false);
  });

  it("catches the shapes that mean 'aimed at the wrong thing'", () => {
    for (const said of [
      "This contradicts the brief.",
      "The component does not exist in the bound repository.",
      "This addresses a different problem than the spec describes.",
      "The work belongs elsewhere.",
    ]) {
      expect(findingIsAgainstThePremise(said)).toBe(true);
    }
  });

  it("does not catch ordinary design criticism", () => {
    for (const said of [
      "The contrast ratio is below 4.5:1.",
      "This button is too small.",
      "The empty state has no illustration.",
      "",
    ]) {
      expect(findingIsAgainstThePremise(said)).toBe(false);
    }
  });

  it("says the CRITIC's own sentence, not a template", () => {
    const line = designHoldLine(
      review("revise", [
        "The premise is a layout fix and the brief asks for a step to be removed.",
      ]),
    );
    expect(line).toContain("The premise is a layout fix");
    expect(line).toContain("amend the spec");
  });

  it("has words for a kill with no usable finding", () => {
    expect(designHoldLine(review("kill"))).toContain("kill it");
    expect(designHoldLine(review("kill"))).not.toContain("undefined");
  });
});

describe("the driver stops there", () => {
  it("holds at design rather than passing with a note", () => {
    expect(DRIVER).toContain("designVerdictForTrack(supabase, row.id)");
    expect(DRIVER).toContain("designVerdictHolds(verdict)");
  });

  it("holds waiting-on-a-person, not self-check-failed", () => {
    // Nothing malfunctioned and retrying changes nothing: the spec and the
    // drawing disagree about what the work is, and only a person settles that.
    const from = DRIVER.indexOf("designVerdictHolds(verdict)");
    const to = DRIVER.indexOf("if (overBudget)", from);
    expect(from).toBeGreaterThan(-1);
    expect(to).toBeGreaterThan(from);
    const block = DRIVER.slice(from, to);
    expect(block).toContain('last_hold: "waiting-on-a-person"');
    expect(block).not.toContain("self-check-failed");
    // F-127: this hold clears its sentence; the words ride the returned line.
    expect(block).toContain("last_hold_because: null");
  });

  it("reads the verdict through THIS track's own prototype", () => {
    const fn = DRIVER.slice(DRIVER.indexOf("async function designVerdictForTrack"));
    const body = fn.slice(0, fn.indexOf("\n}"));
    expect(body).toContain('.eq("track_id", trackId)');
    expect(body).toContain('.eq("artifact_kind", "prototype")');
    expect(body).toContain('.from("prd_scaffolds")');
  });
});
