/**
 * TWO RUNS AGAINST ONE BET MUST NOT MINT TWO SPECS.
 *
 * generatePrd (src/lib/discovery.functions.ts:3612-3631) measured NINE bets
 * carrying two competing specs each and closed its own door against it. The
 * agent door had the same hole and stayed open: prd.draft's insert was
 * unconditional, so two runs against one bet each paid two model calls plus a
 * Critic run and put two specs reading "serves <same bet>" on /plan.
 *
 * What this file pins on the fix:
 *
 *   · THE GUARD FIRES BEFORE ANYTHING IS SPENT -- an existing spec comes back as
 *     `existing: true` with no model call and no second insert. The return keeps
 *     `prd_id`, which is the field spine/attach.ts files under, so a run that
 *     raced another still attaches its Define step to the spec that serves this
 *     bet instead of filing nothing.
 *
 *   · A GUARD THAT CANNOT BE READ FAILS OPEN TOWARD GENERATION -- same ruling
 *     generatePrd states verbatim: a duplicate spec is recoverable, a Define
 *     station that refuses to do anything on an unreadable check is not.
 *
 *   · A SPEC DESCENDED FROM AN EXAMPLE IS AN EXAMPLE -- discovery.functions.ts
 *     carries `bet.is_sample` across this seam (:3906); prd.draft dropped it,
 *     which is the open item that file records at :3827. Written ONLY when true,
 *     because the column defaults false and naming every real spec would be
 *     redundant -- so the negative case asserts the KEY IS ABSENT, not merely
 *     falsy.
 *
 * callModel is stubbed process-wide (restored in afterAll) for the same reason
 * learning-record-*.test.ts stub their neighbours: this file is about which rows
 * get written, not what the model writes back, and no real spend belongs in a
 * unit test of a guard that exists to prevent spend.
 */
import { describe, it, expect, afterAll, mock } from "bun:test";
import type { ToolDef } from "../registry.server";

const realRuntime = await import("@/lib/ai/runtime.server");
const modelCalls: Array<Record<string, unknown>> = [];
mock.module("@/lib/ai/runtime.server", () => ({
  ...realRuntime,
  callModel: async (_supabase: unknown, _userId: unknown, req: Record<string, unknown>) => {
    modelCalls.push(req);
    return { output: "## Problem\nSomething worth fixing.\n## Goals\nShip the smallest thing." };
  },
}));

const { TOOL_REGISTRY } = await import("../registry.server");
const tool = TOOL_REGISTRY["prd.draft"] as ToolDef;

const OPP_ID = "11111111-1111-4111-8111-111111111111";
const SPEC_ID = "22222222-2222-4222-8222-222222222222";

type DbOpts = {
  /** What `opportunities` resolves to for the requested id. */
  opp?: Record<string, unknown> | null;
  /** What the duplicate guard finds on `prds`, newest first. */
  existingSpec?: Record<string, unknown> | null;
  /** When set, the guard's read itself fails. */
  guardError?: string | null;
};

function makeDb(opts: DbOpts = {}) {
  const inserted: Array<{ table: string; row: Record<string, unknown> }> = [];
  let guardReads = 0;

  const oppBuilder = {
    select: () => oppBuilder,
    eq: () => oppBuilder,
    maybeSingle: async () => ({ data: opts.opp ?? null, error: null }),
  };

  const db = {
    inserted,
    guardReads: () => guardReads,
    from(table: string) {
      if (table === "opportunities") return oppBuilder;
      if (table === "prds") {
        return {
          // The guard: select -> eq(opportunity_id) -> order -> limit -> maybeSingle
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  maybeSingle: async () => {
                    guardReads += 1;
                    return {
                      data: opts.existingSpec ?? null,
                      error: opts.guardError ? { message: opts.guardError } : null,
                    };
                  },
                }),
              }),
            }),
          }),
          insert: (row: Record<string, unknown>) => {
            inserted.push({ table, row });
            return {
              select: () => ({
                single: async () => ({
                  data: {
                    id: SPEC_ID,
                    title: row.title as string,
                    status: "draft",
                    workspace_id: "ws-1",
                  },
                  error: null,
                }),
              }),
            };
          },
        };
      }
      // stage_events and any other trail write: recordStageEvent swallows its
      // own errors anyway; resolve like supabase-js would.
      return { insert: async () => ({ error: null }) };
    },
  };
  return db;
}

function ctx(db: ReturnType<typeof makeDb>) {
  return {
    supabase: db as never,
    userId: "u1",
    agentSlug: "prd-writer",
    traceId: null,
    runId: null,
    workspaceId: "ws-1",
  } as never;
}

function sampleOpp(is_sample: boolean): Record<string, unknown> {
  return {
    id: OPP_ID,
    title: "Saved address at checkout",
    problem: "Returning shoppers retype their address.",
    target_user: null,
    hypothesis: null,
    impact: 7,
    confidence: 6,
    ease: 5,
    theme_id: null,
    workspace_id: "ws-1",
    product_id: null,
    is_sample,
  };
}

afterAll(() => {
  mock.module("@/lib/ai/runtime.server", () => realRuntime);
});

describe("the duplicate guard lands before anything is spent", () => {
  it("returns existing:true and mints nothing when the bet already has a spec", async () => {
    modelCalls.length = 0;
    const db = makeDb({
      opp: sampleOpp(false),
      existingSpec: { id: SPEC_ID, title: "Existing spec", status: "draft" },
    });

    const out = (await tool.run({ opportunity_id: OPP_ID }, ctx(db))) as Record<string, unknown>;

    expect(out.existing).toBe(true);
    expect(out.prd_id).toBe(SPEC_ID);
    expect(out.title).toBe("Existing spec");
    // The crew is told, in the result itself, why nothing new was written and
    // what to do instead -- the wording convention of mission.plan's
    // "already has steps" guard.
    expect(String(out.message)).toMatch(/already serves this bet/i);
    expect(String(out.message)).toContain(SPEC_ID);
    expect(String(out.message)).toMatch(/do not call prd\.draft again/i);

    expect(db.inserted.length, "a second insert is exactly the defect").toBe(0);
    expect(modelCalls.length, "no model spend behind a refused draft").toBe(0);
  });

  it("asks the guard even when a brief rides along -- the opportunity wins, so the guard does too", async () => {
    modelCalls.length = 0;
    const db = makeDb({
      opp: sampleOpp(false),
      existingSpec: { id: SPEC_ID, title: "Existing spec", status: "review" },
    });

    const out = (await tool.run(
      { opportunity_id: OPP_ID, brief: "retype nothing" },
      ctx(db),
    )) as Record<string, unknown>;

    expect(out.existing).toBe(true);
    expect(db.guardReads()).toBe(1);
    expect(db.inserted.length).toBe(0);
    expect(modelCalls.length).toBe(0);
  });

  it("fails OPEN toward generation when the check cannot be read", async () => {
    // generatePrd's own words: a read that FAILED is not a read that found
    // nothing. Generating is the safer answer to "I cannot tell".
    modelCalls.length = 0;
    const db = makeDb({ opp: sampleOpp(false), guardError: "schema cache stale" });

    const out = (await tool.run({ opportunity_id: OPP_ID }, ctx(db))) as Record<string, unknown>;

    expect(out.existing).toBeUndefined();
    expect(out.prd_id).toBe(SPEC_ID);
    expect(db.guardReads()).toBe(1);
    expect(db.inserted.length).toBe(1);
    /*
     * TWO CALLS, NOT ONE, SINCE F-136, and the number is asserted rather than
     * loosened because it is a real change in what a draft costs.
     *
     *   1  the spec body
     *   2  the Outcome Contract extracted from that body
     *
     * The second is new. `prd.draft` used to insert eight columns and no
     * contract, so the `{}` default landed on every agent-written spec — 117 of
     * 119 rows — while the contract is "the part Build is measured against and
     * Ship reads". A small flash call on text already in hand is the price of a
     * spec that can be judged at all, and `generatePrd` has paid it since
     * Mission 3.3.
     *
     * The assertion this test exists for is unchanged: the guard failed to read,
     * generation proceeded anyway, and a read that FAILED is not a read that
     * found nothing.
     */
    expect(modelCalls.length, "the body, and the contract extracted from it").toBe(2);
  });

  it("runs no guard at all on the brief path -- there is no bet to be duplicated against", async () => {
    modelCalls.length = 0;
    const db = makeDb();

    const out = (await tool.run({ brief: "A weekly digest of overdue tasks." }, ctx(db))) as Record<
      string,
      unknown
    >;

    expect(out.existing).toBeUndefined();
    expect(db.guardReads()).toBe(0);
    expect(db.inserted.length).toBe(1);
    expect((db.inserted[0]!.row.opportunity_id as string | null) ?? null).toBeNull();
  });
});

describe("is_sample crosses the seam", () => {
  it("a spec drafted from a sample bet is itself marked a sample", async () => {
    modelCalls.length = 0;
    const db = makeDb({ opp: sampleOpp(true), existingSpec: null });

    await tool.run({ opportunity_id: OPP_ID }, ctx(db));

    expect(db.inserted.length).toBe(1);
    expect(db.inserted[0]!.row.is_sample).toBe(true);
  });

  it("a real bet writes NO is_sample key at all -- written only when true", async () => {
    // Same rule generatePrd applies at :3906: the column defaults false, so
    // naming it on every real spec would be redundant. Asserting absence rather
    // than falsy catches the regression where the flag starts being stamped
    // everywhere, which would make it meaningless.
    modelCalls.length = 0;
    const db = makeDb({ opp: sampleOpp(false), existingSpec: null });

    await tool.run({ opportunity_id: OPP_ID }, ctx(db));

    expect(db.inserted.length).toBe(1);
    expect("is_sample" in db.inserted[0]!.row).toBe(false);
  });

  it("the brief path has no parent bet and stamps nothing", async () => {
    modelCalls.length = 0;
    const db = makeDb();

    await tool.run({ brief: "A weekly digest of overdue tasks." }, ctx(db));

    expect(db.inserted.length).toBe(1);
    expect("is_sample" in db.inserted[0]!.row).toBe(false);
  });
});

describe("the pre-existing refusals survive the edit", () => {
  it("still refuses a call with neither opportunity nor brief", async () => {
    modelCalls.length = 0;
    const db = makeDb();
    await expect(tool.run({}, ctx(db))).rejects.toThrow(/needs either opportunity_id/);
    expect(db.inserted.length).toBe(0);
    expect(modelCalls.length).toBe(0);
  });

  it("still names an opportunity it cannot see instead of guessing", async () => {
    modelCalls.length = 0;
    const db = makeDb({ opp: null });
    await expect(tool.run({ opportunity_id: OPP_ID }, ctx(db))).rejects.toThrow(
      /No opportunity .* exists for this user/,
    );
    expect(db.inserted.length).toBe(0);
    expect(modelCalls.length).toBe(0);
  });
});
