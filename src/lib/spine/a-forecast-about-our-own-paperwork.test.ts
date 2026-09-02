/**
 * THE FORECASTS THIS PRODUCT HAS ACTUALLY RECORDED, AND WHY EIGHT CANNOT BE GRADED.
 *
 * Every `how` string below is verbatim from `decisions` on 2026-09-03,
 * non-sample and ungraded. They are the whole population this rule was written
 * against, so the test is the measurement rather than an illustration of it.
 */
import { describe, expect, it } from "bun:test";
import {
  aboutOurOwnPaperwork,
  CANNOT_BE_GRADED,
  whyItCannotBeGraded,
} from "@/lib/spine/a-forecast-about-our-own-paperwork";

/** A realistic slice of the registry, including the three P-04 names. */
const TOOLS = [
  "prd.get",
  "prd.draft",
  "sources.status",
  "workspace.search",
  "studio.pr.open",
  "studio.pr.merge",
  "learning.record",
];

/** Verbatim from the eight rows A1 listed. */
const OURS: Array<[string, string]> = [
  ["663c7376", "prd.get will return status='approved' and design_gate_status='cleared'"],
  [
    "e67ae002",
    "workspace.search returns >= 3 signals with source_kind='zendesk' AND content match",
  ],
  [
    "f649905d",
    "workspace.search('42703 OR 404') returns >= 1 result AND sources.status reports active",
  ],
  [
    "08cc534e",
    "sources.status shows active_scout_targets > 0 AND workspace.search('42703 OR 404')",
  ],
  ["7b43fd8e", "workspace.search returns >= 3 matches for 'ZEN-' AND ('Europe' OR 'EU' OR 'GMT')"],
  [
    "eec7780d",
    "workspace.search executed with identical query (ZEN-, SLA breach, 4 hour, 12 hour)",
  ],
  ["666f860f", "workspace.search returns >= 1 signal with verbatim customer quote + timestamp"],
];

describe("the eight on the record", () => {
  for (const [id, how] of OURS) {
    it(`refuses ${id}, which grades itself`, () => {
      const v = aboutOurOwnPaperwork(how, TOOLS);
      expect(v.ourOwn).toBe(true);
      // And it names WHICH tool, because the sentence has to be actionable.
      expect(TOOLS).toContain(v.named!);
    });
  }

  it("names the most specific tool when a string holds two", () => {
    // `08cc534e` names both. The sentence should say the one it hit first in
    // the text, and either is true; what it must never do is say neither.
    const v = aboutOurOwnPaperwork(OURS[3][1], TOOLS);
    expect(["sources.status", "workspace.search"]).toContain(v.named!);
  });
});

describe("a real forecast about a real product is not refused", () => {
  /*
   * THE HALF THAT DECIDES WHETHER THIS RULE IS WORTH HAVING. A predicate that
   * refuses everything would pass every test above and destroy the feature.
   * These are the forecasts the product is FOR.
   */
  for (const how of [
    "Checkout completion rate for saved-address customers rises above 82 percent",
    "Support tickets tagged 'address re-entry' fall below 5 a week",
    "The tablet layout's crash rate in Sentry drops under 0.2 percent of sessions",
    "Stripe reports fewer than 3 Amex declines per thousand attempts",
    "Our own decisions table shows fewer reversals",
    "The sources of churn narrow to two",
  ]) {
    it(`allows: ${how.slice(0, 46)}`, () => {
      expect(aboutOurOwnPaperwork(how, TOOLS).ourOwn).toBe(false);
    });
  }

  it("a bare word that happens to be one of our table names is theirs, not ours", () => {
    /*
     * A homeowner-services company may perfectly well forecast something about
     * its own `decisions` or `sources`. Refusing that would be this file
     * inventing a problem, and it is exactly the false positive that would make
     * a team stop trusting the refusal on the eight where it is right.
     */
    expect(aboutOurOwnPaperwork("decisions per week fall below 4", TOOLS).ourOwn).toBe(false);
    expect(aboutOurOwnPaperwork("agent_runs in our own pipeline", TOOLS).ourOwn).toBe(false);
  });

  it("but a qualified one is unmistakably ours", () => {
    expect(aboutOurOwnPaperwork("public.agent_runs count rises", TOOLS).named).toBe(
      "public.agent_runs",
    );
    expect(aboutOurOwnPaperwork("Supaprod shows it as done", TOOLS).named).toBe("Supaprod");
  });
});

describe("the matching itself", () => {
  it("does not match a tool name inside a longer word", () => {
    // `theirprd.getter` is not `prd.get`. Without a boundary check this is the
    // false positive that arrives first and is hardest to see.
    expect(aboutOurOwnPaperwork("theirprd.getter returns 4", TOOLS).ourOwn).toBe(false);
    expect(aboutOurOwnPaperwork("myworkspace.searches rise", TOOLS).ourOwn).toBe(false);
  });

  it("matches at the very start and the very end of the string", () => {
    expect(aboutOurOwnPaperwork("prd.get", TOOLS).ourOwn).toBe(true);
    expect(aboutOurOwnPaperwork("we check prd.get", TOOLS).ourOwn).toBe(true);
  });

  it("ignores case, because nobody writes an observable to a house style", () => {
    expect(aboutOurOwnPaperwork("PRD.GET will return approved", TOOLS).ourOwn).toBe(true);
  });

  it("needs no tool list to spot the qualified forms", () => {
    // A caller that cannot reach the registry still gets the strong signals.
    expect(aboutOurOwnPaperwork("public.spine_tracks moves", []).ourOwn).toBe(true);
  });

  it("says no to nothing at all rather than guessing", () => {
    for (const empty of [null, undefined, "", "   "]) {
      expect(aboutOurOwnPaperwork(empty, TOOLS)).toEqual({ ourOwn: false, named: null });
    }
  });

  it("a single-word tool name cannot match, because it would match everything", () => {
    // A registry entry with no dot is not our vocabulary in a sentence -- it is
    // a word. `search` appearing in a forecast means nothing.
    expect(aboutOurOwnPaperwork("search volume rises", ["search"]).ourOwn).toBe(false);
  });
});

describe("what it is settled as, and what it says", () => {
  it("is inconclusive, never held and never missed", () => {
    // Both of those would claim we measured something, and we did not.
    expect(CANNOT_BE_GRADED).toBe("inconclusive");
  });

  it("says the founder's sentence, and names what it found", () => {
    const line = whyItCannotBeGraded("prd.get");
    expect(line).toContain(
      "This forecast was about Supaprod's own paperwork, not your product, so it cannot be graded.",
    );
    expect(line).toContain("prd.get");
  });

  it("still says the sentence when it cannot name a thing", () => {
    expect(whyItCannotBeGraded(null)).toContain("cannot be graded");
    expect(whyItCannotBeGraded(null)).not.toContain("undefined");
  });
});
