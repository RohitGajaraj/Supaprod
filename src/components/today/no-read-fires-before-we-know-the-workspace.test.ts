/**
 * A READ THAT NAMES A WORKSPACE MUST NOT FIRE BEFORE THERE IS ONE.
 *
 * ── WHY THIS BECAME WORTH A GUARD ─────────────────────────────────────────
 * The board's `listStudioSessions` read carried `workspaceId` in both its query
 * KEY and its PAYLOAD and had no `enabled`, so on first paint it fired once with
 * the workspace unresolved and again with the real id: **two requests and two
 * cache entries for one answer**, only the second of which is usable.
 *
 * Measured on the merged tree after A07 landed the fold: **one cold load of the
 * home issued 26 server-function calls across 8 functions**, and
 * `listStudioSessions` was the most-called at **five**. Independently, two
 * observers timed *"Reading what needs you"* holding for **~10.4 seconds** on
 * that surface.
 *
 * **The fold is what makes it matter.** `/today` used to be a page somebody
 * chose to visit; it now redirects to the home, and the board is drawn there.
 * Every arrival pays whatever this surface asks for.
 *
 * ── WHAT THIS DOES NOT CLAIM ──────────────────────────────────────────────
 * It does not claim the guard fixed the ten seconds. Most of those 26 calls are
 * not this component's — `getSwarmHud`, `getWorkspacePauseState` and `listCrew`
 * are the shell's, and some of the repetition is honest polling. This asserts
 * one thing only: **a read that is scoped to a workspace does not go out before
 * the workspace is known.**
 *
 * ── AND TWO READS ARE DELIBERATELY UNGUARDED, WHICH IS WHY THIS NAMES ITS
 *    SUBJECT RATHER THAN SWEEPING THE FILE ──────────────────────────────────
 * `fetchTracks` rides the SHELL's `["shell","open-tracks"]` key on the shell's
 * cadence, and `fDueForecasts` shares one fetch with the station strip. **Both
 * would cost an EXTRA request if guarded**, so a blanket "every useQuery must
 * have `enabled`" rule would make this surface slower while looking stricter.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const BOARD = readFileSync("src/components/today/Board.tsx", "utf8");

/** The `useQuery({ … })` block whose `queryFn` names `fn`, braces balanced. */
function queryBlockFor(fn: string): string {
  const at = BOARD.indexOf(`queryFn: () => ${fn}`);
  expect(at).toBeGreaterThan(-1);
  const start = BOARD.lastIndexOf("useQuery({", at);
  expect(start).toBeGreaterThan(-1);
  let depth = 0;
  for (let i = start; i < BOARD.length; i++) {
    if (BOARD[i] === "{") depth++;
    else if (BOARD[i] === "}") {
      depth--;
      if (depth === 0) return BOARD.slice(start, i + 1);
    }
  }
  throw new Error(`unbalanced useQuery block for ${fn}`);
}

describe("the board does not ask before it knows which workspace", () => {
  it("guards the studio-sessions read, which carries the id twice over", () => {
    const block = queryBlockFor("fListSessions");
    // It really does name the workspace in both places - that is what makes an
    // unresolved call meaningless rather than merely early.
    expect(block).toContain("studioSessionsKey(workspaceId)");
    expect(block).toContain("workspaceId }");
    expect(block).toContain("enabled: Boolean(workspaceId)");
  });

  it("keeps the two reads that are deliberately unguarded, unguarded", () => {
    /*
     * The point of naming them: a sweep that added `enabled` to every read on
     * this surface would ADD requests. `fetchTracks` shares the shell's cache
     * entry and the shell's cadence; `fDueForecasts` shares one fetch with the
     * strip. Guarding either splits a shared fetch into two.
     */
    expect(queryBlockFor("fetchTracks")).not.toContain("enabled:");
    expect(queryBlockFor("fDueForecasts")).not.toContain("enabled:");
  });

  it("guards every read whose key is built from the workspace id", () => {
    /*
     * The general rule, asserted on the shape rather than on a list of names,
     * so a read added tomorrow is covered without editing this file. A key
     * built from `workspaceId` is a read that cannot answer anything before
     * there is one.
     *
     * `["shell", "open-tracks"]` and `["forecast-due", "workspace"]` do not
     * mention `workspaceId` in their keys, so they are outside this rule by
     * construction rather than by exception - which is the reason those two
     * shared-key reads were written that way.
     */
    const unguarded: string[] = [];
    for (const m of BOARD.matchAll(/queryFn: \(\) => (\w+)/g)) {
      const block = queryBlockFor(m[1]!);
      const keyLine = /queryKey:\s*(.+)/.exec(block)?.[1] ?? "";
      if (keyLine.includes("workspaceId") && !block.includes("enabled:")) unguarded.push(m[1]!);
    }
    expect(unguarded).toEqual([]);
  });
});
