/**
 * A QUEUED RUN DOES NOT RESUME ONTO AN AGENT ITS OWNER SWITCHED OFF.
 *
 * `runAgentLoop` has refused a fresh dispatch of a disabled agent for a long
 * time, and its comment said "Queued child runs resume via `resumeAgentLoop`,
 * not here; that path re-checks separately if needed." Measured 2026-08-20:
 * **it did not re-check, and did not even select the column.** So disabling an
 * agent stopped new work while work already in the pipe carried on.
 *
 * These two tests pin the two decisions in the fix, not the mechanics of it:
 *
 *   1. the run is CANCELLED rather than left queued, because a run nothing will
 *      ever resume and nothing ever ends is the shape of the 130 approvals
 *      raised and never decided;
 *   2. the cancel carries its precondition IN THE STATEMENT, so a run that
 *      finished between the read and the write is not reopened as cancelled.
 *
 * The second is the one that would rot silently. Two sweepers reach this line at
 * once by design, and a lost race that quietly overwrites a terminal status
 * looks exactly like a working system until somebody asks why a completed run
 * says cancelled.
 */
import { describe, expect, test } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { makeFakeDb, type FakeRow } from "@/lib/ai/fake-postgrest.test";
import { resumeAgentLoop } from "@/lib/ai/loop.server";

const RUN = "11111111-1111-4111-8111-111111111111";
const AGENT = "22222222-2222-4222-8222-222222222222";
const USER = "33333333-3333-4333-8333-333333333333";

function seed(over: { enabled?: boolean; status?: string } = {}): Record<string, FakeRow[]> {
  return {
    agent_runs: [
      {
        id: RUN,
        user_id: USER,
        agent_id: AGENT,
        agent_slug: "builder",
        agent_name: "Engineer",
        input: "ship it",
        workspace_id: "44444444-4444-4444-8444-444444444444",
        status: over.status ?? "queued",
        mission_id: null,
      },
    ],
    agents: [
      {
        id: AGENT,
        user_id: USER,
        slug: "builder",
        name: "Engineer",
        role: "build",
        system_prompt: "",
        enabled: over.enabled ?? false,
        max_tool_risk: "low",
      },
    ],
  };
}

describe("resumeAgentLoop, when the agent has been switched off", () => {
  test("cancels the run rather than leaving it queued forever", async () => {
    const db = makeFakeDb(seed({ enabled: false }));
    const out = await resumeAgentLoop(db as unknown as SupabaseClient, RUN);

    expect(db.tables.agent_runs[0].status).toBe("cancelled");
    expect(out.halted?.kind).toBe("agent-disabled");
    expect(out.run_id).toBe(RUN);
    // It stopped before doing any work at all.
    expect(out.steps).toEqual([]);
    expect(out.approvals_queued).toBe(0);
  });

  test("does not reopen a run that reached a terminal status first", async () => {
    /*
     * The race this guards, made deterministic: the run finishes between the
     * read and the write, which is ordinary rather than exceptional because
     * overlapping sweeper ticks both reach this line.
     */
    const db = makeFakeDb(seed({ enabled: false }), {
      beforeStatement: (info, tables) => {
        if (info.mode !== "update") return;
        const run = tables.agent_runs.find((r) => r.id === RUN);
        if (run && run.status === "queued") run.status = "completed";
      },
    });

    await resumeAgentLoop(db as unknown as SupabaseClient, RUN);

    // Still completed. A finished run is not rewritten as cancelled by a
    // sweeper that read it a moment earlier.
    expect(db.tables.agent_runs[0].status).toBe("completed");
  });
});
