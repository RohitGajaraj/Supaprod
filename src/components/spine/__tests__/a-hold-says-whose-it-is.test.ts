/**
 * A GATE WAITING ON YOU MUST NOT WEAR THE TOKEN THAT MEANS IT IS NOT ON YOU.
 *
 * ── THE DEFECT ──────────────────────────────────────────────────────────
 * `TrackStart.tsx` painted the station chip `tone={t.hold ? "hold" : "quiet"}`.
 * Amber for every hold, including `waiting-on-a-person`. Amber means stopped and
 * NOT on you, so the one hold that IS a person was rendering in the token that
 * says it is somebody else's problem. That is the single distinction orchid and
 * amber exist to draw, inverted for the case where it matters most.
 *
 * ── WHY THESE ASSERTIONS ARE BY REASON AND NOT BY CLASS NAME ─────────────
 * The item's own acceptance asks for the classification to be pinned by REASON,
 * so a copy change cannot move a colour. That is not a style preference: the
 * thing that broke here was a comparison against rendered prose, and the two
 * cases it could never have caught are the two reasons `holdLine` rewrites to
 * name their station.
 */
import { describe, expect, it } from "bun:test";

import { HOLD_LINE, holdLine, holdTone, type HoldReason } from "@/lib/spine/driver";

/*
 * 2026-09-03: `TrackStart.tsx` was deleted with the `/plan` index (P-14, R-34),
 * and the assertions that read its source went with it. The tone is still
 * pinned BY REASON below, which is the half that can catch a colour moving; the
 * run screen's chip is `TrackRun.tsx`, guarded where it lives.
 */


const EVERY_REASON = Object.keys(HOLD_LINE) as HoldReason[];

/**
 * The six where a PERSON is what stands in the way.
 *
 * This used to read "a judgement about THIS work", which was true of the first
 * four and is not true of the fifth. `tools-refused` (F-41, 2026-08-25) needs
 * nobody's judgement about the work — it needs somebody to reconnect a
 * credential the loop cannot mint for itself. The colour is right and the
 * reason for it was too narrow, so the reason is what changed.
 *
 * AMBER would have been a lie here: its promise is that a condition elsewhere
 * changes "or it resolves itself", and a 401 does not resolve itself.
 */
const ORCHID: HoldReason[] = [
  "waiting-on-a-person",
  "station-cannot-finish",
  "corrections-spent",
  "given-up",
  "tools-refused",
  "going-in-circles",
];

/** The ten where a condition elsewhere has to change, or it resolves itself. */
const AMBER: HoldReason[] = [
  "paused",
  "no-agent",
  "produced-nothing",
  "nothing-to-hand-on",
  "stalled",
  "over-budget",
  "out-of-time",
  "out-of-credit",
  "needs-evidence",
  "needs-a-waived-station",
  // S0-001's addition: the station filed something its own check refused. The
  // fix is better work from the same seat -- it retries with the failure as
  // context and never reaches a person -- so amber is the honest tone.
  "self-check-failed",
];

describe("every hold reason is classified, and the set is closed", () => {
  it("covers all eighteen with no reason in two lists and none in neither", () => {
    // THE GUARD ON THE GUARD. Both lists above are hand-written, so a reason
    // added to `HoldReason` could land in neither and silently take a default
    // colour. `HOLD_LINE` has to name every hold a person can hit, which is what
    // makes it the register to check against.
    expect(EVERY_REASON.length).toBe(18);
    const listed = [...ORCHID, ...AMBER, "done" as HoldReason];
    expect(new Set(listed).size).toBe(listed.length);
    expect([...listed].sort()).toEqual([...EVERY_REASON].sort());
  });

  it("gives orchid to exactly the six a person releases", () => {
    for (const reason of ORCHID) {
      expect(holdTone(reason), `${reason} is not waiting on a person`).toBe("you");
    }
  });

  it("gives amber to every hold waiting on a condition", () => {
    for (const reason of AMBER) {
      expect(holdTone(reason), `${reason} is asking for a person`).toBe("hold");
    }
  });

  it("gives `done` no tone at all, because it is not a hold", () => {
    // "The route is finished. This work has been graded." Painting it as stopped
    // reports finished work as stuck, which is the defect `PlanCard` exists
    // because of, one layer up.
    expect(holdTone("done")).toBe(null);
  });

  it("says nothing for an absent hold or one a newer deploy wrote", () => {
    // `last_hold` is a text column, so an unknown value has to come out as no
    // colour rather than as the wrong one.
    expect(holdTone(null)).toBe(null);
    expect(holdTone(undefined)).toBe(null);
    expect(holdTone("")).toBe(null);
    expect(holdTone("a-reason-from-next-week")).toBe(null);
  });
});

describe("the classification cannot be read off the sentence", () => {
  it("proves the prose comparison this replaced was broken for two of the four", () => {
    /*
     * THE REASON THE OLD CODE WAS NOT MERELY UGLY. `TrackStart` compared
     * `t.hold` against `HOLD_LINE["waiting-on-a-person"]`, and `t.hold` is the
     * output of `holdLine`, which replaces the leading "This station" with the
     * station's display name for the station-specific reasons. Two of those are
     * in the orchid four, so no equality check against `HOLD_LINE` could ever
     * have recognised them.
     */
    for (const reason of ["station-cannot-finish", "given-up"] as HoldReason[]) {
      const rendered = holdLine(reason, { station: "build" });
      expect(rendered, `${reason} rendered nothing`).toBeTruthy();
      expect(
        rendered === HOLD_LINE[reason],
        `${reason} still equals its own HOLD_LINE entry, so this test proves nothing`,
      ).toBe(false);
    }
    // And the one it did recognise, so the contrast is real rather than assumed.
    expect(holdLine("waiting-on-a-person", { station: "build" })).toBe(
      HOLD_LINE["waiting-on-a-person"],
    );
  });
});
