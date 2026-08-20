/**
 * A fake PostgREST that can lose a race.
 *
 * WHY THIS EXISTS AND WHY IT IS NOT A MOCK. Every double-execution defect fixed
 * on 2026-08-14 has the same shape: a read, then a write filtered only by id.
 * A hand-rolled mock that resolves `{ data: null, error: null }` to every call
 * cannot tell that shape apart from a conditional write, because supabase-js
 * itself cannot: a refused or zero-row write RESOLVES, it does not throw. So a
 * mock proves nothing about the fix. This fake keeps real rows and applies the
 * filter chain to UPDATE as well as SELECT, which means an unguarded update
 * matches every row and a guarded one matches none once another caller has
 * moved the row. That difference is the entire test.
 *
 * The interleaving is real, not simulated with timers. Every query yields to
 * the microtask queue before it touches the store, so two calls awaited
 * together both complete their reads before either write lands, which is
 * exactly the window two Cloudflare Workers share. The store mutation itself is
 * synchronous, which is what a Postgres row lock gives you.
 *
 * Supported: eq / neq / is / in / lt / lte / gt / gte / not / or on select,
 * update and delete; select with a count or head option; maybeSingle; single;
 * order; limit; insert with a unique-constraint check. Anything else a caller
 * needs should be added here rather than worked around in a test.
 */
import { describe, expect, test } from "bun:test";

export type FakeRow = Record<string, unknown>;

export type FakeDbOptions = {
  /**
   * Columns the database does not have yet, per table. Naming one in a select
   * fails the whole statement with 42703, exactly as PostgREST does, so a
   * migration-lag fallback can be tested rather than assumed.
   */
  missingColumns?: Record<string, string[]>;
  /** Unique constraints, per table, as column tuples. Violations raise 23505. */
  unique?: Record<string, string[][]>;
  /**
   * Fires after a statement has yielded and before it reads or writes anything,
   * with the live store in hand. This is how a test PLANTS an interleaving at
   * the exact instruction where production loses the race, instead of hoping a
   * timer lands in the right window: "a human approves and the tool executes
   * between the SELECT and the UPDATE" becomes one line in a test.
   */
  beforeStatement?: (
    info: { table: string; mode: string; index: number },
    tables: Record<string, FakeRow[]>,
  ) => void;
};

type Predicate = (row: FakeRow) => boolean;

const clone = (row: FakeRow): FakeRow => ({ ...row });

/** PostgREST orders and compares timestamps as strings; so does this. */
const cmp = (a: unknown, b: unknown): number => {
  if (a === b) return 0;
  if (a === null || a === undefined) return -1;
  if (b === null || b === undefined) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a) < String(b) ? -1 : 1;
};

/**
 * One `or=(...)` term, in PostgREST's own wire syntax: `col.is.null`,
 * `col.lt.2026-08-14T00:00:00Z`. Only the operators this repo actually passes
 * are handled; an unknown one throws rather than quietly matching everything,
 * because a filter that silently matches everything is the bug class this whole
 * harness exists to catch.
 */
function parseOrTerm(term: string): Predicate {
  const [col, op, ...rest] = term.split(".");
  const raw = rest.join(".");
  switch (op) {
    case "is":
      return (r) => (raw === "null" ? r[col] === null || r[col] === undefined : r[col] === raw);
    case "eq":
      return (r) => String(r[col]) === raw;
    case "lt":
      return (r) => r[col] !== null && r[col] !== undefined && cmp(r[col], raw) < 0;
    case "lte":
      return (r) => r[col] !== null && r[col] !== undefined && cmp(r[col], raw) <= 0;
    case "gt":
      return (r) => r[col] !== null && r[col] !== undefined && cmp(r[col], raw) > 0;
    default:
      throw new Error(`fake-postgrest: unsupported or() operator "${op}" in "${term}"`);
  }
}

class FakeQuery implements PromiseLike<{ data: FakeRow[] | null; error: unknown; count?: number }> {
  private preds: Predicate[] = [];
  private mode: "select" | "update" | "insert" | "delete" | null = null;
  private patch: FakeRow = {};
  private inserted: FakeRow[] = [];
  private returning = false;
  private head = false;
  private wantCount = false;
  private lim: number | null = null;
  private orderBy: { col: string; asc: boolean } | null = null;
  private named: string[] = [];

  constructor(
    private store: Record<string, FakeRow[]>,
    private table: string,
    private opts: FakeDbOptions,
    private log: { table: string; mode: string; matched: number }[],
  ) {}

  select(cols?: string, options?: { count?: string; head?: boolean }): this {
    if (cols && cols !== "*") {
      this.named = cols
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c && !c.includes("("));
    }
    if (this.mode === null) this.mode = "select";
    else this.returning = true;
    if (options?.head) this.head = true;
    if (options?.count) this.wantCount = true;
    return this;
  }

  update(patch: FakeRow): this {
    this.mode = "update";
    this.patch = patch;
    return this;
  }

  insert(rows: FakeRow | FakeRow[]): this {
    this.mode = "insert";
    this.inserted = Array.isArray(rows) ? rows : [rows];
    return this;
  }

  delete(): this {
    this.mode = "delete";
    return this;
  }

  eq(col: string, val: unknown): this {
    this.preds.push((r) => r[col] === val);
    return this;
  }
  neq(col: string, val: unknown): this {
    // NULL is not "not equal" to anything in SQL, and PostgREST inherits that.
    this.preds.push((r) => r[col] !== null && r[col] !== undefined && r[col] !== val);
    return this;
  }
  is(col: string, val: unknown): this {
    this.preds.push((r) =>
      val === null ? r[col] === null || r[col] === undefined : r[col] === val,
    );
    return this;
  }
  in(col: string, vals: unknown[]): this {
    this.preds.push((r) => vals.includes(r[col]));
    return this;
  }
  lt(col: string, val: unknown): this {
    this.preds.push((r) => r[col] !== null && r[col] !== undefined && cmp(r[col], val) < 0);
    return this;
  }
  lte(col: string, val: unknown): this {
    this.preds.push((r) => r[col] !== null && r[col] !== undefined && cmp(r[col], val) <= 0);
    return this;
  }
  gt(col: string, val: unknown): this {
    this.preds.push((r) => r[col] !== null && r[col] !== undefined && cmp(r[col], val) > 0);
    return this;
  }
  gte(col: string, val: unknown): this {
    this.preds.push((r) => r[col] !== null && r[col] !== undefined && cmp(r[col], val) >= 0);
    return this;
  }
  not(col: string, op: string, val: unknown): this {
    /*
     * `in` takes a PARENTHESISED STRING here, not an array, and that asymmetry is
     * PostgREST's rather than this harness's: `.in(col, [a, b])` sends a list,
     * while `.not(col, "in", "(a,b)")` sends the filter verbatim. `run-status.ts`
     * exports `terminalStatusFilter()` producing exactly that string, and the
     * writers that must not clobber a terminal status use it, so a harness that
     * could not express it could not test the one guard those writers have.
     * Added 2026-08-20, after a test of that guard failed here rather than in the
     * code it was pointed at.
     */
    if (op === "in") {
      const set = new Set(
        String(val)
          .replace(/^\(|\)$/g, "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      );
      /*
       * NULL follows SQL, deliberately. `NOT (x IN (...))` is UNKNOWN when x is
       * null, so the row does NOT match. Reading it as "null is not in the set,
       * therefore keep it" would be the friendlier answer and the wrong one, and
       * a harness that is kinder than the database teaches a test to pass where
       * production would not.
       */
      this.preds.push((r) => r[col] !== null && r[col] !== undefined && !set.has(String(r[col])));
      return this;
    }
    if (op !== "is") throw new Error(`fake-postgrest: unsupported not() operator "${op}"`);
    this.preds.push(
      (r) => !(val === null ? r[col] === null || r[col] === undefined : r[col] === val),
    );
    return this;
  }
  or(expr: string): this {
    const terms = expr.split(",").map(parseOrTerm);
    this.preds.push((r) => terms.some((t) => t(r)));
    return this;
  }
  order(col: string, options?: { ascending?: boolean }): this {
    this.orderBy = { col, asc: options?.ascending !== false };
    return this;
  }
  limit(n: number): this {
    this.lim = n;
    return this;
  }

  private rows(): FakeRow[] {
    return (this.store[this.table] ??= []);
  }

  private missing(): string | null {
    const absent = this.opts.missingColumns?.[this.table] ?? [];
    const touched = [
      ...this.named,
      ...Object.keys(this.patch),
      ...this.inserted.flatMap((r) => Object.keys(r)),
    ];
    return absent.find((c) => touched.includes(c)) ?? null;
  }

  private async exec(): Promise<{ data: FakeRow[] | null; error: unknown; count?: number }> {
    // The yield that makes the race real: two queries awaited together both get
    // past this line before either mutates the store.
    await Promise.resolve();

    const absent = this.missing();
    if (absent) {
      return {
        data: null,
        error: { code: "42703", message: `column "${absent}" does not exist` },
      };
    }

    this.opts.beforeStatement?.(
      { table: this.table, mode: this.mode ?? "select", index: this.log.length },
      this.store,
    );

    const rows = this.rows();
    const matched = rows.filter((r) => this.preds.every((p) => p(r)));
    this.log.push({ table: this.table, mode: this.mode ?? "select", matched: matched.length });

    if (this.mode === "insert") {
      for (const tuple of this.opts.unique?.[this.table] ?? []) {
        for (const candidate of this.inserted) {
          const dup = rows.some((r) => tuple.every((c) => r[c] === candidate[c]));
          if (dup) {
            return {
              data: null,
              error: {
                code: "23505",
                message: `duplicate key value violates unique constraint on (${tuple.join(",")})`,
              },
            };
          }
        }
      }
      const added = this.inserted.map((r) => ({ id: crypto.randomUUID(), ...r }));
      rows.push(...added);
      return { data: this.returning ? added.map(clone) : null, error: null };
    }

    if (this.mode === "update") {
      for (const r of matched) Object.assign(r, this.patch);
      return { data: this.returning ? matched.map(clone) : null, error: null };
    }

    if (this.mode === "delete") {
      this.store[this.table] = rows.filter((r) => !matched.includes(r));
      return { data: this.returning ? matched.map(clone) : null, error: null };
    }

    let out = matched.map(clone);
    if (this.orderBy) {
      const { col, asc } = this.orderBy;
      out.sort((a, b) => (asc ? cmp(a[col], b[col]) : cmp(b[col], a[col])));
    }
    if (this.lim !== null) out = out.slice(0, this.lim);
    if (this.head) return { data: null, error: null, count: matched.length };
    return { data: out, error: null, ...(this.wantCount ? { count: matched.length } : {}) };
  }

  then<A, B>(
    onOk?:
      | ((v: { data: FakeRow[] | null; error: unknown; count?: number }) => A | PromiseLike<A>)
      | null,
    onErr?: ((e: unknown) => B | PromiseLike<B>) | null,
  ): PromiseLike<A | B> {
    return this.exec().then(onOk, onErr);
  }

  async maybeSingle(): Promise<{ data: FakeRow | null; error: unknown }> {
    const { data, error } = await this.exec();
    return { data: data?.[0] ?? null, error };
  }

  async single(): Promise<{ data: FakeRow | null; error: unknown }> {
    const { data, error } = await this.exec();
    if (!error && !data?.length)
      return { data: null, error: { code: "PGRST116", message: "no rows" } };
    return { data: data?.[0] ?? null, error };
  }
}

export type FakeDb = {
  from: (table: string) => FakeQuery;
  rpc: (name: string, args?: unknown) => Promise<{ data: unknown; error: unknown }>;
  /** Every statement the fake executed, for asserting what did and did not run. */
  statements: { table: string; mode: string; matched: number }[];
  /** The live store, so a test can assert on the row rather than on a call. */
  tables: Record<string, FakeRow[]>;
};

export function makeFakeDb(seed: Record<string, FakeRow[]> = {}, opts: FakeDbOptions = {}): FakeDb {
  const tables: Record<string, FakeRow[]> = {};
  for (const [t, rows] of Object.entries(seed)) tables[t] = rows.map(clone);
  const statements: { table: string; mode: string; matched: number }[] = [];
  return {
    from: (table: string) => new FakeQuery(tables, table, opts, statements),
    rpc: async () => ({ data: null, error: null }),
    statements,
    tables,
  };
}

/* ------------------------------------------------------------------ *
 * The harness's own load-bearing behaviour, tested. If these fail, no
 * conclusion drawn by any test that uses it is worth anything.
 * ------------------------------------------------------------------ */

describe("fake-postgrest applies filters to writes, not only to reads", () => {
  test("an update filtered by id alone matches whatever the row now says", async () => {
    const db = makeFakeDb({ t: [{ id: "a", status: "executed" }] });
    const { data } = await db.from("t").update({ status: "expired" }).eq("id", "a").select("id");
    expect(data?.length).toBe(1);
    expect(db.tables.t[0].status).toBe("expired");
  });

  test("the same update with a status precondition matches nothing once the row moved", async () => {
    const db = makeFakeDb({ t: [{ id: "a", status: "executed" }] });
    const { data, error } = await db
      .from("t")
      .update({ status: "expired" })
      .eq("id", "a")
      .eq("status", "pending")
      .select("id");
    // The shape that makes this class of bug invisible: no error, no rows.
    expect(error).toBeNull();
    expect(data?.length).toBe(0);
    expect(db.tables.t[0].status).toBe("executed");
  });

  test("two callers awaited together both read before either writes", async () => {
    const db = makeFakeDb({ t: [{ id: "a", claimed_at: null }] });
    const claim = async () => {
      const { data: row } = await db.from("t").select("id,claimed_at").eq("id", "a").maybeSingle();
      expect(row?.claimed_at).toBeNull(); // both callers see it unclaimed
      const { data } = await db
        .from("t")
        .update({ claimed_at: "now" })
        .eq("id", "a")
        .is("claimed_at", null)
        .select("id");
      return (data?.length ?? 0) > 0;
    };
    const [first, second] = await Promise.all([claim(), claim()]);
    expect([first, second].filter(Boolean).length).toBe(1);
  });

  test("a column the database does not have fails the statement with 42703", async () => {
    const db = makeFakeDb(
      { t: [{ id: "a" }] },
      { missingColumns: { t: ["execution_claimed_at"] } },
    );
    const { error } = await db.from("t").select("execution_claimed_at").limit(1);
    expect((error as { code?: string } | null)?.code).toBe("42703");
  });

  test("a unique constraint refuses the second insert with 23505", async () => {
    const db = makeFakeDb({ t: [] }, { unique: { t: [["scope", "key"]] } });
    const first = await db.from("t").insert({ scope: "s", key: "k" });
    const second = await db.from("t").insert({ scope: "s", key: "k" });
    expect(first.error).toBeNull();
    expect((second.error as { code?: string } | null)?.code).toBe("23505");
  });
});

/*
 * The new operator's own coverage. The harness's header says a conclusion drawn
 * with it is worth nothing if these fail, and `not.in` is now load-bearing for
 * every writer that must not overwrite a terminal status.
 */
describe("fake-postgrest not(col, 'in', ...)", () => {
  test("excludes the listed values and keeps the rest", () => {
    const db = makeFakeDb({
      t: [{ id: "a", status: "queued" }, { id: "b", status: "completed" }, { id: "c", status: "running" }],
    });
    return db
      .from("t")
      .update({ status: "cancelled" })
      .not("status", "in", "(completed,failed,cancelled)")
      .select("id")
      .then(() => {
        const by = Object.fromEntries(db.tables.t.map((r) => [r.id, r.status]));
        expect(by.a).toBe("cancelled");
        expect(by.c).toBe("cancelled");
        // The terminal one is untouched, which is the entire point.
        expect(by.b).toBe("completed");
      });
  });

  test("a null column does not match, following SQL rather than intuition", () => {
    const db = makeFakeDb({ t: [{ id: "a", status: null }] });
    return db
      .from("t")
      .update({ status: "cancelled" })
      .not("status", "in", "(completed)")
      .select("id")
      .then(() => {
        expect(db.tables.t[0].status).toBeNull();
      });
  });

  test("tolerates spaces in the list", () => {
    const db = makeFakeDb({ t: [{ id: "a", status: "completed" }] });
    return db
      .from("t")
      .update({ status: "cancelled" })
      .not("status", "in", "( completed , failed )")
      .select("id")
      .then(() => {
        expect(db.tables.t[0].status).toBe("completed");
      });
  });
});
