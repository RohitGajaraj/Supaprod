/**
 * ── THE SETTLE GATE WAS NOT THE BLOCKER, AND WIDENING IT WOULD HAVE HURT ──
 *
 * P-04. The forecast pass ran on production at 06:00 UTC, drafted eight
 * suggestions, and settled none. The obvious reading was that `canAutoSettle`
 * is too strict -- it requires a decision to link a spec whose outcome a PERSON
 * settled, and not one decision in production does -- so the ruling was to
 * widen it to the forecast's own observable at or above the confidence floor.
 *
 * That would have been a mistake, and this file is why.
 *
 * `forecastAuditPrompt` hands the model four things: the claim, the observable,
 * the horizon, and `evidence`. `evidence` has exactly ONE source, the linked
 * spec's settled outcome, and with no linked spec it reads, verbatim, "No
 * linked outcome has been settled." The model is given no tools, no analytics
 * and no signals. It knows nothing about the world.
 *
 * So `linkedOutcomeSettled` was doing two jobs at once. It is the human anchor,
 * which is how it is documented. It is ALSO the only thing guaranteeing the
 * grader has anything to look at, which is documented nowhere. Removing it
 * removes both, and the pass would not have become a working grader: it would
 * have started settling hits and misses out of its own priors, on the one
 * record this product claims nothing else has.
 *
 * MEASURED: all eight drafts came back at **confidence 1.0** with no evidence
 * whatsoever. A model asked to judge with nothing still answers, and answers
 * confidently. That is the number that settles the argument.
 *
 * The real blocker is that nobody has connected the grader to evidence. Until
 * they do, the honest verdict is `inconclusive` and it says why.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
const AUDIT = strip(readFileSync("src/lib/brain/forecast-audit.server.ts", "utf8"));
const RULES = strip(readFileSync("src/lib/brain/forecast-resolution.ts", "utf8"));

describe("a verdict reached with no evidence is inconclusive, whatever the model said", () => {
  it("turns on what the verdict CITED, not on whether anything existed", () => {
    /*
     * This asserted `!link.evidence.trim()`, which was the right question while
     * the linked spec's outcome was the only thing the grader could read. P-42
     * gave it a kit, so the honest question moved from "was there anything to
     * read" to "did it actually use any of it". `citedRows` matches ids the
     * model was SHOWN, so a rationale cannot claim a source never in front of
     * it, and a model reasoning from its own priors names nothing.
     */
    const flat = AUDIT.replace(/\s+/g, " ");
    expect(flat).toContain('const cited = citedRows(kit, parsed.rationale ?? "");');
    expect(flat).toContain('if (cited.length === 0 && parsed.verdict !== "inconclusive")');
  });

  it("tells the two silences apart, because they are different facts", () => {
    // "There was nothing to read" and "it read nine things and cited none" are
    // not the same report, and a person deciding whether to trust the desk
    // needs to know which one happened.
    expect(AUDIT).toContain("Graded without evidence.");
    expect(AUDIT).toContain("Graded without naming a source.");
  });

  it("overrides a hit or a miss, and drops the confidence with it", () => {
    // Leaving 1.0 on a coerced verdict would be the same lie one field over.
    const flat = AUDIT.replace(/\s+/g, " ");
    expect(flat).toContain('parsed.verdict = "inconclusive";');
    expect(flat).toContain("parsed.confidence = 0;");
  });

  it("says WHY, and keeps the model's reading rather than hiding it", () => {
    expect(AUDIT).toContain("Graded without evidence.");
    expect(AUDIT).toContain("The model's reading, for what it is worth");
  });

  it("still lets the draft land, because the desk should see the agent looked", () => {
    // The draft is enrichment. A person settling this by hand is better off
    // knowing the agent had nothing than seeing no draft at all.
    expect(AUDIT).not.toContain("if (nothingToJudgeAgainst) continue;");
  });
});

describe("the gate is unchanged, deliberately", () => {
  it("still requires a human-settled linked outcome to auto-settle", () => {
    expect(RULES.replace(/\s+/g, " ")).toContain("if (!input.linkedOutcomeSettled) return false;");
  });

  it("still holds the confidence floor above it", () => {
    expect(RULES).toContain("AUTO_SETTLE_CONFIDENCE_FLOOR");
    expect(RULES.replace(/\s+/g, " ")).toContain(
      "return input.confidence >= AUTO_SETTLE_CONFIDENCE_FLOOR;",
    );
  });
});
