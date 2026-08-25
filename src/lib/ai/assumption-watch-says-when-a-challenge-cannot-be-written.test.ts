/**
 * A CHALLENGE THAT CANNOT BE WRITTEN MUST SAY SO.
 *
 * Production wrote ZERO `assumption_challenges` rows in the table's whole life
 * while the assumption-watch tick reported ok on every run. The cause was one
 * line: `watchAssumptions` discarded the insert's result under a comment
 * claiming conflicts were ignored ("uq_assumption_challenges_open already
 * flagged"). A plain PostgREST insert does not ignore a conflict -- it fails
 * the WHOLE batch and RESOLVES with an error object, it does not throw -- so
 * the paid model call ran, the verdict said contradicted, and the row it
 * existed to produce vanished without a trace. Same shape as the
 * forecast-audit unread-write defect this repo already fixed once.
 *
 * What this file pins:
 *
 *   · THE FAILURE SURFACES -- an insert error rejects `watchAssumptions` with
 *     a message naming the insert, which is exactly what the tick's
 *     per-workspace catch records against the workspace. Both real failure
 *     modes are driven: the unique-constraint conflict the old comment
 *     claimed to handle, and a missing column (migration lag).
 *
 *   · THE FAILURE DOES NOT LIE FORWARD -- when the challenge row cannot be
 *     written, the assumption must NOT be flipped to status='challenged'.
 *     Staying 'standing' is what makes the next tick retry it; flipping it
 *     would retire the assumption from the scan with no challenge on record,
 *     which is the same silence with an extra step.
 *
 *   · THE SUCCESS PATH IS UNCHANGED -- a writable challenge still lands, the
 *     assumption still flips, and the counts still come back.
 *
 * callModel is stubbed process-wide (restored in afterAll) for the same reason
 * prd-draft-duplicate-guard.test.ts stubs it: this file is about which rows
 * get written, not what the model writes back.
 */
import { describe, test, expect, afterAll, mock } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { makeFakeDb } from "./fake-postgrest.test";

const realRuntime = await import("@/lib/ai/runtime.server");
mock.module("@/lib/ai/runtime.server", () => ({
  ...realRuntime,
  // Always a clean contradiction of evidence item 0, so every test below
  // reaches the insert. deriveWatchVerdict's own edge cases live in
  // assumption-watch.test.ts and are not re-proven here.
  callModel: async () => ({
    json: { contradicted: true, evidence_index: 0, rationale: "Usage dropped." },
  }),
}));

const { watchAssumptions } = await import("@/lib/ai/assumption-watch.server");

afterAll(() => {
  mock.module("@/lib/ai/runtime.server", () => realRuntime);
});

const WS = "ws-1";

/** One standing assumption and one fresh signal: enough to reach the insert. */
const seed = () => ({
  assumptions: [
    {
      id: "as-1",
      statement: "Churned users come back within a month.",
      workspace_id: WS,
      status: "standing",
      last_watched_at: null,
    },
  ],
  signals: [
    {
      id: "sig-1",
      workspace_id: WS,
      title: "Churn cohort",
      content: "None of the March churn cohort returned.",
      created_at: new Date().toISOString(),
    },
  ],
});

describe("watchAssumptions says when a challenge cannot be written", () => {
  test("the success path is unchanged: challenge written, assumption flipped, counts returned", async () => {
    const db = makeFakeDb(seed());
    const r = await watchAssumptions(db as unknown as SupabaseClient, "user-1", WS);
    expect(r).toEqual({ scanned: 1, challenged: 1 });
    expect(db.tables.assumption_challenges.length).toBe(1);
    expect(db.tables.assumption_challenges[0].assumption_id).toBe("as-1");
    expect(db.tables.assumption_challenges[0].signal_id).toBe("sig-1");
    expect(db.tables.assumptions[0].status).toBe("challenged");
  });

  test("a unique-constraint conflict rejects instead of vanishing", async () => {
    // The exact shape the deleted comment claimed to handle: an open challenge
    // already exists for this assumption, so the batch insert comes back 23505.
    const db = makeFakeDb(
      { ...seed(), assumption_challenges: [{ assumption_id: "as-1", workspace_id: WS }] },
      { unique: { assumption_challenges: [["assumption_id"]] } },
    );
    await expect(watchAssumptions(db as unknown as SupabaseClient, "user-1", WS)).rejects.toThrow(
      /could not insert challenges/,
    );
  });

  test("a missing column rejects with the database's own reason in the message", async () => {
    // Migration lag: the code writes a column the database does not have. The
    // per-workspace catch in the tick records exactly this string, so the
    // message must carry the cause, not only the fact of failure.
    const db = makeFakeDb(seed(), { missingColumns: { assumption_challenges: ["rationale"] } });
    await expect(watchAssumptions(db as unknown as SupabaseClient, "user-1", WS)).rejects.toThrow(
      /could not insert challenges: .*"rationale" does not exist/,
    );
  });

  test("a failed write does not flip the assumption, so the next tick retries it", async () => {
    const db = makeFakeDb(seed(), {
      missingColumns: { assumption_challenges: ["rationale"] },
    });
    await watchAssumptions(db as unknown as SupabaseClient, "user-1", WS).catch(() => {});
    // Still standing: the scan window keeps it, and no phantom 'challenged'
    // state exists without a challenge row to show for it.
    expect(db.tables.assumptions[0].status).toBe("standing");
    expect(db.tables.assumption_challenges ?? []).toHaveLength(0);
  });
});
