import { describe, expect, it } from "bun:test";

import { nothingHasPickedItUp, COLD_AFTER_MS } from "./nothing-has-picked-it-up";

const NOW = Date.parse("2026-09-09T12:00:00Z");
const ago = (ms: number) => new Date(NOW - ms).toISOString();
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

describe("the threshold is where the measurement put it", () => {
  it("sits just past p99 of every gap the loop has actually closed", () => {
    // p50 10.4 min, p90 99.9 min, p99 ~2.07 days, over 1,730 real gaps.
    expect(COLD_AFTER_MS).toBe(48 * HOUR);
  });

  it("a track the loop is working is never called cold", () => {
    // The sweep's own tick, and the ninetieth percentile.
    expect(nothingHasPickedItUp({ drivenAt: ago(10 * 60 * 1000), nowMs: NOW })).toBe(false);
    expect(nothingHasPickedItUp({ drivenAt: ago(100 * 60 * 1000), nowMs: NOW })).toBe(false);
    expect(nothingHasPickedItUp({ drivenAt: ago(DAY), nowMs: NOW })).toBe(false);
  });

  it("and the sixty on production are, by a factor of four to nine", () => {
    expect(nothingHasPickedItUp({ drivenAt: ago(8 * DAY), nowMs: NOW })).toBe(true);
    expect(nothingHasPickedItUp({ drivenAt: ago(19 * DAY), nowMs: NOW })).toBe(true);
  });
});

describe("what is NOT cold, and why each would be a false alarm", () => {
  it("a track waiting on a date it has not reached", () => {
    // The `scheduled` register is already telling the truth about this one, and
    // a second surface calling the same wait abandonment would contradict it.
    expect(
      nothingHasPickedItUp({
        drivenAt: ago(9 * DAY),
        deferredUntil: new Date(NOW + 5 * DAY).toISOString(),
        nowMs: NOW,
      }),
    ).toBe(false);
  });

  it("but is cold again once that date has passed", () => {
    expect(
      nothingHasPickedItUp({
        drivenAt: ago(9 * DAY),
        deferredUntil: ago(2 * DAY),
        nowMs: NOW,
      }),
    ).toBe(true);
  });

  it("a track that has never run at all", () => {
    // It has not been waiting, it has not started, and calling that
    // abandonment would invent a history for something with none.
    expect(nothingHasPickedItUp({ drivenAt: null, nowMs: NOW })).toBe(false);
    expect(nothingHasPickedItUp({ drivenAt: undefined, nowMs: NOW })).toBe(false);
  });

  it("and a stamp this build cannot read", () => {
    // `driven_at` is a timestamp column, but an unparseable value must read as
    // "we cannot say" rather than as evidence of a long silence.
    expect(nothingHasPickedItUp({ drivenAt: "not a date", nowMs: NOW })).toBe(false);
  });
});
