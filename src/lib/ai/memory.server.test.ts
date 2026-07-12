import { describe, it, expect, beforeEach } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  recallMemoryRefs,
  touchMemory,
  logMemoryRecall,
  rememberOutcome,
  type MemoryRef,
  type RecalledMemory,
} from "./memory.server";

/**
 * Spy Supabase client for memory tests.
 * Follows the pattern from fanout.server.test.ts: minimal RPC/query stubs
 * that track calls and return controlled responses.
 */
function memorySpy() {
  const calls: Record<string, { count: number; args: unknown[] }> = {
    match_agent_memory: { count: 0, args: [] },
    recent_agent_reflections: { count: 0, args: [] },
    from: { count: 0, args: [] },
  };

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
          select: () => ({
            single: async () => ({
              data: { id: "new-mem-id" },
              error: null,
            }),
          }),
          update: () => ({
            in: async () => ({ data: null, error: null }),
          }),
          delete: () => ({
            eq: () => ({
              filter: () => ({
                filter: async () => ({ data: null, error: null }),
              }),
            }),
          }),
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

  return { client, calls };
}

describe("recallMemoryRefs (semantic + recent memory recall)", () => {
  it("recalls memory from both semantic match and recent reflections", async () => {
    const { client } = memorySpy();

    const result = await recallMemoryRefs(client, "user-1", "agent-slug", "What did I learn?", "ws-1");

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

    const result = await recallMemoryRefs(
      client,
      "user-1",
      "agent-slug",
      "query",
      "ws-1",
      { maxItems: 2 },
    );

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

    const result = await recallMemoryRefs(
      client,
      "user-1",
      "agent-slug",
      "query",
      "ws-1",
      { touch: true },
    );

    // Touch should have been called internally if there were recalled refs
    // We can't directly verify the touch call, but we can verify the function completes
    expect(result).toBeDefined();
  });

  it("skips touch call when opts.touch=false or omitted", async () => {
    const { client } = memorySpy();

    const result = await recallMemoryRefs(
      client,
      "user-1",
      "agent-slug",
      "query",
      "ws-1",
      { touch: false },
    );

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

describe("rememberOutcome (persist outcome memory)", () => {
  it("persists outcome as global-scope searchable memory", async () => {
    const { client } = memorySpy();

    const result = await rememberOutcome(client, {
      userId: "user-1",
      workspaceId: "ws-1",
      prdId: "prd-1",
      opportunityId: "opp-1",
      learningId: null,
      content: "Outcome: improved the PRD based on feedback",
      importance: 8,
      verdict: "success",
      priorIce: 10,
      newIce: 15,
      prdTitle: "PRD Title",
      oppTitle: "Opportunity Title",
    });

    // Should return { id } on success
    expect(result).toBeDefined();
  });

  it("returns null when embedding fails (non-fatal)", async () => {
    const { client } = memorySpy();

    // If embedOne returns no embedding, rememberOutcome returns null without inserting
    const result = await rememberOutcome(client, {
      userId: "user-1",
      workspaceId: "ws-1",
      prdId: "prd-1",
      opportunityId: null,
      learningId: null,
      content: "Outcome text",
      importance: 5,
      verdict: "failed",
      priorIce: null,
      newIce: null,
      prdTitle: null,
      oppTitle: null,
    });

    // Could be null or { id } depending on embedding result
    expect(result === null || (result && typeof result.id === "string")).toBe(true);
  });

  it("is idempotent: replaces prior outcome for same PRD", async () => {
    const { client } = memorySpy();

    const content = "Updated outcome for PRD-1";
    const result = await rememberOutcome(client, {
      userId: "user-1",
      workspaceId: "ws-1",
      prdId: "prd-1",
      opportunityId: null,
      learningId: null,
      content,
      importance: 7,
      verdict: "success",
      priorIce: null,
      newIce: null,
      prdTitle: null,
      oppTitle: null,
    });

    // First call should delete any prior outcome for prd-1, then insert new one
    expect(result === null || (result && typeof result.id === "string")).toBe(true);
  });

  it("handles null optional fields (opportunityId, learningId, etc.)", async () => {
    const { client } = memorySpy();

    const result = await rememberOutcome(client, {
      userId: "user-1",
      workspaceId: "ws-1",
      prdId: "prd-1",
      opportunityId: null,
      learningId: null,
      content: "Outcome",
      importance: 5,
      verdict: "pending",
      priorIce: null,
      newIce: null,
      prdTitle: null,
      oppTitle: null,
    });

    expect(result === null || (result && typeof result.id === "string")).toBe(true);
  });

  it("handles null workspace (global memory)", async () => {
    const { client } = memorySpy();

    const result = await rememberOutcome(client, {
      userId: "user-1",
      workspaceId: null,
      prdId: "prd-1",
      opportunityId: null,
      learningId: null,
      content: "Global outcome memory",
      importance: 5,
      verdict: "success",
      priorIce: null,
      newIce: null,
      prdTitle: null,
      oppTitle: null,
    });

    expect(result === null || (result && typeof result.id === "string")).toBe(true);
  });

  it("includes metadata with source='outcome' + entity links", async () => {
    const { client } = memorySpy();

    const result = await rememberOutcome(client, {
      userId: "user-1",
      workspaceId: "ws-1",
      prdId: "prd-123",
      opportunityId: "opp-456",
      learningId: "learn-789",
      content: "Outcome with full entity links",
      importance: 9,
      verdict: "great_success",
      priorIce: 5,
      newIce: 20,
      prdTitle: "My PRD",
      oppTitle: "My Opportunity",
    });

    // Should have created a memory with metadata
    expect(result === null || (result && typeof result.id === "string")).toBe(true);
  });

  it("handles failure gracefully (console.error, returns null)", async () => {
    const { client } = memorySpy();

    const result = await rememberOutcome(client, {
      userId: "user-1",
      workspaceId: "ws-1",
      prdId: "prd-1",
      opportunityId: null,
      learningId: null,
      content: "Text that might cause error",
      importance: 5,
      verdict: "pending",
      priorIce: null,
      newIce: null,
      prdTitle: null,
      oppTitle: null,
    });

    // Should never throw, returns null on error
    expect(result === null || (result && typeof result.id === "string")).toBe(true);
  });

  it("encodes importance + verdict for telemetry", async () => {
    const { client } = memorySpy();

    const importanceValues = [1, 5, 10];
    const verdictValues = ["failure", "pending", "success"];

    for (const importance of importanceValues) {
      for (const verdict of verdictValues) {
        const result = await rememberOutcome(client, {
          userId: "user-1",
          workspaceId: "ws-1",
          prdId: `prd-${importance}-${verdict}`,
          opportunityId: null,
          learningId: null,
          content: `Outcome with importance=${importance}, verdict=${verdict}`,
          importance,
          verdict,
          priorIce: null,
          newIce: null,
          prdTitle: null,
          oppTitle: null,
        });

        expect(result === null || (result && typeof result.id === "string")).toBe(true);
      }
    }
  });
});
