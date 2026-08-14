/**
 * THE SWEEPER COULD HALT A LIVE MISSION, AND COUNT WORK IT DID NOT DO.
 *
 * (1) THE ONE MISSION WRITE IN THIS FILE WITH NO GUARD. Four passes update
 * missions here; three of them carry the status they were read at and read
 * their rows back (`.eq("status","blocked")`, `.eq("status","queued")`,
 * `.in("status",["running","in_progress"])`, each with `.select("id")`). The
 * give-up pass did neither: `.update({status:"halted"}).in("id", toAbandon)`.
 * The list it halts is built from reads taken earlier in the same tick, behind
 * a resume pass and an advance pass that can each take seconds, so a mission
 * that planned, dispatched and finished in that window was halted anyway.
 *
 * (2) A LOST CLAIM COUNTED AS A RESUME. resumeAgentLoop now refuses to replay a
 * run another worker holds, and says so with claim_lost. A sweeper that pushes
 * every returned result onto `resumed` reports fifteen resumes on a tick that
 * did one, which is the reporting equivalent of the bug it just fixed.
 */
import { describe, expect, test } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { makeFakeDb, type FakeRow } from "@/lib/ai/fake-postgrest.test";
import { haltAbandonedMissions, resumeRuns } from "./resume-runs";
import type { LoopResult } from "@/lib/ai/loop.server";

const NOW = "2026-08-14T12:00:00.000Z";

const mission = (id: string, over: FakeRow = {}): FakeRow => ({
  id,
  status: "running",
  updated_at: "2026-08-14T11:00:00.000Z",
  ...over,
});

describe("haltAbandonedMissions", () => {
  test("a mission that finished mid-tick is not halted", async () => {
    const db = makeFakeDb(
      { missions: [mission("live"), mission("dead")] },
      {
        beforeStatement: (info, tables) => {
          if (info.mode !== "update") return;
          const live = tables.missions.find((m) => m.id === "live");
          if (live && live.status === "running") live.status = "completed";
        },
      },
    );
    const out = await haltAbandonedMissions(db as unknown as SupabaseClient, ["live", "dead"], NOW);
    const byId = Object.fromEntries(db.tables.missions.map((m) => [m.id, m.status]));
    expect(byId.live).toBe("completed");
    expect(byId.dead).toBe("halted");
    expect(out.halted).toEqual(["dead"]);
  });

  test("nothing to abandon is not a query", async () => {
    const db = makeFakeDb({ missions: [mission("a")] });
    const out = await haltAbandonedMissions(db as unknown as SupabaseClient, [], NOW);
    expect(out.halted).toEqual([]);
    expect(db.statements.length).toBe(0);
  });

  test("an unplanned mission that really is stuck still gets halted", async () => {
    const db = makeFakeDb({ missions: [mission("a", { status: "in_progress" })] });
    const out = await haltAbandonedMissions(db as unknown as SupabaseClient, ["a"], NOW);
    expect(out.halted).toEqual(["a"]);
    expect(db.tables.missions[0].status).toBe("halted");
    expect(db.tables.missions[0].updated_at).toBe(NOW);
  });
});

describe("resumeRuns", () => {
  const result = (over: Partial<LoopResult> = {}): LoopResult => ({
    trace_id: "t",
    agent_slug: "builder",
    steps: [],
    final: "done",
    approvals_queued: 0,
    ...over,
  });

  test("a run another worker holds is reported as skipped, never as resumed", async () => {
    const out = await resumeRuns(["a", "b"], async (id) =>
      id === "a"
        ? result({ claim_lost: true, final: "Already being resumed by another worker." })
        : result(),
    );
    expect(out.resumed).toEqual(["b"]);
    expect(out.skipped).toEqual(["a"]);
    expect(out.failed).toEqual([]);
  });

  test("a throwing resume is still reported as a failure, not a skip", async () => {
    const out = await resumeRuns(["a"], async () => {
      throw new Error("model unreachable");
    });
    expect(out.resumed).toEqual([]);
    expect(out.skipped).toEqual([]);
    expect(out.failed).toEqual([{ id: "a", error: "model unreachable" }]);
  });
});
