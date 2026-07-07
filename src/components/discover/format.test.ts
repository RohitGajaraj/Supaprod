import { describe, expect, test } from "bun:test";
import { latestIso, relTimeCaps, sourceCaps, verdictFor, traceRef, withTimeout } from "./format";

describe("relTimeCaps", () => {
  const now = Date.now();

  test("buckets under an hour as minutes", () => {
    const iso = new Date(now - 12 * 60_000).toISOString();
    expect(relTimeCaps(iso)).toBe("12M AGO");
  });

  test("floors sub-minute deltas to 1M AGO, never 0M", () => {
    const iso = new Date(now - 5_000).toISOString();
    expect(relTimeCaps(iso)).toBe("1M AGO");
  });

  test("buckets under a day as hours", () => {
    const iso = new Date(now - 3 * 60 * 60_000).toISOString();
    expect(relTimeCaps(iso)).toBe("3H AGO");
  });

  test("buckets a day or more as days", () => {
    const iso = new Date(now - 2 * 24 * 60 * 60_000).toISOString();
    expect(relTimeCaps(iso)).toBe("2D AGO");
  });

  test("returns empty string for a malformed timestamp", () => {
    expect(relTimeCaps("not-a-date")).toBe("");
  });
});

describe("sourceCaps", () => {
  test("upcases a lowercase source", () => {
    expect(sourceCaps("intercom")).toBe("INTERCOM");
  });
});

describe("latestIso", () => {
  test("returns the most-recent timestamp", () => {
    const older = new Date(Date.now() - 3 * 24 * 60 * 60_000).toISOString();
    const newer = new Date(Date.now() - 1 * 60 * 60_000).toISOString();
    expect(latestIso([older, newer])).toBe(newer);
    expect(latestIso([newer, older])).toBe(newer);
  });

  test("skips null, undefined, blank, and malformed entries", () => {
    const iso = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(latestIso([null, undefined, "", "not-a-date", iso])).toBe(iso);
  });

  test("returns null when nothing is valid", () => {
    expect(latestIso([])).toBeNull();
    expect(latestIso([null, undefined, "", "nope"])).toBeNull();
  });
});

describe("verdictFor", () => {
  test("critic ship wins regardless of status", () => {
    expect(verdictFor({ status: "backlog", critic_review: { verdict: "ship" } as never })).toBe(
      "SHIP",
    );
  });

  test("critic revise wins regardless of status", () => {
    expect(verdictFor({ status: "now", critic_review: { verdict: "revise" } as never })).toBe(
      "REVISE",
    );
  });

  test("critic kill wins regardless of status", () => {
    expect(verdictFor({ status: "next", critic_review: { verdict: "kill" } as never })).toBe(
      "KILL",
    );
  });

  test("falls back to status when no critic review: shipped/now -> SHIP", () => {
    expect(verdictFor({ status: "shipped", critic_review: null })).toBe("SHIP");
    expect(verdictFor({ status: "now", critic_review: null })).toBe("SHIP");
  });

  test("falls back to status when no critic review: dropped -> KILL", () => {
    expect(verdictFor({ status: "dropped", critic_review: null })).toBe("KILL");
  });

  test("falls back to status when no critic review: next/later -> WATCH", () => {
    expect(verdictFor({ status: "next", critic_review: undefined })).toBe("WATCH");
    expect(verdictFor({ status: "later", critic_review: undefined })).toBe("WATCH");
  });

  test("falls back to PENDING for backlog with no critic review", () => {
    expect(verdictFor({ status: "backlog", critic_review: null })).toBe("PENDING");
  });
});

describe("traceRef", () => {
  test("takes the first 6 alphanumerics of a uuid, uppercased", () => {
    expect(traceRef("a1b2c3d4-0000-0000-0000-000000000000")).toBe("A1B2C3");
  });

  test("returns a shorter string unchanged in case, just uppercased, when the id has fewer than 6 alphanumerics", () => {
    expect(traceRef("a-1")).toBe("A1");
  });

  test("returns an empty string when the id has no alphanumeric characters", () => {
    expect(traceRef("---")).toBe("");
  });
});

describe("withTimeout", () => {
  test("resolves with the underlying promise's value when it settles before the deadline", async () => {
    await expect(withTimeout(Promise.resolve("ok"), 50)).resolves.toBe("ok");
  });

  test("propagates the underlying promise's own rejection unchanged", async () => {
    await expect(withTimeout(Promise.reject(new Error("boom")), 50)).rejects.toThrow("boom");
  });

  test("rejects with a clear retry message when the promise never settles before the deadline", async () => {
    const neverSettles = new Promise<string>(() => {});
    await expect(withTimeout(neverSettles, 10)).rejects.toThrow(
      "The server took too long to answer. Retry in a moment.",
    );
  });
});
