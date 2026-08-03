import { describe, it, expect } from "bun:test";
import { scoreTheme, clamp01 } from "./score";

const NOW = Date.parse("2026-06-30T00:00:00.000Z");
const iso = (msAgo: number) => new Date(NOW - msAgo).toISOString();
const HOUR = 3_600_000;

describe("clamp01", () => {
  it("clamps to [0,1]", () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
    expect(clamp01(0.4)).toBe(0.4);
  });
});

describe("scoreTheme", () => {
  it("maxes at 1 for a severe, certain, fresh, novel AND well-corroborated theme", () => {
    // `frequency` added 2026-08-03. A perfect score now also requires that people
    // actually reported it, which is the point of the change: one report is no
    // longer indistinguishable from forty.
    const s = scoreTheme(
      {
        severity: 5,
        confidence: 1,
        createdAt: iso(0),
        lastSignalAt: iso(0),
        novelty: 1,
        frequency: 10,
      },
      NOW,
    );
    expect(s).toBeCloseTo(1, 6);
  });

  it("a lone report cannot outrank the same thing said by many", () => {
    // THE BUG THIS EXISTS FOR. Live on 2026-08-03, Discover's #1 was a single
    // competitor blog post while 40 homeowners reporting one support burden sat
    // at #9, because frequency was only a tie-break AFTER the score and floats
    // never tie. Same severity, same novelty, four days STALER, and it must still
    // win on the weight of evidence.
    const lone = scoreTheme(
      { severity: 3, confidence: 0.8, createdAt: iso(5 * 24 * HOUR), novelty: 1, frequency: 1 },
      NOW,
    );
    const many = scoreTheme(
      { severity: 3, confidence: 0.8, createdAt: iso(9 * 24 * HOUR), novelty: 1, frequency: 40 },
      NOW,
    );
    expect(many).toBeGreaterThan(lone);
  });

  it("still lets one catastrophic report reach the top", () => {
    // The obvious failure mode of weighting volume: burying "one customer, and it
    // is on fire". The corroboration floor is 0.45, not 0, precisely for this.
    const severeAndAlone = scoreTheme(
      { severity: 5, confidence: 1, createdAt: iso(0), novelty: 1, frequency: 1 },
      NOW,
    );
    const mildAndCommon = scoreTheme(
      { severity: 1, confidence: 1, createdAt: iso(0), novelty: 1, frequency: 40 },
      NOW,
    );
    expect(severeAndAlone).toBeGreaterThan(mildAndCommon);
  });

  it("corroboration saturates, so one noisy integration cannot own the queue", () => {
    const ten = scoreTheme(
      { severity: 3, confidence: 0.5, createdAt: iso(0), novelty: 1, frequency: 10 },
      NOW,
    );
    const thousand = scoreTheme(
      { severity: 3, confidence: 0.5, createdAt: iso(0), novelty: 1, frequency: 1000 },
      NOW,
    );
    expect(thousand).toBeCloseTo(ten, 6);
  });

  it("a missing frequency is treated as one report, not as none", () => {
    const absent = scoreTheme({ severity: 3, confidence: 0.5, createdAt: iso(0), novelty: 1 }, NOW);
    const one = scoreTheme(
      { severity: 3, confidence: 0.5, createdAt: iso(0), novelty: 1, frequency: 1 },
      NOW,
    );
    expect(absent).toBe(one);
  });

  it("is strictly positive for any valid row", () => {
    const s = scoreTheme(
      { severity: 1, confidence: 0, createdAt: iso(1000 * HOUR), novelty: 0 },
      NOW,
    );
    expect(s).toBeGreaterThan(0);
  });

  it("decays with age over WEEKS, not hours", () => {
    // Half-life moved 72h -> 336h on 2026-08-03. Seventy-two hours is an
    // incident-feed constant: it assumes what matters is what broke since
    // yesterday, and it put a 9 day old pattern at 0.05 of a 5 day old one, an
    // edge no other term could answer because recency multiplies. Discovery reads
    // repetition over weeks; a nine day old pattern is not stale, it is a pattern.
    const fresh = scoreTheme({ severity: 3, confidence: 0.5, createdAt: iso(0), novelty: 1 }, NOW);
    const old = scoreTheme(
      { severity: 3, confidence: 0.5, createdAt: iso(336 * HOUR), novelty: 1 },
      NOW,
    );
    expect(old).toBeLessThan(fresh);
    expect(old / fresh).toBeCloseTo(Math.exp(-1), 5); // recency factor at one half-life

    // And the specific comparison that was ranking wrongly: nine days must not be
    // a near-total wipeout against five.
    const d5 = scoreTheme(
      { severity: 3, confidence: 0.5, createdAt: iso(5 * 24 * HOUR), novelty: 1 },
      NOW,
    );
    const d9 = scoreTheme(
      { severity: 3, confidence: 0.5, createdAt: iso(9 * 24 * HOUR), novelty: 1 },
      NOW,
    );
    expect(d9 / d5).toBeGreaterThan(0.6);
  });

  it("null novelty is treated as fully novel (max novelty multiplier)", () => {
    const a = scoreTheme({ severity: 3, confidence: 0.5, createdAt: iso(0), novelty: null }, NOW);
    const b = scoreTheme({ severity: 3, confidence: 0.5, createdAt: iso(0), novelty: 1 }, NOW);
    expect(a).toBe(b);
  });

  it("a known (low-novelty) theme scores below an identical novel one", () => {
    const known = scoreTheme({ severity: 4, confidence: 0.8, createdAt: iso(0), novelty: 0 }, NOW);
    const novel = scoreTheme({ severity: 4, confidence: 0.8, createdAt: iso(0), novelty: 1 }, NOW);
    expect(known).toBeLessThan(novel);
  });

  it("clamps a future last_signal_at to age 0 (no super-recency boost)", () => {
    const future = scoreTheme(
      {
        severity: 3,
        confidence: 0.5,
        createdAt: iso(0),
        lastSignalAt: iso(-100 * HOUR),
        novelty: 1,
      },
      NOW,
    );
    const atNow = scoreTheme({ severity: 3, confidence: 0.5, createdAt: iso(0), novelty: 1 }, NOW);
    expect(future).toBeCloseTo(atNow, 6);
  });
});
