/**
 * ── A STRIP READ IS TWO HOPS DEEP ────────────────────────────────────────────
 *
 * The shell's station strip mounts `listStudioSessions` on every
 * authenticated page. On 2026-09-08 its Server-Timing read worker-total
 * 3,734 ms and 3,856 ms on Helio Labs while every query in it takes
 * single-digit milliseconds: the handler awaited eleven reads one after
 * another. Eleven became three that day, and three became two on 09-09,
 * because the third round existed only to run four joins whose keys the
 * database already held.
 *
 * This drives the read with the wire that counts rounds
 * (`src/__tests__/a-wire-that-counts-rounds.ts`) on a fixture where every
 * branch that ever cost a hop is live: a builder run and another agent's run
 * on two missions, a proposed mission with a routed agent, a changeset with
 * files, a spec in the lineage, a trace with cost events, and a pending gate.
 *
 * THE FIXTURE THROWS ON THE READS THAT WENT. `studio_changes`, `prds`,
 * `artifact_lineage`, `agent_run_checkpoints`, `ai_events` and `agents` are
 * no longer read from this handler at all: their answers arrive inside the
 * second round, from one PostgREST aggregate and the three functions of
 * migration 20260909101000. If one of them comes back, this file says so by
 * name rather than by a round count that could be read as noise.
 */
import { describe, expect, it } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { readStudioSessions } from "./studio.functions";
import {
  FakeWire,
  argValue,
  drive,
  eqValue,
  type Filter,
  type Row,
} from "@/__tests__/a-wire-that-counts-rounds";

const AT = "2026-09-08T10:00:00.000Z";
const EARLIER = "2026-09-08T09:00:00.000Z";

const fixture = (table: string, _cols: string, filters: Filter[]): Row[] => {
  switch (table) {
    case "agent_runs": {
      const builder = eqValue(filters, "agent_slug") === "builder";
      return builder
        ? [
            {
              id: "r1",
              mission_id: "m1",
              status: "completed",
              created_at: EARLIER,
              agent_slug: "builder",
              /* Null on runs older than the column: their trace lives only on
                 the checkpoint, and `run_trace_costs` reads both places. */
              trace_id: null,
            },
          ]
        : [
            {
              id: "r2",
              mission_id: "m2",
              status: "running",
              created_at: AT,
              agent_slug: "shipper",
              trace_id: "trace-2",
            },
          ];
    }
    case "missions":
      if (eqValue(filters, "status") === "proposed") return [{ id: "m3" }];
      return [
        {
          id: "m1",
          title: "Build it",
          goal: "g",
          status: "running",
          created_at: EARLIER,
          updated_at: AT,
          archived_at: null,
          current_agent_id: null,
        },
        {
          id: "m2",
          title: "Ship it",
          goal: "g",
          status: "running",
          created_at: EARLIER,
          updated_at: AT,
          archived_at: null,
          current_agent_id: null,
        },
        {
          id: "m3",
          title: "Proposed",
          goal: "g",
          status: "proposed",
          created_at: EARLIER,
          updated_at: EARLIER,
          archived_at: null,
          current_agent_id: "agent-9",
        },
      ];
    case "studio_changesets":
      return [
        {
          id: "cs1",
          product_id: "p",
          mission_id: "m1",
          status: "open",
          repo: "r",
          branch: "b",
          pr_url: null,
          pr_number: null,
          title: "t",
          summary: null,
          created_at: AT,
          /* PostgREST's aggregate shape for the embed. */
          studio_changes: [{ count: 2 }],
        },
      ];
    case "agent_approvals":
      return [{ id: "ap1", mission_id: "m1" }];
    case "rpc:mission_spec_titles":
      return [{ mission_id: "m1", prd_id: "prd1", title: "The spec" }];
    case "rpc:mission_routed_stations":
      return [{ mission_id: "m3", agent_slug: "builder" }];
    case "rpc:run_trace_costs":
      return [
        { run_id: "r1", trace_id: "trace-1", cost_usd: 0.25 },
        { run_id: "r2", trace_id: "trace-2", cost_usd: 0.5 },
      ];
    default:
      throw new Error(`unexpected read of ${table}`);
  }
};

const run = (wire: FakeWire) =>
  drive(
    wire,
    readStudioSessions(wire as unknown as SupabaseClient, "user-1", {
      includeArchived: false,
      workspaceId: "ws-1",
    }),
  );

describe("a strip read is two hops deep", () => {
  it("answers the full fixture in two rounds", async () => {
    const wire = new FakeWire(fixture);
    const { result, rounds } = await run(wire);
    expect(rounds).toBe(2);
    expect(result.bounded).toBe(false);
    const byId = new Map(result.sessions.map((s) => [s.mission_id, s]));
    expect([...byId.keys()].sort()).toEqual(["m1", "m2", "m3"]);
    // Each kind keeps its own cost and status.
    expect(byId.get("m1")?.kind).toBe("build");
    expect(byId.get("m1")?.cost_usd).toBe(0.25);
    expect(byId.get("m1")?.run_status).toBe("completed");
    expect(byId.get("m2")?.kind).toBe("mission");
    expect(byId.get("m2")?.cost_usd).toBe(0.5);
    // The changeset carries its file count, the mission its spec and its gate.
    expect(byId.get("m1")?.changeset?.file_count).toBe(2);
    expect(byId.get("m1")?.prd).toEqual({ id: "prd1", title: "The spec" });
    expect(byId.get("m1")?.pending_approvals).toBe(1);
    // The proposed mission stands where its routed agent stands, not at the
    // first stage the proposed fallback would give it.
    expect(byId.get("m3")?.station).toBe("build");
  });

  it("asks for the cost of every run of both kinds, once", async () => {
    let asked: unknown = null;
    const wire = new FakeWire((table, cols, filters) => {
      if (table === "rpc:run_trace_costs") asked = argValue(filters, "p_run_ids");
      return fixture(table, cols, filters);
    });
    await run(wire);
    expect(wire.reads.filter((t) => t === "rpc:run_trace_costs")).toHaveLength(1);
    // Both kinds' runs, in one call: the old shape asked the checkpoints and
    // then ai_events, in two different rounds.
    expect(asked).toEqual(["r1", "r2"]);
  });

  it("never reads the six tables whose joins moved into the database", async () => {
    const wire = new FakeWire(fixture);
    await run(wire);
    for (const gone of [
      "studio_changes",
      "prds",
      "artifact_lineage",
      "agent_run_checkpoints",
      "ai_events",
      "agents",
    ]) {
      expect(wire.reads).not.toContain(gone);
    }
  });

  it("answers an empty workspace in one round", async () => {
    const wire = new FakeWire((table, cols, filters) =>
      table === "agent_runs" || table === "missions" ? [] : fixture(table, cols, filters),
    );
    const { result, rounds } = await run(wire);
    expect(rounds).toBe(1);
    expect(result.sessions).toEqual([]);
  });
});

/**
 * The two rows the LEFT JOINs exist for. Both are real on production: six
 * missions point at an agent row that no longer exists, and a spec the caller
 * cannot read would have taken its mission's whole lineage link with it if the
 * join had been an inner one.
 */
describe("a join that finds nothing weakens the claim, it does not drop the row", () => {
  it("a mission routed to an agent that is gone falls back to where an unstarted mission stands", async () => {
    const wire = new FakeWire((table, cols, filters) =>
      table === "rpc:mission_routed_stations"
        ? [{ mission_id: "m3", agent_slug: null }]
        : fixture(table, cols, filters),
    );
    const { result } = await run(wire);
    const m3 = result.sessions.find((s) => s.mission_id === "m3");
    // Position zero in the spine: a proposed mission has not moved, which is a
    // fact about the ordering rather than a guess at the work.
    expect(m3?.station).toBe("sense");
  });

  it("a spec whose title did not come back keeps the link and says the word", async () => {
    const wire = new FakeWire((table, cols, filters) =>
      table === "rpc:mission_spec_titles"
        ? [{ mission_id: "m1", prd_id: "prd1", title: null }]
        : fixture(table, cols, filters),
    );
    const { result } = await run(wire);
    expect(result.sessions.find((s) => s.mission_id === "m1")?.prd).toEqual({
      id: "prd1",
      title: "Spec",
    });
  });
});
