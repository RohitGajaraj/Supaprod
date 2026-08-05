/**
 * THE BUILDER MUST BE SENT TO WORK WITH ITS BRIEF, NOT WITH ITS HEADLINE.
 *
 * THE DEFECT THIS PREVENTS, found 2026-08-06. `nativeBuildDriver.dispatch`
 * accepted a whole `BuildSpec` and persisted exactly one field of it. The
 * acceptance criteria — the standing success-metric clauses of the spec's
 * Outcome Contract, computed by `dispatchStudioSession` for the express purpose
 * of telling the engine the bar — never reached `missions.goal`, which is the
 * text the agent loop is briefed with. The build was then graded against
 * criteria it had never been shown.
 *
 * WHY NOTHING CAUGHT IT. Every field past `goal` is optional on `BuildSpec`, so
 * dropping one is not a type error. The sibling openhands adapter folded them
 * in correctly, so a reader auditing "does the seam carry the bar" found a
 * correct answer in the wrong file. And the native adapter's only existing
 * coverage was `resolve.server.test.ts`, which asserts WHICH driver comes back,
 * never WHAT it writes.
 *
 * So this file asserts on the persisted row, not on the return value: the
 * mission row that reaches the database client must contain every criterion
 * text, and so must the `agent_runs.input` the loop replays on resume.
 */
import { describe, expect, test, afterAll, mock } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BuildDriverContext, BuildSpec } from "./driver";
import { buildDelegateTask } from "./openhands.server";

/**
 * Captured BEFORE the mock is installed so `afterAll` can put the real module
 * back. bun's module mocks are process-wide and this file shares a process with
 * every suite that uses the genuine handoff helpers; without the restore,
 * running order would decide whether those pass.
 */
const realHandoff = await import("@/lib/ai/handoff.server");

/**
 * A stand-in for `createMission` that performs the ONE write this test is about
 * — the `missions` insert — through the caller's client, and skips what the
 * real function does around it (a model call for the title, analytics, the
 * funnel milestone, the stage event), none of which touch the goal.
 *
 * The double's fidelity on the single point that matters is pinned by
 * "the real createMission persists input.goal verbatim" below, so this cannot
 * quietly drift into testing a shape production does not have.
 */
mock.module("@/lib/ai/handoff.server", () => ({
  ...realHandoff,
  createMission: async (
    supabase: SupabaseClient,
    userId: string,
    workspaceId: string,
    input: { title: string; goal: string; starting_agent_id: string; build_driver?: string },
  ) => {
    const { data } = await supabase
      .from("missions")
      .insert({
        user_id: userId,
        workspace_id: workspaceId,
        title: input.title,
        goal: input.goal,
        current_agent_id: input.starting_agent_id,
        status: "running",
        ...(input.build_driver ? { build_driver: input.build_driver } : {}),
      })
      .select("*")
      .single();
    return data;
  },
}));

const { nativeBuildDriver, buildNativeGoal } = await import("./native.server");

afterAll(() => {
  mock.module("@/lib/ai/handoff.server", () => realHandoff);
});

const CRITERIA = ["p95 latency stays under 200ms", "an account locks out after 5 failed attempts"];

const SPEC: BuildSpec = {
  goal: "Add a rate limiter to the login endpoint",
  acceptanceCriteria: CRITERIA,
};

/** Records every insert so the test can assert on the row, not the return value. */
function fakeDb() {
  const inserts: Array<{ table: string; row: Record<string, unknown> }> = [];
  const client = {
    from(table: string) {
      return {
        insert(row: Record<string, unknown>) {
          inserts.push({ table, row });
          const returned = { id: table === "missions" ? "mission-1" : "run-1", ...row };
          return {
            select: () => ({
              single: async () => ({ data: returned, error: null }),
              maybeSingle: async () => ({ data: returned, error: null }),
            }),
          };
        },
      };
    },
  };
  return { client: client as unknown as SupabaseClient, inserts };
}

function ctxFor(client: SupabaseClient, over: Partial<BuildDriverContext> = {}) {
  return {
    supabase: client,
    userId: "u1",
    workspaceId: "w1",
    agent: { id: "a1", slug: "builder", name: "Studio" },
    ...over,
  } as BuildDriverContext;
}

const rowFor = (inserts: ReturnType<typeof fakeDb>["inserts"], table: string) =>
  inserts.find((i) => i.table === table)?.row ?? {};

describe("nativeBuildDriver.dispatch carries the acceptance bar into the record", () => {
  test("every criterion text appears in the persisted missions.goal", async () => {
    const db = fakeDb();
    await nativeBuildDriver.dispatch(ctxFor(db.client), SPEC);

    const goal = rowFor(db.inserts, "missions").goal as string;
    expect(goal).toContain(SPEC.goal);
    expect(goal).toContain("Acceptance criteria (every one must hold):");
    for (const c of CRITERIA) expect(goal).toContain(`- ${c}`);
  });

  test("the queued run is briefed with the same text, so a resume is not briefed with less", async () => {
    const db = fakeDb();
    await nativeBuildDriver.dispatch(ctxFor(db.client), SPEC);

    const goal = rowFor(db.inserts, "missions").goal as string;
    expect(rowFor(db.inserts, "agent_runs").input).toBe(goal);
  });

  test("the rest of the brief rides too: guardrails, design references, files in scope", async () => {
    const db = fakeDb();
    await nativeBuildDriver.dispatch(ctxFor(db.client), {
      ...SPEC,
      guardrails: ["no new dependencies"],
      designPointers: ["docs/design/DESIGN-SYSTEM.md"],
      targetFiles: ["src/routes/login.tsx"],
    });

    const goal = rowFor(db.inserts, "missions").goal as string;
    expect(goal).toContain("Guardrails (hard constraints):\n- no new dependencies");
    expect(goal).toContain("Design references:\n- docs/design/DESIGN-SYSTEM.md");
    expect(goal).toContain("Files in scope:\n- src/routes/login.tsx");
  });

  test("a bare goal stays a bare goal: no empty headings, no invented bar", async () => {
    const db = fakeDb();
    await nativeBuildDriver.dispatch(ctxFor(db.client), { goal: "just build it" });

    const goal = rowFor(db.inserts, "missions").goal as string;
    expect(goal).toBe("just build it");
    expect(goal).not.toContain("Acceptance criteria");
  });

  test("the mission title is unchanged by the fold (still the goal's first line)", async () => {
    const db = fakeDb();
    await nativeBuildDriver.dispatch(ctxFor(db.client), {
      ...SPEC,
      goal: "Add a rate limiter\nand a lockout",
    });

    expect(rowFor(db.inserts, "missions").title).toBe("Add a rate limiter");
  });

  test("an explicit missionTitle still wins over the goal's first line", async () => {
    const db = fakeDb();
    await nativeBuildDriver.dispatch(ctxFor(db.client, { missionTitle: "Studio · login" }), SPEC);

    expect(rowFor(db.inserts, "missions").title).toBe("Studio · login");
  });
});

describe("the two drivers state the bar identically", () => {
  /**
   * A criterion must read the same to whichever engine is dispatched, otherwise
   * comparing two drivers' work orders compares two different briefs. The
   * native fold is a deliberate copy of `buildDelegateTask` rather than an
   * import (that module pulls the delegate provider seam and its env reads, and
   * native dispatch must work with delegation switched off), so the copy is
   * pinned here instead of trusted.
   */
  test("buildNativeGoal renders the same text as buildDelegateTask", () => {
    const full: BuildSpec = {
      ...SPEC,
      guardrails: ["no new dependencies"],
      designPointers: ["docs/design/DESIGN-SYSTEM.md"],
      targetFiles: ["src/routes/login.tsx"],
    };
    expect(buildNativeGoal(full)).toBe(buildDelegateTask(full));
    expect(buildNativeGoal({ goal: "bare" })).toBe(buildDelegateTask({ goal: "bare" }));
  });
});

describe("the double above matches the real writer", () => {
  /**
   * The assertions in this file read a row written by a stand-in for
   * `createMission`. That is only evidence about production while the real
   * function still writes the goal it is handed, verbatim, into the goal
   * column. If someone rewrites that insert, this fails and says so, rather
   * than leaving a green suite asserting against a shape nobody ships.
   */
  test("the real createMission persists input.goal verbatim into missions.goal", () => {
    const src = readFileSync(join(import.meta.dir, "..", "ai", "handoff.server.ts"), "utf8");
    const insert = src.slice(src.indexOf("export async function createMission"));
    expect(insert).toContain('.from("missions")');
    expect(insert).toContain("goal: input.goal");
  });
});
