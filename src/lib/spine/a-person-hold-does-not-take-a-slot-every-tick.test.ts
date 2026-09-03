/**
 * A TRACK WAITING ON A PERSON WAS DRIVEN EVERY TEN MINUTES TO REACH THE SAME NO.
 *
 * The other side of P-03a. A track waiting on a DATE is kept out by
 * `deferred_until`; a track waiting on a PERSON was fetched and driven every
 * tick, costing a slot each time.
 *
 * MEASURED 2026-09-02. `6199f3df` holds `needs-a-waived-station` — Plan is
 * waived on its route, so nothing will file a spec until somebody puts Plan back
 * or files one. Six consecutive sweep drives, 22:50 through 23:40 UTC, every one
 * with zero `agent_runs`, while the live acceptance candidate sat behind it.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import {
  HOLDS_A_PERSON_CLEARS_ELSEWHERE,
  pickDrivable,
  unchangedSinceLastDrive,
} from "@/lib/spine/waiting-on-a-date-is-not-waiting-in-a-queue";
import { TERMINAL_HOLDS } from "@/lib/spine/correction";

const OLD = "2026-08-27T05:30:03Z";
const NEW = "2026-09-02T23:40:04Z";

/** The live shape of `6199f3df`: driven long after it last actually changed. */
const stuck = (over: Record<string, unknown> = {}) => ({
  id: "stuck",
  last_hold: "needs-a-waived-station",
  updated_at: OLD,
  driven_at: NEW,
  pending_gates: [],
  ...over,
});

describe("nothing has changed, so there is nothing to look at", () => {
  it("skips a person-held track whose row has not moved since the last drive", () => {
    expect(unchangedSinceLastDrive(stuck())).toBe(true);
  });

  it("takes it back the moment a person changes the route", () => {
    /*
     * THE HALF THAT MAKES THE SKIP SAFE. `steerRoute` writes `waived` AND
     * `updated_at` in one update, so putting Plan back moves the signal and the
     * next tick picks the track up. Without that this would be a permanent
     * exclusion wearing a temporary one's clothes.
     */
    expect(unchangedSinceLastDrive(stuck({ updated_at: "2026-09-03T00:00:00Z" }))).toBe(false);
  });

  it("never skips a track with an open gate, whatever its dates say", () => {
    /*
     * A1's ruling, and the trap it avoids: a person answering a gate writes to
     * `agent_approvals`, never to `spine_tracks`, so `updated_at` does not move.
     * A skip on the dates alone would strand a track the moment its gate was
     * answered — the exact failure this packet exists to prevent, arriving
     * through its own fix.
     */
    expect(unchangedSinceLastDrive(stuck({ pending_gates: [{ id: "g" }] }))).toBe(false);
  });

  it("keeps the slot when it cannot read either date", () => {
    // A track we cannot judge is not a track we may skip.
    for (const over of [{ driven_at: null }, { updated_at: null }, { driven_at: "nonsense" }]) {
      expect(unchangedSinceLastDrive(stuck(over))).toBe(false);
    }
  });

  it("touches no other hold", () => {
    for (const hold of ["needs-evidence", "waiting-on-a-person", "corrections-spent", null]) {
      expect(unchangedSinceLastDrive(stuck({ last_hold: hold }))).toBe(false);
    }
  });
});

describe("the set is one hold, and every exclusion has a reason", () => {
  it("is needs-a-waived-station, the case that produced the packet", () => {
    expect([...HOLDS_A_PERSON_CLEARS_ELSEWHERE]).toEqual(["needs-a-waived-station"]);
  });

  it("does not include a hold the sweep already excludes as terminal", () => {
    // `given-up`, `station-cannot-finish`, `tools-refused`, `going-in-circles`
    // never reach this filter. Skipping them twice buys nothing and would make
    // the set look broader than it is.
    for (const hold of HOLDS_A_PERSON_CLEARS_ELSEWHERE) {
      expect(TERMINAL_HOLDS).not.toContain(hold);
    }
  });

  it("does not include corrections-spent, which this mechanism cannot see clear", () => {
    /*
     * THE ONE THAT WOULD HAVE STRANDED WORK. `corrections-spent` clears when the
     * missing thing is filed — a write to `prds` and `spine_track_members`, not
     * to `spine_tracks`. `updated_at` never moves, so a skip would be permanent.
     * It is in `HOLD_NEEDS_PERSON`, which is why that set is the wrong list for
     * this question even though it is the right idea.
     */
    expect(HOLDS_A_PERSON_CLEARS_ELSEWHERE).not.toContain("corrections-spent");
  });
});

describe("fifteen held tracks ahead of one runnable", () => {
  it("drives the runnable one on the first tick", () => {
    /*
     * A1'S ACCEPTANCE, and P-03a's own test shape. Fifteen is the whole fetch
     * (MAX_TRACKS_PER_TICK * 3), so before this the runnable track was not
     * delayed — it was never in the page at all.
     */
    const held = Array.from({ length: 15 }, (_, i) => stuck({ id: `held-${i}` }));
    const runnable = { id: "runnable", last_hold: null, updated_at: OLD, driven_at: NEW };
    const page = [...held, runnable];
    const skip = new Set(page.filter((t) => unchangedSinceLastDrive(t as never)).map((t) => t.id));
    expect(skip.size).toBe(15);
    expect(pickDrivable(page, skip, 5).map((t) => t.id)).toEqual(["runnable"]);
  });
});

describe("the sweep actually reads it", () => {
  const TICK = readFileSync("src/routes/api/public/hooks/track-tick.ts", "utf8");
  const DRIVER = readFileSync("src/lib/spine/driver.server.ts", "utf8");

  it("selects updated_at, without which the filter silently never fires", () => {
    /*
     * CAUGHT BEFORE IT SHIPPED, and it is the defect class this repo keeps
     * meeting: `DRIVE_SELECT` did not carry `updated_at`, so the comparison read
     * `undefined`, the filter answered "cannot say", and the skip would have
     * done nothing at all while looking correct.
     */
    expect(DRIVER).toContain('"updated_at," +');
  });

  it("passes both skips to pickDrivable, not one instead of the other", () => {
    const flat = TICK.replace(/\s+/g, " ");
    expect(flat).toContain("new Set([...scheduledAway, ...unchanged])");
  });
});
