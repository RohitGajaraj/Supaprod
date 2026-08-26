/**
 * THE GUARD THAT KEEPS A CLOCK HONEST, TESTED WHERE IT LIVES.
 *
 * `parseableInstant` is the whole safety story of `ElapsedRunning`: a live
 * counter may only mount when the row carries a real timestamp, because
 * `useElapsed` without a start counts from ITS OWN MOUNT — which would report
 * the age of the component as the age of the work, the exact lie its own
 * header forbids. So the fallback path ("running", no figure) must be
 * reachable for every malformed case, and unreachable for every good one.
 */

import { describe, expect, it } from "bun:test";

import { parseableInstant } from "./ElapsedRunning";

describe("parseableInstant", () => {
  it("accepts a real past timestamp", () => {
    const t = Date.parse("2026-08-26T10:00:00Z");
    expect(parseableInstant("2026-08-26T10:00:00Z")).toBe(t);
  });

  it("refuses null, blank, and garbage so the plain word renders instead", () => {
    expect(parseableInstant(null)).toBeNull();
    expect(parseableInstant(undefined)).toBeNull();
    expect(parseableInstant("")).toBeNull();
    expect(parseableInstant("not-a-date")).toBeNull();
  });

  it("refuses a future timestamp: a clock skew is not an age", () => {
    expect(parseableInstant("2999-01-01T00:00:00Z")).toBeNull();
  });
});
