import { describe, expect, it } from "bun:test";

import { footerMode } from "./footer-mode";
import { TERMINAL_HOLDS } from "@/lib/spine/correction";
import { holdTone } from "@/lib/spine/driver";

describe("the coupling this footer's terminal branch is gated on", () => {
  it("routes every terminal hold through tone 'you', which is where the branch lives", () => {
    /*
     * THE GUARD FOR THE DEFECT THIS UNIT SHIPPED AND THEN CAUGHT.
     *
     * The branch is argued from `TERMINAL_HOLDS` and gated on `holdTone`. Those
     * are two different sets in two different files, and the first version of
     * this work put the branch under tone "hold" -- correct against the
     * argument, unreachable against the gate, because all four terminal
     * reasons are also in `HOLD_NEEDS_PERSON`. Nothing failed. `tsc` passed,
     * the suite passed, and the branch could not be reached by a single row.
     *
     * So the coupling is asserted rather than assumed. Move a terminal reason
     * out of `HOLD_NEEDS_PERSON` and this fails HERE, naming the footer, rather
     * than silently sending 36 tracks back to a sentence about a question that
     * is not open.
     */
    for (const hold of TERMINAL_HOLDS) {
      expect({ hold, tone: holdTone(hold) }).toEqual({ hold, tone: "you" });
    }
  });
});

const at = (o: Partial<Parameters<typeof footerMode>[0]>) =>
  footerMode({ status: "open", tone: null, hold: null, walking: false, crewLive: false, ...o });

describe("the footer", () => {
  it("never says a position", () => {
    /*
     * THE-ONE-SCREEN:31, and the reason is R-13's: a route that waives and
     * reopens stations cannot honestly be drawn as a position. "Step 3 of 7" is
     * a position wearing a sentence, so no branch may count anything.
     */
    const every = [
      at({ walking: true }),
      at({ crewLive: true }),
      at({ tone: "you" }),
      at({ tone: "hold" }),
      at({}),
      at({ status: "done" }),
      at({ status: "abandoned" }),
    ];
    for (const m of every) {
      expect(m.line).not.toMatch(/\bstep\b/i);
      expect(m.line).not.toMatch(/\d+\s*of\s*\d+/i);
      expect(m.line).not.toMatch(/[—–]/);
    }
  });

  it("offers a Stop only where a press here can actually stop something", () => {
    // This tab's own press bought the legs, so cancelling them is real.
    expect(at({ walking: true }).canStop).toBe(true);
    // The sweep's run is not stoppable from this surface. Drawing a Stop for it
    // would be a control that cannot act, which is the failure RunMap's own Stop
    // was removed for.
    expect(at({ crewLive: true }).canStop).toBe(false);
    for (const m of [at({ tone: "you" }), at({ tone: "hold" }), at({ status: "done" })]) {
      expect(m.canStop).toBe(false);
    }
  });

  it("tells the truth about work it cannot stop, rather than going quiet", () => {
    // Same mode line either way: something IS working. Only the control differs.
    expect(at({ crewLive: true }).line).toBe(at({ walking: true }).line);
  });

  it("says it will ask before it ships, which R-27 makes true everywhere", () => {
    /*
     * Not a mood. release.publish is pinned to review and can never graduate,
     * and R-27 refused the flag that would have let it run unattended. It is a
     * platform invariant, not a workspace setting, which is what makes it safe
     * to say on every run.
     */
    expect(at({ walking: true }).line).toContain("ask before it ships");
  });

  it("separates waiting on a person from stopped for another reason", () => {
    expect(at({ tone: "you" }).line).toContain("you");
    expect(at({ tone: "hold" }).line).toContain("not on you");
  });
});

describe("whether anything is still coming for a stopped run", () => {
  /*
   * THE TONE THESE ARRIVE UNDER IS "you", NOT "hold", AND GETTING THAT WRONG
   * IS WHAT THE FIRST VERSION OF THIS SUITE DID.
   *
   * `holdTone` returns "you" for `HOLD_NEEDS_PERSON`, and all four members of
   * `TERMINAL_HOLDS` are in that set. A version of these tests written against
   * `tone: "hold"` passed while the branch it described could not be reached
   * by a single row in the database. So every case below states the tone it is
   * really testing, and the pair at the bottom pins the two sets apart.
   */
  const needsMe = (hold: string | null) =>
    footerMode({ status: "open", tone: "you", hold, walking: false, crewLive: false });

  it("says nothing is coming, on every hold the sweep refuses", () => {
    // The four in TERMINAL_HOLDS, named rather than looped over the constant,
    // so adding a fifth member does not silently pass this on four of five.
    for (const hold of ["given-up", "station-cannot-finish", "tools-refused", "going-in-circles"]) {
      expect(needsMe(hold).line).toBe("Stopped here. Nothing will pick it up again on its own.");
    }
  });

  it("keeps 'waiting on you' for the one hold where a question really is open", () => {
    /*
     * `waiting-on-a-person` is a boundary call with an answer pending, and it
     * is 1 of the 37 rows reaching this branch. The other 36 have nothing for
     * the person to answer, which is the whole reason for the split.
     */
    expect(needsMe("waiting-on-a-person").line).toBe("Waiting on you.");
    expect(needsMe("corrections-spent").line).toBe("Waiting on you.");
  });

  it("leaves the not-on-you branch alone, because no terminal hold reaches it", () => {
    // 19 open tracks, none terminal. `holdTone` sends every terminal reason to
    // "you", so this branch never has the question the split exists to answer.
    for (const hold of ["out-of-time", "needs-evidence", "needs-a-waived-station"]) {
      const m = footerMode({ status: "open", tone: "hold", hold, walking: false, crewLive: false });
      expect(m.line).toBe("Stopped, and not on you.");
    }
  });

  it("treats an unreadable hold as the softer of the two", () => {
    /*
     * `last_hold` is a text column, so a value written by a newer deploy
     * reaches here as a string this build does not know. `way-out.ts` takes the
     * same position for the same reason: the wrong direction to guess is the
     * one that tells a person the loop has quit on work it was going to pick
     * up anyway.
     */
    expect(needsMe(null).line).toBe("Waiting on you.");
    expect(needsMe("a-reason-from-a-later-deploy").line).toBe("Waiting on you.");
  });

  it("still offers no Stop and no leave line either way", () => {
    // Nothing is running in either branch, so there is nothing to stop and
    // nothing leaving could interrupt.
    for (const hold of ["given-up", "waiting-on-a-person", null]) {
      expect(needsMe(hold).canStop).toBe(false);
      expect(needsMe(hold).leave).toBeNull();
    }
  });

  it("does not let the hold leak into a mode that is still running", () => {
    /*
     * MEASURED 2026-08-31: zero tracks hold a terminal reason AND carry a run
     * in flight, so the two cannot co-occur today. This pins the behaviour if
     * they ever do: something IS working, and the footer says so rather than
     * reporting a stale column over a live run.
     */
    const live = footerMode({
      status: "open",
      tone: "you",
      hold: "given-up",
      walking: false,
      crewLive: true,
    });
    expect(live.line).toContain("Working on its own");
  });
});

describe("whether this page is required", () => {
  const base = {
    status: "open" as const,
    tone: null,
    hold: null,
    walking: false,
    crewLive: false,
  };

  it("says you can leave when the loop is driving it", () => {
    const m = footerMode({ ...base, crewLive: true });
    expect(m.leave).toBe("You can close this. It carries on without you.");
    expect(m.canStop).toBe(false);
  });

  it("does not say you can leave when this tab is buying the legs", () => {
    /*
     * The next leg is a `setTimeout` inside `TrackRun`. Close the page and no
     * further leg is bought, so "Working on its own" reads as permission to
     * leave in the one mode where leaving changes what happens.
     */
    const m = footerMode({ ...base, walking: true });
    expect(m.leave).not.toContain("carries on without you");
    expect(m.leave).toContain("finishes the step it is on");
    expect(m.canStop).toBe(true);
  });

  it("keeps the two modes distinguishable, which one sentence could not", () => {
    const walking = footerMode({ ...base, walking: true });
    const swept = footerMode({ ...base, crewLive: true });
    expect(walking.line).toBe(swept.line);
    expect(walking.leave).not.toBe(swept.leave);
  });

  it("promises nothing about the sweep picking it up afterwards", () => {
    /*
     * A track on a terminal hold is removed from the sweep's selection
     * entirely, and this footer cannot see which. So it claims only the leg
     * already dispatched, which is a server call and does finish.
     */
    const m = footerMode({ ...base, walking: true });
    for (const promise of ["carries on", "the loop", "picks it up", "resumes"]) {
      expect(m.leave?.toLowerCase()).not.toContain(promise);
    }
  });

  it("says nothing about leaving a run that is not running", () => {
    // Reassurance about work that is not happening is the failure this surface
    // is built against.
    expect(footerMode({ ...base, tone: "you" }).leave).toBeNull();
    expect(footerMode({ ...base, tone: "hold" }).leave).toBeNull();
    expect(footerMode(base).leave).toBeNull();
    expect(footerMode({ ...base, status: "done" }).leave).toBeNull();
    expect(footerMode({ ...base, status: "abandoned" }).leave).toBeNull();
  });
});
