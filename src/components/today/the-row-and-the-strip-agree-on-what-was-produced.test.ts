/**
 * P-18 (A-QUEUE.md): "The strip and the row print the same sentence for the
 * same track."
 *
 * ── IT COMPARED TWO IMPLEMENTATIONS, AND NOW IT COMPARES ONE TO THE CANON ──
 * The original pinned `startRowMiddle` (Start's row) against `whatItProduced`
 * (the run screen's per-station sentence), because the two had drifted: the row
 * dropped the leading count for a single item ("Produced spec") and joined with
 * a bare comma, while the strip always stated the count and joined with
 * `joinPlainly`. Pinning them to each other stopped that, and it was the right
 * move at the time.
 *
 * It has one weakness and the tally census made it visible: **comparing two
 * implementations proves they AGREE, never that either is right.** Both could
 * drift together and this would stay green. And it made `what-it-produced.ts`
 * undeletable -- the module lost its last renderer when the transcript's
 * section header went, and could not leave the tree because a contract was
 * pinned to it, so a dead emitter sat in the census's quarantine list purely to
 * hold a test up.
 *
 * So the reference is the CONVENTION rather than a second implementation:
 * `KIND_WORD` for the noun and `joinPlainly` for the list, which is what
 * `describeAttachments`, the chain's whole-run sentence and the story all
 * already use. That is strictly stronger -- it proves the row is right rather
 * than that two things match -- and it frees the dead module to go.
 *
 * What is NOT asserted here, deliberately: that every emitter phrases a
 * single titled artifact the same way. The story says `filed "the title"` for
 * one, which is better than "filed 1 spec" and is a different rule for a
 * different surface. The convention this pins is the COUNTED CLAUSE, which is
 * the thing that drifted.
 *
 * ── AND A DIVERGENCE THIS CANNOT SEE, NAMED BECAUSE IT IS LIVE ────────────
 * As of 2026-09-10 the run screen's road, story and artifact pane all count
 * DISTINCT things, folding repeats by title through `foldVersions`. On
 * `47dcbf3c` they read "4 findings, 67 times". Start's row still counts
 * filings and says "Produced 67 findings".
 *
 * **This file passes anyway, and that is the honest limit of what it proves.**
 * It scores the row against the convention -- the noun from `KIND_WORD`, the
 * list from `joinPlainly` -- which is about how a count is WORDED and says
 * nothing about what gets counted. I strengthened it four hours before the fold
 * landed and it still cannot see the divergence the fold created.
 *
 * NOT FIXED HERE, and the reason is a cost rather than a preference:
 * `producedByTrack` in `track.functions.ts` counts
 * `spine_track_members(artifact_kind)` and reads no titles, so folding Start's
 * row means fetching a title for every member of every track in the feed. That
 * is a real payload decision on a list read, on a surface Lane 1 owns. Filed
 * with both lanes rather than taken.
 */
import { describe, it, expect } from "bun:test";
import { startRowMiddle, type StartRowInput } from "./tracks-feed";
import { KIND_WORD, joinPlainly } from "@/lib/spine/attach";

const NOW = Date.parse("2026-09-03T00:00:00Z");

const row = (produced: Array<{ kind: string; count: number }>): StartRowInput => ({
  id: "t-1",
  title: "Cut the sign-up form from nine fields to four",
  status: "done",
  stationName: "Plan",
  updatedAt: "2026-09-02T23:00:00Z",
  drivenAt: "2026-09-02T22:59:00Z",
  holdReason: null,
  holdBecause: null,
  working: null,
  needsYou: null,
  produced,
});

/**
 * The clause the convention produces, built straight from its two sources.
 *
 * This is the whole reference: the noun comes from `KIND_WORD` and the list
 * from `joinPlainly`, and any surface counting artifacts is right exactly when
 * it produces this.
 */
function theConvention(produced: Array<{ kind: string; count: number }>): string {
  return joinPlainly(
    produced.map(({ kind, count }) => {
      const w = KIND_WORD[kind] ?? { one: kind, many: `${kind}s` };
      return `${count} ${count === 1 ? w.one : w.many}`;
    }),
  );
}

describe("Start's row counts and joins the way the one vocabulary does", () => {
  const clause = (produced: Array<{ kind: string; count: number }>) =>
    startRowMiddle(row(produced), NOW, KIND_WORD, () => null).replace(/^Produced /, "");

  it("a single kind, count one: the number is stated", () => {
    // The original drift: this said "Produced spec".
    const produced = [{ kind: "prd", count: 1 }];
    expect(clause(produced)).toBe(theConvention(produced));
    expect(clause(produced)).toBe("1 spec");
  });

  it("two kinds: joined with 'and', not a bare comma", () => {
    const produced = [
      { kind: "prd", count: 1 },
      { kind: "prototype", count: 2 },
    ];
    expect(clause(produced)).toBe(theConvention(produced));
    expect(clause(produced)).toBe("1 spec and 2 prototypes");
  });

  it("three kinds: the join still agrees past two items", () => {
    const produced = [
      { kind: "prd", count: 1 },
      { kind: "prototype", count: 2 },
      { kind: "decision", count: 3 },
    ];
    expect(clause(produced)).toBe(theConvention(produced));
    expect(clause(produced)).toBe("1 spec, 2 prototypes and 3 decisions");
  });

  it("and the noun is the canon's, not the column's", () => {
    // `signal` displays as "finding" and `deployment` as "release". A surface
    // printing the column word would pass a two-implementation test if both
    // printed it.
    const produced = [{ kind: "signal", count: 2 }];
    expect(clause(produced)).toBe("2 findings");
    expect(clause(produced)).toBe(theConvention(produced));
  });
});

describe("the reference is the convention, so it can fail", () => {
  it("the canon it scores against is non-trivial", () => {
    // If `KIND_WORD` were empty every expectation above would compare two
    // fallbacks to each other and pass.
    expect(Object.keys(KIND_WORD).length).toBeGreaterThan(5);
    expect(KIND_WORD.signal?.many).toBe("findings");
  });
});
