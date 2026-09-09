/**
 * A SETTLED LINE IS NOT THE BUTTON YOU PRESSED.
 *
 * The Inbox's settled trail printed `item.approveConsequence` -- the label under
 * the pending card's Approve button -- as the record of a completed judgement:
 *
 *     You approved   Approve · unblocks Build for this spec   2:14 PM
 *
 * Ten past-tense sentences existed for that slot and sat behind a `??` on a
 * field that is never null, so not one had ever rendered. The full account is in
 * `what-your-verdict-caused.ts`.
 *
 * ── WHAT THIS GUARD ASSERTS, AND WHY NOT THE WORDING ────────────────────────
 * Nothing here matches copy. Four structural properties, each of which failed on
 * the code this replaced:
 *
 *   1. every family is answered, both verdicts        (a new kind ships mute)
 *   2. no settled sentence IS a control label         (the actual defect)
 *   3. no settled sentence repeats its own verb       ("You approved · Approved.")
 *   4. the ten declines are not one sentence ten times (they were)
 *
 * All four survive any rewrite of the sentences, which is the property that
 * makes a guard worth keeping.
 */
import { describe, expect, it } from "bun:test";

import { APPROVED, DECLINED, doorToTheRun } from "./what-your-verdict-caused";
import { APPROVAL_KINDS } from "@/lib/approvals-queue.functions";

describe("every family is spoken for", () => {
  it("has an approve sentence and a decline sentence for each of the ten", () => {
    const mute = APPROVAL_KINDS.filter((k) => !APPROVED[k] || !DECLINED[k]);
    expect(mute).toEqual([]);
  });

  it("and adds no key the queue does not have", () => {
    // The mirror: keyed off the real list, so a family retired from the queue
    // cannot leave a sentence behind that nothing can reach.
    const known = new Set<string>(APPROVAL_KINDS);
    expect(Object.keys(APPROVED).filter((k) => !known.has(k))).toEqual([]);
    expect(Object.keys(DECLINED).filter((k) => !known.has(k))).toEqual([]);
  });

  it("covers something, so an empty world cannot pass this file", () => {
    expect(APPROVAL_KINDS.length).toBe(10);
  });
});

describe("a settled sentence is not a control label", () => {
  /* What a control label looks like in this codebase, from all twenty of them:
     "Approve · unblocks Build for this spec". The verb, the card's bullet, an
     infinitive. Any of the three in a settled sentence means the label leaked
     back in. */
  it("never carries the card's bullet separator", () => {
    const withBullet = [...Object.values(APPROVED), ...Object.values(DECLINED)].filter((v) =>
      v.includes("·"),
    );
    expect(withBullet).toEqual([]);
  });

  it("never opens with the verb it is offered under", () => {
    const opensWithOffer = [...Object.values(APPROVED), ...Object.values(DECLINED)].filter((v) =>
      /^(Approve|Reject|Decline)\b/i.test(v),
    );
    expect(opensWithOffer).toEqual([]);
  });
});

describe("a settled sentence does not repeat the verb beside it", () => {
  /*
   * `SettledTrail` draws "You approved" / "You declined" and the sentence on ONE
   * baseline, a couple of words apart. Four of the ten approve sentences were
   * the bare word "Approved.", which is the verb again in a smaller colour --
   * the same restatement S1 and I have been cutting across the run screen.
   *
   * Not a word-match rule: it asks whether the sentence's FIRST content word is
   * the verb's own stem, which is where a restatement lands and where a real
   * consequence never does.
   */
  const firstWord = (s: string) => (s.toLowerCase().match(/[a-z]+/) ?? [""])[0];

  it("no approve sentence leads with approved", () => {
    const echoes = APPROVAL_KINDS.filter((k) => firstWord(APPROVED[k]) === "approved");
    expect(echoes).toEqual([]);
  });

  it("no decline sentence leads with declined or rejected", () => {
    const echoes = APPROVAL_KINDS.filter((k) =>
      ["declined", "rejected"].includes(firstWord(DECLINED[k])),
    );
    expect(echoes).toEqual([]);
  });
});

describe("ten families get ten outcomes", () => {
  /*
   * Every decline in the product printed "Declined. Noted for next time." --
   * family `decision`'s real consequence, generalised to all ten and false of
   * most. This is the assertion that catches a regeneralisation, and it is
   * about DISTINCTNESS rather than wording, so the sentences stay free.
   *
   * Not all ten need be unique for all time: two families could genuinely share
   * an outcome. One sentence covering more than half of them is the shape that
   * means somebody stopped writing, so the bar is set there.
   */
  const distinct = (m: Record<string, string>) => new Set(Object.values(m)).size;

  it("the declines are not one sentence wearing ten keys", () => {
    expect(distinct(DECLINED)).toBeGreaterThan(APPROVAL_KINDS.length / 2);
  });

  it("nor the approvals", () => {
    expect(distinct(APPROVED)).toBeGreaterThan(APPROVAL_KINDS.length / 2);
  });
});

describe("the door only promises what the read supports", () => {
  const run = { trackId: "t-1", title: "Reschedule installer visit from order page" };

  it("says carry on only when the run is known to be live", () => {
    expect(doorToTheRun(true, run)?.lead).toBe("Watch it carry on");
  });

  it("does not say it when the work has finished", () => {
    expect(doorToTheRun(false, run)?.lead).toBe("The run it came from");
  });

  it("and does not say it when we could not tell", () => {
    // `gatesLiveWork`'s own docstring: null must never read as an answer. It is
    // the value on 15 of the 29 pending gates on production today.
    expect(doorToTheRun(null, run)?.lead).toBe("The run it came from");
    expect(doorToTheRun(undefined, run)?.lead).toBe("The run it came from");
  });

  it("carries the run's name in either branch", () => {
    expect(doorToTheRun(true, run)?.title).toBe(run.title);
    expect(doorToTheRun(null, run)?.title).toBe(run.title);
  });

  it("opens the run screen's own url", () => {
    expect(doorToTheRun(true, run)?.href).toBe("/track/t-1");
  });

  it("is no door at all when the run cannot be named", () => {
    // The rule the pending card's door already states: a link with an id behind
    // it and no words on it is not one a person presses. A title still loading,
    // a failed read and a pre-spine gate all land here.
    expect(doorToTheRun(true, { trackId: "t-1", title: null })).toBeNull();
    expect(doorToTheRun(true, { trackId: null, title: "A run" })).toBeNull();
    expect(doorToTheRun(true, null)).toBeNull();
    expect(doorToTheRun(true, undefined)).toBeNull();
  });
});
