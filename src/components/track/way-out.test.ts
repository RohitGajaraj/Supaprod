import { describe, expect, it } from "bun:test";

import { wayOut } from "./way-out";

/** Both Take it over controls on screen, which is the common case mid-route. */
const BOTH_OPEN = { undo: true, handback: true };
/** What `wayOut` appends when both Take it over controls are on screen. */
const BOTH_SENTENCE = "Send it back a step, or do this step yourself.";
import { HOLD_LINE, leadAgentFor } from "@/lib/spine/driver";
import { AGENT_STATIONS } from "@/lib/agent-vocabulary";
import type { AgentStation } from "@/lib/agent-vocabulary";

describe("no dead end, ever", () => {
  it("covers every hold the driver can write", () => {
    /*
     * The type already forces this at compile time. Asserted again at runtime
     * because HOLD_LINE is the list the SURFACE actually meets: a reason present
     * there and missing here would be a stop with nothing said about it, which
     * is the exact defect this file exists to remove.
     */
    for (const reason of Object.keys(HOLD_LINE)) {
      expect(() => wayOut(reason, BOTH_OPEN)).not.toThrow();
    }
    /*
     * Nineteen since P-04 added `waiting-on-another-run`. It is deliberately NOT
     * given an entry in this file: its own `HOLD_LINE` sentence already names
     * what happens next ("it continues on its own when that run's pull request
     * merges or closes"), and the driver writes the specific run, file and pull
     * request into `last_hold_because` above it. This file's rule, stated in its
     * own header, is that it speaks only where the record goes quiet -- and the
     * record is not quiet here. Adding a door this screen cannot open would be
     * the false-door failure the header warns about.
     */
    /*
     * Twenty since P-40 added `carried-on-your-sentence`, and it is deliberately
     * NOT given an entry here for the same reason: its own `HOLD_LINE` sentence
     * already says what happens next and what would change it ("Carrying on from
     * your sentence alone; add a source or say what you know to change that").
     *
     * It is also the one hold that rides along with a MOVE rather than a stop,
     * so a "way out" would be a door out of a run that is already going. R-36
     * names the door that must not appear on this transition -- *Let Discover
     * try again* -- and this is where it does not appear.
     */
    /*
     * TWENTY-ONE since P-71b added `the-call-is-yours`, and it is deliberately
     * NOT given an entry here for the same reason `carried-on-your-sentence` is
     * not: its own `HOLD_LINE` sentence already names both ways forward, and
     * the run screen draws the Choice itself. A door here would be a third
     * statement of the same question.
     *
     * THIS COUNT IS A CANARY AND NOT THE PROPERTY, which is worth saying because
     * a bare number is usually the F-189 anti-pattern. The property lives in the
     * two tests below -- the eight silent reasons get a sentence, the quiet ones
     * stay quiet -- and neither can notice a hold that exists in neither list.
     * This does. Bumping it is not maintenance: it is the act of having decided
     * which of those two lists the new hold belongs in.
     */
    expect(Object.keys(HOLD_LINE).length).toBe(21);
  });

  it("speaks for the eight reasons whose own sentence names no way out", () => {
    const silent = [
      "paused",
      "no-agent",
      "stalled",
      "going-in-circles",
      "tools-refused",
      "station-cannot-finish",
      "corrections-spent",
      "given-up",
    ];
    for (const reason of silent) {
      const w = wayOut(reason, BOTH_OPEN);
      expect(w.next).toBeTruthy();
      expect(w.next!.length).toBeGreaterThan(20);
    }
  });

  it("stays quiet where the driver already ends with the action", () => {
    // A second sentence repeating "top the account up" is noise, and noise is
    // how a surface teaches people to stop reading it.
    for (const reason of [
      "over-budget",
      "out-of-credit",
      "needs-evidence",
      "needs-a-waived-station",
      "produced-nothing",
      "nothing-to-hand-on",
      "self-check-failed",
      "out-of-time",
      "waiting-on-a-person",
      "done",
    ]) {
      expect(wayOut(reason, BOTH_OPEN).next).toBeNull();
    }
  });

  it("points at this screen only where this screen can actually act", () => {
    // Take it over offers exactly two moves: send it back a step, and do it by
    // hand. A pause lifted at workspace level is neither, so it must not claim
    // the controls below will help.
    expect(wayOut("paused", BOTH_OPEN).onThisScreen).toBe(false);
    for (const reason of ["going-in-circles", "tools-refused", "given-up", "no-agent"]) {
      expect(wayOut(reason, BOTH_OPEN).onThisScreen).toBe(true);
    }
  });

  /*
   * THE REGRESSION THIS FILE EXISTS TO HOLD, and it was found by driving the
   * feature rather than by reading it. A track going in circles AT THE FIRST
   * STATION ON ITS ROUTE was told "send it back a step, or do this step
   * yourself", directly above a region stating in as many words that there was
   * nothing to send it back to and offering no handback either. Pointing at a
   * door that is not there is the same defect as pointing at none.
   */
  it("never offers a control the screen is not showing", () => {
    const nothingOpen = wayOut("going-in-circles", { undo: false, handback: false });
    expect(nothingOpen.next).not.toContain("Send it back");
    expect(nothingOpen.next).not.toContain("hand the result in");
    expect(nothingOpen.onThisScreen).toBe(false);
    // And it still says something useful: for a run that will not converge,
    // changing the instruction is the only thing that changes the outcome.
    expect(nothingOpen.next).toContain("box below");
  });

  it("offers exactly what is open, and both in one clause when both are", () => {
    expect(wayOut("going-in-circles", { undo: true, handback: false }).next).toContain(
      "Send it back a step",
    );
    expect(wayOut("going-in-circles", { undo: false, handback: true }).next).toContain(
      "hand the result in",
    );
    const both = wayOut("going-in-circles", BOTH_OPEN).next!;
    expect(both).toContain("Send it back a step, or do this step yourself.");
    // One clause, not two sentences bolted together.
    expect(both).not.toContain("Send it back a step so it starts");
  });

  /*
   * S4 CAUGHT THIS AGAINST MY OWN CLAIM, on the drive trace rather than on the
   * row. `steerTrack` inserts a message and touches no hold, no attempts and no
   * station_drives, and the sweep removes a terminally held track from selection
   * entirely. So on those four holds a steer is stored and NOTHING EVER ARRIVES
   * TO CONSUME IT. Telling a person their instruction "reaches whoever picks
   * this up next" would be a failure that looks like success, which is worse
   * than the dead end this file was written to remove.
   */
  it("never promises a lone steer will be picked up on a terminal hold", () => {
    for (const terminal of ["going-in-circles", "given-up", "station-cannot-finish"]) {
      const only = wayOut(terminal, { undo: false, handback: false }, "Discover");
      expect(only.next).toContain("box below");
      // The pairing: an instruction AND a press, because one without the other
      // does nothing on a track the sweep will not select.
      expect(only.next).toContain("Let Discover try again");
      expect(only.next).toContain("Nothing will pick this up on its own");
    }
  });

  it("does not demand a press where the sweep will still come", () => {
    // `stalled` is not terminal, so the work is still selectable and a steer on
    // its own genuinely does reach the next run.
    const notTerminal = wayOut("stalled", { undo: false, handback: false }, "Discover");
    expect(notTerminal.next).toContain("reaches whoever picks this up next");
    expect(notTerminal.next).not.toContain("try again");
  });

  it("needs no press when undo or handback is the offer, since both clear the hold", () => {
    // rewindTrackTo and submitStationByHand each reset last_hold, attempts and
    // station_drives, so the track becomes drivable as part of the same act.
    const withUndo = wayOut("going-in-circles", { undo: true, handback: false }, "Discover");
    expect(withUndo.next).toContain("Send it back a step");
    expect(withUndo.next).not.toContain("Nothing will pick this up");
  });

  it("keeps the diagnosis even when nothing here can act", () => {
    // A pause is lifted at workspace level, so no control on this screen helps.
    // The person is still owed the reason, and must not be sent to a door.
    const paused = wayOut("paused", BOTH_OPEN);
    /*
     * It no longer repeats what the pause IS, because `HOLD_LINE["paused"]`
     * says that directly above it. What this line carries is the part that one
     * cannot: no control on this screen reaches a workspace-wide switch.
     */
    expect(paused.next).toContain("Nothing on this screen can lift it");
    expect(paused.next).not.toContain("workspace");
    expect(paused.next).not.toContain("Send it back");
    expect(paused.onThisScreen).toBe(false);
  });

  it("says nothing about a hold written by a newer deploy", () => {
    // `last_hold` is a text column. A confident wrong instruction is worse than
    // silence, which is the rule holdTone already runs on.
    expect(wayOut("some-reason-from-the-future", BOTH_OPEN).next).toBeNull();
    expect(wayOut(null).next).toBeNull();
    expect(wayOut(undefined).next).toBeNull();
  });

  it("carries no em dash on any branch", () => {
    for (const reason of Object.keys(HOLD_LINE)) {
      expect(wayOut(reason, BOTH_OPEN).next ?? "").not.toMatch(/[—–]/);
    }
  });
});

describe("the switched-off step tells the truth about itself", () => {
  /*
   * THE COPY ASSERTS A CAUSE, SO THE PRECONDITION IS PINNED HERE.
   *
   * `no-agent` has two sources and the sentence names only one of them: an
   * agent that exists and was switched off. That is safe exactly while the
   * OTHER source cannot fire, which is while every station has a lead agent.
   * All seven do today. If somebody adds a station without a crew, or empties
   * one, this fails and they are the person who has to decide what the screen
   * should say instead, rather than a reader meeting a confident wrong answer.
   */
  it("has a lead agent for every station, which is what makes the sentence true", () => {
    const stations = Object.keys(AGENT_STATIONS) as AgentStation[];
    expect(stations.length).toBe(7);
    for (const station of stations) {
      expect(leadAgentFor(station)).toBeTruthy();
    }
  });

  it("names the switch rather than blaming the reader's team", () => {
    const out = wayOut("no-agent", BOTH_OPEN);
    expect(out.next).toContain("switched off");
    expect(out.next).toContain("Agents");
    /*
     * AND DOES NOT RESTATE THE HOLD LINE ABOVE IT. `HOLD_LINE["no-agent"]`
     * already says "No agent is picking this step up". This sentence carries
     * only what that one cannot: which thing is off, and the door.
     */
    expect(out.next).not.toContain("nothing will pick it up");
    // The old sentence claimed a team gap and claimed the gap was permanent.
    // Turning the agent back on is one control, so neither may return.
    expect(out.next).not.toContain("your team");
    expect(out.next).not.toContain("no amount of trying");
  });

  it("still offers the hand-back, because doing it yourself remains real", () => {
    const out = wayOut("no-agent", BOTH_OPEN);
    expect(out.next).toContain("hand the result in");
    expect(out.onThisScreen).toBe(true);
  });
});

describe("a way out never repeats the line above it", () => {
  /*
   * The three that did. Each rendered directly under `HOLD_LINE[reason]` and
   * opened by restating it. Asserted against the WORDS the hold line owns, so
   * an edit that reintroduces the overlap fails here rather than on a screen
   * nobody is looking at.
   */
  const OWNED_BY_THE_HOLD_LINE: Record<string, string[]> = {
    paused: ["workspace", "paused"],
    stalled: ["produced nothing", "several times"],
    "going-in-circles": ["many times", "moved"],
    "no-agent": ["picking this step up", "nothing will pick it up"],
  };

  for (const [hold, phrases] of Object.entries(OWNED_BY_THE_HOLD_LINE)) {
    it(`says nothing the hold line already said, for ${hold}`, () => {
      const out = wayOut(hold, BOTH_OPEN);
      expect(out.next).toBeTruthy();
      for (const phrase of phrases) {
        expect(out.next?.toLowerCase()).not.toContain(phrase.toLowerCase());
      }
    });
  }

  it("still says something, because silence is the dead end this file removed", () => {
    for (const hold of Object.keys(OWNED_BY_THE_HOLD_LINE)) {
      expect((wayOut(hold, BOTH_OPEN).next ?? "").length).toBeGreaterThan(20);
    }
  });
});

describe("where the record already explained itself, only the door is added", () => {
  /*
   * `station-cannot-finish` is the largest hold in the database, 36 of 106
   * tracks. A person there read the same fact three times: the specific line
   * stored in `last_hold_because`, then `HOLD_LINE`, then this file restating
   * both. `HOLD_LINE` states the cause, the repetition AND that it needs a
   * person, so there was nothing left for a diagnosis to carry.
   */
  it("offers a door and no restatement for station-cannot-finish", () => {
    const out = wayOut("station-cannot-finish", BOTH_OPEN);
    expect(out.next).toBe(BOTH_SENTENCE);
    expect(out.onThisScreen).toBe(true);
  });

  /*
   * `corrections-spent` WAS IN THIS SET AND IS NOT ANY MORE, which is worth
   * recording rather than quietly editing. Its hold line said the cause when I
   * removed my sentence as a restatement; within the hour S0 reduced that line
   * to the effect alone, and the cause left the screen. The two holds look
   * alike and differ in the one thing that matters: what the line above still
   * says. See the hole guard below.
   */

  it("falls to the steer, and a terminal hold says a steer alone will not restart it", () => {
    /*
     * With neither Take it over control on screen the offer is the steer, and
     * `station-cannot-finish` is in TERMINAL_HOLDS, so the sweep has stopped
     * selecting it. The steer sentence says so rather than implying a message
     * will be picked up: storing an instruction nothing will ever consume is
     * the dead end this file exists to remove.
     */
    const out = wayOut("station-cannot-finish", { undo: false, handback: false });
    expect(out.next).toContain("Nothing will pick this up on its own");
    expect(out.onThisScreen).toBe(false);
  });

  it("still says nothing at all where the screen cannot help", () => {
    // The original contract, unchanged: no diagnosis and no door invents none.
    expect(wayOut("done", BOTH_OPEN)).toEqual({ next: null, onThisScreen: false });
    expect(wayOut(null)).toEqual({ next: null, onThisScreen: false });
  });

  it("keeps a diagnosis wherever one still earns its place", () => {
    // The other six are unaffected: their hold line names no way out at all.
    expect(wayOut("paused", BOTH_OPEN).next).toContain("Nothing on this screen can lift it");
    expect(wayOut("no-agent", BOTH_OPEN).next).toContain("switched off");
  });
});

describe("removing an overlap from both sides at once leaves a hole", () => {
  /*
   * S0's guard asserts the two lines do not say one thing TWICE. This asserts
   * the other failure, which we produced in the same hour by each fixing
   * `corrections-spent` from one side: their hold line became the effect alone,
   * I deleted my sentence as a restatement, and the CAUSE left the screen
   * entirely. Nothing said the work had been sent back for the same fix as
   * often as it is allowed.
   *
   * The division to hold to, from S0: the hold line carries WHAT IS HAPPENING,
   * this file carries WHY and WHAT TO DO. So where a hold line states only an
   * effect, the way out must still name the cause.
   */
  it("still names the cause for corrections-spent, which the hold line no longer does", () => {
    const out = wayOut("corrections-spent", BOTH_OPEN);
    expect(out.next).toContain("sent back for this same fix");
    expect(out.next).toContain("Send it back a step");
  });

  /*
   * ── AND THE ONE HOLD WHERE NO DIAGNOSIS IS THE RIGHT ANSWER ──────────────
   *
   * `given-up` carried "Nothing more will be tried here on its own.", which is
   * an EFFECT in the file that owns causes. Read live 2026-09-09, the hold card
   * said "nothing more will be tried" three times in three sentences owned by
   * three files, and this was the third.
   *
   * It is removed rather than rewritten because the cause for this hold is
   * already on the card and is BETTER than anything a constant here could say:
   * `spine_tracks.last_hold_because`, written per track by `decideCorrection`,
   * naming the station, the missing thing and the real correction count. So
   * this is not the hole above — the cause is named, by the row rather than by
   * this map — and the assertion has to be about the DOOR surviving, which is
   * what this file is left owning for this hold.
   */
  it("leaves given-up carrying the door alone, because the row names the cause", () => {
    const out = wayOut("given-up", BOTH_OPEN);
    expect(out.next).toBe("Send it back a step, or do this step yourself.");
    expect(out.onThisScreen).toBe(true);
    // The effect belongs to HOLD_LINE and must not come back here.
    expect(out.next).not.toContain("Nothing more");
    expect(out.next).not.toContain("will be tried");
  });

  it("does not put the effect back, which is the half S0's line owns", () => {
    // "Nothing further will be spent on this until you look." is theirs.
    expect(wayOut("corrections-spent", BOTH_OPEN).next).not.toContain("Nothing further");
  });
});
