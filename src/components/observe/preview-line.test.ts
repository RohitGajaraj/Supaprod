import { describe, expect, it } from "bun:test";

import { previewLine } from "./preview-line";

/**
 * MEASURED AGAINST THE LIVE DATABASE, 2026-08-27, over the 1,000 `ai_events`
 * rows this account can see: 24 of 939 non-empty `input_preview` values and 25
 * of 926 `output_preview` values carry `**bold**`, and the real rows carry
 * headings and bullets on top of that. `AnalyticsPanel` renders the column
 * into a `Row` lead, which is one line, so a person gets the hash, the bullet
 * and the asterisks as literal characters.
 */

describe("previewLine", () => {
  it("takes the first real line out of a markdown blob", () => {
    // The shape from a real row, verbatim.
    const real = "### Growth and Friction\n* **Conversion focus:** Simplifying the checkout.";
    expect(previewLine(real)).toBe("Conversion focus: Simplifying the checkout.");
  });

  it("SKIPS a heading, because a label is not the thing it labels", () => {
    expect(previewLine("## Summary\nThe abandon point moved.")).toBe("The abandon point moved.");
  });

  it("strips the leaders that open a line and nothing else", () => {
    expect(previewLine("- a bullet")).toBe("a bullet");
    expect(previewLine("> a quote")).toBe("a quote");
    expect(previewLine("1. a numbered item")).toBe("a numbered item");
  });

  it("LEAVES UNDERSCORES ALONE, which is the rule that matters most here", () => {
    // S1's reasoning and it is right: these agents write column names and tool
    // names constantly. Removing a marker is cosmetic; corrupting an identifier
    // makes the sentence false. `checkout_single_address` is on the board now.
    expect(previewLine("ramping checkout_single_address to 100%")).toBe(
      "ramping checkout_single_address to 100%",
    );
    expect(previewLine("_italic_ stays")).toBe("_italic_ stays");
  });

  it("leaves a backticked name exactly as written", () => {
    expect(previewLine("the `checkout_single_address` flag")).toBe(
      "the `checkout_single_address` flag",
    );
  });

  it("does not touch an asterisk that is not paired emphasis", () => {
    expect(previewLine("5 * 3 = 15")).toBe("5 * 3 = 15");
    expect(previewLine("an unmatched * survives")).toBe("an unmatched * survives");
  });

  it("unwraps single-asterisk emphasis only when it is genuinely paired", () => {
    expect(previewLine("remains a barrier *after* that fix")).toBe(
      "remains a barrier after that fix",
    );
  });

  it("ANSWERS EMPTY RATHER THAN INVENTING A PLACEHOLDER", () => {
    // "No preview was recorded" is a claim about our data and belongs to the
    // surface that knows what it asked for, not to a string helper.
    expect(previewLine("")).toBe("");
    expect(previewLine(null)).toBe("");
    expect(previewLine(undefined)).toBe("");
    expect(previewLine("\n\n   \n")).toBe("");
  });

  it("survives a blob that is nothing but headings", () => {
    expect(previewLine("# One\n## Two")).toBe("");
  });
});
