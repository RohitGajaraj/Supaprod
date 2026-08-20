import { describe, it, expect } from "bun:test";
import { computeAgentFleet, runBucket, summarizeFleet, type FleetRunInput } from "./agent-fleet";

/**
 * AGENT-FLEET-VIEW (v11 #30) — the by-agent fleet lens. These lock the run
 * bucketing, per-agent tallies, the attention-first ordering, roster seeding of
 * idle agents, and the honest headline.
 */

function r(over: Partial<FleetRunInput>): FleetRunInput {
  return {
    agent_slug: "scout",
    agent_name: "Scout",
    status: "completed",
    created_at: "2026-06-24T00:00:00Z",
    ...over,
  };
}

describe("agent-fleet — run bucketing", () => {
  it("buckets run statuses (normalized), unknown → other", () => {
    expect(runBucket("running")).toBe("running");
    expect(runBucket(" In_Progress ")).toBe("running");
    expect(runBucket("queued")).toBe("queued");
    expect(runBucket("completed")).toBe("done");
    expect(runBucket("failed")).toBe("failed");
    expect(runBucket("denied")).toBe("failed");
    expect(runBucket(null)).toBe("other");
    expect(runBucket("weird")).toBe("other");
  });

  // K-60. Both of these are written on agent_runs and neither had a key, so
  // runBucket returned "other" for them: computeAgentFleet incremented `total`
  // and none of the four tallies, so FleetAgent.total stopped reconciling with
  // its own parts.
  it("buckets a halted run as failed, so withExceptions can see it", () => {
    expect(runBucket("halted")).toBe("failed");
    expect(runBucket(" Halted ")).toBe("failed");
  });

  it("buckets a run parked at a gate as queued, not other", () => {
    expect(runBucket("waiting_approval")).toBe("queued");
  });
});

/**
 * EVERY STATUS THIS PRODUCT WRITES, NAMED IN ONE PLACE.
 *
 * The list is not invented here. It is the distribution measured against
 * production and recorded in `docs/operations/ledger/claude-log.md` under
 * K-60 on 2026-08-20, cross-checked against the writers in this repo:
 *
 *   completed                693     complete                  2
 *   completed_with_failures  622     waiting_approval           7
 *   failed                   509     halted                     8
 *
 * The reason it is written down rather than left implicit is the defect that
 * got through: a test can assert `running + queued + done + failed === total`
 * over a fixture of four statuses it chose itself, all four of them bucketed,
 * and pass while a third of every run in the system falls to "other". An
 * identity asserted over four buckets is only worth its weakest input, and the
 * fixture was choosing not to supply one.
 */
const STATUSES_PRODUCTION_WRITES = [
  "completed",
  "completed_with_failures",
  "failed",
  "complete",
  "waiting_approval",
  "halted",
] as const;

/**
 * THE ONE STATUS DELIBERATELY LEFT IN "other", AND IT IS A RULING RATHER THAN
 * AN OVERSIGHT.
 *
 * `completed_with_failures` is 622 runs, 33.8% of the table, and the repo is
 * genuinely split on what it means. **Six sites treat it as stopped:**
 * `run-state.ts:32` puts it in `STOPPED`, `AgentRosterPanel.tsx:81`,
 * `AgentInspector.tsx:58`, `obsidian/build-status.ts:31`,
 * `ask-blocks.server.ts:290`, and `mission-advance.server.ts`, which excludes it
 * from `RUN_SUCCESS_STATUSES` on purpose. **Two treat it as delivered:**
 * `credit-policy.ts:161` and `run-analytics.ts:74`.
 *
 * Because `computeAgentFleet`'s `failed` tally drives `summary.withExceptions`,
 * which is the supervise-by-exception signal, bucketing it either way makes the
 * fleet view contradict the governance roster over the same rows. That is a
 * product decision about what the word means, not a mapping a port may pick, so
 * it is named here and left unbucketed until it is ruled on.
 *
 * WHAT THIS SET BUYS. It turns a silent hole into a tested fact: the identity
 * below is asserted with its precondition stated, and the test underneath fails
 * the moment somebody buckets this status without removing it from here. So the
 * gap cannot be closed quietly, and it cannot be forgotten either.
 */
const AWAITING_A_RULING: ReadonlySet<string> = new Set(["completed_with_failures"]);

describe("agent-fleet — every status this product writes is accounted for", () => {
  it("buckets every status production writes, or names it as awaiting a ruling", () => {
    const unaccounted = STATUSES_PRODUCTION_WRITES.filter(
      (s) => runBucket(s) === "other" && !AWAITING_A_RULING.has(s),
    );
    expect(
      unaccounted,
      [
        "",
        "A STATUS PRODUCTION WRITES FALLS INTO NO TALLY.",
        "",
        "`computeAgentFleet` does `total += 1` for every row and increments one of",
        "the four tallies only for a bucketed one, so an unkeyed status breaks",
        "`total === running + queued + done + failed` and is invisible to",
        "`summary.withExceptions`, which is the supervise-by-exception signal.",
        "",
        "Add a key to RUN_STATE, or, if which bucket it belongs in is a genuine",
        "product decision, add it to AWAITING_A_RULING with the argument written",
        "out. Do not leave it silently in `other`.",
        "",
      ].join("\n"),
    ).toEqual([]);
  });

  it("keeps the unruled list honest, so a bucketed status cannot sit on it", () => {
    // The other direction, and it is the half that stops this set becoming
    // fiction: once somebody rules on a status and gives it a key, this fails
    // until the entry is removed, which is what forces the argument above to be
    // deleted with it rather than left describing a decision already made.
    const nowBucketed = [...AWAITING_A_RULING].filter((s) => runBucket(s) !== "other");
    expect(
      nowBucketed,
      `${nowBucketed.join(", ")} has a bucket now, so it is no longer awaiting a ruling. Remove it from AWAITING_A_RULING and delete the argument above it.`,
    ).toEqual([]);
  });

  it("reconciles total with the four tallies across every bucketed status", () => {
    // The identity, asserted over the whole enumerated set rather than over a
    // hand-picked four. The unruled statuses are excluded EXPLICITLY here, which
    // is the difference between a precondition and a blind spot: this cannot
    // pass by simply not mentioning them.
    const bucketed = STATUSES_PRODUCTION_WRITES.filter((s) => !AWAITING_A_RULING.has(s));
    const fleet = computeAgentFleet(
      bucketed.map((status) => r({ agent_slug: "scout", status })),
    );
    const scout = fleet.agents.find((a) => a.slug === "scout")!;
    expect(scout.total).toBe(bucketed.length);
    expect(scout.running + scout.queued + scout.done + scout.failed).toBe(scout.total);
  });

  it("shows what the unruled status still costs, measured rather than asserted", () => {
    // Not a tautology: it is the arithmetic Claude ran against production, in
    // miniature, and it is the number the ruling is worth. Delete this test in
    // the same change that rules on the status.
    const fleet = computeAgentFleet([
      r({ agent_slug: "scout", status: "completed" }),
      r({ agent_slug: "scout", status: "completed_with_failures" }),
    ]);
    const scout = fleet.agents.find((a) => a.slug === "scout")!;
    expect(scout.total).toBe(2);
    expect(
      scout.running + scout.queued + scout.done + scout.failed,
      "completed_with_failures reached a tally, so the ruling landed and this test is stale",
    ).toBe(1);
  });
});

describe("agent-fleet — every bucketed run lands in exactly one tally", () => {
  it("reconciles total with running + queued + done + failed for halted and gated runs", () => {
    const fleet = computeAgentFleet([
      r({ agent_slug: "scout", status: "halted" }),
      r({ agent_slug: "scout", status: "waiting_approval" }),
      r({ agent_slug: "scout", status: "running" }),
      r({ agent_slug: "scout", status: "completed" }),
    ]);
    const scout = fleet.agents.find((a) => a.slug === "scout")!;
    expect(scout).toMatchObject({ running: 1, queued: 1, done: 1, failed: 1, total: 4 });
    expect(scout.running + scout.queued + scout.done + scout.failed).toBe(scout.total);
  });

  it("counts an agent whose only run halted as an exception", () => {
    const fleet = computeAgentFleet([r({ agent_slug: "builder", status: "halted" })]);
    expect(fleet.agents.find((a) => a.slug === "builder")!.state).toBe("attention");
    expect(fleet.summary.withExceptions).toBe(1);
  });
});

describe("agent-fleet — per-agent tallies + state", () => {
  const fleet = computeAgentFleet([
    r({
      agent_slug: "scout",
      agent_name: "Scout",
      status: "running",
      created_at: "2026-06-24T05:00:00Z",
    }),
    r({ agent_slug: "scout", status: "completed", created_at: "2026-06-24T01:00:00Z" }),
    r({ agent_slug: "scout", status: "failed", created_at: "2026-06-24T02:00:00Z" }),
    r({
      agent_slug: "critic",
      agent_name: "Critic",
      status: "completed",
      created_at: "2026-06-24T03:00:00Z",
    }),
    r({
      agent_slug: "builder",
      agent_name: "Builder",
      status: "queued",
      created_at: "2026-06-24T04:00:00Z",
    }),
  ]);

  it("tallies running/queued/done/failed/total per agent", () => {
    const scout = fleet.agents.find((a) => a.slug === "scout")!;
    expect(scout).toMatchObject({ running: 1, done: 1, failed: 1, total: 3, liveLoad: 1 });
    expect(scout.lastActiveAt).toBe("2026-06-24T05:00:00Z"); // most recent
  });

  it("derives agent state (working > queued > attention > idle)", () => {
    expect(fleet.agents.find((a) => a.slug === "scout")!.state).toBe("working"); // has running
    expect(fleet.agents.find((a) => a.slug === "builder")!.state).toBe("queued");
    expect(fleet.agents.find((a) => a.slug === "critic")!.state).toBe("idle"); // only done
  });

  it("orders attention-first: live load, then failures, then recency", () => {
    // scout (load 1) first, builder (load 1, but scout更recent/has failures) — tie on load → failures then recency.
    // scout liveLoad 1 + failed 1; builder liveLoad 1 + failed 0 → scout before builder.
    expect(fleet.agents.map((a) => a.slug)).toEqual(["scout", "builder", "critic"]);
  });
});

describe("agent-fleet — roster seeding + summary", () => {
  it("includes roster agents with zero runs as idle", () => {
    const fleet = computeAgentFleet(
      [r({ agent_slug: "scout", status: "running" })],
      [
        { slug: "scout", name: "Scout" },
        { slug: "ghost", name: "Ghost" },
      ],
    );
    const ghost = fleet.agents.find((a) => a.slug === "ghost")!;
    expect(ghost).toMatchObject({ total: 0, liveLoad: 0, state: "idle", lastActiveAt: null });
  });

  it("computes the fleet summary", () => {
    const fleet = computeAgentFleet([
      r({ agent_slug: "scout", status: "running" }),
      r({ agent_slug: "critic", status: "queued" }),
      r({ agent_slug: "builder", status: "failed" }),
    ]);
    expect(fleet.summary).toMatchObject({
      totalAgents: 3,
      working: 1,
      totalRunning: 1,
      totalQueued: 1,
      withExceptions: 1,
    });
  });

  it("is null-safe and honest when empty", () => {
    const fleet = computeAgentFleet([]);
    expect(fleet.agents).toEqual([]);
    expect(fleet.summary.totalAgents).toBe(0);
    expect(fleet.headline).toContain("No agents have run yet");
  });

  it("drops rows with no agent_slug rather than crashing", () => {
    const fleet = computeAgentFleet([
      r({ agent_slug: null, status: "running" }),
      r({ agent_slug: "scout", status: "running" }),
    ]);
    expect(fleet.agents.map((a) => a.slug)).toEqual(["scout"]);
  });
});

describe("agent-fleet — headline", () => {
  it("summarizes runs in flight + active + exceptions", () => {
    expect(
      summarizeFleet({
        totalAgents: 4,
        working: 2,
        idle: 1,
        totalRunning: 3,
        totalQueued: 1,
        withExceptions: 1,
      }),
    ).toBe("3 runs in flight · 1 queued · 2 of 4 agents active · 1 with exceptions.");
  });
});
