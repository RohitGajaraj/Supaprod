import { describe, it, expect } from "bun:test";
import { decideTone, buildTone } from "./LoopStrip";

describe("decideTone — DECIDE pill tone (README law 2: ember only for the one attention queue)", () => {
  it("is quiet when no calls pend", () => {
    expect(decideTone(0)).toBe("quiet");
  });

  it("is ember as soon as any call pends", () => {
    expect(decideTone(1)).toBe("ember");
    expect(decideTone(5)).toBe("ember");
  });
});

describe("buildTone: BUILD pill tone (color doctrine 2026-07-11, blue is a literal live-status hue)", () => {
  it("is quiet when nothing is building", () => {
    expect(buildTone(0)).toBe("quiet");
  });

  it("is glacier only while missions actually run", () => {
    expect(buildTone(1)).toBe("glacier");
    expect(buildTone(3)).toBe("glacier");
  });
});
