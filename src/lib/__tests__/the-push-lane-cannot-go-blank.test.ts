import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * A LANE THAT EMPTIES WHEN A CRON IS QUIET TEACHES PEOPLE IT IS EMPTY.
 *
 * WHAT WAS FOUND. `runInsightPush` rides the two-hourly derive tick and writes
 * push cards into `insights`: a ground shift, a bet contradicted by later
 * evidence, a calibration miss. `getPushedInsights` reads them and
 * `markInsightActioned` settles them. All three had ZERO React callers -- the
 * same shape as `getFocusNext` before tonight. The product was noticing things
 * every two hours and telling nobody.
 *
 * AND WIRING IT UP WOULD HAVE SHIPPED BLANK. The read filtered
 * `pushed_at >= today 00:00 UTC`, which reads as freshness and behaves as
 * fragility. Measured on the live database at the moment of wiring: 51 open,
 * undigested push cards WITH one-click actions, and the most recent push four
 * days old. The surface would have rendered nothing and looked finished doing
 * it, which is the exact failure this repo keeps paying for -- a card designed
 * against an empty table.
 *
 * `status = "open"` is already the freshness rule that matters: a push is open
 * until a person acts on it or waves it off. Ordering newest-first under the
 * same cap keeps the lane small and current without making it depend on a tick
 * having fired in the last few hours.
 */

const SRC = readFileSync(join(import.meta.dir, "..", "brain-insights.functions.ts"), "utf8");

/** The body of the read, so a match elsewhere in a 900-line file cannot stand
 *  in for the query under test. */
const READ = SRC.slice(SRC.indexOf("export const getPushedInsights"));

describe("the push lane reads what is open, not what is from today", () => {
  it("carries no day filter", () => {
    // The specific shape that emptied it. A `gte("pushed_at", <a day>)` makes
    // the lane a function of when a cron last ran rather than of what is
    // unresolved.
    expect(READ.slice(0, 2500)).not.toMatch(/gte\("pushed_at"/);
    expect(READ.slice(0, 2500)).not.toMatch(/dayStart/);
  });

  it("still requires the row to have been pushed at all", () => {
    // Dropping the day filter must not admit rows the push never touched:
    // an insight with no `pushed_at` was never a card.
    expect(READ.slice(0, 2500)).toMatch(/\.not\("pushed_at", "is", null\)/);
  });

  it("keeps open as the freshness rule and the newest first", () => {
    expect(READ.slice(0, 2500)).toMatch(/\.eq\("status", "open"\)/);
    expect(READ.slice(0, 2500)).toMatch(/\.order\("pushed_at", \{ ascending: false \}\)/);
  });

  it("keeps one cap shared with the write side", () => {
    // The read and the write must not drift to two numbers.
    expect(READ.slice(0, 2500)).toMatch(/\.limit\(DAILY_PUSH_CAP\)/);
  });
});

// "the lane can settle a card, not merely show it" left this file (P-14,
// A-QUEUE.md): `components/today/PushedInsights.tsx` was unmounted (zero
// importers, its only caller `components/today/Board.tsx` deleted with it)
// and deleted. The read it settled through, `getPushedInsights`, stays in
// `brain-insights.functions.ts` -- newly uncalled by any UI, left in place
// per this batch's standing rule rather than excised from a shared lib file.
