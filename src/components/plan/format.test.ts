import { describe, expect, test } from "bun:test";
import { stateChip, citesLabel, measureCaps, splitCitationMarkers } from "./format";

describe("stateChip", () => {
  test("approved -> APPROVED moss", () => {
    expect(stateChip("approved")).toEqual({ label: "APPROVED", tone: "moss" });
  });
  test("shipped -> SHIPPED moss", () => {
    expect(stateChip("shipped")).toEqual({ label: "SHIPPED", tone: "moss" });
  });
  test("review -> CRITIC REVIEW marigold", () => {
    expect(stateChip("review")).toEqual({ label: "CRITIC REVIEW", tone: "marigold" });
  });
  test("draft -> DRAFTING glacier", () => {
    expect(stateChip("draft")).toEqual({ label: "DRAFTING", tone: "glacier" });
  });
  test("unrecognized status fails safe to DRAFTING glacier", () => {
    expect(stateChip("")).toEqual({ label: "DRAFTING", tone: "glacier" });
    expect(stateChip("unknown")).toEqual({ label: "DRAFTING", tone: "glacier" });
  });
});

describe("citesLabel", () => {
  test("zero citations -> null", () => {
    expect(citesLabel([])).toBeNull();
    expect(citesLabel(null)).toBeNull();
    expect(citesLabel(undefined)).toBeNull();
    expect(citesLabel("not an array")).toBeNull();
  });
  test("singular", () => {
    expect(citesLabel([{ n: 1 }])).toBe("1 SOURCE");
  });
  test("plural", () => {
    expect(citesLabel([{ n: 1 }, { n: 2 }, { n: 3 }])).toBe("3 SOURCES");
  });
});

describe("measureCaps", () => {
  test("upcases verbatim", () => {
    expect(measureCaps("drop-off -20% by Aug 1")).toBe("DROP-OFF -20% BY AUG 1");
  });
  test("null/empty -> null", () => {
    expect(measureCaps(null)).toBeNull();
    expect(measureCaps("")).toBeNull();
    expect(measureCaps("   ")).toBeNull();
  });
});

describe("splitCitationMarkers", () => {
  test("no markers returns the whole string as one text segment", () => {
    expect(splitCitationMarkers("plain text")).toEqual([{ type: "text", value: "plain text" }]);
  });
  test("single marker mid-string", () => {
    expect(splitCitationMarkers("evidence[1] supports this")).toEqual([
      { type: "text", value: "evidence" },
      { type: "citation", index: 1 },
      { type: "text", value: " supports this" },
    ]);
  });
  test("marker at the very start and end", () => {
    expect(splitCitationMarkers("[2]start end[3]")).toEqual([
      { type: "citation", index: 2 },
      { type: "text", value: "start end" },
      { type: "citation", index: 3 },
    ]);
  });
  test("multiple adjacent markers", () => {
    expect(splitCitationMarkers("claim[1][2]")).toEqual([
      { type: "text", value: "claim" },
      { type: "citation", index: 1 },
      { type: "citation", index: 2 },
    ]);
  });
  test("empty string", () => {
    expect(splitCitationMarkers("")).toEqual([]);
  });
});
