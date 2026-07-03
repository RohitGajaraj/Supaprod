import { expect, test, describe } from "bun:test";
import {
  summarizeAgentRecords,
  formatTrackRecord,
  trackRecordsToObject,
  summarizeAgentOutcomes,
  formatOutcomeRecord,
  outcomeRecordsToObject,
} from "./agent-track-record";

describe("summarizeAgentRecords — per-agent decided approval record", () => {
  test("counts approved (approved|executed) vs rejected per agent; ignores undecided", () => {
    const m = summarizeAgentRecords([
      { agent_slug: "scout", status: "approved", decided_at: "2026-06-01T00:00:00Z" },
      { agent_slug: "scout", status: "executed", decided_at: "2026-06-02T00:00:00Z" },
      { agent_slug: "scout", status: "rejected", decided_at: "2026-06-03T00:00:00Z" },
      { agent_slug: "scout", status: "pending", decided_at: null }, // not a judgment
      { agent_slug: "scout", status: "expired", decided_at: null }, // not a judgment
      { agent_slug: "builder", status: "approved", decided_at: "2026-06-04T00:00:00Z" },
    ]);
    expect(m.get("scout")).toEqual({ approved: 2, total: 3 });
    expect(m.get("builder")).toEqual({ approved: 1, total: 1 });
  });
  test("an approved-then-FAILED execution still counts as approved (Issue-1 guard)", () => {
    // The human approved the gate; the tool failing at execution is orthogonal.
    const m = summarizeAgentRecords([
      { agent_slug: "scout", status: "approved", decided_at: "a" },
      { agent_slug: "scout", status: "executed", decided_at: "b" },
      { agent_slug: "scout", status: "failed", decided_at: "c" }, // approved, ran, errored
    ]);
    expect(m.get("scout")).toEqual({ approved: 3, total: 3 }); // honest 3/3, not 2/3
  });
  test("cancelled/withdrawn rows are not a clean judgment and never count", () => {
    const m = summarizeAgentRecords([
      { agent_slug: "scout", status: "approved", decided_at: "a" },
      { agent_slug: "scout", status: "cancelled", decided_at: "b" }, // withdrawn
    ]);
    expect(m.get("scout")).toEqual({ approved: 1, total: 1 });
  });
  test("status is case-insensitive and slug is trimmed", () => {
    const m = summarizeAgentRecords([
      { agent_slug: " scout ", status: "APPROVED", decided_at: "x" },
      { agent_slug: "scout", status: "Rejected", decided_at: "y" },
    ]);
    expect(m.get("scout")).toEqual({ approved: 1, total: 2 });
  });
  test("blank slug rows and malformed input are safe", () => {
    expect(summarizeAgentRecords([{ agent_slug: "", status: "approved" }]).size).toBe(0);
    expect(summarizeAgentRecords(null).size).toBe(0);
    expect(summarizeAgentRecords(undefined).size).toBe(0);
  });
});

describe("formatTrackRecord — honest, or null when there is no history", () => {
  test("renders approved/total", () => {
    expect(formatTrackRecord({ approved: 44, total: 47 })).toBe("approved 44/47");
  });
  test("null when no decided history (never a hollow 0/0)", () => {
    expect(formatTrackRecord({ approved: 0, total: 0 })).toBeNull();
    expect(formatTrackRecord(null)).toBeNull();
    expect(formatTrackRecord(undefined)).toBeNull();
  });
  test("a perfect record renders too", () => {
    expect(formatTrackRecord({ approved: 12, total: 12 })).toBe("approved 12/12");
  });
});

describe("trackRecordsToObject — Map to transportable object", () => {
  test("flattens the map", () => {
    const m = summarizeAgentRecords([{ agent_slug: "scout", status: "approved", decided_at: "x" }]);
    expect(trackRecordsToObject(m)).toEqual({ scout: { approved: 1, total: 1 } });
  });
  test("empty map -> empty object", () => {
    expect(trackRecordsToObject(new Map())).toEqual({});
  });
});

describe("summarizeAgentOutcomes — per-agent recorded outcome record (RF-06)", () => {
  test("counts validated vs missed per agent; excludes mixed (no clean signal)", () => {
    const m = summarizeAgentOutcomes([
      { agent_slug: "scout", verdict: "validated" },
      { agent_slug: "scout", verdict: "validated" },
      { agent_slug: "scout", verdict: "missed" },
      { agent_slug: "scout", verdict: "mixed" }, // dropped: no clean directional signal
      { agent_slug: "builder", verdict: "validated" },
    ]);
    expect(m.get("scout")).toEqual({ validated: 2, total: 3 });
    expect(m.get("builder")).toEqual({ validated: 1, total: 1 });
  });
  test("blank slug and malformed input are safe", () => {
    expect(summarizeAgentOutcomes([{ agent_slug: "", verdict: "validated" }]).size).toBe(0);
    expect(summarizeAgentOutcomes(null).size).toBe(0);
    expect(summarizeAgentOutcomes(undefined).size).toBe(0);
  });
  test("verdict is case-insensitive and slug is trimmed", () => {
    const m = summarizeAgentOutcomes([
      { agent_slug: " scout ", verdict: "VALIDATED" },
      { agent_slug: "scout", verdict: "Missed" },
    ]);
    expect(m.get("scout")).toEqual({ validated: 1, total: 2 });
  });
  test("an unrecognized verdict never counts", () => {
    expect(summarizeAgentOutcomes([{ agent_slug: "scout", verdict: "pending" }]).size).toBe(0);
  });
});

describe("formatOutcomeRecord — honest, or null when there is no recorded outcome", () => {
  test("renders validated/total", () => {
    expect(formatOutcomeRecord({ validated: 12, total: 15 })).toBe("validated 12/15");
  });
  test("null when no validated/missed history (never a hollow 0/0)", () => {
    expect(formatOutcomeRecord({ validated: 0, total: 0 })).toBeNull();
    expect(formatOutcomeRecord(null)).toBeNull();
    expect(formatOutcomeRecord(undefined)).toBeNull();
  });
});

describe("outcomeRecordsToObject — Map to transportable object", () => {
  test("flattens the map", () => {
    const m = summarizeAgentOutcomes([{ agent_slug: "scout", verdict: "validated" }]);
    expect(outcomeRecordsToObject(m)).toEqual({ scout: { validated: 1, total: 1 } });
  });
  test("empty map -> empty object", () => {
    expect(outcomeRecordsToObject(new Map())).toEqual({});
  });
});
