import { describe, it, expect } from "bun:test";
import {
  liveGateOr,
  expiredGateOr,
  notSnoozedOr,
  computeGateMedianMinutes,
  accumulateCostAndModelByTrace,
  aggregateDailySpend,
  extractEvidenceText,
} from "./today-shared";

describe("PostgREST gate filter predicates", () => {
  const nowIso = "2026-07-10T12:00:00Z";

  describe("liveGateOr", () => {
    it("returns a filter matching gates with null expiry OR expiry in the future", () => {
      const filter = liveGateOr(nowIso);
      expect(filter).toBe(`expires_at.is.null,expires_at.gt.${nowIso}`);
    });

    it("includes the now timestamp in the comparison", () => {
      const customNow = "2025-12-31T23:59:59Z";
      const filter = liveGateOr(customNow);
      expect(filter).toContain(customNow);
    });
  });

  describe("expiredGateOr", () => {
    it("returns a filter matching marked-expired OR pending-but-past-window", () => {
      const filter = expiredGateOr(nowIso);
      expect(filter).toContain("escalation_state.eq.expired");
      expect(filter).toContain("escalation_state.eq.pending");
      expect(filter).toContain(`expires_at.lte.${nowIso}`);
    });

    it("uses lte (not lt) to catch gates expired exactly at now", () => {
      const filter = expiredGateOr(nowIso);
      expect(filter).toContain("expires_at.lte");
    });
  });

  describe("notSnoozedOr", () => {
    it("returns a filter matching null snooze OR snooze window passed", () => {
      const filter = notSnoozedOr(nowIso);
      expect(filter).toBe(`snoozed_until.is.null,snoozed_until.lt.${nowIso}`);
    });

    it("uses lt (not lte) so a snooze expiring exactly at now is still snoozed", () => {
      const filter = notSnoozedOr(nowIso);
      expect(filter).toContain("snoozed_until.lt");
    });
  });
});

describe("computeGateMedianMinutes", () => {
  it("returns null for an empty array", () => {
    expect(computeGateMedianMinutes([])).toBeNull();
  });

  it("returns the single latency rounded for one record", () => {
    const record = {
      created_at: "2026-07-10T12:00:00Z",
      decided_at: "2026-07-10T12:30:15Z",
    };
    const result = computeGateMedianMinutes([record]);
    // 30m 15s = 30.25 minutes, rounded = 30
    expect(result).toBe(30);
  });

  it("returns the median latency for multiple records", () => {
    const records = [
      { created_at: "2026-07-10T12:00:00Z", decided_at: "2026-07-10T12:10:00Z" }, // 10m
      { created_at: "2026-07-10T12:00:00Z", decided_at: "2026-07-10T12:20:00Z" }, // 20m
      { created_at: "2026-07-10T12:00:00Z", decided_at: "2026-07-10T12:50:00Z" }, // 50m
    ];
    // Sorted: [10, 20, 50], median = 20
    expect(computeGateMedianMinutes(records)).toBe(20);
  });

  it("returns the lower median for even number of records", () => {
    const records = [
      { created_at: "2026-07-10T12:00:00Z", decided_at: "2026-07-10T12:10:00Z" }, // 10m
      { created_at: "2026-07-10T12:00:00Z", decided_at: "2026-07-10T12:40:00Z" }, // 40m
    ];
    // Sorted: [10, 40], median at index floor(2/2) = 1 => 40
    expect(computeGateMedianMinutes(records)).toBe(40);
  });

  it("filters out negative latencies (decided before created — clock skew)", () => {
    const records = [
      { created_at: "2026-07-10T12:00:00Z", decided_at: "2026-07-10T11:50:00Z" }, // -10m, filtered
      { created_at: "2026-07-10T12:00:00Z", decided_at: "2026-07-10T12:20:00Z" }, // 20m
      { created_at: "2026-07-10T12:00:00Z", decided_at: "2026-07-10T12:30:00Z" }, // 30m
    ];
    expect(computeGateMedianMinutes(records)).toBe(30); // Only [20, 30] are valid
  });

  it("filters out non-finite latencies (invalid date strings)", () => {
    const records = [
      { created_at: "invalid", decided_at: "2026-07-10T12:20:00Z" }, // NaN
      { created_at: "2026-07-10T12:00:00Z", decided_at: "2026-07-10T12:20:00Z" }, // 20m
      { created_at: "2026-07-10T12:00:00Z", decided_at: "2026-07-10T12:30:00Z" }, // 30m
    ];
    expect(computeGateMedianMinutes(records)).toBe(30); // Only [20, 30] are valid
  });

  it("rounds the median correctly (banker's rounding via Math.round)", () => {
    const records = [
      { created_at: "2026-07-10T12:00:00Z", decided_at: "2026-07-10T12:00:30Z" }, // 0.5m
      { created_at: "2026-07-10T12:00:00Z", decided_at: "2026-07-10T12:01:30Z" }, // 1.5m
    ];
    // Sorted: [0.5, 1.5], median at index floor(2/2) = 1 => 1.5, rounded = 2
    expect(computeGateMedianMinutes(records)).toBe(2);
  });
});

describe("accumulateCostAndModelByTrace", () => {
  it("returns empty maps for an empty event list", () => {
    const { costByTrace, modelByTrace } = accumulateCostAndModelByTrace([]);
    expect(costByTrace.size).toBe(0);
    expect(modelByTrace.size).toBe(0);
  });

  it("skips events with null trace_id", () => {
    const events = [
      { trace_id: null, model: "gpt-4", est_cost_usd: 0.05 },
      { trace_id: "trace-1", model: "gpt-4", est_cost_usd: 0.05 },
    ];
    const { costByTrace } = accumulateCostAndModelByTrace(events);
    expect(costByTrace.size).toBe(1);
    expect(costByTrace.get("trace-1")).toBe(0.05);
  });

  it("accumulates costs for the same trace", () => {
    const events = [
      { trace_id: "trace-1", model: "gpt-4", est_cost_usd: 0.05 },
      { trace_id: "trace-1", model: "gpt-4", est_cost_usd: 0.03 },
      { trace_id: "trace-1", model: "gpt-4", est_cost_usd: 0.02 },
    ];
    const { costByTrace } = accumulateCostAndModelByTrace(events);
    expect(costByTrace.get("trace-1")).toBe(0.1);
  });

  it("handles null est_cost_usd as 0", () => {
    const events = [
      { trace_id: "trace-1", model: "gpt-4", est_cost_usd: null },
      { trace_id: "trace-1", model: "gpt-4", est_cost_usd: 0.05 },
    ];
    const { costByTrace } = accumulateCostAndModelByTrace(events);
    expect(costByTrace.get("trace-1")).toBe(0.05);
  });

  it("records the first model seen for each trace", () => {
    const events = [
      { trace_id: "trace-1", model: "gpt-4", est_cost_usd: 0.05 },
      { trace_id: "trace-1", model: "claude-3", est_cost_usd: 0.03 }, // Later, ignored
      { trace_id: "trace-2", model: "gpt-4o", est_cost_usd: 0.02 },
    ];
    const { modelByTrace } = accumulateCostAndModelByTrace(events);
    expect(modelByTrace.get("trace-1")).toBe("gpt-4"); // First one wins
    expect(modelByTrace.get("trace-2")).toBe("gpt-4o");
  });

  it("handles multiple distinct traces", () => {
    const events = [
      { trace_id: "trace-1", model: "gpt-4", est_cost_usd: 0.05 },
      { trace_id: "trace-2", model: "claude-3", est_cost_usd: 0.1 },
      { trace_id: "trace-3", model: "gpt-4o", est_cost_usd: 0.02 },
    ];
    const { costByTrace, modelByTrace } = accumulateCostAndModelByTrace(events);
    expect(costByTrace.size).toBe(3);
    expect(modelByTrace.size).toBe(3);
    expect([...costByTrace.values()]).toContain(0.05);
    expect([...costByTrace.values()]).toContain(0.1);
    expect([...costByTrace.values()]).toContain(0.02);
  });
});

describe("aggregateDailySpend", () => {
  it("returns 0 for an empty event list", () => {
    expect(aggregateDailySpend([])).toBe(0);
  });

  it("sums positive costs", () => {
    const events = [{ est_cost_usd: 0.05 }, { est_cost_usd: 0.03 }, { est_cost_usd: 0.02 }];
    expect(aggregateDailySpend(events)).toBe(0.1);
  });

  it("treats null costs as 0", () => {
    const events = [{ est_cost_usd: 0.05 }, { est_cost_usd: null }, { est_cost_usd: 0.03 }];
    expect(aggregateDailySpend(events)).toBe(0.08);
  });

  it("handles all-null costs", () => {
    const events = [{ est_cost_usd: null }, { est_cost_usd: null }];
    expect(aggregateDailySpend(events)).toBe(0);
  });

  it("accumulates to the correct decimal (no floating-point creep)", () => {
    const events = [{ est_cost_usd: 0.1 }, { est_cost_usd: 0.2 }, { est_cost_usd: 0.3 }];
    // 0.1 + 0.2 + 0.3 = 0.6 (JavaScript float precision risk, but small enough)
    const result = aggregateDailySpend(events);
    expect(Math.abs(result - 0.6) < 0.0001).toBe(true);
  });
});

describe("extractEvidenceText", () => {
  it("prefers signal title over content", () => {
    const signal = {
      type: "signal" as const,
      title: "Market signal",
      content: "This is a very long content that would be truncated if used...",
    };
    expect(extractEvidenceText(signal)).toBe("Market signal");
  });

  it("falls back to signal content truncated if title is null", () => {
    const signal = {
      type: "signal" as const,
      title: null,
      content:
        "This is a very long signal content that spans multiple sentences and goes on and on and continues even further with more details about this important market signal and analysis",
    };
    const result = extractEvidenceText(signal);
    expect(result).toHaveLength(140);
    // Just verify it's truncated to the first 140 chars
    expect(result).toBe(signal.content.slice(0, 140));
  });

  it("truncates signal content at 140 characters", () => {
    const signal = {
      type: "signal" as const,
      title: null,
      content: "x".repeat(200),
    };
    expect(extractEvidenceText(signal)).toHaveLength(140);
    expect(extractEvidenceText(signal)).toBe("x".repeat(140));
  });

  it("returns learning summary truncated at 140 characters", () => {
    const learning = {
      type: "learning" as const,
      summary: "y".repeat(200),
    };
    expect(extractEvidenceText(learning)).toHaveLength(140);
    expect(extractEvidenceText(learning)).toBe("y".repeat(140));
  });

  it("handles empty signal content", () => {
    const signal = {
      type: "signal" as const,
      title: null,
      content: "",
    };
    expect(extractEvidenceText(signal)).toBe("");
  });

  it("handles empty learning summary", () => {
    const learning = {
      type: "learning" as const,
      summary: "",
    };
    expect(extractEvidenceText(learning)).toBe("");
  });

  it("preserves special characters and whitespace in truncation", () => {
    const signal = {
      type: "signal" as const,
      title: null,
      content: "Line 1\n\nLine 2 with émojis 🎉 and special chars: @#$%".repeat(3),
    };
    const result = extractEvidenceText(signal);
    expect(result).toHaveLength(140);
    expect(result.includes("\n")).toBe(true);
  });
});
