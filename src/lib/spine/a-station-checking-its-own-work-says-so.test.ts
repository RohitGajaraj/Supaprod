/**
 * THE SELF-CHECK RAN ON EVERY DRIVE AND SAID NOTHING WHEN IT PASSED.
 *
 * ── THE GAP ────────────────────────────────────────────────────────────────
 * `verifyStationOutput` runs at the end of every drive of every station. Its
 * result reached the database through exactly one path: `spine_tracks.last_hold`
 * and `last_hold_because`, which are written ONLY on a failure and overwritten
 * by the next drive.
 *
 * So the check that happens almost every time was invisible almost every time,
 * and no number anywhere could answer "how many times did this run check its own
 * work". For a product whose claim is that a person can watch the loop work,
 * that is the wrong half to keep.
 *
 * ── WHAT THE COUNT MAY NOT BE ──────────────────────────────────────────────
 * A constant. "One check per station" is wrong in both directions on a single
 * run: Ship compares nothing by design, Build compares two things. Every figure
 * is derived from the `self_check` arrays the checks themselves wrote, which is
 * why `summariseSelfChecks` is a pure function over rows and is tested as one.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { EMPTY_SELF_CHECKS, selfCheckLine, summariseSelfChecks } from "@/lib/spine/track.functions";

const held = (what: string) => ({ what, held: true });
const missed = (what: string, why: string) => ({ what, held: false, why });

describe("counted from what was compared", () => {
  it("counts the comparisons, not the drives", () => {
    const t = summariseSelfChecks(
      [
        { station: "build", self_check: [held("A change was staged"), held("The checks ran")] },
        { station: "define", self_check: [held("A spec was written")] },
      ],
      null,
    );
    expect(t.drives).toBe(2);
    expect(t.compared).toBe(3);
    expect(t.held).toBe(3);
    expect(t.missed).toBe(0);
  });

  it("a drive that compared nothing is not a check", () => {
    /*
     * Ship, by design. Counting it would inflate "checked its own work" with a
     * drive where nothing was checked, which is the number this exists to stop
     * being. `[]` and NULL both mean no comparison was recorded, for different
     * reasons, and neither is a check.
     */
    const t = summariseSelfChecks(
      [
        { station: "ship", self_check: [] },
        { station: "ship", self_check: null },
        { station: "learn", self_check: [held("The forecast was graded")] },
      ],
      null,
    );
    expect(t.drives).toBe(1);
    expect(t.compared).toBe(1);
  });

  it("separates what held from what did not", () => {
    const t = summariseSelfChecks(
      [
        {
          station: "build",
          self_check: [
            held("A change was staged"),
            missed("The checks ran and cleared this change", "The checks were never run"),
          ],
        },
      ],
      null,
    );
    expect(t.held).toBe(1);
    expect(t.missed).toBe(1);
    expect(t.compared).toBe(2);
  });

  it("counts a retry from the hold the drive arrived on, not from a sequence", () => {
    /*
     * `entry_hold = 'self-check-failed'` is a station running again because its
     * own check refused what it filed. The log records that at the moment it is
     * true, which is the only way to count it without guessing at the shape of a
     * sequence of drives.
     */
    const t = summariseSelfChecks(
      [
        { station: "build", self_check: [missed("The checks ran", "never run")] },
        {
          station: "build",
          entry_hold: "self-check-failed",
          self_check: [held("A change was staged"), held("The checks ran")],
        },
      ],
      null,
    );
    expect(t.retries).toBe(1);
  });

  it("a drive held for something else is not a retry", () => {
    const t = summariseSelfChecks(
      [{ station: "build", entry_hold: "waiting-on-a-person", self_check: [held("x")] }],
      null,
    );
    expect(t.retries).toBe(0);
  });

  it("survives a column holding anything at all", () => {
    for (const raw of ["nope", 3, {}, [null], [{ held: true }], [{ what: "  ", held: true }]]) {
      const t = summariseSelfChecks([{ station: "build", self_check: raw }], null);
      expect(t.drives).toBe(0);
      expect(t.compared).toBe(0);
    }
  });

  it("says when it could not read, so a zero is not mistaken for a fact", () => {
    const t = summariseSelfChecks([], "column track_drives.self_check does not exist");
    expect(t.compared).toBe(0);
    expect(t.unreadable).toBe("column track_drives.self_check does not exist");
  });
});

describe("the sentence on the strip", () => {
  it("says nothing when nothing was checked", () => {
    // `GotYou` is a list of what the run GOT you, and a zero is not one of those
    // -- the same refusal that strip already makes about time and money.
    expect(selfCheckLine(EMPTY_SELF_CHECKS)).toBeNull();
    expect(selfCheckLine(null)).toBeNull();
  });

  it("names the drives and the comparisons, which are different numbers", () => {
    const t = summariseSelfChecks(
      [
        { station: "build", self_check: [held("a"), held("b")] },
        { station: "learn", self_check: [held("c")] },
      ],
      null,
    );
    expect(selfCheckLine(t)).toBe("2 self-checks · 3 things compared");
  });

  it("names a miss and a retry only when there is one", () => {
    const t = summariseSelfChecks(
      [
        { station: "build", self_check: [missed("a", "why")] },
        { station: "build", entry_hold: "self-check-failed", self_check: [held("a")] },
      ],
      null,
    );
    expect(selfCheckLine(t)).toBe("2 self-checks · 2 things compared · 1 did not hold · 1 retry");
  });

  it("counts one as one", () => {
    const t = summariseSelfChecks([{ station: "learn", self_check: [held("a")] }], null);
    expect(selfCheckLine(t)).toBe("1 self-check · 1 thing compared");
  });
});

describe("what the driver records", () => {
  const SRC = readFileSync("src/lib/spine/driver.server.ts", "utf8");
  const flat = SRC.replace(/\s+/g, " ");

  /**
   * The CODE, without the comments about it.
   *
   * Both source assertions below failed on their first run against comments that
   * QUOTE the code they are about -- the ship branch explains why an
   * `ok("Something was released")` would be a lie, and saying so put the string
   * in the branch. A guard a correct explanation can break is a guard that gets
   * its explanation deleted, which is the wrong trade.
   */
  const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");

  it("writes the check whether it passed or failed", () => {
    /*
     * THE ASSERTION THAT IS THE FIX. The write has to sit BEFORE the failure
     * branch, because that branch returns -- a write after it would record only
     * the passes, which is the same blindness pointing the other way.
     */
    expect(flat).toContain("await recordSelfCheck(supabase, driveId, verification.checks);");
    expect(flat.indexOf("await recordSelfCheck(supabase, driveId")).toBeLessThan(
      flat.indexOf("if (!verification.passed) {"),
    );
  });

  it("ship still compares nothing, which is the design and not an oversight", () => {
    /*
     * An `ok("Something was released")` in that branch would read well and be a
     * lie: F-36 is why Ship files no artifact kind here, and Ship's real proof is
     * enforced at `release.publish`. A check it claims to have made is the exact
     * constant the count exists to avoid.
     */
    const ship = code(
      SRC.slice(SRC.indexOf('if (station === "ship")'), SRC.indexOf('if (station === "learn")')),
    );
    expect(ship).not.toContain("ok(");
    // And it still returns through `done()`, so the drive records `[]` rather
    // than nothing at all -- "compared nothing" is a fact, and NULL is not.
    expect(ship).toContain("return done();");
  });

  it("every station branch that compares something records it", () => {
    // Cheap and load-bearing: a branch that returns `passed: true` without
    // recording would report a station as never having checked itself.
    const fn = code(
      SRC.slice(
        // From AFTER the `no`/`ok`/`done` helpers, so the helper's own
        // `return { passed: false, ... }` is not read as a branch skipping them.
        SRC.indexOf("const done = () => ({ passed: true, checks });"),
        SRC.indexOf("export async function driveTrackOnce"),
      ),
    );
    expect(fn).not.toContain("return { passed: true };");
    expect(fn).not.toContain("return { passed: false, reason:");
    // Every early return either carries the list or goes through a helper.
    expect(fn).toContain("return { passed: true, checks };");
  });
});
