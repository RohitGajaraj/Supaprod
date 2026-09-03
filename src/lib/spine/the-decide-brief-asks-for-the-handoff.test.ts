/**
 * P-21. THE FIVE FIELDS A HANDOFF NEEDS, ASKED FOR IN EVERY PLACE DECIDE IS BRIEFED.
 *
 * Anthropic's AI-native SDLC playbook names `intent.md` as its Stage 1 handoff,
 * carrying problem statement, proposed outcome, affected users and systems,
 * constraints and open questions. We held a `decisions` row with eleven
 * `forecast_*` columns and nothing that said what the work IS.
 *
 * ── WHY THIS FILE EXISTS RATHER THAN ONE ASSERTION ────────────────────────
 * The Decide brief is written in TWO places — `CREW_ROLE.strategist.file` and
 * `FILE_IT.decide` — in different words, one addressing the seat as "you" and
 * one as "it". `driver.ts` warns in its own comments that fixing one and leaving
 * the other is how F-181 happened, and the first pass of this packet patched
 * only the first. A seat briefed by the copy that never learned about `intent`
 * files a decision without it, and nothing anywhere would say so.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { INTENT_FIELDS } from "@/lib/spine/playbook-files";

const DRIVER = readFileSync("src/lib/spine/driver.ts", "utf8");
const REGISTRY = readFileSync("src/lib/ai/tools/registry.server.ts", "utf8");

describe("both copies of the Decide brief ask for the handoff", () => {
  it("names every one of the five fields, in both", () => {
    /*
     * Counted, not merely present. One copy carrying all five and the other
     * carrying none passes a bare `toContain` and is the exact failure this file
     * is for.
     */
    for (const { key } of INTENT_FIELDS) {
      const hits = [...DRIVER.matchAll(new RegExp(key, "g"))].length;
      expect(
        hits,
        `${key} appears ${hits} times in driver.ts, expected at least 2`,
      ).toBeGreaterThanOrEqual(2);
    }
  });

  it("asks the seat to write them for a stranger, not for us", () => {
    // The file lands in somebody else's repository. A field written with this
    // run's context assumed is unreadable the moment it leaves.
    expect(DRIVER).toContain("in their own repo");
    expect(DRIVER).toContain("in their own repository");
  });

  it("tells the seat why open questions is the one to take seriously", () => {
    /*
     * The spec singles it out: "the field we would never have thought of: it is
     * the one that makes a handoff honest rather than confident". A brief that
     * lists five fields flatly gets four filled in and a blank.
     */
    expect(DRIVER).toContain("honest rather than confident");
  });
});

describe("the tool accepts them, and refuses nothing over them", () => {
  it("takes all five", () => {
    for (const { key } of INTENT_FIELDS) {
      expect(REGISTRY).toContain(`${key}: z.string()`);
    }
  });

  it("is OPTIONAL, unlike the forecast beside it", () => {
    /*
     * The asymmetry is deliberate and worth pinning. A decision with no forecast
     * is refused: the forecast is what this product grades and there is no
     * repair path once the row is written. Intent is a description — a decision
     * recorded without it is worse but not wrong, and refusing one would stop
     * the loop over prose.
     */
    const block = REGISTRY.slice(
      REGISTRY.indexOf("      intent: z"),
      REGISTRY.indexOf("      forecast_claim: z"),
    );
    expect(block).toContain(".optional(),");
  });

  it("writes null rather than an empty object when the seat gave none", () => {
    /*
     * A decision that predates this column and one whose intent is an empty
     * object are different facts, and the column comment says so. Writing `{}`
     * would collapse them at the moment the distinction is cheapest to keep.
     */
    expect(REGISTRY).toContain("intent: a.intent");
    expect(REGISTRY).toContain("          : null,");
  });

  it("drops blank fields rather than storing empty strings", () => {
    // An empty string renders as a filled-in field that says nothing, which is
    // worse than the "not recorded yet" the renderer writes for a missing one.
    expect(REGISTRY).toContain('typeof v === "string" && v.trim().length > 0');
  });
});
