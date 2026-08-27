import { describe, expect, it } from "bun:test";

import { duplicateWork, redoingSettledWork, repeatLine, subjectKey } from "./duplicate-work";

/**
 * THE NUMBERS THIS PINS ARE FROM THE LIVE DATABASE, 2026-08-27.
 *
 * This workspace holds 111 missions under 60 distinct titles. Of the 89
 * `proposed`: 48 distinct subjects, so 41 are repeats, and 5 ask for work whose
 * subject is already completed. The board draws "89 runs waiting on you" and
 * says neither, so a person believes they have 89 decisions when they have 48.
 */

const row = (id: string, title: string, status = "proposed") => ({ id, title, status });

describe("subjectKey", () => {
  it("folds the things that are the same request written twice", () => {
    expect(subjectKey("  Watch: review   recent signals ")).toBe("watch: review recent signals");
    expect(subjectKey("[auto] Watch: review recent signals")).toBe(
      subjectKey("Watch: review recent signals"),
    );
  });

  it("is EXACT, and deliberately misses near-matches", () => {
    // A false collision invites someone to dismiss work that was never
    // duplicated, and the dismissed one does not come back to argue. Missing a
    // near-duplicate costs them nothing they are not already paying.
    expect(subjectKey("Review the signals")).not.toBe(subjectKey("Review recent signals"));
  });

  it("gives an empty key to a row with no subject, so it collides with nothing", () => {
    expect(subjectKey(null)).toBe("");
    expect(subjectKey("   ")).toBe("");
  });
});

describe("duplicateWork", () => {
  it("counts the repeats rather than the groups, because that is what inflates the number on screen", () => {
    const d = duplicateWork([
      row("a", "Watch: review recent signals"),
      row("b", "Watch: review recent signals"),
      row("c", "Watch: review recent signals"),
      row("d", "Something else"),
    ]);
    expect(d.distinct).toBe(2);
    expect(d.repeated).toBe(2); // three rows, one subject: two are repeats
    expect(d.groups).toHaveLength(1);
    expect(d.groups[0]!.total).toBe(3);
  });

  it("reproduces the live shape: 89 rows over 48 subjects leaves 41 repeats", () => {
    const rows = [
      ...Array.from({ length: 42 }, (_, i) => row(`u${i}`, `Unique subject ${i}`)),
      ...Array.from({ length: 47 }, (_, i) => row(`d${i}`, `Repeated subject ${i % 6}`)),
    ];
    const d = duplicateWork(rows);
    expect(rows).toHaveLength(89);
    expect(d.distinct).toBe(48);
    expect(d.repeated).toBe(41);
  });

  it("never counts a row with no subject as a duplicate of another one", () => {
    const d = duplicateWork([row("a", ""), row("b", "   "), row("c", null as unknown as string)]);
    expect(d.distinct).toBe(0);
    expect(d.repeated).toBe(0);
  });

  it("survives a read that has not answered", () => {
    expect(duplicateWork(undefined)).toEqual({ distinct: 0, repeated: 0, groups: [] });
  });
});

describe("redoingSettledWork", () => {
  it("finds the proposal whose subject is already finished somewhere else", () => {
    const shown = [row("p", "Investigate the unsafe automation cluster")];
    const all = [...shown, row("done", "Investigate the unsafe automation cluster", "completed")];
    expect(redoingSettledWork(shown, all)).toBe(1);
  });

  it("does NOT treat completed_with_failures as finished", () => {
    // That is exactly the case where raising the work again may be right, and
    // saying "already finished" would talk a person out of a call the surface
    // is not entitled to make.
    const shown = [row("p", "Retry the flaky import")];
    const all = [...shown, row("x", "Retry the flaky import", "completed_with_failures")];
    expect(redoingSettledWork(shown, all)).toBe(0);
  });

  it("does not count a finished row as redoing itself", () => {
    const all = [row("done", "Ship the digest", "completed")];
    expect(redoingSettledWork(all, all)).toBe(0);
  });

  it("answers zero when nothing has ever finished", () => {
    const shown = [row("a", "A"), row("b", "A")];
    expect(redoingSettledWork(shown, shown)).toBe(0);
  });
});

describe("repeatLine", () => {
  it("SAYS NOTHING when the count in front of the person is honest", () => {
    // "0 repeats" is a sentence about our arithmetic, not about their work.
    expect(repeatLine({ distinct: 3, repeated: 0, groups: [] }, 0)).toBeNull();
  });

  it("names both halves when both are true", () => {
    expect(repeatLine({ distinct: 48, repeated: 41, groups: [] }, 5)).toBe(
      "41 of these repeat others on this list, and 5 ask for work this board already shows as finished.",
    );
  });

  it("says only the half that is true", () => {
    expect(repeatLine({ distinct: 48, repeated: 41, groups: [] }, 0)).toBe(
      "41 of these repeat others on this list.",
    );
    expect(repeatLine({ distinct: 3, repeated: 0, groups: [] }, 2)).toBe(
      "2 ask for work this board already shows as finished.",
    );
  });

  it("counts one as one", () => {
    expect(repeatLine({ distinct: 2, repeated: 1, groups: [] }, 1)).toBe(
      "1 of these repeats another on this list, and 1 asks for work this board already shows as finished.",
    );
  });
});
