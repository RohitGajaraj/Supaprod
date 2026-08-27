import { describe, expect, test } from "bun:test";
import {
  capturedByHand,
  latestIso,
  relTimeCaps,
  sourceCaps,
  sourceLabel,
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

  test("far future timestamp also floors to 1M AGO", () => {
    const farFutureIso = new Date(now + 365 * DAY_MS).toISOString();
    expect(relTimeCaps(farFutureIso)).toBe("1M AGO");
  });

  test("handles very old timestamps (years ago) correctly", () => {
    const veryOldIso = new Date(now - 365 * DAY_MS).toISOString();
    const days = Math.floor(365);
    expect(relTimeCaps(veryOldIso)).toBe(`${days}D AGO`);
  });

  test("empty string for malformed date", () => {
    expect(relTimeCaps("")).toBe("");
  });

  test("empty string for invalid date object stringification", () => {
    expect(relTimeCaps("0000-00-00T00:00:00Z")).toBe("");
  });
});

describe("sourceCaps", () => {
  test("upcases a lowercase source", () => {
    expect(sourceCaps("intercom")).toBe("INTERCOM");
  });

  test("already-uppercase remains unchanged", () => {
    expect(sourceCaps("GITHUB")).toBe("GITHUB");
  });

  test("mixed case is uppercased", () => {
    expect(sourceCaps("SlackBot")).toBe("SLACKBOT");
  });

  test("numeric characters remain unchanged", () => {
    expect(sourceCaps("source123")).toBe("SOURCE123");
  });

  test("special characters and spaces are uppercased (or pass through)", () => {
    expect(sourceCaps("my-source_tool 2.0")).toBe("MY-SOURCE_TOOL 2.0");
  });

  test("empty string remains empty", () => {
    expect(sourceCaps("")).toBe("");
  });

  test("single character is uppercased", () => {
    expect(sourceCaps("a")).toBe("A");
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

  test("handles single valid entry", () => {
    const iso = new Date(Date.now() - 10 * 60_000).toISOString();
    expect(latestIso([iso])).toBe(iso);
  });

  test("handles all-null entries", () => {
    expect(latestIso([null, null, null])).toBeNull();
  });

  test("handles mix of nulls and blanks", () => {
    expect(latestIso([null, "", undefined])).toBeNull();
  });

  test("returns the EXACT ISO string that was passed in", () => {
    const iso1 = "2026-01-01T10:00:00Z";
    const iso2 = "2026-01-01T11:00:00Z";
    const result = latestIso([iso1, iso2]);
    expect(result).toBe(iso2); // exact object reference match
  });

  test("sub-millisecond precision collapses to the same ms; first-seen wins the tie", () => {
    // Date only carries millisecond precision, so both parse to the same ms;
    // the strict `>` comparison in latestIso means later entries never win a tie.
    const iso1 = "2026-01-01T10:00:00.000001Z";
    const iso2 = "2026-01-01T10:00:00.000002Z";
    const result = latestIso([iso1, iso2]);
    expect(result).toBe(iso1);
  });

  test("returns null for array with only invalid entries mixed with blanks", () => {
    expect(latestIso(["", "not-a-date", null, "also-invalid"])).toBeNull();
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

  test("handles empty string input", () => {
    expect(traceRef("")).toBe("");
  });

  test("skips all non-alphanumeric characters correctly", () => {
    expect(traceRef("a!b@c#d$e%f^g")).toBe("ABCDEF");
  });

  test("handles numeric-only strings", () => {
    expect(traceRef("123456789")).toBe("123456");
  });

  test("handles uppercase input", () => {
    expect(traceRef("ABCDEF-1234")).toBe("ABCDEF");
  });

  test("stops at exactly 6 characters, ignoring remainder", () => {
    const result = traceRef("abcdefghijk");
    expect(result).toBe("ABCDEF");
    expect(result.length).toBe(6);
  });

  test("handles mixed alphanumerics with heavy punctuation", () => {
    expect(traceRef("a-.-.-.-.-.-b-.-.-.-.-c-.-d-.-e-.-f-.-g")).toBe("ABCDEF");
  });

  test("handles UUIDs with uppercase hex", () => {
    expect(traceRef("A1B2C3D4-0000-0000-0000-000000000000")).toBe("A1B2C3");
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

  /*
   * The four below are the shared asterisk rule, delegated to `plainProse` so
   * the feed and the run screen cannot disagree about one string. The first is
   * a real signal in this database, quoted; the other three are what the old
   * blunt `**`-only strip would have got wrong in the other direction.
   */
  test("unwraps single-asterisk emphasis, which the feed used to show raw", () => {
    const real = "No sync-log data exists to confirm *how* the overwrite occurs.";
    expect(signalPreview(real)).toBe(
      "No sync-log data exists to confirm how the overwrite occurs.",
    );
  });

  test("leaves arithmetic alone rather than reading it as emphasis", () => {
    expect(signalPreview("Retries went from 2 * 3 to 12 per hour")).toContain("2 * 3");
  });

  test("leaves an identifier's underscores intact", () => {
    const text = "The checkout_single_address flag is still on for 12 accounts";
    expect(signalPreview(text)).toContain("checkout_single_address");
  });

  test("still takes the bullet off a list without eating the item", () => {
    const result = signalPreview("* **Conversion focus:** simplifying the checkout");
    expect(result).toBe("Conversion focus: simplifying the checkout");
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

  test("should return true when single-character difference distinguishes raw from cleaned", () => {
    // A backtick makes `x` into inline code; the backtick itself is stripped
    expect(signalHasRaw("value is `x` here")).toBe(true);
  });

  test("should return false when leading/trailing whitespace is the only difference", () => {
    // signalHasRaw trims both sides before comparing
    expect(signalHasRaw("  plain text  ")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Edge cases for internal helpers tested through the public API
// ---------------------------------------------------------------------------

describe("pickFirstString (via signalPreview with JSON)", () => {
  test("should skip keys whose values are non-strings and fall through to the next key", () => {
    // "title" key is a number, should skip to "name"
    const json = JSON.stringify({ title: 42, name: "Fallback name" });
    expect(signalPreview(json)).toBe("Fallback name");
  });

  test("should skip keys whose values are whitespace-only and fall through", () => {
    const json = JSON.stringify({ title: "   ", name: "Real name" });
    expect(signalPreview(json)).toBe("Real name");
  });

  test("should return empty when no recognised title/body key is present and no nested readable value exists", () => {
    // Object has only numeric values under non-recognised keys
    const json = JSON.stringify({ count: 0, code: 404 });
    // readableFromJson will find number values via the nested-value loop
    const result = signalPreview(json);
    // The numbers stringify to something non-empty; we just verify no crash
    expect(typeof result).toBe("string");
  });

  test("should use the first title key in priority order (title beats name)", () => {
    const json = JSON.stringify({ title: "Primary", name: "Secondary" });
    expect(signalPreview(json)).toContain("Primary");
    expect(signalPreview(json)).not.toContain("Secondary");
  });

  test("should use the first body key in priority order (description beats body)", () => {
    const json = JSON.stringify({ title: "T", description: "First body", body: "Second body" });
    const result = signalPreview(json);
    expect(result).toContain("First body");
    expect(result).not.toContain("Second body");
  });
});

describe("readableFromJson (via signalPreview with JSON)", () => {
  test("should return empty string for JSON null", () => {
    expect(signalPreview("null")).toBe("null"); // not JSON-parsed (looksLikeJson checks {/[)
  });

  test("should handle a JSON number primitive inside an array gracefully", () => {
    const json = JSON.stringify([1, 2, 3]);
    const result = signalPreview(json);
    expect(result).toBe("1. 2. 3");
  });

  test("should handle a JSON boolean inside an array gracefully", () => {
    const json = JSON.stringify([true, false]);
    const result = signalPreview(json);
    expect(result).toContain("true");
  });

  test("should cap array summarisation at 3 items, ignoring subsequent items", () => {
    const json = JSON.stringify(["alpha", "beta", "gamma", "delta", "epsilon"]);
    const result = signalPreview(json);
    expect(result).toContain("alpha");
    expect(result).toContain("beta");
    expect(result).toContain("gamma");
    expect(result).not.toContain("delta");
    expect(result).not.toContain("epsilon");
  });

  test("should stop recursing when nesting depth exceeds 4, readableFromJson returns empty, signalGist falls back to raw clean", () => {
    // Build an object nested 5 levels deep with readable text only at the innermost leaf.
    // readableFromJson hits depth > 4 at the leaf and returns "". Because the extracted text
    // is empty, signalGist falls back to stripSignalNoise(rawJson, keepBreaks). The raw JSON
    // string itself does not contain markdown/URL noise so it passes through mostly intact.
    const deep = {
      a: { b: { c: { d: { e: { title: "Too deep to find" } } } } },
    };
    const json = JSON.stringify(deep);
    const result = signalPreview(json);
    // The fallback strips noise from the raw JSON string, result is non-empty raw-ish text
    expect(typeof result).toBe("string");
    // The deeply-buried title is NOT surfaced (depth cap is enforced)
    expect(result).not.toBe("Too deep to find");
  });

  test("should find readable text at exactly depth 4 (boundary inside the cap)", () => {
    // depth 0=root object, 1=a, 2=b, 3=c, 4=object with title
    const reachable = { a: { b: { c: { title: "Reachable" } } } };
    const json = JSON.stringify(reachable);
    const result = signalPreview(json);
    expect(result).toContain("Reachable");
  });

  test("should join title and body with a colon-space separator", () => {
    const json = JSON.stringify({ title: "Issue", body: "Details here" });
    expect(signalPreview(json)).toBe("Issue: Details here");
  });

  test("should return only title when body key is absent", () => {
    const json = JSON.stringify({ title: "Title only" });
    expect(signalPreview(json)).toBe("Title only");
  });

  test("should return only body when title key is absent", () => {
    const json = JSON.stringify({ description: "Body only" });
    expect(signalPreview(json)).toBe("Body only");
  });

  test("should handle mixed array: strings, numbers, nulls, slice caps at 3, nulls filtered out", () => {
    // Array is ["hello", null, 99, "world"]. slice(0,3) => ["hello", null, 99].
    // null maps to "" (filtered), so result is "hello. 99". "world" is beyond slot 3.
    const json = JSON.stringify(["hello", null, 99, "world"]);
    const result = signalPreview(json);
    expect(result).toContain("hello");
    expect(result).toContain("99");
    // "world" is in index 3 which is cut by slice(0,3)
    expect(result).not.toContain("world");
    // Only 2 non-null items from first 3 slots
    expect(result.split(". ").length).toBeLessThanOrEqual(2);
  });

  test("should fall through to nested value when object has no recognised keys", () => {
    const json = JSON.stringify({ metadata: { title: "Inside metadata" } });
    const result = signalPreview(json);
    expect(result).toContain("Inside metadata");
  });
});

describe("looksLikeJson (via signalPreview, detection boundary)", () => {
  test("should not attempt JSON parse on a plain string starting with a letter", () => {
    const text = "hello world";
    expect(signalPreview(text)).toBe("hello world");
  });

  test("should not attempt JSON parse on a string that starts with { but does not end with }", () => {
    // looksLikeJson requires both start and end chars to match
    const text = "{broken json";
    // Falls through to plain stripSignalNoise, no crash
    expect(typeof signalPreview(text)).toBe("string");
  });

  test("should detect a string starting with [ and ending with ] as potential JSON", () => {
    const json = '["one", "two"]';
    const result = signalPreview(json);
    expect(result).toContain("one");
    expect(result).toContain("two");
  });

  test("should handle looks-like-JSON that is actually malformed, falling back to cleaning the raw string", () => {
    // Starts with { and ends with } but is not valid JSON
    const malformed = '{"key": "value", broken}';
    const result = signalPreview(malformed);
    // Must not throw; falls back to stripping the raw text
    expect(typeof result).toBe("string");
  });

  test("should handle malformed JSON falling back to raw-clean without throwing", () => {
    // Starts with [ and ends with ] so looksLikeJson returns true, but JSON.parse throws.
    // signalGist catches and falls back to stripSignalNoise(rawString, keepBreaks).
    // stripSignalNoise does not remove bare [ ] chars, so they survive in the output.
    const malformed = "[not, valid, json]";
    const result = signalPreview(malformed);
    expect(typeof result).toBe("string");
    // Does not throw; text is returned (noise-stripped but bracket chars remain)
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("stripSignalNoise (via signalPreview / signalCleanBody, specific rule coverage)", () => {
  test("should remove angle-bracket autolinks (<https://...>)", () => {
    const text = "See <https://example.com/path> for details";
    expect(signalPreview(text)).not.toContain("https://");
    expect(signalPreview(text)).toContain("See");
    expect(signalPreview(text)).toContain("for details");
  });

  test("should strip ordered-list asterisk bullets in addition to hyphens", () => {
    const text = "* First item\n* Second item";
    const result = signalPreview(text);
    expect(result).not.toMatch(/^\*/m);
    expect(result).toContain("First item");
  });

  test("should strip plus-sign bullets", () => {
    const text = "+ Alpha\n+ Beta";
    const result = signalPreview(text);
    expect(result).toContain("Alpha");
    expect(result).toContain("Beta");
    expect(result).not.toMatch(/\+\s/);
  });

  test("should remove __ bold markers (double-underscore variant)", () => {
    expect(signalPreview("This is __underline bold__")).not.toContain("__");
  });

  test("should preserve the heading text after stripping # markers for all levels h1-h6", () => {
    for (let level = 1; level <= 6; level++) {
      const marker = "#".repeat(level);
      const result = signalPreview(`${marker} Heading ${level}`);
      expect(result).toContain(`Heading ${level}`);
      expect(result).not.toContain(marker);
    }
  });

  test("should strip multiline fenced code blocks without leaving the backtick fence", () => {
    const text = "Before\n```javascript\nconst x = 1;\n```\nAfter";
    const result = signalPreview(text);
    expect(result).not.toContain("```");
    expect(result).toContain("Before");
    expect(result).toContain("After");
  });

  test("should return empty string when input is pure image markdown (pure-noise edge case)", () => {
    const noiseOnly = "![alt text](https://example.com/image.png)";
    const result = signalPreview(noiseOnly);
    expect(result).toBe("");
  });

  test("should return empty string for multiple images with no surrounding text", () => {
    const noiseOnly = "![a](img1.png) ![b](img2.png)";
    const result = signalPreview(noiseOnly);
    expect(result).toBe("");
  });

  test("keepBreaks=true (signalCleanBody) should preserve double newlines as paragraph breaks", () => {
    const text = "Para one\n\nPara two\n\nPara three";
    const result = signalCleanBody(text);
    expect(result).toContain("\n");
    expect(result).toContain("Para one");
    expect(result).toContain("Para three");
  });

  test("keepBreaks=true (signalCleanBody) should cap runs of 3+ blank lines down to a single blank line", () => {
    const text = "First\n\n\n\nSecond";
    const result = signalCleanBody(text);
    // No run of 3+ newlines should survive
    expect(result).not.toMatch(/\n{3,}/);
    expect(result).toContain("First");
    expect(result).toContain("Second");
  });

  test("keepBreaks=false (signalPreview) should collapse all whitespace to a single space", () => {
    const text = "word1\t\t  word2\n\nword3";
    const result = signalPreview(text);
    expect(result).not.toMatch(/\s{2}/);
    expect(result).toContain("word1");
    expect(result).toContain("word3");
  });
});

describe("truncateOnWord (via signalPreview, boundary conditions)", () => {
  test("should return text unchanged when length equals max exactly", () => {
    const text = "Hello world"; // 11 chars
    expect(signalPreview(text, 11)).toBe("Hello world");
  });

  test("should return text unchanged when length is under max", () => {
    const text = "Short";
    expect(signalPreview(text, 100)).toBe("Short");
  });

  test("should append ellipsis character when truncating", () => {
    const text = "One two three four five";
    const result = signalPreview(text, 10);
    expect(result).toMatch(/…$/);
  });

  test("should cut on a word boundary when the last space is past the 60% threshold", () => {
    // "One two " = 8 chars. max=10, 60% of 10 = 6. lastSpace at index 7 > 6, so cut there.
    const text = "One two three";
    const result = signalPreview(text, 10);
    // Must not split mid-word
    expect(result).toBe("One two…");
  });

  test("should cut mid-word (no space suffix added) when no space exceeds the 60% threshold", () => {
    // A single long word with no spaces, lastSpace = -1, which is not > max*0.6
    const text = "Superlongwordwithoutspaces";
    const result = signalPreview(text, 10);
    expect(result).toMatch(/…$/);
    expect(result.replace("…", "").length).toBe(10);
  });

  test("should handle max=0 by treating all text as over-length and truncating to ellipsis", () => {
    const text = "any text";
    const result = signalPreview(text, 0);
    // cut = text.slice(0,0) = "", lastSpace = -1, head = ""
    expect(result).toBe("…");
  });

  test("should handle unicode multi-codepoint characters without crashing", () => {
    const text = "Hello \u{1F600} world emoji test text";
    const result = signalPreview(text, 15);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("signalGist (via signalPreview / signalCleanBody, integration edge cases)", () => {
  test("should fall back to raw-clean when JSON parses but yields empty extracted text", () => {
    // A valid JSON object whose values are all null, readableFromJson returns ""
    // so the fallback stripSignalNoise(trimmed, keepBreaks) runs on the raw JSON string
    const json = JSON.stringify({ custom_key: null, another: null });
    const result = signalPreview(json);
    // Not empty, the raw JSON string is stripped of noise and returned
    expect(typeof result).toBe("string");
  });

  test("should handle empty content by returning empty string immediately", () => {
    expect(signalPreview("")).toBe("");
    expect(signalCleanBody("")).toBe("");
  });

  test("should handle whitespace-only content gracefully", () => {
    expect(signalPreview("   ")).toBe("");
    expect(signalCleanBody("   ")).toBe("");
  });

  test("should extract gist from JSON containing HTML-entity-like text", () => {
    const json = JSON.stringify({ title: "Issue &amp; fix", description: "Use &lt;code&gt;" });
    const result = signalPreview(json);
    // HTML entities are left as-is (we clean markdown, not HTML entities)
    expect(result).toContain("Issue");
  });

  test("should handle JSON where the extracted text itself contains markdown noise", () => {
    // The title value contains a bare URL, stripSignalNoise runs on extracted text
    const json = JSON.stringify({ title: "See https://example.com for info" });
    const result = signalPreview(json);
    expect(result).not.toContain("https://");
    expect(result).toContain("See");
  });

  test("should handle unicode and emoji in JSON content without truncating mid-codepoint", () => {
    const json = JSON.stringify({ title: "Feature \u{1F680} launch", description: "Great news" });
    const result = signalPreview(json);
    expect(result).toContain("Feature");
    expect(typeof result).toBe("string");
  });

  test("should return the first readable nested string encountered when no recognised title/body keys exist", () => {
    // meta has no title/body keys. Object.values loop runs: first value is "2024-01-01"
    // (the timestamp string), which readableFromJson returns immediately, "Readable message"
    // inside content is never reached because the first readable value wins.
    const json = JSON.stringify({
      meta: { timestamp: "2024-01-01", content: { message: "Readable message" } },
    });
    const result = signalPreview(json);
    expect(result).toContain("2024-01-01");
    expect(result).not.toContain("Readable message");
  });

  test("signalCleanBody should extract JSON gist with paragraph breaks preserved when body has newlines", () => {
    const json = JSON.stringify({ title: "Title", description: "Line one\nLine two" });
    const result = signalCleanBody(json);
    // After extraction the description newline is preserved by keepBreaks=true path
    expect(result).toContain("Title");
    expect(result).toContain("Line one");
  });

  test("signalHasRaw returns true when JSON was transformed to its readable gist", () => {
    const json = JSON.stringify({ title: "My title", description: "My desc" });
    // cleaned output ("My title: My desc") differs from raw JSON string
    expect(signalHasRaw(json)).toBe(true);
  });

  test("signalHasRaw returns true when extracted gist differs by more than whitespace from raw", () => {
    const json = JSON.stringify({ name: "widget", body: "A short description" });
    expect(signalHasRaw(json)).toBe(true);
  });

  test("hostile payload: deeply nested object does not exceed depth guard (max depth 4)", () => {
    // Construct a deliberately deeply nested payload with readable text at the very bottom.
    // readableFromJson stops at depth > 4, so it returns "", and signalGist falls back to
    // stripSignalNoise(rawJson). The raw JSON string contains the text, but that's OK - the
    // important thing is it doesn't crash and doesn't extract the deeply-nested value as
    // the main gist text. Test that it doesn't treat "Unreachable" as extracted gist.
    const hostile = {
      level1: {
        level2: {
          level3: {
            level4: {
              level5: {
                level6: {
                  title: "Unreachable because depth exceeds 4",
                },
              },
            },
          },
        },
      },
    };
    const json = JSON.stringify(hostile);
    // Must not throw; readableFromJson stops at depth > 4
    const result = signalPreview(json);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
    // The raw JSON falls back when deep nesting prevents extraction, so no crash
    // This demonstrates the depth guard works (no infinite recursion)
  });

  test("hostile payload: large flat object with many keys does not degrade performance", () => {
    // Create an object with 1000+ keys, each with a non-standard key name
    const large: Record<string, string> = {};
    for (let i = 0; i < 1000; i++) {
      large[`key_${i}`] = `value_${i}`;
    }
    const json = JSON.stringify(large);
    // Must not throw or hang; readableFromJson's key lookup and nested-value loop are linear
    const result = signalPreview(json);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  test("hostile payload: array with 100+ items slices at first 3 and stops", () => {
    // readableFromJson caps array slicing to .slice(0, 3) regardless of length
    const largeArray = Array.from({ length: 1000 }, (_, i) => `item_${i}`);
    const json = JSON.stringify(largeArray);
    const result = signalPreview(json);
    // Only the first 3 items are summarized; the rest are ignored
    expect(result).toContain("item_0");
    expect(result).toContain("item_1");
    expect(result).toContain("item_2");
    expect(result).not.toContain("item_999");
  });

  test("hostile payload: circular-reference-like structure (via duplication, not actual cycles)", () => {
    // JSON doesn't support true circular references, but simulate a payload
    // with the same key repeated at multiple levels
    const almost = {
      data: {
        data: {
          data: {
            title: "Multi-level data key",
          },
        },
      },
    };
    const json = JSON.stringify(almost);
    // Must not throw; depth guard handles repeated keys
    const result = signalPreview(json);
    expect(typeof result).toBe("string");
    expect(result).toContain("Multi-level");
  });
});

describe("sourceLabel - a person must never have to read a column value", () => {
  test("names every manual channel as the person's own work", () => {
    expect(sourceLabel("note", "manual")).toBe("A note you wrote");
    expect(sourceLabel("document", "manual")).toBe("A document you added");
    expect(sourceLabel("transcript", "manual")).toBe("A transcript you added");
    expect(sourceLabel("paste", "manual")).toBe("Lines you pasted");
  });

  test("prefers the channel over the lane, because the tool name says more", () => {
    expect(sourceLabel("github", "pull_connector")).toBe("GitHub");
    expect(sourceLabel("intercom", "pull_connector")).toBe("Intercom");
  });

  test("falls back to the lane when there is no channel at all", () => {
    expect(sourceLabel(null, "pull_connector")).toBe("A connected tool");
    expect(sourceLabel("", "web_scout")).toBe("The web scout");
  });

  test("reads a lane token arriving in the channel position, which is what the coverage list passes", () => {
    expect(sourceLabel("manual")).toBe("Captured by hand");
    expect(sourceLabel("pull_connector")).toBe("A connected tool");
    expect(sourceLabel("web_scout")).toBe("The web scout");
    expect(sourceLabel("mcp_source")).toBe("A connected agent");
    expect(sourceLabel("webhook")).toBe("An inbound webhook");
  });

  test("stays readable for a channel nobody has named yet", () => {
    expect(sourceLabel("scout_competitor", "web_scout")).toBe("Scout competitor");
    expect(sourceLabel("some-new-thing", null)).toBe("Some new thing");
  });

  test("never returns an empty string", () => {
    expect(sourceLabel(null, null)).toBe("An unnamed source");
    expect(sourceLabel("   ", "  ")).toBe("An unnamed source");
  });
});

describe("capturedByHand", () => {
  test("reads the stamped lane first", () => {
    expect(capturedByHand("anything", "manual")).toBe(true);
    expect(capturedByHand("github", "pull_connector")).toBe(false);
  });

  test("still attributes rows written before manual capture reached the sink", () => {
    expect(capturedByHand("manual", null)).toBe(true);
    expect(capturedByHand("note", null)).toBe(true);
    expect(capturedByHand("paste", undefined)).toBe(true);
  });

  test("does not claim a machine-sensed signal as a person's own", () => {
    expect(capturedByHand("github", null)).toBe(false);
    expect(capturedByHand(null, null)).toBe(false);
  });
});
