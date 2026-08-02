/**
 * Feature liveness: the probe shapes, and the runner that executes them.
 *
 * THE DESIGN CONSTRAINT THAT SHAPED THIS FILE. A liveness system that needs a
 * new call site in every feature is a liveness system nobody finishes. Two
 * hundred `track()` calls would be two hundred chances to forget one, and the
 * feature you forget is the one that dies. So almost nothing here is new
 * telemetry. Every probe reads a table the product already writes to as part of
 * doing its job: `job_runs` for scheduled work, `ai_events` for model calls, and
 * the feature's own output table for everything else. If a feature ran, it left
 * a row. If it left no row, it did not run. That is the whole idea.
 *
 * A probe is DATA, not code, so a new capability is one entry in the registry
 * rather than a new query written by hand somewhere.
 *
 * The client is injected as a narrow structural interface rather than the
 * generated Supabase type, for two reasons. The tables are named by strings from
 * the registry, which the generated types cannot express, and a fake client
 * makes the runner testable without a database.
 */

/** A predicate on one column, expressed so the registry stays declarative. */
export type ColumnFilter =
  | { column: string; op: "eq" | "neq"; value: string | number | boolean }
  | { column: string; op: "in"; values: Array<string | number> }
  | { column: string; op: "is_null" | "not_null" };

/**
 * What proves a capability executed.
 *
 * `job_runs` and `ai_events` cover everything the product already instruments.
 * `table` covers the rest, and it is the honest one: the proof that a feature
 * ran is the row it was built to write.
 */
export type ProbeSpec =
  | { source: "job_runs"; jobName: string; successfulOnly?: boolean }
  | { source: "ai_events"; surface: string; surfaceRef?: string; successfulOnly?: boolean }
  | { source: "table"; table: string; timeColumn: string; filters?: ColumnFilter[] };

/* ------------------------------------------------------------------ *
 * The narrow client
 * ------------------------------------------------------------------ */

type ProbeRow = Record<string, unknown>;

export type ProbeResult = {
  data: ProbeRow[] | null;
  count: number | null;
  error: { message: string } | null;
};

export interface ProbeQuery extends PromiseLike<ProbeResult> {
  eq(column: string, value: unknown): ProbeQuery;
  neq(column: string, value: unknown): ProbeQuery;
  in(column: string, values: unknown[]): ProbeQuery;
  is(column: string, value: unknown): ProbeQuery;
  not(column: string, operator: string, value: unknown): ProbeQuery;
  gte(column: string, value: unknown): ProbeQuery;
  order(column: string, opts: { ascending: boolean }): ProbeQuery;
  limit(count: number): ProbeQuery;
}

export interface LivenessClient {
  from(table: string): {
    select(columns: string, opts?: { count?: "exact"; head?: boolean }): ProbeQuery;
  };
}

/* ------------------------------------------------------------------ *
 * Translation
 * ------------------------------------------------------------------ */

/** Which table, time column and filters a probe spec resolves to. */
export function resolveProbe(spec: ProbeSpec): {
  table: string;
  timeColumn: string;
  filters: ColumnFilter[];
} {
  switch (spec.source) {
    case "job_runs":
      return {
        table: "job_runs",
        timeColumn: "started_at",
        filters: [
          { column: "job_name", op: "eq", value: spec.jobName },
          ...(spec.successfulOnly
            ? [{ column: "status", op: "eq" as const, value: "ok" as const }]
            : []),
        ],
      };
    case "ai_events":
      return {
        table: "ai_events",
        timeColumn: "created_at",
        filters: [
          { column: "surface", op: "eq", value: spec.surface },
          // surface_ref is how one surface tells its callers apart. The embed
          // chokepoint stamps it, so "the signal sweeper called the provider"
          // and "somebody embedded something" are separable facts.
          ...(spec.surfaceRef
            ? [{ column: "surface_ref", op: "eq" as const, value: spec.surfaceRef }]
            : []),
          ...(spec.successfulOnly
            ? [{ column: "status", op: "eq" as const, value: "ok" as const }]
            : []),
        ],
      };
    case "table":
      return {
        table: spec.table,
        timeColumn: spec.timeColumn,
        filters: spec.filters ?? [],
      };
  }
}

function applyFilters(query: ProbeQuery, filters: ColumnFilter[]): ProbeQuery {
  let q = query;
  for (const f of filters) {
    switch (f.op) {
      case "eq":
        q = q.eq(f.column, f.value);
        break;
      case "neq":
        q = q.neq(f.column, f.value);
        break;
      case "in":
        q = q.in(f.column, f.values);
        break;
      case "is_null":
        q = q.is(f.column, null);
        break;
      case "not_null":
        q = q.not(f.column, "is", null);
        break;
    }
  }
  return q;
}

/* ------------------------------------------------------------------ *
 * Execution
 * ------------------------------------------------------------------ */

export type ProbeReading = {
  countInWindow: number;
  lastAt: string | null;
  probeFailed?: boolean;
  probeError?: string | null;
};

/**
 * Two reads per capability: how many times inside the window, and when it last
 * happened at all. The second read is deliberately unbounded in time, because
 * "never, in the whole life of the table" is the answer that mattered on
 * 2026-08-02 and a windowed query cannot tell it apart from "not lately".
 */
export async function readProbe(
  client: LivenessClient,
  spec: ProbeSpec,
  windowStartIso: string,
): Promise<ProbeReading> {
  const { table, timeColumn, filters } = resolveProbe(spec);

  try {
    const [countRes, lastRes] = await Promise.all([
      applyFilters(
        client.from(table).select(timeColumn, { count: "exact", head: true }),
        filters,
      ).gte(timeColumn, windowStartIso),
      applyFilters(client.from(table).select(timeColumn), filters)
        .order(timeColumn, { ascending: false })
        .limit(1),
    ]);

    const failure = countRes.error ?? lastRes.error;
    if (failure) {
      return { countInWindow: 0, lastAt: null, probeFailed: true, probeError: failure.message };
    }

    const lastRow = (lastRes.data ?? [])[0];
    const lastValue = lastRow ? lastRow[timeColumn] : null;

    return {
      countInWindow: countRes.count ?? 0,
      lastAt: typeof lastValue === "string" ? lastValue : null,
    };
  } catch (e) {
    return {
      countInWindow: 0,
      lastAt: null,
      probeFailed: true,
      probeError: e instanceof Error ? e.message : String(e),
    };
  }
}

/* ------------------------------------------------------------------ *
 * Integrity reads
 * ------------------------------------------------------------------ */

export type IntegrityProbeSpec = {
  table: string;
  /** The column that must not be null. */
  column: string;
  /** Narrow the population, for rows where the contract only applies to some. */
  filters?: ColumnFilter[];
  /**
   * Split the count by this column, using the values below. Declared rather than
   * discovered, because listing the kinds a table is meant to hold is itself the
   * check: a kind the product writes and this list does not know about is the
   * vocabulary drift that hid the `learning` node for weeks.
   */
  segmentColumn?: string;
  segments?: string[];
};

export type IntegrityReading = {
  totalRows: number;
  offendingRows: number;
  segments?: Array<{ segment: string; totalRows: number; offendingRows: number }>;
  probeFailed?: boolean;
  probeError?: string | null;
};

async function countRows(
  client: LivenessClient,
  table: string,
  column: string,
  filters: ColumnFilter[],
): Promise<{ count: number; error: string | null }> {
  const res = await applyFilters(
    client.from(table).select(column, { count: "exact", head: true }),
    filters,
  );
  return { count: res.count ?? 0, error: res.error?.message ?? null };
}

/**
 * "Rows where X is null but should not be", executed.
 *
 * One shape, three of the day's five findings. A fourth instance is caught here
 * rather than by a fourth outage.
 */
export async function readIntegrity(
  client: LivenessClient,
  spec: IntegrityProbeSpec,
): Promise<IntegrityReading> {
  const base = spec.filters ?? [];
  const nullFilter: ColumnFilter = { column: spec.column, op: "is_null" };

  try {
    const [total, offending] = await Promise.all([
      countRows(client, spec.table, spec.column, base),
      countRows(client, spec.table, spec.column, [...base, nullFilter]),
    ]);

    const failure = total.error ?? offending.error;
    if (failure) {
      return { totalRows: 0, offendingRows: 0, probeFailed: true, probeError: failure };
    }

    let segments: IntegrityReading["segments"];
    if (spec.segmentColumn && spec.segments?.length) {
      const segmentColumn = spec.segmentColumn;
      segments = await Promise.all(
        spec.segments.map(async (segment) => {
          const segFilter: ColumnFilter = { column: segmentColumn, op: "eq", value: segment };
          const [segTotal, segOffending] = await Promise.all([
            countRows(client, spec.table, spec.column, [...base, segFilter]),
            countRows(client, spec.table, spec.column, [...base, segFilter, nullFilter]),
          ]);
          return {
            segment,
            totalRows: segTotal.count,
            offendingRows: segOffending.count,
          };
        }),
      );
    }

    return { totalRows: total.count, offendingRows: offending.count, segments };
  } catch (e) {
    return {
      totalRows: 0,
      offendingRows: 0,
      probeFailed: true,
      probeError: e instanceof Error ? e.message : String(e),
    };
  }
}

/* ------------------------------------------------------------------ *
 * Vocabulary reads
 * ------------------------------------------------------------------ */

export type VocabularyProbeSpec = {
  table: string;
  /** The column holding the value, for example `artifact_lineage.child_kind`. */
  column: string;
  /** Every value the code declares it can handle. */
  declared: readonly string[];
  filters?: ColumnFilter[];
};

export type VocabularyReading = {
  totalRows: number;
  declaredRows: number;
  declaredCounts?: Array<{ value: string; rows: number }>;
  probeFailed?: boolean;
  probeError?: string | null;
};

/**
 * Two counts: the table, and the rows carrying any declared value. The
 * difference is the blind spot. No group-by, so no new database function, so
 * no migration.
 *
 * `perValue` adds one query per declared value, which is how the check can also
 * name a declared value nothing writes. It is off by default and should stay
 * off in the request path: a Cloudflare Worker has a hard ceiling on outbound
 * subrequests, and a liveness page that trips it would report nothing at all,
 * which is the exact failure this whole system exists to catch.
 */
export async function readVocabulary(
  client: LivenessClient,
  spec: VocabularyProbeSpec,
  opts: { perValue?: boolean } = {},
): Promise<VocabularyReading> {
  const base = spec.filters ?? [];
  const declaredValues = [...spec.declared];

  try {
    const [total, declared] = await Promise.all([
      countRows(client, spec.table, spec.column, base),
      countRows(client, spec.table, spec.column, [
        ...base,
        { column: spec.column, op: "in", values: declaredValues },
      ]),
    ]);

    const failure = total.error ?? declared.error;
    if (failure) {
      return { totalRows: 0, declaredRows: 0, probeFailed: true, probeError: failure };
    }

    let declaredCounts: VocabularyReading["declaredCounts"];
    if (opts.perValue) {
      const each = await Promise.all(
        declaredValues.map((value) =>
          countRows(client, spec.table, spec.column, [
            ...base,
            { column: spec.column, op: "eq" as const, value },
          ]),
        ),
      );
      declaredCounts = declaredValues.map((value, i) => ({ value, rows: each[i].count }));
    }

    return { totalRows: total.count, declaredRows: declared.count, declaredCounts };
  } catch (e) {
    return {
      totalRows: 0,
      declaredRows: 0,
      probeFailed: true,
      probeError: e instanceof Error ? e.message : String(e),
    };
  }
}
