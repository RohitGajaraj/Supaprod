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

const SRC = readFileSync("src/routes/_authenticated.today.tsx", "utf8");

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
