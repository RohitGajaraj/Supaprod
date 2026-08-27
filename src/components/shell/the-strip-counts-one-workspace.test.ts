import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

import { studioSessionsKey } from "@/lib/query-keys";

/**
 * F-141: A USER-SCOPED, THRICE-BOUNDED READ WAS DRAWN AS A WORKSPACE COUNT.
 *
 * The station strip is the product's primary "where is the work" control. Both
 * run queries behind `listStudioSessions` read `.eq("user_id", userId)` and
 * nothing in the handler narrowed them to a workspace, so the strip tallied
 * every workspace the user belongs to and drew the result directly under a
 * breadcrumb naming ONE, above a board whose every other number is scoped.
 * Measured on the running board 2026-08-27: "89 runs waiting on you" at
 * Discover, and switching workspace would not have changed it.
 *
 * The same read caps three times - 100 builder runs, 100 others, then 200
 * assembled sessions - with no exact count anywhere, so every one of those
 * numbers was what SURVIVED the read.
 *
 * S0 added an optional `workspaceId` whose absence is byte-for-byte the old
 * behaviour, and a `bounded` flag that says the answer is a floor without
 * claiming to know how many were dropped. This wires both.
 */

const STRIP = readFileSync("src/components/shell/use-spine-strip.ts", "utf8");
const code = STRIP.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

describe("the key", () => {
  it("carries the workspace, so one entry cannot hold two answers", () => {
    expect(studioSessionsKey("ws-1")).toEqual(["studio-sessions", false, "ws-1"]);
    expect(studioSessionsKey(null)).toEqual(["studio-sessions", false, null]);
  });

  it("KEEPS THE PREFIX `MissionOrchestratorDetail` INVALIDATES", () => {
    // That component invalidates `["studio-sessions"]`, which matches any
    // longer key. Changing the head of the key would have silently stopped
    // every one of these refreshing after a mission action.
    expect(studioSessionsKey("ws-1")[0]).toBe("studio-sessions");
  });

  it("is used by ALL THREE READERS, which is why it is a function", () => {
    // The strip, the board and the board panel share one cache entry. Scoping
    // one without the others would have them take turns overwriting it with
    // three different answers.
    for (const f of [
      "src/components/shell/use-spine-strip.ts",
      "src/components/shell/BoardPanel.tsx",
      "src/routes/_authenticated.today.tsx",
    ]) {
      const src = readFileSync(f, "utf8");
      expect(src, f).toContain("studioSessionsKey(workspaceId)");
      expect(src, f).not.toContain('queryKey: ["studio-sessions", false]');
    }
  });
});

describe("the strip", () => {
  it("asks for one workspace", () => {
    expect(code).toContain("fList({ data: { includeArchived: false, workspaceId } })");
  });

  it("CALLS ITS NUMBERS A FLOOR WHEN THE READ WAS BOUNDED", () => {
    expect(code).toContain("const sessionsBounded = sessions.data?.bounded === true;");
    expect(code).toContain("sessionsBounded ? `${n}+` : `${n}`");
  });

  it('USES "+" RATHER THAN "At least", because the screen rejected the words', () => {
    /*
     * "At least 89 runs waiting on you" wrapped the Discover chip to two lines,
     * grew the whole strip and pushed the board down with it - measured on the
     * running board 2026-08-27, where `bounded` comes back TRUE, so that is the
     * ordinary case and not an edge one.
     *
     * "+" is the same convention the rail's own count uses, and the chip
     * carries the sentence in a title for anyone who stops on it.
     */
    expect(code).not.toContain("At least ${text}");
    const frame = readFileSync("src/components/shell/AppFrame.tsx", "utf8");
    expect(frame).toContain(
      'title={stage.bounded ? "More are waiting than this counts" : undefined}',
    );
  });

  it("marks every session-derived note, not just the loudest", () => {
    // A strip where only the gate line hedges reads as the other six being
    // exact, which is the same wrong claim in a quieter voice.
    expect(code.match(/floor\(b\./g)?.length).toBeGreaterThanOrEqual(5);
  });

  it("LEAVES THE LEARN BADGE ALONE, because it is a different read", () => {
    // Outcomes come from `listPendingOutcomes` and `listDueForecastsHere`.
    // Neither is bounded by this flag and neither may inherit its caveat.
    expect(code).toContain("bounded: sessionsBounded && note !== learnExtra.trim()");
  });
});
