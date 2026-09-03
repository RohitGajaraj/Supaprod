/**
 * P-18a (A-QUEUE.md). THE TOP BAR COUNTS ONLY WHAT A PERSON CAN ACT ON.
 *
 * Measured live at 03:20 IST: the bar on Helio Labs read "65 decisions are
 * ready for you" beside "Merges the pull request into the branch." No count
 * in the workspace was 65 -- 5 approvals were pending (2 on a track), 8
 * decisions were `pending`, 59 decisions existed, 71 bets sat in backlog.
 * The number came from `getApprovalsQueue`, which federates TEN gate
 * families across the whole workspace with no regard for whether any of
 * them sits on an open track -- a number a person cannot find behind the
 * one line the bar exists for.
 *
 * Fixed by reading `listGatesOnTracks` (src/lib/spine/track.functions.ts)
 * instead: pending gates on OPEN TRACKS ONLY, the same rows Start marks
 * "Needs you." Both the count (`gateCount`) and the preview detail beside
 * it (the first gated track's own title) now come from this one reader, so
 * they cannot name two different populations the way the count and the
 * preview line used to.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";

const SRC = readFileSync("src/components/shell/AppFrame.tsx", "utf8");
const TRACK_SRC = readFileSync("src/lib/spine/track.functions.ts", "utf8");

describe("the count comes from gates on open tracks, not the workspace-wide queue", () => {
  it("gateCount is the length of the gated-tracks read", () => {
    expect(SRC).toContain("const gateCount = gatedTracks.length;");
  });

  it("no longer imports or calls getApprovalsQueue", () => {
    // The name may still appear in a comment explaining what P-18a replaced;
    // what must be gone is the import and the call.
    expect(SRC).not.toContain(
      'import { getApprovalsQueue } from "@/lib/approvals-queue.functions"',
    );
    expect(SRC).not.toContain("useServerFn(getApprovalsQueue)");
    expect(SRC).not.toContain("approvalsQueueKey(workspaceId)");
  });

  it("the preview detail beside the count is the same reader's own row, not a second source", () => {
    // Same defect class as the count itself: a detail sentence from a
    // different population than the number it sits beside is how "65
    // decisions" ended up next to a gate that was not one of the 65's real
    // subset in the first place.
    const at = SRC.indexOf("if (gateCount > 0) {");
    expect(at).toBeGreaterThan(-1);
    expect(SRC.slice(at, at + 600)).toContain("const first = gatedTracks[0];");
  });
});

describe(
  "the zero case must never say nothing is waiting while gates are pending " +
    "(A1 ruling, 2026-09-03, on P-14's Board.tsx deletion -- the 2026-08-31 " +
    "quiet-morning fix paid for this once already: 89 missions were waiting " +
    "on a person and a 24-hour window on the check made the board call it " +
    "quiet)",
  () => {
    it("listGatesOnTracks reads open tracks with no time-based window at all", () => {
      // The 08-31 defect was a 24-hour WINDOW on an otherwise-correct read.
      // The honest fix is not a wider window, it is no window: a gate is
      // pending or it is not, and nothing about how long ago the track last
      // moved changes that. Pinning the absence of any date/time filter on
      // this query is what stops that lesson being paid for a third time.
      const start = TRACK_SRC.indexOf("export const listGatesOnTracks");
      expect(start).toBeGreaterThan(-1);
      const end = TRACK_SRC.indexOf("\n  });", start);
      const body = TRACK_SRC.slice(start, end === -1 ? start + 3000 : end);
      expect(body).not.toContain("gte(");
      expect(body).not.toContain("lte(");
      expect(body).not.toContain("within");
      expect(body).not.toContain("Date.now()");
    });

    it("a track is only ever excluded by its own status, never by staleness", () => {
      const start = TRACK_SRC.indexOf("export const listGatesOnTracks");
      const end = TRACK_SRC.indexOf("\n  });", start);
      const body = TRACK_SRC.slice(start, end === -1 ? start + 3000 : end);
      expect(body).toContain('.eq("status", "open")');
    });

    it("the bar's own sentence never omits the count while gates are pending", () => {
      // No "At least" hedge and no silent zero: `gateCount > 0` alone gates
      // the branch that says "N decisions are ready for you," with nothing
      // else -- no freshness check, no windowed sub-count -- standing between
      // a real pending gate and the sentence naming it.
      const at = SRC.indexOf("if (gateCount > 0 && !onTheBoard) {");
      expect(at).toBeGreaterThan(-1);
      const body = SRC.slice(at, at + 1800);
      expect(body).toContain("decisions are ready for you");
      expect(body).toContain("decision is ready for you");
    });
  },
);
