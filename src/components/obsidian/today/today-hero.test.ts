import { describe, it, expect } from "bun:test";
import { computeHero } from "./Hero";

describe("computeHero — the OBS-04 hero sentence", () => {
  it("0 pending -> All clear, moss/loop-running copy", () => {
    expect(computeHero(0)).toEqual({
      heroA: "All clear.",
      heroB: " The loop is running itself.",
    });
  });

  it("1 pending -> singular 'One call' with the singular verb (SW-7 live-run fix)", () => {
    expect(computeHero(1)).toEqual({
      heroA: "One call",
      heroB: " needs your judgment today.",
    });
  });

  it("2 pending -> 'Two calls' with the plural verb", () => {
    expect(computeHero(2).heroA).toBe("Two calls");
    expect(computeHero(2).heroB).toBe(" need your judgment today.");
  });

  it("3 pending -> 'Three calls'", () => {
    expect(computeHero(3).heroA).toBe("Three calls");
  });

  it("N (4+) pending -> '{N} calls'", () => {
    expect(computeHero(4).heroA).toBe("4 calls");
    expect(computeHero(12).heroA).toBe("12 calls");
  });

  it("a negative count (defensive) reads as all-clear", () => {
    expect(computeHero(-1).heroA).toBe("All clear.");
  });
});
