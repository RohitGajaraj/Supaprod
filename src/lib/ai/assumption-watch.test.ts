import { describe, expect, test } from "bun:test";
import { deriveWatchVerdict } from "./assumption-watch.server";

describe("deriveWatchVerdict (FS-02)", () => {
  test("a clean contradiction with a valid index passes through", () => {
    const v = deriveWatchVerdict({ contradicted: true, evidence_index: 1, rationale: "Usage dropped." }, 3);
    expect(v.contradicted).toBe(true);
    expect(v.evidenceIndex).toBe(1);
    expect(v.rationale).toBe("Usage dropped.");
  });

  test("contradicted=true with no index is never trusted", () => {
    const v = deriveWatchVerdict({ contradicted: true, evidence_index: null }, 3);
    expect(v.contradicted).toBe(false);
    expect(v.evidenceIndex).toBeNull();
  });

  test("an out-of-range index is rejected", () => {
    const v = deriveWatchVerdict({ contradicted: true, evidence_index: 5 }, 3);
    expect(v.contradicted).toBe(false);
    expect(v.evidenceIndex).toBeNull();
  });

  test("a negative index is rejected", () => {
    const v = deriveWatchVerdict({ contradicted: true, evidence_index: -1 }, 3);
    expect(v.evidenceIndex).toBeNull();
  });

  test("a non-integer index is rejected", () => {
    const v = deriveWatchVerdict({ contradicted: true, evidence_index: 1.5 }, 3);
    expect(v.evidenceIndex).toBeNull();
  });

  test("contradicted=false ignores a present index", () => {
    const v = deriveWatchVerdict({ contradicted: false, evidence_index: 0 }, 3);
    expect(v.contradicted).toBe(false);
  });

  test("missing fields default to a safe, non-contradicting verdict", () => {
    const v = deriveWatchVerdict({}, 3);
    expect(v).toEqual({ contradicted: false, evidenceIndex: null, rationale: "" });
  });

  test("rationale is trimmed and capped at 500 chars", () => {
    const long = "x".repeat(600);
    const v = deriveWatchVerdict({ rationale: `  ${long}  ` }, 3);
    expect(v.rationale.length).toBe(500);
  });
});
