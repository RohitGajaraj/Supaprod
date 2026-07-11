import { describe, expect, test } from "bun:test";
import { deriveAuditReport } from "./contradiction-auditor.server";

describe("deriveAuditReport (RPT-25)", () => {
  test("valid contradictions pass through in order", () => {
    const out = deriveAuditReport(
      {
        contradictions: [
          { index: 0, rationale: "Reverses the earlier pricing call." },
          { index: 2, rationale: "Contradicts the prior scope cut." },
        ],
      },
      4,
    );
    expect(out).toEqual([
      { index: 0, rationale: "Reverses the earlier pricing call." },
      { index: 2, rationale: "Contradicts the prior scope cut." },
    ]);
  });

  test("an out-of-range index is dropped", () => {
    const out = deriveAuditReport({ contradictions: [{ index: 5, rationale: "x" }] }, 3);
    expect(out).toEqual([]);
  });

  test("a negative index is dropped", () => {
    const out = deriveAuditReport({ contradictions: [{ index: -1, rationale: "x" }] }, 3);
    expect(out).toEqual([]);
  });

  test("a non-integer index is dropped", () => {
    const out = deriveAuditReport({ contradictions: [{ index: 1.5, rationale: "x" }] }, 3);
    expect(out).toEqual([]);
  });

  test("a duplicate index is kept only once", () => {
    const out = deriveAuditReport(
      {
        contradictions: [
          { index: 1, rationale: "first" },
          { index: 1, rationale: "again" },
        ],
      },
      3,
    );
    expect(out).toEqual([{ index: 1, rationale: "first" }]);
  });

  test("a missing contradictions field yields an empty list", () => {
    expect(deriveAuditReport({}, 3)).toEqual([]);
  });

  test("a non-array contradictions field yields an empty list", () => {
    expect(deriveAuditReport({ contradictions: "nope" as unknown }, 3)).toEqual([]);
  });

  test("a missing rationale defaults to an empty string", () => {
    const out = deriveAuditReport({ contradictions: [{ index: 0 }] }, 2);
    expect(out).toEqual([{ index: 0, rationale: "" }]);
  });

  test("rationale is trimmed and capped at 500 chars", () => {
    const long = "x".repeat(600);
    const out = deriveAuditReport({ contradictions: [{ index: 0, rationale: `  ${long}  ` }] }, 2);
    expect(out[0].rationale.length).toBe(500);
  });

  test("a corpus of zero rejects every index", () => {
    const out = deriveAuditReport({ contradictions: [{ index: 0, rationale: "x" }] }, 0);
    expect(out).toEqual([]);
  });
});
