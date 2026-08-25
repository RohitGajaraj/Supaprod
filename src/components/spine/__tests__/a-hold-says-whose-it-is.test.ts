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
import { readFileSync } from "node:fs";

import { HOLD_LINE, holdLine, holdTone, type HoldReason } from "@/lib/spine/driver";

const SOURCE = readFileSync("src/components/spine/TrackStart.tsx", "utf8");

/**
 * The file with its prose removed.
 *
 * Every assertion below that checks something is ABSENT has to read this rather
 * than `SOURCE`, because the fix's own comment quotes the broken code it
 * replaced so the next reader can see what went. The first draft of this file
 * matched those quotations and failed on the explanation of the thing it was
 * checking for, which is the third time that trap has caught me: an absence
 * assertion against a commented file is really an assertion about the comments.
 */
const CODE = SOURCE.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

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
];

describe("every hold reason is classified, and the set is closed", () => {
  it("covers all seventeen with no reason in two lists and none in neither", () => {
    // THE GUARD ON THE GUARD. Both lists above are hand-written, so a reason
    // added to `HoldReason` could land in neither and silently take a default
    // colour. `HOLD_LINE` has to name every hold a person can hit, which is what
    // makes it the register to check against.
    expect(EVERY_REASON.length).toBe(17);
    const listed = [...ORCHID, ...AMBER, "done" as HoldReason];
    expect(new Set(listed).size).toBe(listed.length);
    expect([...listed].sort()).toEqual([...EVERY_REASON].sort());
  });

  it("gives orchid to exactly the six a person releases", () => {
    for (const reason of ORCHID) {
      expect(holdTone(reason), `${reason} is not waiting on a person`).toBe("you");
    }
  });

  it("gives amber to the ten waiting on a condition", () => {
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

  it("reads the raw reason in the component, never the rendered sentence", () => {
    expect(SOURCE).toContain("holdTone(t.holdReason)");
    expect(CODE).not.toMatch(/t\.hold === HOLD_LINE/);
    expect(CODE).not.toContain("HOLD_LINE");
  });
});

describe("the station is a fact and the status is a chip", () => {
  it("stops painting the station name by whether a hold exists", () => {
    // The reflex fix was a `you` tone on `Value`, and that component refuses one
    // on purpose: a value is something you read, and if a person is required that
    // belongs on a control rather than on a fact.
    expect(SOURCE).toContain('<Value tone="quiet">{AGENT_STATIONS[t.station].name}</Value>');
    expect(CODE).not.toMatch(/tone=\{t\.hold \? "hold" : "quiet"\}/);
  });

  it("carries the state on a StatusChip, which is what may hold a status", () => {
    // Standing law from 2026-08-19: on paper the five status hues collapse to
    // between 5.06 and 6.00 against the ground, so coloured text cannot carry
    // status and a chip has to. Three words now: you, calendar wait (queue 67),
    // and the ordinary stop.
    expect(SOURCE).toContain("<StatusChip status={tone}");
    expect(SOURCE).toContain('? "Waiting on you"');
    expect(SOURCE).toContain('"Waiting on time"');
    expect(SOURCE).toContain('"On hold"');
  });

  it("pulses only where somebody is being waited on", () => {
    // A condition changing on its own is not asking for attention; a person is.
    expect(SOURCE).toContain('pulse={tone === "you"}');
  });
});
