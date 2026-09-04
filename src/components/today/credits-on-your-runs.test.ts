import { describe, expect, it } from "bun:test";
import { creditsWord, startRows, type StartRowInput } from "./tracks-feed";

/**
 * CREDITS ON START'S RUN ROWS (P-140, A-QUEUE.md).
 *
 * P-136 settled the run screen's own currency: credits lead, never a
 * fabricated zero. Start's own run list carried no spend figure at all --
 * a net-new addition, not a reformat -- so this pins the same two rules one
 * level up: the account's own currency, and absence stays absence.
 */

const WORDS = { prd: { one: "spec", many: "specs" } } as const;
const phrase = (): string | null => null;
const NOW = Date.parse("2026-09-04T12:00:00Z");

const run = (over: Partial<StartRowInput> = {}): StartRowInput => ({
  id: "t-1",
  title: "Make checkout accept an Amex card",
  status: "open",
  stationName: "Build",
  updatedAt: "2026-09-04T11:00:00Z",
  drivenAt: "2026-09-04T11:00:00Z",
  holdReason: null,
  holdBecause: null,
  working: null,
  needsYou: null,
  produced: [],
  ...over,
});

describe("creditsWord", () => {
  it("states the count and the plural, comma-grouped like every other credits figure", () => {
    expect(creditsWord(1234)).toBe("1,234 credits");
  });

  it("says just the count for a single credit, never a plural of one", () => {
    expect(creditsWord(1)).toBe("1 credit");
  });

  it("still states a real zero when the caller genuinely means one", () => {
    // creditsWord itself never invents absence -- that rule lives in
    // startRows, which is what the next describe block pins.
    expect(creditsWord(0)).toBe("0 credits");
  });
});

describe("startRows draws credits as its own line, absent rather than a fabricated zero", () => {
  it("carries a real figure through", () => {
    const [row] = startRows([run({ credits: 40 })], NOW, WORDS, phrase);
    expect(row.creditsLine).toBe("40 credits");
  });

  it("says nothing when nothing has been debited, not '0 credits'", () => {
    const [row] = startRows([run({ credits: 0 })], NOW, WORDS, phrase);
    expect(row.creditsLine).toBeNull();
  });

  it("says nothing when credits were never read at all", () => {
    const [row] = startRows([run({ credits: null })], NOW, WORDS, phrase);
    expect(row.creditsLine).toBeNull();

    const [row2] = startRows([run()], NOW, WORDS, phrase);
    expect(row2.creditsLine).toBeNull();
  });

  it("does not touch the middle column -- credits is its own fact, not folded into what the run is doing", () => {
    const [row] = startRows(
      [run({ credits: 40, working: { seat: "Draft", since: NOW.toString(), tool: null } })],
      NOW,
      WORDS,
      phrase,
    );
    expect(row.middle).not.toContain("credit");
  });
});
