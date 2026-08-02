import { describe, it, expect } from "bun:test";
import {
  readProbe,
  readIntegrity,
  readVocabulary,
  resolveProbe,
  type LivenessClient,
  type ProbeQuery,
  type ProbeResult,
} from "./probe";

/**
 * The runner is not the part that must not lie, but it is the part that turns a
 * declaration into a query, and a wrong translation produces a confident wrong
 * answer. These tests pin the translation: what table, what filters, and above
 * all that "is null" is asked as `is(column, null)` and not as an equality
 * against the string "null", which returns zero rows and looks like good news.
 */

type Recorded = {
  table: string;
  columns: string;
  head: boolean;
  ops: Array<[string, ...unknown[]]>;
};

function fakeClient(respond: (call: Recorded) => Partial<ProbeResult>): {
  client: LivenessClient;
  calls: Recorded[];
} {
  const calls: Recorded[] = [];

  const client: LivenessClient = {
    from(table: string) {
      return {
        select(columns: string, opts?: { count?: "exact"; head?: boolean }) {
          const record: Recorded = { table, columns, head: !!opts?.head, ops: [] };
          calls.push(record);

          const query: ProbeQuery = {
            eq(column, value) {
              record.ops.push(["eq", column, value]);
              return query;
            },
            neq(column, value) {
              record.ops.push(["neq", column, value]);
              return query;
            },
            in(column, values) {
              record.ops.push(["in", column, values]);
              return query;
            },
            is(column, value) {
              record.ops.push(["is", column, value]);
              return query;
            },
            not(column, operator, value) {
              record.ops.push(["not", column, operator, value]);
              return query;
            },
            gte(column, value) {
              record.ops.push(["gte", column, value]);
              return query;
            },
            order(column, opts2) {
              record.ops.push(["order", column, opts2]);
              return query;
            },
            limit(count) {
              record.ops.push(["limit", count]);
              return query;
            },
            then(onfulfilled, onrejected) {
              const base: ProbeResult = { data: [], count: 0, error: null };
              return Promise.resolve({ ...base, ...respond(record) }).then(onfulfilled, onrejected);
            },
          };
          return query;
        },
      };
    },
  };

  return { client, calls };
}

const WINDOW_START = "2026-07-26T00:00:00.000Z";

describe("resolveProbe", () => {
  it("points a job probe at job_runs and its own name", () => {
    expect(resolveProbe({ source: "job_runs", jobName: "cron.embed-tick" })).toEqual({
      table: "job_runs",
      timeColumn: "started_at",
      filters: [{ column: "job_name", op: "eq", value: "cron.embed-tick" }],
    });
  });

  it("adds a success filter only when asked", () => {
    const strict = resolveProbe({ source: "job_runs", jobName: "x", successfulOnly: true });
    expect(strict.filters).toHaveLength(2);
    expect(strict.filters[1]).toEqual({ column: "status", op: "eq", value: "ok" });
  });

  it("points a model probe at ai_events and its surface", () => {
    expect(resolveProbe({ source: "ai_events", surface: "embed" })).toEqual({
      table: "ai_events",
      timeColumn: "created_at",
      filters: [{ column: "surface", op: "eq", value: "embed" }],
    });
  });

  it("separates one caller of a surface from another by surface_ref", () => {
    const r = resolveProbe({
      source: "ai_events",
      surface: "embed",
      surfaceRef: "signal-embedding-backfill",
    });
    expect(r.filters).toEqual([
      { column: "surface", op: "eq", value: "embed" },
      { column: "surface_ref", op: "eq", value: "signal-embedding-backfill" },
    ]);
  });

  it("passes a table probe through unchanged", () => {
    expect(
      resolveProbe({
        source: "table",
        table: "signals",
        timeColumn: "created_at",
        filters: [{ column: "source_kind", op: "eq", value: "pulse" }],
      }),
    ).toEqual({
      table: "signals",
      timeColumn: "created_at",
      filters: [{ column: "source_kind", op: "eq", value: "pulse" }],
    });
  });
});

describe("readProbe", () => {
  it("asks for a windowed count and an all-time last row", async () => {
    const { client, calls } = fakeClient((call) =>
      call.head
        ? { count: 12 }
        : { data: [{ created_at: "2026-08-02T09:00:00.000Z" }], count: null },
    );

    const reading = await readProbe(
      client,
      { source: "table", table: "signals", timeColumn: "created_at" },
      WINDOW_START,
    );

    expect(reading.countInWindow).toBe(12);
    expect(reading.lastAt).toBe("2026-08-02T09:00:00.000Z");

    const countCall = calls.find((c) => c.head)!;
    expect(countCall.table).toBe("signals");
    expect(countCall.ops).toContainEqual(["gte", "created_at", WINDOW_START]);

    // The all-time read must NOT carry the window, or "never" becomes
    // indistinguishable from "not this week".
    const lastCall = calls.find((c) => !c.head)!;
    expect(lastCall.ops.some(([op]) => op === "gte")).toBe(false);
    expect(lastCall.ops).toContainEqual(["limit", 1]);
  });

  it("reports never rather than zero when no row has ever been written", async () => {
    const { client } = fakeClient((call) => (call.head ? { count: 0 } : { data: [] }));
    const reading = await readProbe(
      client,
      { source: "table", table: "pulse", timeColumn: "created_at" },
      WINDOW_START,
    );
    expect(reading.countInWindow).toBe(0);
    expect(reading.lastAt).toBeNull();
  });

  it("surfaces a read failure instead of returning a confident zero", async () => {
    const { client } = fakeClient(() => ({ error: { message: "permission denied" } }));
    const reading = await readProbe(
      client,
      { source: "job_runs", jobName: "cron.liveness-tick" },
      WINDOW_START,
    );
    expect(reading.probeFailed).toBe(true);
    expect(reading.probeError).toBe("permission denied");
  });

  it("survives a client that throws", async () => {
    const client: LivenessClient = {
      from() {
        throw new Error("connection refused");
      },
    };
    const reading = await readProbe(
      client,
      { source: "ai_events", surface: "embed" },
      WINDOW_START,
    );
    expect(reading.probeFailed).toBe(true);
    expect(reading.probeError).toBe("connection refused");
  });
});

describe("readIntegrity", () => {
  it("asks for nulls with is(column, null), never an equality", async () => {
    const { client, calls } = fakeClient((call) =>
      call.ops.some(([op]) => op === "is") ? { count: 181 } : { count: 181 },
    );

    const reading = await readIntegrity(client, { table: "themes", column: "embedding" });
    expect(reading.totalRows).toBe(181);
    expect(reading.offendingRows).toBe(181);

    const nullCall = calls.find((c) => c.ops.some(([op]) => op === "is"))!;
    expect(nullCall.ops).toContainEqual(["is", "embedding", null]);
    expect(nullCall.head).toBe(true);
  });

  it("counts each declared segment on its own", async () => {
    const { client, calls } = fakeClient((call) => {
      const seg = call.ops.find(([op, column]) => op === "eq" && column === "kind")?.[2];
      const isNullQuery = call.ops.some(([op]) => op === "is");
      if (seg === "note") return { count: isNullQuery ? 31 : 31 };
      if (seg === "precedent") return { count: isNullQuery ? 18 : 18 };
      return { count: isNullQuery ? 249 : 421 };
    });

    const reading = await readIntegrity(client, {
      table: "agent_memory",
      column: "embedding",
      segmentColumn: "kind",
      segments: ["note", "precedent"],
    });

    expect(reading.totalRows).toBe(421);
    expect(reading.offendingRows).toBe(249);
    expect(reading.segments).toEqual([
      { segment: "note", totalRows: 31, offendingRows: 31 },
      { segment: "precedent", totalRows: 18, offendingRows: 18 },
    ]);

    // Two reads for the table plus two per segment, and no more.
    expect(calls).toHaveLength(6);
  });

  it("keeps the caller's own filters alongside the null filter", async () => {
    const { client, calls } = fakeClient(() => ({ count: 3 }));
    await readIntegrity(client, {
      table: "signals",
      column: "embedding",
      filters: [{ column: "status", op: "neq", value: "archived" }],
    });
    const nullCall = calls.find((c) => c.ops.some(([op]) => op === "is"))!;
    expect(nullCall.ops).toContainEqual(["neq", "status", "archived"]);
    expect(nullCall.ops).toContainEqual(["is", "embedding", null]);
  });

  it("surfaces a failed read rather than reporting a clean table", async () => {
    const { client } = fakeClient(() => ({ error: { message: "relation does not exist" } }));
    const reading = await readIntegrity(client, { table: "nope", column: "embedding" });
    expect(reading.probeFailed).toBe(true);
    expect(reading.probeError).toBe("relation does not exist");
  });
});

describe("readVocabulary", () => {
  const declared = ["signal", "decision", "learning"] as const;

  it("asks twice and no more, so the page cannot trip the subrequest ceiling", async () => {
    const { client, calls } = fakeClient((call) =>
      call.ops.some(([op]) => op === "in") ? { count: 704 } : { count: 850 },
    );

    const reading = await readVocabulary(client, {
      table: "artifact_lineage",
      column: "child_kind",
      declared,
    });

    expect(reading.totalRows).toBe(850);
    expect(reading.declaredRows).toBe(704);
    expect(reading.declaredCounts).toBeUndefined();
    expect(calls).toHaveLength(2);
    expect(calls[1].ops).toContainEqual(["in", "child_kind", ["signal", "decision", "learning"]]);
  });

  it("counts each value only when the breakdown is asked for", async () => {
    const { client, calls } = fakeClient((call) => {
      const value = call.ops.find(([op, c]) => op === "eq" && c === "child_kind")?.[2];
      if (value === "learning") return { count: 0 };
      if (value) return { count: 352 };
      return { count: call.ops.some(([op]) => op === "in") ? 704 : 850 };
    });

    const reading = await readVocabulary(
      client,
      { table: "artifact_lineage", column: "child_kind", declared },
      { perValue: true },
    );

    expect(reading.declaredCounts).toEqual([
      { value: "signal", rows: 352 },
      { value: "decision", rows: 352 },
      { value: "learning", rows: 0 },
    ]);
    expect(calls).toHaveLength(5);
  });

  it("surfaces a failed read rather than reporting a total drift", async () => {
    const { client } = fakeClient(() => ({ error: { message: "statement timeout" } }));
    const reading = await readVocabulary(client, {
      table: "artifact_lineage",
      column: "child_kind",
      declared,
    });
    expect(reading.probeFailed).toBe(true);
    expect(reading.totalRows).toBe(0);
  });
});
