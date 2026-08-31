import { describe, expect, it } from "bun:test";
import {
  HOLDS_THAT_WAIT_ON_A_DATE,
  pickDrivable,
  scheduledAwayIds,
} from "./waiting-on-a-date-is-not-waiting-in-a-queue";

/**
 * A TRACK WAITING ON A KNOWN DATE SHOULD NOT TAKE A DRIVE SLOT (F-183).
 *
 * Measured 2026-08-31, drives since 18:00 UTC: 6 / 5 / 5 / 2 across four tracks.
 * **Ten of eighteen went to two that cannot progress**, and the live acceptance
 * candidate got two. The sweep is sequential against one shared 45s deadline.
 */
const NOW = new Date("2026-09-01T00:00:00Z");

describe("waiting on a date is not waiting in a queue", () => {
  it("skips a needs-evidence track whose horizon has not arrived", () => {
    const skip = scheduledAwayIds(
      [{ id: "t1", last_hold: "needs-evidence" }],
      new Map([["t1", "2026-10-15T00:00:00Z"]]),
      NOW,
    );
    expect([...skip]).toEqual(["t1"]);
  });

  it("DRIVES a needs-evidence track whose horizon has passed", () => {
    // The whole point of the wait is that the work resumes when the date lands.
    // Skipping past the horizon would strand the grade for ever.
    const skip = scheduledAwayIds(
      [{ id: "t1", last_hold: "needs-evidence" }],
      new Map([["t1", "2026-08-01T00:00:00Z"]]),
      NOW,
    );
    expect([...skip]).toEqual([]);
  });

  it("never skips a needs-evidence track with NO date — absent is not future", () => {
    // `needs-evidence` also means "no source is connected and no station can
    // make one". That has no date, it is a real defect, and it must keep its
    // slot. Same law as F-76: absent and future are different values.
    const skip = scheduledAwayIds(
      [{ id: "t1", last_hold: "needs-evidence" }],
      new Map([["t1", null]]),
      NOW,
    );
    expect([...skip]).toEqual([]);
    expect([
      ...scheduledAwayIds([{ id: "t1", last_hold: "needs-evidence" }], new Map(), NOW),
    ]).toEqual([]);
  });

  it("never skips an unparseable date", () => {
    // Stranding a track for ever on a typo is strictly worse than driving it.
    const skip = scheduledAwayIds(
      [{ id: "t1", last_hold: "needs-evidence" }],
      new Map([["t1", "not a date"]]),
      NOW,
    );
    expect([...skip]).toEqual([]);
  });

  it("leaves every other hold alone, including the ones that also waste slots", () => {
    // `needs-a-waived-station` and `waiting-on-a-person` burn slots too, and
    // they are a DIFFERENT question (F-155): a hold only a person can clear is
    // not a schedule, and quietly folding it in here would be the terminal-hold
    // mistake wearing a filter.
    const skip = scheduledAwayIds(
      [
        { id: "a", last_hold: "needs-a-waived-station" },
        { id: "b", last_hold: "waiting-on-a-person" },
        { id: "c", last_hold: null },
        { id: "d", last_hold: "out-of-time" },
      ],
      new Map([
        ["a", "2026-10-15T00:00:00Z"],
        ["b", "2026-10-15T00:00:00Z"],
        ["d", "2026-10-15T00:00:00Z"],
      ]),
      NOW,
    );
    expect([...skip]).toEqual([]);
    expect(HOLDS_THAT_WAIT_ON_A_DATE).toEqual(["needs-evidence"]);
  });

  it("keeps the sweep's fairness ordering and fills the freed slots", () => {
    // `driven_at ASC nullsFirst` is what stops a busy track starving an older
    // one. The filter must remove rows, never reorder them — and the freed slot
    // must go to the next track rather than being lost.
    const ordered = [
      { id: "waiting", last_hold: "needs-evidence" },
      { id: "live1", last_hold: null },
      { id: "live2", last_hold: null },
    ];
    const skip = scheduledAwayIds(ordered, new Map([["waiting", "2026-10-15T00:00:00Z"]]), NOW);
    expect(pickDrivable(ordered, skip, 2).map((c) => c.id)).toEqual(["live1", "live2"]);
  });

  it("returns at most the limit even when nothing is skipped", () => {
    const ordered = [{ id: "a" }, { id: "b" }, { id: "c" }];
    expect(pickDrivable(ordered, new Set(), 2).map((c) => c.id)).toEqual(["a", "b"]);
  });
});
