import { describe, expect, test } from "bun:test";
import { relTime, fmtUsd } from "./format";

// Same logic as knowledge/ship-format.test.ts — this is a deliberate local
// copy (see the header comment in ./format.ts), not a re-export, so its
// coverage is duplicated on purpose rather than shared.

describe("relTime", () => {
  test("null/undefined -> '-'", () => {
    expect(relTime(null)).toBe("-");
    expect(relTime(undefined)).toBe("-");
  });

  test("malformed timestamp -> '-'", () => {
    expect(relTime("not-a-date")).toBe("-");
  });

  test("under a minute -> 'now'", () => {
    expect(relTime(new Date(Date.now() - 5_000).toISOString())).toBe("now");
  });

  test("minutes bucket", () => {
    expect(relTime(new Date(Date.now() - 10 * 60_000).toISOString())).toBe("10m");
  });

  test("hours bucket", () => {
    expect(relTime(new Date(Date.now() - 4 * 60 * 60_000).toISOString())).toBe("4h");
  });

  test("days bucket (under a week)", () => {
    expect(relTime(new Date(Date.now() - 3 * 24 * 60 * 60_000).toISOString())).toBe("3d");
  });

  test("a week or more falls back to a locale date string", () => {
    const then = new Date(Date.now() - 9 * 24 * 60 * 60_000);
    expect(relTime(then.toISOString())).toBe(
      then.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    );
  });
});

describe("fmtUsd", () => {
  test("null/undefined/zero -> '$0'", () => {
    expect(fmtUsd(null)).toBe("$0");
    expect(fmtUsd(undefined)).toBe("$0");
    expect(fmtUsd(0)).toBe("$0");
  });

  test("sub-cent values use 4 decimal places", () => {
    expect(fmtUsd(0.005)).toBe("$0.0050");
  });

  test("values at or above a cent use 2 decimal places", () => {
    expect(fmtUsd(0.01)).toBe("$0.01");
    expect(fmtUsd(5)).toBe("$5.00");
  });

  test("string input is parsed as a number", () => {
    expect(fmtUsd("12.3")).toBe("$12.30");
  });

  test("negative values format with correct precision", () => {
    expect(fmtUsd(-0.005)).toBe("$-0.0050");
    expect(fmtUsd(-1.5)).toBe("$-1.50");
    expect(fmtUsd(-100)).toBe("$-100.00");
  });

  test("negative string input is parsed correctly", () => {
    expect(fmtUsd("-5.25")).toBe("$-5.25");
  });
});
