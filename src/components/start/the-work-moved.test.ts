/**
 * ── THE ONE THING THIS PRODUCT EXISTS TO DO, AND THE HOME COULD NOT SAY IT ─
 *
 * The home answers four questions since you last looked: what is WAITING, what
 * ARRIVED, what SHIPPED, what was LEARNED. **None of them is "your work
 * moved."**
 *
 * MEASURED 2026-09-10. The loop had dispatched nothing for nineteen hours. At
 * 23:00 UTC a track stuck since 2026-09-06 was driven, its planner completed,
 * and it moved `define -> design`; `stage_events` recorded it at 23:01:39. That
 * was the most significant event in the product that day, on the founder's own
 * workspace — and a person returning to the home would have seen a road in a
 * different shape and no sentence anywhere saying anything had happened.
 *
 * A road shows the new STATE. It cannot show the CHANGE, because it has nothing
 * to compare against. Only "since you last looked" knows that.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { movedOn, theWorkMoved, type Move } from "./the-work-moved";

const m = (from: string | null, to: string, title: string, at: string): Move => ({
  from,
  to,
  title,
  at,
});
const SINCE = "2026-09-09T12:00:00Z";
const AFTER = "2026-09-09T23:01:39Z";
const BEFORE = "2026-09-08T09:00:00Z";

describe("which way the work went", () => {
  it("counts a step along the road as forward", () => {
    // The real one: define -> design, 2026-09-09 23:00 UTC.
    expect(movedOn(m("define", "design", "Warn a homeowner", AFTER))).toBe(true);
  });

  it("counts a track entering its first station as forward", () => {
    /*
     * `from` is null when nothing preceded it. Treating that as "not forward"
     * would silence the most encouraging line the home can draw: the first
     * time a sentence somebody typed became work.
     */
    expect(movedOn(m(null, "sense", "A new run", AFTER))).toBe(true);
  });

  it("does not count a send-back", () => {
    expect(movedOn(m("build", "define", "Sent back", AFTER))).toBe(false);
  });

  it("does not count a station it cannot place", () => {
    // A stage this build has never heard of is not evidence of progress.
    expect(movedOn(m("design", "somewhere-else", "Unknown", AFTER))).toBe(false);
  });
});

describe("what moved since you last looked", () => {
  it("names the run and the station when exactly one moved", () => {
    /*
     * NAMED, NOT COUNTED. "One run moved on" is a tally; the title and the
     * station are the product telling you what it did.
     */
    expect(
      theWorkMoved({ moves: [m("define", "design", "Warn a homeowner", AFTER)], since: SINCE }),
    ).toEqual({ kind: "one", title: "Warn a homeowner", station: "Design" });
  });

  it("counts them once there are several", () => {
    const moves = [
      m("define", "design", "A", AFTER),
      m("sense", "decide", "B", AFTER),
      m("design", "build", "C", AFTER),
    ];
    expect(theWorkMoved({ moves, since: SINCE })).toEqual({ kind: "many", forward: 3 });
  });

  it("never folds a send-back into the forward count", () => {
    /*
     * A run moving on is the loop working; a run sent BACK is a correction.
     * "4 runs moved" over three forward and one backward is the flattering
     * kind of true, and this product has paid for that shape before.
     */
    const moves = [
      m("define", "design", "A", AFTER),
      m("sense", "decide", "B", AFTER),
      m("build", "define", "C", AFTER),
    ];
    expect(theWorkMoved({ moves, since: SINCE })).toEqual({ kind: "many", forward: 2 });
  });

  it("says a send-back on its own, because it is the one you may want to argue with", () => {
    expect(theWorkMoved({ moves: [m("build", "define", "C", AFTER)], since: SINCE })).toEqual({
      kind: "back",
      sentBack: 1,
    });
  });

  it("ignores anything that happened before the last look", () => {
    expect(theWorkMoved({ moves: [m("define", "design", "Old", BEFORE)], since: SINCE })).toEqual({
      kind: "none",
    });
  });
});

describe("the two silences, which are not zeroes", () => {
  it("says nothing when the read did not answer", () => {
    /* A refused read is not "nothing moved". Same fail direction as every
       other answer on this line-up. */
    expect(theWorkMoved({ moves: null, since: SINCE })).toEqual({ kind: "none" });
  });

  it("says nothing when the record cannot say when you last looked", () => {
    /*
     * Without a `since` the honest answer is nothing, not "everything ever" —
     * `arrivingAnswer` holds the same rule for the same field, and a person who
     * has never opened this has not "seen nothing new".
     */
    expect(theWorkMoved({ moves: [m("define", "design", "Real", AFTER)], since: null })).toEqual({
      kind: "none",
    });
  });

  it("keeps the null guard EXPLICIT, because the behaviour alone cannot prove it", () => {
    /*
     * ── A TEST THAT CANNOT FAIL IS NOT PROTECTION, AND THIS ONE COULD NOT ────
     *
     * Proved by firing, 2026-09-10: deleting `!input.since` from the early
     * return changes NOTHING the assertion above can see. `"2026-09-09T…" >
     * null` coerces the string to NaN and null to 0, so the filter drops every
     * row regardless and the result is `{ kind: "none" }` either way.
     *
     * The behavioural test therefore passes for a reason that has nothing to do
     * with the rule it is named after. The guard is still worth having — it
     * states the intent, and it stops the day somebody changes the comparison
     * to something that does NOT coerce away — so what is asserted here is that
     * it exists, and this comment says why the assertion above is not enough.
     */
    const src = readFileSync(join(import.meta.dir, "the-work-moved.ts"), "utf8");
    expect(src).toContain('if (!input.moves || !input.since) return { kind: "none" };');
  });
});

/*
 * ── TRACKS, NOT MOVES, AND THE LOOP WALKING IS WHAT EXPOSED IT ────────────
 *
 * The first version counted forward MOVES. Then the loop started walking:
 * `a30d6b62` went `define -> design -> build` in twenty minutes, three drives
 * on ONE track — and it would have said **"3 runs moved on"** about a single
 * piece of work.
 *
 * That is the same defect the run screen was repaired for the same night: "67
 * findings" where there were four, logged seventeen times each. A count of
 * EVENTS wearing the clothes of a count of THINGS.
 *
 * And the fold gives the better sentence as well as the true one. A track that
 * moved three times has not done three things; it has got to Build.
 */
describe("one track walking is one run, at its furthest station", () => {
  const walk = [
    m("plan", "define", "Warn a homeowner", "2026-09-09T23:00:05Z"),
    m("define", "design", "Warn a homeowner", "2026-09-09T23:10:03Z"),
    m("design", "build", "Warn a homeowner", "2026-09-09T23:20:00Z"),
  ];

  it("says one run, not three", () => {
    expect(theWorkMoved({ moves: walk, since: SINCE })).toEqual({
      kind: "one",
      title: "Warn a homeowner",
      station: "Build",
    });
  });

  it("names the FURTHEST station, whatever order the read returns", () => {
    /*
     * The read is newest-first today. A caller that reversed it must not
     * silently change which station is reported, so the fold takes the later
     * timestamp rather than trusting arrival order.
     */
    const reversed = [...walk].reverse();
    expect(theWorkMoved({ moves: reversed, since: SINCE })).toMatchObject({ station: "Build" });
  });

  it("counts two tracks as two, however many times each moved", () => {
    const two = [...walk, m("sense", "decide", "Another run", "2026-09-09T23:05:00Z")];
    expect(theWorkMoved({ moves: two, since: SINCE })).toEqual({ kind: "many", forward: 2 });
  });

  it("folds send-backs by track too", () => {
    // The mirror on the other branch: a track bounced twice is one correction
    // to argue with, not two.
    const bounced = [
      m("build", "define", "Sent back", "2026-09-09T23:00:00Z"),
      m("define", "sense", "Sent back", "2026-09-09T23:05:00Z"),
    ];
    expect(theWorkMoved({ moves: bounced, since: SINCE })).toEqual({ kind: "back", sentBack: 1 });
  });
});

/*
 * ── THE STATION'S OWN NAME, NEVER ITS KEY ─────────────────────────────────
 *
 * `stage_events.to_stage` holds the driver's key, and the served page read
 * **"reached build."** for fifteen minutes because this line passed it
 * straight through. Every other surface goes through `AGENT_STATIONS`.
 *
 * The sharpest case is `sense`, because of the founder's 2026-08-01 ruling
 * that the first station is called **Discover** on every surface with no
 * exceptions — a key reaching a person there is not merely ugly, it is a name
 * the product does not use.
 */
describe("the station is named the way the product names it", () => {
  it("says Discover, never `sense`", () => {
    expect(
      theWorkMoved({ moves: [m(null, "sense", "A new run", AFTER)], since: SINCE }),
    ).toMatchObject({ station: "Discover" });
  });

  it("says Plan, never `define`", () => {
    expect(
      theWorkMoved({ moves: [m("decide", "define", "A run", AFTER)], since: SINCE }),
    ).toMatchObject({ station: "Plan" });
  });

  it("never puts a raw key in front of a person", () => {
    /* THE MIRROR, over every key the driver can write. A station whose name
       equals its key would hide a regression here, so this asserts on the
       ones where they DIFFER. */
    /* The `from` has to PRECEDE the `to` or the move is a send-back and carries
       no station at all -- which is what my first version of this loop got
       wrong, by reusing one `from` for both. */
    for (const [from, key, expected] of [
      [null, "sense", "Discover"],
      ["decide", "define", "Plan"],
    ] as const) {
      const out = theWorkMoved({ moves: [m(from, key, "A run", AFTER)], since: SINCE });
      expect({ key, station: (out as { station?: string }).station }).toEqual({
        key,
        station: expected,
      });
    }
  });
});
