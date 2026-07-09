import { describe, expect, test } from "bun:test";
import {
  latestIso,
  relTimeCaps,
  sourceCaps,
  verdictFor,
  traceRef,
  withTimeout,
  signalPreview,
  signalCleanBody,
  signalHasRaw,
} from "./format";

describe("relTimeCaps", () => {
  const now = Date.now();
  const MINUTE_MS = 60_000;
  const HOUR_MS = 60 * MINUTE_MS;
  const DAY_MS = 24 * HOUR_MS;

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

  test("boundary: just before 1 hour transitions from minutes to hours", () => {
    const iso = new Date(now - (HOUR_MS - 1_000)).toISOString();
    expect(relTimeCaps(iso)).toBe("59M AGO");
  });

  test("boundary: exactly 1 hour transitions to hours", () => {
    const iso = new Date(now - HOUR_MS).toISOString();
    expect(relTimeCaps(iso)).toBe("1H AGO");
  });

  test("boundary: just before 1 day stays in hours", () => {
    const iso = new Date(now - (DAY_MS - 1_000)).toISOString();
    expect(relTimeCaps(iso)).toBe("23H AGO");
  });

  test("boundary: exactly 1 day transitions to days", () => {
    const iso = new Date(now - DAY_MS).toISOString();
    expect(relTimeCaps(iso)).toBe("1D AGO");
  });

  test("handles future timestamps by flooring to 1M AGO (never negative)", () => {
    const futureIso = new Date(now + 60_000).toISOString();
    expect(relTimeCaps(futureIso)).toBe("1M AGO");
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

describe("signalPreview", () => {
  test("returns plain text as-is when short", () => {
    expect(signalPreview("A simple message")).toBe("A simple message");
  });

  test("collapses whitespace and removes line breaks", () => {
    expect(signalPreview("Line one\nLine two")).toBe("Line one Line two");
  });

  test("strips markdown image syntax", () => {
    expect(signalPreview("Check this ![alt](https://example.com/image.png)")).toBe("Check this");
  });

  test("strips markdown links but keeps the text", () => {
    expect(signalPreview("Read [this article](https://example.com)")).toBe("Read this article");
  });

  test("strips bare URLs", () => {
    expect(signalPreview("See https://example.com for details")).toBe("See for details");
  });

  test("extracts readable gist from JSON object", () => {
    const json = JSON.stringify({ title: "Issue", description: "A problem occurred" });
    expect(signalPreview(json)).toBe("Issue: A problem occurred");
  });

  test("truncates on word boundary when exceeding max length", () => {
    const longText = "This is a very long signal that should be truncated at a word boundary";
    const preview = signalPreview(longText, 30);
    expect(preview.length).toBeLessThanOrEqual(32); // 30 chars + ellipsis allowance
    expect(preview).toContain("…");
  });

  test("handles pure JSON array by summarizing items", () => {
    const json = JSON.stringify(["Item one", "Item two", "Item three"]);
    expect(signalPreview(json)).toContain("Item");
  });

  test("extracts gist from nested JSON without title/body keys (recursion fallback)", () => {
    // Nested object without the standard keys should fall back to finding readable nested values
    const json = JSON.stringify({ custom: { title: "Nested Title", description: "Nested desc" } });
    const result = signalPreview(json);
    expect(result).toContain("Nested");
  });

  test("strips fenced code blocks from markdown", () => {
    const text = "Check this:\n```\ncode here\n```\nMore text";
    expect(signalPreview(text)).not.toContain("```");
  });

  test("strips inline code but preserves text", () => {
    expect(signalPreview("Use `const x = 5` in your code")).toContain("const x = 5");
    expect(signalPreview("Use `const x = 5` in your code")).not.toContain("`");
  });

  test("strips markdown heading markers", () => {
    expect(signalPreview("# Main Title")).toBe("Main Title");
    expect(signalPreview("## Subtitle here")).toBe("Subtitle here");
  });

  test("strips blockquote markers", () => {
    expect(signalPreview("> This is quoted")).not.toContain(">");
  });

  test("strips list bullets", () => {
    const list = "- Item one\n- Item two";
    expect(signalPreview(list)).not.toContain("-");
    expect(signalPreview(list)).toContain("Item one");
  });

  test("strips bold and strikethrough markers", () => {
    expect(signalPreview("This is **bold** and ~~struck~~")).not.toContain("*");
    expect(signalPreview("This is **bold** and ~~struck~~")).not.toContain("~");
  });
});

describe("signalCleanBody", () => {
  test("returns plain text as-is", () => {
    expect(signalCleanBody("A simple message")).toBe("A simple message");
  });

  test("preserves paragraph breaks in the body view", () => {
    const text = "First paragraph\n\nSecond paragraph";
    const result = signalCleanBody(text);
    expect(result).toContain("First paragraph");
    expect(result).toContain("Second paragraph");
    expect(result).toContain("\n");
  });

  test("strips markdown image syntax", () => {
    expect(signalCleanBody("See ![alt](image.png) below")).toContain("See");
    expect(signalCleanBody("See ![alt](image.png) below")).not.toContain("![");
  });

  test("strips markdown link syntax but preserves text", () => {
    expect(signalCleanBody("[read this](https://example.com)")).toContain("read this");
    expect(signalCleanBody("[read this](https://example.com)")).not.toContain("http");
  });

  test("strips bare URLs", () => {
    const text = "Visit https://example.com for more";
    expect(signalCleanBody(text)).not.toContain("https://");
  });

  test("extracts gist from JSON", () => {
    const json = JSON.stringify({
      title: "Error",
      description: "Something went wrong",
      details: "More context here",
    });
    const result = signalCleanBody(json);
    expect(result).toContain("Error");
  });
});

describe("signalHasRaw", () => {
  test("returns false when cleaned body matches raw (plain text)", () => {
    const plainText = "Just plain text";
    expect(signalHasRaw(plainText)).toBe(false);
  });

  test("returns true when cleaned body differs from raw (markdown present)", () => {
    expect(signalHasRaw("See ![image](url) for details")).toBe(true);
  });

  test("returns true when cleaned body differs from raw (URLs present)", () => {
    expect(signalHasRaw("Visit https://example.com here")).toBe(true);
  });

  test("returns true when cleaned body differs from raw (JSON present)", () => {
    const json = JSON.stringify({ title: "Test", extra: "noise" });
    expect(signalHasRaw(json)).toBe(true);
  });

  test("returns false for empty string", () => {
    expect(signalHasRaw("")).toBe(false);
  });
});
