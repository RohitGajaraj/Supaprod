import { describe, expect, it } from "bun:test";

import { oldestWaitingDays, waitingNote } from "./waiting-age";

/** A fixed clock, so a test can never be a measurement of when it ran. */
const NOW = Date.parse("2026-08-26T12:00:00.000Z");
const daysAgo = (n: number) => NOW - n * 86_400_000;

describe("oldestWaitingDays", () => {
  it("reports the oldest, not the newest and not the average", () => {
    expect(
      oldestWaitingDays([{ at: daysAgo(2) }, { at: daysAgo(21) }, { at: daysAgo(5) }], NOW),
    ).toBe(21);
  });

  it("EXCLUDES an undated row instead of calling it twenty thousand days old", () => {
    // feedInstant returns 0 for a row nobody can date — "the honest floor" —
    // and reading that as 1970 is the one failure this function must not have.
    expect(oldestWaitingDays([{ at: 0 }, { at: daysAgo(3) }], NOW)).toBe(3);
  });

  it("says nothing at all when every row is undated", () => {
    expect(oldestWaitingDays([{ at: 0 }, { at: 0 }], NOW)).toBeNull();
  });

  it("refuses a future timestamp rather than flooring it to a confident zero", () => {
    expect(oldestWaitingDays([{ at: NOW + 86_400_000 }], NOW)).toBeNull();
  });

  it("stays silent under a day, because 'waiting 0 days' reads as a bug", () => {
    expect(oldestWaitingDays([{ at: NOW - 3_600_000 }], NOW)).toBeNull();
  });

  it("answers null for an empty lane", () => {
    expect(oldestWaitingDays([], NOW)).toBeNull();
  });

  it("refuses a garbage timestamp", () => {
    expect(oldestWaitingDays([{ at: Number.NaN }, { at: daysAgo(4) }], NOW)).toBe(4);
  });
});

describe("waitingNote", () => {
  const BASE = "Nothing moves on these until you answer.";

  it("adds the clause when something has genuinely been waiting", () => {
    expect(waitingNote(BASE, [{ at: daysAgo(21) }], NOW)).toBe(
      "Nothing moves on these until you answer. The oldest has been waiting 21 days.",
    );
  });

  it("says day, singular, at one", () => {
    expect(waitingNote(BASE, [{ at: daysAgo(1) }], NOW)).toContain("waiting 1 day.");
  });

  it("NEVER deletes the base sentence, whatever the rows say", () => {
    // The note is what tells a person whose move it is. No absence of data may
    // be allowed to turn it into silence.
    expect(waitingNote(BASE, [], NOW)).toBe(BASE);
    expect(waitingNote(BASE, [{ at: 0 }], NOW)).toBe(BASE);
    expect(waitingNote(BASE, [{ at: NOW + 1000 }], NOW)).toBe(BASE);
  });

  it("matches the live shape that motivated it: 89 rows, oldest 21 days", () => {
    // 89 proposed missions measured 2026-08-26; 85 of them 8-30 days old.
    const rows = [
      ...Array.from({ length: 85 }, (_, i) => ({ at: daysAgo(8 + (i % 13)) })),
      { at: daysAgo(21) },
      { at: daysAgo(1) },
      { at: daysAgo(0) },
      { at: 0 },
    ];
    expect(waitingNote(BASE, rows, NOW)).toContain("The oldest has been waiting 21 days.");
  });
});
