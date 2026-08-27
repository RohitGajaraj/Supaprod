import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

/**
 * THE ONE LANE THAT SORTS OLDEST FIRST, AND WHY IT MUST KEEP DOING IT.
 *
 * ── THE DEFECT THIS PINS SHUT ──────────────────────────────────────────────
 * Every lane on the board sorted newest-first, which is right for two of them
 * and backwards for the third. Running and Finished are about work in motion,
 * where recency is the story. **Waiting-on-you is the opposite: nothing in it
 * moves until a person acts, so the longer a thing has sat the more it needs
 * them.**
 *
 * Sorting it newest-first put the freshest arrival on top, and because the lane
 * caps at three standing rows and folds the rest behind an overflow control,
 * the oldest item was the last row of a list nobody opens. Measured against the
 * live database on 2026-08-27: **the oldest gate in this workspace had been
 * waiting 33 days**, and it sorted to the bottom.
 *
 * The brief's words for this lane are *"sorted by what needs a person soonest"*.
 * Recency is not that, and the surface said the opposite of its own purpose.
 *
 * ── WHY THE MERGE IS ASSERTED SEPARATELY ───────────────────────────────────
 * Fixing the two source lists is not enough and the first attempt at this
 * change proved it. `allReplyRows` concatenates three sources: blocked missions
 * (windowed to 24 hours at the time, unwindowed since), gated sessions and
 * spine tracks. Concatenation preserves source order,
 * so every gated row landed after every mission row whatever its age, and the
 * 33-day gate still sorted below a mission blocked ten minutes ago. **A sorted
 * input into an unsorted merge is a decorative sort.**
 *
 * ── WHY THIS READS SOURCE RATHER THAN RENDERING ────────────────────────────
 * The comparators are inline in the route's memos, which is where they belong:
 * they are three lines, and extracting them into a module to make them
 * importable would add a file to make a test convenient rather than to make the
 * code better. `today-states-its-wait.test.ts` already establishes reading this
 * route's source as the way to pin a contract that lives in its structure.
 *
 * The cost is honest and worth stating: this asserts the comparator is WRITTEN,
 * not that the rendered list is ordered. A change that kept the line and broke
 * the order some other way would pass. It stops the specific regression that
 * has already happened once, which is a future session reading `a.at - b.at`
 * as a typo and "fixing" it.
 */

const SRC = readFileSync("src/routes/_authenticated.today.tsx", "utf8");

/** Text of the memo that builds `name`, up to the end of its sort call. */
function memoFor(name: string): string {
  const start = SRC.indexOf(`const ${name} = React.useMemo`);
  expect(start, `${name} memo not found`).toBeGreaterThan(-1);
  const end = SRC.indexOf("\n  );", start);
  return SRC.slice(start, end === -1 ? start + 4000 : end);
}

describe("the waiting lane puts the oldest first", () => {
  it("sorts blocked missions oldest first", () => {
    expect(memoFor("replyRows")).toContain("a.at - b.at");
  });

  it("sorts gated runs oldest first, and they are the ones that can be weeks old", () => {
    expect(memoFor("gatedRows")).toContain("a.at - b.at");
  });

  it("RE-SORTS THE MERGE, because a sorted input into an unsorted merge is decorative", () => {
    const merged = memoFor("allReplyRows");
    expect(merged).toContain("a.at - b.at");
    expect(merged).toContain("...replyRows");
    expect(merged).toContain("...gatedRows");
  });

  it("leaves the lanes where recency IS the story sorting newest first", () => {
    // Not a style rule. Running and Finished describe work in motion, and the
    // newest thing that happened is the one a person wants first there.
    expect(memoFor("liveRows")).toContain("b.at - a.at");
  });

  it("is fed by the UNWINDOWED set, so the sentence is no longer needed", () => {
    /*
     * SUPERSEDED, and worth recording rather than deleting. This asserted the
     * lane said "This lane shows the last 24 hours", which was an honest
     * stopgap while the lane could not show older work.
     *
     * The lane no longer windows, so that sentence would now be false. Blocked
     * work does not age out, and the window also put this lane's own head (1)
     * against the station strip above it (89) counting the same population
     * without one, which use-spine-strip.ts records as a screen that "reads as
     * a contradiction".
     */
    expect(SRC).toContain("const blockedAll");
    expect(SRC).not.toContain("This lane shows the last 24 hours");
  });
});
