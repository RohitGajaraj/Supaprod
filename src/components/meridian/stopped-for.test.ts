import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

import { isOverdue, stoppedFor } from "./stopped-for";

/**
 * THE CALL IN FRONT OF YOU SAYS HOW LONG IT HAS WAITED.
 *
 * ── THE DEFECT ─────────────────────────────────────────────────────────────
 * Every list row under the board's gate carried an age. The gate did not. So
 * the ONE call a person was about to settle was the only thing on the surface
 * that would not say how old it was, and it is the one place the fact changes
 * what they do. Measured on the rendered board 2026-08-27, signed in: the call
 * in the gate had waited 49 days and said nothing, while the row beneath it
 * read "42d".
 *
 * P-53 (A-QUEUE.md) deleted `meridian/Gate.tsx` and `approvals/CallGate.tsx`
 * -- every real composer moved to `Ask`, `Choice`, `Quiet` or plain markup.
 * This file was `Gate.wait.test.ts`, named for and reading the deleted file's
 * source; renamed for what it actually protects now, `stoppedFor`/`isOverdue`
 * themselves, still shared by every surface that shows an age (`TrackConsent`
 * carries the one remaining hand-built gate card that draws one, see below).
 */

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

describe("the phrase", () => {
  it("is the shortest true form, and it is the one every other surface prints", () => {
    expect(stoppedFor(0, 49 * DAY)).toBe("49 days");
    expect(stoppedFor(0, DAY)).toBe("1 day");
    expect(stoppedFor(0, 3 * HOUR)).toBe("3 hours");
    expect(stoppedFor(0, 60_000)).toBe("1 minute");
  });

  it("NEVER READS ZERO, because a call that exists has waited some amount", () => {
    expect(stoppedFor(0, 0)).toBe("1 minute");
  });

  it("takes the accent past a day, the boundary a night nobody looked", () => {
    expect(isOverdue(0, DAY - 1)).toBe(false);
    expect(isOverdue(0, DAY)).toBe(true);
  });
});

describe("TrackConsent's own gate card, the last hand-built one", () => {
  // CallGate's shell moved here (P-53's own header on `GateCard` explains
  // why: TrackConsent's answer area does not fit `Ask`'s fixed slots). It is
  // the one place left that draws a call's waiting clock outside `Ask`, so
  // the invariants this file used to pin against `Gate.tsx` are pinned
  // against it instead.
  const SRC = readFileSync("src/components/track/TrackConsent.tsx", "utf8");

  it("says so out loud when there is no age to show", () => {
    expect(SRC).toContain("How long this has been waiting is not known.");
  });

  it("uses the shared phrase and the shared boundary, never its own", () => {
    expect(SRC).toContain('from "@/components/meridian/stopped-for"');
    expect(SRC).toContain("stoppedFor(since,");
    expect(SRC).toContain("isOverdue(since,");
  });

  it("carries the exact instant for anyone who needs it", () => {
    expect(SRC).toContain("title={new Date(since).toLocaleString()}");
  });
});
