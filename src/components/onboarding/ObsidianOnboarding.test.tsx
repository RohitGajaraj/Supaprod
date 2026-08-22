import { describe, it, expect } from "bun:test";
import * as onboarding from "./ObsidianOnboarding";
import {
  timeEstimateFor,
  beliefGuidance,
  criticReviewAsShareable,
  isSeededExampleTitle,
  reviewHasSubstance,
  beliefFromPaste,
} from "./ObsidianOnboarding";
import { soloTrack, foundingTrack, techTrack } from "@/lib/onboarding/track-seeds";
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
    const empty = beliefGuidance("none");
    expect(empty).toContain("your own words");
    expect(empty.length).toBeGreaterThan(0);
  });

  it("says something different once the user's own workspace supplied a title", () => {
    const seeded = beliefGuidance("opportunity");
    expect(seeded).not.toBe(beliefGuidance("none"));
    expect(seeded).toContain("Edit it");
  });

  /* The line claimed "Supaprod read this from what you just connected" for any
     non-empty box. Three of the four ways to reach step 3 connect nothing: the
     product name echoed from step 1, a pasted document, and pressing "skip and
     connect later". The source is passed in now, so the sentence can only
     describe what happened. */
  it("never claims a source read anything when nothing was connected", () => {
    for (const source of ["none", "product-name", "pasted"] as const) {
      expect(beliefGuidance(source)).not.toContain("connected");
    }
  });

  /* ASSERTS THE GUARANTEE, NOT ONE PHRASING.
   *
   * This pinned the exact string "not something Supaprod read". The copy was
   * later tightened to "This is the product name you gave. Edit it into the
   * idea you want analyzed.", which carries the same guarantee more briefly and
   * more actionably, and the test failed on the improvement rather than on a
   * regression.
   *
   * The guarantee that actually matters is ATTRIBUTION: the line must say the
   * text came from the user, and must never imply Supaprod sourced it. That is
   * checked both ways now, positively and negatively, which is strictly
   * stronger than the single substring it replaces. Rewording stays free;
   * claiming Supaprod read something does not. */
  it("names the product name as the product name, and attributes it to the user", () => {
    const line = beliefGuidance("product-name");
    expect(line).toContain("product name");
    expect(line).toMatch(/you gave|you typed|you wrote|not something Supaprod read/i);
    expect(line).not.toMatch(/Supaprod (read|found|spotted|pulled)/i);
  });

  it("gives every source its own line", () => {
    const lines = (["none", "opportunity", "product-name", "pasted"] as const).map(beliefGuidance);
    expect(new Set(lines).size).toBe(lines.length);
    for (const line of lines) expect(line.length).toBeGreaterThan(0);
  });

  it("keeps every guidance line free of em and en dashes", () => {
    for (const source of ["none", "opportunity", "product-name", "pasted"] as const) {
      expect(beliefGuidance(source)).not.toMatch(/[—–]/);
    }
  });
});

/* THE REGRESSION THAT SURVIVED DELETING THE CONSTANT.
   Step 1 seeds four sample opportunities into the user's real workspace, and
   `afterConnected` took the top row by ice_score as the belief AND as the
   Critic's target. That row is reliably one of ours, so the first thing the
   product did was still tear down a canned bet - the deleted FALLBACK_BELIEF
   arriving through the seed table instead of a constant. */
describe("ObsidianOnboarding - the Critic is never pointed at seeded sample data", () => {
  it("recognises every seeded opportunity title in every track", () => {
    for (const track of [soloTrack, foundingTrack, techTrack]) {
      for (const opp of track.opportunities) {
        expect(isSeededExampleTitle(opp.title)).toBe(true);
      }
    }
  });

  it("recognises the exact title the solo seed puts at the top of the list", () => {
    // Highest ICE in soloTrack (9/8/6), so this is the row afterConnected used
    // to hand the Critic for a user who had connected nothing at all.
    expect(isSeededExampleTitle("Redesign onboarding to reduce day-1 drop-off")).toBe(true);
  });

  it("ignores whitespace and case, so a lightly edited copy is still ours", () => {
    expect(isSeededExampleTitle("  ADD OFFLINE MODE FOR CORE FEATURES  ")).toBe(true);
  });

  it("lets a bet the user actually wrote through", () => {
    expect(isSeededExampleTitle("Ship the mobile capture flow")).toBe(false);
    expect(isSeededExampleTitle("")).toBe(false);
    expect(isSeededExampleTitle("Launch push notifications")).toBe(false); // near, not equal
  });
});

/* A verdict word with nothing behind it took the SUCCESS branch: `runCritic`
   coerces an unreadable model reply into verdict "revise" with an empty summary
   and empty lists, and the screen only tested `review === null`. The user got
   one uppercase word in a coloured box, a confidence bar at its default half,
   and a copy button that put that word plus a link to our own site on their
   clipboard. */
describe("ObsidianOnboarding - an empty review is not a verdict", () => {
  it("rejects a null review", () => {
    expect(reviewHasSubstance(null)).toBe(false);
  });

  it("rejects the coerced shell runCritic returns for an unreadable reply", () => {
    expect(reviewHasSubstance({ summary: "", risks: [], missing_evidence: [] })).toBe(false);
  });

  it("rejects a review whose fields are present but blank", () => {
    expect(reviewHasSubstance({ summary: "   ", risks: ["  "], missing_evidence: [""] })).toBe(
      false,
    );
  });

  it("accepts a review carrying any one of the three kinds of substance", () => {
    expect(reviewHasSubstance({ summary: "The bet has no named user." })).toBe(true);
    expect(reviewHasSubstance({ risks: ["No success metric"] })).toBe(true);
    expect(reviewHasSubstance({ missing_evidence: ["Nobody has been asked to pay"] })).toBe(true);
  });

  it("does not accept a verdict alone, because a verdict is not a finding", () => {
    expect(reviewHasSubstance({ ...{ verdict: "revise" } })).toBe(false);
  });
});

/* "Paste a PRD ... Supaprod will analyze it directly" was answered with
   `slice(0, 200)` and no write at all. The belief now leads with the document's
   first line, the same rule the signal sink titles it by. */
describe("ObsidianOnboarding - a pasted document leads with its first line", () => {
  it("takes the first line that carries words, not the first 200 characters", () => {
    const prd =
      "\n\nMobile capture is our biggest gap\n\nBackground: we shipped the web flow first.";
    expect(beliefFromPaste(prd)).toBe("Mobile capture is our biggest gap");
  });

  it("strips a markdown heading fence, because that is not part of the bet", () => {
    expect(beliefFromPaste("# Ship offline sync\n\nDetail follows.")).toBe("Ship offline sync");
  });

  it("stays inside the wedge validator's 200 character ceiling", () => {
    expect(beliefFromPaste("x".repeat(500)).length).toBeLessThanOrEqual(200);
  });

  it("returns nothing for a whitespace-only paste rather than inventing a lead", () => {
    expect(beliefFromPaste("   \n\n  ")).toBe("");
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
    expect(out.trimEnd().endsWith("https://supaprod.ai")).toBe(true);
    expect(out).not.toContain("/p/teardown");
  });

  it("survives a review with nothing in it rather than throwing", () => {
    const out = asPlainText(criticReviewAsShareable({}));
    expect(out.split("\n")[0]).toBe("SUPAPROD CRITIC / HOLD");
  });
});
