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
 *
 * 2026-09-08 (Lane 1): the rail's Inbox ROW is a different question from
 * the bar's sentence. It opens the Inbox page, so it counts what that page
 * lists (the queue). The sentence is unchanged. See the second case.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";

const SRC = readFileSync("src/components/shell/AppFrame.tsx", "utf8");
const TRACK_SRC = readFileSync("src/lib/spine/track.functions.ts", "utf8");

describe("the shell says one number, the queue's, with the track gates as the floor", () => {
  it("gateCount is the length of the gated-tracks read", () => {
    expect(SRC).toContain("const gateCount = gatedTracks.length;");
  });

  it("the sentence, the mark and the Inbox row read the same number", () => {
    /*
     * P-18a took the queue out of the bar's sentence because its count was
     * bounded per family and could name a number nobody could find. F-212
     * (2026-09-08) made the queue count exact, and the Inbox row already read
     * it (a row's count is its page's count, P-56). The fourth review
     * (2026-09-09) found the sentence still on the track-gate count forty
     * pixels from the row's queue count: two numbers, one noun. One number
     * now, the queue's, with the track gates as the floor for the beat before
     * the queue answers.
     */
    expect(SRC).toContain('[...APPROVALS_QUEUE_PREFIX, "shell", wsKey]');
    expect(SRC).toContain("const waiting = waitingCount ?? gateCount;");
    expect(SRC).toContain("gates: waitingCount ?? gateCount,");
    expect(SRC).toContain("waitingOnYou: waiting,");
    expect(SRC).toContain("if (waiting > 0 && !onTheBoard) {");
    expect(SRC).not.toContain("approvalsQueueKey(workspaceId)");
  });

  it("the preview detail beside the count is the same reader's own row, not a second source", () => {
    // Same defect class as the count itself: a detail sentence from a
    // different population than the number it sits beside is how "65
    // decisions" ended up next to a gate that was not one of the 65's real
    // subset in the first place.
    const at = SRC.indexOf("if (waiting > 0 && !onTheBoard) {\n      /* THE ONE IN FRONT");
    expect(at).toBeGreaterThan(-1);
    expect(SRC.slice(at, at + 600)).toContain("const first = gatedTracks[0];");
  });
});

/**
 * `listGatesOnTracks`'s OWN body, bounded by the next top-level export.
 *
 * ── THE SLICE USED TO RUN PAST THE FUNCTION, AND IT WAS FOUND BY ACCIDENT ──
 * It ended at the first `"\n  });"` after the declaration. This function does
 * not end that way -- it is wrapped in `withStartReaderTiming`, so it closes
 * `\n  }),\n);` -- and the search therefore ran on into whatever LATER function
 * happened to close that way. On 2026-09-10 an unrelated comment eight hundred
 * lines below used the word "within" and failed a guard about this query's date
 * filters.
 *
 * The assertions below are unchanged. Only the region they read is corrected to
 * the function they name, which is the difference between fixing an instrument
 * and widening a baseline.
 */
function gatesBody(): string {
  const start = TRACK_SRC.indexOf("export const listGatesOnTracks");
  expect(start, "listGatesOnTracks moved; re-point this test").toBeGreaterThan(-1);
  const next = TRACK_SRC.indexOf("\nexport ", start + 1);
  const body = TRACK_SRC.slice(start, next === -1 ? TRACK_SRC.length : next);
  /* THE MIRROR ON THE SLICE ITSELF. Every assertion here but one passes by
     finding nothing, so a bound that collapsed to a few characters would report
     a clean read of an empty string. */
  expect(body.length).toBeGreaterThan(400);
  expect(body).toContain("spine_tracks");
  /*
   * AND THE PROSE COMES OUT, which is the other half of the same lesson and was
   * merged in from Lane 3's concurrent fix. Bounding stops the guard reading
   * ANOTHER function's comment; stripping stops it reading THIS one's. Every
   * assertion below is about what the query does, and a sentence explaining a
   * query is not the query -- a comment here that mentioned `Date.now()` while
   * arguing against date filters would fail the test that argument exists for.
   */
  return body
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .split("\n")
    .filter((l) => !l.trim().startsWith("//"))
    .join("\n");
}

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
      const body = gatesBody();
      expect(body).not.toContain("gte(");
      expect(body).not.toContain("lte(");
      expect(body).not.toContain("within");
      expect(body).not.toContain("Date.now()");
    });

    it("a track is only ever excluded by its own status, never by staleness", () => {
      expect(gatesBody()).toContain('.eq("status", "open")');
    });

    it("the bar's own sentence never omits the count while gates are pending", () => {
      // No "At least" hedge and no silent zero: `gateCount > 0` alone gates
      // the branch that says "N calls are waiting for you," with nothing
      // else -- no freshness check, no windowed sub-count -- standing between
      // a real pending gate and the sentence naming it.
      const at = SRC.indexOf("if (waiting > 0 && !onTheBoard) {");
      expect(at).toBeGreaterThan(-1);
      const body = SRC.slice(at, at + 1800);
      expect(body).toContain("`${waiting} calls are waiting for you`");
      expect(body).toContain("1 call is waiting for you");
    });
  },
);
