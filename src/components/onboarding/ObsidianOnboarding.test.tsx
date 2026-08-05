import { describe, it, expect } from "bun:test";
import * as onboarding from "./ObsidianOnboarding";
import { timeEstimateFor, beliefGuidance, criticReviewAsShareable } from "./ObsidianOnboarding";
import { asPlainText } from "../public/TeardownReceipt";

/**
 * OBS-14 - this repo has no jsdom/React-Testing-Library dependency (the
 * constraint every other Obsidian component here documents), so the
 * component's phase transitions, connect mutation, and demo-gated action are
 * not render-tested. Everything genuinely pure is covered here: the
 * per-provider time-estimate copy, the composed empty-belief case, and the
 * exact text a new account gets on its clipboard.
 */
describe("ObsidianOnboarding - timeEstimateFor", () => {
  it("returns the spec's named estimates verbatim", () => {
    expect(timeEstimateFor("github")).toBe("about 1 minute");
    expect(timeEstimateFor("intercom")).toBe("about 2 minutes");
  });

  it("falls back to a sensible default for any unlisted provider", () => {
    expect(timeEstimateFor("figma")).toBe("about 2 minutes");
    expect(timeEstimateFor("jira")).toBe("about 2 minutes");
  });
});

describe("ObsidianOnboarding - the Critic judges only what the user wrote", () => {
  /* The regression this pins: a `FALLBACK_BELIEF` constant used to seed the
     belief input, so a new account that skimmed step 3 got a teardown of a bet
     they never made. There is no default belief, and there must never be one
     again. */
  it("exports no default belief for the Critic to fall back to", () => {
    expect("FALLBACK_BELIEF" in onboarding).toBe(false);
  });

  it("composes the empty case instead of filling the box in", () => {
    const empty = beliefGuidance("");
    expect(empty).toContain("your own words");
    expect(empty.length).toBeGreaterThan(0);
  });

  it("says something different once the user's own workspace supplied a title", () => {
    const seeded = beliefGuidance("Ship the mobile capture flow");
    expect(seeded).not.toBe(beliefGuidance(""));
    expect(seeded).toContain("Edit it");
  });

  it("treats a whitespace-only seed as no seed at all", () => {
    expect(beliefGuidance("   ")).toBe(beliefGuidance(""));
  });

  it("keeps both guidance lines free of em and en dashes", () => {
    expect(beliefGuidance("")).not.toMatch(/[—–]/);
    expect(beliefGuidance("anything")).not.toMatch(/[—–]/);
  });
});

describe("ObsidianOnboarding - the verdict is shareable", () => {
  const review = {
    verdict: "revise",
    summary: "The bet is plausible but nothing in it is measurable yet.",
    risks: ["No named user", "No success metric", "Two teams already tried this", "Costly to undo"],
    missing_evidence: ["Nobody has been asked whether they would pay"],
    confidence: 0.62,
  };

  it("carries the Critic's own verdict word, not a translated one", () => {
    const out = asPlainText(criticReviewAsShareable(review));
    expect(out.split("\n")[0]).toBe("SUPAPROD CRITIC / REVISE");
  });

  it("uses the same verdict the screen stamps when the review states none", () => {
    expect(criticReviewAsShareable({}).verdict).toBe("hold");
  });

  it("copies every risk, not only the three the screen has room for", () => {
    const out = asPlainText(criticReviewAsShareable(review));
    for (const risk of review.risks) expect(out).toContain(risk);
  });

  it("copies the summary and every gap", () => {
    const out = asPlainText(criticReviewAsShareable(review));
    expect(out).toContain(review.summary);
    expect(out).toContain("WHAT YOU CANNOT PROVE YET");
    expect(out).toContain(review.missing_evidence[0]);
  });

  it("invents no recommendation, because a CriticReview has none", () => {
    const out = asPlainText(criticReviewAsShareable(review));
    expect(out).not.toContain("RECOMMENDATION");
  });

  it("ends with the shared receipt footer, so the paste carries the loop", () => {
    const out = asPlainText(criticReviewAsShareable(review));
    expect(out.trimEnd().endsWith("https://supaprod.ai/p/teardown")).toBe(true);
  });

  it("survives a review with nothing in it rather than throwing", () => {
    const out = asPlainText(criticReviewAsShareable({}));
    expect(out.split("\n")[0]).toBe("SUPAPROD CRITIC / HOLD");
  });
});
