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
const LANE = readFileSync(
  join(import.meta.dir, "..", "..", "components", "today", "PushedInsights.tsx"),
  "utf8",
);
const TODAY = readFileSync(
  // EDITED BY S2 IN ANOTHER LANE'S PREFIX, authorised by name in
  // `coordination/answers/S0-A03-land-all-four-in-one-commit-and-the-three-lines-are-authorised.md`.
  // One line, and only the SUBJECT of the assertion: the board moved out of the
  // route file into `src/components/today/Board.tsx`. The claim is untouched.
  join(import.meta.dir, "..", "..", "components", "today", "Board.tsx"),
  "utf8",
);

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

describe("the lane can settle a card, not merely show it", () => {
  it("is mounted on Today", () => {
    // A capability with no door does not exist. This is the third one found
    // tonight and the rule is now cheap to check.
    expect(TODAY).toContain("<PushedInsights />");
    expect(TODAY).toContain('from "@/components/today/PushedInsights"');
  });

  it("offers both outcomes, because a lane you cannot clear is a tray", () => {
    expect(LANE).toMatch(/outcome: "acted"/);
    expect(LANE).toMatch(/outcome: "dismissed"/);
  });

  it("uses the push's own verb rather than inventing one", () => {
    // The write side chose the label when it noticed the thing. Re-deriving a
    // verb here would let the button and the reasoning drift apart.
    expect(LANE).toMatch(/\{i\.action\.label\}/);
  });

  it("puts the card back if the write did not happen", () => {
    // supabase-js RESOLVES a refused write rather than throwing, so an
    // optimistic removal with no rollback would hide a card that is still open.
    expect(LANE).toMatch(/onError:/);

    // THIS USED TO PIN THE LITERAL ["brain", "pushed-insights"], AND THAT LITERAL
    // WAS THE BUG (corrected 2026-08-10). The query key omitted the workspace id
    // while the query function read it, so every workspace shared one cache
    // entry and the lane served the previous workspace's cards after a switch.
    // Fixing that made the hand-written rollback key stop matching the key the
    // optimistic write used -- which would have restored into a different entry
    // and silently eaten the card on exactly the failure this test exists to
    // catch.
    //
    // So the assertion now guards the PROPERTY rather than the string: the
    // rollback must restore through the same `queryKey` binding the optimistic
    // update wrote to. That is what makes them impossible to drift apart, and it
    // stays true no matter what the key is later composed from.
    expect(LANE).toMatch(/setQueryData\(queryKey, ctx\.before\)/);
    // And the key must be scoped to a workspace, so one tenant's cards can never
    // be served under another's heading.
    expect(LANE).toMatch(/const queryKey = \[[^\]]*workspaceId[^\]]*\]/);
    // The hand-written literal must not come back anywhere in the mutation.
    expect(LANE).not.toMatch(/setQueryData\(\["brain", "pushed-insights"\]/);
  });

  it("renders nothing at all when there is nothing", () => {
    // Not an empty heading promising insight that never arrives. Same rule as
    // the gate above it.
    expect(LANE).toMatch(/if \(insights\.length === 0\) return null;/);
  });

  it("routes the kinds the writer actually emits, not the artifact nouns", () => {
    /**
     * THE FIRST MAP MATCHED NOTHING. It switched on `opportunity`, `theme`,
     * `decision`, `prd`, `mission` -- nouns -- while `push_action->>'kind'`
     * carries VERBS. Measured live: 52 cards across seven kinds, zero matches,
     * every card routed to /brain by the fallback. A default that catches
     * everything is indistinguishable from one that catches nothing, which is
     * why it looked fine.
     */
    for (const kind of [
      "open_opportunity",
      "open_decision",
      "open_metric",
      "open_prd",
      "open_theme",
      "start_mission",
      "rerank_bets",
    ]) {
      expect({ kind, handled: LANE.includes(`case "${kind}":`) }).toEqual({ kind, handled: true });
    }
  });

  it("still lands an unknown kind somewhere real", () => {
    // The writer will grow kinds. A lookup that can return undefined renders a
    // link to nowhere; Outcomes holds everything (Brain before P-14a's
    // rename), so it stays the soft landing.
    expect(LANE).toMatch(/default:[\s\S]{0,400}return "\/outcomes";/);
  });

  it("navigates BEFORE it settles, so a wrong destination is recoverable", () => {
    // Settling first marked the card `acted`, and the read returns only `open`
    // rows, so the person could not go back and try again. One click lost the
    // insight permanently.
    const click = LANE.slice(LANE.indexOf("onClick={() => {"));
    const nav = click.indexOf("navigate({ to: targetRoute");
    const settle = click.indexOf('settle.mutate({ id: i.id, outcome: "acted" })');
    expect(nav).toBeGreaterThan(-1);
    expect(settle).toBeGreaterThan(nav);
  });
});
