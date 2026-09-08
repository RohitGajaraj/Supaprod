/**
 * P-119 guard: "three fixtures of the same surface failing produce one
 * item; a success clears it." Exercises `detectProviderFaults` against a
 * fake client shaped like the real `.from().select().in().gte().order()
 * .limit()` / `.from().select().or()` chains it actually calls.
 */
import { describe, test, expect } from "bun:test";
import {
  detectProviderFaults,
  providerFaultLine,
  groupFaultsByStatus,
  providerFaultGroupLine,
  type ProviderFault,
} from "./provider-faults.functions";

type FakeRow = { surface: string; error_message: string | null; occurred_at: string };

function fakeClient(rows: FakeRow[], rowsWaitingByTable: Record<string, number> = {}) {
  return {
    from(table: string) {
      return {
        select: (_cols: string, opts?: { count?: string }) => {
          if (opts?.count) {
            // The row-count branch: `.select("id", {count, head}).or(...)`
            return {
              or: async () => ({
                count: rowsWaitingByTable[table] ?? 0,
                error: null,
              }),
            };
          }
          // The error_events scan branch: `.select(...).in().gte().order().limit()`
          return {
            in: (_col: string, surfaces: string[]) => ({
              gte: (_col2: string, since: string) => ({
                order: () => ({
                  limit: async () => ({
                    data: rows.filter(
                      (r) => surfaces.includes(r.surface) && r.occurred_at >= since,
                    ),
                    error: null,
                  }),
                }),
              }),
            }),
          };
        },
      };
    },
  };
}

const NOW = new Date("2026-09-04T12:00:00.000Z").getTime();
const t = (minutesAgo: number) => new Date(NOW - minutesAgo * 60_000).toISOString();

// `Date.now()` inside the module under test is real wall-clock time, not
// this fixture's NOW, so fixtures are timestamped relative to actual "now"
// at test-run time via a small offset rather than the fixed NOW above.
const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

describe("detectProviderFaults", () => {
  test("three fixtures of the same surface failing produce one item", async () => {
    const client = fakeClient(
      [
        {
          surface: "cron.embed-tick.memory",
          error_message: "embeddings 402: {}",
          occurred_at: ago(5),
        },
        {
          surface: "cron.embed-tick.memory",
          error_message: "embeddings 402: {}",
          occurred_at: ago(10),
        },
        {
          surface: "cron.embed-tick.memory",
          error_message: "embeddings 402: {}",
          occurred_at: ago(15),
        },
      ],
      { agent_memory: 42 },
    );
    const faults = await detectProviderFaults(client);
    expect(faults).toHaveLength(1);
    expect(faults[0]!.surface).toBe("cron.embed-tick.memory");
    expect(faults[0]!.status).toBe(402);
    expect(faults[0]!.failures).toBe(3);
    expect(faults[0]!.rowsWaiting).toBe(42);
  });

  test("two fixtures of the same surface produce zero items", async () => {
    const client = fakeClient([
      {
        surface: "cron.embed-tick.memory",
        error_message: "embeddings 402: {}",
        occurred_at: ago(5),
      },
      {
        surface: "cron.embed-tick.memory",
        error_message: "embeddings 402: {}",
        occurred_at: ago(10),
      },
    ]);
    expect(await detectProviderFaults(client)).toEqual([]);
  });

  test("a rate limit (429) never counts toward a fault, however many times it repeats", async () => {
    const client = fakeClient([
      {
        surface: "cron.embed-tick.memory",
        error_message: "embeddings 429: {}",
        occurred_at: ago(5),
      },
      {
        surface: "cron.embed-tick.memory",
        error_message: "embeddings 429: {}",
        occurred_at: ago(10),
      },
      {
        surface: "cron.embed-tick.memory",
        error_message: "embeddings 429: {}",
        occurred_at: ago(15),
      },
      {
        surface: "cron.embed-tick.memory",
        error_message: "embeddings 429: {}",
        occurred_at: ago(20),
      },
      {
        surface: "cron.embed-tick.memory",
        error_message: "embeddings 429: {}",
        occurred_at: ago(25),
      },
    ]);
    expect(await detectProviderFaults(client)).toEqual([]);
  });

  test("failures outside the recent window do not raise a fault -- a success clears it", async () => {
    // Three failures, but all well outside the ~50-minute window: the
    // window query itself excludes them (the fake's `gte` filter mirrors
    // the real one), which is exactly how a fault clears itself once the
    // provider recovers and stops producing new rows.
    const client = fakeClient([
      {
        surface: "cron.embed-tick.memory",
        error_message: "embeddings 402: {}",
        occurred_at: ago(200),
      },
      {
        surface: "cron.embed-tick.memory",
        error_message: "embeddings 402: {}",
        occurred_at: ago(210),
      },
      {
        surface: "cron.embed-tick.memory",
        error_message: "embeddings 402: {}",
        occurred_at: ago(220),
      },
    ]);
    expect(await detectProviderFaults(client)).toEqual([]);
  });

  test("distinct surfaces each raise their own item, never merged into one", async () => {
    const client = fakeClient(
      [
        {
          surface: "cron.embed-tick.memory",
          error_message: "embeddings 402: {}",
          occurred_at: ago(5),
        },
        {
          surface: "cron.embed-tick.memory",
          error_message: "embeddings 402: {}",
          occurred_at: ago(10),
        },
        {
          surface: "cron.embed-tick.memory",
          error_message: "embeddings 402: {}",
          occurred_at: ago(15),
        },
        {
          surface: "cron.embed-tick.decisions",
          error_message: "embeddings 402: {}",
          occurred_at: ago(5),
        },
        {
          surface: "cron.embed-tick.decisions",
          error_message: "embeddings 402: {}",
          occurred_at: ago(10),
        },
        {
          surface: "cron.embed-tick.decisions",
          error_message: "embeddings 402: {}",
          occurred_at: ago(15),
        },
      ],
      { agent_memory: 10, decisions: 3 },
    );
    const faults = await detectProviderFaults(client);
    expect(faults.map((f) => f.surface).sort()).toEqual(
      ["cron.embed-tick.decisions", "cron.embed-tick.memory"].sort(),
    );
  });

  test("a read failure returns no faults, never a thrown error", async () => {
    const client = {
      from: () => ({
        select: () => ({
          in: () => ({
            gte: () => ({
              order: () => ({
                limit: async () => ({ data: null, error: { message: "connection reset" } }),
              }),
            }),
          }),
        }),
      }),
    };
    expect(await detectProviderFaults(client)).toEqual([]);
  });
});

describe("providerFaultLine", () => {
  test("402 renders the packet's own exact sentence", () => {
    const fault: ProviderFault = {
      surface: "cron.embed-tick.memory",
      table: "agent_memory",
      status: 402,
      rawMessage: "embeddings 402: {}",
      failures: 3,
      since: t(45),
      rowsWaiting: 12,
    };
    expect(providerFaultLine(fault)).toBe(
      "Embeddings have stopped: Cohere says the payment method needs updating. " +
        "Fix it at dashboard.cohere.com › Billing; new work is not searchable until then. " +
        "12 rows waiting.",
    );
  });

  test("a different non-rate-limit 4xx gets an honest generic line, not silence", () => {
    const fault: ProviderFault = {
      surface: "cron.embed-tick.decisions",
      table: "decisions",
      status: 403,
      rawMessage: "embeddings 403: {}",
      failures: 3,
      since: t(45),
      rowsWaiting: 1,
    };
    expect(providerFaultLine(fault)).toBe(
      "Embeddings have stopped: the provider is refusing calls (403). " +
        "New work is not searchable until this clears. 1 row waiting.",
    );
  });
});

/*
 * P-119b (A-QUEUE.md): Waiting served four identical Cohere cards, 154 + 33
 * + 35 + 6 rows, one per embed surface, telling the founder to fix the same
 * account four times. "Four surfaces failing on one provider render one
 * card with the summed count."
 */
const fault = (over: Partial<ProviderFault>): ProviderFault => ({
  surface: "cron.embed-tick.prds",
  table: "prds",
  status: 402,
  rawMessage: "embeddings 402: {}",
  failures: 3,
  since: t(45),
  rowsWaiting: 0,
  ...over,
});

describe("groupFaultsByStatus", () => {
  test("folds four surfaces on one status into one group with the summed count", () => {
    const groups = groupFaultsByStatus([
      fault({ table: "prds", rowsWaiting: 154, since: t(60) }),
      fault({ table: "decisions", rowsWaiting: 33, since: t(50) }),
      fault({ table: "opportunities", rowsWaiting: 35, since: t(45) }),
      fault({ table: "agent_memory", rowsWaiting: 6, since: t(70) }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      status: 402,
      rowsWaiting: 228,
      kinds: ["specs", "decisions", "opportunities", "memory"],
    });
  });

  test("keeps the earliest surface's own start as the group's since", () => {
    const groups = groupFaultsByStatus([
      fault({ table: "prds", since: t(10) }),
      fault({ table: "decisions", since: t(70) }),
    ]);
    expect(groups[0]!.since).toBe(t(70));
  });

  test("never merges two different statuses into one group", () => {
    const groups = groupFaultsByStatus([fault({ status: 402 }), fault({ status: 403 })]);
    expect(groups).toHaveLength(2);
  });

  test("a single surface still produces its own group", () => {
    const groups = groupFaultsByStatus([fault({ table: "prds", rowsWaiting: 12 })]);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ rowsWaiting: 12, kinds: ["specs"] });
  });
});

describe("providerFaultGroupLine", () => {
  test("sums the rows and names every kind, the packet's own exact sentence", () => {
    const groups = groupFaultsByStatus([
      fault({ table: "prds", rowsWaiting: 154 }),
      fault({ table: "decisions", rowsWaiting: 33 }),
      fault({ table: "opportunities", rowsWaiting: 35 }),
      fault({ table: "agent_memory", rowsWaiting: 6 }),
    ]);
    expect(providerFaultGroupLine(groups[0]!)).toBe(
      "Embeddings have stopped: Cohere says the payment method needs updating. " +
        "Fix it at dashboard.cohere.com › Billing; new work is not searchable until then. " +
        "228 rows waiting across specs, decisions, opportunities and memory.",
    );
  });

  test("reads exactly as the single-fault line when there is only one kind -- no bare 'across' clause", () => {
    const groups = groupFaultsByStatus([fault({ table: "agent_memory", rowsWaiting: 12 })]);
    expect(providerFaultGroupLine(groups[0]!)).toBe(
      "Embeddings have stopped: Cohere says the payment method needs updating. " +
        "Fix it at dashboard.cohere.com › Billing; new work is not searchable until then. " +
        "12 rows waiting.",
    );
  });

  test("gets the singular right even inside a summed group", () => {
    const groups = groupFaultsByStatus([
      fault({ table: "prds", rowsWaiting: 1 }),
      fault({ table: "decisions", rowsWaiting: 0 }),
    ]);
    expect(providerFaultGroupLine(groups[0]!)).toContain(
      "1 row waiting across specs and decisions.",
    );
  });
});
