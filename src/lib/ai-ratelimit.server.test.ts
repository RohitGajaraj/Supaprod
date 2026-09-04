import { describe, it, expect } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  decideUserAiRateLimit,
  checkUserAiRateLimit,
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

/**
 * P-76 (F-192). The pure decision above was already right; what was
 * never exercised is `checkUserAiRateLimit` itself, the DB-touching half
 * that reads a table which did not exist -- so it always hit the `catch`
 * below and fails open, and that path had no test of its own to catch it.
 * Mirrors `ingest-ratelimit.test.ts`'s own mock shape (`from().select()...`,
 * `.upsert()`, `.update()`), matched to this reader's own chain
 * (`.select().eq().maybeSingle()`).
 */
describe("checkUserAiRateLimit (SW-6, the DB half)", () => {
  function mockDb(row: unknown, readError?: { message: string }): SupabaseClient {
    return {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: readError ? null : row, error: readError ?? null }),
          }),
        }),
        upsert: () => Promise.resolve({ error: null }),
        update: () => ({ eq: async () => ({ error: null }) }),
      }),
    } as unknown as SupabaseClient;
  }

  it("blocks once a user is at the cap within an active window", async () => {
    const row = {
      id: "r1",
      request_count: AI_LIMIT_PER_WINDOW,
      window_start: new Date(Date.now() - 60_000).toISOString(),
    };
    const db = mockDb(row);
    const res = await checkUserAiRateLimit(db, "user-1");
    expect(res.allowed).toBe(false);
    if (!res.allowed) expect(res.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("still fails OPEN on a read error, per this file's own stated rule", async () => {
    // Availability was the deliberate choice (this file's own header): budget
    // caps remain the hard gate, so a limiter-table outage must not brick chat.
    const db = mockDb(null, { message: "connection reset" });
    const res = await checkUserAiRateLimit(db, "user-1");
    expect(res).toEqual({ allowed: true });
  });

  it("allows a user under the cap", async () => {
    const row = {
      id: "r1",
      request_count: 5,
      window_start: new Date(Date.now() - 60_000).toISOString(),
    };
    const db = mockDb(row);
    const res = await checkUserAiRateLimit(db, "user-1");
    expect(res).toEqual({ allowed: true });
  });
});
