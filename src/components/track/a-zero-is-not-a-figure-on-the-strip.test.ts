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

import { hasAnything, runTally } from "./GotYou";
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
      turns: [{ tookMs: 74_000, tokens: 100, usd: 0.2 }],
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
      turns: [{ tookMs: null, tokens: 100, usd: 0.2 }],
      now: NOW,
    });
    expect(unmeasured.elapsed).toBeNull();
  });

  it("reports money only above zero, because $0.00 is not a price", () => {
    const paid = runTally({
      stops: null,
      turns: [{ tookMs: 1000, tokens: 1, usd: 0.44 }],
      now: NOW,
    });
    expect(paid.cost).toBe("$0.44");

    const nothing = runTally({
      stops: null,
      turns: [{ tookMs: 1000, tokens: 1, usd: 0 }],
      now: NOW,
    });
    expect(nothing.cost).toBeNull();
  });

  it("sums across every turn rather than reporting the last one", () => {
    const t = runTally({
      stops: null,
      turns: [
        { tookMs: 30_000, tokens: 10, usd: 0.1 },
        { tookMs: 44_000, tokens: 20, usd: 0.34 },
      ],
      now: NOW,
    });
    expect(t.elapsed).toBe("1m 14s");
    expect(t.cost).toBe("$0.44");
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
      elapsed: null,
      cost: null,
    });
    expect(hasAnything(t)).toBe(false);
  });
});
