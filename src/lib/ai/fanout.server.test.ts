import { describe, it, expect, afterEach } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { enqueueFanout, fanoutEnabled } from "./fanout.server";
import { FANOUT_MAX_CHILDREN, remainingMissionBudget, type FanoutItem } from "./fanout";

// A spy Supabase client: resolves the target agent, serves the workspace ceiling
// `resolveMissionSpendCap` reads, and counts the agent_messages / agent_runs
// inserts each child handoff makes. memory_refs path is stubbed but unused
// (children carry only task + context).
//
// `workspaceCap` is what `workspaces.default_mission_spend_cap_usd` returns. The
// default of 8 is chosen so the split arithmetic in the assertions is exact.
function fanoutSpy(
  agent = { id: "qa-id", slug: "qa", name: "QA" },
  workspaceCap: number | null = 8,
) {
  const inserts: Record<string, number> = { agent_messages: 0, agent_runs: 0 };
  const rows: Record<string, unknown[]> = { agent_messages: [], agent_runs: [] };
  const reads: Record<string, number> = { workspaces: 0 };
  const agentChain = {
    eq: () => agentChain,
    limit: () => agentChain,
    maybeSingle: async () => ({ data: agent, error: null }),
  };
  const workspaceChain = {
    eq: () => workspaceChain,
    maybeSingle: async () => ({
      data: { default_mission_spend_cap_usd: workspaceCap },
      error: null,
    }),
  };
  const client = {
    from(table: string) {
      if (table === "agents") return { select: () => agentChain };
      if (table === "workspaces") {
        reads.workspaces += 1;
        return { select: () => workspaceChain };
      }
      return {
        insert: (row: unknown) => {
          inserts[table] = (inserts[table] ?? 0) + 1;
          (rows[table] ??= []).push(row);
          return {
            select: () => ({
              single: async () => ({ data: { id: `${table}-id` }, error: null }),
            }),
          };
        },
        select: () => ({ eq: () => ({ in: async () => ({ data: [], error: null }) }) }),
      };
    },
  } as unknown as SupabaseClient;
  return { client, inserts, rows, reads };
}

/** The per-run spend ceilings written onto the child agent_runs rows. */
function childSpendCaps(rows: Record<string, unknown[]>): (number | null)[] {
  return (rows.agent_runs as { mission_spend_cap_usd: number | null }[]).map(
    (r) => r.mission_spend_cap_usd,
  );
}

const args = (items: FanoutItem[], parent_depth = 0) => ({
  mission_id: "m1",
  workspace_id: "w1",
  from_agent_id: "parent-id",
  from_agent_slug: "researcher",
  to_agent_slug: "qa",
  items,
  parent_depth,
  source_run_id: "r1",
  source_trace_id: "t1",
});

describe("fanoutEnabled (capability flag, default OFF)", () => {
  const prev = process.env.AGENT_FANOUT;
  afterEach(() => {
    if (prev === undefined) delete process.env.AGENT_FANOUT;
    else process.env.AGENT_FANOUT = prev;
  });

  it("is OFF by default, ON only for 1/true", () => {
    delete process.env.AGENT_FANOUT;
    expect(fanoutEnabled()).toBe(false);
    process.env.AGENT_FANOUT = "1";
    expect(fanoutEnabled()).toBe(true);
    process.env.AGENT_FANOUT = "true";
    expect(fanoutEnabled()).toBe(true);
    process.env.AGENT_FANOUT = "off";
    expect(fanoutEnabled()).toBe(false);
  });
});

describe("enqueueFanout (spawn N bounded children)", () => {
  it("spawns one A2A child per kept subtask", async () => {
    const { client, inserts } = fanoutSpy();
    const res = await enqueueFanout(
      client,
      "u1",
      args([{ task: "a" }, { task: "b" }, { task: "c" }]),
    );
    expect(res.spawned).toHaveLength(3);
    expect(res.dropped).toBe(0);
    expect(inserts.agent_messages).toBe(3);
    expect(inserts.agent_runs).toBe(3);
  });

  it("dedupes + caps at FANOUT_MAX_CHILDREN, reporting the dropped count", async () => {
    const { client, inserts } = fanoutSpy();
    const many = Array.from({ length: FANOUT_MAX_CHILDREN + 3 }, (_, i) => ({ task: `t${i}` }));
    const res = await enqueueFanout(client, "u1", args(many));
    expect(res.spawned).toHaveLength(FANOUT_MAX_CHILDREN);
    expect(res.dropped).toBe(3);
    expect(inserts.agent_runs).toBe(FANOUT_MAX_CHILDREN);
  });

  it("refuses a self-spawn (an agent fanning out to its own id)", async () => {
    const { client, inserts } = fanoutSpy({ id: "parent-id", slug: "researcher", name: "R" });
    let threw: unknown;
    try {
      await enqueueFanout(client, "u1", args([{ task: "a" }]));
    } catch (e) {
      threw = e;
    }
    expect(threw).toBeInstanceOf(Error);
    expect((threw as Error).message).toMatch(/yourself/i);
    expect(inserts.agent_runs).toBe(0); // nothing enqueued
  });

  it("stamps each child's payload with parent_depth + 1 (the recursion guard's depth)", async () => {
    const { client, rows } = fanoutSpy();
    await enqueueFanout(client, "u1", args([{ task: "a" }], 0));
    const msg = rows.agent_messages[0] as { payload: { context?: { _fanout_depth?: number } } };
    expect(msg.payload.context?._fanout_depth).toBe(1);
  });

  it("increments the stamped depth for a deeper parent (1 -> child depth 2)", async () => {
    const { client, rows } = fanoutSpy();
    await enqueueFanout(client, "u1", args([{ task: "a", context: { keep: true } }], 1));
    const msg = rows.agent_messages[0] as {
      payload: { context?: { _fanout_depth?: number; keep?: boolean } };
    };
    expect(msg.payload.context?._fanout_depth).toBe(2);
    expect(msg.payload.context?.keep).toBe(true); // original context preserved
  });
});

/**
 * THE MONEY BELT. Fan-out is the only writer that turns one call into N runs, so
 * it is the one place where "no ceiling" costs N times what it costs anywhere
 * else. These pin that an absent cap resolves the way every other writer resolves
 * it (`resolveMissionSpendCap`), and never reaches a child as a bare null.
 */
describe("enqueueFanout budget resolution (an absent cap is not a no-ceiling)", () => {
  it("splits the WORKSPACE ceiling across children when the caller supplied no cap", async () => {
    // The regression this exists for: the caller passed nothing, the path wrote
    // `?? null`, and null downstream means "somebody chose no ceiling". Four
    // children then ran with no spend limit at all.
    const { client, rows } = fanoutSpy(undefined, 8);
    await enqueueFanout(
      client,
      "u1",
      args([{ task: "a" }, { task: "b" }, { task: "c" }, { task: "d" }]),
    );
    expect(childSpendCaps(rows)).toEqual([2, 2, 2, 2]); // 8 / 4, and never null
  });

  it("reads the workspace ceiling ONCE per fan-out, not once per child", async () => {
    // The children carry a resolved number, so each child's own resolve
    // short-circuits before its query. N children must not mean N+1 reads.
    const { client, reads } = fanoutSpy(undefined, 8);
    await enqueueFanout(client, "u1", args([{ task: "a" }, { task: "b" }, { task: "c" }]));
    expect(reads.workspaces).toBe(1);
  });

  it("splits an explicitly supplied remaining budget instead of the workspace ceiling", async () => {
    const { client, rows } = fanoutSpy(undefined, 8);
    await enqueueFanout(client, "u1", {
      ...args([{ task: "a" }, { task: "b" }]),
      spend_cap_usd: 1,
    });
    expect(childSpendCaps(rows)).toEqual([0.5, 0.5]);
  });

  it("gives an exhausted parent's children a zero ceiling, never an absent one", async () => {
    // agent.spawn passes max(0, cap - spent). Zero must halt each child on its
    // first check; it must not read as "no limit was set".
    const { client, rows } = fanoutSpy(undefined, 8);
    await enqueueFanout(client, "u1", {
      ...args([{ task: "a" }, { task: "b" }]),
      spend_cap_usd: 0,
    });
    expect(childSpendCaps(rows)).toEqual([0, 0]);
  });

  it("inherits the workspace ceiling when the PARENT's own cap could not be read", async () => {
    // The regression, composed exactly as `agent.spawn` composes it. The parent's
    // `agent_runs` row is unreadable (errored SELECT, no run id, or a legacy row),
    // so `remainingMissionBudget` yields undefined. That must arrive as "nobody
    // said" and inherit the ceiling. It used to arrive as `null`, which
    // `resolveMissionSpendCap` returns verbatim without reading the workspace at
    // all, so one failed SELECT uncapped every child of the fan-out.
    const { client, rows, reads } = fanoutSpy(undefined, 8);
    const unknownParentCap = remainingMissionBudget(null, 0);
    expect(unknownParentCap).toBeUndefined();
    await enqueueFanout(client, "u1", {
      ...args([{ task: "a" }, { task: "b" }]),
      spend_cap_usd: unknownParentCap,
    });
    expect(childSpendCaps(rows)).toEqual([4, 4]); // 8 / 2, and never null
    expect(reads.workspaces).toBe(1); // the read that the null path skipped entirely
  });

  it("makes a caller-supplied null unspellable, so the guard is the compiler and not a convention", () => {
    // `fanout.server.ts` has said since day one that a caller-supplied null is "the
    // one answer this path must never give". That stayed prose for two months while
    // `agent.spawn` supplied exactly that null. It is now the parameter's type.
    // Widen `spend_cap_usd` back to `number | null` and this @ts-expect-error goes
    // unused, which fails `bunx tsc --noEmit`. Never invoked: it is a compile-time
    // assertion, and the behaviour it forbids must not be exercised.
    const forbidden = () =>
      enqueueFanout(null as unknown as SupabaseClient, "u1", {
        ...args([{ task: "a" }]),
        // @ts-expect-error a caller may not hand fan-out an explicit "no ceiling"
        spend_cap_usd: null,
      });
    expect(typeof forbidden).toBe("function");
  });

  it("obeys a workspace that cleared its own ceiling (the one legitimate uncapped child)", async () => {
    // A null default_mission_spend_cap_usd is a human decision on the record,
    // which resolveMissionSpendCap obeys everywhere else. Fan-out obeys it too:
    // this is the ONLY route by which a child may be uncapped.
    const { client, rows } = fanoutSpy(undefined, null);
    await enqueueFanout(client, "u1", args([{ task: "a" }, { task: "b" }]));
    expect(childSpendCaps(rows)).toEqual([null, null]);
  });
});
