import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  EXAMPLE_SENTENCES,
  WHAT_IT_DOES,
  entryHasNothingToSay,
} from "./nobody-owned-the-empty-entry";

/** Every region answered, and every one of them came up empty. */
const EMPTY = {
  lead: "nothing" as const,
  runs: [],
  bets: [],
  waiting: 0,
  hasEvidence: false,
};

describe("who owns the entry when every region correctly says nothing", () => {
  it("owns it only when all five reads have answered empty", () => {
    expect(entryHasNothingToSay(EMPTY)).toBe(true);
  });

  it("never claims the screen while any read is unread or refused", () => {
    /*
     * THE FAILURE MODE THIS PRODUCT KEEPS PAYING FOR: a null read as 0, a
     * refused read wearing an empty state's clothes. Introducing the product
     * over a workspace with a year of runs, for the beat a query takes, is the
     * flash the hero one slot up has been repaired for twice.
     */
    for (const key of ["lead", "runs", "bets", "waiting", "hasEvidence"] as const) {
      expect({ key, owns: entryHasNothingToSay({ ...EMPTY, [key]: null }) }).toEqual({
        key,
        owns: false,
      });
    }
  });

  it("stands down the moment any region has something of its own to draw", () => {
    const cases: ReadonlyArray<[string, Parameters<typeof entryHasNothingToSay>[0]]> = [
      ["a call is waiting", { ...EMPTY, lead: "call" }],
      ["a run is on screen", { ...EMPTY, lead: "run" }],
      ["runs exist", { ...EMPTY, runs: [{}] }],
      ["the director has a bet", { ...EMPTY, bets: [{}] }],
      ["the queue holds something", { ...EMPTY, waiting: 1 }],
      ["evidence has arrived", { ...EMPTY, hasEvidence: true }],
    ];
    for (const [why, input] of cases) {
      expect({ why, owns: entryHasNothingToSay(input) }).toEqual({ why, owns: false });
    }
  });
});

describe("the sentence about the product", () => {
  it("names no station and no orchestration word", () => {
    /*
     * Founder's instruction: station names and orchestration concepts are
     * INTERNAL unless showing them helps the user. The sentence this replaces
     * opened "Seven stations take one sentence from evidence to shipped", which
     * asks a stranger to learn this product's machine vocabulary in the first
     * thing they read.
     */
    for (const word of [
      "station",
      "Station",
      "spine",
      "track",
      "mission",
      "sweep",
      "driver",
      "seat",
      "orchestrat",
      "pipeline",
      "workflow",
    ]) {
      expect({ word, present: WHAT_IT_DOES.includes(word) }).toEqual({ word, present: false });
    }
  });

  it("promises only what a finished run actually draws", () => {
    /*
     * Read off the served product, `/track/d1168015…`, a run that reached the
     * end of its road: the page carried findings, a recorded call with its
     * forecast, a spec, a prototype, "PR #1", a release line, and a verdict of
     * `missed` measured against the spec's own threshold.
     *
     * So each noun below is clickable evidence rather than a capability claim,
     * which is the bar in-product copy has to clear here.
     */
    for (const promised of ["evidence", "decision", "spec", "design", "code", "release"]) {
      expect({ promised, said: WHAT_IT_DOES.includes(promised) }).toEqual({ promised, said: true });
    }
    /* And it says the loop is graded, which is the whole claim. */
    expect(WHAT_IT_DOES).toContain("grades");
    /* And that a person is asked only at a boundary, which is the other half. */
    expect(WHAT_IT_DOES).toContain("the call is yours");
  });

  it("makes no claim about scale, quality or speed", () => {
    /* The repo's rule for outward copy, which applies harder in-product: lead
       with a verifiable mechanism, never a category word or a volume claim. */
    for (const puff of [
      "best",
      "fastest",
      "instantly",
      "seamless",
      "enterprise",
      "world-class",
      "10x",
      "revolutionary",
      "effortless",
    ]) {
      expect({ puff, present: WHAT_IT_DOES.toLowerCase().includes(puff) }).toEqual({
        puff,
        present: false,
      });
    }
  });
});

describe("the example sentences", () => {
  it("teaches a shape rather than naming a domain nobody here owns", () => {
    /*
     * The reason the previous three were retired: "an example about a checkout
     * the person does not have taught nothing." Whatever stands in this slot
     * must not name somebody else's product, industry or feature.
     *
     * `example-jobs-name-no-domain.test.ts` holds the same line for the cards
     * beside these, so the two cannot drift.
     */
    for (const { sentence } of EXAMPLE_SENTENCES) {
      for (const domain of [
        "checkout",
        "homeowner",
        "installer",
        "meter",
        "outage",
        "firmware",
        "savings goal",
        "delivery address",
      ]) {
        expect({ sentence, domain, names: sentence.toLowerCase().includes(domain) }).toEqual({
          sentence,
          domain,
          names: false,
        });
      }
    }
  });

  it("covers the three shapes a person actually arrives with", () => {
    /* Something is broken, something should be better, something is unknown.
       Each carries its own shape so a bug report is never sent through
       discovery, which `ComposerRoutePicker` exists to prevent. */
    expect(EXAMPLE_SENTENCES.map((e) => e.shape).sort()).toEqual([
      "incident-fix",
      "interface-change",
      "new-capability",
    ]);
  });

  it("states an outcome, never a task for a person", () => {
    for (const { sentence } of EXAMPLE_SENTENCES) {
      /* No ticket language, and nothing that reads as an instruction to a
         teammate rather than an outcome for the product. */
      for (const banned of ["ticket", "jira", "assign", "please", "ASAP", "sprint"]) {
        expect({ sentence, banned, present: sentence.toLowerCase().includes(banned) }).toEqual({
          sentence,
          banned,
          present: false,
        });
      }
      /* Short enough to read at a glance and to fit one line in the card. */
      expect(sentence.length).toBeLessThan(64);
      expect(sentence.length).toBeGreaterThan(20);
    }
  });
});

/*
 * ── THE WIRING, PINNED FROM THE ROUTE ITSELF ──────────────────────────────
 *
 * A pure rule with no caller is what `route.ts` documents three of, and this
 * one exists to close a state a person actually lands on. So the route is read
 * as text and asserted to mount it, the same instrument
 * `the-entry-leads-with-one-piece-of-work.test.ts` uses on its own claims.
 */
describe("the entry mounts the owner", () => {
  const ROUTE = readFileSync(
    join(import.meta.dir, "..", "..", "routes", "_authenticated.start.tsx"),
    "utf8",
  );

  it("is mounted on the entry, and gated on the rule", () => {
    expect(ROUTE).toContain("<WhatThisDoes");
    expect(ROUTE).toContain("<FirstLookExamples");
    expect(ROUTE).toContain("entryHasNothingToSay");
  });

  it("says what the machine is ABOVE the box, and offers examples BELOW it", () => {
    /*
     * ── THE SPLIT, AND WHY IT IS THE THING WORTH PINNING ──────────────────
     *
     * The first version was one block above the composer, and driving it in a
     * browser on the empty workspace showed the cost: the screen carried five
     * regions all saying a version of "say a sentence", two of them at
     * `text-mrd-h1`, plus SIX example cards in two grids once `StarterRuns`
     * landed its own three. The fix for the founder's "dump of data" had
     * reproduced it.
     *
     * So the halves are placed by what they are for, and this is the order:
     * the sentence sits above the box because it frames it, and the examples
     * sit below because pressing one fills the box above them.
     */
    const says = ROUTE.indexOf("<WhatThisDoes");
    const composer = ROUTE.indexOf("<Composer");
    const examples = ROUTE.indexOf("<FirstLookExamples");
    expect(says).toBeGreaterThan(-1);
    expect(composer).toBeGreaterThan(-1);
    expect(examples).toBeGreaterThan(-1);
    expect(says).toBeLessThan(composer);
    expect(examples).toBeGreaterThan(composer);
  });

  it("never shows two sets of example cards", () => {
    /*
     * `StarterRuns` writes three sentences from THIS product's own one-liner, so
     * where it draws it beats a generic example outright and the generic three
     * must stand down. One hoisted condition, read by both, because two copies
     * of it is how they would drift back into drawing six cards.
     */
    expect(ROUTE).toContain("const startersWillDraw");
    expect(ROUTE).toContain("entryEmpty && !startersWillDraw");
    /* And the StarterRuns site reads the same variable rather than re-deriving
       it. One `startersStand(` call remains, inside the hoist. */
    expect(ROUTE.match(/startersStand\(/g)?.length).toBe(1);
  });

  it("stands the empty-queue panel down, so the page carries one headline", () => {
    /* `TheCallInFront`'s `nothing` branch draws "Nothing is waiting on you." at
       h1 with a paragraph under it. Correct for an operator whose queue is
       clear; furniture on a workspace where nothing exists at all, and it put a
       second h1 200px from the hero's. */
    expect(ROUTE).toContain("{entryEmpty ? null : (");
    /* The hero's own first-visit line stands down for the same reason. */
    expect(ROUTE).toContain("introduced: entryEmpty");
  });
});
