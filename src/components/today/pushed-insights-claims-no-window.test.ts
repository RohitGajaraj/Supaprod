import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

/**
 * A HEADING MAY NOT NAME A PERIOD THIS PRODUCT CANNOT MEASURE.
 *
 * The panel read "What changed while you were away". That is a claim about a
 * window between two moments - when you last looked, and now - and the FIRST
 * of those does not exist. `when.ts` says so in as many words: there is no
 * per-user last-seen watermark in this database.
 *
 * The read has no time filter either. `getPushedInsights` selects
 * `status = 'open'` and `digest = false`, ordered by `pushed_at`. An insight
 * pushed three weeks ago that nobody answered is in that list, under a heading
 * saying it changed while you were away.
 *
 * Same defect as the board's "In the last 24 hours" subtitle, fixed the same
 * week on the same surface. The idea behind both is right and still
 * unbuildable: it is a column to add, not a claim to keep making loosely.
 */

const READ = readFileSync("src/lib/brain-insights.functions.ts", "utf8");

// "the heading" and "the subtitle" left this file (P-14, A-QUEUE.md):
// both checked `components/today/PushedInsights.tsx`'s own copy, and that
// component was unmounted (zero importers, its only caller
// `components/today/Board.tsx` deleted with it) and deleted. The read it
// described stays live below -- `getPushedInsights` is newly uncalled by any
// UI but left in `brain-insights.functions.ts` per this batch's standing rule.

describe("the read it describes", () => {
  it("HAS NO TIME FILTER, which is why the window was unbackable", () => {
    // If this ever grows one, the heading may be revisited - but a `.gte` on
    // `pushed_at` still would not be "since you last looked".
    const at = READ.indexOf('.from("insights")');
    expect(at).toBeGreaterThan(-1);
    const q = READ.slice(at, at + 400);
    expect(q).toContain('.eq("status", "open")');
    expect(q).not.toContain(".gte(");
  });
});
