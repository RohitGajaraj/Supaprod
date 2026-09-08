/**
 * A paid service that stops paying out is told to the person (P-119, A-QUEUE.md).
 *
 * `error_events` recorded `cron.embed-tick.*` failing on every tick since
 * 2026-09-01 08:30 UTC with a Cohere 402 ("Please add or update your payment
 * method"), 1,165 rows in 24 hours, and nothing in the product said so: three
 * days of Outcomes, decisions and opportunities had no embeddings, quietly
 * degrading Find Anything and the brain's recall in every workspace, and the
 * only place that knew was a table nobody opens.
 *
 * THREE CONSECUTIVE TICKS WITHOUT A SUCCESS SIGNAL. Every embed sweeper
 * (memory-embedding.server.ts, entity-embedding.server.ts) writes to
 * `error_events` on failure and writes NOTHING on success — there is no
 * per-surface "it worked" row to diff against. `cron.embed-tick` runs every
 * 15 minutes (EXPECTED_JOBS in observability/jobs.ts), so a TIME WINDOW
 * substitutes for a success signal: a surface with 3+ failures inside the
 * last ~3 tick intervals is faulting NOW. This also makes the fault
 * self-clear exactly as the packet asks ("cleared by itself when the tick
 * succeeds"): once the underlying issue is fixed, no new rows land in
 * `error_events` for that surface, so once the window passes with nothing
 * new the query stops finding 3+ rows and the fault disappears on its own —
 * no separate "clear" write needed.
 *
 * A 4xx THAT IS NOT A RATE LIMIT, never a bare "it failed": 429 is the
 * provider asking to be called less often, which is expected and transient
 * under load, not a fault a person needs to act on. Every embed call throws
 * `embeddings ${status}: ${body}` on a non-2xx response (embed.server.ts),
 * so the status is always the first thing after "embeddings " in
 * `error_message` and needs no separate column.
 *
 * ONE QUERY, ONE ANSWER, NEVER TWO (the same discipline GateBanner.tsx's own
 * header names): the Waiting page item and Team's Spend-and-limits line both
 * read `detectProviderFaults` directly, so the two surfaces can never
 * disagree about which provider is down.
 *
 * Server-only.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { ENTITY_EMBEDDING_SPECS } from "@/lib/brain/entity-embedding.server";
import { joinPlainly } from "@/lib/spine/attach";

/** Every embed sweeper's own `error_events.surface` and the table it drains,
 *  reusing the entity sweepers' own spec list (P-115's own precedent: one
 *  list, not a second one that can drift) plus the memory sweeper, which
 *  predates that list and lives in its own file. */
const EMBED_FAULT_SOURCES: readonly { surface: string; table: string }[] = [
  { surface: "cron.embed-tick.memory", table: "agent_memory" },
  ...ENTITY_EMBEDDING_SPECS.map((s) => ({ surface: s.errorSurface, table: s.table })),
];

/** `cron.embed-tick`'s own registered cadence (EXPECTED_JOBS, observability/jobs.ts). */
const TICK_INTERVAL_MS = 15 * 60_000;
/** Three ticks plus slack for scheduler jitter — long enough that a genuinely
 *  recovered surface's last failure ages out within roughly one more tick. */
const FAULT_WINDOW_MS = 3 * TICK_INTERVAL_MS + 5 * 60_000;
/** The packet's own number: three fixtures of the same surface failing
 *  produce one item, not fewer. */
const MIN_FAILURES = 3;
/** A provider fault a person needs to see never looks like a mass outage
 *  scan; this only bounds one query against a table a real incident already
 *  keeps small (1,165 rows in the observed 24h incident, well under this). */
const SCAN_LIMIT = 500;

export type ProviderFault = {
  surface: string;
  table: string;
  /** The HTTP status every occurrence in the window shared. */
  status: number;
  /** The provider's own most recent response body, capped, for the record —
   *  never shown verbatim to a person (see `providerFaultLine`). */
  rawMessage: string;
  /** How many of the window's failures this fault is built from. */
  failures: number;
  /** The oldest failure inside the window — when this fault started, not
   *  when the surface first ever failed. */
  since: string;
  /** Rows still lacking an embedding on `table` right now (A1's correction,
   *  live: "the Waiting item's count should be the rows still unembedded,
   *  not the error rows") — read fresh from `table`, never derived from the
   *  error count, which measures ATTEMPTS, not backlog. */
  rowsWaiting: number;
};

type ErrorEventFaultRow = { surface: string; error_message: string | null; occurred_at: string };

// The generated Database types lag new/admin-only tables (the same reason
// recordErrorEvent and withJobRun's own client interfaces exist); a narrow
// structural cast keeps every call site typed without waiting on codegen.
interface ProviderFaultsClient {
  from(table: string): {
    select(
      columns: string,
      opts?: { count: "exact"; head: true },
    ): {
      in(
        column: string,
        values: readonly string[],
      ): {
        gte(
          column: string,
          value: string,
        ): {
          order(
            column: string,
            opts: { ascending: boolean },
          ): {
            limit(n: number): PromiseLike<{
              data: ErrorEventFaultRow[] | null;
              error: { message: string } | null;
            }>;
          };
        };
      };
      or(filter: string): PromiseLike<{ count: number | null; error: { message: string } | null }>;
    };
  };
}

/** The status Cohere (or any embed provider) refused with, parsed from the
 *  literal `embeddings ${status}: ${body}` shape every embed call throws
 *  (embed.server.ts:227). `null` for a row that does not match — a defensive
 *  read, not an assumption that every row in this table came from an embed
 *  call. */
function parseEmbedStatus(message: string | null): number | null {
  if (!message) return null;
  const m = /^embeddings (\d{3}):/.exec(message);
  return m ? Number(m[1]) : null;
}

/** Scans `error_events` for every embed surface failing repeatedly on a
 *  non-rate-limit 4xx inside the recent window, and reads each faulting
 *  surface's REAL unembedded backlog fresh (never the error count). Ordered
 *  by `EMBED_FAULT_SOURCES`, so the item order never depends on query
 *  timing. `db` is test-injectable (the recordStageEvent/recordErrorEvent
 *  precedent); production always reads through the service-role client,
 *  since `error_events` is RLS-guarded to admins and this must see every
 *  workspace's sweep, not one caller's own rows. */
export async function detectProviderFaults(
  client: unknown = supabaseAdmin,
): Promise<ProviderFault[]> {
  const db = client as ProviderFaultsClient;
  const since = new Date(Date.now() - FAULT_WINDOW_MS).toISOString();
  const surfaces = EMBED_FAULT_SOURCES.map((s) => s.surface);

  const { data, error } = await db
    .from("error_events")
    .select("surface, error_message, occurred_at")
    .in("surface", surfaces)
    .gte("occurred_at", since)
    .order("occurred_at", { ascending: false })
    .limit(SCAN_LIMIT);
  // A read that failed says nothing about whether a fault exists — silence,
  // not a false "all clear". The caller's own read failure handling (the
  // ordinary ReadFailedLine pattern) is one layer up; this returns empty
  // rather than throw so a page composing several sections is not sunk by
  // this one.
  if (error) return [];

  const rows = (data ?? []) as unknown as ErrorEventFaultRow[];

  const bySurface = new Map<string, ErrorEventFaultRow[]>();
  for (const row of rows) {
    const status = parseEmbedStatus(row.error_message);
    if (status === null || status === 429 || status < 400 || status >= 500) continue;
    const g = bySurface.get(row.surface);
    if (g) g.push(row);
    else bySurface.set(row.surface, [row]);
  }

  const faults: ProviderFault[] = [];
  for (const source of EMBED_FAULT_SOURCES) {
    const group = bySurface.get(source.surface);
    if (!group || group.length < MIN_FAILURES) continue;

    // Newest first from the query; the newest occurrence's own status and
    // body are what a person needs to read RIGHT NOW.
    const newest = group[0]!;
    const oldest = group[group.length - 1]!;
    const status = parseEmbedStatus(newest.error_message)!;

    // THE REAL BACKLOG, NOT THE ERROR COUNT (A1, live, correcting an
    // earlier draft of this packet): the same `.or("embedding.is.null,
    // embedding_model.is.null")` filter every sweeper itself already
    // applies to its own table, so this count can never disagree with what
    // the sweeper will actually pick up on its next successful tick.
    const { count } = await db
      .from(source.table)
      .select("id", { count: "exact", head: true })
      .or("embedding.is.null,embedding_model.is.null");

    faults.push({
      surface: source.surface,
      table: source.table,
      status,
      rawMessage: (newest.error_message ?? "").slice(0, 300),
      failures: group.length,
      since: oldest.occurred_at,
      rowsWaiting: count ?? 0,
    });
  }
  return faults;
}

/**
 * One product-voice sentence per fault, curated by status code rather than
 * echoed from the provider's own JSON body (which reads as machine text, the
 * exact defect `messageForPerson`/`failureLine` exist to keep off a screen).
 * 402 is the live incident this packet fixes and gets the packet's own exact
 * wording; every other non-rate-limit 4xx gets an honest generic line that
 * still names the surface, the status and the count, so a NEW kind of
 * provider fault is never silent even before it earns its own sentence.
 */
export function providerFaultLine(fault: ProviderFault): string {
  const rows = `${fault.rowsWaiting} row${fault.rowsWaiting === 1 ? "" : "s"}`;
  if (fault.status === 402) {
    return (
      `Embeddings have stopped: Cohere says the payment method needs updating. ` +
      `Fix it at dashboard.cohere.com › Billing; new work is not searchable until then. ` +
      `${rows} waiting.`
    );
  }
  return (
    `Embeddings have stopped: the provider is refusing calls (${fault.status}). ` +
    `New work is not searchable until this clears. ${rows} waiting.`
  );
}

/** The friendly noun for each embed surface's own table, in the words a
 *  person would use rather than the schema's (law 6.4) -- `prds` reads as
 *  "specs" everywhere else this product names them (P-56's own NAMES map,
 *  approvals/a-queue-is-a-shape-not-a-total.ts). */
const KIND_NAME: Record<string, string> = {
  prds: "specs",
  decisions: "decisions",
  opportunities: "opportunities",
  agent_memory: "memory",
  learnings: "learnings",
};

/** One provider's fault, however many embed surfaces it is hitting. */
export type ProviderFaultGroup = {
  status: number;
  /** Every fault this group was built from, in the order `detectProviderFaults`
   *  returned them -- kept so a caller can still reach a single surface's own
   *  `table`/`since` when it needs to (a dashboard link, say). */
  faults: readonly ProviderFault[];
  /** Rows still waiting, summed across every surface this status is hitting. */
  rowsWaiting: number;
  /** The earliest surface's own start across the group -- the fault has been
   *  live since whichever surface hit it first. */
  since: string;
  /** Friendly names, one per surface, same order as `faults`. */
  kinds: string[];
};

/**
 * ONE CARD PER PROVIDER FAULT, NOT ONE PER SURFACE (P-119b, A-QUEUE.md).
 * Served Waiting, 15:24 IST 09-04: four identical *Embeddings have stopped:
 * Cohere...* cards, one per embed surface (154, 33, 35 and 6 rows), telling
 * the founder to fix the same Cohere account four times. `detectProviderFaults`
 * stays per-surface -- the real backlog it reads is a per-TABLE fact -- so
 * the fold happens here, on the way to the screen, keyed on `status`: two
 * surfaces sharing a status share whatever caused it (today, only Cohere
 * calls these surfaces at all, so status alone is the provider).
 */
export function groupFaultsByStatus(faults: readonly ProviderFault[]): ProviderFaultGroup[] {
  const byStatus = new Map<number, ProviderFault[]>();
  for (const f of faults) {
    const g = byStatus.get(f.status);
    if (g) g.push(f);
    else byStatus.set(f.status, [f]);
  }
  return [...byStatus.entries()].map(([status, group]) => ({
    status,
    faults: group,
    rowsWaiting: group.reduce((t, f) => t + f.rowsWaiting, 0),
    since: group.reduce((oldest, f) => (f.since < oldest ? f.since : oldest), group[0]!.since),
    kinds: group.map((f) => KIND_NAME[f.table] ?? f.table),
  }));
}

/**
 * The card's own sentence, summed and with every kind it is hitting named
 * (P-119b's own scope: "the rows summed... the kinds named"). A group of
 * one surface reads exactly as `providerFaultLine` always has -- the
 * "across X" clause only earns its place once there is more than one kind
 * to name.
 */
export function providerFaultGroupLine(group: ProviderFaultGroup): string {
  const across = group.kinds.length > 1 ? ` across ${joinPlainly(group.kinds)}` : "";
  const rows = `${group.rowsWaiting} row${group.rowsWaiting === 1 ? "" : "s"} waiting${across}`;
  if (group.status === 402) {
    return (
      `Embeddings have stopped: Cohere says the payment method needs updating. ` +
      `Fix it at dashboard.cohere.com › Billing; new work is not searchable until then. ` +
      `${rows}.`
    );
  }
  return (
    `Embeddings have stopped: the provider is refusing calls (${group.status}). ` +
    `New work is not searchable until this clears. ${rows}.`
  );
}

/**
 * The read the Waiting page's "agent actions" item and Team's Spend-and-
 * limits line both call — never through two separate queries that could
 * report a different answer at the same instant.
 *
 * ADMIN-GATED, same as `listErrorEvents` (observability.functions.ts): the
 * founder's own action is what this exists to reach ("This is the founder's
 * action (a card on the Cohere account), which is exactly why it must be in
 * front of him" — the packet's own Why), `error_events` is RLS-guarded to
 * `has_role('admin')` for direct reads, and this reads through the service
 * role specifically to see every workspace's sweep rather than one caller's
 * own rows. A non-admin caller gets an empty list, not an error: absence
 * here should read as "nothing to show you", not a broken page.
 */
export const getProviderFaults = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ faults: ProviderFault[] }> => {
    const { data: adminRole } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRole) return { faults: [] };

    return { faults: await detectProviderFaults() };
  });
