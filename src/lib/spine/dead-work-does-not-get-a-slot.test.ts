/**
 * A track that can never move must not hold a slot in the sweep.
 *
 * The tick drives the five least-recently-driven open tracks. `given-up` and
 * `station-cannot-finish` are the two holds no code path clears —
 * `RESUMABLE_HOLDS`'s own paragraph says why: *"neither asked for anything, so
 * nothing can arrive that would make a retry justified."* `decideDrive` refuses
 * them on sight, so every slot one of them occupies is a slot spent proving that
 * again.
 *
 * MEASURED 2026-08-24 23:50 UTC, on the live workspace, while driving the first
 * real end-to-end attempt. The workspace held **five `given-up` tracks and one
 * live one**. All five slots went to the dead work, the live track sorted sixth,
 * and it **was not driven that tick at all**. The tick reported `ok` in 500ms.
 *
 * It is a halving rather than a freeze — a refused track is still stamped, so it
 * sorts to the back and the live one comes round on the next tick — and that is
 * what makes it worth a test rather than a shrug: **it is invisible.** Nothing
 * anywhere reports "this tick drove nothing because everything it picked was
 * already dead."
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "bun:test";

import { RESUMABLE_HOLDS, TERMINAL_HOLDS } from "./correction";
import { decideDrive, HOLD_LINE, type HoldReason } from "./driver";

const TICK_SRC = readFileSync(
  fileURLToPath(new URL("../../routes/api/public/hooks/track-tick.ts", import.meta.url)),
  "utf8",
);

describe("which holds are terminal", () => {
  /**
   * `tools-refused` joined on 2026-08-25 (F-41) and is the odd one of the three.
   *
   * The first two are terminal because **neither asked for anything**, so
   * nothing can arrive that would justify a retry. This one asks loudly — for a
   * working credential — and is still terminal for the SWEEP, because
   * `RESUMABLE_HOLDS` resumes by re-checking whether an ask has been met, and
   * *"is GitHub reachable again"* can only be answered by dispatching a paid
   * run. A resumable version would spend an agent every tick to be told no.
   *
   * So the rule this list encodes is not "nothing clears it" but **"the sweep
   * cannot tell when it clears"**, and a person restarting the work is the
   * honest contract. `HOLD_LINE["tools-refused"]` says exactly that and is
   * asserted not to promise a retry.
   *
   * `going-in-circles` joined 2026-08-25 (F-43) for a third reason again: it CAN
   * be re-tested cheaply, and re-testing it is precisely the waste. A station
   * dispatched twelve times without moving is not going to move on the
   * thirteenth, and 316 dispatches on one track is what the absence of this
   * hold cost.
   */
  it("is the two that nothing clears, plus the two the loop must stop paying for", () => {
    expect([...TERMINAL_HOLDS]).toEqual([
      "given-up",
      "station-cannot-finish",
      "tools-refused",
      "going-in-circles",
    ]);
  });

  /**
   * The two sets are complements on this point, and pinning it means a hold
   * added to one can never be quietly added to the other. A resumable hold that
   * got excluded from the sweep would strand work permanently, which is a far
   * worse failure than the one being fixed.
   */
  it("never overlaps the holds a person can answer", () => {
    for (const hold of TERMINAL_HOLDS) {
      expect(RESUMABLE_HOLDS.has(hold)).toBe(false);
    }
  });

  it("names holds the product actually has", () => {
    for (const hold of TERMINAL_HOLDS) {
      expect(HOLD_LINE[hold as HoldReason]).toBeTruthy();
    }
  });

  /**
   * The premise: the driver already refuses these, which is what makes skipping
   * them safe rather than a behaviour change. If a terminal hold ever became
   * actionable, this fails and the exclusion has to be revisited.
   */
  it("is refused by the driver anyway, so excluding it changes nothing but cost", () => {
    for (const hold of TERMINAL_HOLDS) {
      const d = decideDrive({
        paused: false,
        station: "decide",
        title: "t",
        origin: "o",
        pendingApprovals: 0,
        attempts: 3,
        lastHold: hold as HoldReason,
      });
      expect(d.act).toBe(false);
    }
  });
});

describe("the sweep's filter", () => {
  it("excludes the terminal holds", () => {
    expect(TICK_SRC).toContain("TERMINAL_HOLDS");
    expect(TICK_SRC).toContain("last_hold.neq.");
  });

  /**
   * THE BUG THIS ALMOST SHIPPED WITH, pinned so it cannot come back.
   *
   * A healthy track carries `last_hold = NULL`, and in SQL `NULL <> 'x'` is NULL
   * rather than true. So a bare `not.eq` / `not.in` filter excludes every
   * healthy track and leaves the sweep driving only work that has already
   * failed — the precise inversion of the intent. The `is.null` arm is what
   * keeps ordinary work in the sweep, and it is load-bearing, not padding.
   */
  it("keeps tracks whose hold is NULL, which is every healthy one", () => {
    expect(TICK_SRC).toContain("last_hold.is.null,and(");
  });

  it("does not use a bare negation that NULL would fail", () => {
    expect(TICK_SRC).not.toContain('.not("last_hold", "eq"');
    expect(TICK_SRC).not.toContain('.not("last_hold", "in"');
  });

  /**
   * Verified against the live database the night it was written:
   *
   *   SELECT id, last_hold FROM spine_tracks
   *    WHERE status='open'
   *      AND workspace_id NOT IN (SELECT id FROM workspaces WHERE is_sample)
   *      AND (last_hold IS NULL
   *           OR (last_hold <> 'given-up' AND last_hold <> 'station-cannot-finish'))
   *    ORDER BY driven_at ASC NULLS FIRST LIMIT 6;
   *
   * returned exactly one row — the live track, holding `produced-nothing` — and
   * excluded all five `given-up` ones. Recorded here because a filter is only
   * as good as the rows it was tried against.
   */
  it("was checked against real rows, not only against its own shape", () => {
    expect(TICK_SRC).toContain("MEASURED 2026-08-24 23:50 UTC");
  });
});
