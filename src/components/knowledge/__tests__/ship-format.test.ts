import { describe, expect, test } from "bun:test";
import { relTime, fmtUsd } from "../ship-format";

describe("relTime", () => {
  test("returns '-' for null or undefined", () => {
    expect(relTime(null)).toBe("-");
    expect(relTime(undefined)).toBe("-");
  });

  test("returns '-' for empty string", () => {
    expect(relTime("")).toBe("-");
  });

  test("returns '-' for malformed date", () => {
    expect(relTime("not-a-date")).toBe("-");
  });

  test("returns 'now' for timestamps within the last minute", () => {
    const now = new Date().toISOString();
    expect(relTime(now)).toBe("now");
  });

  test("returns minutes for times up to 1 hour ago", () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(relTime(fiveMinutesAgo)).toBe("5m");
  });

  test("returns hours for times up to 24 hours ago", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60_000).toISOString();
    expect(relTime(twoHoursAgo)).toBe("2h");
  });

  test("returns days for times up to 7 days ago", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60_000).toISOString();
    expect(relTime(threeDaysAgo)).toBe("3d");
  });

  test("returns formatted date for times older than 7 days", () => {
    const eighthDayAgo = new Date(Date.now() - 8 * 24 * 60 * 60_000).toISOString();
    const result = relTime(eighthDayAgo);
    // Should be a date like "Jan 1" format
    expect(result.match(/\w+ \d+/)).toBeDefined();
  });

  test("correctly floors time values", () => {
    // 30.5 minutes ago should floor to 30m, not 31m
    const thirtyMinutesAgo = new Date(Date.now() - 30.5 * 60_000).toISOString();
    expect(relTime(thirtyMinutesAgo)).toBe("30m");
  });
});

describe("fmtUsd", () => {
  // Basic cases
  test("returns '$0' for zero", () => {
    expect(fmtUsd(0)).toBe("$0");
    expect(fmtUsd(null)).toBe("$0");
    expect(fmtUsd(undefined)).toBe("$0");
  });

  test("formats whole dollar amounts with 2 decimal places", () => {
    expect(fmtUsd(5)).toBe("$5.00");
    expect(fmtUsd(100)).toBe("$100.00");
    expect(fmtUsd(1000)).toBe("$1000.00");
  });

  test("formats cents correctly with 2 decimal places", () => {
    expect(fmtUsd(5.5)).toBe("$5.50");
    expect(fmtUsd(0.99)).toBe("$0.99");
    expect(fmtUsd(123.45)).toBe("$123.45");
  });

  test("formats very small positive amounts with 4 decimal places", () => {
    expect(fmtUsd(0.001)).toBe("$0.0010");
    expect(fmtUsd(0.0001)).toBe("$0.0001");
    expect(fmtUsd(0.005)).toBe("$0.0050");
  });

  // Edge case: the boundary between 2 and 4 decimals
  test("uses 4 decimals for positive amounts less than $0.01", () => {
    expect(fmtUsd(0.009)).toBe("$0.0090");
    expect(fmtUsd(0.0099)).toBe("$0.0099");
  });

  test("uses 2 decimals for positive amounts at exactly $0.01", () => {
    expect(fmtUsd(0.01)).toBe("$0.01");
  });

  test("uses 2 decimals for amounts greater than $0.01", () => {
    expect(fmtUsd(0.011)).toBe("$0.01");
    expect(fmtUsd(0.019)).toBe("$0.02");
  });

  // Negative numbers: the sign is prefixed before the $ sign (not "$-5.00"),
  // and the 2-vs-4-decimal threshold applies to the absolute value so negative
  // sub-cent amounts get the same 4-decimal precision as their positive counterparts.
  test("formats negative whole numbers with 2 decimal places", () => {
    const result = fmtUsd(-5);
    expect(result).toBe("-$5.00");
  });

  test("formats negative cents correctly with 2 decimal places", () => {
    expect(fmtUsd(-0.5)).toBe("-$0.50");
    expect(fmtUsd(-0.99)).toBe("-$0.99");
    expect(fmtUsd(-123.45)).toBe("-$123.45");
  });

  test("formats negative amounts less than $0.01 with 4 decimal places", () => {
    expect(fmtUsd(-0.001)).toBe("-$0.0010");
    expect(fmtUsd(-0.0001)).toBe("-$0.0001");
    expect(fmtUsd(-0.005)).toBe("-$0.0050");
  });

  // String input
  test("accepts string input and converts to number", () => {
    expect(fmtUsd("5")).toBe("$5.00");
    expect(fmtUsd("0.50")).toBe("$0.50");
    expect(fmtUsd("-10")).toBe("-$10.00");
  });

  test("returns '$0' for non-numeric string input", () => {
    expect(fmtUsd("abc")).toBe("$0");
  });

  test("handles string representation of small amounts", () => {
    expect(fmtUsd("0.001")).toBe("$0.0010");
  });

  // Additional edge cases
  test("rounds correctly for amounts that would have more than 2 or 4 decimals", () => {
    expect(fmtUsd(5.556)).toBe("$5.56"); // Rounds up to 2 decimals
    expect(fmtUsd(0.00556)).toBe("$0.0056"); // Rounds up to 4 decimals
  });

  test("handles very large amounts", () => {
    expect(fmtUsd(1000000)).toBe("$1000000.00");
    expect(fmtUsd(999999.99)).toBe("$999999.99");
  });

  test("handles negative zero (edge case)", () => {
    expect(fmtUsd(-0)).toBe("$0");
  });

  test("consistency: same numeric value formatted same way regardless of input type", () => {
    const numberResult = fmtUsd(5.5);
    const stringResult = fmtUsd("5.5");
    expect(numberResult).toBe(stringResult);
  });

  test("negative values: small negative (< $0.01) use 4 decimals with minus sign", () => {
    expect(fmtUsd(-0.005)).toBe("-$0.0050");
  });

  test("negative values: regular negative amounts use 2 decimals with minus sign", () => {
    expect(fmtUsd(-5)).toBe("-$5.00");
    expect(fmtUsd(-10.5)).toBe("-$10.50");
  });

  test("negative zero is treated as zero", () => {
    expect(fmtUsd(-0)).toBe("$0");
  });

  test("negative string input is parsed and formatted correctly", () => {
    expect(fmtUsd("-25.75")).toBe("-$25.75");
    expect(fmtUsd("-0.001")).toBe("-$0.0010");
  });

  test("minus sign appears BEFORE dollar sign, not after", () => {
    const result = fmtUsd(-5);
    expect(result).toBe("-$5.00");
    expect(result).not.toBe("$-5.00");
  });

  test("large negative amounts format correctly", () => {
    expect(fmtUsd(-1000000)).toBe("-$1000000.00");
  });

  test("negative sub-cent values use 4 decimals", () => {
    expect(fmtUsd(-0.0001)).toBe("-$0.0001");
    expect(fmtUsd(-0.00999)).toBe("-$0.0100");
  });

  test("boundary: exactly -0.01 uses 2 decimals", () => {
    expect(fmtUsd(-0.01)).toBe("-$0.01");
  });

  test("positive and negative versions format symmetrically", () => {
    expect(fmtUsd(42.5)).toBe("$42.50");
    expect(fmtUsd(-42.5)).toBe("-$42.50");
  });
});
