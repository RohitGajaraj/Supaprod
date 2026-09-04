import { describe, test, expect } from "bun:test";
import {
  groupOf,
  groupStopped,
  stoppedHeading,
  demoFoldLine,
  whatItIs,
  whatUnblocksIt,
  looksSeeded,
  THIS_WEEK_MS,
  type StoppedRow,
} from "./what-is-worth-your-next-ten-minutes";

const NOW = Date.parse("2026-09-04T13:00:00Z");
const DAY = 86_400_000;

function row(over: Partial<StoppedRow> & { id: string }): StoppedRow {
  return {
    since: NOW - DAY,
    kind: "SPEC",
    gatesLiveWork: null,
    isDemo: false,
    ...over,
  };
}

describe("groupOf", () => {
  test("only a gate we KNOW holds live work reaches the first group", () => {
    expect(groupOf(row({ id: "a", gatesLiveWork: true }), NOW)).toBe("holding-live-work");
  });

  test("null never counts as holding live work", () => {
    // F-128's three-valued field. A spec, a challenge and a memory are null by
    // construction -- nothing is held open by a run -- so promoting null would
    // fill the top group with rows that hold nothing and empty it of meaning.
    expect(groupOf(row({ id: "b", gatesLiveWork: null, since: NOW - DAY }), NOW)).toBe("this-week");
  });

  test("false is not the same as null, and neither is in the first group", () => {
    expect(groupOf(row({ id: "c", gatesLiveWork: false, since: NOW - DAY }), NOW)).toBe(
      "this-week",
    );
  });

  test("this week and older split on seven days, inclusive at the boundary", () => {
    expect(groupOf(row({ id: "d", since: NOW - THIS_WEEK_MS }), NOW)).toBe("this-week");
    expect(groupOf(row({ id: "e", since: NOW - THIS_WEEK_MS - 1 }), NOW)).toBe("older");
  });

  test("a demo row is demo even when it holds live work", () => {
    // The guard the packet asks for: furniture never renders above a person's
    // own work, and "it holds a live run" is exactly the excuse that would
    // otherwise let it.
    expect(groupOf(row({ id: "f", isDemo: true, gatesLiveWork: true }), NOW)).toBe("demo");
  });

  test("a demo row is demo whatever its age", () => {
    expect(groupOf(row({ id: "g", isDemo: true, since: NOW - 400 * DAY }), NOW)).toBe("demo");
    expect(groupOf(row({ id: "h", isDemo: true, since: NOW }), NOW)).toBe("demo");
  });
});

describe("groupStopped", () => {
  test("no demo row ever sorts above a person's own", () => {
    const grouped = groupStopped(
      [
        row({ id: "demo-old", isDemo: true, since: NOW - 50 * DAY }),
        row({ id: "mine", since: NOW - 2 * DAY }),
        row({ id: "demo-live", isDemo: true, gatesLiveWork: true }),
      ],
      NOW,
    );
    expect(grouped.holdingLiveWork).toHaveLength(0);
    expect(grouped.thisWeek.map((r) => r.id)).toEqual(["mine"]);
    expect(grouped.demo.map((r) => r.id).sort()).toEqual(["demo-live", "demo-old"]);
  });

  test("each group is oldest first within itself", () => {
    const grouped = groupStopped(
      [
        row({ id: "newer", since: NOW - DAY }),
        row({ id: "oldest", since: NOW - 6 * DAY }),
        row({ id: "middle", since: NOW - 3 * DAY }),
      ],
      NOW,
    );
    expect(grouped.thisWeek.map((r) => r.id)).toEqual(["oldest", "middle", "newer"]);
  });

  test("Helio's real shape, measured 2026-09-04, lands where a reader expects", () => {
    // 3 gates (all seeded), 29 specs of which 1 seeded, 11 challenges none
    // seeded. Nothing on this workspace holds live work, which is itself the
    // finding: the list is long and none of it is urgent.
    const rows: StoppedRow[] = [
      ...Array.from({ length: 3 }, (_, i) =>
        row({ id: `gate-${i}`, kind: "GATE", isDemo: true, since: NOW - 42 * DAY }),
      ),
      row({ id: "spec-seeded", isDemo: true, since: NOW - 49 * DAY }),
      ...Array.from({ length: 28 }, (_, i) => row({ id: `spec-${i}`, since: NOW - 10 * DAY })),
      ...Array.from({ length: 11 }, (_, i) =>
        row({ id: `chal-${i}`, kind: "CHALLENGE", since: NOW - 2 * DAY }),
      ),
    ];
    const grouped = groupStopped(rows, NOW);
    expect(grouped.holdingLiveWork).toHaveLength(0);
    expect(grouped.thisWeek).toHaveLength(11);
    expect(grouped.older).toHaveLength(28);
    expect(grouped.demo).toHaveLength(4);
  });
});

describe("stoppedHeading", () => {
  const empty = { holdingLiveWork: [], thisWeek: [], older: [], demo: [] };

  test("leads with what is holding live work", () => {
    const h = stoppedHeading({
      ...empty,
      holdingLiveWork: [row({ id: "a" }), row({ id: "b" })],
      thisWeek: [row({ id: "c" }), row({ id: "d" }), row({ id: "e" })],
    });
    expect(h).toBe("2 stopped items are holding live work; 3 more stopped this week.");
  });

  test("one is singular", () => {
    expect(stoppedHeading({ ...empty, holdingLiveWork: [row({ id: "a" })] })).toBe(
      "1 stopped item is holding live work.",
    );
  });

  test("says plainly when nothing is holding live work, which is Helio today", () => {
    const h = stoppedHeading({
      ...empty,
      thisWeek: [row({ id: "a" })],
      older: [row({ id: "b" }), row({ id: "c" })],
    });
    expect(h).toContain("Nothing stopped is holding live work");
    expect(h).toContain("1 item stopped this week");
    expect(h).toContain("2 older");
  });

  test("the demo count is never in the heading", () => {
    // P-56's defect: a headline number a person reads as their obligation must
    // not include rows that are nobody's decision.
    const h = stoppedHeading({
      ...empty,
      thisWeek: [row({ id: "a" })],
      demo: Array.from({ length: 11 }, (_, i) => row({ id: `d${i}`, isDemo: true })),
    });
    expect(h).not.toContain("11");
    expect(h).not.toContain("sample");
  });

  test("only demo rows left says nothing of YOURS is stopped", () => {
    const h = stoppedHeading({ ...empty, demo: [row({ id: "d", isDemo: true })] });
    expect(h).toBe("Nothing of yours is stopped.");
  });

  test("nothing at all says so without hedging", () => {
    expect(stoppedHeading(empty)).toBe("Nothing is stopped.");
  });
});

describe("demoFoldLine", () => {
  test("says the true number, which is eleven and not forty-seven", () => {
    expect(demoFoldLine(11)).toBe("11 sample items from the demo");
    expect(demoFoldLine(1)).toBe("1 sample item from the demo");
  });
});

describe("looksSeeded", () => {
  test("the seeded prefix this database actually uses", () => {
    expect(looksSeeded("60000000-0000-4000-8000-000000000000")).toBe(true);
    expect(looksSeeded("60000000-0b00-4000-8000-000000000001")).toBe(true);
  });

  test("a real row is not seeded, including one that merely starts with a six", () => {
    expect(looksSeeded("2679bd48-0000-4000-8000-000000000000")).toBe(false);
    expect(looksSeeded("60000001-0000-4000-8000-000000000000")).toBe(false);
    expect(looksSeeded("6000000-0000-4000-8000-000000000000")).toBe(false);
    expect(looksSeeded("")).toBe(false);
  });
});

describe("whatItIs / whatUnblocksIt", () => {
  test("names the thing in the product's words", () => {
    expect(whatItIs("SPEC")).toBe("a spec");
    expect(whatItIs("MEMORY")).toBe("a memory");
    expect(whatItIs("CHALLENGE")).toBe("a challenged assumption");
  });

  test("an unknown kind is named vaguely rather than wrongly", () => {
    expect(whatItIs("SOMETHING_NEW")).toBe("an item");
  });

  test("an unknown kind claims no unblocking verb at all", () => {
    // Telling somebody to approve a thing with no approve press is worse than
    // telling them nothing.
    expect(whatUnblocksIt("SOMETHING_NEW")).toBeNull();
    expect(whatUnblocksIt("SPEC")).toBe("your approval");
  });
});
