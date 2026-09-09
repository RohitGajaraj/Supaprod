/**
 * ── A STRIP READ IS THREE HOPS DEEP ──────────────────────────────────────────
 *
 * The shell's station strip mounts `listStudioSessions` on every
 * authenticated page. On 2026-09-08 its Server-Timing read worker-total
 * 3,734 ms and 3,856 ms on Helio Labs while every query in it takes
 * single-digit milliseconds: the handler awaited eleven reads one after
 * another. This drives the read behind it with the wire that counts rounds
 * (`src/__tests__/a-wire-that-counts-rounds.ts`) on a fixture where every
 * branch that used to cost a hop is live: a builder run and another agent's
 * run on two missions, a proposed mission with a routed agent, a changeset
 * with files, a spec in the lineage, a checkpoint trace with cost events, and
 * a pending gate.
 */
import { describe, expect, it } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { readStudioSessions } from "./studio.functions";
import {
  FakeWire,
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
                 the checkpoint, which is why that read stays. */
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
        },
      ];
    case "studio_changes":
      return [{ changeset_id: "cs1" }, { changeset_id: "cs1" }];
    case "agent_approvals":
      return [{ id: "ap1", mission_id: "m1" }];
    case "artifact_lineage":
      return [{ parent_id: "prd1", child_id: "m1" }];
    case "prds":
      return [{ id: "prd1", title: "The spec" }];
    case "agent_run_checkpoints":
      return [
        { run_id: "r1", step_index: 2, trace: "trace-1" },
        { run_id: "r2", step_index: 1, trace: "trace-2" },
      ];
    case "ai_events":
      return [
        { trace_id: "trace-1", est_cost_usd: 0.25 },
        { trace_id: "trace-2", est_cost_usd: 0.5 },
      ];
    case "agents":
      return [{ id: "agent-9", slug: "builder" }];
    default:
      throw new Error(`unexpected read of ${table}`);
  }
};

describe("a strip read is three hops deep", () => {
  it("answers the full fixture in three rounds", async () => {
    const wire = new FakeWire(fixture);
    const { result, rounds } = await drive(
      wire,
      readStudioSessions(wire as unknown as SupabaseClient, "user-1", {
        includeArchived: false,
        workspaceId: "ws-1",
      }),
    );
    expect(rounds).toBe(3);
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

  it("reads the checkpoints once for both run kinds, and the cost events once", async () => {
    const wire = new FakeWire(fixture);
    await drive(
      wire,
      readStudioSessions(wire as unknown as SupabaseClient, "user-1", {
        includeArchived: false,
        workspaceId: "ws-1",
      }),
    );
    expect(wire.reads.filter((t) => t === "agent_run_checkpoints")).toHaveLength(1);
    expect(wire.reads.filter((t) => t === "ai_events")).toHaveLength(1);
  });

  it("answers an empty workspace in one round", async () => {
    const wire = new FakeWire((table) =>
      table === "agent_runs" || table === "missions" ? [] : fixture(table, "", []),
    );
    const { result, rounds } = await drive(
      wire,
      readStudioSessions(wire as unknown as SupabaseClient, "user-1", {
        includeArchived: false,
        workspaceId: "ws-1",
      }),
    );
    expect(rounds).toBe(1);
    expect(result.sessions).toEqual([]);
  });
});

/**
 * Measured on production 2026-09-09: for the 300 newest runs `agent_runs.trace_id`
 * and the latest checkpoint's `state->>'traceId'` agree in every case, and for the
 * 300 oldest the run column is null in all 185 that have checkpoints. So the
 * column is newer than those runs: the checkpoint read is the only place a
 * pre-August trace exists, and it must stay, but it should only be asked about
 * the runs whose own row does not carry one.
 */
describe("the run carries its own trace, where it has one", () => {
  it("asks the checkpoints only about runs whose row has no trace", async () => {
    const asked: string[][] = [];
    const wire = new FakeWire((table, _cols, filters) => {
      if (table === "agent_run_checkpoints") {
        const ids = filters.find((f) => f.op === "in" && f.col === "run_id")?.value as string[];
        asked.push(ids ?? []);
        return [{ run_id: "r1", step_index: 2, trace: "trace-1" }];
      }
      return fixture(table, "", filters);
    });
    const { result } = await drive(
      wire,
      readStudioSessions(wire as unknown as SupabaseClient, "user-1", {
        includeArchived: false,
        workspaceId: "ws-1",
      }),
    );
    // r2 carries its own trace; only r1 is asked about.
    expect(asked).toEqual([["r1"]]);
    // And both still get their cost, from whichever place the trace was written.
    const byId = new Map(result.sessions.map((s) => [s.mission_id, s]));
    expect(byId.get("m1")?.cost_usd).toBe(0.25);
    expect(byId.get("m2")?.cost_usd).toBe(0.5);
  });
});
