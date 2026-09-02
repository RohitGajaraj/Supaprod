/**
 * FIFTEEN TRACKS ASLEEP UNTIL OCTOBER HELD EVERY SLOT IN THE SWEEP.
 *
 * ── THE DEFECT (P-03a) ─────────────────────────────────────────────────────
 * F-183 correctly stopped the sweep from SPENDING a drive on a track whose
 * forecast horizon has not arrived. It did not make the track give up its
 * PLACE. Nothing stamped it, so it sorted first by `driven_at ASC` on the next
 * tick, and the one after that, forever -- fetched and filtered out again every
 * ten minutes to prove the same thing.
 *
 * The sweep fetches `MAX_TRACKS_PER_TICK * 3` rows and drives 5. Fifteen
 * permanently-deferred tracks therefore fill the ENTIRE fetch, and a runnable
 * track behind them is never fetched at all -- not delayed, never seen.
 *
 * Two such tracks sat ahead of the live acceptance candidate on 2026-09-03
 * (`4a8f4176` and `b6bc2cf6`, both `needs-evidence` on real workspaces), and on
 * that evening the sweep had five slots and five tracks ahead of it. That is how
 * the honest run went undriven through two ticks while R-30's failure was being
 * diagnosed as something else.
 *
 * ── WHY A COLUMN AND NOT A `driven_at` STAMP ───────────────────────────────
 * Stamping `driven_at` was the cheaper fix and is the wrong one. That column is
 * not only the sweep's ordering key: the Start list reads it to say when a run
 * last moved. Stamping it every ten minutes for a track deliberately asleep
 * until October would make it look busy on the one screen a person actually
 * reads, to fix an ordering problem they cannot see. A wrong sentence on the
 * front door is a worse trade than a column.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import {
  pickDrivable,
  scheduledAwayIds,
} from "@/lib/spine/waiting-on-a-date-is-not-waiting-in-a-queue";

const TICK = readFileSync("src/routes/api/public/hooks/track-tick.ts", "utf8");
const code = TICK.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
const flat = code.replace(/\s+/g, " ");

const MAX_PER_TICK = 5;
const FETCH = MAX_PER_TICK * 3;
const OCTOBER = "2026-10-15T00:00:00Z";
const NOW = new Date("2026-09-03T21:00:00Z");

/** Fifteen tracks asleep until October, then the one that can actually run. */
const asleep = Array.from({ length: FETCH }, (_, i) => ({
  id: `asleep-${i}`,
  last_hold: "needs-evidence" as const,
}));
const runnable = { id: "runnable", last_hold: null };
const dueDates = new Map(asleep.map((t) => [t.id, OCTOBER]));

describe("the fetch itself, which is where the starvation happened", () => {
  it("fifteen deferred tracks fill the whole page, so the runnable one is never fetched", () => {
    /*
     * THE DEFECT, STATED AS THE THING THAT ACTUALLY GOES WRONG. This is not a
     * test of the fix; it is the arithmetic the fix exists to break. The filter
     * below is downstream of a page that already excluded the only track worth
     * driving.
     */
    const page = [...asleep, runnable].slice(0, FETCH);
    expect(page).toHaveLength(FETCH);
    expect(page.some((t) => t.id === "runnable")).toBe(false);
  });

  it("and the filter cannot recover what the page never contained", () => {
    const page = [...asleep, runnable].slice(0, FETCH);
    const away = scheduledAwayIds(page, dueDates, NOW);
    expect(pickDrivable(page, away, MAX_PER_TICK)).toEqual([]);
  });

  it("with the deferred rows excluded in SQL, the runnable one is first", () => {
    // What the fix produces: the deferred rows never reach the page at all, so
    // the page is the runnable work and the first tick drives it.
    const page = [runnable];
    const away = scheduledAwayIds(page, dueDates, NOW);
    expect(pickDrivable(page, away, MAX_PER_TICK).map((t) => t.id)).toEqual(["runnable"]);
  });
});

describe("the sweep asks the database, not the page", () => {
  it("excludes a track deferred past now, in SQL", () => {
    expect(flat).toContain("deferred_until.is.null,deferred_until.lte.");
    expect(flat).toContain("const withoutDeferred = trackQuery.or(deferrable)");
  });

  it("orders the deferred-free query, so the exclusion does not cost the ordering", () => {
    expect(flat).toContain("await ordered(withoutDeferred)");
  });

  it("writes the date down rather than recomputing it every tick", () => {
    /*
     * One write per NEWLY deferred track. In a steady state the SQL above stops
     * fetching the row, so the loop never sees it again until the date passes --
     * which is what makes this cheaper than the over-fetch it replaces rather
     * than an extra cost on top of it.
     */
    expect(flat).toContain(".update({ deferred_until: due }");
    expect(flat).toContain("if (scheduledAway.size > 0)");
  });

  it("defers only to a date it actually read, never to a guess", () => {
    // `dueDatesFor` returns null for a track whose forecast it could not read.
    // Deferring that one to an invented date would hide live work.
    expect(flat).toContain("due: dueByTrack.get(id) ?? null");
    expect(flat).toContain("filter((x): x is { id: string; due: string } => Boolean(x.due))");
  });

  it("a failed defer costs a slot, never the sweep", () => {
    expect(flat).toContain("[track-tick] could not defer");
  });
});

describe("the deferral cannot outlive its reason", () => {
  it("is cleared on every drive, in the one write every path passes", () => {
    /*
     * THE ASSERTION THAT KEEPS THIS COLUMN SAFE. `driveTrackOnce` stamps
     * `driven_at` in fourteen places on the way out; clearing the deferral
     * beside each of them means one gets added without it eventually, and that
     * track goes invisible to the sweep with nothing saying why -- the worst
     * shape this column could fail in.
     *
     * Cleared instead in the `last_driven_via` write near the top, which every
     * path through the function passes before it can decide anything.
     */
    const driver = readFileSync("src/lib/spine/driver.server.ts", "utf8").replace(/\s+/g, " ");
    expect(driver).toContain(".update({ last_driven_via: via, deferred_until: null } as never)");
  });

  it("the driver clears it before it decides anything", () => {
    const driver = readFileSync("src/lib/spine/driver.server.ts", "utf8");
    expect(driver.indexOf("deferred_until: null")).toBeLessThan(
      driver.indexOf("const decision = decideDrive({"),
    );
  });
});

describe("what P-03a did not change", () => {
  it("the filter still runs, so a pre-migration database behaves as it did", () => {
    // The fallback path fetches the deferred rows and `pickDrivable` removes
    // them, which is exactly today's behaviour. One behaviour degrades, never
    // the sweep.
    expect(flat).toContain("const rows = pickDrivable(");
    expect(flat).toContain('if (missingColumn(error, "deferred_until"))');
  });

  it("an unparseable date is still not a future date", () => {
    // Unchanged and worth restating: skipping on a typo would strand a track
    // for ever, which is strictly worse than driving it.
    const away = scheduledAwayIds(
      [{ id: "a", last_hold: "needs-evidence" }],
      new Map([["a", "not a date"]]),
      NOW,
    );
    expect(away.size).toBe(0);
  });

  it("a past horizon is drivable, which is the whole point of the date", () => {
    const away = scheduledAwayIds(
      [{ id: "a", last_hold: "needs-evidence" }],
      new Map([["a", "2026-08-01T00:00:00Z"]]),
      NOW,
    );
    expect(away.size).toBe(0);
  });
});
