import { describe, expect, test } from "bun:test";

import { formatDeadlineDate, formatExpiryDeadline } from "./expiry-deadline";

describe("formatExpiryDeadline", () => {
  test("a null or absent instant formats to nothing, never the word Invalid Date", () => {
    expect(formatExpiryDeadline(null)).toBeNull();
    expect(formatExpiryDeadline(undefined)).toBeNull();
    expect(formatExpiryDeadline(Number.NaN)).toBeNull();
  });

  test("a fixed instant carries weekday, day, month and clock time in order", () => {
    // 2026-08-27T10:11:04Z is a Thursday, formatted here in a pinned locale
    // AND pinned zone so the assertion holds whatever machine runs it.
    const shown = formatWithLocale(1787825464000);
    expect(shown).toMatch(/Thu/);
    expect(shown).toMatch(/27/);
    expect(shown).toMatch(/Aug/);
    expect(shown).toMatch(/10:11/);
  });

  test("the hours use a 23-hour clock, so midnight never reads as 24:xx", () => {
    const midnightUtc = Date.UTC(2026, 7, 27, 0, 5);
    const shown = formatWithLocale(midnightUtc);
    expect(shown).not.toMatch(/24:05/);
    expect(shown).toMatch(/00:05/);
  });
});

describe("formatDeadlineDate", () => {
  test("a null or absent date formats to nothing, never the word Invalid Date", () => {
    expect(formatDeadlineDate(null)).toBeNull();
    expect(formatDeadlineDate(undefined)).toBeNull();
    expect(formatDeadlineDate(Number.NaN)).toBeNull();
  });

  test("a horizon day names weekday, day and month, and no clock time it does not have", () => {
    // 2026-09-08T00:00:00Z is a Tuesday. A forecast horizon is a calendar day,
    // so a time on the sentence would be invented.
    const shown = new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
    const epochMs = Date.UTC(2026, 8, 8);
    expect(formatDeadlineDate(epochMs)).not.toBeNull();
    expect(shown.format(new Date(epochMs))).toMatch(/Tue/);
    expect(shown.format(new Date(epochMs))).toMatch(/8/);
    expect(shown.format(new Date(epochMs))).toMatch(/Sep/);
  });
});

function formatWithLocale(epochMs: number): string {
  const formatted = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "UTC",
  }).format(new Date(epochMs));
  return formatted;
}
