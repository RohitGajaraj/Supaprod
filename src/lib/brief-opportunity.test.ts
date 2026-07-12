import { describe, expect, test } from "bun:test";
import { alignmentForOpportunity, type BriefAlignmentMap } from "@/lib/brief-opportunity";

const MAP: BriefAlignmentMap = {
  "bet-standing": { challenged: false },
  "bet-challenged": { challenged: true },
};

describe("alignmentForOpportunity", () => {
  test("neutral when the opportunity is not linked", () => {
    expect(alignmentForOpportunity(null, MAP)).toBe(0);
    expect(alignmentForOpportunity(undefined, MAP)).toBe(0);
  });

  test("lifts an opportunity on a standing bet whose assumptions hold", () => {
    expect(alignmentForOpportunity("bet-standing", MAP)).toBe(1);
  });

  test("sinks an opportunity on a bet with a challenged assumption", () => {
    expect(alignmentForOpportunity("bet-challenged", MAP)).toBe(-1);
  });

  test("neutral when linked to a bet that is gone or superseded (absent from map)", () => {
    expect(alignmentForOpportunity("bet-retired", MAP)).toBe(0);
  });

  test("neutral against an empty map", () => {
    expect(alignmentForOpportunity("anything", {})).toBe(0);
  });
});
