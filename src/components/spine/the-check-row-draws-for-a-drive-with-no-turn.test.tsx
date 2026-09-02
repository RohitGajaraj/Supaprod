/**
 * THE ROW HAS TO DRAW FOR A DRIVE THAT RAN NO SEATS, WHICH IS THE CASE IT IS FOR.
 *
 * ── WHY THIS FILE, AND WHY RENDERED RATHER THAN DERIVED ────────────────────
 * The self-check row was built as its own entry rather than a caption on a turn
 * because a check belongs to the DRIVE, not to a seat. After P-03's done rule
 * that stopped being a theoretical distinction: a Build whose changeset is
 * already at `pr_open` skips its crew entirely, so the drive produces NO TURN
 * and a caption would have rendered nothing on exactly the case a person most
 * needs to see -- "the loop looked at this and decided it was finished".
 *
 * A1 asked for the rendered proof of that case before closing P-02. Everything
 * else about this row is proved by derivation in
 * `a-station-checking-its-own-work-says-so.test.ts`; what only a render can show
 * is that the row survives an empty transcript.
 *
 * ── AND ONE REAL DEFECT THIS FOUND ─────────────────────────────────────────
 * `getTrackActivity` fetched `track_drives` oldest-first with `limit(200)`,
 * copied from the three neighbouring queries. Track `2fdf93b6` carries 285 drive
 * rows, so the single self-check on it -- written 21:20 UTC -- fell outside the
 * window and the transcript drew nothing while the row sat in the database. A1
 * read the live Build tab and found zero matches. A drive is the
 * highest-frequency row on a track by a wide margin: every ten minutes, whether
 * or not anything happened.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { mergeActivityRows } from "@/components/spine/activity-rows";
import { summariseSelfChecks } from "@/lib/spine/track.functions";

/** The live row, exactly as `2fdf93b6` carries it. */
const LIVE = [
  {
    station: "build",
    at: "2026-09-02T21:20:01.718Z",
    entry_hold: "out-of-time",
    self_check: [
      { held: true, what: "A change was staged" },
      {
        held: false,
        what: "The checks ran and cleared this change",
        why: "The checks were never run on this change. Call studio.checks.run and read its verdict before handing this on.",
      },
    ],
  },
];

describe("a drive that ran no seats still says it checked itself", () => {
  it("draws the row with no turns at all, which is the skipped-crew case", () => {
    const t = summariseSelfChecks(LIVE, null);
    const rows = mergeActivityRows([], [], [], t.entries);
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.kind).toBe("check");
    if (row.kind !== "check") throw new Error("unreachable");
    expect(row.line).toBe("Checked its own work: 1 held, 1 did not");
    expect(row.stationName).toBe("Build");
  });

  it("carries what it compared and why the one that missed did", () => {
    const t = summariseSelfChecks(LIVE, null);
    const row = mergeActivityRows([], [], [], t.entries)[0];
    if (row.kind !== "check") throw new Error("unreachable");
    expect(row.what).toEqual(["A change was staged", "The checks ran and cleared this change"]);
    expect(row.why[0]).toContain("studio.checks.run");
  });

  it("sits in time order among turns and moves rather than at either end", () => {
    /*
     * The row is a fact about a moment. In a stream a reader scrolls, a check
     * drawn at the top or bottom regardless of when it happened would attach
     * itself to whatever it landed next to.
     */
    const turn = (at: string, runId: string) => ({
      runId,
      agentSlug: "builder",
      agentName: "Engineer",
      station: "build" as const,
      stationName: "Build",
      at,
      outcome: "done" as const,
      made: [],
      said: null,
      tookMs: null,
      tokens: null,
      stopLine: null,
      usd: 0,
    });
    const t = summariseSelfChecks(LIVE, null);
    const rows = mergeActivityRows(
      [turn("2026-09-02T21:10:00Z", "before"), turn("2026-09-02T21:30:00Z", "after")],
      [],
      [],
      t.entries,
    );
    // Newest first, which is the order this function returns.
    expect(rows.map((r) => r.kind)).toEqual(["turn", "check", "turn"]);
  });
});

describe("the query that nearly made all of that unreachable", () => {
  const SRC = readFileSync("src/lib/spine/track.functions.ts", "utf8");
  const drives = SRC.slice(
    SRC.indexOf('.from("track_drives" as never)'),
    SRC.indexOf("]);", SRC.indexOf('.from("track_drives" as never)')),
  );

  it("takes the NEWEST drives, not the oldest", () => {
    /*
     * THE ASSERTION THAT IS THE FIX. Ascending here is not a style choice: with
     * more drives than the limit it silently returns a window that can never
     * contain a recent check, and the surface renders nothing while the data is
     * there. The three sibling queries are ascending and are right to be; their
     * populations are far smaller.
     */
    expect(drives).toContain('.order("at", { ascending: false })');
    expect(drives).not.toContain('.order("at", { ascending: true })');
  });

  it("is still bounded, because a track can carry hundreds of drives", () => {
    // 285 on `2fdf93b6` at the time of writing.
    expect(drives).toContain(".limit(200)");
  });
});
