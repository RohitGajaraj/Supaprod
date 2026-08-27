/**
 * F-143: 15 OF 26 HOUSE RULES WERE THE LOOP DESCRIBING ITS OWN FAILURES.
 *
 * S3 raised the number that started this: **26 house rules pending across 9
 * workspaces since 12 July, and zero have ever been approved.** They called it
 * "the difference between the loop is wired and the loop has guided a call",
 * which is right, and the reason nobody has approved one turns out to be in the
 * rules themselves.
 *
 * ── TWO POPULATIONS IN ONE QUEUE ───────────────────────────────────────────
 * Eleven are exactly what this feature is for:
 *   *"Simplifying the address confirmation step significantly increases
 *   checkout completion rates across the user journey."*
 *
 * Fifteen are the loop's own exhaust:
 *   *"the qa and builder agents consistently fail when resolving database
 *   integrity or duplicate row issues."*
 *
 * **A queue where more than half the items would harm the product if approved
 * is a queue a person stops opening.**
 *
 * ── AND IT WOULD HARM IT LITERALLY ─────────────────────────────────────────
 * An approved rule is injected VERBATIM into every agent's system prompt at the
 * chokepoint. So approving one of those tells the builder, on every future run,
 * that the builder consistently fails.
 *
 * ── WHY THE PROMPT PRODUCED THEM ───────────────────────────────────────────
 * Its own worked example is *"this team consistently underestimates infra
 * work"* — a true and useful rule about the CUSTOMER's team. The model applied
 * the same shape to OUR crew. The example was not wrong; the boundary around it
 * was never stated.
 *
 * This is F-113 at a third station: Define specced its own difficulty, Ship
 * refused the resulting document, and here the steward distils it into standing
 * guidance. Same fix as F-113 — the rule is stated in the prompt AND made
 * mechanical, because that finding's own lesson was that prose held half the
 * time.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { namesOurOwnMachinery } from "./house-rules-tick";

const SRC = readFileSync(fileURLToPath(new URL("./house-rules-tick.ts", import.meta.url)), "utf8");

describe("the real drafts, as measured on the live queue", () => {
  it.each([
    "the qa and builder agents consistently fail when resolving database integrity or duplicate row issues",
    "the strategist and critic agents consistently fail during the decision phase for user interface work",
    "the customer-insights, researcher, and discovery-scout agents consistently halt when gathering evidence",
    "the prd-writer and sprint-planner agents consistently fail when drafting specs for user preferences",
    "the ux-architect agent consistently fails when designing surfaces for silent failure work",
  ])("refuses: %s", (rule) => {
    expect(namesOurOwnMachinery(rule)).toBe(true);
  });

  it.each([
    "Simplifying the address confirmation step significantly increases checkout completion rates across the user journey",
    "Betting on friction reduction in the early user journey yields significant engagement gains",
    "Batching notifications and pushes provides a reliable delivery mechanism while reducing user noise and mutes",
    "Single step confirmation layouts significantly improve checkout completion rates",
    "this team consistently underestimates infra work",
  ])("keeps: %s", (rule) => {
    expect(namesOurOwnMachinery(rule)).toBe(false);
  });
});

describe("it is narrow on purpose", () => {
  it("a customer's own build failing is still a rule", () => {
    /*
     * Matching "fail" would trade one bad queue for an empty one. A genuine
     * product rule may well be about something failing for a customer, and the
     * thing that is never legitimate is a standing rule naming OUR crew.
     */
    expect(namesOurOwnMachinery("Builds that fail twice in a week predict a churned account")).toBe(
      false,
    );
    expect(namesOurOwnMachinery("Checkout errors above 2% reliably precede a support spike")).toBe(
      false,
    );
  });

  it("a slug alone is not enough: it must be talking about agents or stations", () => {
    // "researcher" is a real job title. A rule about a customer's researchers
    // is a rule; one about our researcher agent is not.
    expect(namesOurOwnMachinery("Teams with a dedicated researcher ship fewer reversals")).toBe(
      false,
    );
    expect(namesOurOwnMachinery("the researcher agent halts on thin evidence")).toBe(true);
  });

  it("and word boundaries hold, so a slug inside another word does not match", () => {
    expect(namesOurOwnMachinery("Rebuilders of legacy flows see slower agent adoption")).toBe(
      false,
    );
  });
});

describe("both halves are in place, because prose held half the time", () => {
  it("the prompt says what a rule is about", () => {
    expect(SRC).toContain("A RULE IS ABOUT THE CUSTOMER'S PRODUCT, MARKET AND TEAM");
    expect(SRC).toContain("bug report wearing a rule's clothes");
  });

  it("and it says WHY, which is the half a model can act on", () => {
    // "An approved rule goes verbatim into every agent's system prompt" is the
    // fact that makes the prohibition make sense rather than feel arbitrary.
    expect(SRC).toContain("goes verbatim into every agent's system prompt");
  });

  it("the write refuses mechanically, not only by instruction", () => {
    expect(SRC).toContain("if (namesOurOwnMachinery(d.rule_text)) {");
  });

  it("and the refusal is REPORTED, never silent", () => {
    /*
     * A refusal nobody can see looks identical to a pass that found nothing:
     * the job would say "drafted 0" whether the steward had no pattern or
     * produced three rules about our own agents.
     */
    expect(SRC).toContain("refused for being about our own agents");
  });
});
