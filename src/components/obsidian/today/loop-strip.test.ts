import { describe, it, expect } from "bun:test";
import { decideTone } from "./LoopStrip";

describe("decideTone — DECIDE pill tone (README law 2: ember only for the one attention queue)", () => {
  it("is quiet when no calls pend", () => {
    expect(decideTone(0)).toBe("quiet");
  });

  it("is ember as soon as any call pends", () => {
    expect(decideTone(1)).toBe("ember");
    expect(decideTone(5)).toBe("ember");
  });
});
