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
  footerMode({
    status: "open",
    tone: null,
    hold: null,
    because: null,
    walking: false,
    crewLive: false,
    ...o,
  });

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

  it("offers a Stop wherever something is actually running", () => {
    // This tab's own press bought the steps, so cancelling them is real.
    expect(at({ walking: true }).canStop).toBe(true);
    /*
     * ── THIS ASSERTION FLIPPED, AND THE FACT UNDER IT CHANGED ──────────────
     * It read `false`, and the reason it gave was right at the time: Stop was
     * `setLegsLeft(0)` in one browser tab, so it genuinely could not reach a run
     * the sweep was driving, and drawing a control that cannot act is the
     * failure RunMap's own Stop was removed for.
     *
     * `spine_tracks.stop_requested_at` changed what Stop IS. It is a row now,
     * and `driveTrackOnce` reads it before dispatching any seat, so one press
     * binds the sweep and this tab alike. The control can act, so it is drawn.
     * The old expectation was pinning a limitation rather than a rule.
     */
    expect(at({ crewLive: true }).canStop).toBe(true);
    // Nothing is running in any of these, so there is nothing to stop.
    for (const m of [at({ tone: "you" }), at({ tone: "hold" }), at({ status: "done" })]) {
      expect(m.canStop).toBe(false);
    }
  });

  it("never offers Stop and Run at once, and offers neither on a settled run", () => {
    /*
     * A run is either moving or it is not, so the two are mutually exclusive;
     * a settled run is neither, which is why they are two booleans and not one
     * flag. A footer drawing both would be the two-controls-in-two-places shape
     * the `Run it` region was removed for.
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
    for (const m of every) expect(m.canStop && m.canRun).toBe(false);
    for (const m of [at({ status: "done" }), at({ status: "abandoned" })]) {
      expect(m.canStop).toBe(false);
      expect(m.canRun).toBe(false);
    }
  });

  it("says you stopped it, rather than that the workspace is paused", () => {
    /*
     * A person's Stop and the workspace kill switch both hold as `paused`,
     * because the hold vocabulary is closed. Without the sentinel this branch
     * fell through to `tone: "hold"` and said "Stopped, and not on you." about a
     * stop that was entirely on you, while the pane above printed "Stopped by
     * you." One screen, two incompatible claims about one row.
     */
    const mine = at({ tone: "hold", hold: "paused", because: "Stopped by you." });
    expect(mine.line).toContain("You stopped this");
    expect(mine.canStop).toBe(false);
    expect(mine.canRun).toBe(true);

    // The kill switch is a different fact and keeps its own sentence.
    const killed = at({ tone: "hold", hold: "paused", because: null });
    expect(killed.line).toBe("Stopped, and not on you.");
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

  it("says nothing is coming, on every hold the sweep refuses -- and offers the restart, since it is the way out", () => {
    // The four in TERMINAL_HOLDS, named rather than looped over the constant,
    // so adding a fifth member does not silently pass this on four of five.
    for (const hold of ["given-up", "station-cannot-finish", "tools-refused", "going-in-circles"]) {
      const m = needsMe(hold);
      expect(m.line).toBe("Stopped here. Nothing will pick it up again on its own.");
      // P-43 (A-QUEUE.md): "Run it now" IS the way out on a terminal hold --
      // track-tick has dropped the row from its own selection, so nothing
      // else will ever press it again.
      expect(m.canRun).toBe(true);
    }
  });

  it("keeps 'waiting on you' for the one hold where a question really is open -- and offers no second control for it", () => {
    /*
     * `waiting-on-a-person` is a boundary call with an answer pending, and it
     * is 1 of the 37 rows reaching this branch. The other 36 have nothing for
     * the person to answer, which is the whole reason for the split.
     *
     * P-43 (A-QUEUE.md): "Waiting on you." beside a "Run it now" button was
     * two verbs for one state -- the real way out of an OPEN gate is
     * answering it, not a footer control that only ever restarts a dead
     * track. `canRun` follows the same terminal/non-terminal split the line
     * already drew, so this branch offers no button at all.
     */
    for (const hold of ["waiting-on-a-person", "corrections-spent"]) {
      const m = needsMe(hold);
      expect(m.line).toBe("Waiting on you.");
      expect(m.canRun).toBe(false);
    }
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
    // P-43 (A-QUEUE.md): the softer read also means no restart button offered
    // in its place -- guessing "terminal" for an unknown reason would be the
    // wrong direction the header above already refuses.
    expect(needsMe(null).canRun).toBe(false);
    expect(needsMe("a-reason-from-a-later-deploy").canRun).toBe(false);
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
    because: null,
    walking: false,
    crewLive: false,
  };

  it("says you can leave when the loop is driving it", () => {
    const m = footerMode({ ...base, crewLive: true });
    expect(m.leave).toBe("You can close this. It carries on without you.");
    /* And a Stop is offered anyway, which is not a contradiction: leaving is
       optional and stopping is possible. Both became true when the stop became
       a row the driver reads rather than a number in this tab. */
    expect(m.canStop).toBe(true);
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

describe("a calendar wait is one sentence and no door", () => {
  /**
   * A1, walking the honest run at 17:28 IST: a track at Learn waiting for a
   * forecast date had the screen saying FOUR things about one state, and one of
   * them was a control that could not change it.
   *
   *   an "On hold" chip
   *   the character: "I've stopped, the reason is on the hold line"
   *   this footer: "Stopped, and not on you."
   *   a "Run it now" button
   *
   * Three statements of one fact and a door onto nothing. The chip already
   * names the state, so the footer says only the thing a person wants, which is
   * when it comes back.
   */
  it("does not call a date wait a stoppage", () => {
    const m = footerMode({
      status: "open",
      tone: "hold",
      hold: "needs-evidence",
      because: null,
      walking: false,
      crewLive: false,
      station: "learn",
    });
    expect(m.line).not.toContain("Stopped");
    expect(m.line).toContain("Learn returns");
  });

  it("draws no door, because there is nothing to press that would help", () => {
    const m = footerMode({
      status: "open",
      tone: "hold",
      hold: "needs-evidence",
      because: null,
      walking: false,
      crewLive: false,
      station: "learn",
    });
    expect(m.canRun).toBe(false);
    expect(m.canStop).toBe(false);
  });

  it("says the date when one is known and never invents one when it is not", () => {
    const base = {
      status: "open" as const,
      tone: "hold" as const,
      hold: "needs-evidence",
      because: null,
      walking: false,
      crewLive: false,
      station: "learn",
    };
    expect(footerMode({ ...base, returnsOn: "Sat, Oct 3" }).line).toBe("Learn returns Sat, Oct 3.");
    // Nothing on `Track` carries the horizon yet, so this is the live case.
    expect(footerMode(base).line).toBe("Learn returns when the forecast comes due.");
  });

  it("leaves needs-evidence at any OTHER station alone", () => {
    // Only Learn waits on a forecast horizon. Discover with no sources is a
    // person's to fix and keeps its own door.
    const m = footerMode({
      status: "open",
      tone: "hold",
      hold: "needs-evidence",
      because: null,
      walking: false,
      crewLive: false,
      station: "sense",
    });
    expect(m.line).not.toContain("Learn returns");
  });
});

describe("an overdue horizon is not a calendar wait", () => {
  /**
   * Found by checking a claim rather than acting on it. A1 reported the footer
   * still saying "Stopped, and not on you" and reasoned that the predicate read
   * a different fact from the chip: the hold string versus the forecast horizon.
   *
   * The database said otherwise (`last_hold` WAS "needs-evidence" at learn, so
   * the predicate matched, and the build read was simply older than the fix) and
   * the chip reads the hold string too. But the check surfaced a real bug of
   * mine underneath the wrong diagnosis: my predicate asked TWO of the three
   * things the chip asks, and the missing one is the horizon.
   *
   * A track at Learn on `needs-evidence` whose horizon has ALREADY PASSED is not
   * waiting on the calendar. It is overdue, and telling that person to wait for
   * something that already happened is the worst reading of the three.
   */
  const at = (horizon: string | null, now: number) =>
    footerMode({
      status: "open",
      tone: "hold",
      hold: "needs-evidence",
      because: null,
      walking: false,
      crewLive: false,
      station: "learn",
      horizon,
      now,
    });

  const NOW = Date.parse("2026-09-03T12:00:00.000Z");

  it("still reads a future horizon as a calendar wait", () => {
    expect(at("2026-10-03T00:00:00.000Z", NOW).line).toContain("Learn returns");
  });

  it("does NOT call an overdue track a calendar wait", () => {
    const m = at("2026-08-01T00:00:00.000Z", NOW);
    expect(m.line).not.toContain("Learn returns");
  });

  it("reads an unknown horizon broadly rather than calling it a stoppage", () => {
    // Most surfaces have not plumbed the date. Calling a calendar wait a
    // stoppage everywhere is the louder wrong.
    expect(at(null, NOW).line).toContain("Learn returns");
  });
});
