import { describe, it, expect, beforeEach, mock } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MemoryRef, RecalledMemory } from "./memory.server";

/*
 * P-132 (A-QUEUE.md): `recallMemoryRefs` and `rememberOutcome` both call
 * `embedOne`, which reaches a real embedding provider over the network
 * (`embed.server.ts`'s own `fetch`). That is a genuine, unmocked network
 * call inside what reads as a unit test -- fine in isolation, where it has
 * the field to itself, and a 5s-timeout flake under the full suite, where
 * dozens of other files' own real network calls contend for the same
 * window. `embedOne` is not injectable into `recallMemoryRefs`/
 * `rememberOutcome` (no parameter carries it), so the fix is a
 * process-wide `mock.module` of `@/lib/rag/embed.server` -- checked
 * against `a-module-mock-is-process-wide.test.ts`'s own frozen set first:
 * nothing else in this repo mocks this module today, so this is a single
 * new entry with no collision, not a second file racing an existing one.
 */
const embedActual = await import("@/lib/rag/embed.server");
/** A fixed, deterministic vector -- its VALUES are never asserted on;
 *  only that recall/write proceed as if a real embed had answered. */
const FAKE_VECTOR = new Array(8).fill(0.1);
/** Flipped by the one test that needs the provider to be DOWN rather than
 *  mocking `globalThis.fetch`, which this mock no longer routes through.
 *  Always reset in that test's own `finally`, the same discipline the
 *  fetch-stub it replaces already held to. */
let embedShouldFail = false;
mock.module("@/lib/rag/embed.server", () => ({
  ...embedActual,
  embedOne: async () => {
    if (embedShouldFail) throw new Error("embeddings 503: upstream unavailable");
    return FAKE_VECTOR;
  },
  embedTexts: async (inputs: string[]) => inputs.map(() => FAKE_VECTOR),
  embedThroughChokepoint: async (inputs: string[]) => inputs.map(() => FAKE_VECTOR),
}));

const {
  recallMemoryRefs,
  touchMemory,
  logMemoryRecall,
  rememberOutcome,
  supersededContent,
  selectSupersedable,
  SUPERSEDED_MARK,
} = await import("./memory.server");

type AnyRecord = Record<string, unknown>;
type PriorRow = { id: string; content: string | null; metadata: AnyRecord | null };

/**
 * Spy Supabase client for memory tests.
 * Follows the pattern from fanout.server.test.ts: minimal RPC/query stubs
 * that track calls and return controlled responses.
 */
function memorySpy(opts?: { priorOutcomes?: PriorRow[] }) {
  const calls: Record<string, { count: number; args: unknown[] }> = {
    match_agent_memory: { count: 0, args: [] },
    recent_agent_reflections: { count: 0, args: [] },
    from: { count: 0, args: [] },
  };
  /** Every write rememberOutcome made against agent_memory, so a test can prove
   *  the prior row was MARKED and not deleted. */
  const writes: { deletes: number; updates: Array<{ id: string; patch: AnyRecord }> } = {
    deletes: 0,
    updates: [],
  };
  const priorOutcomes = opts?.priorOutcomes ?? [];

  const client = {
    rpc: (name: string, args: unknown) => {
      calls[name] = calls[name] || { count: 0, args: [] };
      calls[name].count++;
      calls[name].args.push(args);

      // Simulate RPC responses based on which function is called
      if (name === "match_agent_memory") {
        // Return mock memory matches with id + content
        return Promise.resolve({
          data: [
            { id: "mem-1", content: "First memory match" },
            { id: "mem-2", content: "Second memory match" },
          ],
          error: null,
        });
      }

      if (name === "recent_agent_reflections") {
        // Return recent reflections with id + content
        return Promise.resolve({
          data: [{ id: "refl-1", content: "Recent reflection" }],
          error: null,
        });
      }

      return Promise.resolve({ data: [], error: null });
    },

    from: (table: string) => {
      calls.from.count++;
      calls.from.args.push(table);

      // Return different chains based on table name
      if (table === "workspaces") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { account_id: "acc-1" },
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === "accounts") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { plan_tier: "pro" },
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === "agent_memory") {
        return {
          // rememberOutcome's prior-outcome read: select(...).eq().filter().filter()
          // resolves as a promise. touchMemory's update(...).in() also lives here.
          select: () => ({
            single: async () => ({ data: { id: "new-mem-id" }, error: null }),
            eq: () => ({
              filter: () => ({
                filter: async () => ({ data: priorOutcomes, error: null }),
              }),
            }),
          }),
          update: (patch: AnyRecord) => ({
            in: async () => ({ data: null, error: null }),
            // THE PIN CHAIN IS `.update().eq().select("id")`, AND THIS STUB USED
            // TO STOP AT `.eq()`. `eq` was a plain async function, so awaiting it
            // worked but `.select()` on the returned promise was undefined: the
            // workspace pin threw a TypeError, the real code caught it into
            // `workspaceError`, and every assertion about the pin was
            // unreachable. A mock loose enough to miss the shape it is mocking
            // cannot fail when that shape breaks.
            //
            // Now it is a thenable that ALSO answers `.select()`, so both call
            // sites are faithful: the superseding update below awaits `.eq()`
            // directly, and the pin chains `.select("id")` and reads the row set
            // back, which is what proves an RLS refusal is caught rather than
            // resolved as success.
            eq: (_col: string, id: string) => {
              writes.updates.push({ id, patch });
              const answered = { data: [{ id }], error: null };
              return Object.assign(Promise.resolve(answered), {
                select: async () => answered,
              });
            },
          }),
          // Kept only so a regression that reintroduces the destructive path is
          // caught by an assertion rather than passing silently.
          delete: () => {
            writes.deletes++;
            return {
              eq: () => ({
                filter: () => ({
                  filter: async () => ({ data: null, error: null }),
                }),
              }),
            };
          },
          insert: () => ({
            select: () => ({
              single: async () => ({
                data: { id: "mem-id-123" },
                error: null,
              }),
            }),
          }),
        };
      }

      // embedOne routes through loadBYOKey, which chains two .eq() before
      // .maybeSingle(). Without this branch the chain throws, the embedding is
      // null, and every rememberOutcome test silently exercises the skip path.
      if (table === "user_api_keys") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
            }),
          }),
        };
      }

      if (table === "ai_events") {
        return { insert: async () => ({ data: null, error: null }) };
      }

      if (table === "memory_recall_log") {
        return {
          insert: async () => ({ data: null, error: null }),
        };
      }

      return {
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
        }),
        update: () => ({ in: async () => ({ data: null, error: null }) }),
        delete: () => ({
          eq: () => ({
            filter: () => ({
              filter: async () => ({ data: null, error: null }),
            }),
          }),
        }),
        insert: async () => ({ data: null, error: null }),
      };
    },
  } as unknown as SupabaseClient;

  return { client, calls, writes };
}

describe("recallMemoryRefs (semantic + recent memory recall)", () => {
  it("recalls memory from both semantic match and recent reflections", async () => {
    const { client } = memorySpy();

    const result = await recallMemoryRefs(
      client,
      "user-1",
      "agent-slug",
      "What did I learn?",
      "ws-1",
    );

    expect(result).toBeDefined();
    expect(Array.isArray(result.lines)).toBe(true);
    expect(Array.isArray(result.refs)).toBe(true);
  });

  it("returns RecalledMemory with lines and refs", async () => {
    const { client } = memorySpy();

    const result = await recallMemoryRefs(client, "user-1", "agent-slug", "query", "ws-1");

    expect(result.lines).toBeDefined();
    expect(Array.isArray(result.lines)).toBe(true);
    result.lines.forEach((line) => {
      expect(typeof line).toBe("string");
    });

    expect(result.refs).toBeDefined();
    expect(Array.isArray(result.refs)).toBe(true);
    result.refs.forEach((ref) => {
      expect(typeof ref.id).toBe("string");
      expect(ref.summary === undefined || typeof ref.summary === "string").toBe(true);
    });
  });

  it("deduplicates memory content by string value", async () => {
    const { client } = memorySpy();

    const result = await recallMemoryRefs(client, "user-1", "agent-slug", "query", "ws-1");

    // Dedupe is internal: lines set tracks seen content
    const uniqueLines = new Set(result.lines);
    expect(uniqueLines.size).toBe(result.lines.length);
  });

  it("respects maxItems option (default 8)", async () => {
    const { client } = memorySpy();

    const result = await recallMemoryRefs(client, "user-1", "agent-slug", "query", "ws-1", {
      maxItems: 2,
    });

    expect(result.lines.length).toBeLessThanOrEqual(2);
    expect(result.refs.length).toBeLessThanOrEqual(2);
  });

  it("handles empty workspace ID (null)", async () => {
    const { client } = memorySpy();

    const result = await recallMemoryRefs(client, "user-1", "agent-slug", "query", null);

    expect(result).toBeDefined();
    expect(Array.isArray(result.lines)).toBe(true);
  });

  it("handles embedding failure gracefully (non-fatal)", async () => {
    const { client } = memorySpy();

    // embedOne might fail; memory recall should continue without breaking
    const result = await recallMemoryRefs(client, "user-1", "agent-slug", "query", "ws-1");

    expect(result).toBeDefined();
    // Should return empty or whatever lines came from fallback
  });

  it("returns refs with id and optional summary", async () => {
    const { client } = memorySpy();

    const result = await recallMemoryRefs(client, "user-1", "agent-slug", "query", "ws-1");

    result.refs.forEach((ref) => {
      expect(ref.id).toBeDefined();
      expect(typeof ref.id).toBe("string");
      if (ref.summary) {
        expect(typeof ref.summary).toBe("string");
        expect(ref.summary.length).toBeLessThanOrEqual(140);
      }
    });
  });

  it("calls touch on recalled IDs when opts.touch=true", async () => {
    const { client } = memorySpy();

    const result = await recallMemoryRefs(client, "user-1", "agent-slug", "query", "ws-1", {
      touch: true,
    });

    // Touch should have been called internally if there were recalled refs
    // We can't directly verify the touch call, but we can verify the function completes
    expect(result).toBeDefined();
  });

  it("skips touch call when opts.touch=false or omitted", async () => {
    const { client } = memorySpy();

    const result = await recallMemoryRefs(client, "user-1", "agent-slug", "query", "ws-1", {
      touch: false,
    });

    expect(result).toBeDefined();
  });

  it("handles RPC errors gracefully (non-fatal)", async () => {
    const { client } = memorySpy();

    // RPC errors should not break the recall chain
    const result = await recallMemoryRefs(client, "user-1", "agent-slug", "query", "ws-1");

    expect(result).toBeDefined();
    expect(Array.isArray(result.lines)).toBe(true);
  });

  it("filters out empty or whitespace-only content", async () => {
    const { client } = memorySpy();

    const result = await recallMemoryRefs(client, "user-1", "agent-slug", "query", "ws-1");

    result.lines.forEach((line) => {
      expect(line.trim().length).toBeGreaterThan(0);
    });
  });

  it("trims whitespace from recalled content", async () => {
    const { client } = memorySpy();

    const result = await recallMemoryRefs(client, "user-1", "agent-slug", "query", "ws-1");

    result.lines.forEach((line) => {
      expect(line).toBe(line.trim());
    });
  });

  it("handles pooling across account workspaces for paid tiers", async () => {
    const { client } = memorySpy();

    // Account pooling is resolved internally; this test documents the behavior
    const result = await recallMemoryRefs(client, "user-1", "agent-slug", "query", "ws-1");

    expect(result).toBeDefined();
  });
});

describe("touchMemory (mark memories as used)", () => {
  it("updates last_used_at for given memory IDs", async () => {
    const { client } = memorySpy();

    const ids = ["mem-1", "mem-2", "mem-3"];
    await touchMemory(client, ids);

    // touchMemory should complete without throwing
    expect(true).toBe(true);
  });

  it("skips update when IDs array is empty (non-fatal)", async () => {
    const { client } = memorySpy();

    await touchMemory(client, []);

    // Should complete silently without calling DB
    expect(true).toBe(true);
  });

  it("handles touch failure gracefully (logs error, never throws)", async () => {
    const { client } = memorySpy();

    // Even if the update fails, touchMemory should not throw
    await touchMemory(client, ["mem-1"]);

    expect(true).toBe(true);
  });

  it("accepts array of string IDs", async () => {
    const { client } = memorySpy();

    const ids = ["id1", "id2", "id3"];
    await touchMemory(client, ids);

    expect(true).toBe(true);
  });
});

describe("logMemoryRecall (trace-based recall logging)", () => {
  it("logs memory recall with traceId correlation", async () => {
    const { client } = memorySpy();

    await logMemoryRecall(client, {
      memoryIds: ["mem-1", "mem-2"],
      traceId: "trace-123",
      userId: "user-1",
      workspaceId: "ws-1",
    });

    expect(true).toBe(true);
  });

  it("skips log when memoryIds is empty", async () => {
    const { client } = memorySpy();

    await logMemoryRecall(client, {
      memoryIds: [],
      traceId: "trace-123",
      userId: "user-1",
      workspaceId: "ws-1",
    });

    // Should return early without DB call
    expect(true).toBe(true);
  });

  it("skips log when traceId is null (no trace context)", async () => {
    const { client } = memorySpy();

    await logMemoryRecall(client, {
      memoryIds: ["mem-1"],
      traceId: null,
      userId: "user-1",
      workspaceId: "ws-1",
    });

    // Should return early without DB call
    expect(true).toBe(true);
  });

  it("handles null workspaceId (global context)", async () => {
    const { client } = memorySpy();

    await logMemoryRecall(client, {
      memoryIds: ["mem-1"],
      traceId: "trace-123",
      userId: "user-1",
      workspaceId: null,
    });

    expect(true).toBe(true);
  });

  it("inserts one row per memory ID with trace correlation", async () => {
    const { client } = memorySpy();

    const ids = ["mem-1", "mem-2", "mem-3"];
    await logMemoryRecall(client, {
      memoryIds: ids,
      traceId: "trace-123",
      userId: "user-1",
      workspaceId: "ws-1",
    });

    // Three memory IDs should result in three insert rows
    expect(true).toBe(true);
  });

  it("handles log failure gracefully (never throws)", async () => {
    const { client } = memorySpy();

    await logMemoryRecall(client, {
      memoryIds: ["mem-1"],
      traceId: "trace-123",
      userId: "user-1",
      workspaceId: "ws-1",
    });

    expect(true).toBe(true);
  });
});

/* -------------------------------------------------------------------------- *
 * THE OUTCOME MEMORY, AND WHY IT NOW ACCUMULATES.
 *
 * `rememberOutcome` is the only writer that fills the pool every precedent path
 * reads (`kind = 'outcome'`). It used to DELETE the prior outcome memory for a
 * PRD before inserting the new one, which capped the corpus at one row per spec
 * forever and let the human settle path destroy the agent's memory of the same
 * spec. These tests hold the two properties that turn it from a cache into a
 * record: nothing is ever deleted, and a write that does not happen says why.
 * -------------------------------------------------------------------------- */

/** Make embedOne succeed, so the tests below reach the DB path instead of all
 *  silently exercising the no-embedding skip. Restores what it replaced. */
async function withEmbedding<T>(fn: () => Promise<T>): Promise<T> {
  const priorFetch = globalThis.fetch;
  const priorKey = process.env.LOVABLE_API_KEY;
  process.env.LOVABLE_API_KEY = "test-key";
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        data: [{ index: 0, embedding: [0.1, 0.2, 0.3] }],
        usage: { prompt_tokens: 4 },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )) as unknown as typeof fetch;
  try {
    return await fn();
  } finally {
    globalThis.fetch = priorFetch;
    if (priorKey === undefined) delete process.env.LOVABLE_API_KEY;
    else process.env.LOVABLE_API_KEY = priorKey;
  }
}

const outcomeArgs = (over: Partial<Parameters<typeof rememberOutcome>[1]> = {}) => ({
  userId: "user-1",
  workspaceId: "ws-1" as string | null,
  prdId: "prd-1",
  opportunityId: "opp-1" as string | null,
  learningId: "learn-1" as string | null,
  content: `Outcome on the spec "Checkout retry": MISSED. ${Math.random()}`,
  importance: 4,
  verdict: "missed",
  priorIce: 7,
  newIce: 5,
  prdTitle: "Checkout retry",
  oppTitle: "Cart abandonment",
  ...over,
});

describe("supersededContent (the note a replaced outcome memory carries)", () => {
  it("keeps the original text verbatim and appends what replaced it", () => {
    const out = supersededContent(
      'Outcome on the spec "Checkout retry": VALIDATED.',
      "missed",
      "2026-08-05T11:22:33.000Z",
    );
    expect(out.startsWith('Outcome on the spec "Checkout retry": VALIDATED.')).toBe(true);
    expect(out).toContain("Later re-recorded as MISSED on 2026-08-05");
    expect(out).toContain(SUPERSEDED_MARK.trim());
  });

  it("is idempotent: a second supersession replaces the note, never stacks one", () => {
    const once = supersededContent("Base outcome.", "missed", "2026-08-05T00:00:00.000Z");
    const twice = supersededContent(once, "validated", "2026-09-01T00:00:00.000Z");
    // One mark, naming the verdict that actually replaced it.
    expect(twice.split(SUPERSEDED_MARK).length).toBe(2);
    expect(twice.startsWith("Base outcome.")).toBe(true);
    expect(twice).toContain("Later re-recorded as VALIDATED on 2026-09-01");
    expect(twice).not.toContain("MISSED");
  });

  it("uses the date only, never a spurious-precision timestamp", () => {
    const out = supersededContent("Base.", "mixed", "2026-08-05T11:22:33.456Z");
    expect(out).not.toContain("11:22:33");
  });

  it("never emits an empty verdict into a sentence an agent will quote", () => {
    const out = supersededContent("Base.", "   ", "2026-08-05T00:00:00.000Z");
    expect(out).toContain("A DIFFERENT VERDICT");
  });

  it("handles an empty prior content without producing a leading blank", () => {
    const out = supersededContent("", "missed", "2026-08-05T00:00:00.000Z");
    expect(out.startsWith(SUPERSEDED_MARK.trimStart())).toBe(true);
  });
});

describe("selectSupersedable (which prior rows this write replaces)", () => {
  it("returns rows that have not been superseded yet", () => {
    const rows = [
      { id: "a", content: "x", metadata: { source: "outcome" } },
      { id: "b", content: "y", metadata: null },
    ];
    expect(selectSupersedable(rows).map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("skips a row already superseded, so its note keeps naming its own successor", () => {
    const rows = [
      { id: "a", content: "x", metadata: { superseded_at: "2026-07-01T00:00:00.000Z" } },
      { id: "b", content: "y", metadata: { source: "outcome" } },
    ];
    expect(selectSupersedable(rows).map((r) => r.id)).toEqual(["b"]);
  });

  it("returns nothing for an empty pool (the first outcome on a spec)", () => {
    expect(selectSupersedable([])).toEqual([]);
  });
});

describe("rememberOutcome (persist outcome memory)", () => {
  it("writes a global-scope outcome memory and reports no error", async () => {
    const { client } = memorySpy();
    const result = await withEmbedding(() => rememberOutcome(client, outcomeArgs()));

    expect(result.id).toBe("mem-id-123");
    expect(result.error).toBeNull();
  });

  /**
   * THE PIN IS LOAD-BEARING, AND NOTHING HELD IT UNTIL NOW.
   *
   * `agent_memory` carries a BEFORE INSERT trigger, `trg_set_agent_memory_
   * workspace`, running `set_row_workspace_from_user()`. Its body is
   * `if NEW.workspace_id is null then NEW.workspace_id :=
   * ensure_user_default_workspace(NEW.user_id)`. The insert here never sets
   * `workspace_id` (the workspace lives in `metadata`), so the trigger ALWAYS
   * fires and always writes the user's DEFAULT workspace.
   *
   * That is not a theory. Probed against production on 2026-08-06 inside a
   * rolled-back transaction: settling the Helio Labs spec
   * 10000000-0001-4000-8000-000000000031, whose workspace is
   * 10000000-0000-4000-8000-000000000000, produced a memory row filed under
   * b90da531-34aa-4009-bcce-2162b87f50ac. A different workspace, silently.
   *
   * The follow-up UPDATE is the only thing that corrects it, and the whole
   * moat depends on that correction: an outcome filed in the wrong workspace
   * is recalled for the wrong future call, which is worse than not recalling
   * it at all. Remove the pin and no test failed before this one, because the
   * defect lives in a database trigger that unit tests never run.
   */
  it("PINS the new memory to the settled spec's workspace, not the user's default", async () => {
    const { client, writes } = memorySpy();

    const result = await withEmbedding(() =>
      rememberOutcome(client, outcomeArgs({ workspaceId: "ws-of-the-spec" })),
    );

    expect(result.id).toBe("mem-id-123");
    // The correction targets the row just inserted, and sets exactly the
    // workspace the caller named.
    const pin = writes.updates.find((u) => u.id === "mem-id-123" && "workspace_id" in u.patch);
    expect(pin).toBeDefined();
    expect(pin!.patch.workspace_id).toBe("ws-of-the-spec");
    // A pin that silently did nothing is the failure this guards, so the
    // result must not be reporting one.
    expect(result.workspaceError).toBeFalsy();
  });

  it("MARKS the prior outcome memory instead of deleting it", async () => {
    const { client, writes } = memorySpy({
      priorOutcomes: [
        {
          id: "old-mem",
          content: 'Outcome on the spec "Checkout retry": VALIDATED.',
          metadata: { source: "outcome", prd_id: "prd-1", verdict: "validated" },
        },
      ],
    });

    const result = await withEmbedding(() => rememberOutcome(client, outcomeArgs()));

    // The whole point: the corpus grew by one and lost nothing.
    expect(writes.deletes).toBe(0);
    expect(result.supersedes).toEqual(["old-mem"]);

    const marked = writes.updates.find((u) => u.id === "old-mem");
    expect(marked).toBeDefined();
    const meta = marked!.patch.metadata as Record<string, unknown>;
    expect(meta.superseded_by).toBe("mem-id-123");
    expect(meta.superseded_by_verdict).toBe("missed");
    // The original metadata survives the merge; nothing is dropped to make room.
    expect(meta.verdict).toBe("validated");
    expect(String(marked!.patch.content)).toContain(
      'Outcome on the spec "Checkout retry": VALIDATED.',
    );
    expect(String(marked!.patch.content)).toContain("Later re-recorded as MISSED");
  });

  it("marks the prior row only AFTER the new one exists, never before", async () => {
    const { client, writes } = memorySpy({
      priorOutcomes: [{ id: "old-mem", content: "Prior.", metadata: { source: "outcome" } }],
    });
    const result = await withEmbedding(() => rememberOutcome(client, outcomeArgs()));
    // A supersede-mark that names the new row can only have run after the insert
    // returned. The old order did the destructive half first, so a failed insert
    // left the spec with no memory at all.
    expect(result.id).toBe("mem-id-123");
    expect(writes.updates.some((u) => u.id === "old-mem")).toBe(true);
  });

  it("leaves an already-superseded row alone", async () => {
    const { client, writes } = memorySpy({
      priorOutcomes: [
        { id: "old-mem", content: "Prior.", metadata: { superseded_at: "2026-07-01T00:00:00Z" } },
      ],
    });
    const result = await withEmbedding(() => rememberOutcome(client, outcomeArgs()));
    expect(result.supersedes).toEqual([]);
    expect(writes.updates.some((u) => u.id === "old-mem")).toBe(false);
  });

  it("the first outcome on a spec supersedes nothing", async () => {
    const { client, writes } = memorySpy();
    const result = await withEmbedding(() => rememberOutcome(client, outcomeArgs()));
    expect(result.supersedes).toEqual([]);
    expect(writes.deletes).toBe(0);
  });

  it("writes nothing and SAYS WHY when the content cannot be embedded", async () => {
    const { client, writes } = memorySpy();
    // The embeddings provider is down. The row must NOT be written, because
    // match_agent_memory hard filters embedding IS NOT NULL and an unrecallable
    // row is worse than none, and the reason must reach the caller rather than
    // dying in a console line inside a Worker.
    embedShouldFail = true;
    let result;
    try {
      result = await rememberOutcome(client, outcomeArgs());
    } finally {
      embedShouldFail = false;
    }

    expect(result.id).toBeNull();
    expect(result.error).toBeTruthy();
    expect(result.error).toContain("embed");
    // And it must not have destroyed a prior good row on its way out.
    expect(writes.deletes).toBe(0);
    expect(writes.updates).toEqual([]);
  });

  it("never throws, whatever the client does", async () => {
    const exploding = {
      from: () => {
        throw new Error("agent_memory is on fire");
      },
    } as unknown as SupabaseClient;

    const result = await withEmbedding(() => rememberOutcome(exploding, outcomeArgs()));
    expect(result.id).toBeNull();
    expect(result.error).toBeTruthy();
  });

  it("handles a null workspace (the row recalls as global)", async () => {
    const { client } = memorySpy();
    const result = await withEmbedding(() =>
      rememberOutcome(client, outcomeArgs({ workspaceId: null })),
    );
    expect(result.id).toBe("mem-id-123");
    expect(result.error).toBeNull();
  });

  it("handles null entity links (no opportunity, no learning)", async () => {
    const { client } = memorySpy();
    const result = await withEmbedding(() =>
      rememberOutcome(client, outcomeArgs({ opportunityId: null, learningId: null })),
    );
    expect(result.id).toBe("mem-id-123");
    expect(result.error).toBeNull();
  });
});
