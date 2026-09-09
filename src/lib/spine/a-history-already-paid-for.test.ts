/**
 * ── ONE HISTORY EARNS ONE DEFERRAL ───────────────────────────────────────────
 *
 * THE DEADLOCK, measured on production 2026-09-09. `stuckBackoffMinutes` reads
 * a track's three most recent drives and `track-tick` turns a non-null answer
 * into a `deferred_until` AND into a skip for that same tick. The deferral is
 * what stops the track being driven, so `track_drives` never gains a row, so
 * the next candidacy reads the SAME three drives and writes the SAME deferral.
 * The ladder's top rung is 90 minutes and it repeats, so the state is
 * permanent.
 *
 * `a30d6b62` was deferred at 22:00 on the strength of three drives from
 * 2026-09-06, and it was the ONLY selectable track in the product: 11 of 23
 * workspaces are samples holding 51 of the 74 open tracks, most of the rest
 * were held, and the remainder were deferred. Two drives in the previous
 * twenty-four hours across every workspace. The newest row in `track_drives`
 * anywhere was 04:16 that morning. Every tick reported `ok` throughout.
 *
 * The rule is not wrong. Charging the same evidence forever is.
 */
import { describe, expect, it } from "bun:test";
import { BACKOFF_MINUTES, stuckBackoffMinutes } from "./three-tries-and-nothing-changed";

/** The three drives `a30d6b62` was being priced on, with their real stamps. */
const HELD_THREE = [
  { hold: "produced-nothing", at: "2026-09-06T08:00:26.256Z" },
  { hold: "produced-nothing", at: "2026-09-06T07:50:04.462Z" },
  { hold: "produced-nothing", at: "2026-09-06T07:40:03.010Z" },
];

describe("a history already paid for is not charged again", () => {
  it("prices a run of held drives the first time, as it always did", () => {
    const minutes = stuckBackoffMinutes({
      recent: HELD_THREE,
      newestArtifactAt: null,
      backedOffAt: null,
    });
    expect(minutes).toBe(BACKOFF_MINUTES[0]!);
  });

  it("refuses to price the SAME history twice, which is the deadlock", () => {
    // Priced after the newest drive: nothing has happened since, so there is no
    // new evidence and no second penalty.
    expect(
      stuckBackoffMinutes({
        recent: HELD_THREE,
        newestArtifactAt: null,
        backedOffAt: "2026-09-09T22:00:07.167Z",
      }),
    ).toBeNull();
  });

  it("prices again once a NEW held drive has landed", () => {
    /* The track came back, was driven, held again. That is new evidence and it
       earns the next rung honestly -- which is the behaviour the ladder was
       measured for and which this change must not remove. */
    const withANewer = [
      { hold: "produced-nothing", at: "2026-09-09T23:00:00.000Z" },
      ...HELD_THREE,
    ];
    expect(
      stuckBackoffMinutes({
        recent: withANewer,
        newestArtifactAt: null,
        backedOffAt: "2026-09-09T22:00:07.167Z",
      }),
    ).not.toBeNull();
  });

  /*
   * THE MIRROR (law 12). "It refuses to re-price" passes just as well if it
   * refused to price anything at all, which would delete the rule and let a
   * genuine loop spend forever. Every case the ladder exists for is asserted
   * in the same breath.
   */
  it("still refuses to price what it never priced before", () => {
    expect(
      stuckBackoffMinutes({ recent: HELD_THREE, newestArtifactAt: null, backedOffAt: undefined }),
    ).toBe(BACKOFF_MINUTES[0]!);
  });

  it("still lets a track that produced something through", () => {
    expect(
      stuckBackoffMinutes({
        recent: HELD_THREE,
        newestArtifactAt: "2026-09-06T09:00:00.000Z",
        backedOffAt: null,
      }),
    ).toBeNull();
  });

  it("still says nothing about a track with fewer than three drives", () => {
    expect(
      stuckBackoffMinutes({ recent: HELD_THREE.slice(0, 2), newestArtifactAt: null }),
    ).toBeNull();
  });

  it("still climbs the ladder with the run of held drives", () => {
    const four = [{ hold: "produced-nothing", at: "2026-09-06T08:10:00.000Z" }, ...HELD_THREE];
    expect(stuckBackoffMinutes({ recent: four, newestArtifactAt: null })).toBe(BACKOFF_MINUTES[1]!);
  });
});
