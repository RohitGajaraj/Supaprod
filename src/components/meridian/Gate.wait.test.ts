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
 * `/approvals` already drew it (`CallGate`), and that route folds. The fix
 * therefore went into the PRIMITIVE rather than into either surface, so every
 * gate in the product can state it and none of them can word it differently.
 *
 * ── THREE STATES, NOT TWO ──────────────────────────────────────────────────
 * `undefined` is "this gate has no age", `null` is "it has one and we could not
 * read it". Absence and unknown are different facts. A missing time on a call
 * a person is about to settle may never be dressed as a fresh one.
 */

const GATE = readFileSync("src/components/meridian/Gate.tsx", "utf8");
const QUEUE = readFileSync("src/components/today/DecisionQueue.tsx", "utf8");

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

describe("the gate", () => {
  it("SAYS NOTHING when the caller has no age concept, so old callers are unchanged", () => {
    expect(GATE).toContain("since === undefined ? null");
  });

  it("SAYS SO OUT LOUD when it has an age and cannot read it", () => {
    expect(GATE).toContain("How long this has been waiting is not known.");
  });

  it("uses the shared phrase and the shared boundary, never its own", () => {
    expect(GATE).toContain('from "@/components/meridian/stopped-for"');
    expect(GATE).toContain("stoppedFor(since,");
    expect(GATE).toContain("isOverdue(since,");
  });

  it("carries the exact instant for anyone who needs it", () => {
    expect(GATE).toContain("title={new Date(since).toLocaleString()}");
  });
});

describe("the board's queue", () => {
  it("passes the call's own wait to the gate", () => {
    expect(QUEUE).toContain("since={waitingSince(item.timestamp)}");
  });

  it("reads it from the SAME module the sort orders by", () => {
    // Two sources for one age is how a surface comes to disagree with itself
    // about which call is oldest.
    expect(QUEUE).toContain('from "@/components/meridian/stopped-for"');
  });
});
