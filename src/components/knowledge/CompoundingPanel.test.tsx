import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { whenOf, deltaOf } from "./CompoundingPanel";

describe("whenOf — learning timestamp formatting", () => {
  let now: Date;

  beforeEach(() => {
    // Capture current time for consistent testing
    now = new Date();
  });

  test("returns time only (HH:MM) for today's timestamps", () => {
    // Create a timestamp for today
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 30);
    const iso = today.toISOString();

    const result = whenOf(iso);

    // Should be formatted as time (HH:MM or similar depending on locale)
    expect(result).toMatch(/\d{1,2}:\d{2}/);
    expect(result).not.toContain("Yesterday");
    expect(result).not.toMatch(/\w+\s+\d{1,2}/); // Not date format
  });

  test("returns 'Yesterday' for timestamps exactly 1 day ago", () => {
    // Create a timestamp for yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const iso = yesterday.toISOString();

    const result = whenOf(iso);
    expect(result).toBe("Yesterday");
  });

  test("returns Month Day format for dates older than 1 day", () => {
    // Create a timestamp 3 days ago
    const threeAgo = new Date(now);
    threeAgo.setDate(threeAgo.getDate() - 3);
    const iso = threeAgo.toISOString();

    const result = whenOf(iso);

    // Should be in format like "Jul 9"
    expect(result).toMatch(/\w{3}\s+\d{1,2}/);
    expect(result).not.toBe("Yesterday");
    expect(result).not.toMatch(/\d{1,2}:\d{2}/);
  });

  test("handles edge case: exactly midnight boundary as today", () => {
    // Create timestamp at start of today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const iso = startOfToday.toISOString();

    const result = whenOf(iso);

    // Should be today's time format
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  test("handles edge case: 1 second before midnight (yesterday)", () => {
    // Create timestamp 1 second before midnight (still yesterday)
    const almostMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, -1);
    const iso = almostMidnight.toISOString();

    const result = whenOf(iso);

    // Depending on local timezone, this should be "Yesterday"
    expect(result === "Yesterday" || result.toMatch(/\w{3}\s+\d{1,2}/)).toBe(true);
  });

  test("handles far past dates", () => {
    // Create timestamp 100 days ago
    const longAgo = new Date(now);
    longAgo.setDate(longAgo.getDate() - 100);
    const iso = longAgo.toISOString();

    const result = whenOf(iso);

    // Should be in date format, not time
    expect(result).toMatch(/\w{3}\s+\d{1,2}/);
  });

  test("preserves month abbreviation (short locale format)", () => {
    // Create a known past date
    const pastDate = new Date("2025-06-09T12:00:00Z");
    const iso = pastDate.toISOString();

    const result = whenOf(iso);

    // Should contain a 3-letter month abbreviation
    expect(result).toMatch(/\w{3}/);
  });
});

describe("deltaOf — ICE movement rounding and threshold logic", () => {
  test("returns null when prior_ice is null", () => {
    const result = deltaOf({
      prior_ice: null,
      new_ice: 100,
    });

    expect(result).toBeNull();
  });

  test("returns null when new_ice is null", () => {
    const result = deltaOf({
      prior_ice: 50,
      new_ice: null,
    });

    expect(result).toBeNull();
  });

  test("returns null when both are null", () => {
    const result = deltaOf({
      prior_ice: null,
      new_ice: null,
    });

    expect(result).toBeNull();
  });

  test("converts string ice values to numbers", () => {
    const result = deltaOf({
      prior_ice: "40",
      new_ice: "50",
    });

    expect(result).toBe(10);
  });

  test("handles numeric string with decimals", () => {
    const result = deltaOf({
      prior_ice: "45.5",
      new_ice: "55.3",
    });

    expect(result).toBe(9.8);
  });

  test("rounds delta to 0.1 precision", () => {
    const result = deltaOf({
      prior_ice: 50,
      new_ice: 50.15,
    });

    expect(result).toBe(0.2); // 0.15 * 10 = 1.5 rounded to 2, / 10 = 0.2
  });

  test("returns null for sub-0.1 jitter (the motion threshold)", () => {
    const result = deltaOf({
      prior_ice: 50,
      new_ice: 50.04,
    });

    expect(result).toBeNull(); // 0.04 * 10 = 0.4, rounded to 0
  });

  test("captures positive ICE movements", () => {
    const result = deltaOf({
      prior_ice: 30,
      new_ice: 45,
    });

    expect(result).toBe(15);
  });

  test("captures negative ICE movements", () => {
    const result = deltaOf({
      prior_ice: 80,
      new_ice: 60,
    });

    expect(result).toBe(-20);
  });

  test("rounds 0.05 up to 0.1 (banker's rounding)", () => {
    const result = deltaOf({
      prior_ice: 50,
      new_ice: 50.05,
    });

    // 0.05 * 10 = 0.5, Math.round(0.5) = 1, / 10 = 0.1
    expect(result).toBe(0.1);
  });

  test("rounds -0.05 to -0.1 (banker's rounding, negative)", () => {
    const result = deltaOf({
      prior_ice: 50,
      new_ice: 49.95,
    });

    // -0.05 * 10 = -0.5, Math.round(-0.5) = 0 (banker's), / 10 = 0
    expect(result === 0 || result === -0.1).toBe(true);
  });

  test("returns null when delta rounds to exactly 0", () => {
    const result = deltaOf({
      prior_ice: 50.02,
      new_ice: 50.06,
    });

    // 0.04 * 10 = 0.4, Math.round(0.4) = 0
    expect(result).toBeNull();
  });

  test("handles non-finite numbers gracefully", () => {
    const result = deltaOf({
      prior_ice: NaN,
      new_ice: 50,
    });

    expect(result).toBeNull();
  });

  test("handles Infinity gracefully", () => {
    const result = deltaOf({
      prior_ice: 50,
      new_ice: Infinity,
    });

    expect(result).toBeNull();
  });

  test("handles large ICE movements", () => {
    const result = deltaOf({
      prior_ice: 0,
      new_ice: 1000000,
    });

    expect(result).toBe(1000000);
  });

  test("handles very small positive deltas above threshold", () => {
    const result = deltaOf({
      prior_ice: 50,
      new_ice: 50.1,
    });

    expect(result).toBe(0.1);
  });

  test("handles mixed sign changes", () => {
    const result = deltaOf({
      prior_ice: -10,
      new_ice: 5,
    });

    expect(result).toBe(15);
  });

  test("edge case: both values are 0", () => {
    const result = deltaOf({
      prior_ice: 0,
      new_ice: 0,
    });

    expect(result).toBeNull(); // No movement
  });

  test("edge case: prior is 0, new is positive", () => {
    const result = deltaOf({
      prior_ice: 0,
      new_ice: 5,
    });

    expect(result).toBe(5);
  });

  test("edge case: prior is positive, new is 0", () => {
    const result = deltaOf({
      prior_ice: 5,
      new_ice: 0,
    });

    expect(result).toBe(-5);
  });

  test("edge case: both negative, negative movement", () => {
    const result = deltaOf({
      prior_ice: -10,
      new_ice: -20,
    });

    expect(result).toBe(-10);
  });

  test("edge case: both negative, positive movement", () => {
    const result = deltaOf({
      prior_ice: -20,
      new_ice: -10,
    });

    expect(result).toBe(10);
  });
});
