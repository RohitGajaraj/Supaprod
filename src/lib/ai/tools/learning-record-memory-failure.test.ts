/**
 * learning.record must not swallow a failed outcome-memory write.
 *
 * `agent_memory` holds ZERO rows of kind "outcome", and "outcome" is the kind
 * every precedent path filters on: loadDecisionPrecedent, the outcome-weighted
 * rerank, the Critic's red-team block. `rememberOutcome` called from this tool
 * is the writer that fills that pool on the agent path. It never throws; it
 * RETURNS its refusals. So the old `try { await rememberOutcome(...) } catch`
 * caught nothing that ever happened and discarded the one field that says why
 * nothing was written, leaving a console line in a Cloudflare Worker as the
 * only trace. An empty moat with no explanation anywhere is the defect this
 * file exists to prevent.
 *
 * Two halves are asserted, because the failure has to be visible to a query AND
 * to the agent that just recorded the verdict:
 *   1. the error reaches `error_events` via recordErrorEvent, and
 *   2. it rides back in the tool result instead of being dropped.
 * Plus the invariant that must NOT change: the learnings row is already written
 * and a memory miss still returns success rather than throwing it away.
 */
import { describe, it, expect, beforeEach, afterAll, mock } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ToolDef } from "./registry.server";

// Captured BEFORE the mocks are installed so `afterAll` can put the real
// modules back. bun's module mocks are process-wide, and this file shares a
// process with the suites that exercise the genuine rememberOutcome and
// recordErrorEvent; without this restore, running order would decide whether
// those pass.
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

const PRD_ID = "11111111-1111-4111-8111-111111111111";

/** Minimal Supabase stand-in covering exactly the reads/writes this tool makes
 *  when it is handed a prd_id: the spec, the decision lookup (F-65), the bet,
 *  the re-score, and the learnings insert that must survive a memory miss.
 *  It THROWS on any other table on purpose — that is what caught F-65's new
 *  query rather than letting it pass silently against a permissive fake. */
function fakeDb() {
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

describe("learning.record: a failed outcome memory is reported, not swallowed", () => {
  beforeEach(() => {
    rememberResult = { id: null, supersedes: [], error: null };
    rememberThrows = null;
    recorded = [];
  });

  afterAll(() => {
    mock.module("@/lib/ai/memory.server", () => realMemory);
    mock.module("@/lib/observability/errors", () => realErrors);
  });

  it("writes an error event naming the spec and the learning when nothing was remembered", async () => {
    rememberResult = { id: null, supersedes: [], error: "no embedding, refused to write a ghost" };
    const { client } = fakeDb();

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
    const { client, inserted } = fakeDb();

    const out = await run(client);

    expect(out.learning_id).toBe("learning-1");
    expect(inserted.length).toBe(1);
  });

  it("reports a throw too, so the one case the old catch handled is not lost", async () => {
    rememberThrows = new Error("agent_memory unreachable");
    const { client } = fakeDb();

    const out = await run(client);

    expect(out.learning_id).toBe("learning-1");
    expect(out.outcome_memory_error).toBe("agent_memory unreachable");
    expect(recorded.length).toBe(1);
    expect(recorded[0].ctx.failure_kind).toBe("outcome_memory_not_written");
  });

  it("stays silent and carries the memory id when the write succeeded", async () => {
    rememberResult = { id: "mem-9", supersedes: [], error: null };
    const { client } = fakeDb();

    const out = await run(client);

    expect(recorded.length).toBe(0);
    expect(out.outcome_memory_id).toBe("mem-9");
    expect(out.outcome_memory_error).toBeNull();
  });
});
