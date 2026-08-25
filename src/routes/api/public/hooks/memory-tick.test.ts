/**
 * THE SWITCH WAS WIRED TO THE LABEL, NOT THE MACHINE (Queue 61 / F-53).
 *
 * `memory_expiry_enabled()` gated the settings display and the trigger that
 * STAMPS `expires_at` — but not the sweep that DELETES on it. While the flag
 * has never been on, that is invisible: nothing is stamped, so the
 * unconditional delete matches nothing. The moment the founder turns the flag
 * on and later off again, the miswiring bites: rows stamped during the ON
 * window keep being deleted every night while the settings page reads "Off.
 * Nothing the machine learns for a free-tier user ever fades."
 *
 * These tests pin flag→behaviour both ways, and pin the skip being SAID
 * (R-16: a purge that did not run for a reason must state the reason; a bare
 * `expired: 0` cannot tell "gate off" from "nothing to sweep").
 *
 * Deletion is asserted on the store and the statement log, not on the returned
 * counts: the fake harness does not report delete counts, and the row itself
 * is the fact that matters.
 */
import { describe, expect, test } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { makeFakeDb, type FakeDb, type FakeRow } from "@/lib/ai/fake-postgrest.test";
import { sweepAgentMemory } from "./memory-tick";

const NOW = Date.parse("2026-08-25T12:00:00.000Z");
const iso = (daysFromNow: number) => new Date(NOW + daysFromNow * 86_400_000).toISOString();

/** An important memory (importance 3) the decay passes must never touch. */
const memory = (id: string, over: FakeRow = {}): FakeRow => ({
  id,
  importance: 3,
  created_at: iso(-5),
  last_used_at: null,
  expires_at: null,
  ...over,
});

/** A free-tier row stamped while the gate was ON, now past its window. */
const stampedExpired = (id: string): FakeRow => memory(id, { expires_at: iso(-1) });

/** Point the gate RPC at a canned answer; every other RPC keeps the default. */
function withFlag(db: FakeDb, answer: { data: unknown; error: unknown }): SupabaseClient {
  db.rpc = async (name: string) =>
    name === "memory_expiry_enabled" ? answer : { data: null, error: null };
  return db as unknown as SupabaseClient;
}

const flagOn = { data: true, error: null };
const flagOff = { data: false, error: null };

const deletesOn = (db: FakeDb, table: string) =>
  db.statements.filter((s) => s.table === table && s.mode === "delete");

describe("sweepAgentMemory — the expiry gate", () => {
  test("flag ON: a row past its stamped window is deleted; NULL and future stamps survive", async () => {
    const db = makeFakeDb({
      agent_memory: [
        stampedExpired("gone"),
        memory("paid"), // expires_at NULL: paid, never swept
        memory("later", { expires_at: iso(+3) }), // stamped but not yet due
      ],
    });
    const out = await sweepAgentMemory(withFlag(db, flagOn), NOW);

    expect(db.tables.agent_memory.map((r) => r.id).sort()).toEqual(["later", "paid"]);
    // The pass ran, and the response says so by having nothing to explain.
    expect(out.expirySkipped).toBeNull();
    expect(out.errors).toEqual([]);
    // Two decay deletes plus the expiry delete, which matched exactly the one row.
    const deletes = deletesOn(db, "agent_memory");
    expect(deletes.length).toBe(3);
    expect(deletes[2].matched).toBe(1);
  });

  test("flag OFF: the stamped-expired row survives, and the skip is said", async () => {
    const db = makeFakeDb({ agent_memory: [stampedExpired("kept")] });
    const out = await sweepAgentMemory(withFlag(db, flagOff), NOW);

    expect(db.tables.agent_memory.map((r) => r.id)).toEqual(["kept"]);
    expect(out.expirySkipped).toBe("expiry-disabled");
    expect(out.errors).toEqual([]);
    // The expiry delete was never even issued — only the two decay passes ran.
    expect(deletesOn(db, "agent_memory").length).toBe(2);
  });

  test("anything the RPC answers that is not exactly true reads as disabled", async () => {
    // A gate that answers strangely must fail closed (no deletion), because
    // the deletion is the irreversible side.
    const db = makeFakeDb({ agent_memory: [stampedExpired("kept")] });
    const out = await sweepAgentMemory(withFlag(db, { data: "true", error: null }), NOW);
    expect(db.tables.agent_memory.length).toBe(1);
    expect(out.expirySkipped).toBe("expiry-disabled");
  });

  test("flag OFF: decay still runs — the gate governs expiry, not hygiene", async () => {
    // Decay (importance <= 2, stale 30d) is recall noise-control, F-AGENT-2,
    // and predates the monetization gate. Turning the gate off must not turn
    // the whole tick into a no-op.
    const db = makeFakeDb({
      agent_memory: [
        memory("noise-used", { importance: 2, last_used_at: iso(-40) }),
        memory("noise-unused", { importance: 1, created_at: iso(-40) }),
        memory("reflection", { importance: 3, created_at: iso(-40) }),
        stampedExpired("kept"),
      ],
    });
    const out = await sweepAgentMemory(withFlag(db, flagOff), NOW);

    expect(db.tables.agent_memory.map((r) => r.id).sort()).toEqual(["kept", "reflection"]);
    expect(out.expirySkipped).toBe("expiry-disabled");
    expect(out.errors).toEqual([]);
  });

  test("a flag function that is not built yet is the one honest quiet skip", async () => {
    // Pre-migration: the same migration family creates the flag and the
    // expires_at column, so nothing can be stamped and there is nothing to
    // sweep. A skip, not an incident — but still a named skip.
    const db = makeFakeDb({ agent_memory: [memory("row")] });
    const out = await sweepAgentMemory(
      withFlag(db, {
        data: null,
        error: {
          code: "PGRST202",
          message: "Could not find the function public.memory_expiry_enabled in the schema cache",
        },
      }),
      NOW,
    );

    expect(out.expirySkipped).toBe("pending-migration");
    expect(out.errors).toEqual([]);
    expect(deletesOn(db, "agent_memory").length).toBe(2);
  });

  test("a flag that stopped answering is a failure, not a skip — and nothing is deleted on the guess", async () => {
    // The retention-tick incident, refused in both directions at once: an
    // unreadable gate must not delete (irreversible, on a guess) and must not
    // report ok (a sweep that quietly stops keeping a promise while job_runs
    // stays green).
    const db = makeFakeDb({ agent_memory: [stampedExpired("kept")] });
    const out = await sweepAgentMemory(
      withFlag(db, {
        data: null,
        error: { code: "42501", message: "permission denied for function memory_expiry_enabled" },
      }),
      NOW,
    );

    expect(db.tables.agent_memory.map((r) => r.id)).toEqual(["kept"]);
    expect(out.expirySkipped).toBe("flag-unreadable");
    expect(out.errors.length).toBe(1);
    expect(out.errors[0]).toContain("permission denied");
  });
});

describe("sweepAgentMemory — the decay passes are unchanged", () => {
  test("recently used low-importance memory and high-importance reflections are never decayed", async () => {
    const db = makeFakeDb({
      agent_memory: [
        memory("fresh-noise", { importance: 2, last_used_at: iso(-2) }),
        memory("old-reflection", { importance: 4, created_at: iso(-90) }),
        memory("old-noise", { importance: 2, created_at: iso(-90) }),
      ],
    });
    await sweepAgentMemory(withFlag(db, flagOn), NOW);
    expect(db.tables.agent_memory.map((r) => r.id).sort()).toEqual([
      "fresh-noise",
      "old-reflection",
    ]);
  });
});
