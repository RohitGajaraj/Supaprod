/**
 * ── A MARK LIST IS ONE HOP ───────────────────────────────────────────────────
 *
 * The shell's mark stack and the live-agents hook mount on every page and
 * read `listMissions` for seven fields a mission; on 2026-09-09 that call was
 * 170 KB and five seconds on the run screen. `readMissionMarks` answers the
 * seven fields in one round trip. Driven on the wire that counts rounds.
 */
import { describe, expect, it } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { readMissionMarks } from "./missions.functions";
import { FakeWire, drive } from "@/__tests__/a-wire-that-counts-rounds";

describe("a mark list is one hop", () => {
  it("reads the marks in one round and names the mission's run", async () => {
    const wire = new FakeWire((table) =>
      table === "rpc:mission_marks"
        ? [
            {
              id: "m1",
              title: "Ship it",
              status: "running",
              created_at: "2026-09-08T23:00:00.000Z",
              updated_at: "2026-09-09T00:00:00.000Z",
              completed_at: null,
              current_agent_id: "a1",
              current_agent_slug: "builder",
              track_id: "t1",
            },
            {
              id: "m2",
              title: "Done",
              status: "completed",
              created_at: "2026-09-07T00:00:00.000Z",
              updated_at: "2026-09-08T00:00:00.000Z",
              completed_at: "2026-09-08T00:00:00.000Z",
              current_agent_id: null,
              current_agent_slug: null,
              track_id: null,
            },
          ]
        : [],
    );
    const { result, rounds } = await drive(
      wire,
      readMissionMarks(wire as unknown as SupabaseClient<Database>, "ws-1"),
    );
    expect(rounds).toBe(1);
    expect(wire.reads).toEqual(["rpc:mission_marks"]);
    expect(result.missions.map((m) => m.id)).toEqual(["m1", "m2"]);
    expect(result.missions[0].trackId).toBe("t1");
    expect(result.missions[0].current_agent_slug).toBe("builder");
    expect(result.missions[1].completed_at).toBe("2026-09-08T00:00:00.000Z");
  });
});
