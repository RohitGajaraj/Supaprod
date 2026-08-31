import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

import { bucketEmptyLine } from "@/components/today/queue-buckets";

/**
 * A FILTER THAT EXCLUDED EVERYTHING IS NOT AN EMPTY QUEUE.
 *
 * The defect this pins shut shipped on 2026-08-27 and was introduced by the
 * filter row itself, the same day. The board drew its queue behind
 * `focused ? ... : null`, where `focused` is the first VISIBLE item. That guard
 * predates the filter, when "no visible item" had exactly one cause.
 *
 * With a filter, the same condition has two causes, and the guard kept the old
 * meaning: filtering to Gates and settling the last gate deleted the entire
 * section, INCLUDING THE TAB ROW, because the row was rendered inside the
 * branch its own state could delete. What is left is a region title, fifty-two
 * calls still waiting, and no control on screen to reach them. R-20 section 6.
 *
 * S1 sent the rule from `/approvals`, which met this first: "Nothing needs you"
 * and "nothing matches Gates" are different facts and the second must not wear
 * the first's clothes. It is the rule this repo already enforces between
 * loading, empty and failed, one filter across.
 *
 * Two things are asserted, and they are different promises:
 *   - the SENTENCE names the bucket that is empty and the number that is not
 *   - the SECTION is drawn from the unfiltered `items`, so the exit survives
 */

// Subject moved 2026-08-31: the board was lifted out of the route file into
// `src/components/today/Board.tsx`. The CLAIM is unchanged.
const SRC = readFileSync("src/components/today/Board.tsx", "utf8");

describe("the sentence", () => {
  it("names the bucket that is empty AND the work that is not", () => {
    // The second half is the fact the old behaviour destroyed. A person who
    // filtered to Gates and cleared them has not finished their morning, and a
    // screen that implies they have is lying by omission.
    expect(bucketEmptyLine("gates", 52)).toBe(
      "Nothing in Gates is waiting on you. 52 other calls still are.",
    );
  });

  it("agrees with itself about one", () => {
    expect(bucketEmptyLine("proposals", 1)).toBe(
      "Nothing in Proposals is waiting on you. 1 other call still is.",
    );
  });

  it("REFUSES TO CLAIM OTHER WORK FROM A ZERO", () => {
    // The caller only draws this with items outstanding. If that ever stops
    // being true the sentence must shrink, never assert "0 other calls".
    expect(bucketEmptyLine("memory", 0)).toBe("Nothing in Memory is waiting on you.");
  });

  it("uses the bucket's own label, so the tab and the sentence cannot disagree", () => {
    expect(bucketEmptyLine("spend", 3)).toContain("Spend");
  });
});

describe("the section that holds the way out", () => {
  it("IS DRAWN FROM THE UNFILTERED QUEUE, not from the focused item", () => {
    // `{focused ? (<section` is the exact regression, and it reads as harmless.
    expect(SRC).toContain(
      "{items.length > 0 ? (\n                  <section aria-label={FEED_CALLS}",
    );
    expect(SRC).not.toContain("{focused ? (\n                  <section aria-label={FEED_CALLS}");
  });

  it("offers the way back in the state that needs it", () => {
    const at = SRC.indexOf("bucketEmptyLine(activeBucket");
    expect(at).toBeGreaterThan(-1);
    expect(SRC.slice(at, at + 600)).toContain("setBucket(null)");
  });

  it("tells a screen reader, because the list empties after an answer settles", () => {
    const at = SRC.indexOf("bucketEmptyLine(activeBucket");
    expect(SRC.slice(Math.max(0, at - 900), at)).toContain('role="status"');
  });
});

describe("the order says where it stops meaning something", () => {
  it("draws the undated note under the queue it describes", () => {
    expect(SRC).toContain("undatedNote(visibleItems)");
    expect(SRC).toContain("{undatedLine ? (");
  });

  it("READS THE VISIBLE SET, not the whole queue", () => {
    // The note describes the order the person is looking at. Counting undated
    // calls the filter excluded would explain rows that are not on screen.
    expect(SRC).toContain("undatedNote(visibleItems)");
    expect(SRC).not.toContain("undatedNote(items)");
  });

  it("keeps the unplaceable rows IN the queue, so the verbs still reach them", () => {
    // Lifting them into their own list would break `focused`, which resolves
    // through `visibleItems`: Open would set an id the lookup cannot find and
    // fall through to `visibleItems[0]`, opening a different call.
    const memo = SRC.slice(SRC.indexOf("const visibleItems"), SRC.indexOf("const undatedLine"));
    expect(memo).not.toContain("waitingSince(a.timestamp) === null ?");
    expect(memo).toContain("return at - bt;");
  });
});

describe("one group, one name", () => {
  /*
   * The board named its review queue three times inside ~170px:
   *
   *   "52 decisions are ready for your review."   headline
   *   "What needs you"                            region title
   *   "READY FOR YOUR REVIEW  52"                 group head
   *   "All 52  Proposals 37  Gates 10 ..."        filter row
   *
   * Four elements, three saying 52, two saying "ready for your review".
   * `AppFrame` states the rule and its own live line was fixed for it the same
   * day: no third statement of one fact inside 100 pixels.
   *
   * TWO WRONG ANSWERS CAME FIRST and are worth recording, because both looked
   * obviously correct in source. Drawing the head only when something was
   * settled, then only when the region held another group, both treated this as
   * a question about SIBLINGS. It is a question about the HEADLINE. The second
   * was the worse of the two: the crew lanes almost always have rows, so it
   * restored the duplication on every ordinary board while reading as a fix.
   */
  it("does not head the calls group at all", () => {
    expect(SRC).not.toContain("<FeedHead name={FEED_CALLS}");
  });

  it("KEEPS THE ACCESSIBLE NAME UNCONDITIONALLY", () => {
    // Dropping a visible duplicate must never cost the one reader who cannot
    // see the region title above it.
    expect(SRC).toContain("<section aria-label={FEED_CALLS}");
  });

  it("leaves the count reachable, on the filter row's All", () => {
    /* ASSERTED ON THE PIECES, NOT THE LINE. This pinned the exact one-line
       JSX, so making the same control honest about a bounded read - it now
       carries a "+" when `incomplete` is non-empty - broke a case whose subject
       is that the COUNT survived the group head's removal. The subject is the
       count being on the All tab; how that tab is formatted is not it. */
    const at = SRC.indexOf("aria-pressed={activeBucket === null}");
    expect(at).toBeGreaterThan(-1);
    const tab = SRC.slice(at, at + 700);
    expect(tab).toContain("All");
    expect(tab).toContain("{items.length}");
  });

  it("leaves the sibling lanes their heads, which is what separates them", () => {
    // The unlabelled group is the one the region title is about; the labelled
    // ones are the departures from it.
    expect(SRC).toContain("FEED_REPLY");
    expect(SRC).toContain("FEED_LIVE");
    expect(SRC).toContain("FEED_OPEN");
  });
});
