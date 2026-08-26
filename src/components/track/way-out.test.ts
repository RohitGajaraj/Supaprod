import { describe, expect, it } from "bun:test";

import { wayOut } from "./way-out";
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
      expect(() => wayOut(reason)).not.toThrow();
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
      const w = wayOut(reason);
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
      expect(wayOut(reason).next).toBeNull();
    }
  });

  it("points at this screen only where this screen can actually act", () => {
    // Take it over offers exactly two moves: send it back a step, and do it by
    // hand. A pause lifted at workspace level is neither, so it must not claim
    // the controls below will help.
    expect(wayOut("paused").onThisScreen).toBe(false);
    for (const reason of ["going-in-circles", "tools-refused", "given-up", "no-agent"]) {
      expect(wayOut(reason).onThisScreen).toBe(true);
    }
  });

  it("says nothing about a hold written by a newer deploy", () => {
    // `last_hold` is a text column. A confident wrong instruction is worse than
    // silence, which is the rule holdTone already runs on.
    expect(wayOut("some-reason-from-the-future").next).toBeNull();
    expect(wayOut(null).next).toBeNull();
    expect(wayOut(undefined).next).toBeNull();
  });

  it("carries no em dash on any branch", () => {
    for (const reason of Object.keys(HOLD_LINE)) {
      expect(wayOut(reason).next ?? "").not.toMatch(/[—–]/);
    }
  });
});
