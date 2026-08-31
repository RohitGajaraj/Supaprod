import { describe, it, expect } from "bun:test";
import {
  holdSentence,
  stationName,
  stoppedEmailSubject,
  stoppedEmailText,
  whatHappensNext,
  type StoppedEmailPayload,
} from "./stopped-email";
import { HOLD_LINE } from "@/lib/spine/driver";
import { TERMINAL_HOLDS } from "@/lib/spine/correction";
import { AGENT_STATIONS } from "@/lib/agent-vocabulary";

/**
 * THE STOPPED-WORK EMAIL, PINNED TO THE THINGS THAT WOULD MAKE IT LIE.
 *
 * Gap #2's other half. The verdict mail covers work that finishes; measured on
 * 2026-08-31, 97 of 106 pieces of work carry a hold, 2 have reached Learn, and
 * 42 of those holds are terminal. S0 ruled the send NARROW: those 42 only,
 * because a terminal hold is definitionally one the sweep will never act on
 * again, while `out-of-time` and `needs-evidence` can still clear and a message
 * about them may be false by the time it is read.
 *
 * The four things tested here are the four ways this mail could be worse than
 * the silence it replaces: a leaked internal word, an invented number, a
 * reassurance that is backwards, and a dead end.
 */

const base: StoppedEmailPayload = {
  trackTitle: "Saved addresses keep showing deleted ones",
  trackHref: "/track/abc",
  station: "build",
  holdReason: "station-cannot-finish",
  nothingWillRetry: true,
};

describe("the stopped-work email never leaks an internal word", () => {
  /**
   * The first station's id is `sense` and its display name is **Discover**, by
   * founder ruling on every surface with no exceptions. A template printing the
   * id would put a word in front of a customer that the product has never shown
   * them, which is the exact defect `agent-vocabulary.ts` records for the Plan
   * receipt reading "Waived: sense, decide" under a rail saying Discover.
   */
  it("renders the station's display name, never its id", () => {
    expect(stationName("sense")).toBe("Discover");
    const text = stoppedEmailText({ ...base, station: "sense" });
    expect(text).toContain("Discover");
    expect(text).not.toContain("sense");
  });

  it("renders the hold's own sentence rather than its slug", () => {
    for (const reason of TERMINAL_HOLDS) {
      expect(holdSentence(reason)).toBe(HOLD_LINE[reason]);
      const text = stoppedEmailText({ ...base, holdReason: reason });
      expect(text).toContain(HOLD_LINE[reason]);
      expect(text).not.toContain(reason);
    }
  });

  /** Imported, never restated: one idea, one vocabulary. */
  it("takes both vocabularies from the product's own maps", () => {
    expect(stationName("build")).toBe(AGENT_STATIONS.build.name);
    expect(holdSentence("given-up")).toBe(HOLD_LINE["given-up"]);
  });
});

describe("it never invents a number", () => {
  /**
   * S4-043 found the parked-track surface stating "finished empty 3 times" from
   * a CONSTANT it never read, with 13 of 32 rows sitting at `attempts = 0`. This
   * would have been the second surface that defect landed on.
   */
  it("says nothing about attempts when the caller has no number", () => {
    for (const attempts of [null, undefined, 0]) {
      const text = stoppedEmailText({ ...base, attempts });
      expect(text).not.toContain("tried");
    }
  });

  it("says the real count when there is one, and counts one correctly", () => {
    expect(stoppedEmailText({ ...base, attempts: 1 })).toContain("It was tried once.");
    expect(stoppedEmailText({ ...base, attempts: 4 })).toContain("It was tried 4 times.");
  });
});

describe("the reassurance is not backwards, which is the crueller error", () => {
  /**
   * Telling somebody their work is waiting when nothing will ever pick it up is
   * how 42 pieces of work sat unread. Reproducing it inside the fix would be a
   * poor outcome, so both directions are pinned.
   */
  it("says nothing will move a terminal hold on its own", () => {
    const line = whatHappensNext(true, true);
    expect(line).toContain("Nothing will move this on its own");
    expect(stoppedEmailText({ ...base, nothingWillRetry: true })).toContain(line);
  });

  it("does not promise that a terminal hold might still be picked up", () => {
    expect(whatHappensNext(true, true)).not.toContain("may still be picked up");
  });

  it("says the opposite, and only the opposite, when something can still retry", () => {
    const line = whatHappensNext(false, true);
    expect(line).toContain("may still be picked up");
    expect(line).not.toContain("Nothing will move this");
  });
});

describe("it is not a dead end, which R-20 section 6 forbids", () => {
  it("carries the way back to the work", () => {
    expect(stoppedEmailText(base)).toContain("/track/abc");
  });

  it("and says how to stop receiving it", () => {
    expect(stoppedEmailText(base)).toContain("Settings");
  });

  it("names the work in the subject rather than only its status", () => {
    const subject = stoppedEmailSubject(base);
    expect(subject).toContain("Saved addresses keep showing deleted ones");
    expect(subject).toContain("Build");
  });

  /** A missing title must not produce "Stopped at Build: ." */
  it("degrades to a plain noun when the work has no title", () => {
    const subject = stoppedEmailSubject({ ...base, trackTitle: "   " });
    expect(subject).toBe("Stopped at Build: your work");
  });

  /** A missing link drops the button rather than rendering one that goes nowhere. */
  it("omits the link entirely when there is no run to open", () => {
    expect(stoppedEmailText({ ...base, trackHref: null })).not.toContain("Open the work:");
  });

  /*
   * FOUND BY RENDERING THE MAIL AND READING IT, WHICH NO TEST HAD DONE.
   * The retryable branch ended "Opening it shows you where it is", and the
   * template drops the button when there is no `trackHref`, so the prose sent
   * somebody to a door the message did not contain. Every unit test passed:
   * one asserted the link is omitted, and none asserted the SENTENCES stop
   * referring to it. A dead end in an inbox has nowhere else to go.
   */
  it("stops telling you to open it when there is nothing to open", () => {
    const noLink = stoppedEmailText({ ...base, trackHref: null, nothingWillRetry: false });
    expect(noLink).toContain("It may still be picked up on its own.");
    expect(noLink).not.toContain("Opening it");
    const withLink = stoppedEmailText({ ...base, nothingWillRetry: false });
    expect(withLink).toContain("Opening it shows you");
  });
});
