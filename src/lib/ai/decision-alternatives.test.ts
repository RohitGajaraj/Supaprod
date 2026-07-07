import { describe, it, expect } from "bun:test";
import { extractRejectedAlternatives } from "./decision-alternatives";

// SW-3 mission 3.2: honest rejected-path extraction from agent output.
// The invariant under test: rows appear ONLY when the text literally names a
// rejected path; plain prose yields [].

describe("extractRejectedAlternatives", () => {
  it("returns [] for empty input and plain prose that names no rejected path", () => {
    expect(extractRejectedAlternatives(null)).toEqual([]);
    expect(extractRejectedAlternatives("")).toEqual([]);
    expect(
      extractRejectedAlternatives(
        "Shipped the connector sync. All tests green.\nNext step: monitor the first live pull.",
      ),
    ).toEqual([]);
  });

  it("parses an explicit alternatives section with colon-separated bullets", () => {
    const out = extractRejectedAlternatives(
      [
        "We went with webhooks.",
        "",
        "Alternatives considered:",
        "- Polling every minute: too slow and wasteful at scale",
        "- Client-side sync: leaks credentials into the browser",
        "",
        "Rollout starts Monday.",
      ].join("\n"),
    );
    expect(out).toEqual([
      { title: "Polling every minute", reason_rejected: "too slow and wasteful at scale" },
      { title: "Client-side sync", reason_rejected: "leaks credentials into the browser" },
    ]);
  });

  it("parses markdown headings and numbered bullets", () => {
    const out = extractRejectedAlternatives(
      ["## Paths not taken", "1. Rewrite in Rust: not worth the migration cost"].join("\n"),
    );
    expect(out).toEqual([
      { title: "Rewrite in Rust", reason_rejected: "not worth the migration cost" },
    ]);
  });

  it("stops the section at the first non-bullet line", () => {
    const out = extractRejectedAlternatives(
      [
        "Alternatives considered:",
        "- Option A: too costly",
        "The rest of this report is unrelated prose.",
        "- Not an alternative: this bullet is outside the section",
      ].join("\n"),
    );
    expect(out).toEqual([{ title: "Option A", reason_rejected: "too costly" }]);
  });

  it("picks up standalone Rejected bullets outside any section", () => {
    const out = extractRejectedAlternatives(
      ["Findings:", "- Rejected: shadow DOM isolation: breaks the design tokens"].join("\n"),
    );
    expect(out).toEqual([
      { title: "shadow DOM isolation", reason_rejected: "breaks the design tokens" },
    ]);
  });

  it("keeps a named path with no stated reason, saying so honestly", () => {
    const out = extractRejectedAlternatives(["Alternatives considered:", "- GraphQL"].join("\n"));
    expect(out).toEqual([
      { title: "GraphQL", reason_rejected: "Reason not stated in the source output." },
    ]);
  });

  it("dedupes by title and caps at 8", () => {
    const bullets = Array.from({ length: 12 }, (_, i) => `- Path ${i}: reason ${i}`);
    const out = extractRejectedAlternatives(
      ["Alternatives considered:", "- Same: once", "- same: twice", ...bullets].join("\n"),
    );
    expect(out.length).toBe(8);
    expect(out.filter((a) => a.title.toLowerCase() === "same").length).toBe(1);
  });
});
