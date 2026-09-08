/**
 * ── A PRESENCE FEED IS TWO HOPS ──────────────────────────────────────────────
 *
 * `listRunningNow` is the one live-work feed: the header, the rail and the
 * home poll it every few seconds. On the Inbox's read of 2026-09-08 it
 * carried `worker-total` of 1.0 to 1.1 s because it awaited the calls, the
 * tracks, the missions and the steps one after another, five sequential
 * round trips, each of which keys off the runs alone. Driven here with the
 * wire that counts rounds on a fixture where every one of those branches is
 * live: two rounds.
 */
import { describe, expect, it } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { readRunningNow } from "./track.functions";
import { FakeWire, drive, type Row } from "@/__tests__/a-wire-that-counts-rounds";

const AT = "2026-09-08T10:00:00.000Z";

const fixture = (table: string): Row[] => {
  switch (table) {
    case "agent_runs":
      return [
        {
          id: "r1",
          agent_slug: "builder",
          track_id: "t1",
          mission_id: "m1",
          created_at: AT,
          trace_id: "trace-1",
        },
      ];
    case "tool_calls":
      return [
        {
          trace_id: "trace-1",
          tool_name: "repo.read",
          args: { path: "src/App.tsx" },
          created_at: AT,
        },
      ];
    case "spine_tracks":
      return [{ id: "t1", station: "build", title: "Ship the thing" }];
    case "missions":
      return [{ id: "m1", title: "Mission one" }];
    case "mission_steps":
      return [{ mission_id: "m1", status: "running", sub_goal: "Wire the form" }];
    default:
      throw new Error(`unexpected read of ${table}`);
  }
};

describe("a presence feed is two hops", () => {
  it("reads the runs, then everything keyed on them together", async () => {
    const wire = new FakeWire(fixture);
    const { result, rounds } = await drive(
      wire,
      readRunningNow(wire as unknown as SupabaseClient<Database>, "ws-1"),
    );
    expect(rounds).toBe(2);
    expect(result).toHaveLength(1);
    const seat = result[0];
    expect(seat.now?.tool).toBe("repo.read");
    expect(seat.now?.objectLabel).toBe("App.tsx");
    for (const table of ["tool_calls", "spine_tracks", "missions", "mission_steps"]) {
      expect(wire.reads.filter((t) => t === table)).toHaveLength(1);
    }
  });

  it("answers an idle workspace in one round", async () => {
    const wire = new FakeWire((table) => (table === "agent_runs" ? [] : fixture(table)));
    const { result, rounds } = await drive(
      wire,
      readRunningNow(wire as unknown as SupabaseClient<Database>, "ws-1"),
    );
    expect(rounds).toBe(1);
    expect(result).toEqual([]);
  });
});
