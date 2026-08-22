/**
 * THE EDGE THE CANON'S CENTRAL SENTENCE NAMES.
 *
 * ── WHAT THIS GUARDS ────────────────────────────────────────────────────
 * The positioning says a verdict is "written back against the decision that
 * caused it". `learnings.decision_id` has existed since migration
 * 20260819181000 and nothing ever wrote it: measured 2026-08-22, 0 of 133 rows
 * carried one. `applyOutcome` is the one shared core behind every verdict this
 * product records, so the edge is written there or nowhere.
 *
 * ── WHY THE INTERESTING ASSERTIONS ARE ABOUT NULL ───────────────────────
 * The migration that added the column deliberately declined to derive it: "prd_id
 * does not identify a decision, since many decisions share one spec". It was
 * right. Measured the same day, 14 specs carry a decision and not one carries
 * exactly one. A resolver that answers on every row would therefore be wrong on
 * every row, and this column is about to carry the product's central claim, so a
 * wrong edge costs more than a missing one.
 *
 * So most of what follows pins the REFUSALS: which shapes must resolve to NULL,
 * and that an ambiguous near hop is never rescued by a unique far one.
 */
import { describe, expect, it } from "bun:test";

import { applyOutcome, resolveSettledDecision } from "./outcome.functions";

const SPEC = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
const WS = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1";
const CREATED = "2026-08-01T00:00:00.000Z";
const D1 = "cccccccc-cccc-4ccc-8ccc-ccccccccccc1";
const D2 = "cccccccc-cccc-4ccc-8ccc-ccccccccccc2";
const TRACK = "dddddddd-dddd-4ddd-8ddd-ddddddddddd1";

type Resp = { data: unknown[] | null; error: { message: string } | null };
type Call = { table: string; filters: Array<[string, unknown, unknown]> };

const rows = (data: unknown[]): Resp => ({ data, error: null });
const fails = (message: string): Resp => ({ data: null, error: { message } });

/**
 * A db that answers a scripted sequence of queries and records the shape of each
 * one. The shape is the point rather than the plumbing: "excluded superseded"
 * and "scoped to the workspace" are claims about the WHERE clause, and a stub
 * that only returned rows could not tell a resolver that applies those filters
 * from one that forgot them.
 */
function fakeDb(script: Array<{ table: string; resp: Resp }>) {
  const calls: Call[] = [];
  let next = 0;
  const db = {
    from(table: string) {
      const call: Call = { table, filters: [] };
      calls.push(call);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const b: any = {};
      for (const m of ["select", "eq", "neq", "in", "lte", "is", "order", "limit"]) {
        b[m] = (a?: unknown, c?: unknown) => {
          call.filters.push([m, a, c]);
          return b;
        };
      }
      b.then = (ok: (v: Resp) => unknown, no?: (e: unknown) => unknown) => {
        const step = script[next++];
        if (!step) return Promise.resolve(rows([])).then(ok, no);
        if (step.table !== table) {
          return Promise.reject(
            new Error(`query ${next} was expected on ${step.table} and ran on ${table}`),
          ).then(ok, no);
        }
        return Promise.resolve(step.resp).then(ok, no);
      };
      return b;
    },
  };
  return { db: db as never, calls };
}

const spec = { id: SPEC, workspaceId: WS, createdAt: CREATED };

/** Every filter this call applied, as `method:value` pairs. */
const shapeOf = (call: Call) => call.filters.map(([m, a]) => `${m}:${String(a)}`);

describe("the spec's own decision answers when there is exactly one", () => {
  it("names it, and says which hop answered", async () => {
    const { db } = fakeDb([{ table: "decisions", resp: rows([{ id: D1 }]) }]);
    const edge = await resolveSettledDecision(db, spec);
    expect(edge.decisionId).toBe(D1);
    expect(edge.why).toContain("recorded against this spec");
  });

  it("asks only the spec, and stops", async () => {
    // One query, not three. The far hops are for a spec that has no decision at
    // all; running them anyway would be work done to reach an answer already held.
    const { db, calls } = fakeDb([{ table: "decisions", resp: rows([{ id: D1 }]) }]);
    await resolveSettledDecision(db, spec);
    expect(calls.length).toBe(1);
  });

  it("scopes to the spec's workspace and excludes a superseded call", async () => {
    // Both are claims about the WHERE clause. Without the workspace filter a
    // service-role caller could file a cross-tenant edge; without the status
    // filter a replaced call would compete with the one that replaced it and
    // turn a resolvable spec into an ambiguous one.
    const { db, calls } = fakeDb([{ table: "decisions", resp: rows([{ id: D1 }]) }]);
    await resolveSettledDecision(db, spec);
    const shape = shapeOf(calls[0]);
    expect(shape).toContain("eq:prd_id");
    expect(shape).toContain("eq:workspace_id");
    expect(shape).toContain("neq:status");
  });

  it("omits the workspace filter rather than filtering on null", async () => {
    // `.eq("workspace_id", null)` matches nothing, which would turn a spec with
    // no workspace into a silent no-answer instead of an honest lookup.
    const { db, calls } = fakeDb([{ table: "decisions", resp: rows([{ id: D1 }]) }]);
    await resolveSettledDecision(db, { ...spec, workspaceId: null });
    expect(shapeOf(calls[0])).not.toContain("eq:workspace_id");
  });
});

describe("ambiguity at the near hop is NULL, and is not rescued by a far one", () => {
  it("writes no edge when the spec carries two standing decisions", async () => {
    const { db } = fakeDb([{ table: "decisions", resp: rows([{ id: D1 }, { id: D2 }]) }]);
    const edge = await resolveSettledDecision(db, spec);
    expect(edge.decisionId).toBeNull();
    expect(edge.why).toContain("more than one standing decision");
  });

  it("stops there rather than looking at the track", async () => {
    /*
     * THE ASSERTION THIS FILE EXISTS FOR, alongside the one above. A track that
     * happens to hold exactly one decision is not evidence about WHICH of the
     * spec's two calls the verdict settles — it is a tiebreak invented by the
     * query. Falling through would launder the ambiguity into an answer, and the
     * answer would be wrong roughly half the time on exactly the rows the moat
     * sentence is about.
     */
    const { db, calls } = fakeDb([
      { table: "decisions", resp: rows([{ id: D1 }, { id: D2 }]) },
      { table: "spine_track_members", resp: rows([{ track_id: TRACK }]) },
    ]);
    const edge = await resolveSettledDecision(db, spec);
    expect(edge.decisionId).toBeNull();
    expect(calls.length).toBe(1);
  });
});

describe("the track answers on the route where nothing else can", () => {
  /*
   * `decision.record` writes `prd_id` only when the agent passes one, and at
   * Decide the spec does not exist yet, so `decisions.prd_id` is null there by
   * construction. On the autonomous route the track is the ONLY record that
   * connects the call to the spec it produced.
   */
  const trackScript = (decisionRows: unknown[]) => [
    { table: "decisions", resp: rows([]) },
    { table: "spine_track_members", resp: rows([{ track_id: TRACK }]) },
    { table: "spine_track_members", resp: rows([{ artifact_id: D1 }]) },
    { table: "decisions", resp: rows(decisionRows) },
  ];

  it("names the one decision on the spec's track", async () => {
    const { db } = fakeDb(trackScript([{ id: D1 }]));
    const edge = await resolveSettledDecision(db, spec);
    expect(edge.decisionId).toBe(D1);
    expect(edge.why).toContain("the track this spec came out of");
  });

  it("requires the call to predate the spec it supposedly produced", async () => {
    // A decision filed on the same track AFTER the spec is a later call — a
    // Learn-station "what next" — and attributing this verdict to it would be a
    // wrong edge with a plausible shape.
    const { db, calls } = fakeDb(trackScript([{ id: D1 }]));
    await resolveSettledDecision(db, spec);
    const shape = shapeOf(calls[3]);
    expect(shape).toContain("lte:created_at");
    expect(shape).toContain("eq:workspace_id");
    expect(shape).toContain("neq:status");
  });

  it("writes no edge when the track recorded two decisions", async () => {
    const { db } = fakeDb(trackScript([{ id: D1 }, { id: D2 }]));
    const edge = await resolveSettledDecision(db, spec);
    expect(edge.decisionId).toBeNull();
    expect(edge.why).toContain("more than one decision");
  });

  it("says so plainly when the spec is on no track at all", async () => {
    const { db } = fakeDb([
      { table: "decisions", resp: rows([]) },
      { table: "spine_track_members", resp: rows([]) },
    ]);
    const edge = await resolveSettledDecision(db, spec);
    expect(edge.decisionId).toBeNull();
    expect(edge.why).toContain("belongs to no track");
  });

  it("says so plainly when the track recorded no decision", async () => {
    const { db } = fakeDb([
      { table: "decisions", resp: rows([]) },
      { table: "spine_track_members", resp: rows([{ track_id: TRACK }]) },
      { table: "spine_track_members", resp: rows([]) },
    ]);
    const edge = await resolveSettledDecision(db, spec);
    expect(edge.decisionId).toBeNull();
    expect(edge.why).toContain("recorded no decision");
  });

  it("says so plainly when every candidate on the track postdates the spec", async () => {
    // The candidate existed and the date filter removed it, which is a different
    // fact from "the track recorded nothing" and reads differently to whoever
    // goes looking for the missing edge.
    const { db } = fakeDb(trackScript([]));
    const edge = await resolveSettledDecision(db, spec);
    expect(edge.decisionId).toBeNull();
    expect(edge.why).toContain("predates the spec");
  });
});

describe("attribution never costs a verdict", () => {
  /*
   * A verdict is real work a person or an agent did. Everything in this resolver
   * is enrichment, so a failure here reports less and must never throw back into
   * `applyOutcome`, which by that point has already moved a bet's confidence.
   */
  it("returns NULL and the database's own words when the lookup fails", async () => {
    const { db } = fakeDb([{ table: "decisions", resp: fails("permission denied for decisions") }]);
    const edge = await resolveSettledDecision(db, spec);
    expect(edge.decisionId).toBeNull();
    expect(edge.why).toContain("permission denied for decisions");
  });

  it("returns NULL rather than throwing when the client itself blows up", async () => {
    const exploding = {
      from() {
        throw new Error("client is not configured");
      },
    } as never;
    const edge = await resolveSettledDecision(exploding, spec);
    expect(edge.decisionId).toBeNull();
    expect(edge.why).toContain("client is not configured");
  });

  it("never returns an empty reason, so a NULL is always explained", async () => {
    for (const script of [
      [{ table: "decisions", resp: rows([{ id: D1 }]) }],
      [{ table: "decisions", resp: rows([{ id: D1 }, { id: D2 }]) }],
      [
        { table: "decisions", resp: rows([]) },
        { table: "spine_track_members", resp: rows([]) },
      ],
    ]) {
      const { db } = fakeDb(script);
      const edge = await resolveSettledDecision(db, spec);
      expect(edge.why.length).toBeGreaterThan(0);
    }
  });
});

/* ------------------------------------------------------------------------ *
 * AND THE PART A RESOLVER TEST CANNOT SEE: does the row actually carry it.
 *
 * `resolveSettledDecision` returning the right id proves nothing on its own —
 * this repo has already paid for the difference between a function that returns
 * a value and a writer that files it. So these run the real `applyOutcome`
 * against a stub client and read the `learnings` INSERT it produced.
 *
 * ONE HONEST COST, STATED. `applyOutcome` calls `rememberOutcome`, which embeds
 * the outcome memory before writing it. With an embedding key in the
 * environment that is a real network call; without one `rememberOutcome`
 * fail-softs and writes no memory row, which is a documented branch and changes
 * nothing about the assertions below. All three cases below therefore settle the
 * SAME verdict with the SAME summary against the SAME spec title, so the memory
 * content is byte-identical and `embedCache` serves the second and third from
 * memory: one call per run of this file, not three. The verdict is not what any
 * of them is about. No `mock.module` here: Bun's module mocks are
 * process-wide and bind into whichever suite imports the target next, which is
 * a bill `WhatShipped.test.tsx` has already paid on this repo's behalf.
 * ------------------------------------------------------------------------ */

/** A permissive client: `prds` reads back a spec, `decisions` answers with
 *  whatever the case supplies, everything else is empty and fail-soft. */
function applyStub(decisionRows: Array<{ id: string }>) {
  const writes: Array<{ table: string; row: Record<string, unknown> }> = [];
  const client = {
    from(table: string) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const b: any = {};
      for (const m of [
        "select",
        "eq",
        "neq",
        "in",
        "lte",
        "gte",
        "is",
        "not",
        "or",
        "ilike",
        "order",
        "limit",
        "filter",
      ]) {
        b[m] = () => b;
      }
      b.insert = (row: Record<string, unknown>) => {
        writes.push({ table, row });
        return b;
      };
      b.update = (row: Record<string, unknown>) => {
        writes.push({ table: `${table}:update`, row });
        return b;
      };
      b.upsert = () => b;
      b.single = async () =>
        table === "prds"
          ? {
              data: {
                id: SPEC,
                workspace_id: WS,
                opportunity_id: null,
                title: "The firmware notice",
                outcome: null,
                created_at: CREATED,
              },
              error: null,
            }
          : { data: { id: "learning-1" }, error: null };
      b.maybeSingle = async () => ({ data: null, error: null });
      b.then = (ok: (v: Resp) => unknown, no?: (e: unknown) => unknown) => {
        if (table === "decisions") return Promise.resolve(rows(decisionRows)).then(ok, no);
        // The last write in applyOutcome checks that `prds.update` matched a row.
        if (table === "prds") return Promise.resolve(rows([{ id: SPEC }])).then(ok, no);
        return Promise.resolve(rows([])).then(ok, no);
      };
      return b;
    },
    rpc: async () => ({ data: null, error: null }),
  };
  return { client: client as never, writes };
}

const learningInsert = (writes: Array<{ table: string; row: Record<string, unknown> }>) =>
  writes.find((w) => w.table === "learnings")?.row;

describe("applyOutcome files the edge, it does not merely compute it", () => {
  it("writes decision_id onto the learnings row", async () => {
    const { client, writes } = applyStub([{ id: D1 }]);
    const res = await applyOutcome(client, "user-1", {
      prdId: SPEC,
      verdict: "validated",
      summary: "Reboot tickets fell to 14 a week.",
      by: { kind: "human" },
    });
    expect(learningInsert(writes)?.decision_id).toBe(D1);
    expect(res.decisionEdge.decisionId).toBe(D1);
  });

  it("writes NULL, not a guess, when the spec carries two standing decisions", async () => {
    const { client, writes } = applyStub([{ id: D1 }, { id: D2 }]);
    const res = await applyOutcome(client, "user-1", {
      prdId: SPEC,
      verdict: "validated",
      summary: "Reboot tickets fell to 14 a week.",
      by: { kind: "human" },
    });
    const row = learningInsert(writes);
    // Present and null, rather than absent: the column is written on every
    // outcome from here on, so "no edge" is a recorded answer.
    expect(row).toHaveProperty("decision_id");
    expect(row?.decision_id).toBeNull();
    expect(res.decisionEdge.why).toContain("more than one standing decision");
  });

  it("carries the reason back to the caller, so a NULL can be explained", async () => {
    // `/learn` renders a receipt rather than a toast, and a receipt that shows a
    // settled outcome with a silently missing edge is the shape this repo keeps
    // finding: correct code whose gap nobody can see.
    const { client } = applyStub([]);
    const res = await applyOutcome(client, "user-1", {
      prdId: SPEC,
      verdict: "validated",
      summary: "Reboot tickets fell to 14 a week.",
      by: { kind: "human" },
    });
    expect(res.decisionEdge.decisionId).toBeNull();
    expect(res.decisionEdge.why.length).toBeGreaterThan(0);
  });
});
