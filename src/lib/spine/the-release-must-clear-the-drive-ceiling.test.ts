/**
 * A RELEASE THAT LEAVES THE DRIVE CEILING IN PLACE IS A BUTTON THAT DOES NOTHING
 * (F-99, 2026-08-26).
 *
 * ── WHAT WAS MEASURED ──────────────────────────────────────────────────────
 * The spine bounds a station twice. `MAX_STATION_ATTEMPTS = 3` bounds a station
 * that FILES NOTHING. `MAX_STATION_DRIVES = 12` (F-43) bounds a station that is
 * DISPATCHED forever without converging — the case `attempts` cannot see,
 * because `out-of-time` deliberately costs no attempt.
 *
 * Both ceilings are right. Only one had a door. `retryStation` reset `attempts`
 * and left `station_drives` untouched, so releasing a track cleared its hold,
 * let it be driven once, and tripped F-43 immediately — re-holding as
 * `going-in-circles`, which is TERMINAL.
 *
 * Measured 2026-08-26 on the live database: two tracks released by hand at 40
 * and 29 drives both re-held within ten minutes. Every open track on a
 * sweep-drivable workspace was already past the ceiling — 81, 63, 53, 42, 40,
 * 29. **So the documented way to un-stick work could not un-stick any of it**,
 * and it failed in the worst possible direction: the hold cleared, the board
 * showed the work moving, and it was terminal again before anyone looked twice.
 *
 * ── THE HALF THAT MUST NOT CHANGE ──────────────────────────────────────────
 * Only a PERSON's release resets the ceiling. The automatic resume in
 * `driver.server.ts` — the one that fires when an escalation's ask is answered —
 * deliberately does not, because clearing a ceiling on a machine path lets
 * escalate → resume → escalate run forever. That is precisely the five-tick
 * cycle billing a full crew each lap that F-43 and the `since` fix exist to
 * stop, so this test pins its ABSENCE as hard as it pins the presence.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const read = (f: string) => readFileSync(fileURLToPath(new URL(f, import.meta.url)), "utf8");
const TRACK_FNS = read("./track.functions.ts");
const DRIVER_SERVER = read("./driver.server.ts");

/** The `.update({...})` object literals in a file, as raw text. */
function updates(src: string): string[] {
  return [...src.matchAll(/\.update\(\{([\s\S]*?)\} as never\)/g)].map((m) => m[1]!);
}

/** The updates that release a hold — the ones this finding is about. */
const releases = (src: string) =>
  updates(src).filter((u) => u.includes("last_hold: null") && u.includes("attempts: 0"));

describe("a person's release clears BOTH ceilings", () => {
  it("every release in track.functions.ts resets station_drives", () => {
    const found = releases(TRACK_FNS);
    /*
     * retryStation, submitStationByHand, and rewindTrackTo.
     *
     * This count is the point of the assertion, and it has already earned its
     * keep: `rewindTrackTo` landed later the same day and this test failed on
     * the count before the code shipped, which is exactly the intended catch —
     * a new release path is forced to be looked at rather than inheriting half
     * a reset by omission. Raise it only after checking the new path resets
     * `station_drives` too.
     */
    expect(found.length).toBe(3);
    for (const u of found) {
      expect(u, "a release that leaves station_drives cannot un-stick anything").toContain(
        "station_drives: 0",
      );
    }
  });

  it("the ceiling it clears is the one F-43 set", () => {
    expect(TRACK_FNS).toContain("MAX_STATION_DRIVES");
    expect(TRACK_FNS).toContain("going-in-circles");
  });
});

describe("THE HALF THAT MUST NOT CHANGE: the machine resume leaves it alone", () => {
  it("driver.server.ts's automatic resume does NOT reset station_drives", () => {
    /*
     * If this ever fails because somebody "made it consistent", read the header
     * first. Consistency here is the bug: an automatic path that clears its own
     * ceiling has no ceiling, and F-43 measured what that costs — 776 runs and
     * roughly $2.70 across six tracks, none of which advanced a station.
     */
    const found = releases(DRIVER_SERVER);
    expect(found.length).toBeGreaterThan(0);
    for (const u of found) {
      expect(u, "the automatic resume must not clear the F-43 ceiling").not.toContain(
        "station_drives",
      );
    }
  });
});
