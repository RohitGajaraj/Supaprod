import { describe, it, expect } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveAnswerBlocks } from "./ask-blocks.server";
import { formatAuditId } from "./audit-id";

type QueryResult = { data: unknown; error: unknown };
type LoggedCall = { table: string; method: string; args: unknown[] };

/**
 * Chainable thenable mock routed by table name. Every builder method logs
 * its call and returns the builder; awaiting any chain resolves to the
 * table's configured { data, error }. The log makes filters assertable
 * (e.g. the exact ids passed to `.in`), so dedupe and caps are verified
 * against what was actually queried, not just the output shape.
 */
function mockSupabase(tables: Record<string, QueryResult>, log: LoggedCall[] = []) {
  const makeBuilder = (table: string, result: QueryResult) => {
    const builder: unknown = {
      then(resolve: (v: QueryResult) => unknown, reject?: (e: unknown) => unknown) {
        return Promise.resolve(result).then(resolve, reject);
      },
    };
    for (const method of ["select", "in", "gte", "not", "or", "order", "limit"]) {
      builder[method] = (...args: unknown[]) => {
        log.push({ table, method, args });
        return builder;
      };
    }
    return builder;
  };
  return {
    from: (table: string) => {
      const result = tables[table];
      if (!result) throw new Error(`mockSupabase: unexpected table "${table}"`);
      return makeBuilder(table, result);
    },
  } as unknown as SupabaseClient;
}

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

const decisionRow = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  title: `Decision ${id}`,
  status: "accepted",
  rationale: "because",
  decided_by_agent_slug: "critic",
  source_kind: "agent",
  created_at: daysAgo(2),
  ...overrides,
});

const missionRow = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  title: `Mission ${id}`,
  status: "running",
  goal: "ship it",
  created_at: daysAgo(3),
  completed_at: null,
  ...overrides,
});

describe("resolveAnswerBlocks", () => {
  describe("entity cards from chunk refs", () => {
    it("resolves a decision + mission ref into blocks in chunkRef order", async () => {
      const d1 = decisionRow("d1");
      const m1 = missionRow("m1");
      const supabase = mockSupabase({
        decisions: { data: [d1], error: null },
        missions: { data: [m1], error: null },
      });

      const blocks = await resolveAnswerBlocks(supabase, {
        question: "why did we pick supabase?",
        chunkRefs: [
          { source_kind: "mission", source_id: "m1" },
          { source_kind: "decision", source_id: "d1" },
        ],
      });

      // Mission ref came first, so the mission card renders first.
      expect(blocks.length).toBe(2);
      expect(blocks[0]).toEqual({
        kind: "mission",
        id: "m1",
        title: "Mission m1",
        status: "running",
        goal: "ship it",
        createdAt: m1.created_at,
      });
      expect(blocks[1]).toEqual({
        kind: "decision",
        id: "d1",
        title: "Decision d1",
        status: "accepted",
        rationale: "because",
        decidedBy: "critic",
        sourceKind: "agent",
        createdAt: d1.created_at,
      });
    });

    it("dedupes repeated refs and queries each id once", async () => {
      const log: LoggedCall[] = [];
      const supabase = mockSupabase(
        {
          decisions: { data: [decisionRow("d1")], error: null },
          missions: { data: [missionRow("m1")], error: null },
        },
        log,
      );

      const blocks = await resolveAnswerBlocks(supabase, {
        question: "plain question",
        chunkRefs: [
          { source_kind: "decision", source_id: "d1" },
          { source_kind: "decision", source_id: "d1" },
          { source_kind: "mission", source_id: "m1" },
        ],
      });

      expect(blocks.length).toBe(2);
      const inCalls = log.filter((c) => c.table === "decisions" && c.method === "in");
      expect(inCalls.length).toBe(1);
      expect(inCalls[0].args).toEqual(["id", ["d1"]]);
    });

    it("caps entity cards at 3, dropping later refs before querying", async () => {
      const log: LoggedCall[] = [];
      const supabase = mockSupabase(
        {
          decisions: { data: [decisionRow("d1")], error: null },
          opportunities: {
            data: [{ id: "o1", title: "Opp o1", status: "now", ice_score: 7.5 }],
            error: null,
          },
          missions: { data: [missionRow("m1")], error: null },
        },
        log,
      );

      const blocks = await resolveAnswerBlocks(supabase, {
        question: "plain question",
        chunkRefs: [
          { source_kind: "decision", source_id: "d1" },
          { source_kind: "opportunity", source_id: "o1" },
          { source_kind: "mission", source_id: "m1" },
          { source_kind: "decision", source_id: "d2" },
        ],
      });

      expect(blocks.map((b) => b.kind)).toEqual(["decision", "opportunity", "mission"]);
      expect(blocks[1]).toEqual({
        kind: "opportunity",
        id: "o1",
        title: "Opp o1",
        status: "now",
        iceScore: 7.5,
      });
      // The 4th ref (d2) never reached the query.
      const inCalls = log.filter((c) => c.table === "decisions" && c.method === "in");
      expect(inCalls[0].args).toEqual(["id", ["d1"]]);
    });

    it("ignores non-entity source kinds and null source ids without querying", async () => {
      const log: LoggedCall[] = [];
      const supabase = mockSupabase(
        {
          decisions: { data: [decisionRow("d1")], error: null },
          opportunities: { data: [], error: null },
          missions: { data: [], error: null },
        },
        log,
      );

      const blocks = await resolveAnswerBlocks(supabase, {
        question: "plain question",
        chunkRefs: [
          { source_kind: "doc", source_id: "x1" },
          { source_kind: "note", source_id: "x2" },
          { source_kind: "signal", source_id: "x3" },
          { source_kind: "decision", source_id: null },
        ],
      });

      expect(blocks).toEqual([]);
      expect(log.length).toBe(0);
    });

    it("degrades when one table errors: the other entity blocks still return", async () => {
      const supabase = mockSupabase({
        decisions: { data: null, error: { message: "boom" } },
        missions: { data: [missionRow("m1")], error: null },
      });

      const blocks = await resolveAnswerBlocks(supabase, {
        question: "plain question",
        chunkRefs: [
          { source_kind: "decision", source_id: "d1" },
          { source_kind: "mission", source_id: "m1" },
        ],
      });

      expect(blocks.length).toBe(1);
      expect(blocks[0].kind).toBe("mission");
    });
  });

  describe("timeline block", () => {
    it("merges decisions, mission lifecycle, and gates sorted desc, with a completed_at second event", async () => {
      const d1 = decisionRow("d1", { created_at: daysAgo(2) });
      const m1 = missionRow("m1", {
        status: "completed",
        created_at: daysAgo(3),
        completed_at: daysAgo(1),
      });
      const m2 = missionRow("m2", { created_at: daysAgo(5), completed_at: null });
      const a1 = { id: "a1", tool_name: "code.write", status: "approved", decided_at: daysAgo(4) };
      const supabase = mockSupabase({
        decisions: { data: [d1], error: null },
        missions: { data: [m1, m2], error: null },
        agent_approvals: { data: [a1], error: null },
      });

      const blocks = await resolveAnswerBlocks(supabase, {
        question: "what happened last week?",
        chunkRefs: [],
      });

      expect(blocks.length).toBe(1);
      const timeline = blocks[0];
      if (timeline.kind !== "timeline") throw new Error("expected a timeline block");
      expect(timeline.label).toBe("Last 7 days");
      expect(timeline.events).toEqual([
        {
          at: m1.completed_at,
          label: "Mission m1",
          detail: "mission completed",
          ref: formatAuditId("mission", "m1"),
        },
        {
          at: d1.created_at,
          label: "Decision d1",
          detail: "decision · accepted",
          ref: formatAuditId("decision", "d1"),
        },
        {
          at: m1.created_at,
          label: "Mission m1",
          detail: "mission · completed",
          ref: formatAuditId("mission", "m1"),
        },
        {
          at: a1.decided_at,
          label: "code.write",
          detail: "gate · approved",
          ref: null,
        },
        {
          at: m2.created_at,
          label: "Mission m2",
          detail: "mission · running",
          ref: formatAuditId("mission", "m2"),
        },
      ]);
    });

    it("keeps only the completion event for a mission that started before the window (review fix)", async () => {
      const oldMission = missionRow("m9", {
        status: "completed",
        created_at: daysAgo(20),
        completed_at: daysAgo(1),
      });
      const supabase = mockSupabase({
        decisions: { data: [], error: null },
        missions: { data: [oldMission], error: null },
        agent_approvals: { data: [], error: null },
      });

      const blocks = await resolveAnswerBlocks(supabase, {
        question: "what happened last week?",
        chunkRefs: [],
      });

      const timeline = blocks[0];
      if (timeline?.kind !== "timeline") throw new Error("expected a timeline block");
      expect(timeline.events).toEqual([
        {
          at: oldMission.completed_at,
          label: "Mission m9",
          detail: "mission completed",
          ref: formatAuditId("mission", "m9"),
        },
      ]);
    });

    it("parses a named window into the label", async () => {
      const supabase = mockSupabase({
        decisions: { data: [decisionRow("d1", { created_at: daysAgo(10) })], error: null },
        missions: { data: [], error: null },
        agent_approvals: { data: [], error: null },
      });

      const blocks = await resolveAnswerBlocks(supabase, {
        question: "what changed in the last 3 weeks?",
        chunkRefs: [],
      });

      const timeline = blocks[0];
      if (timeline?.kind !== "timeline") throw new Error("expected a timeline block");
      expect(timeline.label).toBe("Last 21 days");
    });

    it("omits the timeline block entirely when the window has no events", async () => {
      const supabase = mockSupabase({
        decisions: { data: [], error: null },
        missions: { data: [], error: null },
        agent_approvals: { data: [], error: null },
      });

      const blocks = await resolveAnswerBlocks(supabase, {
        question: "what happened last week?",
        chunkRefs: [],
      });

      expect(blocks).toEqual([]);
    });

    it("caps merged events at 10", async () => {
      const supabase = mockSupabase({
        decisions: {
          data: Array.from({ length: 8 }, (_, i) =>
            decisionRow(`d${i}`, { created_at: daysAgo(1) }),
          ),
          error: null,
        },
        missions: {
          data: Array.from({ length: 8 }, (_, i) =>
            missionRow(`m${i}`, { created_at: daysAgo(2) }),
          ),
          error: null,
        },
        agent_approvals: { data: [], error: null },
      });

      const blocks = await resolveAnswerBlocks(supabase, {
        question: "what happened last week?",
        chunkRefs: [],
      });

      const timeline = blocks[0];
      if (timeline?.kind !== "timeline") throw new Error("expected a timeline block");
      expect(timeline.events.length).toBe(10);
    });
  });

  describe("status digest", () => {
    it("buckets mission statuses into counts and lists the first 4 active rows", async () => {
      const statuses = [
        "running",
        "queued",
        "waiting_approval",
        "blocked",
        "completed",
        "done",
        "failed",
        "halted",
        "cancelled",
        "completed_with_failures",
        "running",
        "running",
      ];
      const supabase = mockSupabase({
        missions: {
          data: statuses.map((status, i) => ({ id: `m${i}`, title: `Mission m${i}`, status })),
          error: null,
        },
      });

      const blocks = await resolveAnswerBlocks(supabase, {
        question: "what is the status of the missions?",
        chunkRefs: [],
      });

      expect(blocks.length).toBe(1);
      const status = blocks[0];
      if (status.kind !== "status") throw new Error("expected a status block");
      expect(status.scopeLabel).toBe("Missions");
      expect(status.counts).toEqual({ running: 4, waiting: 2, done: 2, failed: 4 });
      // First 4 rows whose status is running/queued/waiting_approval, row order.
      expect(status.running.map((r) => r.id)).toEqual(["m0", "m1", "m2", "m10"]);
    });

    it("omits the digest when the missions table has no rows at all", async () => {
      const supabase = mockSupabase({ missions: { data: [], error: null } });

      const blocks = await resolveAnswerBlocks(supabase, {
        question: "where are we on everything?",
        chunkRefs: [],
      });

      expect(blocks).toEqual([]);
    });

    it("degrades to no digest on a query error", async () => {
      const supabase = mockSupabase({
        missions: { data: null, error: { message: "rls denied" } },
      });

      const blocks = await resolveAnswerBlocks(supabase, {
        question: "what is the status?",
        chunkRefs: [],
      });

      expect(blocks).toEqual([]);
    });
  });

  describe("composition", () => {
    it("returns nothing for a plain question with no refs, without querying", async () => {
      const log: LoggedCall[] = [];
      const supabase = mockSupabase({}, log);

      const blocks = await resolveAnswerBlocks(supabase, {
        question: "how should we position the launch?",
        chunkRefs: [],
      });

      expect(blocks).toEqual([]);
      expect(log.length).toBe(0);
    });

    it("orders a temporal + status question as timeline then digest", async () => {
      const supabase = mockSupabase({
        decisions: { data: [decisionRow("d1", { created_at: daysAgo(2) })], error: null },
        missions: {
          data: [missionRow("m1", { created_at: daysAgo(3) })],
          error: null,
        },
        agent_approvals: { data: [], error: null },
      });

      const blocks = await resolveAnswerBlocks(supabase, {
        question: "what happened last week, and what is the status?",
        chunkRefs: [],
      });

      expect(blocks.map((b) => b.kind)).toEqual(["timeline", "status"]);
    });

    it("returns [] when the client itself throws unexpectedly", async () => {
      const supabase = {
        from: () => {
          throw new Error("connection reset");
        },
      } as unknown as SupabaseClient;

      const blocks = await resolveAnswerBlocks(supabase, {
        question: "what happened last week?",
        chunkRefs: [{ source_kind: "decision", source_id: "d1" }],
      });

      expect(blocks).toEqual([]);
    });
  });
});
