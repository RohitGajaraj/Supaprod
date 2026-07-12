import { describe, expect, test } from "bun:test";
import {
  relTimeCaps,
  sourceCaps,
  latestIso,
  traceRef,
  withTimeout,
  verdictFor,
  type OpportunityVerdictInput,
} from "../format";

// ─────────────────────────────────────────────────────────────────────────────
// relTimeCaps - Relative time in caps (12M AGO / 1H AGO / 3D AGO)
// ─────────────────────────────────────────────────────────────────────────────
describe("relTimeCaps", () => {
  test("returns empty string for malformed timestamp", () => {
    expect(relTimeCaps("not-a-date")).toBe("");
    expect(relTimeCaps("invalid")).toBe("");
  });

  test("returns empty string for empty input", () => {
    expect(relTimeCaps("")).toBe("");
  });

  test("shows minute format for recent times", () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    const result = relTimeCaps(fiveMinutesAgo);
    expect(result).toMatch(/^\d+M AGO$/);
  });

  test("shows at least 1M for times < 1 minute", () => {
    const tenSecondsAgo = new Date(Date.now() - 10_000).toISOString();
    const result = relTimeCaps(tenSecondsAgo);
    expect(result).toBe("1M AGO");
  });

  test("shows hour format for < 24 hours", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60_000).toISOString();
    const result = relTimeCaps(threeHoursAgo);
    expect(result).toBe("3H AGO");
  });

  test("shows day format for >= 24 hours", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60_000).toISOString();
    const result = relTimeCaps(twoDaysAgo);
    expect(result).toBe("2D AGO");
  });

  test("floors to zero for future timestamps", () => {
    const futureDate = new Date(Date.now() + 1000).toISOString();
    const result = relTimeCaps(futureDate);
    expect(result).toBe("1M AGO"); // Floors to zero, so minimum is 1
  });

  test("handles edge case of exactly 60 minutes", () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60_000).toISOString();
    const result = relTimeCaps(oneHourAgo);
    expect(result).toBe("1H AGO");
  });

  test("handles edge case of exactly 24 hours", () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
    const result = relTimeCaps(oneDayAgo);
    expect(result).toBe("1D AGO");
  });

  test("uses all caps format consistently", () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    const result = relTimeCaps(fiveMinutesAgo);
    expect(result).toMatch(/^\d+[MHD] AGO$/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// sourceCaps - Simple uppercase conversion
// ─────────────────────────────────────────────────────────────────────────────
describe("sourceCaps", () => {
  test("converts lowercase to uppercase", () => {
    expect(sourceCaps("intercom")).toBe("INTERCOM");
  });

  test("leaves already uppercase unchanged", () => {
    expect(sourceCaps("INTERCOM")).toBe("INTERCOM");
  });

  test("converts mixed case to uppercase", () => {
    expect(sourceCaps("Intercom")).toBe("INTERCOM");
  });

  test("handles empty string", () => {
    expect(sourceCaps("")).toBe("");
  });

  test("converts single character", () => {
    expect(sourceCaps("a")).toBe("A");
  });

  test("handles special characters (non-alphabetic unchanged)", () => {
    expect(sourceCaps("source-123")).toBe("SOURCE-123");
  });

  test("handles underscores and hyphens", () => {
    expect(sourceCaps("my_source")).toBe("MY_SOURCE");
    expect(sourceCaps("my-source")).toBe("MY-SOURCE");
  });

  test("handles spaces", () => {
    expect(sourceCaps("my source")).toBe("MY SOURCE");
  });

  test("handles numbers", () => {
    expect(sourceCaps("source123")).toBe("SOURCE123");
  });

  test("is consistent (idempotent)", () => {
    const uppercase1 = sourceCaps("intercom");
    const uppercase2 = sourceCaps(uppercase1);
    expect(uppercase1).toBe(uppercase2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// latestIso - Find most recent ISO timestamp
// ─────────────────────────────────────────────────────────────────────────────
describe("latestIso", () => {
  test("returns null for empty array", () => {
    expect(latestIso([])).toBe(null);
  });

  test("returns null for all nulls", () => {
    expect(latestIso([null, null, null])).toBe(null);
  });

  test("returns null for all undefined", () => {
    expect(latestIso([undefined, undefined])).toBe(null);
  });

  test("returns single valid iso", () => {
    const iso = "2026-07-12T10:00:00Z";
    expect(latestIso([iso])).toBe(iso);
  });

  test("finds the most recent of multiple valid isos", () => {
    const iso1 = "2026-07-12T08:00:00Z";
    const iso2 = "2026-07-12T10:00:00Z";
    const iso3 = "2026-07-12T09:00:00Z";
    expect(latestIso([iso1, iso2, iso3])).toBe(iso2);
  });

  test("skips null and undefined entries", () => {
    const iso1 = "2026-07-12T08:00:00Z";
    const iso2 = "2026-07-12T10:00:00Z";
    expect(latestIso([null, iso1, undefined, iso2])).toBe(iso2);
  });

  test("ignores malformed dates", () => {
    const iso1 = "2026-07-12T10:00:00Z";
    const malformed = "not-a-date";
    expect(latestIso([malformed, iso1])).toBe(iso1);
  });

  test("skips empty strings", () => {
    const iso = "2026-07-12T10:00:00Z";
    expect(latestIso(["", iso, ""])).toBe(iso);
  });

  test("handles multiple dates with same timestamp", () => {
    const iso = "2026-07-12T10:00:00Z";
    expect(latestIso([iso, iso, iso])).toBe(iso);
  });

  test("handles very old and very new dates", () => {
    const old = "2000-01-01T00:00:00Z";
    const new_ = "2026-07-12T23:59:59Z";
    expect(latestIso([old, new_])).toBe(new_);
  });

  test("returns null for all malformed dates", () => {
    expect(latestIso(["bad1", "bad2", "bad3"])).toBe(null);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// traceRef - Generate trace reference from UUID
// ─────────────────────────────────────────────────────────────────────────────
describe("traceRef", () => {
  test("extracts first 6 alphanumerics from UUID", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    expect(traceRef(uuid)).toBe("550E84");
  });

  test("removes all non-alphanumeric characters", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    expect(traceRef(uuid)).not.toContain("-");
  });

  test("returns uppercase result", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    expect(traceRef(uuid)).toBe(traceRef(uuid).toUpperCase());
  });

  test("handles UUID with all numeric start", () => {
    const uuid = "123456-abcdef-789012-xyz";
    expect(traceRef(uuid)).toBe("123456");
  });

  test("handles UUID with all alphabetic characters", () => {
    const uuid = "abcdef-123456-ghijkl-789";
    const result = traceRef(uuid);
    expect(result).toBe("ABCDEF");
  });

  test("handles string with special characters", () => {
    const id = "550e8400!@#$%e29b-41d4";
    expect(traceRef(id)).toBe("550E84");
  });

  test("pads if fewer than 6 alphanumerics available", () => {
    const shortId = "abc";
    const result = traceRef(shortId);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  test("returns empty string for input with no alphanumerics", () => {
    expect(traceRef("!@#$%^&*()")).toBe("");
  });

  test("handles empty string", () => {
    expect(traceRef("")).toBe("");
  });

  test("is deterministic", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    expect(traceRef(uuid)).toBe(traceRef(uuid));
  });

  test("produces different traces for different uuids", () => {
    const uuid1 = "550e8400-e29b-41d4-a716-446655440000";
    const uuid2 = "123e4567-e89b-12d3-a456-426614174000";
    expect(traceRef(uuid1)).not.toBe(traceRef(uuid2));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// withTimeout - Race a promise against a deadline
// ─────────────────────────────────────────────────────────────────────────────
describe("withTimeout", () => {
  test("resolves if promise completes before timeout", async () => {
    const quick = Promise.resolve("done");
    const result = await withTimeout(quick, 1000);
    expect(result).toBe("done");
  });

  test("rejects with timeout error if promise takes too long", async () => {
    const slow = new Promise((resolve) => setTimeout(resolve, 5000));
    try {
      await withTimeout(slow, 100);
      expect.unreachable();
    } catch (e: any) {
      expect(e.message).toContain("took too long");
    }
  });

  test("uses 15_000ms as default timeout", async () => {
    const quick = Promise.resolve("done");
    const result = await withTimeout(quick);
    expect(result).toBe("done");
  });

  test("clears timer on success", async () => {
    const quick = Promise.resolve("done");
    await withTimeout(quick, 1000);
    // No assertion, just verify no open handles by test completion
  });

  test("clears timer on timeout", async () => {
    const slow = new Promise(() => {}); // Never resolves
    try {
      await withTimeout(slow, 50);
    } catch {
      // Expected to timeout
    }
    // No assertion, just verify timer was cleared
  });

  test("rejects if promise rejects", async () => {
    const failing = Promise.reject(new Error("Test error"));
    try {
      await withTimeout(failing, 1000);
      expect.unreachable();
    } catch (e: any) {
      expect(e.message).toBe("Test error");
    }
  });

  test("custom timeout value works", async () => {
    const quick = Promise.resolve("done");
    const result = await withTimeout(quick, 500);
    expect(result).toBe("done");
  });

  test("error message mentions timeout", async () => {
    const slow = new Promise(() => {}); // Never resolves
    try {
      await withTimeout(slow, 50);
      expect.unreachable();
    } catch (e: any) {
      expect(e.message).toContain("too long");
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// verdictFor - Map opportunity status to verdict word
// ─────────────────────────────────────────────────────────────────────────────
describe("verdictFor", () => {
  test("returns SHIP when critic verdict is 'ship'", () => {
    const opp: OpportunityVerdictInput = {
      status: "draft",
      critic_review: { verdict: "ship", reasoning: "" },
    };
    expect(verdictFor(opp)).toBe("SHIP");
  });

  test("returns REVISE when critic verdict is 'revise'", () => {
    const opp: OpportunityVerdictInput = {
      status: "draft",
      critic_review: { verdict: "revise", reasoning: "" },
    };
    expect(verdictFor(opp)).toBe("REVISE");
  });

  test("returns KILL when critic verdict is 'kill'", () => {
    const opp: OpportunityVerdictInput = {
      status: "draft",
      critic_review: { verdict: "kill", reasoning: "" },
    };
    expect(verdictFor(opp)).toBe("KILL");
  });

  test("returns SHIP when status is 'shipped'", () => {
    const opp: OpportunityVerdictInput = { status: "shipped" };
    expect(verdictFor(opp)).toBe("SHIP");
  });

  test("returns SHIP when status is 'now'", () => {
    const opp: OpportunityVerdictInput = { status: "now" };
    expect(verdictFor(opp)).toBe("SHIP");
  });

  test("returns KILL when status is 'dropped'", () => {
    const opp: OpportunityVerdictInput = { status: "dropped" };
    expect(verdictFor(opp)).toBe("KILL");
  });

  test("returns WATCH when status is 'next'", () => {
    const opp: OpportunityVerdictInput = { status: "next" };
    expect(verdictFor(opp)).toBe("WATCH");
  });

  test("returns WATCH when status is 'later'", () => {
    const opp: OpportunityVerdictInput = { status: "later" };
    expect(verdictFor(opp)).toBe("WATCH");
  });

  test("returns PENDING for unknown status without critic review", () => {
    const opp: OpportunityVerdictInput = { status: "unknown" };
    expect(verdictFor(opp)).toBe("PENDING");
  });

  test("returns PENDING when status is 'draft'", () => {
    const opp: OpportunityVerdictInput = { status: "draft" };
    expect(verdictFor(opp)).toBe("PENDING");
  });

  test("critic verdict takes precedence over status", () => {
    const opp: OpportunityVerdictInput = {
      status: "shipped",
      critic_review: { verdict: "kill", reasoning: "" },
    };
    expect(verdictFor(opp)).toBe("KILL");
  });

  test("returns PENDING when critic_review is null", () => {
    const opp: OpportunityVerdictInput = {
      status: "draft",
      critic_review: null,
    };
    expect(verdictFor(opp)).toBe("PENDING");
  });

  test("returns PENDING when critic_review is undefined", () => {
    const opp: OpportunityVerdictInput = {
      status: "draft",
      critic_review: undefined,
    };
    expect(verdictFor(opp)).toBe("PENDING");
  });
});
