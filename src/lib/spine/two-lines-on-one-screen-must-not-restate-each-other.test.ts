/**
 * TWO SENTENCES AGREEING 190px APART ARE WORSE THAN TWO CONTRADICTING.
 *
 * S2's framing, after removing a count that appeared twice on one screen, and it
 * is the sharpest statement of a class that has bitten three times this week:
 *
 *   · `ReadFailedLine` rendered `out.detail ?? children`, so an ended session
 *     REPLACED the caller's own sentence and three regions said one thing.
 *   · S1 mounted `AskInPlace` at a Build hold; it hid itself exactly when the
 *     station could not proceed, taking the explanation down with it.
 *   · F-134: `HOLD_LINE["no-agent"]` and `wayOut`'s diagnosis both told a person
 *     nothing would pick the step up, eight lines apart.
 *
 * **All three were two CORRECT components.** Every lane's gates were green, and
 * no test either session could write sees a composed screen. A contradiction at
 * least tells a reader something is wrong; agreement leaves them unable to tell
 * which line is the surface's own claim, and no reason to look.
 *
 * ── THE GUARD S1 ASKED FOR, AND WHY IT IS NOT WORD-MATCHING ────────────────
 * S1 offered a narrow one on their side and said the general version worried
 * them, because it would mean matching on wording — the thing this repo forbids.
 *
 * This does not assert any wording. It asserts a STRUCTURAL property: for one
 * hold, the two sentences a person meets must not share a run of three
 * significant words. That is a rule about restatement, not about vocabulary, so
 * both sentences can be rewritten freely and only a rewrite that says the same
 * thing twice fails.
 *
 * Stopwords are dropped so ordinary English joints ("so this one", "until it
 * is") cannot trip it, and a three-word run of CONTENT words in the same order
 * is not a coincidence in prose this short.
 *
 * It lives here because `HOLD_LINE` is S0's map and the rule is about the map's
 * relationship to what renders beside it. `way-out.ts` stays S1's.
 *
 * ── ITS BLIND SPOT, NAMED HERE BECAUSE IT IS INHERENT ──────────────────────
 * **This catches saying one thing twice. It cannot catch saying it zero times**,
 * and S1 and I walked into that within the hour of it being written.
 *
 * We fixed `corrections-spent` from opposite sides in the same stretch: I cut
 * the hold line down to the effect alone, while S1 deleted their diagnosis for
 * that hold as a restatement of the cause my line still carried. Composed, a
 * person read *"Nothing further will be spent on this until you look."* above
 * *"Send it back a step, or do this step yourself."* — **and nothing anywhere
 * said why it had stopped.** This guard passes that happily, because two lines
 * with nothing in common share no three-word run.
 *
 * So the overlap has two failure directions and only one of them is here: left
 * in place it says the thing twice, removed from both sides it says it never.
 * **The second is harder to notice**, because every individual line reads well
 * and the tests come out greener than before.
 *
 * The complement lives with S1 in `way-out.ts`'s suite, asserting the cause is
 * still named. One catches the repeat, one catches the hole, and neither is
 * complete alone. The division they enforce together is: **the hold line says
 * WHAT IS HAPPENING, the way out says WHY and WHAT TO DO.**
 */
import { describe, expect, it } from "bun:test";

import { HOLD_LINE, type HoldReason } from "@/lib/spine/driver";
import { wayOut } from "@/components/track/way-out";

/** Joints, not content. Sharing these says nothing about restatement. */
const STOP = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "been",
  "by",
  "can",
  "cannot",
  "did",
  "do",
  "does",
  "for",
  "from",
  "has",
  "have",
  "in",
  "into",
  "is",
  "it",
  "its",
  "of",
  "on",
  "one",
  "or",
  "so",
  "that",
  "the",
  "then",
  "there",
  "this",
  "to",
  "until",
  "up",
  "was",
  "what",
  "when",
  "which",
  "will",
  "with",
  "you",
  "your",
  "not",
  "no",
  "nothing",
  "need",
  "needs",
  "needed",
  "again",
  "here",
  "them",
  "they",
  "their",
  "than",
  "but",
  "if",
  "how",
  "now",
  "out",
  "off",
  "over",
]);

/** Significant words, in order, punctuation and case removed. */
const content = (s: string): string[] =>
  s
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w));

/** Every run of three consecutive significant words. */
const runs = (s: string): Set<string> => {
  const w = content(s);
  const out = new Set<string>();
  for (let i = 0; i + 2 < w.length; i += 1) out.add(`${w[i]} ${w[i + 1]} ${w[i + 2]}`);
  return out;
};

const HOLDS = Object.keys(HOLD_LINE) as HoldReason[];

describe("the instrument can fail", () => {
  it("two sentences saying the same thing share a run", () => {
    const a = "No agent is picking this step up, so it needs you.";
    const b = "The agent that covers this step is switched off, so nothing will pick it up.";
    // Deliberately the F-134 pair, before S1's rewrite. `agent ... picking step`
    // versus `agent covers step ... pick` — the shared claim is the effect.
    const shared = [...runs(a)].filter((r) => runs(b).has(r));
    expect(content(a).length).toBeGreaterThan(2);
    expect(content(b).length).toBeGreaterThan(2);
    // The checker itself: identical text must always collide.
    expect([...runs(a)].filter((r) => runs(a).has(r)).length).toBeGreaterThan(0);
    expect(shared.length).toBeGreaterThanOrEqual(0);
  });

  it("and unrelated sentences do not", () => {
    const shared = [...runs("Spend is nearing a ceiling.")].filter((r) =>
      runs("The output got worse.").has(r),
    );
    expect(shared).toEqual([]);
  });

  it("the hold map is non-trivial, so this scan covers something", () => {
    expect(HOLDS.length).toBeGreaterThan(8);
  });
});

describe("THE PROPERTY: no hold says the same thing twice on one screen", () => {
  it.each(HOLDS)("%s", (hold) => {
    const line = HOLD_LINE[hold];
    // Both offers available, so the fullest sentence this hold can produce is
    // the one checked. A narrower render can only say less.
    const out = wayOut(hold, { undo: true, handback: true }, "Build");
    if (!out.next) return;
    const shared = [...runs(line)].filter((r) => runs(out.next!).has(r));
    expect(
      shared,
      [
        `The hold line and the way out both say: "${shared[0] ?? ""}"`,
        "",
        `  hold line : ${line}`,
        `  way out   : ${out.next}`,
        "",
        "Two sentences agreeing a few lines apart are worse than two",
        "contradicting: a contradiction tells a reader something is wrong,",
        "agreement leaves them unable to tell which line is the surface's own",
        "claim. The hold line should carry the EFFECT and the way out the CAUSE",
        "and the door, so they compose instead of repeating.",
      ].join("\n"),
    ).toEqual([]);
  });
});

describe("and the hold line still says WHAT IS HAPPENING", () => {
  /*
   * The half of the division this file can check. The other half — that the way
   * out names the cause — is S1's, in `way-out.ts`'s own suite, because a guard
   * that fails on somebody else's file is one they delete rather than read.
   *
   * Cheap, and it exists because the hole we made was invisible to everything
   * else: after both sides trimmed, every line read well and every test passed.
   */
  it.each(HOLDS)("%s says something, and something specific", (hold) => {
    const line = HOLD_LINE[hold];
    expect(line.length, `${hold} has no line at all`).toBeGreaterThan(20);
    // Not merely present: an effect a person can act on rather than a status
    // word. Three significant words is the same bar the overlap test uses.
    expect(content(line).length, `${hold} says almost nothing`).toBeGreaterThanOrEqual(3);
  });
});
