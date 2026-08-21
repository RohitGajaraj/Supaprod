import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BACKGROUND_RATE_LIMIT_BUDGET_MS,
  INTERACTIVE_RATE_LIMIT_BUDGET_MS,
  MAX_SINGLE_WAIT_MS,
  maxAttemptsFor,
  nextRetryDelayMs,
  parseRetryAfterMs,
  rateLimitBudgetMs,
} from "./retry-policy";

const NOW = 1_756_000_000_000;
const half = () => 0.5;

describe("parseRetryAfterMs", () => {
  it("reads delta-seconds, which is the common form", () => {
    expect(parseRetryAfterMs("120", NOW)).toBe(120_000);
    expect(parseRetryAfterMs("  7 ", NOW)).toBe(7_000);
    expect(parseRetryAfterMs("0", NOW)).toBe(0);
  });

  it("reads an HTTP-date, which is equally legal and was the easy half to miss", () => {
    const when = new Date(NOW + 30_000).toUTCString();
    // toUTCString truncates to whole seconds, so allow the rounding.
    expect(parseRetryAfterMs(when, NOW)).toBeGreaterThanOrEqual(29_000);
    expect(parseRetryAfterMs(when, NOW)).toBeLessThanOrEqual(30_000);
  });

  it("never returns a negative wait for a date already past", () => {
    expect(parseRetryAfterMs(new Date(NOW - 60_000).toUTCString(), NOW)).toBe(0);
  });

  it("returns null rather than guessing when the header is absent or junk", () => {
    for (const h of [null, undefined, "", "   ", "soon", "-5"]) {
      expect(parseRetryAfterMs(h, NOW)).toBeNull();
    }
  });
});

describe("nextRetryDelayMs", () => {
  const base = { spentMs: 0, budgetMs: INTERACTIVE_RATE_LIMIT_BUDGET_MS, maxAttempts: 3, random: half };

  it("does not retry a code that is not a rate limit or a 5xx", () => {
    expect(nextRetryDelayMs({ ...base, attempt: 0, code: "BAD_REQUEST" })).toBeNull();
  });

  it("stops once the attempts are spent", () => {
    expect(nextRetryDelayMs({ ...base, attempt: 2, code: "RATE_LIMIT" })).toBeNull();
  });

  it("leaves SERVER_ERROR on its old fast schedule, which was never the defect", () => {
    expect(nextRetryDelayMs({ ...base, attempt: 0, code: "SERVER_ERROR" })).toBe(400);
    expect(nextRetryDelayMs({ ...base, attempt: 1, code: "SERVER_ERROR" })).toBe(800);
  });

  it("believes Retry-After when the gateway sends one", () => {
    const d = nextRetryDelayMs({
      ...base, attempt: 0, code: "RATE_LIMIT", retryAfterMs: 3_000,
      budgetMs: BACKGROUND_RATE_LIMIT_BUDGET_MS,
    });
    expect(d).toBe(3_000);
  });

  it("clamps a very long Retry-After to one capped wait rather than blocking", () => {
    const d = nextRetryDelayMs({
      ...base, attempt: 0, code: "RATE_LIMIT", retryAfterMs: 600_000,
      budgetMs: BACKGROUND_RATE_LIMIT_BUDGET_MS,
    });
    expect(d).toBe(MAX_SINGLE_WAIT_MS);
  });

  it("backs off exponentially with jitter when there is no header", () => {
    // equal jitter at random()=0.5 is exactly 3/4 of the ceiling
    expect(nextRetryDelayMs({ ...base, attempt: 0, code: "RATE_LIMIT" })).toBe(750);
    expect(nextRetryDelayMs({ ...base, attempt: 1, code: "RATE_LIMIT" })).toBe(1_500);
    expect(nextRetryDelayMs({ ...base, attempt: 2, code: "RATE_LIMIT", maxAttempts: 6 })).toBe(3_000);
  });

  it("keeps jitter inside half the ceiling and never near zero", () => {
    // near-zero jitter is the failure this file exists to stop
    for (const r of [0, 0.001, 0.999, 1]) {
      const d = nextRetryDelayMs({ ...base, attempt: 1, code: "RATE_LIMIT", random: () => r })!;
      expect(d).toBeGreaterThanOrEqual(1_000);
      expect(d).toBeLessThanOrEqual(2_000);
    }
  });

  it("stops rather than half-waiting when the budget cannot cover the delay", () => {
    const d = nextRetryDelayMs({
      ...base, attempt: 0, code: "RATE_LIMIT", retryAfterMs: 10_000, budgetMs: 5_000, spentMs: 0,
    });
    expect(d).toBeNull();
  });

  it("counts what has already been spent", () => {
    const d = nextRetryDelayMs({
      ...base, attempt: 0, code: "RATE_LIMIT", retryAfterMs: 3_000,
      budgetMs: BACKGROUND_RATE_LIMIT_BUDGET_MS, spentMs: BACKGROUND_RATE_LIMIT_BUDGET_MS - 100,
    });
    expect(d).toBeNull();
  });
});

describe("the budget is a property of who is waiting", () => {
  it("gives a tick room to sit out a per-minute window", () => {
    expect(rateLimitBudgetMs("sense")).toBe(BACKGROUND_RATE_LIMIT_BUDGET_MS);
    expect(maxAttemptsFor("RATE_LIMIT", "sense")).toBe(6);
  });

  it("keeps a person's request short", () => {
    expect(rateLimitBudgetMs("chat")).toBe(INTERACTIVE_RATE_LIMIT_BUDGET_MS);
    expect(maxAttemptsFor("RATE_LIMIT", "chat")).toBe(3);
  });

  it("treats an UNKNOWN surface as interactive, so a new one fails fast by default", () => {
    expect(rateLimitBudgetMs("some_surface_added_later")).toBe(INTERACTIVE_RATE_LIMIT_BUDGET_MS);
    expect(rateLimitBudgetMs(undefined)).toBe(INTERACTIVE_RATE_LIMIT_BUDGET_MS);
  });

  it("lets an explicit caller value win outright", () => {
    expect(rateLimitBudgetMs("sense", 1_234)).toBe(1_234);
    expect(maxAttemptsFor("RATE_LIMIT", "sense", 0)).toBe(1);
  });
});

describe("THE REGRESSION THIS REPLACES", () => {
  it("waits far longer than the 1.2s window that lost 32 sense calls over 35 hours", () => {
    // Walk the policy the way the loop does, with no Retry-After and worst-case jitter.
    let spent = 0;
    let attempt = 0;
    const maxAttempts = maxAttemptsFor("RATE_LIMIT", "sense");
    for (;;) {
      const d = nextRetryDelayMs({
        attempt, code: "RATE_LIMIT", spentMs: spent,
        budgetMs: rateLimitBudgetMs("sense"), maxAttempts, random: () => 0,
      });
      if (d === null) break;
      spent += d;
      attempt++;
    }
    // old policy: 400 + 800 = 1200ms across 3 attempts, and that is the bug
    expect(spent).toBeGreaterThan(1_200 * 5);
    expect(attempt).toBe(maxAttempts - 1);
  });
});

describe("the chokepoint actually uses this policy", () => {
  // A pure policy nothing calls is the defect this repo keeps closing: correct
  // code that no path reaches. These assert the wiring, not the arithmetic.
  const src = readFileSync(join(import.meta.dir, "runtime.server.ts"), "utf8");

  it("reads the file at all, so the assertions below cannot pass vacuously", () => {
    expect(src.length).toBeGreaterThan(10_000);
    expect(src).toContain("RATE_LIMIT");
  });

  it("has no 1.2-second retry window left in either loop", () => {
    // `400 * (i + 1)` across 3 attempts is what lost 32 sense calls over 35 hours.
    expect(src).not.toContain("400 * (i + 1)");
  });

  it("routes BOTH retry loops through nextRetryDelayMs", () => {
    const calls = src.match(/nextRetryDelayMs\(\{/g) ?? [];
    expect(calls.length).toBe(2);
  });

  it("captures Retry-After at BOTH 429 throw sites", () => {
    const parsed = src.match(/parseRetryAfterMs\(/g) ?? [];
    expect(parsed.length).toBe(2);
    const carried = src.match(/retryAfterMs/g) ?? [];
    // two throw sites set it, two loops read it
    expect(carried.length).toBeGreaterThanOrEqual(4);
  });

  it("lets the budget be chosen per surface rather than per error", () => {
    const budget = src.match(/rateLimitBudgetMs\(opts\.surface/g) ?? [];
    expect(budget.length).toBe(2);
  });
});
