/**
 * P-119 guard: "three fixtures of the same surface failing produce one
 * item; a success clears it." Exercises `detectProviderFaults` against a
 * fake client shaped like the real `.from().select().in().gte().order()
 * .limit()` / `.from().select().or()` chains it actually calls.
 */
import { describe, test, expect } from "bun:test";
import { detectProviderFaults, providerFaultLine, type ProviderFault } from "./provider-faults.functions";

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
        { surface: "cron.embed-tick.memory", error_message: "embeddings 402: {}", occurred_at: ago(5) },
        { surface: "cron.embed-tick.memory", error_message: "embeddings 402: {}", occurred_at: ago(10) },
        { surface: "cron.embed-tick.memory", error_message: "embeddings 402: {}", occurred_at: ago(15) },
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
      { surface: "cron.embed-tick.memory", error_message: "embeddings 402: {}", occurred_at: ago(5) },
      { surface: "cron.embed-tick.memory", error_message: "embeddings 402: {}", occurred_at: ago(10) },
    ]);
    expect(await detectProviderFaults(client)).toEqual([]);
  });

  test("a rate limit (429) never counts toward a fault, however many times it repeats", async () => {
    const client = fakeClient([
      { surface: "cron.embed-tick.memory", error_message: "embeddings 429: {}", occurred_at: ago(5) },
      { surface: "cron.embed-tick.memory", error_message: "embeddings 429: {}", occurred_at: ago(10) },
      { surface: "cron.embed-tick.memory", error_message: "embeddings 429: {}", occurred_at: ago(15) },
      { surface: "cron.embed-tick.memory", error_message: "embeddings 429: {}", occurred_at: ago(20) },
      { surface: "cron.embed-tick.memory", error_message: "embeddings 429: {}", occurred_at: ago(25) },
    ]);
    expect(await detectProviderFaults(client)).toEqual([]);
  });

  test("failures outside the recent window do not raise a fault -- a success clears it", async () => {
    // Three failures, but all well outside the ~50-minute window: the
    // window query itself excludes them (the fake's `gte` filter mirrors
    // the real one), which is exactly how a fault clears itself once the
    // provider recovers and stops producing new rows.
    const client = fakeClient([
      { surface: "cron.embed-tick.memory", error_message: "embeddings 402: {}", occurred_at: ago(200) },
      { surface: "cron.embed-tick.memory", error_message: "embeddings 402: {}", occurred_at: ago(210) },
      { surface: "cron.embed-tick.memory", error_message: "embeddings 402: {}", occurred_at: ago(220) },
    ]);
    expect(await detectProviderFaults(client)).toEqual([]);
  });

  test("distinct surfaces each raise their own item, never merged into one", async () => {
    const client = fakeClient(
      [
        { surface: "cron.embed-tick.memory", error_message: "embeddings 402: {}", occurred_at: ago(5) },
        { surface: "cron.embed-tick.memory", error_message: "embeddings 402: {}", occurred_at: ago(10) },
        { surface: "cron.embed-tick.memory", error_message: "embeddings 402: {}", occurred_at: ago(15) },
        { surface: "cron.embed-tick.decisions", error_message: "embeddings 402: {}", occurred_at: ago(5) },
        { surface: "cron.embed-tick.decisions", error_message: "embeddings 402: {}", occurred_at: ago(10) },
        { surface: "cron.embed-tick.decisions", error_message: "embeddings 402: {}", occurred_at: ago(15) },
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
