import { describe, expect, test } from "bun:test";
import {
  RECEIPT_PREFIX,
  receiptTraceRef,
  receiptStatusTone,
  receiptStatusLabel,
  ledgerSummary,
} from "./format";

describe("receiptTraceRef", () => {
  test("prefixes a decision with DEC and an action with ACT, via the shared traceRef", () => {
    expect(receiptTraceRef({ id: "a1b2c3d4-0000-0000-0000-000000000000", kind: "decision" })).toBe(
      "DEC\u00b7A1B2C3",
    );
    expect(receiptTraceRef({ id: "ff00aa11-2222-3333-4444-555566667777", kind: "action" })).toBe(
      "ACT\u00b7FF00AA",
    );
  });
  test("registry has exactly the two receipt kinds", () => {
    expect(RECEIPT_PREFIX).toEqual({ decision: "DEC", action: "ACT" });
  });
});

describe("receiptStatusTone — obsidian role correctness", () => {
  test("approved/executed/auto_approved read moss", () => {
    expect(receiptStatusTone("approved")).toBe("moss");
    expect(receiptStatusTone("executed")).toBe("moss");
    expect(receiptStatusTone("auto_approved")).toBe("moss");
  });
  test("rejected/failed read madder (alert), never the data-pink rose", () => {
    expect(receiptStatusTone("rejected")).toBe("madder");
    expect(receiptStatusTone("failed")).toBe("madder");
  });
  test("cancelled/expired read muted, pending subtle, unknown falls back to subtle", () => {
    expect(receiptStatusTone("cancelled")).toBe("muted");
    expect(receiptStatusTone("expired")).toBe("muted");
    expect(receiptStatusTone("pending")).toBe("subtle");
    expect(receiptStatusTone("something-new")).toBe("subtle");
  });
});

describe("receiptStatusLabel", () => {
  test("humanizes auto_approved and de-underscores", () => {
    expect(receiptStatusLabel("auto_approved")).toBe("auto approved");
    expect(receiptStatusLabel("approved")).toBe("approved");
  });
});

describe("ledgerSummary — plain-language, real counts only", () => {
  test("empty ledger", () => {
    expect(ledgerSummary({ all: 0, standing: 0, superseded: 0 })).toBe(
      "Nothing on the record yet.",
    );
  });
  test("all standing, plural and singular", () => {
    expect(ledgerSummary({ all: 5, standing: 5, superseded: 0 })).toBe(
      "5 on the record, all still standing.",
    );
    expect(ledgerSummary({ all: 1, standing: 1, superseded: 0 })).toBe(
      "1 on the record, and it still stands.",
    );
  });
  test("some superseded, plural and singular agreement", () => {
    expect(ledgerSummary({ all: 6, standing: 4, superseded: 2 })).toBe(
      "6 on the record. 4 still stand, 2 were superseded by a later call.",
    );
    expect(ledgerSummary({ all: 2, standing: 1, superseded: 1 })).toBe(
      "2 on the record. 1 still stands, 1 was superseded by a later call.",
    );
  });
});
