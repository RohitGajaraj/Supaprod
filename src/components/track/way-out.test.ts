import { describe, expect, it } from "bun:test";

import { wayOut } from "./way-out";

/** Both Take it over controls on screen, which is the common case mid-route. */
const BOTH_OPEN = { undo: true, handback: true };
import { HOLD_LINE } from "@/lib/spine/driver";

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
    expect(Object.keys(HOLD_LINE).length).toBe(18);
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
    expect(paused.next).toContain("pause is lifted");
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
