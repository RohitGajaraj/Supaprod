/**
 * The honesty rules of the methods surface, pinned.
 *
 * These are not formatting tests. Every assertion here is a rule about what
 * the product is allowed to claim from a column that is currently all NULL:
 * `playbook_runs` holds 34 real rows (prd-spine 19, rice 10, jtbd 5) and not
 * one of them carries a verdict. The state guarded here is therefore the state
 * the surface is actually in this week, not a hypothetical edge case.
 */
import { describe, expect, test } from "bun:test";
import {
  CrewMethods,
  MIN_RESULTS_FOR_RATE,
  STATION_WORDS,
  isAutoPicked,
  methodRecord,
  methodsSummary,
  stationSub,
} from "./CrewMethods";
import {
  AGENT_TO_PLAYBOOK_STATION,
  PLAYBOOK_REGISTRY,
  rankPlaybooksByOutcome,
  type PlaybookStation,
} from "@/lib/playbooks/registry";

const STATIONS: PlaybookStation[] = [
  "discovery",
  "prioritization",
  "prd",
  "positioning",
  "validation",
];

/** The two dashes UI copy may never carry, kept as escapes so this file's own
 *  assertions cannot trip the repo's humanization check. */
const EM_DASH = "—";
const EN_DASH = "–";

describe("methodRecord: a rate is never invented", () => {
  test("a method nobody has run says only that, and offers no second phrase", () => {
    expect(methodRecord({ runs: 0, decisive: 0, validated: 0, winRate: null })).toEqual({
      runs: 0,
      results: 0,
      ratePct: null,
      recordText: null,
      tone: "quiet",
    });
  });

  test("runs with no result read as no result, never as zero percent", () => {
    const r = methodRecord({ runs: 19, decisive: 0, validated: 0, winRate: null });
    expect(r.runs).toBe(19);
    expect(r.ratePct).toBeNull();
    expect(r.recordText).toBe("No result yet");
    expect(r.recordText).not.toContain("%");
    expect(r.tone).toBe("quiet");
  });

  test("thin evidence shows the raw counts AND says they are not a rate", () => {
    const r = methodRecord({ runs: 9, decisive: 3, validated: 2, winRate: 0.67 });
    expect(r.ratePct).toBeNull();
    expect(r.recordText).toBe("2 of 3 validated, too few to rate");
  });

  test("one result short of the bar is still not a rate", () => {
    const r = methodRecord({
      runs: 20,
      decisive: MIN_RESULTS_FOR_RATE - 1,
      validated: 4,
      winRate: 1,
    });
    expect(r.ratePct).toBeNull();
    expect(r.recordText).toContain("too few to rate");
  });

  test("at the bar the rate appears, with its sample size beside it", () => {
    const r = methodRecord({
      runs: 20,
      decisive: MIN_RESULTS_FOR_RATE,
      validated: 4,
      winRate: 0.8,
    });
    expect(r.ratePct).toBe(80);
    expect(r.recordText).toBe("80% validated, 5 results");
    expect(r.tone).toBe("pass");
  });

  test("a null winRate blocks the rate even when the counts would allow one", () => {
    const r = methodRecord({ runs: 40, decisive: 12, validated: 9, winRate: null });
    expect(r.ratePct).toBeNull();
    expect(r.recordText).toBe("9 of 12 validated");
    expect(r.recordText).not.toContain("%");
  });

  test("tone encodes the real number at 60 and 40, and nowhere else", () => {
    const at = (validated: number, results: number) =>
      methodRecord({ runs: results, decisive: results, validated, winRate: validated / results });
    expect(at(6, 10).ratePct).toBe(60);
    expect(at(6, 10).tone).toBe("pass");
    expect(at(59, 100).tone).toBe("warn");
    expect(at(4, 10).tone).toBe("warn");
    expect(at(39, 100).tone).toBe("fail");
  });

  test("garbage in never becomes a number out", () => {
    expect(methodRecord({ runs: Number.NaN, decisive: -4, validated: -9, winRate: null })).toEqual({
      runs: 0,
      results: 0,
      ratePct: null,
      recordText: null,
      tone: "quiet",
    });
    // More validated than decisive is incoherent; it must never exceed 100%.
    expect(methodRecord({ runs: 10, decisive: 5, validated: 99, winRate: 1 }).ratePct).toBe(100);
  });
});

describe("the live state: 34 runs, every verdict NULL", () => {
  // The exact production shape. Every recorded run carries a null verdict, so
  // the surface must reach "runs, no result" for every method that has been
  // used and "never run" for every method that has not.
  const liveRuns = [
    ...Array.from({ length: 19 }, () => ({ playbook_id: "prd-spine", verdict: null })),
    ...Array.from({ length: 10 }, () => ({ playbook_id: "rice", verdict: null })),
    ...Array.from({ length: 5 }, () => ({ playbook_id: "jtbd", verdict: null })),
  ];

  test("not one method anywhere earns a percentage", () => {
    for (const station of STATIONS) {
      for (const ranked of rankPlaybooksByOutcome(station, liveRuns)) {
        const rec = methodRecord(ranked);
        expect(rec.ratePct).toBeNull();
        expect(rec.recordText ?? "").not.toContain("%");
      }
    }
  });

  test("the real run counts still reach the screen: 19, 10 and 5", () => {
    const seen = new Map<string, number>();
    for (const station of STATIONS) {
      for (const ranked of rankPlaybooksByOutcome(station, liveRuns)) {
        seen.set(ranked.playbook.id, methodRecord(ranked).runs);
      }
    }
    expect(seen.get("prd-spine")).toBe(19);
    expect(seen.get("rice")).toBe(10);
    expect(seen.get("jtbd")).toBe(5);
    expect(seen.get("positioning-statement")).toBe(0);
  });

  test("a used method says no result yet, an unused one says nothing extra", () => {
    const [used] = rankPlaybooksByOutcome("prd", liveRuns);
    expect(methodRecord(used).recordText).toBe("No result yet");
    const [unused] = rankPlaybooksByOutcome("positioning", liveRuns);
    expect(methodRecord(unused).recordText).toBeNull();
  });

  test("the headline admits the order is not a ranking", () => {
    const all = STATIONS.flatMap((s) => rankPlaybooksByOutcome(s, liveRuns));
    const runs = all.reduce((n, r) => n + r.runs, 0);
    const rated = all.filter((r) => methodRecord(r).ratePct !== null).length;
    expect(runs).toBe(34);
    expect(rated).toBe(0);
    expect(methodsSummary({ methods: all.length, runs, rated })).toBe("none-rated");
  });
});

describe("methodsSummary", () => {
  test("no runs at all is a different sentence from runs with no results", () => {
    expect(methodsSummary({ methods: 6, runs: 0, rated: 0 })).toBe("no-runs");
    expect(methodsSummary({ methods: 6, runs: 34, rated: 0 })).toBe("none-rated");
    expect(methodsSummary({ methods: 6, runs: 34, rated: 2 })).toBe("some-rated");
  });
});

describe("station copy is derived from the loop, not restated beside it", () => {
  test("every station has plain words, and none of them is a column name", () => {
    for (const station of STATIONS) {
      const words = STATION_WORDS[station];
      expect(typeof words).toBe("string");
      expect(words.length).toBeGreaterThan(8);
      expect(words.toLowerCase()).not.toContain("prd");
      expect(words.toLowerCase()).not.toContain("playbook");
      expect(words.toLowerCase()).not.toContain(station);
    }
  });

  test("auto-pick follows AGENT_TO_PLAYBOOK_STATION exactly", () => {
    const mapped = new Set(Object.values(AGENT_TO_PLAYBOOK_STATION));
    for (const station of STATIONS) {
      expect(isAutoPicked(station)).toBe(mapped.has(station));
    }
    expect(isAutoPicked("discovery")).toBe(true);
    expect(isAutoPicked("prioritization")).toBe(true);
    expect(isAutoPicked("prd")).toBe(true);
    // Nothing selects these, so the surface must not imply anything does.
    expect(isAutoPicked("positioning")).toBe(false);
    expect(isAutoPicked("validation")).toBe(false);
  });

  test("a station nothing picks from never claims a door that does not exist", () => {
    expect(stationSub("discovery")).toContain("picks one of these itself");
    const manual = stationSub("validation");
    expect(manual).toContain("Nothing picks one of these on its own yet");
    expect(manual.toLowerCase()).not.toContain("by hand");
    expect(manual.toLowerCase()).not.toContain("click");
  });
});

describe("copy rules", () => {
  const strings = [
    ...Object.values(STATION_WORDS),
    ...STATIONS.map(stationSub),
    methodRecord({ runs: 9, decisive: 3, validated: 2, winRate: 0.67 }).recordText ?? "",
    methodRecord({ runs: 9, decisive: 0, validated: 0, winRate: null }).recordText ?? "",
    methodRecord({ runs: 9, decisive: 8, validated: 6, winRate: 0.75 }).recordText ?? "",
  ];

  test("neither long dash reaches the screen", () => {
    for (const s of strings) {
      expect(s).not.toContain(EM_DASH);
      expect(s).not.toContain(EN_DASH);
    }
  });
});

describe("the door itself", () => {
  test("the surface is a component, so the import graph holds", () => {
    expect(typeof CrewMethods).toBe("function");
  });

  test("the registry it reads is never empty, so the page is never blank", () => {
    expect(PLAYBOOK_REGISTRY.length).toBeGreaterThan(0);
    for (const p of PLAYBOOK_REGISTRY) {
      expect(p.summary.length).toBeGreaterThan(10);
      expect(p.steps.length).toBeGreaterThan(0);
      expect(p.rankingSignal.length).toBeGreaterThan(10);
    }
  });
});
