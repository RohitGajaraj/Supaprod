import { describe, it, expect } from "bun:test";
import {
  isAutoPassDue,
  computeStaleness,
  mayAutoApply,
  SCHEDULED_INTERVAL_MS,
  STALENESS_MS,
} from "@/lib/self-improve-governance";

// Fixed clock so the seam is deterministic (no reliance on the real Date.now()).
const NOW = Date.parse("2026-07-12T12:00:00.000Z");
const iso = (msAgo: number) => new Date(NOW - msAgo).toISOString();

describe("isAutoPassDue", () => {
  it("off never runs the auto pass", () => {
    expect(isAutoPassDue("off", null, NOW)).toBe(false);
    expect(isAutoPassDue("off", iso(SCHEDULED_INTERVAL_MS * 10), NOW)).toBe(false);
  });

  it("due when never run", () => {
    expect(isAutoPassDue("scheduled", null, NOW)).toBe(true);
    expect(isAutoPassDue("auto", undefined, NOW)).toBe(true);
  });

  it("not due before the interval, due at/after it", () => {
    expect(isAutoPassDue("scheduled", iso(SCHEDULED_INTERVAL_MS - 3600_000), NOW)).toBe(false);
    expect(isAutoPassDue("scheduled", iso(SCHEDULED_INTERVAL_MS), NOW)).toBe(true);
    expect(isAutoPassDue("scheduled", iso(SCHEDULED_INTERVAL_MS + 3600_000), NOW)).toBe(true);
  });

  it("treats an unparseable timestamp as never-run (due)", () => {
    expect(isAutoPassDue("scheduled", "not-a-date", NOW)).toBe(true);
  });
});

describe("computeStaleness", () => {
  it("never stale unless off", () => {
    for (const mode of ["auto", "scheduled"] as const) {
      const r = computeStaleness({ mode, lastHumanTouchAt: null, openFlagCount: 5, now: NOW });
      expect(r.stale).toBe(false);
      expect(r.message).toBeNull();
    }
  });

  it("off with no open flags is healthy-quiet, not stale", () => {
    const r = computeStaleness({ mode: "off", lastHumanTouchAt: null, openFlagCount: 0, now: NOW });
    expect(r.stale).toBe(false);
  });

  it("off with open flags and never touched is stale", () => {
    const r = computeStaleness({ mode: "off", lastHumanTouchAt: null, openFlagCount: 2, now: NOW });
    expect(r.stale).toBe(true);
    expect(r.message).toContain("2 open flags");
  });

  it("off with a recent human touch is not yet stale", () => {
    const r = computeStaleness({
      mode: "off",
      lastHumanTouchAt: iso(STALENESS_MS - 24 * 3600_000),
      openFlagCount: 3,
      now: NOW,
    });
    expect(r.stale).toBe(false);
  });

  it("off past the window is stale, with singular copy for one flag", () => {
    const r = computeStaleness({
      mode: "off",
      lastHumanTouchAt: iso(STALENESS_MS + 24 * 3600_000),
      openFlagCount: 1,
      now: NOW,
    });
    expect(r.stale).toBe(true);
    expect(r.message).toContain("1 open flag is");
  });
});

describe("mayAutoApply", () => {
  it("only auto mode auto-applies", () => {
    expect(mayAutoApply({ mode: "scheduled", grounded_on: 5, alreadyApplied: false })).toBe(false);
    expect(mayAutoApply({ mode: "off", grounded_on: 5, alreadyApplied: false })).toBe(false);
    expect(mayAutoApply({ mode: "auto", grounded_on: 5, alreadyApplied: false })).toBe(true);
  });

  it("never re-applies an already-applied flag", () => {
    expect(mayAutoApply({ mode: "auto", grounded_on: 5, alreadyApplied: true })).toBe(false);
  });

  it("requires real grounding evidence", () => {
    expect(mayAutoApply({ mode: "auto", grounded_on: 0, alreadyApplied: false })).toBe(false);
    expect(mayAutoApply({ mode: "auto", grounded_on: null, alreadyApplied: false })).toBe(false);
  });
});
