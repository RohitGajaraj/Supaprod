import { describe, it, expect } from "bun:test";
import {
  assessCapability,
  assessIntegrity,
  assessVocabulary,
  describeGap,
  LIVENESS_SEVERITY,
  INTEGRITY_SEVERITY,
  type CapabilityObservation,
  type IntegrityObservation,
} from "./evaluate";

/**
 * These tests exist because this classifier is the one thing in the liveness
 * system that must not lie. Every other part can be checked by looking at it.
 * A wrong answer here looks exactly like a right one: a green page.
 *
 * The five 2026-08-02 findings are reproduced as named cases at the bottom. If
 * this file goes green and those cases do not report, the system is worthless.
 */

const NOW = Date.parse("2026-08-02T12:00:00.000Z");
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function agoIso(ms: number): string {
  return new Date(NOW - ms).toISOString();
}

function obs(partial: Partial<CapabilityObservation> = {}): CapabilityObservation {
  return { countInWindow: 1, lastAt: agoIso(5 * MINUTE), ...partial };
}

describe("assessCapability, the never-executed case", () => {
  it("calls a capability with no execution ever DEAD, on every cadence", () => {
    for (const cadence of ["continuous", "daily", "weekly", "on_demand"] as const) {
      const a = assessCapability(obs({ lastAt: null, countInWindow: 0 }), { cadence }, NOW);
      expect(a.verdict).toBe("dead");
      expect(a.neverExecuted).toBe(true);
      expect(a.ageMs).toBeNull();
    }
  });

  it("says so in words, because a count of zero is not a sentence", () => {
    const a = assessCapability(obs({ lastAt: null, countInWindow: 0 }), { cadence: "daily" }, NOW);
    expect(a.reason).toBe("Has never executed. Not once, ever.");
  });

  it("treats an unparseable timestamp as never executed rather than as now", () => {
    const a = assessCapability(
      obs({ lastAt: "not a timestamp", countInWindow: 0 }),
      { cadence: "daily" },
      NOW,
    );
    expect(a.verdict).toBe("dead");
    expect(a.neverExecuted).toBe(true);
  });
});

describe("assessCapability, the age ladder", () => {
  it("is healthy inside its own cadence", () => {
    const a = assessCapability(
      obs({ lastAt: agoIso(30 * MINUTE), countInWindow: 40 }),
      { cadence: "continuous" },
      NOW,
    );
    expect(a.verdict).toBe("healthy");
  });

  it("goes quiet past three cadences and not before", () => {
    const justInside = assessCapability(
      obs({ lastAt: agoIso(3 * HOUR - MINUTE), countInWindow: 3 }),
      { cadence: "continuous" },
      NOW,
    );
    expect(justInside.verdict).toBe("healthy");

    const justOutside = assessCapability(
      obs({ lastAt: agoIso(3 * HOUR + MINUTE), countInWindow: 3 }),
      { cadence: "continuous" },
      NOW,
    );
    expect(justOutside.verdict).toBe("quiet");
  });

  it("goes dead past seven cadences and not before", () => {
    const justInside = assessCapability(
      obs({ lastAt: agoIso(7 * HOUR - MINUTE), countInWindow: 1 }),
      { cadence: "continuous" },
      NOW,
    );
    expect(justInside.verdict).toBe("quiet");

    const justOutside = assessCapability(
      obs({ lastAt: agoIso(7 * HOUR + MINUTE), countInWindow: 1 }),
      { cadence: "continuous" },
      NOW,
    );
    expect(justOutside.verdict).toBe("dead");
  });

  it("scales the ladder with the cadence word", () => {
    const fiveDays = agoIso(5 * DAY);
    expect(
      assessCapability(obs({ lastAt: fiveDays }), { cadence: "continuous" }, NOW).verdict,
    ).toBe("dead");
    expect(assessCapability(obs({ lastAt: fiveDays }), { cadence: "daily" }, NOW).verdict).toBe(
      "quiet",
    );
    expect(assessCapability(obs({ lastAt: fiveDays }), { cadence: "weekly" }, NOW).verdict).toBe(
      "healthy",
    );
  });

  it("honours an explicit interval over the cadence word", () => {
    const a = assessCapability(
      obs({ lastAt: agoIso(3 * HOUR), countInWindow: 2 }),
      { cadence: "daily", expectedIntervalMs: 15 * MINUTE },
      NOW,
    );
    expect(a.verdict).toBe("dead");
    expect(a.deadAfterMs).toBe(7 * 15 * MINUTE);
  });

  it("never lets a clock skew produce a negative age", () => {
    const a = assessCapability(
      obs({ lastAt: new Date(NOW + 60 * HOUR).toISOString() }),
      {
        cadence: "daily",
      },
      NOW,
    );
    expect(a.ageMs).toBe(0);
    expect(a.verdict).toBe("healthy");
  });
});

describe("assessCapability, on demand", () => {
  it("never goes dead from age alone, because there is no schedule to miss", () => {
    const a = assessCapability(
      obs({ lastAt: agoIso(400 * DAY), countInWindow: 0 }),
      { cadence: "on_demand" },
      NOW,
    );
    expect(a.verdict).toBe("quiet");
    expect(a.deadAfterMs).toBeNull();
    expect(a.quietAfterMs).toBeNull();
  });

  it("still goes dead when it has never been used at all", () => {
    const a = assessCapability(
      obs({ lastAt: null, countInWindow: 0 }),
      { cadence: "on_demand" },
      NOW,
    );
    expect(a.verdict).toBe("dead");
  });
});

describe("assessCapability, volume", () => {
  it("caps at quiet when the count is below the floor, even when recent", () => {
    const a = assessCapability(
      obs({ lastAt: agoIso(2 * MINUTE), countInWindow: 1 }),
      { cadence: "continuous", minExpectedInWindow: 20 },
      NOW,
    );
    expect(a.verdict).toBe("quiet");
    expect(a.reason).toContain("below the 20 expected");
  });

  it("never turns a low count into dead, because low is a suspicion", () => {
    const a = assessCapability(
      obs({ lastAt: agoIso(MINUTE), countInWindow: 0 }),
      { cadence: "continuous", minExpectedInWindow: 500 },
      NOW,
    );
    expect(a.verdict).toBe("quiet");
  });

  it("reports quiet when nothing landed in the window despite a recent last run", () => {
    const a = assessCapability(
      obs({ lastAt: agoIso(20 * MINUTE), countInWindow: 0 }),
      { cadence: "continuous" },
      NOW,
    );
    expect(a.verdict).toBe("quiet");
    expect(a.reason).toContain("Nothing in the window");
  });
});

describe("assessCapability, a failed read", () => {
  it("returns unknown and never borrows a healthy verdict", () => {
    const a = assessCapability(
      { countInWindow: 0, lastAt: null, probeFailed: true, probeError: "permission denied" },
      { cadence: "daily" },
      NOW,
    );
    expect(a.verdict).toBe("unknown");
    expect(a.reason).toContain("permission denied");
    expect(a.neverExecuted).toBe(false);
  });

  it("outranks the never-executed case, so a broken read is not reported as a dead feature", () => {
    const a = assessCapability(
      { countInWindow: 0, lastAt: null, probeFailed: true },
      { cadence: "continuous" },
      NOW,
    );
    expect(a.verdict).toBe("unknown");
  });
});

describe("assessCapability is pure", () => {
  it("returns the same verdict for the same inputs", () => {
    const o = obs({ lastAt: agoIso(4 * HOUR), countInWindow: 2 });
    const first = assessCapability(o, { cadence: "continuous" }, NOW);
    const second = assessCapability(o, { cadence: "continuous" }, NOW);
    expect(second).toEqual(first);
  });

  it("does not mutate its inputs", () => {
    const o = obs({ lastAt: agoIso(HOUR), countInWindow: 7 });
    const snapshot = JSON.stringify(o);
    assessCapability(o, { cadence: "daily" }, NOW);
    expect(JSON.stringify(o)).toBe(snapshot);
  });
});

/* ------------------------------------------------------------------ *
 * Integrity
 * ------------------------------------------------------------------ */

function integrity(partial: Partial<IntegrityObservation> = {}): IntegrityObservation {
  return { totalRows: 100, offendingRows: 0, ...partial };
}

describe("assessIntegrity, the never-written column", () => {
  it("calls a column that no row carries BROKEN", () => {
    const a = assessIntegrity(integrity({ totalRows: 1240, offendingRows: 1240 }));
    expect(a.verdict).toBe("broken");
    expect(a.nullRatio).toBe(1);
    expect(a.reason).toContain("1240 of 1240");
  });

  it("calls a full column clean", () => {
    const a = assessIntegrity(integrity({ totalRows: 1240, offendingRows: 0 }));
    expect(a.verdict).toBe("clean");
    expect(a.nullRatio).toBe(0);
  });

  it("treats a small tail as sweep lag rather than a defect", () => {
    const a = assessIntegrity(integrity({ totalRows: 1000, offendingRows: 5 }));
    expect(a.verdict).toBe("clean");
  });

  it("calls a large tail degraded", () => {
    const a = assessIntegrity(integrity({ totalRows: 1000, offendingRows: 200 }));
    expect(a.verdict).toBe("degraded");
    expect(a.reason).toContain("20 percent");
  });

  it("crosses to broken at half the table", () => {
    expect(assessIntegrity(integrity({ totalRows: 100, offendingRows: 49 })).verdict).toBe(
      "degraded",
    );
    expect(assessIntegrity(integrity({ totalRows: 100, offendingRows: 50 })).verdict).toBe(
      "broken",
    );
  });

  it("honours per-check thresholds", () => {
    const a = assessIntegrity(integrity({ totalRows: 100, offendingRows: 10 }), {
      toleratedNullRatio: 0.25,
    });
    expect(a.verdict).toBe("clean");
  });

  it("says clean with no rows rather than dividing by zero", () => {
    const a = assessIntegrity(integrity({ totalRows: 0, offendingRows: 0 }));
    expect(a.verdict).toBe("clean");
    expect(a.nullRatio).toBeNull();
  });

  it("returns unknown when the read failed", () => {
    const a = assessIntegrity(
      integrity({ probeFailed: true, probeError: "relation does not exist" }),
    );
    expect(a.verdict).toBe("unknown");
    expect(a.reason).toContain("relation does not exist");
  });
});

describe("assessIntegrity, segments", () => {
  it("calls a wholly unwritten segment broken even when the table ratio looks like a backlog", () => {
    const a = assessIntegrity(
      integrity({
        totalRows: 421,
        offendingRows: 249,
        segments: [
          { segment: "note", totalRows: 40, offendingRows: 40 },
          { segment: "precedent", totalRows: 22, offendingRows: 22 },
          { segment: "reflection", totalRows: 359, offendingRows: 187 },
        ],
      }),
    );
    expect(a.verdict).toBe("broken");
    expect(a.deadSegments).toEqual(["note", "precedent"]);
    expect(a.reason).toContain("note, precedent");
  });

  it("ignores a segment too small to mean anything", () => {
    const a = assessIntegrity(
      integrity({
        totalRows: 1000,
        offendingRows: 2,
        segments: [{ segment: "rare", totalRows: 2, offendingRows: 2 }],
      }),
    );
    expect(a.verdict).toBe("clean");
    expect(a.deadSegments).toEqual([]);
  });

  it("lets a check lower the segment floor when even one row matters", () => {
    const a = assessIntegrity(
      integrity({
        totalRows: 1000,
        offendingRows: 2,
        segments: [{ segment: "rare", totalRows: 2, offendingRows: 2 }],
      }),
      { segmentMinRows: 1 },
    );
    expect(a.verdict).toBe("broken");
  });

  it("does not mutate its inputs", () => {
    const o = integrity({
      totalRows: 10,
      offendingRows: 10,
      segments: [{ segment: "a", totalRows: 10, offendingRows: 10 }],
    });
    const snapshot = JSON.stringify(o);
    assessIntegrity(o);
    expect(JSON.stringify(o)).toBe(snapshot);
  });
});

/* ------------------------------------------------------------------ *
 * Vocabulary
 * ------------------------------------------------------------------ */

describe("assessVocabulary", () => {
  it("finds rows carrying a value the code cannot name", () => {
    const a = assessVocabulary({ totalRows: 850, declaredRows: 704 });
    expect(a.verdict).toBe("drifted");
    expect(a.undeclaredRows).toBe(146);
    expect(a.reason).toContain("146 of 850");
  });

  it("calls a vocabulary that covers every row aligned", () => {
    const a = assessVocabulary({ totalRows: 850, declaredRows: 850 });
    expect(a.verdict).toBe("aligned");
    expect(a.undeclaredRows).toBe(0);
  });

  it("never reports a negative gap when a count races", () => {
    const a = assessVocabulary({ totalRows: 100, declaredRows: 105 });
    expect(a.undeclaredRows).toBe(0);
    expect(a.verdict).toBe("aligned");
  });

  it("names declared values nothing writes, when the breakdown was asked for", () => {
    const a = assessVocabulary({
      totalRows: 10,
      declaredRows: 10,
      declaredCounts: [
        { value: "decision", rows: 10 },
        { value: "prototype", rows: 0 },
      ],
    });
    expect(a.verdict).toBe("aligned");
    expect(a.unusedValues).toEqual(["prototype"]);
    expect(a.reason).toContain("prototype");
  });

  it("says nothing about unused values when the breakdown was skipped", () => {
    const a = assessVocabulary({ totalRows: 10, declaredRows: 10 });
    expect(a.unusedValues).toEqual([]);
  });

  it("returns unknown when the read failed", () => {
    const a = assessVocabulary({
      totalRows: 0,
      declaredRows: 0,
      probeFailed: true,
      probeError: "statement timeout",
    });
    expect(a.verdict).toBe("unknown");
    expect(a.reason).toContain("statement timeout");
  });

  it("says aligned rather than drifted on an empty table", () => {
    const a = assessVocabulary({ totalRows: 0, declaredRows: 0 });
    expect(a.verdict).toBe("aligned");
  });
});

/* ------------------------------------------------------------------ *
 * The five real cases. If these ever go green, this system is lying.
 * ------------------------------------------------------------------ */

describe("the 2026-08-02 findings, replayed", () => {
  it("1. signals.embedding, a column read by match_signals and written by nothing", () => {
    const a = assessIntegrity(integrity({ totalRows: 3120, offendingRows: 3120 }));
    expect(a.verdict).toBe("broken");
  });

  it("2. themes.embedding, 181 themes and zero vectors, so theme growth attached nothing", () => {
    const a = assessIntegrity(integrity({ totalRows: 181, offendingRows: 181 }));
    expect(a.verdict).toBe("broken");
  });

  it("3. the learning node kind, present in the database and absent from the vocabularies", () => {
    // Expressed as liveness: the kind exists in the data, and the capability
    // that names and focuses it had never executed against one.
    const a = assessCapability({ countInWindow: 0, lastAt: null }, { cadence: "on_demand" }, NOW);
    expect(a.verdict).toBe("dead");
  });

  it("4. agent_memory.embedding, note and precedent 100 percent unembedded", () => {
    const a = assessIntegrity(
      integrity({
        totalRows: 421,
        offendingRows: 249,
        segments: [
          { segment: "note", totalRows: 31, offendingRows: 31 },
          { segment: "precedent", totalRows: 18, offendingRows: 18 },
        ],
      }),
    );
    expect(a.verdict).toBe("broken");
    expect(a.deadSegments).toContain("note");
    expect(a.deadSegments).toContain("precedent");
  });

  it("5. the pulse widget, which recorded nothing at all after the constraint landed", () => {
    const a = assessCapability(
      { countInWindow: 0, lastAt: agoIso(45 * DAY) },
      { cadence: "daily" },
      NOW,
    );
    expect(a.verdict).toBe("dead");
    expect(a.reason).toContain("past 7 of its own cycles");
  });
});

describe("ordering and formatting", () => {
  it("sorts the worst finding first", () => {
    const order = (["healthy", "quiet", "dead", "unknown"] as const)
      .slice()
      .sort((a, b) => LIVENESS_SEVERITY[a] - LIVENESS_SEVERITY[b]);
    expect(order).toEqual(["dead", "unknown", "quiet", "healthy"]);

    const integrityOrder = (["clean", "degraded", "broken", "unknown"] as const)
      .slice()
      .sort((a, b) => INTEGRITY_SEVERITY[a] - INTEGRITY_SEVERITY[b]);
    expect(integrityOrder).toEqual(["broken", "unknown", "degraded", "clean"]);
  });

  it("describes a gap in the coarsest unit that is still true", () => {
    expect(describeGap(30_000)).toBe("a moment");
    expect(describeGap(20 * MINUTE)).toBe("20 min");
    expect(describeGap(5 * HOUR)).toBe("5 h");
    expect(describeGap(5 * DAY)).toBe("5 d");
    expect(describeGap(120 * DAY)).toBe("4 months");
  });
});
