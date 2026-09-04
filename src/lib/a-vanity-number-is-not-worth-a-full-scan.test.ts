import { describe, test, expect } from "bun:test";
import {
  WAITLIST_COUNT_TTL_MS,
  isFresh,
  resolveReading,
} from "./a-vanity-number-is-not-worth-a-full-scan";

describe("isFresh", () => {
  test("nothing read yet is not fresh", () => {
    expect(isFresh(undefined, 1_000)).toBe(false);
  });

  test("a reading inside the TTL is fresh, and one exactly at it is not", () => {
    const at = 1_000_000;
    expect(isFresh({ value: 42, at }, at + WAITLIST_COUNT_TTL_MS - 1)).toBe(true);
    expect(isFresh({ value: 42, at }, at + WAITLIST_COUNT_TTL_MS)).toBe(false);
  });

  test("a clock that moved backwards is stale, not infinitely fresh", () => {
    // The failure this prevents: a negative age passes `age < ttl` trivially,
    // which would pin one number for the life of the isolate.
    expect(isFresh({ value: 42, at: 2_000 }, 1_000)).toBe(false);
  });
});

describe("resolveReading", () => {
  test("a successful read is served and remembered with its timestamp", () => {
    const r = resolveReading(undefined, 128, 5_000);
    expect(r.served).toBe(128);
    expect(r.remember).toEqual({ value: 128, at: 5_000 });
  });

  test("a failed read with no prior value stays null, never 0", () => {
    // getWaitlistCount's contract: a failed census must not publish itself as
    // a real "0 in line". WaitlistForm hides the nudge on null.
    const r = resolveReading(undefined, null, 5_000);
    expect(r.served).toBeNull();
    expect(r.remember).toBeUndefined();
  });

  test("a failed read serves the last good value instead of hiding the nudge", () => {
    const prior = { value: 96, at: 1_000 } as const;
    const r = resolveReading(prior, null, 9_999);
    expect(r.served).toBe(96);
  });

  test("a failed read does not refresh the timestamp it is standing on", () => {
    // Otherwise a sustained outage would keep renewing the TTL and the stale
    // number would never expire -- the cache would outlive the truth.
    const prior = { value: 96, at: 1_000 } as const;
    const r = resolveReading(prior, null, 9_999);
    expect(r.remember).toEqual(prior);
    expect(r.remember?.at).toBe(1_000);
  });

  test("a real 0 is cached and served as 0, unlike a failure", () => {
    const r = resolveReading({ value: 5, at: 1 }, 0, 7_000);
    expect(r.served).toBe(0);
    expect(r.remember).toEqual({ value: 0, at: 7_000 });
  });
});
