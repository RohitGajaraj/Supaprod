/**
 * ── A WIRE THAT COUNTS ROUNDS ────────────────────────────────────────────────
 *
 * A fake Supabase client for the hop-depth guards (`a-queue-is-two-hops-deep`,
 * `a-strip-read-is-three-hops-deep`). It resolves NOTHING until asked: every
 * read a handler issues joins a pending batch, `flush()` answers the batch as
 * one round of the wire, and the number of flushes it takes for the handler
 * to return is the number of sequential Worker-to-PostgREST round trips the
 * real one pays. Nothing in a unit test can see that latency (2026-09-08:
 * ~275 ms warm, ~550 ms cold per hop on this deployment, while Postgres
 * spends single-digit milliseconds per query); the round count is the thing
 * that produces it, and it is deterministic.
 *
 * WHY A COUNT AND NOT A SOURCE READ: "every await outside a Promise.all" is
 * what a person greps for, and it was wrong twice on the approvals queue (an
 * await inside a nested server function is invisible to the grep, and a
 * `.then` chain off a fan-out member is a hop the grep would count and the
 * wall clock does not). Rounds are what the wire sees.
 *
 * Not a test file: it lives here so the unreachable and workspace-read gates
 * skip it, the way `meridian-ratchet-scan.ts` does.
 */

export type Row = Record<string, unknown>;
export type Filter = { op: string; col: string; value: unknown };
export type Fixture = (table: string, cols: string, filters: Filter[]) => Row[];

export class FakeBuilder {
  cols = "";
  filters: Filter[] = [];
  constructor(
    private readonly client: FakeWire,
    private readonly table: string,
  ) {}
  select(cols: string) {
    this.cols = cols;
    return this;
  }
  eq(col: string, value: unknown) {
    this.filters.push({ op: "eq", col, value });
    return this;
  }
  neq(col: string, value: unknown) {
    this.filters.push({ op: "neq", col, value });
    return this;
  }
  in(col: string, value: unknown) {
    this.filters.push({ op: "in", col, value });
    return this;
  }
  is(col: string, value: unknown) {
    this.filters.push({ op: "is", col, value });
    return this;
  }
  not(col: string, op: string, value: unknown) {
    this.filters.push({ op: `not.${op}`, col, value });
    return this;
  }
  gt() {
    return this;
  }
  gte() {
    return this;
  }
  lt() {
    return this;
  }
  lte() {
    return this;
  }
  or() {
    return this;
  }
  filter() {
    return this;
  }
  ilike() {
    return this;
  }
  order() {
    return this;
  }
  limit() {
    return this;
  }
  then<T>(
    onFulfilled: (v: { data: Row[]; error: null }) => T,
    onRejected?: (e: unknown) => T,
  ): Promise<T> {
    const p = new Promise<{ data: Row[]; error: null }>((resolve) => {
      this.client.pending.push(() =>
        resolve({ data: this.client.rowsFor(this.table, this.cols, this.filters), error: null }),
      );
    });
    return p.then(onFulfilled, onRejected);
  }
}

export class FakeWire {
  pending: Array<() => void> = [];
  rounds = 0;
  /** Every table read, in the order the wire answered them. */
  reads: string[] = [];
  constructor(private readonly fixture: Fixture) {}
  from(table: string) {
    return new FakeBuilder(this, table);
  }
  rpc(name: string) {
    return new FakeBuilder(this, `rpc:${name}`);
  }
  rowsFor(table: string, cols: string, filters: Filter[]): Row[] {
    this.reads.push(table);
    return this.fixture(table, cols, filters);
  }
  /** Resolve everything issued so far as one round of the wire. */
  flush() {
    const batch = this.pending;
    this.pending = [];
    this.rounds += 1;
    for (const resolve of batch) resolve();
  }
}

/**
 * Let every continuation run and issue its next reads: yield whole turns
 * (microtasks drain before `setImmediate` fires) until the handler has
 * stopped adding to the wire. A condition, not a sleep.
 */
async function settle(wire: FakeWire) {
  let before = -1;
  while (before !== wire.pending.length) {
    before = wire.pending.length;
    await new Promise<void>((r) => setImmediate(r));
  }
}

/**
 * Drive `run` (a handler already started against `wire`) to completion,
 * answering the wire one round at a time, and report how many rounds it took.
 */
export async function drive<T>(
  wire: FakeWire,
  run: Promise<T>,
): Promise<{ result: T; rounds: number }> {
  let done = false;
  void run.then(
    () => (done = true),
    () => (done = true),
  );
  for (let guard = 0; guard < 20; guard++) {
    await settle(wire);
    if (done) break;
    if (wire.pending.length === 0) {
      // Nothing in flight and not done: the handler is waiting on something
      // this fake never issued. Fail loudly rather than spin.
      throw new Error(`stalled after ${wire.rounds} rounds`);
    }
    wire.flush();
  }
  return { result: await run, rounds: wire.rounds };
}

export const inList = (filters: Filter[], col: string): string[] | null => {
  const f = filters.find((x) => x.op === "in" && x.col === col);
  return f ? (f.value as string[]) : null;
};

export const eqValue = (filters: Filter[], col: string): unknown =>
  filters.find((f) => f.op === "eq" && f.col === col)?.value;
