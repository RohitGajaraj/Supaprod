/**
 * A WINDOW ONTO A RUN OPENS AT THE NEWEST END, AND THIS IS THE SECOND TIME.
 *
 * ── THE SAME DEFECT, TWICE, IN ONE FILE ────────────────────────────────────
 * `getTrackActivity` reads four tables for one track and caps three of them at
 * two hundred rows. Two of those three were written ascending, so the window
 * held the OLDEST two hundred rows of a run's life.
 *
 *   2026-09-08  `track_drives`. Track `2fdf93b6` carries 285 rows, so the only
 *               self-check on the whole track -- written at 21:20 -- fell
 *               outside the window and rendered nothing. Found by reading the
 *               live Build tab while the row sat in the database.
 *   2026-09-09  `agent_runs`. Track `ef50b26a` carries 316 rows; the 200th
 *               oldest is dated 2026-08-14 and 116 turns after it reached no
 *               surface at all.
 *
 * The first repair fixed one query and wrote its reasoning above that query.
 * The population argument was never carried to the sibling eight lines up,
 * which is the bigger of the two, and nothing was watching. This is the thing
 * that watches.
 *
 * ── WHY IT MATTERS MORE ON `agent_runs` THAN ANYWHERE ELSE ─────────────────
 * The RUNNING turn is always the newest, so an ascending window past the cap
 * drops exactly the row the screen is built around. `hasLiveVisit` reads these
 * turns, so it answered false while a seat was working: the transcript stopped
 * a week short, the poll fell from 500 ms to ten seconds, the header chip
 * stopped pulsing, the Now card fell through to "Between steps", and the footer
 * offered "Run it now" over a seat that was mid-turn. **The whole screen
 * reported an idle run because the read could not see the live row.**
 *
 * ── WHY THIS READS SOURCE ──────────────────────────────────────────────────
 * The property is about which rows the DATABASE is asked for, and no fixture
 * can show it: a test double returns whatever it was given in whatever order,
 * so a wire test passes on an ascending read and a descending one alike. The
 * order argument only exists in the query. `one-station-display-on-the-run-
 * screen.test.ts` reads source for the same reason.
 *
 * NOT A RULE ABOUT EVERY CAPPED READ. A capped read that is genuinely a page of
 * a list wants its own order, and this does not touch those. It pins the two
 * reads whose population is known to exceed the cap on production and whose
 * newest rows are the ones the screen depends on.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "bun:test";

import { TURN_WINDOW } from "@/lib/spine/track.functions";

/* `fileURLToPath`, not `.pathname`: this repo's path contains spaces, which a
   URL keeps percent-encoded, and the read then fails with ENOENT. */
const SRC = readFileSync(
  fileURLToPath(new URL("./track.functions.ts", import.meta.url)),
  "utf8",
);

/**
 * The slice of `getTrackActivity` that holds its four reads.
 *
 * Bounded rather than scanning the whole 5,000-line file, so a `.limit()` in an
 * unrelated handler cannot make this pass or fail for reasons it is not about.
 */
function activityReads(): string {
  const from = SRC.indexOf("export const getTrackActivity");
  expect(from, "getTrackActivity has been renamed or removed").toBeGreaterThan(-1);
  const to = SRC.indexOf("export const steerTrack", from);
  const end = to === -1 ? SRC.length : to;
  return SRC.slice(from, end);
}

/** The `.order(...)` that immediately precedes a table's `.limit(...)`. */
function orderBefore(block: string, table: string): string | null {
  const at = block.indexOf(`.from("${table}"`);
  if (at === -1) return null;
  const after = block.slice(at);
  const limitAt = after.indexOf(".limit(");
  if (limitAt === -1) return null;
  const window = after.slice(0, limitAt);
  const orders = [...window.matchAll(/\.order\([^)]*\)/g)];
  return orders.length ? (orders[orders.length - 1]?.[0] ?? null) : null;
}

describe("a capped read on a run takes the newest rows", () => {
  const block = activityReads();

  it("finds the reads it is about, so this scan covers something", () => {
    expect(block).toContain('.from("agent_runs")');
    expect(block).toContain('.from("track_drives"');
    expect(block.match(/\.limit\(/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });

  it("reads the newest turns, because the running one is always newest", () => {
    const order = orderBefore(block, "agent_runs");
    expect(
      order,
      [
        `The turns read is ordered: ${order}`,
        "",
        "Ascending with a cap gives the OLDEST turns of a run's life. The",
        "running turn is always the newest, so past the cap `hasLiveVisit`",
        "answers false while a seat is working and the whole screen reports an",
        "idle run. Measured on track ef50b26a: 316 rows, 116 turns invisible.",
        "",
        "`activity.ts` re-sorts oldest-first before building turns, so reading",
        "descending here does not change what the transcript looks like.",
      ].join("\n"),
    ).toContain("ascending: false");
  });

  it("reads the newest drives, which is the repair this one was copied from", () => {
    const order = orderBefore(block, "track_drives");
    expect(order).toContain("ascending: false");
  });

  it("says how big the window is in one place, so the cap and the notice agree", () => {
    // The number the transcript quotes when it tells a person what it could not
    // see has to be the number the query used, or the sentence is a guess.
    expect(TURN_WINDOW).toBe(200);
    expect(block).toContain(".limit(TURN_WINDOW)");
  });

  it("hands back whether the window was full, so the cap can be disclosed", () => {
    // A cap that is not disclosed reads as completeness: a screen that draws
    // 200 turns and stops lets a person conclude that is all there was.
    expect(block).toContain("turnsCapped");
    expect(block).toContain("runs.length >= TURN_WINDOW");
  });
});
