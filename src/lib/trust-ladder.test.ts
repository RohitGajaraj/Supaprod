import { describe, expect, test } from "bun:test";
import {
  TRUST_LADDER_CHAIN,
  TRUST_LADDER_LABEL,
  TRUST_LADDER_ORDER,
  ladderIndex,
  ladderLabel,
} from "./trust-ladder";

describe("TRUST_LADDER_ORDER", () => {
  test("is exactly the four-rung arc ladder, floor to ceiling", () => {
    expect(TRUST_LADDER_ORDER).toEqual(["observing", "proving", "trusted", "ambient"]);
  });
});

describe("ladderLabel", () => {
  test("names every rung per the founder-specified ladder", () => {
    expect(ladderLabel("observing")).toBe("Supervised");
    expect(ladderLabel("proving")).toBe("Reviewed");
    expect(ladderLabel("trusted")).toBe("Trusted");
    expect(ladderLabel("ambient")).toBe("Autonomous");
  });

  test("every arc value has a label (no silent gaps)", () => {
    for (const arc of TRUST_LADDER_ORDER) {
      expect(TRUST_LADDER_LABEL[arc]).toBeTruthy();
    }
  });
});

describe("ladderIndex", () => {
  test("orders Supervised < Reviewed < Trusted < Autonomous", () => {
    expect(ladderIndex("observing")).toBe(0);
    expect(ladderIndex("proving")).toBe(1);
    expect(ladderIndex("trusted")).toBe(2);
    expect(ladderIndex("ambient")).toBe(3);
  });
});

describe("TRUST_LADDER_CHAIN", () => {
  test("is the named chain, in order", () => {
    expect(TRUST_LADDER_CHAIN).toBe("Supervised → Reviewed → Trusted → Autonomous");
  });
});
