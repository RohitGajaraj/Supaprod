import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

/**
 * A LANE THAT SORTS BY AGE MUST BE ABLE TO REACH THE OLDEST THING.
 *
 * ── THE DEFECT, SEEN ON THE RENDERED BOARD ─────────────────────────────────
 * The Waiting-on-you lane showed three rows, all at 22d, above a note reading
 * "The oldest has been waiting 40 days, and is not on this page."
 *
 * Both true, and the note was written precisely to stop them looking like a
 * contradiction. But it disclosed a gap rather than closing one: the rows come
 * from `.order("updated_at", { ascending: false }).limit(50)`, and the lane
 * sorts oldest-first WITHIN those 50. So the longest-waiting work is
 * structurally unreachable from the surface whose stated job is "what needs a
 * person soonest" - measured here at 94 blocked against a page of 50.
 *
 * This is S1's RUN-100 one read across: six approvals-queue reads ordered
 * DESCENDING and took the newest 100, so the sixteen dropped were the sixteen
 * OLDEST, under a page that promises oldest-first.
 *
 * ── WHY THE FIX IS NOT THEIR FIX ───────────────────────────────────────────
 * S1 flipped the order, because every consumer of that read wanted the oldest.
 * These 50 feed four lanes and three want recency: Running, Finished and the
 * shell's live line are about work in motion. Flipping would starve three lanes
 * to feed one.
 *
 * So both ends are fetched and merged. The ascending query already existed - it
 * was reading one column to produce `oldestBlockedAt` and throwing the row away
 * - so this costs no extra round trip.
 */

const SRC = readFileSync("src/lib/missions.functions.ts", "utf8");
const code = SRC.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

describe("the read", () => {
  it("KEEPS THE RECENT PAGE DESCENDING, because three lanes want recency", () => {
    expect(code).toContain('.order("updated_at", { ascending: false })');
    expect(code).toContain(".limit(50)");
  });

  it("ALSO FETCHES THE OLDEST BLOCKED ROWS, ascending and bounded", () => {
    expect(code).toContain('.order("updated_at", { ascending: true })');
    expect(code).toContain(".limit(OLDEST_BLOCKED_ROWS)");
  });

  it("asks for the same columns, so a merged row is not a thinner row", () => {
    // The ascending query used to select `updated_at` alone. A row missing
    // `title` or `status` would render as a blank in the lane it was fetched
    // for, which is a worse failure than not fetching it.
    const cols =
      "id,title,goal,status,hop_count,current_agent_id,created_at,updated_at,completed_at,build_driver";
    expect(code.split(cols).length - 1).toBeGreaterThanOrEqual(2);
  });

  it("scopes and filters BOTH queries identically", () => {
    // A workspace filter on one and not the other would let rows from another
    // workspace in through the back door - the exact class F-141 was about.
    expect(code).toContain('oldestQ = oldestQ.eq("workspace_id", input.workspaceId)');
    expect(code).toContain('oldestQ = oldestQ.in("id", productMissionIds)');
  });
});

describe("the merge", () => {
  it("DEDUPES BY ID, because the two reads overlap", () => {
    // A blocked row that is also recently touched is in both. Rendering it
    // twice in one lane is worse than not reaching it at all.
    expect(code).toContain("const byId = new Map<string, NonNullable<typeof data>[number]>();");
    expect(code).toContain("byId.set(m.id, m)");
  });

  it("leaves ordering to the lanes, which each sort for themselves", () => {
    expect(code).toContain("const missions = [...byId.values()];");
  });

  it("KEEPS `oldestBlockedAt` MEANING WHAT IT MEANT", () => {
    // Still the first row of an ascending read. The query grew from one column
    // to ten and from one row to many; the number it produces did not change.
    expect(code).toContain("(oldest?.[0] as { updated_at?: string } | undefined)?.updated_at");
  });

  it("still refuses to report a failed count as zero", () => {
    // The surrounding try/catch degrades to null, not 0. "Waiting on you 0" at
    // the head of this lane is a false all-clear produced by a broken read.
    expect(code).toContain("totalBlocked = null;");
  });
});
