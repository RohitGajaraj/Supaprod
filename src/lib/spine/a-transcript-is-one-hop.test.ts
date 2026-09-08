/**
 * ── A TRANSCRIPT IS ONE HOP ──────────────────────────────────────────────────
 *
 * The run screen's tool-call transcript (`getTrackToolCalls`) was three
 * sequential round trips and, on a settled 224-call track, 240 KB of args
 * and results for 200 rows (2026-09-08, Lane 2: one handler at 5,145 ms and
 * 170,843 bytes). It is one call to `track_tool_calls` now, which slims the
 * args and counts what a search found in Postgres. Driven on the wire that
 * counts rounds; the words are still `toolCallFacts`'s, so the reducer's
 * own cases are exercised on the slimmed shapes the database returns.
 */
import { describe, expect, it } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { readTrackToolCalls } from "./track.functions";
import { FakeWire, drive } from "@/__tests__/a-wire-that-counts-rounds";

const AT = (n: number) => `2026-09-08T10:00:0${n}.000Z`;

const answer = {
  runs: 2,
  traced_runs: 1,
  calls: [
    {
      id: "c3",
      tool_name: "repo.search",
      ok: true,
      latency_ms: 40,
      created_at: AT(3),
      error: null,
      trace_id: "trace-1",
      run_id: "r1",
      args: { query: "AddressStep" },
      found: 4,
    },
    {
      id: "c2",
      tool_name: "studio.stage",
      ok: true,
      latency_ms: 90,
      created_at: AT(2),
      error: null,
      trace_id: "trace-1",
      run_id: "r1",
      args: { changes: [{ path: "src/checkout/AddressStep.tsx" }] },
      found: null,
    },
    {
      id: "c1",
      tool_name: "repo.read",
      ok: true,
      latency_ms: 12,
      created_at: AT(1),
      error: null,
      trace_id: "trace-9",
      run_id: null,
      args: { paths: ["src/checkout/checkout.test.ts"] },
      found: null,
    },
  ],
};

describe("a transcript is one hop", () => {
  it("answers in one round, oldest first, with the reducer's words on the slimmed args", async () => {
    const wire = new FakeWire((table) => (table === "rpc:track_tool_calls" ? answer : []));
    const { result, rounds } = await drive(
      wire,
      readTrackToolCalls(wire as unknown as SupabaseClient<Database>, "track-1"),
    );
    expect(rounds).toBe(1);
    expect(wire.reads).toEqual(["rpc:track_tool_calls"]);
    expect(result.runs).toBe(2);
    expect(result.tracedRuns).toBe(1);
    expect(result.calls.map((c) => c.id)).toEqual(["c1", "c2", "c3"]);
    const [read, stage, search] = result.calls;
    expect(read.files).toEqual(["src/checkout/checkout.test.ts"]);
    expect(read.touch).toBe("read");
    expect(read.runId).toBeNull();
    expect(stage.files).toEqual(["src/checkout/AddressStep.tsx"]);
    expect(stage.touch).toBe("wrote");
    expect(search.argument).toContain("AddressStep");
    // Counted in Postgres, handed to the reducer as the one number.
    expect(search.found).toBe(4);
    expect(stage.found).toBeNull();
  });

  it("an empty track is an empty transcript with its counts", async () => {
    const wire = new FakeWire(() => ({ runs: 3, traced_runs: 0, calls: [] }));
    const { result, rounds } = await drive(
      wire,
      readTrackToolCalls(wire as unknown as SupabaseClient<Database>, "track-1"),
    );
    expect(rounds).toBe(1);
    expect(result).toEqual({ calls: [], runs: 3, tracedRuns: 0 });
  });
});
