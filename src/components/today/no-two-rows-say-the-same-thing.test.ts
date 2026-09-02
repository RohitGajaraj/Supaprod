/**
 * THE MIDDLE COLUMN IS THE ROW, AND TWO ROWS MUST NOT SAY THE SAME THING.
 *
 * ── WHY THIS COLUMN DECIDES WHETHER THE LIST WORKS ────────────────────────
 * Cursor's task list, which `/start`'s rows borrow their shape from, carries a
 * diff stat in the middle because that is the fact that tells one of its rows
 * from another. Ours carries what the run is DOING, because that is what tells
 * ours apart. A list of eight rows all reading "At Build" tells a person nothing
 * and reads as a bug in the record.
 *
 * That is not hypothetical here: the run screen's prototype list was repaired
 * for exactly it two hours before this file was written, where eight rows
 * carried two facts between them. The acceptance states the rule directly: *"no
 * two rows print an identical middle column unless the fact is identical."*
 *
 * ── AND NOTHING IN IT IS INVENTED ─────────────────────────────────────────
 * Every branch reaches for the sharpest fact it can source and falls back only
 * when the sharper one has no row. A seat with no tool call yet says "is
 * working" rather than a verb nobody wrote down; a run that filed nothing says
 * so. The tests below are as much about what the column refuses to say.
 */
import { describe, expect, it } from "bun:test";

import { runClock, startRowMiddle, startRows, type StartRowInput } from "./tracks-feed";

const WORDS = {
  prd: { one: "spec", many: "specs" },
  prototype: { one: "prototype", many: "prototypes" },
  changeset: { one: "code change", many: "code changes" },
} as const;

/** Stands in for the vocabulary the surface injects. */
const phrase = (tool: string): string | null =>
  ({
    "studio.pr.merge": "approve the pull request",
    "prd.draft": "writing the spec",
  })[tool] ?? null;

const NOW = Date.parse("2026-09-02T12:00:00Z");

const run = (over: Partial<StartRowInput> = {}): StartRowInput => ({
  id: "t-1",
  title: "Make checkout accept an Amex card",
  status: "open",
  stationName: "Build",
  updatedAt: "2026-09-02T11:00:00Z",
  drivenAt: "2026-09-02T11:00:00Z",
  holdReason: null,
  holdBecause: null,
  working: null,
  needsYou: null,
  produced: [],
  ...over,
});

describe("what the middle column says", () => {
  it("names the call when one is waiting on the person", () => {
    const m = startRowMiddle(run({ needsYou: { tool: "studio.pr.merge" } }), NOW, WORDS, phrase);
    expect(m).toBe("Needs you: approve the pull request");
  });

  it("does not invent a phrase for a tool it has no word for", () => {
    /*
     * A tool the vocabulary has never met is a real case: the registry grows
     * faster than the word list. "Needs you: studio.some.new.thing" would print
     * an agent's own tool id at a person, which is the defect the register sweep
     * exists to end.
     */
    const m = startRowMiddle(run({ needsYou: { tool: "studio.brand.new" } }), NOW, WORDS, phrase);
    expect(m).toBe("Needs you: a call is waiting");
    expect(m).not.toContain("studio.brand.new");
  });

  it("names the seat, its verb and its own clock while one is in flight", () => {
    const m = startRowMiddle(
      run({ working: { seat: "Strategist", since: "2026-09-02T11:59:26Z", tool: "prd.draft" } }),
      NOW,
      WORDS,
      phrase,
    );
    expect(m).toBe("Strategist is writing the spec · 0:34");
  });

  it("says a seat is working when it has called nothing yet, rather than a verb nobody wrote", () => {
    /*
     * A run that has started and called nothing is a real second or two, and it
     * is a different fact from a run that is doing something specific. The row
     * claims exactly what it can source.
     */
    const m = startRowMiddle(
      run({ working: { seat: "Draft", since: "2026-09-02T11:59:55Z", tool: null } }),
      NOW,
      WORDS,
      phrase,
    );
    expect(m).toBe("Draft is working · 0:05");
  });

  it("says what a settled run got you, counted by kind", () => {
    const m = startRowMiddle(
      run({
        status: "done",
        produced: [
          { kind: "prd", count: 1 },
          { kind: "prototype", count: 2 },
        ],
      }),
      NOW,
      WORDS,
      phrase,
    );
    expect(m).toBe("Produced spec, 2 prototypes");
  });

  it("says a finished run filed nothing rather than printing an empty clause", () => {
    expect(startRowMiddle(run({ status: "done" }), NOW, WORDS, phrase)).toBe(
      "Finished, and filed nothing",
    );
  });

  it("prefers the driver's own sentence over the coarse reason", () => {
    /*
     * `holdBecause` names the thing that has to change ("It was studio.pr.merge,
     * which said: GitHub is not connected"); the coarse reason can only say what
     * kind of stop it was. A list needs the one a person can act on.
     */
    const m = startRowMiddle(
      run({ holdReason: "tools-refused", holdBecause: "GitHub is not connected." }),
      NOW,
      WORDS,
      phrase,
    );
    expect(m).toBe("GitHub is not connected.");
  });

  it("falls back to where it stands, and says when it has never run", () => {
    expect(startRowMiddle(run({ holdReason: "out-of-time" }), NOW, WORDS, phrase)).toBe(
      "Stopped at Build",
    );
    expect(startRowMiddle(run({ drivenAt: null }), NOW, WORDS, phrase)).toBe("Not started yet");
  });
});

describe("the order a person needs, which is not the order the database has", () => {
  it("puts what is blocked on them first, then what is moving, then what is over", () => {
    const rows = startRows(
      [
        run({ id: "finished", status: "done", produced: [{ kind: "prd", count: 1 }] }),
        run({ id: "abandoned", status: "abandoned" }),
        run({ id: "waiting", holdReason: "out-of-time" }),
        run({
          id: "running",
          working: { seat: "Draft", since: "2026-09-02T11:59:00Z", tool: null },
        }),
        run({ id: "needs-you", needsYou: { tool: "studio.pr.merge" } }),
      ],
      NOW,
      WORDS,
      phrase,
    );
    expect(rows.map((r) => r.id)).toEqual([
      "needs-you",
      "running",
      "waiting",
      "finished",
      "abandoned",
    ]);
  });

  it("keeps newest first inside a kind", () => {
    const rows = startRows(
      [
        run({ id: "older", updatedAt: "2026-09-01T10:00:00Z" }),
        run({ id: "newer", updatedAt: "2026-09-02T10:00:00Z" }),
      ],
      NOW,
      WORDS,
      phrase,
    );
    expect(rows.map((r) => r.id)).toEqual(["newer", "older"]);
  });
});

describe("the discriminator rule", () => {
  it("gives five runs at one station five different sentences", () => {
    /*
     * THE ACCEPTANCE, stated as a test. All five stand at Build, which is the
     * shape that produced eight identical rows on the run screen. Each one has a
     * different fact available and each row reaches for it.
     */
    const rows = startRows(
      [
        run({ id: "a", needsYou: { tool: "studio.pr.merge" } }),
        run({ id: "b", working: { seat: "Studio", since: "2026-09-02T11:59:00Z", tool: null } }),
        run({ id: "c", status: "done", produced: [{ kind: "changeset", count: 1 }] }),
        run({ id: "d", holdBecause: "GitHub is not connected." }),
        run({ id: "e", drivenAt: null }),
      ],
      NOW,
      WORDS,
      phrase,
    );
    const middles = rows.map((r) => r.middle);
    expect(new Set(middles).size).toBe(middles.length);
  });

  it("lets two rows agree only when the fact really is identical", () => {
    /*
     * The rule is not "always differ". Two runs that have genuinely never been
     * started are the same fact, and printing two different sentences for one
     * fact would be the opposite defect: invention.
     */
    const rows = startRows(
      [run({ id: "a", drivenAt: null }), run({ id: "b", drivenAt: null })],
      NOW,
      WORDS,
      phrase,
    );
    expect(rows[0].middle).toBe(rows[1].middle);
  });
});

describe("the clock on a run in flight", () => {
  it("reads mm:ss under ten minutes, which is where a person is watching", () => {
    expect(runClock("2026-09-02T11:59:26Z", NOW)).toBe("0:34");
    expect(runClock("2026-09-02T11:51:00Z", NOW)).toBe("9:00");
  });

  it("stops counting seconds once nobody is counting them", () => {
    expect(runClock("2026-09-02T11:20:00Z", NOW)).toBe("40m");
    expect(runClock("2026-09-02T08:30:00Z", NOW)).toBe("3h 30m");
  });

  it("refuses a start time it cannot believe, rather than printing a negative", () => {
    // Clock skew between the database and the browser is real and small; a row
    // stamped in the future must drop the clock, not print "-0:03".
    expect(runClock("2026-09-02T12:00:03Z", NOW)).toBeNull();
    expect(runClock("not a date", NOW)).toBeNull();
  });
});
