/**
 * WHAT THIS RUN GOT YOU, AND THE FIGURES IT REFUSES TO INVENT.
 *
 * `runTally` builds the one strip above the artifact pane and the two figures on
 * the bar under both panes. Every clause of it is a column, and the tests below
 * are almost entirely about the clauses it declines to print, because that is
 * where a summary line goes wrong: a template with holes in it reads as a run
 * that produced nothing, and a hole filled with a zero reads as a fact.
 *
 * ── THE ZERO RULE, MEASURED ───────────────────────────────────────────────
 * `cost-summary.ts` and `activity.ts` already refuse a zero on `duration_ms` and
 * `tokens_used`, and their headers carry the count: 742 of 2,272 track-linked
 * runs record `duration_ms = 0`, and EVERY ONE of them burned tokens, so not one
 * is a turn that genuinely took no time. This extends the same refusal to money:
 * `$0.00` on the strip would tell a person their run was free when what actually
 * happened is that nothing recorded a price.
 */
import { describe, expect, it } from "bun:test";

import { hasAnything, runTally } from "./run-tally";
import type { StationArtifactView } from "@/lib/spine/track.functions";

const stop = (
  station: StationArtifactView["station"],
  items: StationArtifactView["items"],
): StationArtifactView => ({
  station,
  label: station,
  state: "done",
  waivedReason: null,
  expects: { kind: "decision", word: "decision" },
  everDriven: true,
  hold: null,
  holdReason: null,
  items,
});

let n = 0;
const item = (
  kind: string,
  fields: Record<string, unknown> = {},
  missing = false,
): StationArtifactView["items"][number] => ({
  kind,
  word: kind,
  artifactId: `a-${++n}`,
  createdAt: "2026-09-02T10:00:00Z",
  title: null,
  missing,
  fields: fields as never,
});

const NOW = Date.parse("2026-09-02T12:00:00Z");

describe("what it made, as chips that open it", () => {
  it("names each kind in the person's own word for it", () => {
    const t = runTally({
      stops: [
        stop("decide", [item("decision")]),
        stop("define", [item("prd")]),
        stop("build", [item("changeset"), item("changeset")]),
      ],
      turns: null,
      now: NOW,
    });
    // `KIND_WORD`, so a `signal` is a finding and a `changeset` is a code change
    // here exactly as it is in the transcript.
    /* No "1" on a single one: the founder's own example reads "decision · spec ·
       prototype · PR #14", and a count of one is the count a reader assumes. */
    expect(t.made.map((m) => m.label)).toEqual(["decision", "spec", "2 code changes"]);
  });

  it("points each chip at the station whose row filed it", () => {
    const t = runTally({
      stops: [stop("decide", [item("decision")]), stop("build", [item("changeset")])],
      turns: null,
      now: NOW,
    });
    expect(t.made.map((m) => [m.kind, m.station])).toEqual([
      ["decision", "decide"],
      ["changeset", "build"],
    ]);
  });

  it("sends a kind filed twice to the newest of the two", () => {
    /*
     * A changeset can arrive at Build and again at Ship. One chip, one
     * destination, and the newest is the version that stands.
     */
    const older = item("changeset");
    older.createdAt = "2026-09-01T09:00:00Z";
    const newer = item("changeset");
    newer.createdAt = "2026-09-02T09:00:00Z";
    const t = runTally({
      stops: [stop("build", [older]), stop("ship", [newer])],
      turns: null,
      now: NOW,
    });
    expect(t.made).toHaveLength(1);
    expect(t.made[0].station).toBe("ship");
    expect(t.made[0].count).toBe(2);
  });

  it("does not count an artifact whose row is no longer there", () => {
    /*
     * `missing` means the lookup RAN and the row was not there, which is a
     * different fact from "not produced". A chip for it would open a pane with
     * nothing in it.
     */
    const t = runTally({
      stops: [stop("decide", [item("decision"), item("decision", {}, true)])],
      turns: null,
      now: NOW,
    });
    expect(t.made.map((m) => m.label)).toEqual(["decision"]);
  });

  it("never names a station that made nothing, which is what the strip did", () => {
    /*
     * The seven-tab strip had to say something about all seven, so it named
     * Discover over a station that has filed nothing on 81 of 106 tracks. A list
     * of what was made is empty exactly when nothing was made.
     */
    const t = runTally({ stops: [stop("sense", [])], turns: [], now: NOW });
    expect(t.made).toEqual([]);
    expect(hasAnything(t)).toBe(false);
  });
});

describe("the pull request", () => {
  it("carries the number and its link when the changeset opened one", () => {
    const t = runTally({
      stops: [
        stop("build", [
          item("changeset", { pr_number: 14, pr_url: "https://github.com/o/r/pull/14" }),
        ]),
      ],
      turns: null,
      now: NOW,
    });
    expect(t.pr).toEqual({ number: 14, url: "https://github.com/o/r/pull/14" });
  });

  it("prints the number without a link rather than inventing one", () => {
    const t = runTally({
      stops: [stop("build", [item("changeset", { pr_number: 14 })])],
      turns: null,
      now: NOW,
    });
    expect(t.pr).toEqual({ number: 14, url: null });
  });

  it("says nothing when no pull request was opened", () => {
    const t = runTally({
      stops: [stop("build", [item("changeset", {})])],
      turns: null,
      now: NOW,
    });
    expect(t.pr).toBeNull();
  });
});

describe("the verdict and the horizon", () => {
  it("reads the verdict from the same place the Build tab does", () => {
    const t = runTally({
      stops: [
        stop("build", [
          item("changeset", {
            code_review: { verdict: "approve", findings: [], files_reviewed: 6 },
          }),
        ]),
      ],
      turns: null,
      now: NOW,
    });
    expect(t.verdict).toBe("Verdict at Build: nothing blocking");
  });

  it("says no verdict rather than an empty one, because a strip lists what you got", () => {
    const t = runTally({
      stops: [stop("build", [item("changeset", { code_review: null })])],
      turns: null,
      now: NOW,
    });
    expect(t.verdict).toBeNull();
  });

  it("names the day the forecast comes due", () => {
    const t = runTally({
      stops: [stop("decide", [item("decision", { forecast_horizon_date: "2026-09-12" })])],
      turns: null,
      now: NOW,
    });
    expect(t.horizon).toContain("Horizon check due");
    expect(t.horizon).toContain("Sep");
  });

  it("says nothing about a horizon that was never set or cannot be read", () => {
    for (const value of [null, "", "not a date"]) {
      const t = runTally({
        stops: [stop("decide", [item("decision", { forecast_horizon_date: value })])],
        turns: null,
        now: NOW,
      });
      expect(t.horizon).toBeNull();
    }
  });
});

describe("the clock and the bill refuse a zero", () => {
  it("reports time only where a turn actually recorded some", () => {
    const measured = runTally({
      stops: null,
      turns: [{ tookMs: 74_000, tokens: 100, usd: 0.2, credits: 8 }],
      now: NOW,
    });
    expect(measured.elapsed).toBe("1m 14s");

    /*
     * A zero on `duration_ms` is a finalizer that did not write, not a turn that
     * took no time: every one of the 742 zero rows in production burned tokens,
     * and a model call cannot take zero. `costSummary` collapses it to "not
     * measured" and this prints nothing rather than "0s".
     */
    const unmeasured = runTally({
      stops: null,
      turns: [{ tookMs: null, tokens: 100, usd: 0.2, credits: 8 }],
      now: NOW,
    });
    expect(unmeasured.elapsed).toBeNull();
  });

  /*
   * P-136 (A-QUEUE): the strip leads with credits, never dollars, because the
   * account is billed and shown in credits everywhere else this product has an
   * opinion. The dollar figure survives, demoted into the parenthetical.
   */
  it("leads with credits, the dollar figure demoted to the parenthetical", () => {
    const paid = runTally({
      stops: null,
      turns: [{ tookMs: 1000, tokens: 1, usd: 0.44, credits: 40 }],
      now: NOW,
    });
    expect(paid.cost).toBe("40 credits ($0.44)");

    const nothing = runTally({
      stops: null,
      turns: [{ tookMs: 1000, tokens: 1, usd: 0, credits: 0 }],
      now: NOW,
    });
    expect(nothing.cost).toBeNull();
  });

  it("falls back to the dollar figure alone rather than inventing a zero credits never joined", () => {
    // Older data, or a call path the ledger join does not cover yet: the record
    // still says money moved, and "Nothing was charged" would be the exact
    // invented zero this file exists to refuse -- just on a new column.
    const t = runTally({
      stops: null,
      turns: [{ tookMs: 1000, tokens: 1, usd: 0.44, credits: 0 }],
      now: NOW,
    });
    expect(t.cost).toBe("$0.44");
  });

  /* THE GUARD (A-QUEUE P-136 Scope): a run with three ledger rows shows their
     sum in credits. */
  it("sums credits across every turn rather than reporting the last one", () => {
    const t = runTally({
      stops: null,
      turns: [
        { tookMs: 30_000, tokens: 10, usd: 0.1, credits: 8 },
        { tookMs: 44_000, tokens: 20, usd: 0.34, credits: 25 },
        { tookMs: 12_000, tokens: 5, usd: 0.01, credits: 7 },
      ],
      now: NOW,
    });
    expect(t.elapsed).toBe("1m 26s");
    expect(t.cost).toBe("40 credits ($0.45)");
  });
});

describe("a read that has not answered claims nothing", () => {
  it("is empty on null inputs rather than printing a template", () => {
    const t = runTally({ stops: null, turns: null, now: NOW });
    expect(t).toEqual({
      made: [],
      pr: null,
      verdict: null,
      horizon: null,
      /* `declined` joined `Tally` on 2026-09-09 and defaults to null the way
         this test asks every field to: nothing was read, so nothing is claimed
         about how the decisions went. */
      declined: null,
      // The whole-object comparison is the point of this test: a field added to
      // `Tally` that does not default to null shows up HERE rather than as a
      // template on somebody's screen. `selfCheck` is one such field.
      selfCheck: null,
      elapsed: null,
      cost: null,
    });
    expect(hasAnything(t)).toBe(false);
  });
});

describe("how the decisions went, said only when it discriminates", () => {
  /*
   * A DECLINE IS AN OUTCOME AND IT IS NOT THE SAME OUTCOME. The chip says
   * "14 decisions"; on `d2263583` thirteen of those fourteen were declined,
   * because the strategist proposed and the critic refused for want of A/B
   * evidence, and the two repeated that exchange for three hours and fifty-one
   * minutes. The run's product is one refusal and the strip led with a count
   * that reads as fourteen pieces of work.
   *
   * Measured 2026-09-09: 60 decision rows across 29 tracks, 20 declined, on 8
   * tracks. So the clause is silent on 21 of 29, which is the point.
   */
  const decision = (status: string, id: string) => ({
    kind: "decision",
    word: "decision",
    artifactId: id,
    createdAt: "2026-08-31T13:40:00.000Z",
    title: "A call",
    missing: false,
    fields: { status },
  });
  const stopWith = (items: ReturnType<typeof decision>[]) =>
    [{ station: "decide", label: "Decide", items }] as never;

  it("says nothing at all when nothing was declined", () => {
    const t = runTally({
      stops: stopWith([decision("approved", "a"), decision("approved", "b")]),
      turns: null,
      now: NOW,
    });
    expect(t.declined).toBeNull();
  });

  it("names the share when some were declined", () => {
    const t = runTally({
      stops: stopWith([
        decision("approved", "a"),
        decision("declined", "b"),
        decision("declined", "c"),
      ]),
      turns: null,
      now: NOW,
    });
    expect(t.declined).toBe("2 of the 3 decisions were declined.");
  });

  it("says it plainly when every one of them was", () => {
    // "3 of the 3" is a sentence that makes a reader do arithmetic to reach
    // "all", and the whole point of the clause is that it is read at a glance.
    const t = runTally({
      stops: stopWith([
        decision("declined", "a"),
        decision("declined", "b"),
        decision("declined", "c"),
      ]),
      turns: null,
      now: NOW,
    });
    expect(t.declined).toBe("All 3 were declined.");
  });

  it("counts only decisions, because `status` means something else on every other kind", () => {
    const t = runTally({
      stops: [
        {
          station: "define",
          label: "Plan",
          items: [
            { ...decision("declined", "d"), kind: "prd", word: "spec" },
            decision("approved", "a"),
          ],
        },
      ] as never,
      turns: null,
      now: NOW,
    });
    expect(t.declined).toBeNull();
  });
});
