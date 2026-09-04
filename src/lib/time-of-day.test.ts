/**
 * P-130 (A-QUEUE.md). Start's own run row (P-126) read *Live since 06:58*
 * for a promote the founder pressed at 12:28 IST; the run screen's
 * transcript read *11:20* for the same morning's commits, in the browser's
 * zone. Two surfaces, two sources. `clockInZone`/`dateTimeInZone` are the
 * one formatter every surface should read a time through, given the
 * person's own zone explicitly rather than reading it themselves.
 */
import { describe, it, expect } from "bun:test";
import { clockInZone, dateTimeInZone } from "./time-of-day";

describe("clockInZone", () => {
  it("reads the same instant differently in a different zone", () => {
    // 12:28 UTC is 17:58 in Asia/Kolkata (UTC+5:30) -- the exact gap this
    // packet's own incident named.
    expect(clockInZone("2026-09-04T12:28:00.000Z", "UTC")).toBe("12:28");
    expect(clockInZone("2026-09-04T12:28:00.000Z", "Asia/Kolkata")).toBe("17:58");
  });

  it("is 24-hour and zero-padded, never 12-hour with AM/PM", () => {
    expect(clockInZone("2026-09-04T09:05:00.000Z", "UTC")).toBe("09:05");
    expect(clockInZone("2026-09-04T00:05:00.000Z", "UTC")).toBe("00:05");
  });

  it("carries an instant across midnight into the zone's own next day", () => {
    // 22:00 UTC is 03:30 the NEXT calendar day in Asia/Kolkata.
    expect(clockInZone("2026-09-04T22:00:00.000Z", "Asia/Kolkata")).toBe("03:30");
  });
});

describe("dateTimeInZone", () => {
  const NOW = "2026-09-04T12:50:00.000Z";

  it("reads a bare clock for an instant on today's own calendar day, in the zone", () => {
    expect(dateTimeInZone("2026-09-04T08:00:00.000Z", "UTC", NOW)).toBe("08:00");
  });

  it("says 'yesterday HH:MM' for the day before, in the zone", () => {
    expect(dateTimeInZone("2026-09-03T08:00:00.000Z", "UTC", NOW)).toBe("yesterday 08:00");
  });

  it("says 'Mon D, HH:MM' for anything further back", () => {
    expect(dateTimeInZone("2026-08-28T08:00:00.000Z", "UTC", NOW)).toBe("Aug 28, 08:00");
  });

  it(
    "judges the calendar day IN THE ZONE, not in UTC -- an instant that is " +
      "yesterday in UTC can still be today where the person is",
    () => {
      // 22:30 UTC on Sep 3 is 04:00 on Sep 4 in Asia/Kolkata -- the same
      // calendar day as NOW (12:50 UTC Sep 4 = 18:20 IST Sep 4) there,
      // though it is "yesterday" by a raw UTC date comparison.
      expect(dateTimeInZone("2026-09-03T22:30:00.000Z", "Asia/Kolkata", NOW)).toBe("04:00");
    },
  );

  it("never claims an old release happened this morning", () => {
    // The exact failure a bare `clockInZone` call would make: a release
    // from six days ago reading as a bare "08:00", indistinguishable from
    // one that shipped an hour ago.
    const line = dateTimeInZone("2026-08-29T08:00:00.000Z", "UTC", NOW);
    expect(line).not.toBe("08:00");
    expect(line).toBe("Aug 29, 08:00");
  });
});
