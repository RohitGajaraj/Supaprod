import { describe, expect, it } from "bun:test";

import { lastMovedAt, stillnessLine } from "./last-movement";
import { TRACK_FRESH_MS } from "./tracks-feed";

const NOW = Date.parse("2026-08-27T12:00:00.000Z");
const isoAgo = (ms: number) => new Date(NOW - ms).toISOString();
/** Stand-in for the surface's own `ago`, enough to prove the wiring. */
const ago = (iso: string | null | undefined) => {
  if (!iso) return null;
  const mins = Math.round((NOW - Date.parse(iso)) / 60_000);
  return mins >= 60 ? `${Math.round(mins / 60)}h` : `${mins}m`;
};

describe("lastMovedAt", () => {
  it("takes the most recent instant across every source the board holds", () => {
    // Missions and tracks spell their timestamps differently; a board that
    // reads only one of them calls a busy workspace still.
    const at = lastMovedAt(
      NOW,
      [{ updated_at: isoAgo(3 * 3_600_000) }],
      [{ updatedAt: isoAgo(9 * 3_600_000) }],
    );
    expect(at).toBe(NOW - 3 * 3_600_000);
  });

  it("does NOT count a drive as a movement, which it did until 2026-09-01", () => {
    /*
     * THIS TEST ASSERTED THE OPPOSITE AND WAS RIGHT TO FAIL WHEN I CHANGED IT.
     * Its old form fed `drivenAt: 20m ago` beside `updatedAt: 9h ago` and
     * expected 20m - encoding "a drive is a movement" as the contract.
     *
     * It is not. `spine_tracks.driven_at` advances every time the sweep picks a
     * track up whether or not anything changed. Measured service-role
     * 2026-09-01: **58 of 62 open tracks carry a `driven_at` LATER than their
     * own `updated_at`**, 57 by more than five minutes, the worst by 23.5 DAYS.
     *
     * And the consequence was not a blurred number - it SILENCED this file's
     * own sentence. The sweep runs every 10 minutes and TRACK_FRESH_MS is 10
     * minutes, so `drivenAt` held `lastMoved` permanently fresh and "Nothing
     * has moved for ..." could almost never fire. The drives that moved nothing
     * were suppressing the warning that nothing was moving.
     */
    const at = lastMovedAt(NOW, [{ updatedAt: isoAgo(9 * 3_600_000), drivenAt: isoAgo(60_000) }]);
    expect(at).toBe(NOW - 9 * 3_600_000);
  });

  it("so the stillness sentence can fire again while the sweep is running", () => {
    /* The end-to-end consequence, asserted rather than described: a track
       driven a minute ago that last CHANGED nine hours ago is still, and the
       board may now say so. */
    const line = stillnessLine(
      lastMovedAt(NOW, [{ updatedAt: isoAgo(9 * 3_600_000), drivenAt: isoAgo(60_000) }]),
      NOW,
      ago,
    );
    expect(line).toBe("Nothing has moved for 9h.");
  });

  it("refuses a future timestamp rather than reporting movement in 0 minutes", () => {
    expect(lastMovedAt(NOW, [{ updated_at: new Date(NOW + 60_000).toISOString() }])).toBeNull();
  });

  it("refuses garbage and absence", () => {
    expect(lastMovedAt(NOW, [{ updated_at: "not a date" }, { updated_at: null }])).toBeNull();
    expect(lastMovedAt(NOW, undefined, [])).toBeNull();
  });
});

describe("stillnessLine", () => {
  it("SAYS NOTHING while the board is fresh, because the rows already carry it", () => {
    expect(stillnessLine(NOW - (TRACK_FRESH_MS - 1_000), NOW, ago)).toBeNull();
  });

  it("names the silence once movement has stopped", () => {
    expect(stillnessLine(NOW - 3 * 3_600_000, NOW, ago)).toBe("Nothing has moved for 3h.");
  });

  it("uses the spine's own freshness boundary, not a number of its own", () => {
    // Exactly at the boundary it speaks; a millisecond inside it does not.
    expect(stillnessLine(NOW - TRACK_FRESH_MS, NOW, ago)).not.toBeNull();
    expect(stillnessLine(NOW - (TRACK_FRESH_MS - 1), NOW, ago)).toBeNull();
  });

  it("SAYS NOTHING when no row could be dated, because that is a gap in our data", () => {
    // "Nothing has moved" would be a claim about the workspace made from a hole
    // in our own record. Silence claims nothing; the sentence would be false.
    expect(stillnessLine(null, NOW, ago)).toBeNull();
  });

  it("says nothing when the formatter cannot render the gap", () => {
    expect(stillnessLine(NOW - 3 * 3_600_000, NOW, () => null)).toBeNull();
  });
});
