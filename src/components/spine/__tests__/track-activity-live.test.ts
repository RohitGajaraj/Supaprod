import { describe, expect, test } from "bun:test";

import { buildActivity, type MemberRow, type RunRow } from "@/lib/spine/activity";
import { hasLiveVisit } from "@/components/spine/TrackActivity";

/**
 * Queue 71's two halves, guarded where they are pure.
 *
 * HASLIVEVISIT is the whole honesty claim: a pulse may exist only when a run
 * row itself says running or queued. Anything derived from elapsed time or an
 * unheld track would breathe at silence, because between sweeps an idle track
 * is indistinguishable from a working one except by those rows.
 *
 * The buildActivity half pins the rollup and stop lines the transcript reads:
 * the cost fields pass through only when written, and the platform's reason is
 * named as the fact it is, with the record's own word kept.
 */

function run(overrides: Partial<RunRow>): RunRow {
  return {
    id: "r1",
    agent_slug: "builder",
    agent_name: "Build",
    status: "completed",
    output: null,
    created_at: "2026-08-25T10:00:00Z",
    spend_used_usd: 0,
    duration_ms: null,
    tokens_used: null,
    halted_reason: null,
    failure_kind: null,
    ...overrides,
  };
}

const members: MemberRow[] = [];

describe("hasLiveVisit", () => {
  test("a running or queued row means somebody is here", () => {
    expect(hasLiveVisit([{ outcome: "working" }])).toBe(true);
    expect(hasLiveVisit([{ outcome: "waiting" }])).toBe(true);
  });

  test("finished rows never pulse, however many there are", () => {
    expect(hasLiveVisit([{ outcome: "done" }, { outcome: "stopped" }, { outcome: "partly" }])).toBe(
      false,
    );
    expect(hasLiveVisit([])).toBe(false);
  });
});

describe("buildActivity carries what the transcript's rollup reads", () => {
  test("duration and tokens pass through when the finalizer wrote them", () => {
    const [turn] = buildActivity({
      runs: [run({ status: "completed", duration_ms: 11_400, tokens_used: 65_732 })],
      members,
    });
    expect(turn?.tookMs).toBe(11_400);
    expect(turn?.tokens).toBe(65_732);
  });

  test("an unwritten figure is null, never zero dressed as free", () => {
    const [turn] = buildActivity({ runs: [run({})], members });
    expect(turn?.tookMs).toBeNull();
    expect(turn?.tokens).toBeNull();
  });

  test("the runtime's halt reason becomes the row's stop line, in its own words", () => {
    const [halted] = buildActivity({
      runs: [run({ status: "halted", halted_reason: "out_of_credit" })],
      members,
    });
    expect(halted?.stopLine).toBe("Halted: out_of_credit");

    const [failed] = buildActivity({
      runs: [run({ status: "failed", failure_kind: "provider_timeout" })],
      members,
    });
    expect(failed?.stopLine).toBe("Failed: provider_timeout");
  });

  test("a turn that simply finished carries no stop line", () => {
    const [clean] = buildActivity({ runs: [run({ status: "completed" })], members });
    expect(clean?.stopLine).toBeNull();
  });
});
