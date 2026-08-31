/**
 * THE TAB CARRIES THE ONE LIVE FACT, DERIVED FROM ROWS.
 *
 * Unit RUN-02: a run must be watchable and leavable. After the person switches
 * tabs, the browser tab is where they look, so the title carries exactly one
 * word of news -- "Working", or "Waiting on you" -- and only while a row or
 * this pane's own mutation proves it. Finished and stopped-quiet titles say
 * nothing, because the page behind them already does and a title is one glance.
 *
 * The precedence matches the presence derivation: a person being needed
 * outranks busyness. Flow mode (use-flow-mode) owns the title during a focus
 * block, so this stands down while `html.flow` is set rather than fighting it.
 */
import { describe, expect, it } from "bun:test";

import { runTabState } from "./run-tab";

const base = { status: "open" as string | null, holdReason: null, walking: false, crewLive: false };

describe("runTabState", () => {
  it("a live crew is Working -- including work this tab did not start", () => {
    expect(runTabState({ ...base, crewLive: true })).toBe("Working");
  });

  it("this tab's own walk in flight is Working", () => {
    expect(runTabState({ ...base, walking: true })).toBe("Working");
  });

  it("waiting on the person outranks busyness", () => {
    expect(
      runTabState({ ...base, holdReason: "waiting-on-a-person", walking: true, crewLive: true }),
    ).toBe("Waiting on you");
  });

  it("tells the tab a stopped run needs restarting, not that it is waiting", () => {
    /*
     * The four terminal reasons all live inside `HOLD_NEEDS_PERSON`, so they
     * reached the "Waiting on you" branch and told 36 people the browser tab
     * was holding a question for them. Nothing is pending; the loop quit and
     * `track-tick.ts` dropped the track. The word matches the header chip in
     * `run-status.ts` exactly.
     */
    for (const holdReason of [
      "given-up",
      "station-cannot-finish",
      "tools-refused",
      "going-in-circles",
    ]) {
      expect({ holdReason, word: runTabState({ ...base, holdReason }) }).toEqual({
        holdReason,
        word: "Needs a restart",
      });
    }
    // And it still outranks busyness, for the same reason the open call does:
    // a person who has to act should not read "Working" and walk away.
    expect(runTabState({ ...base, holdReason: "given-up", walking: true, crewLive: true })).toBe(
      "Needs a restart",
    );
  });

  it("finished and abandoned are quiet", () => {
    expect(runTabState({ ...base, status: "done", crewLive: true })).toBeNull();
    expect(runTabState({ ...base, status: "abandoned", holdReason: "given-up" })).toBeNull();
  });

  it("stopped on a condition is quiet -- the page says why", () => {
    expect(runTabState({ ...base, holdReason: "needs-evidence" })).toBeNull();
  });

  it("an idle open track is quiet", () => {
    expect(runTabState(base)).toBeNull();
  });
});
