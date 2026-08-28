/**
 * `learning.record`, in one file because two files cannot own one module mock.
 *
 * ── WHY THIS IS MERGED (F-147) ─────────────────────────────────────────────
 * This was two files — `learning-record-attaches-to-its-track` and
 * `learning-record-memory-failure` — and **both installed a process-wide
 * `mock.module` for `@/lib/ai/memory.server` and `@/lib/observability/errors`
 * at module top level.**
 *
 * `mock.module` in Bun is process-wide and the calls run at IMPORT time, before
 * any test in either file executes. So the second file to be imported
 * overwrote the first one's mock, the first file's tests then ran against the
 * second file's stub, and the first file's `afterAll` restored the REAL module
 * before the second file's tests had run at all.
 *
 * Both files were written carefully. Both captured the real modules first and
 * both restored them in `afterAll`, which S1 spotted and which is exactly why
 * restoring is not the fix: **the damage is done at import time, not at call
 * time.** Two owners of one module cannot be made safe by tidying up after.
 *
 * The mocks below are the failure file's, because they are a strict superset:
 * controllable through module-level state, defaulted in `beforeEach` to exactly
 * what the resolution tests used to get from their fixed stubs.
 *
 * Recorded in `a-module-mock-is-process-wide.test.ts`, which freezes the
 * remaining collisions so this set can only shrink.
 */

import { describe, it, expect, beforeEach, afterAll, mock } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ToolDef } from "./registry.server";

const realMemory = await import("@/lib/ai/memory.server");
const realErrors = await import("@/lib/observability/errors");

type RememberResult = { id: string | null; supersedes: string[]; error: string | null };

let rememberResult: RememberResult;
let rememberThrows: Error | null = null;
let recorded: Array<{ message: string; ctx: Record<string, unknown> }> = [];

mock.module("@/lib/ai/memory.server", () => ({
  ...realMemory,
  rememberOutcome: async (): Promise<RememberResult> => {
    if (rememberThrows) throw rememberThrows;
    return rememberResult;
  },
}));

mock.module("@/lib/observability/errors", () => ({
  ...realErrors,
  recordErrorEvent: async (err: unknown, ctx: Record<string, unknown> = {}) => {
    recorded.push({ message: err instanceof Error ? err.message : String(err), ctx });
    return true;
  },
}));

const { TOOL_REGISTRY } = await import("./registry.server");
const learningRecord = TOOL_REGISTRY["learning.record"] as ToolDef;

// ── Resolution fixtures and helpers (was learning-record-attaches-to-its-track)
const SPEC_ON_THE_TRACK = "11111111-1111-4111-8111-111111111111";
const SPEC_THE_AGENT_NAMED = "22222222-2222-4222-8222-222222222222";
const SPEC_VIA_MISSION = "33333333-3333-4333-8333-333333333333";

type Options = {
  /** What `spine_track_members` holds for this track, newest first. */
  trackSpecs?: string[];
  /** What the mission -> decision hop resolves to, when it resolves. */
  missionSpec?: string | null;
  /** Which bet each spec belongs to. */
  oppBySpec?: Record<string, string | null>;
};

function fakeDb(opts: Options = {}) {
  const inserted: Array<Record<string, unknown>> = [];
  const reads: string[] = [];
  const client = {
    from(table: string) {
      reads.push(table);
      if (table === "spine_track_members") {
        // select -> eq(track) -> eq(kind) -> order -> limit -> maybeSingle
        //
        // F-65 gave this tool a SECOND read of this table, for the decision the
        // verdict grades. So the kind is recorded too: the assertion below is
        // that a spec already in hand is not looked up again, and it must stay
        // about the SPEC rather than about the table.
        return {
          select: () => ({
            eq: () => ({
              eq: (_col: string, kind: string) => {
                reads.push(`spine_track_members:${kind}`);
                return {
                  order: () => ({
                    limit: () => ({
                      maybeSingle: async () => ({
                        data:
                          kind === "prd" && opts.trackSpecs?.length
                            ? { artifact_id: opts.trackSpecs[0] }
                            : null,
                        error: null,
                      }),
                    }),
                  }),
                };
              },
            }),
          }),
        };
      }
      if (table === "decisions") {
        return {
          select: () => ({
            eq: () => ({
              not: () => ({
                order: () => ({
                  limit: () => ({
                    maybeSingle: async () => ({
                      data: opts.missionSpec ? { prd_id: opts.missionSpec } : null,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "prds") {
        return {
          select: () => ({
            eq: (_c: string, id: unknown) => ({
              maybeSingle: async () => ({
                data: {
                  id: String(id),
                  workspace_id: "ws-1",
                  opportunity_id: opts.oppBySpec?.[String(id)] ?? null,
                  title: "Saved address at checkout",
                },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "opportunities") {
        return {
          select: () => ({
            eq: (_c: string, id: unknown) => ({
              maybeSingle: async () => ({
                data: {
                  id: String(id),
                  impact: 4,
                  confidence: 5,
                  ease: 3,
                  ice_score: 60,
                  title: "Stop losing the saved address",
                },
                error: null,
              }),
            }),
          }),
          update: () => ({ eq: async () => ({ error: null }) }),
        };
      }
      if (table === "learnings") {
        return {
          insert: (row: Record<string, unknown>) => {
            inserted.push(row);
            return {
              select: () => ({
                single: async () => ({ data: { id: "learning-1" }, error: null }),
              }),
            };
          },
        };
      }
      throw new Error(`unexpected table in this test: ${table}`);
    },
  } as unknown as SupabaseClient;
  return { client, inserted, reads };
}

type Ctx = {
  missionId?: string | null;
  trackId?: string | null;
  prdArg?: string;
};

async function record(db: SupabaseClient, ctx: Ctx) {
  return (await learningRecord.run(
    {
      summary: "The saved address still drops for returning customers.",
      verdict: "missed",
      ...(ctx.prdArg ? { prd_id: ctx.prdArg } : {}),
    },
    {
      supabase: db,
      userId: "user-1",
      agentSlug: "analyst",
      missionId: ctx.missionId ?? null,
      trackId: ctx.trackId ?? null,
      workspaceId: "ws-1",
    },
  )) as {
    learning_id: string;
    opportunity_id: string | null;
  };
}

// ── Memory-failure fixtures and helpers (was learning-record-memory-failure)
const PRD_ID = "11111111-1111-4111-8111-111111111111";

/** Minimal Supabase stand-in covering exactly the reads/writes this tool makes
 *  when it is handed a prd_id: the spec, the decision lookup (F-65), the bet,
 *  the re-score, and the learnings insert that must survive a memory miss.
 *  It THROWS on any other table on purpose — that is what caught F-65's new
 *  query rather than letting it pass silently against a permissive fake. */
function memoryFailureDb() {
  const inserted: Array<Record<string, unknown>> = [];
  const client = {
    from(table: string) {
      if (table === "prds") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  opportunity_id: null,
                  workspace_id: "ws-1",
                  title: "Inline approvals",
                },
                error: null,
              }),
            }),
          }),
        };
      }
      /*
       * F-65 added a decision lookup: `learning.record` now resolves the bet
       * whose forecast the verdict settles, so the outcome stops being an orphan
       * (133 production learnings carried decision_id NULL).
       *
       * Returns NO ROW on purpose. This test is about a memory-write failure
       * being reported rather than swallowed, and the tool must behave
       * identically whether or not a decision resolves — so the case exercised
       * here is the one where none does, which is also the honest default.
       */
      if (table === "decisions") {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  maybeSingle: async () => ({ data: null, error: null }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "learnings") {
        return {
          insert: (row: Record<string, unknown>) => {
            inserted.push(row);
            return {
              select: () => ({
                single: async () => ({ data: { id: "learning-1" }, error: null }),
              }),
            };
          },
        };
      }
      throw new Error(`unexpected table in this test: ${table}`);
    },
  } as unknown as SupabaseClient;
  return { client, inserted };
}

const run = (db: SupabaseClient) =>
  learningRecord.run(
    {
      summary: "Inline approvals cut the wait, activation did not move.",
      verdict: "mixed",
      prd_id: PRD_ID,
    },
    {
      supabase: db,
      userId: "user-1",
      agentSlug: "critic",
      missionId: "mission-1",
      workspaceId: "ws-1",
    },
  ) as Promise<{
    learning_id: string;
    outcome_memory_id: string | null;
    outcome_memory_error: string | null;
  }>;

/*
 * ONE restore for the whole file, and it is now honest: nothing else in the
 * process is holding a stub for these two modules while these tests run.
 */
afterAll(() => {
  mock.module("@/lib/ai/memory.server", () => realMemory);
  mock.module("@/lib/observability/errors", () => realErrors);
});

/*
 * The defaults the resolution tests used to get from their own fixed stubs.
 * Set for EVERY test in the file so a memory-failure case cannot leak its
 * configured failure into a resolution case that runs after it — which is the
 * same cross-contamination this merge exists to remove, one level down.
 */
beforeEach(() => {
  rememberResult = { id: "mem-1", supersedes: [], error: null };
  rememberThrows = null;
  recorded = [];
});

describe("a verdict recorded by the driver finds its own spec", () => {
  it("reads the spec off the track when the agent named none", async () => {
    // THE DEFECT, exactly. This is the driver's route: no prd_id argument, no
    // mission at Learn, and until now no third option.
    const { client, inserted } = fakeDb({
      trackSpecs: [SPEC_ON_THE_TRACK],
      oppBySpec: { [SPEC_ON_THE_TRACK]: "opp-7" },
    });

    await record(client, { trackId: "track-1" });

    expect(inserted[0].prd_id).toBe(SPEC_ON_THE_TRACK);
  });

  it("reaches the bet through that spec, which is the whole point", async () => {
    // An unattached verdict is not merely untidy. `opportunity_id` is what lets it
    // re-rank the bet, reach /decide, and reach the promotion bar. Asserting the
    // prd_id alone would pass while the thing it exists for stayed broken.
    const { client, inserted } = fakeDb({
      trackSpecs: [SPEC_ON_THE_TRACK],
      oppBySpec: { [SPEC_ON_THE_TRACK]: "opp-7" },
    });

    const out = await record(client, { trackId: "track-1" });

    expect(out.opportunity_id).toBe("opp-7");
    expect(inserted[0].opportunity_id).toBe("opp-7");
  });

  it("never overrides a spec the agent named itself", async () => {
    // The dangerous direction. A fallback that won over an explicit argument would
    // file verdicts against the wrong spec, which is worse than filing none: it
    // would move a miss onto work that did not earn it.
    const { client, inserted } = fakeDb({
      trackSpecs: [SPEC_ON_THE_TRACK],
      oppBySpec: { [SPEC_THE_AGENT_NAMED]: "opp-agent" },
    });

    await record(client, { trackId: "track-1", prdArg: SPEC_THE_AGENT_NAMED });

    expect(inserted[0].prd_id).toBe(SPEC_THE_AGENT_NAMED);
  });

  it("does not go looking at the track when the agent already said which spec", async () => {
    // Not just the same answer, the same WORK. A read on every call would be a
    // query per verdict for an id already in hand.
    const { client, reads } = fakeDb({
      trackSpecs: [SPEC_ON_THE_TRACK],
      oppBySpec: { [SPEC_THE_AGENT_NAMED]: "opp-agent" },
    });

    await record(client, { trackId: "track-1", prdArg: SPEC_THE_AGENT_NAMED });

    // Narrowed by F-65, not weakened: this tool now legitimately reads the same
    // table for the DECISION the verdict grades, which is a different question
    // from "where is the spec". The property under test is unchanged — a spec
    // already in hand is never looked up again.
    expect(reads).not.toContain("spine_track_members:prd");
  });

  it("keeps the mission hop ahead of the track, so the human path is unchanged", async () => {
    // The existing recovery works on the mission-shaped routes and must keep
    // winning there. This file adds a route, it does not reorder the ones that
    // already worked.
    const { client, inserted } = fakeDb({
      trackSpecs: [SPEC_ON_THE_TRACK],
      missionSpec: SPEC_VIA_MISSION,
      oppBySpec: { [SPEC_VIA_MISSION]: "opp-mission" },
    });

    await record(client, { trackId: "track-1", missionId: "mission-1" });

    expect(inserted[0].prd_id).toBe(SPEC_VIA_MISSION);
  });

  it("falls through to the track when the mission hop finds nothing", async () => {
    // The live shape on the driver's route if a mission ever were attached: the
    // first hop resolves, the second is null by construction, and the track is
    // what is left.
    const { client, inserted } = fakeDb({
      trackSpecs: [SPEC_ON_THE_TRACK],
      missionSpec: null,
      oppBySpec: { [SPEC_ON_THE_TRACK]: "opp-7" },
    });

    await record(client, { trackId: "track-1", missionId: "mission-1" });

    expect(inserted[0].prd_id).toBe(SPEC_ON_THE_TRACK);
  });

  it("still records the verdict when nothing resolves at all", async () => {
    // FAIL-SOFT, unchanged. An unlinked outcome is worth less than a linked one and
    // far more than a lost one, so no resolution attempt may block the write.
    const { client, inserted } = fakeDb({});

    const out = await record(client, {});

    expect(out.learning_id).toBe("learning-1");
    expect(inserted[0].prd_id).toBeNull();
    expect(inserted[0].opportunity_id).toBeNull();
  });

  it("survives a track that has not filed a spec yet", async () => {
    // Reachable in practice: a route where Plan was waived, or a Learn run on a
    // track whose spec write was refused. It must record the verdict, not throw.
    const { client, inserted } = fakeDb({ trackSpecs: [] });

    const out = await record(client, { trackId: "track-1" });

    expect(out.learning_id).toBe("learning-1");
    expect(inserted[0].prd_id).toBeNull();
  });
});

describe("learning.record: a failed outcome memory is reported, not swallowed", () => {
  it("writes an error event naming the spec and the learning when nothing was remembered", async () => {
    rememberResult = { id: null, supersedes: [], error: "no embedding, refused to write a ghost" };
    const { client } = memoryFailureDb();

    const out = await run(client);

    expect(recorded.length).toBe(1);
    expect(recorded[0].message).toBe("no embedding, refused to write a ghost");
    expect(recorded[0].ctx.surface).toBe("learning.record");
    expect(recorded[0].ctx.failure_kind).toBe("outcome_memory_not_written");
    expect(recorded[0].ctx.user_id).toBe("user-1");
    expect(recorded[0].ctx.workspace_id).toBe("ws-1");
    // Without these the event says a memory failed and gives nobody a way to
    // find WHICH outcome lost its lesson, which is barely better than the
    // console line it replaced.
    expect(recorded[0].ctx.extras).toMatchObject({
      prd_id: PRD_ID,
      learning_id: "learning-1",
      verdict: "mixed",
      agent_slug: "critic",
      mission_id: "mission-1",
    });
    expect(out.outcome_memory_error).toBe("no embedding, refused to write a ghost");
    expect(out.outcome_memory_id).toBeNull();
  });

  it("still returns the learning, because the row is already written", async () => {
    rememberResult = { id: null, supersedes: [], error: "insert refused" };
    const { client, inserted } = memoryFailureDb();

    const out = await run(client);

    expect(out.learning_id).toBe("learning-1");
    expect(inserted.length).toBe(1);
  });

  it("reports a throw too, so the one case the old catch handled is not lost", async () => {
    rememberThrows = new Error("agent_memory unreachable");
    const { client } = memoryFailureDb();

    const out = await run(client);

    expect(out.learning_id).toBe("learning-1");
    expect(out.outcome_memory_error).toBe("agent_memory unreachable");
    expect(recorded.length).toBe(1);
    expect(recorded[0].ctx.failure_kind).toBe("outcome_memory_not_written");
  });

  it("stays silent and carries the memory id when the write succeeded", async () => {
    rememberResult = { id: "mem-9", supersedes: [], error: null };
    const { client } = memoryFailureDb();

    const out = await run(client);

    expect(recorded.length).toBe(0);
    expect(out.outcome_memory_id).toBe("mem-9");
    expect(out.outcome_memory_error).toBeNull();
  });
});
