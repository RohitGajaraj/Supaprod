/**
 * ── A MISSION DETAIL IS THREE HOPS, AND ITS HANDOFFS ONE ─────────────────────
 *
 * `getMission` was nine sequential round trips that shipped every run's brief
 * and the whole state of every checkpoint (170 KB and five seconds on the run
 * screen, 2026-09-09, where the transcript read only `.messages` off it). The
 * run screen reads `listMissionHandoffs` now, one hop; `readMission` is three,
 * with the latest checkpoint per run cut to its trace, steps and memories in
 * the database. Driven on the wire that counts rounds.
 */
import { describe, expect, it } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { readMission, readMissionHandoffs } from "./missions.functions";
import { FakeWire, drive, type Filter, type Row } from "@/__tests__/a-wire-that-counts-rounds";

const AT = "2026-09-09T01:00:00.000Z";

const fixture = (table: string, _cols: string, _filters: Filter[]): Row[] | unknown => {
  switch (table) {
    case "missions":
      return [
        {
          id: "m1",
          title: "Ship it",
          goal: "g",
          status: "running",
          current_agent_id: null,
          hop_count: 1,
          created_at: AT,
          updated_at: AT,
          completed_at: null,
          replayed_from_mission_id: null,
          user_id: "user-1",
          workspace_id: "ws-1",
          auto_trigger_source: "auto",
        },
      ];
    case "agent_runs":
      return [
        {
          id: "r1",
          agent_slug: "builder",
          agent_name: "Builder",
          status: "completed",
          output: "Done.",
          created_at: AT,
          last_checkpoint_at: AT,
          spend_used_usd: 0.4,
        },
      ];
    case "agent_messages":
      return [
        {
          id: "msg1",
          from_agent_slug: "builder",
          to_agent_slug: "shipper",
          kind: "handoff",
          payload: {},
          source_run_id: "r1",
          source_trace_id: "trace-1",
          consumed_by_run_id: null,
          created_at: AT,
        },
      ];
    case "rpc:workspace_members_with_identity":
      return [{ user_id: "user-1", display_name: "Rohit", email: null }];
    case "rpc:latest_run_checkpoints":
      return [
        {
          run_id: "r1",
          step_index: 3,
          trace_id: "trace-1",
          steps: [{ kind: "tool", name: "repo.read" }],
          recalled_memories: ["a memory"],
        },
      ];
    case "tool_calls":
      return [
        {
          id: "c1",
          trace_id: "trace-1",
          tool_name: "repo.read",
          ok: true,
          error: null,
          latency_ms: 10,
          created_at: AT,
        },
      ];
    case "ai_events":
      return [{ prompt_tokens: 100, completion_tokens: 20 }];
    default:
      throw new Error(`unexpected read of ${table}`);
  }
};

describe("a mission detail is three hops", () => {
  it("reads the mission, its runs and its messages together, then the identity and checkpoints, then the calls and tokens", async () => {
    const wire = new FakeWire(fixture);
    const { result, rounds } = await drive(
      wire,
      readMission(wire as unknown as SupabaseClient<Database>, "user-1", "m1"),
    );
    expect(rounds).toBe(3);
    expect(wire.reads.filter((t) => t === "missions")).toHaveLength(1);
    expect(wire.reads).toContain("rpc:latest_run_checkpoints");
    expect(wire.reads).not.toContain("agent_run_checkpoints");
    expect(result.mission.captain?.owner_display_name).toBe("Rohit");
    expect(result.mission.captain?.auto_dispatched).toBe(true);
    expect(result.mission.captain?.owner_is_self).toBe(true);
    const hop = result.hops[0];
    expect(hop.trace_id).toBe("trace-1");
    expect(hop.steps).toEqual([{ kind: "tool", name: "repo.read" }]);
    expect(hop.recalled_memories).toEqual(["a memory"]);
    expect(hop.tool_calls.map((c) => c.tool_name)).toEqual(["repo.read"]);
    expect(hop.input).toBeNull();
    expect(result.usage).toEqual({
      cost_usd: 0.4,
      tokens_in: 100,
      tokens_out: 20,
      trace_id: "trace-1",
    });
    expect(result.messages).toHaveLength(1);
  });

  it("the run screen's handoff rows are one hop", async () => {
    const wire = new FakeWire(fixture);
    const { result, rounds } = await drive(
      wire,
      readMissionHandoffs(wire as unknown as SupabaseClient<Database>, "m1"),
    );
    expect(rounds).toBe(1);
    expect(wire.reads).toEqual(["agent_messages"]);
    expect(result.messages[0].id).toBe("msg1");
  });
});
