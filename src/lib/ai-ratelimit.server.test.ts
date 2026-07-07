import { describe, it, expect } from "bun:test";
import {
  decideUserAiRateLimit,
  AI_LIMIT_PER_WINDOW,
  AI_WINDOW_DURATION_MS,
} from "./ai-ratelimit.server";

const NOW = Date.parse("2026-07-07T12:00:00.000Z");

describe("decideUserAiRateLimit (SW-6 per-user AI burst limiter)", () => {
  it("starts a fresh window for a user with no row", () => {
    expect(decideUserAiRateLimit(null, NOW)).toEqual({ kind: "reset" });
  });

  it("increments inside an active window under the cap", () => {
    const row = {
      id: "r1",
      request_count: 10,
      window_start: new Date(NOW - 60_000).toISOString(),
    };
    expect(decideUserAiRateLimit(row, NOW)).toEqual({
      kind: "increment",
      id: "r1",
      nextCount: 11,
    });
  });

  it("blocks at the cap with a retry-after pointing at the window end", () => {
    const row = {
      id: "r1",
      request_count: AI_LIMIT_PER_WINDOW,
      window_start: new Date(NOW - 60_000).toISOString(),
    };
    const d = decideUserAiRateLimit(row, NOW);
    expect(d.kind).toBe("block");
    if (d.kind === "block") {
      expect(d.retryAfterSeconds).toBeGreaterThan(0);
      expect(d.retryAfterSeconds).toBeLessThanOrEqual(AI_WINDOW_DURATION_MS / 1000);
    }
  });

  it("resets once the window has fully elapsed, even at the cap", () => {
    const row = {
      id: "r1",
      request_count: AI_LIMIT_PER_WINDOW,
      window_start: new Date(NOW - AI_WINDOW_DURATION_MS).toISOString(),
    };
    expect(decideUserAiRateLimit(row, NOW)).toEqual({ kind: "reset" });
  });
});
