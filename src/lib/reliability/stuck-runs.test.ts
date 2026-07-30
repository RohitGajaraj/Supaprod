import { describe, expect, test } from "bun:test";

import {
  DEFAULT_STUCK_MS,
  isRunStuck,
  silentFor,
  stuckReason,
  type StuckCandidate,
} from "./stuck-runs";

const NOW = Date.parse("2026-07-30T12:00:00Z");
const ago = (ms: number) => new Date(NOW - ms).toISOString();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

function run(over: Partial<StuckCandidate> = {}): StuckCandidate {
  return {
    status: "running",
    last_checkpoint_at: null,
    created_at: ago(5 * MIN),
    ...over,
  };
}

describe("isRunStuck", () => {
  // THE CASE THIS WAS WRITTEN FOR. The founder's own workspace: a builder run
  // at status='running' for fifteen days with no checkpoint, zero tokens and
  // no worker, reported by the header as live the whole time.
  test("the fifteen-day run with no checkpoint is stuck", () => {
    expect(isRunStuck(run({ created_at: ago(15 * DAY) }), NOW)).toBe(true);
  });

  test("a run that checkpointed recently is working, however old it is", () => {
    // The measure is PROGRESS, never age. Killing on total age would murder
    // exactly the long, valuable runs this product exists to make possible.
    const old = run({ created_at: ago(30 * DAY), last_checkpoint_at: ago(1 * MIN) });
    expect(isRunStuck(old, NOW)).toBe(false);
  });

  test("a run that checkpointed and then went quiet past the ceiling is stuck", () => {
    expect(isRunStuck(run({ last_checkpoint_at: ago(3 * HOUR) }), NOW)).toBe(true);
  });

  test("a fresh run is never stuck", () => {
    expect(isRunStuck(run({ created_at: ago(30_000) }), NOW)).toBe(false);
  });

  test("the ceiling is an upper bound, not a range", () => {
    expect(isRunStuck(run({ created_at: ago(DEFAULT_STUCK_MS - 1) }), NOW)).toBe(false);
    expect(isRunStuck(run({ created_at: ago(DEFAULT_STUCK_MS + 1) }), NOW)).toBe(true);
  });

  test("queued counts as in flight: an hour in a queue is not queueing", () => {
    expect(isRunStuck(run({ status: "queued", created_at: ago(2 * HOUR) }), NOW)).toBe(true);
  });

  // THE EXCLUSION THAT MATTERS MOST.
  describe("waiting on a human is never stuck", () => {
    test("waiting_approval survives any silence", () => {
      const parked = run({ status: "waiting_approval", created_at: ago(30 * DAY) });
      expect(isRunStuck(parked, NOW)).toBe(false);
    });

    test("and survives it at a deliberately tiny ceiling too", () => {
      // Not an accident of the default. A person who comes back on Monday to
      // find their work killed for not answering over the weekend has learned
      // never to trust this product with anything.
      const parked = run({ status: "waiting_approval", created_at: ago(30 * DAY) });
      expect(isRunStuck(parked, NOW, 1)).toBe(false);
    });
  });

  describe("fails safe, because the action is destructive", () => {
    test("terminal statuses are left alone", () => {
      for (const status of ["completed", "failed", "halted", "cancelled"]) {
        expect(isRunStuck(run({ status, created_at: ago(30 * DAY) }), NOW)).toBe(false);
      }
    });

    test("an unrecognised status is left alone rather than swept", () => {
      expect(isRunStuck(run({ status: "something_new", created_at: ago(30 * DAY) }), NOW)).toBe(
        false,
      );
    });

    test("an unreadable timestamp is not evidence of death", () => {
      expect(isRunStuck(run({ created_at: "not a date" }), NOW)).toBe(false);
      expect(isRunStuck(run({ last_checkpoint_at: "nonsense" }), NOW)).toBe(false);
    });

    test("a clock skew putting the run in the future does not kill it", () => {
      expect(isRunStuck(run({ created_at: new Date(NOW + DAY).toISOString() }), NOW)).toBe(false);
    });
  });
});

describe("silentFor", () => {
  test("measures from the checkpoint when there is one", () => {
    expect(
      silentFor(run({ last_checkpoint_at: ago(2 * HOUR), created_at: ago(9 * DAY) }), NOW),
    ).toBe(2 * HOUR);
  });

  test("falls back to created_at when the run never checkpointed", () => {
    expect(silentFor(run({ created_at: ago(3 * HOUR) }), NOW)).toBe(3 * HOUR);
  });

  test("null on an unreadable stamp, so the caller leaves the run alone", () => {
    expect(silentFor(run({ created_at: "" }), NOW)).toBeNull();
  });
});

describe("stuckReason", () => {
  // The reason has two readers: a person on the stopped run, and the NEXT
  // AGENT, because advanceMissionCore copies halted_reason onto the failed step.
  test("never started and died mid-flight are different sentences", () => {
    const never = stuckReason(run({ created_at: ago(4 * HOUR) }), NOW);
    const died = stuckReason(run({ last_checkpoint_at: ago(4 * HOUR) }), NOW);
    expect(never).not.toBe(died);
    expect(never).toContain("never started");
    expect(died).toContain("went quiet");
  });

  test("it says what was spent, because that is the first thing anyone asks", () => {
    expect(stuckReason(run({ created_at: ago(4 * HOUR) }), NOW)).toContain("Nothing was spent");
    expect(stuckReason(run({ last_checkpoint_at: ago(4 * HOUR) }), NOW)).toContain("was undone");
  });

  test("it reads as a sentence, singular and plural", () => {
    expect(stuckReason(run({ created_at: ago(61 * MIN) }), NOW)).toContain("for an hour");
    expect(stuckReason(run({ created_at: ago(5 * HOUR) }), NOW)).toContain("for 5 hours");
  });

  test("a sub-hour silence still reads as at least an hour rather than zero", () => {
    // Only reachable with a lowered ceiling, but "no progress for 0 hours" is
    // not a sentence anyone should ever be shown.
    expect(stuckReason(run({ created_at: ago(90 * 1000) }), NOW)).toContain("for an hour");
  });
});
