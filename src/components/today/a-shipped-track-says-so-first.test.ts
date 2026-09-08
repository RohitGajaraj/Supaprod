/**
 * P-126 (A-QUEUE.md). Served Start, 12:50 IST 09-04, twenty minutes after the
 * first release went to production: the run's own row said only *"Learn
 * returns on 09-21."* -- the track had shipped and its row said nothing
 * about it. `startRowMiddle` now leads with "Live since HH:MM" when the
 * track has a production deployment, ahead of whatever it would otherwise
 * say, per the packet's own scope: "then the Learn sentence."
 */
import { describe, expect, it } from "bun:test";
import { startRowMiddle, type StartRowInput } from "./tracks-feed";

const WORDS = {
  prd: { one: "spec", many: "specs" },
} as const;
const phrase = (): string | null => null;
const NOW = Date.parse("2026-09-04T12:50:00Z");

const run = (over: Partial<StartRowInput> = {}): StartRowInput => ({
  id: "t-1",
  title: "Skip the address re-confirm when nothing changed",
  status: "open",
  stationName: "Learn",
  updatedAt: "2026-09-04T12:28:00Z",
  drivenAt: "2026-09-04T12:28:00Z",
  holdReason: "waiting-on-time",
  holdBecause:
    "The forecast this work is graded against comes due on 2026-09-21. Learn returns when it does; nothing here is waiting on a person.",
  working: null,
  needsYou: null,
  produced: [],
  liveSince: null,
  ...over,
});

describe("a shipped track's row leads with when it went live", () => {
  // "UTC" is passed explicitly (P-130): `startRowMiddle`'s zone defaults to
  // the browser's own, which this test process's is not guaranteed to be.
  it("prefixes 'Live since HH:MM' ahead of the Learn sentence, when the track has a production deployment", () => {
    const m = startRowMiddle(run({ liveSince: "2026-09-04T12:28:00Z" }), NOW, WORDS, phrase, "UTC");
    // The driver's sentence is 130 characters; the row prints the one line
    // (`ROW_LINE_MAX`) and keeps the sentence as the row's detail.
    expect(m).toBe("Live since 12:28 · Graded on 2026-09-21. Nothing to do until then.");
  });

  it("says nothing about being live when the track has no production deployment", () => {
    const m = startRowMiddle(run({ liveSince: null }), NOW, WORDS, phrase);
    expect(m).not.toContain("Live since");
    expect(m).toBe("Graded on 2026-09-21. Nothing to do until then.");
  });

  it("still leads a running row, not only a held one -- the prefix is universal, not Learn-specific", () => {
    const m = startRowMiddle(
      run({
        liveSince: "2026-09-04T12:28:00Z",
        holdReason: null,
        holdBecause: null,
        working: { seat: "Build", since: "2026-09-04T12:40:00Z", tool: null },
      }),
      NOW,
      WORDS,
      phrase,
      "UTC",
    );
    expect(m.startsWith("Live since 12:28 · ")).toBe(true);
    expect(m).toContain("Build is working");
  });
});
