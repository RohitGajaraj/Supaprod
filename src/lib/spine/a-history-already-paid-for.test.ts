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
import {
  BACKOFF_MINUTES,
  NEVER_BACKED_OFF,
  stuckBackoffMinutes,
} from "./three-tries-and-nothing-changed";

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

/**
 * ── A WALLET WALL IS NOT A TRACK THAT WILL NOT CONVERGE ──────────────────────
 *
 * The third place the same wall was priced as behaviour, after the terminal
 * hold and the drives ceiling. `6cc7a010` and `0c0db8e6` carry twelve drives
 * each whose `entry_hold` is `out-of-credit`, and because `stuck` counts the
 * whole consecutive run rather than three, `Math.min(stuck - 3, 2)` put them
 * on the TOP rung: ninety minutes bought by having been refused at the door.
 */
describe("a wall the track cannot pay is not backed off at all", () => {
  /** The real history of `6cc7a010`, whose twelve drives all halted on money. */
  const WALLET_RUN = [
    { hold: "out-of-credit", at: "2026-09-04T05:40:04.303Z" },
    { hold: "out-of-credit", at: "2026-09-04T05:30:05.259Z" },
    { hold: "out-of-credit", at: "2026-09-04T05:20:05.124Z" },
  ];

  it("does not price a run of wallet halts, at any length", () => {
    expect(stuckBackoffMinutes({ recent: WALLET_RUN, newestArtifactAt: null })).toBeNull();
    // Twelve of them, which is what the two real tracks carry.
    const twelve = Array.from({ length: 12 }, (_, i) => ({
      hold: "out-of-credit",
      at: `2026-09-04T0${5 - Math.floor(i / 6)}:${String(59 - i).padStart(2, "0")}:00.000Z`,
    }));
    expect(stuckBackoffMinutes({ recent: twelve, newestArtifactAt: null })).toBeNull();
  });

  it("does not price an over-budget run either, which is the same wall", () => {
    expect(
      stuckBackoffMinutes({
        recent: WALLET_RUN.map((d) => ({ ...d, hold: "over-budget" })),
        newestArtifactAt: null,
      }),
    ).toBeNull();
  });

  /*
   * THE MIRROR (law 12). Exempting a hold must not become a way to be
   * dispatched forever, and it cannot: the exemption is on the hold the drive
   * ENTERED with, so a drive that runs and holds on something else is priced
   * normally on the very next candidacy.
   */
  it("prices the next hold normally the moment a drive holds on something else", () => {
    const afterTheWall = [
      { hold: "produced-nothing", at: "2026-09-10T01:00:00.000Z" },
      { hold: "produced-nothing", at: "2026-09-10T00:50:00.000Z" },
      { hold: "produced-nothing", at: "2026-09-10T00:40:00.000Z" },
      ...WALLET_RUN,
    ];
    expect(stuckBackoffMinutes({ recent: afterTheWall, newestArtifactAt: null })).toBe(
      BACKOFF_MINUTES[0]!,
    );
  });

  it("keeps every hold the list already carried", () => {
    for (const hold of ["waiting-on-a-person", "the-call-is-yours", "needs-evidence"]) {
      expect(NEVER_BACKED_OFF.has(hold)).toBe(true);
    }
    expect(NEVER_BACKED_OFF.has("out-of-credit")).toBe(true);
    expect(NEVER_BACKED_OFF.has("over-budget")).toBe(true);
    // And nothing else joined by accident.
    expect(NEVER_BACKED_OFF.size).toBe(5);
  });
});
