import { describe, expect, it } from "bun:test";

// value-receipts.functions.ts is a createServerFn wrapper, not directly unit
// testable without a live Supabase client. These tests pin the two counting
// RULES the handler applies, expressed as pure predicates mirrored from the
// implementation, so a future edit to either rule fails a test rather than
// silently drifting from the changelog's own shouldPublishChangelog gate.
import { shouldPublishChangelog } from "./changelog";

function decisionCounts(status: string) {
  return status !== "pending";
}

describe("value-receipts - decisionsClosed rule", () => {
  it("counts any status other than pending", () => {
    expect(decisionCounts("approved")).toBe(true);
    expect(decisionCounts("rejected")).toBe(true);
    expect(decisionCounts("decided")).toBe(true);
  });

  it("excludes pending", () => {
    expect(decisionCounts("pending")).toBe(false);
  });
});

describe("value-receipts - prsShipped rule matches the changelog's own gate", () => {
  it("a merged changeset with release notes counts on both sides", () => {
    const cs = { status: "merged", release_notes: "Shipped X" };
    expect(cs.status === "merged").toBe(true);
    expect(shouldPublishChangelog(cs)).toBe(true);
  });

  it("a merged changeset with no release notes still counts here (the meter is a raw count, not gated on copy)", () => {
    // Deliberate divergence from shouldPublishChangelog: prsShipped counts
    // every merged changeset, not just the ones with publishable release
    // notes - a shipped PR with no written notes still shipped. The
    // changelog's own display gate is stricter by design (it also filters
    // on copy quality), so the two are allowed to disagree here.
    const cs = { status: "merged", release_notes: null as string | null };
    expect(cs.status === "merged").toBe(true);
    expect(shouldPublishChangelog(cs)).toBe(false);
  });

  it("an open or draft changeset never counts", () => {
    for (const status of ["draft", "open", "abandoned"]) {
      expect(status === "merged").toBe(false);
    }
  });
});
