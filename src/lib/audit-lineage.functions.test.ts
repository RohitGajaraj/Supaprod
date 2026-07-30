import { describe, expect, test } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";

import { CANDIDATE_CAP, resolveEntityLineage, shortToUuidRange } from "./audit-lineage.functions";
import { auditShort } from "./audit-id";

/**
 * The bug these tests exist for: `OPP·600000` used to resolve to an arbitrary
 * one of three real opportunities, because the resolver scanned two thousand
 * rows and took the first whose six-hex short matched. Six hex collide. The
 * scan is now a primary-key prefix range, and a collision is REPORTED rather
 * than broken by whichever row PostgREST happened to return first.
 */

type Row = Record<string, unknown>;
type Table = Row[] | { error: { message: string } };

type Call = {
  table: string;
  columns: string;
  count: string | undefined;
  filters: Array<[string, string, string]>;
  order: string | null;
  limit: number | null;
};

/** A fake PostgREST builder: records what was asked for, applies the filters. */
function fakeDb(tables: Record<string, Table>) {
  const calls: Call[] = [];
  const from = (table: string) => ({
    select(columns: string, options?: { count?: "exact" }) {
      const call: Call = {
        table,
        columns,
        count: options?.count,
        filters: [],
        order: null,
        limit: null,
      };
      calls.push(call);
      const entry = tables[table];

      const run = () => {
        if (entry !== undefined && !Array.isArray(entry)) {
          return { data: null, error: entry.error, count: null };
        }
        let rows = Array.isArray(entry) ? [...entry] : [];
        for (const [op, col, val] of call.filters) {
          rows = rows.filter((r) => {
            const v = typeof r[col] === "string" ? (r[col] as string) : "";
            if (op === "eq") return v === val;
            if (op === "gte") return v >= val;
            if (op === "lte") return v <= val;
            return true;
          });
        }
        if (call.order) {
          const col = call.order;
          rows.sort((a, b) => String(a[col] ?? "").localeCompare(String(b[col] ?? "")));
        }
        const total = rows.length;
        const page = call.limit === null ? rows : rows.slice(0, call.limit);
        return { data: page, error: null, count: call.count === "exact" ? total : null };
      };

      const builder = {
        eq(col: string, val: string) {
          call.filters.push(["eq", col, val]);
          return builder;
        },
        gte(col: string, val: string) {
          call.filters.push(["gte", col, val]);
          return builder;
        },
        lte(col: string, val: string) {
          call.filters.push(["lte", col, val]);
          return builder;
        },
        order(col: string, _opts?: { ascending?: boolean }) {
          call.order = col;
          return builder;
        },
        limit(n: number) {
          call.limit = n;
          return builder;
        },
        then<T>(onOk: (v: ReturnType<typeof run>) => T, onErr?: (e: unknown) => T): Promise<T> {
          return Promise.resolve(run()).then(onOk, onErr);
        },
      };
      return builder;
    },
  });
  return { db: { from } as unknown as SupabaseClient, calls };
}

/** Three real opportunities that every share the short `600000`. This is the
 *  live demo workspace's shape, not a contrived one. */
const COLLIDING = [
  { id: "60000000-0005-4000-8000-000000000001", title: "Cut onboarding to one screen" },
  { id: "600000ff-0001-4000-8000-000000000002", title: "Retire the legacy importer" },
  { id: "6000001a-9999-4000-8000-000000000003", title: "Price the agent seat" },
];
const LONE = {
  id: "abcdef12-0000-4000-8000-000000000009",
  title: "Only one of these",
  status: "open",
  created_at: "2026-07-20T10:00:00Z",
};

describe("shortToUuidRange: the bounds", () => {
  test("a six-hex short becomes two real uuids around it", () => {
    expect(shortToUuidRange("600000")).toEqual({
      lo: "60000000-0000-0000-0000-000000000000",
      hi: "600000ff-ffff-ffff-ffff-ffffffffffff",
    });
  });

  test("both bounds are canonically shaped uuids, so Postgres can cast them", () => {
    const shape = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    const r = shortToUuidRange("7e7d59");
    expect(r).not.toBeNull();
    expect(r?.lo).toMatch(shape);
    expect(r?.hi).toMatch(shape);
  });

  test("the bounds carry the same short the tag shows, which is the whole contract", () => {
    const r = shortToUuidRange("005c82");
    expect(auditShort(r?.lo ?? "")).toBe("005C82");
    expect(auditShort(r?.hi ?? "")).toBe("005C82");
  });

  test("a known uuid falls inside the range built from its own short", () => {
    for (const row of [...COLLIDING, LONE]) {
      const r = shortToUuidRange(auditShort(row.id));
      expect(r).not.toBeNull();
      expect(row.id >= (r as { lo: string }).lo).toBe(true);
      expect(row.id <= (r as { hi: string }).hi).toBe(true);
    }
  });

  test("a uuid differing in the sixth hex falls outside", () => {
    const r = shortToUuidRange("600000") as { lo: string; hi: string };
    const neighbour = "60000100-0000-4000-8000-000000000001";
    expect(neighbour > r.hi).toBe(true);
    const below = "5fffffff-0000-4000-8000-000000000001";
    expect(below < r.lo).toBe(true);
  });

  test("case does not matter: a tag is uppercase, a stored uuid is not", () => {
    expect(shortToUuidRange("7E7D59")).toEqual(shortToUuidRange("7e7d59"));
  });

  test("anything that is not exactly six hex has no bounds", () => {
    for (const bad of ["60000", "6000000", "zzzzzz", "60-000", "", "  ", "600 00"]) {
      expect(shortToUuidRange(bad)).toBeNull();
    }
  });
});

describe("resolveEntityLineage: a tag finds its row by range, not by scan", () => {
  test("a single match resolves to that row", async () => {
    const { db, calls } = fakeDb({ opportunities: [...COLLIDING, LONE] });
    const out = await resolveEntityLineage(db, "OPP·ABCDEF");

    expect(out.found).toBe(true);
    expect(out.ambiguous).toBe(false);
    expect(out.candidates).toEqual([]);
    expect(out.candidateCount).toBe(1);
    expect(out.entityId).toBe(LONE.id);
    expect(out.ref).toBe("OPP·ABCDEF");
    expect(out.title).toBe("Only one of these");
    expect(out.status).toBe("open");
    expect(out.kind).toBe("opportunity");
    expect(out.label).toBe("Opportunity");
    expect(out.steps.length).toBeGreaterThan(0);

    // One query, bounded by the primary key. No 2000-row window anywhere.
    expect(calls).toHaveLength(1);
    expect(calls[0].table).toBe("opportunities");
    expect(calls[0].filters).toEqual([
      ["gte", "id", "abcdef00-0000-0000-0000-000000000000"],
      ["lte", "id", "abcdefff-ffff-ffff-ffff-ffffffffffff"],
    ]);
    expect(calls[0].limit).toBe(CANDIDATE_CAP);
    expect(calls[0].count).toBe("exact");
  });

  test("separators and case are the parser's business, and still land on the row", async () => {
    const { db } = fakeDb({ opportunities: [LONE] });
    for (const typed of ["opp-abcdef", "OPP abcdef", "opp_ABCDEF", "OPP·abcdef"]) {
      expect((await resolveEntityLineage(db, typed)).entityId).toBe(LONE.id);
    }
  });

  // THE BUG. Three real rows, one tag. The old resolver named one of them.
  test("a colliding tag reports every candidate instead of picking one", async () => {
    const { db } = fakeDb({ opportunities: [...COLLIDING, LONE] });
    const out = await resolveEntityLineage(db, "OPP·600000");

    expect(out.ambiguous).toBe(true);
    expect(out.candidateCount).toBe(3);
    expect(out.candidates.map((c) => c.entityId).sort()).toEqual(COLLIDING.map((r) => r.id).sort());
    expect(out.candidates.map((c) => c.title).sort()).toEqual(COLLIDING.map((r) => r.title).sort());

    // It never pretends to have an answer: no entity, no title, no walk.
    expect(out.found).toBe(false);
    expect(out.entityId).toBeNull();
    expect(out.title).toBe("");
    expect(out.steps).toEqual([]);
    // But it still says what KIND of thing collided, so the pane keeps a header.
    expect(out.ref).toBe("OPP·600000");
    expect(out.kind).toBe("opportunity");
    expect(out.label).toBe("Opportunity");
    expect(out.stage).toBe("Decide");
  });

  test("a collision bigger than the cap reports the real total, not the page size", async () => {
    const many = Array.from({ length: CANDIDATE_CAP + 7 }, (_, i) => ({
      id: `600000${i.toString(16).padStart(2, "0")}-0000-4000-8000-00000000000${(i % 10).toString()}`,
      title: `Opportunity ${i}`,
    }));
    const { db } = fakeDb({ opportunities: many });
    const out = await resolveEntityLineage(db, "OPP·600000");

    expect(out.ambiguous).toBe(true);
    expect(out.candidates).toHaveLength(CANDIDATE_CAP);
    expect(out.candidateCount).toBe(CANDIDATE_CAP + 7);
  });

  test("a tag matching nothing is not found, and says what it was looking for", async () => {
    const { db, calls } = fakeDb({ opportunities: [...COLLIDING] });
    const out = await resolveEntityLineage(db, "OPP·123456");

    expect(out.found).toBe(false);
    expect(out.ambiguous).toBe(false);
    expect(out.candidates).toEqual([]);
    expect(out.candidateCount).toBe(0);
    expect(out.ref).toBe("OPP·123456");
    expect(out.kind).toBe("opportunity");
    expect(out.label).toBe("Opportunity");
    expect(calls).toHaveLength(1);
  });

  test("a short that is not six hex is rejected before it costs a query", async () => {
    const { db, calls } = fakeDb({ opportunities: [...COLLIDING] });
    for (const typed of ["OPP·60000", "OPP·6000000", "OPP·ZZZZZZ", "OPP·beta"]) {
      const out = await resolveEntityLineage(db, typed);
      expect(out.found).toBe(false);
      expect(out.ambiguous).toBe(false);
      expect(out.kind).toBe("opportunity");
    }
    // No bounds means no range, and no range means nothing to ask the database.
    expect(calls).toHaveLength(0);
  });

  test("an unknown stage prefix is not a tag at all", async () => {
    const { db, calls } = fakeDb({ opportunities: [...COLLIDING] });
    const out = await resolveEntityLineage(db, "XYZ·600000");
    expect(out.found).toBe(false);
    expect(out.kind).toBeNull();
    expect(out.ref).toBe("XYZ·600000");
    expect(calls).toHaveLength(0);
  });

  test("a read failure is raised, not disguised as an empty record", async () => {
    const { db } = fakeDb({ opportunities: { error: { message: "permission denied" } } });
    await expect(resolveEntityLineage(db, "OPP·600000")).rejects.toThrow("permission denied");
  });
});

describe("resolveEntityLineage: a uuid is exact, and stays exact", () => {
  test("a pasted uuid resolves to that row even when siblings share its short", async () => {
    const { db } = fakeDb({ opportunities: [...COLLIDING] });
    const out = await resolveEntityLineage(db, COLLIDING[2].id);

    expect(out.found).toBe(true);
    expect(out.ambiguous).toBe(false);
    expect(out.entityId).toBe(COLLIDING[2].id);
    expect(out.title).toBe("Price the agent seat");
  });

  test("a uuid in no table is not found", async () => {
    const { db } = fakeDb({ opportunities: [...COLLIDING] });
    const out = await resolveEntityLineage(db, "99999999-0000-4000-8000-000000000009");
    expect(out.found).toBe(false);
    expect(out.kind).toBeNull();
  });

  test("junk is not found and costs nothing", async () => {
    const { db, calls } = fakeDb({ opportunities: [...COLLIDING] });
    expect((await resolveEntityLineage(db, "not an id")).found).toBe(false);
    expect(calls).toHaveLength(0);
  });
});
