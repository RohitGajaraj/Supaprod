/**
 * THE SENTENCES IN THIS FILE ARE PRODUCTION ROWS, COPIED WHOLE.
 *
 * Every string quoted below was read out of `agent_runs.output` on Helio Labs
 * track `ce846e9b-2f40-416a-92da-205848f9541c` on 2026-09-09, in the order the
 * seats wrote them. They are here rather than invented because the threshold in
 * `what-it-keeps-saying.ts` is a judgement about how differently a language
 * model restates one claim, and a judgement like that can only be pinned
 * against sentences a model actually wrote. Invented fixtures would agree with
 * whatever number the implementation happens to hold.
 *
 * THE TWO THINGS THIS HAS TO GET RIGHT, and they pull against each other:
 *   1. Eighteen restatements of "you are pointed at the wrong repository" are
 *      ONE finding, and the run screen has to say it once.
 *   2. A run where seats are each saying a DIFFERENT thing has no refrain at
 *      all, and inventing one would be the product putting words in the run's
 *      mouth — the exact failure `activity.ts` refuses everywhere else.
 */
import { describe, it, expect } from "bun:test";
import {
  whatItKeepsSaying,
  refrainLead,
  claimOf,
  containment,
  claimWords,
  MIN_TURNS,
  MIN_CONTAINMENT,
  type SayingTurn,
} from "@/lib/spine/what-it-keeps-saying";

/** The claim the run made on its last six turns, verbatim. */
const WRONG_REPO =
  "This repository contains only the checkout module for Relay, not the full Relay homeowner app that renders status tiles.";

/** The same claim, twenty minutes earlier, at nearly twice the length. */
const WRONG_REPO_LONG =
  "The repository contains only checkout-related files (AddressStep.tsx, checkout.test.ts, funnel.ts, types.ts, main.ts) and no status tile components or device connectivity indicator implementations.";

/** The same claim again, at its shortest on the whole track — the hard case. */
const OUT_OF_SCOPE = "This work is out of scope for the current repository.";

/**
 * Eight sentences from the SAME track, each a turn that was genuinely saying
 * something else. These are the population the threshold has to reject, and
 * they are here whole so a future change to the matcher is scored against real
 * prose rather than against a fixture written to agree with it.
 */
const DIFFERENT_CLAIMS = [
  "Decision recorded: build the fix to differentiate OTA reboot red tile from real outage red tile.",
  "The strongest case against the decision is that the evidence base is compromised by systemic signal ingestion failure.",
  "PRD drafted with ID ebca33b5-f488-4aaf-8b2b-edfa5c1c63a6.",
  "Design surface created: OTA Firmware Reboot Notification Tile.",
  "The prototype violates the standing design system's color hierarchy.",
  "Reached the step limit before finishing.",
  "The design conforms to the spec and standing design system.",
  "Spec drafted with ID 08546dce-b9ae-473c-ad8a-779dfac72ffc.",
];

/** The nine restatements of the anchor claim, in the seats' own words. */
const RESTATEMENTS = [
  WRONG_REPO_LONG,
  OUT_OF_SCOPE,
  "The repository does not contain any status tile, outage, or connectivity indicator components.",
  "The repository structure shows only checkout-related files in src/ and no notification or tile components.",
  "The repository does not contain the notification tile implementation needed to differentiate OTA firmware reboot tiles from real outage tiles.",
  "I cannot implement the requested change because the repository does not contain the status tile components needed for this work.",
  "The repository contains only checkout-related files (src/checkout/) and no notification system components.",
  "After examining the repository structure with repo.tree and repo.read, I found only checkout-related files and no components for status tiles, device connectivity indicators, or notification UI elements.",
  "This repository contains only the checkout module for the Relay homeowner app, as confirmed by the README.md file.",
];

let seq = 0;
function turn(over: Partial<SayingTurn> = {}): SayingTurn {
  seq += 1;
  return {
    runId: `run-${seq}`,
    agentName: "Engineer",
    at: new Date(Date.UTC(2026, 8, 1, 0, seq, 0)).toISOString(),
    outcome: "completed" in over ? "done" : "done",
    made: [],
    said: WRONG_REPO,
    ...over,
  };
}

/**
 * ── THE PRONOUN MUST NOT REACH OUTSIDE ITS OWN SENTENCE ─────────────────────
 *
 * Read live on `6cc7a010`, 2026-09-10. The hold card drew Build's repository
 * quote, then a door, then this lead about DESIGN -- whose twelve turns said
 * "AI credits exhausted", a sentence that lives in the story eight hundred
 * pixels below and is nowhere on the card.
 *
 * "Design said THIS 12 times" therefore bound to the only quote in reach, which
 * was the wrong wall. Both elements were correct; the false attribution was
 * assembled out of adjacency, which no test of either could see.
 */
describe("the lead is self-contained, because the card has no quote on it", () => {
  it("never points at something it does not render", () => {
    const lead = refrainLead({
      saying: "AI credits exhausted: account credit balance (1) is below the projected cost (20).",
      turns: 12,
      seats: ["Design"],
      from: "2026-09-04T09:10:00Z",
      to: "2026-09-04T11:00:00Z",
    });
    /* A deictic pronoun is the defect: it reaches for the nearest quote, and on
       this card the nearest quote belongs to another station. */
    expect(lead).not.toContain("said this");
    expect(lead).not.toContain(" this ");
    /* And it does not re-quote, which would restore the duplication that moving
       the sentence to the story was meant to remove. */
    expect(lead).not.toContain("credits");
    /* What it keeps: who, how many, and that nothing came of it. */
    expect(lead).toContain("Design");
    expect(lead).toContain("12 turns");
    expect(lead).toContain("filed nothing");
  });
});

describe("what a run keeps saying", () => {
  it("finds the one claim behind six identical-looking rows, in the run's own words", () => {
    const turns = [
      turn({ agentName: "Engineer", said: WRONG_REPO }),
      turn({ agentName: "Review", said: WRONG_REPO }),
      turn({ agentName: "Engineer", said: WRONG_REPO }),
      turn({ agentName: "Review", said: WRONG_REPO }),
      turn({ agentName: "Engineer", said: WRONG_REPO }),
      turn({ agentName: "Review", said: WRONG_REPO }),
    ];
    const r = whatItKeepsSaying(turns);
    expect(r).not.toBeNull();
    expect(r!.turns).toBe(6);
    expect(r!.saying).toBe(WRONG_REPO);
    expect(r!.seats).toEqual(["Review", "Engineer"]);
    expect(refrainLead(r!)).toBe(
      "Review and Engineer said the same thing for 6 turns, and filed nothing in any of them.",
    );
  });

  it("separates the two populations with an empty band, not a tuned decimal", () => {
    /*
     * THE WHOLE JUSTIFICATION FOR THE THRESHOLD, ASSERTED RATHER THAN
     * DESCRIBED. Seventeen real sentences off one track: nine restating the
     * anchor claim, eight saying something else. If a future change to the
     * matcher shrinks this gap, the classification stops being sound and this
     * is the test that says so — the per-case assertions below would all still
     * pass on a threshold balanced on a knife edge.
     */
    const same = RESTATEMENTS.map((s) => containment(WRONG_REPO, s));
    const other = DIFFERENT_CLAIMS.map((s) => containment(WRONG_REPO, s));
    const lowestSame = Math.min(...same);
    const highestOther = Math.max(...other);

    // The threshold sits strictly inside the gap...
    expect(highestOther).toBeLessThan(MIN_CONTAINMENT);
    expect(lowestSame).toBeGreaterThan(MIN_CONTAINMENT);
    // ...and the gap is a band, not a boundary: the two populations are at
    // least half the threshold's own value apart. Measured 0.125 to 0.250.
    expect(lowestSame - highestOther).toBeGreaterThanOrEqual(MIN_CONTAINMENT / 2);
  });

  it("holds one claim across every way the seats restated it", () => {
    // Nine restatements plus the anchor, in the order they were written.
    const turns = [...RESTATEMENTS].reverse().map((said) => turn({ said }));
    turns.push(turn({ said: WRONG_REPO }));
    const r = whatItKeepsSaying(turns);
    expect(r?.turns).toBe(RESTATEMENTS.length + 1);
    // The NEWEST wording is quoted: it is the run's current position.
    expect(r?.saying).toBe(WRONG_REPO);
  });

  it("says nothing about a run whose seats each said a different thing", () => {
    expect(whatItKeepsSaying(DIFFERENT_CLAIMS.map((said) => turn({ said })))).toBeNull();
  });

  it("stops the walk at the first turn that changed the subject", () => {
    const r = whatItKeepsSaying([
      turn({ said: WRONG_REPO }),
      turn({ said: WRONG_REPO }),
      turn({ said: "The design conforms to the spec and standing design system." }),
      turn({ said: WRONG_REPO }),
      turn({ said: WRONG_REPO }),
      turn({ said: WRONG_REPO }),
    ]);
    // Only the three since the subject changed; the two before it are history.
    expect(r?.turns).toBe(3);
  });

  it("is broken by a turn that filed something, because filing is progress", () => {
    const r = whatItKeepsSaying([
      turn({ said: WRONG_REPO }),
      turn({ said: WRONG_REPO }),
      turn({ said: WRONG_REPO, made: [{ kind: "spec" }] }),
      turn({ said: WRONG_REPO }),
      turn({ said: WRONG_REPO }),
    ]);
    // Two turns since the filing is under MIN_TURNS, so there is no refrain to
    // report yet even though the same words are on five rows.
    expect(r).toBeNull();
    expect(MIN_TURNS).toBe(3);
  });

  it("says nothing while a seat is still working — a live turn is not evidence", () => {
    expect(
      whatItKeepsSaying([
        turn({ said: WRONG_REPO }),
        turn({ said: WRONG_REPO }),
        turn({ said: WRONG_REPO }),
        turn({ said: null, outcome: "working" }),
      ]),
    ).toBeNull();
  });

  it("names a count rather than a roster once more than two seats are in the loop", () => {
    const r = whatItKeepsSaying([
      turn({ agentName: "Engineer", said: WRONG_REPO }),
      turn({ agentName: "Review", said: WRONG_REPO }),
      turn({ agentName: "Draft", said: WRONG_REPO }),
      turn({ agentName: "Critique", said: WRONG_REPO }),
    ]);
    expect(refrainLead(r!)).toBe(
      "4 seats said the same thing for 4 turns, and filed nothing in any of them.",
    );
  });
});

describe("the claim taken from a seat's prose", () => {
  it("keeps file names and tool names whole rather than cutting at their dots", () => {
    const c = claimOf(
      "After examining the repository structure with repo.tree and repo.read, I found only checkout-related files. The rest is argument.",
    );
    expect(c).toBe(
      "After examining the repository structure with repo.tree and repo.read, I found only checkout-related files.",
    );
  });

  it("takes the conclusion and leaves the workings", () => {
    expect(claimOf(`${WRONG_REPO} The README.md explicitly states this. I cannot proceed.`)).toBe(
      WRONG_REPO,
    );
  });

  it("refuses a fragment, so a contentless row cannot anchor a refrain", () => {
    expect(claimOf("Done.")).toBeNull();
    expect(claimOf("   ")).toBeNull();
    expect(claimOf(null)).toBeNull();
  });

  it("counts two sentences with no content words as unlike, never as identical", () => {
    expect(containment("It is.", "It is.")).toBe(0);
  });

  it("treats a plural and its singular as one word, so one claim is not two", () => {
    expect(claimWords("status tiles")).toEqual(claimWords("status tile"));
    // ...but never at the cost of a word that genuinely ends in a double s.
    expect(claimWords("address").has("address")).toBe(true);
  });
});
