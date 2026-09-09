/**
 * THE FIXTURE IS TRACE `0588c262`, ROW FOR ROW.
 *
 * Read out of `tool_calls` on 2026-09-09. Four `signals.list` calls with byte
 * identical arguments, under four model thoughts each describing a different
 * search, then the three calls that were genuinely different.
 *
 * No invented args: the whole finding is that the stored arguments are the same
 * while the prose around them is not, and a fixture I wrote would prove the
 * function against my own typing rather than against the record.
 */
import { describe, expect, it } from "bun:test";

import { theSameCallAgain, sameCallLead, type TraceCall } from "./the-same-call-again";

const SEARCH = { limit: 20, lookback_days: 90 };

/** The trace, in the order it ran. */
const TRACE: TraceCall[] = [
  { id: "1", tool: "signals.list", args: SEARCH },
  { id: "2", tool: "signals.list", args: SEARCH },
  { id: "3", tool: "signals.list", args: SEARCH },
  { id: "4", tool: "signals.list", args: SEARCH },
  { id: "5", tool: "themes.list", args: { limit: 10, min_severity: 1 } },
  { id: "6", tool: "sources.status", args: {} },
  {
    id: "7",
    tool: "sense.found_nothing",
    args: {
      searched:
        "reschedule installer visit order page, installer reschedule, homeowner reschedule, order page reschedule",
    },
  },
];

describe("the same call again", () => {
  it("marks the three repeats and never the first", () => {
    const r = theSameCallAgain(TRACE);
    // The first IS the call. Only what comes after it is the repetition, and
    // marking all four would say the search never happened at all.
    expect([...r.repeated].sort()).toEqual(["2", "3", "4"]);
    expect(r.count).toBe(3);
  });

  it("leaves the calls that were genuinely different alone", () => {
    const r = theSameCallAgain(TRACE);
    for (const id of ["1", "5", "6", "7"]) expect(r.repeated.has(id)).toBe(false);
  });

  it("says it once, above the list", () => {
    expect(sameCallLead(theSameCallAgain(TRACE), "Research")).toBe(
      "Research made the same signals.list call again, 3 times, with identical arguments.",
    );
  });

  it("and says nothing at all on a trace that did not repeat itself", () => {
    const r = theSameCallAgain(TRACE.slice(4));
    expect(r.count).toBe(0);
    expect(sameCallLead(r, "Research")).toBeNull();
  });
});

describe("what counts as the same call", () => {
  it("key order does not make two calls different", () => {
    // A model emitting its arguments in a different order has not made a
    // different call, and `JSON.stringify` alone would say it had.
    const r = theSameCallAgain([
      { id: "a", tool: "signals.list", args: { limit: 20, lookback_days: 90 } },
      { id: "b", tool: "signals.list", args: { lookback_days: 90, limit: 20 } },
    ]);
    expect(r.count).toBe(1);
  });

  it("nested key order either", () => {
    const r = theSameCallAgain([
      { id: "a", tool: "repo.read", args: { where: { branch: "main", depth: 2 } } },
      { id: "b", tool: "repo.read", args: { where: { depth: 2, branch: "main" } } },
    ]);
    expect(r.count).toBe(1);
  });

  it("but array ORDER does, because a list is not a set", () => {
    // `repo.read` with paths in a different order is arguably one call and
    // arguably two, and sorting them here would be this file deciding a
    // question about a tool it does not own.
    const r = theSameCallAgain([
      { id: "a", tool: "repo.read", args: { paths: ["a.ts", "b.ts"] } },
      { id: "b", tool: "repo.read", args: { paths: ["b.ts", "a.ts"] } },
    ]);
    expect(r.count).toBe(0);
  });

  it("and a different tool with the same arguments is a different call", () => {
    const r = theSameCallAgain([
      { id: "a", tool: "signals.list", args: SEARCH },
      { id: "b", tool: "themes.list", args: SEARCH },
    ]);
    expect(r.count).toBe(0);
  });

  it("two calls with no arguments at all are still the same call", () => {
    // `sources.status` takes none, and running it twice is running it twice.
    const r = theSameCallAgain([
      { id: "a", tool: "sources.status", args: {} },
      { id: "b", tool: "sources.status", args: {} },
    ]);
    expect(r.count).toBe(1);
  });

  it("and a null or absent args field does not throw", () => {
    const r = theSameCallAgain([
      { id: "a", tool: "sources.status", args: null },
      { id: "b", tool: "sources.status", args: undefined },
    ]);
    expect(r.count).toBe(1);
  });
});

describe("more than one tool repeating", () => {
  it("counts every repeat and names the tools by how often", () => {
    const r = theSameCallAgain([
      { id: "1", tool: "signals.list", args: SEARCH },
      { id: "2", tool: "signals.list", args: SEARCH },
      { id: "3", tool: "signals.list", args: SEARCH },
      { id: "4", tool: "themes.list", args: {} },
      { id: "5", tool: "themes.list", args: {} },
    ]);
    expect(r.count).toBe(3);
    expect(r.tools).toEqual(["signals.list", "themes.list"]);
    expect(sameCallLead(r, "Research")).toBe(
      "Research repeated 2 calls with identical arguments, 3 times in all.",
    );
  });
});

describe("it states the fact and passes no verdict", () => {
  /*
   * A repeat is not always waste. A poll, a re-read after a write, a check that
   * something is still true are all legitimate, and this surface reads
   * `tool_calls` and cannot tell which it is looking at. A reader who knows the
   * tool knows at once, and that reader is who the page is for.
   */
  it("never calls it wasted, a mistake, or a loop", () => {
    const lead = sameCallLead(theSameCallAgain(TRACE), "Research")!;
    expect(lead).not.toMatch(/wast|mistake|loop|stuck|should|failed|error/i);
  });

  it("and names no cause it has not read", () => {
    const lead = sameCallLead(theSameCallAgain(TRACE), "Research")!;
    expect(lead).not.toMatch(/because|retry|retried|dropped|misread/i);
  });
});
