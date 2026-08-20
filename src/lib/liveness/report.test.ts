import { describe, it, expect } from "bun:test";
import { buildLivenessReport, summariseReport } from "./report";
import { TRACKED_CAPABILITIES } from "./registry";
import type { LivenessClient, ProbeQuery, ProbeResult } from "./probe";
import {
  TRACKED_CAPABILITIES,
  TRACKED_INTEGRITY_CHECKS,
  TRACKED_VOCABULARY_CHECKS,
} from "./registry";

/**
 * End to end over the REAL registry, against a database standing exactly as it
 * stood on the morning of 2026-08-02.
 *
 * The point of this file is not the wiring. It is the claim in the task: seed
 * the registry with the five real cases so the very first run would have caught
 * all five. That claim is either true or it is not, and this is where it is
 * settled. If someone later removes an entry, weakens a threshold, or points a
 * probe at the wrong column, one of these assertions goes red.
 */

type Op = [string, ...unknown[]];
type Call = { table: string; head: boolean; ops: Op[] };

function makeClient(handler: (call: Call) => Partial<ProbeResult>): LivenessClient {
  return {
    from(table: string) {
      return {
        select(_columns: string, opts?: { count?: "exact"; head?: boolean }) {
          const call: Call = { table, head: !!opts?.head, ops: [] };
          const push =
            (name: string) =>
            (...args: unknown[]) => {
              call.ops.push([name, ...args]);
              return query;
            };
          const query: ProbeQuery = {
            eq: push("eq"),
            neq: push("neq"),
            in: push("in"),
            is: push("is"),
            not: push("not"),
            gte: push("gte"),
            order: push("order"),
            limit: push("limit"),
            then(onfulfilled, onrejected) {
              const base: ProbeResult = { data: [], count: 0, error: null };
              return Promise.resolve({ ...base, ...handler(call) }).then(onfulfilled, onrejected);
            },
          } as ProbeQuery;
          return query;
        },
      };
    },
  };
}

const NOW = Date.parse("2026-08-02T12:00:00.000Z");
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const ago = (ms: number) => new Date(NOW - ms).toISOString();
const eqVal = (ops: Op[], column: string) =>
  ops.find(([op, c]) => op === "eq" && c === column)?.[2] as string | undefined;
const hasOp = (ops: Op[], name: string) => ops.some(([op]) => op === name);
const isNullQuery = (ops: Op[]) => hasOp(ops, "is");
/** A windowed count or an all-time last-row read: either way, a capability probe. */
const isCapabilityRead = (ops: Op[]) => hasOp(ops, "gte") || hasOp(ops, "order");

/** Rows, plus the timestamp of the newest one, for a capability probe. */
function rows(count: number, last: string | null, timeColumn: string) {
  return (call: Call): Partial<ProbeResult> =>
    call.head ? { count } : { data: last ? [{ [timeColumn]: last }] : [] };
}

/**
 * The world as it was. Every number here is one the day actually produced.
 */
function morningOf20260802(): LivenessClient {
  return makeClient((call) => {
    switch (call.table) {
      case "job_runs": {
        const job = eqVal(call.ops, "job_name");
        // The sweep landed that morning and was running.
        if (job === "cron.embed-tick") return rows(620, ago(9 * MINUTE), "started_at")(call);
        // The liveness tick exists in the codebase and has no pg_cron row.
        return rows(0, null, "started_at")(call);
      }

      case "ai_events": {
        const surfaceRef = eqVal(call.ops, "surface_ref");
        if (surfaceRef === "signal-embedding-backfill") {
          return rows(140, ago(20 * MINUTE), "created_at")(call);
        }
        // The chokepoint itself, busy.
        return rows(8400, ago(2 * MINUTE), "created_at")(call);
      }

      case "signals": {
        if (isCapabilityRead(call.ops) || eqVal(call.ops, "source")) {
          // Finding 5: every pulse insert failed the CHECK constraint, so the
          // widget had recorded nothing since the constraint landed.
          return rows(0, null, "created_at")(call);
        }
        // Finding 1: the column exists, a search reads it, nothing writes it.
        return { count: 3120 };
      }

      case "themes": {
        if (isCapabilityRead(call.ops)) {
          // Finding 2's outcome: theme growth had never attached a signal.
          return rows(0, null, "last_signal_at")(call);
        }
        // Finding 2's cause: 181 themes, not one of them vectored.
        return { count: 181 };
      }

      case "agent_memory": {
        // Finding 4. 421 rows, 249 with no vector, and underneath that the part
        // the ratio hides: note and precedent entirely unembedded.
        const kind = eqVal(call.ops, "kind");
        if (kind === "note") return { count: 31 };
        if (kind === "precedent") return { count: 18 };
        if (kind === "outcome") return { count: isNullQuery(call.ops) ? 0 : 23 };
        if (kind) return { count: isNullQuery(call.ops) ? 200 : 349 };
        return { count: isNullQuery(call.ops) ? 249 : 421 };
      }

      case "artifact_lineage": {
        if (isCapabilityRead(call.ops)) {
          // Learning edges were being written the whole time. That was never the
          // problem, which is exactly why nothing caught it.
          return rows(9, ago(2 * DAY), "created_at")(call);
        }
        // Finding 3: thirteen kinds in the table, ten declared in the code. The
        // vocabulary probe asks twice: all rows, then rows whose kind is one the
        // code declares. The gap is the blind spot.
        if (hasOp(call.ops, "in")) return { count: 704 };
        return { count: 850 }; // 146 of these carry a kind no vocabulary declares.
      }

      case "learnings":
        return rows(4, ago(3 * DAY), "created_at")(call);

      case "error_events":
        return rows(12, ago(6 * HOUR), "occurred_at")(call);

      default:
        return { count: 0, data: [] };
    }
  });
}

describe("the first run, against the morning of 2026-08-02", () => {
  it("catches all five features that were doing nothing", async () => {
    const report = await buildLivenessReport(morningOf20260802(), { now: NOW, windowDays: 7 });

    const capability = (id: string) => report.capabilities.find((c) => c.id === id)!;
    const integrity = (id: string) => report.integrity.find((c) => c.id === id)!;
    const vocabulary = (id: string) => report.vocabulary.find((c) => c.id === id)!;

    // 1. signals.embedding, read by a search and written by nothing.
    expect(integrity("signals-embedding").verdict).toBe("broken");
    expect(integrity("signals-embedding").offendingRows).toBe(3120);

    // 2. themes.embedding, and the growth that could therefore attach nothing.
    expect(integrity("themes-embedding").verdict).toBe("broken");
    expect(capability("theme-attachment").verdict).toBe("dead");
    expect(capability("theme-attachment").neverExecuted).toBe(true);

    // 3. the vocabularies that disagreed with the database.
    expect(vocabulary("lineage-child-kind").verdict).toBe("drifted");
    expect(vocabulary("lineage-child-kind").undeclaredRows).toBe(146);

    // 4. agent_memory, where the whole-table ratio hid the real finding.
    const memory = integrity("agent-memory-embedding");
    expect(memory.verdict).toBe("broken");
    expect(memory.deadSegments).toContain("note");
    expect(memory.deadSegments).toContain("precedent");

    // 5. the pulse widget, which had recorded nothing at all.
    expect(capability("product-pulse-capture").verdict).toBe("dead");
    expect(capability("product-pulse-capture").neverExecuted).toBe(true);
  });

  it("does not cry wolf about the things that were working", async () => {
    const report = await buildLivenessReport(morningOf20260802(), { now: NOW, windowDays: 7 });
    const capability = (id: string) => report.capabilities.find((c) => c.id === id)!;

    expect(capability("embedding-sweep").verdict).toBe("healthy");
    expect(capability("model-chokepoint").verdict).toBe("healthy");
    expect(capability("signal-embedding-calls").verdict).toBe("healthy");
    expect(capability("learning-records").verdict).toBe("healthy");
    expect(capability("learning-graph-edges").verdict).toBe("healthy");
    expect(capability("error-floor").verdict).toBe("healthy");
  });

  it("reports itself as never having run until its schedule is applied", async () => {
    const report = await buildLivenessReport(morningOf20260802(), { now: NOW, windowDays: 7 });
    const self = report.capabilities.find((c) => c.id === "liveness-tick")!;
    expect(self.verdict).toBe("dead");
    expect(self.reason).toBe("Has never executed. Not once, ever.");
  });

  it("leads with the finding rather than burying it", async () => {
    const report = await buildLivenessReport(morningOf20260802(), { now: NOW, windowDays: 7 });
    expect(report.capabilities[0].verdict).toBe("dead");
    expect(report.integrity[0].verdict).toBe("broken");
    expect(report.vocabulary[0].verdict).toBe("drifted");
  });

  it("says the whole thing in one sentence", async () => {
    const report = await buildLivenessReport(morningOf20260802(), { now: NOW, windowDays: 7 });
    const headline = summariseReport(report);
    expect(headline).toContain("doing nothing");
    expect(headline).toContain("read and never written");
    expect(headline).toContain("disagree");
  });
});

describe("a healthy morning", () => {
  const healthy = makeClient((call) => {
    if (isNullQuery(call.ops)) return { count: 0 };
    if (call.head) return { count: 50 };
    // The last-row read: name the column from whatever the probe ordered by.
    const orderColumn = call.ops.find(([op]) => op === "order")?.[1] as string | undefined;
    return orderColumn ? { data: [{ [orderColumn]: ago(5 * MINUTE) }] } : { count: 50 };
  });

  it("says so plainly, with no findings anywhere", async () => {
    const report = await buildLivenessReport(healthy, { now: NOW, windowDays: 7 });
    expect(report.counts.dead).toBe(0);
    expect(report.counts.broken).toBe(0);
    expect(report.counts.drifted).toBe(0);
    expect(report.counts.unknown).toBe(0);
    expect(summariseReport(report)).toBe("Every tracked capability is executing");
  });
});

describe("a database that will not answer", () => {
  const broken = makeClient(() => ({ error: { message: "permission denied" } }));

  it("refuses to call anything healthy", async () => {
    const report = await buildLivenessReport(broken, { now: NOW, windowDays: 7 });
    expect(report.counts.healthy).toBe(0);
    expect(report.counts.dead).toBe(0);
    expect(report.counts.unknown).toBe(
      TRACKED_CAPABILITIES.length +
        TRACKED_INTEGRITY_CHECKS.length +
        TRACKED_VOCABULARY_CHECKS.length,
    );
    expect(summariseReport(report)).toContain("could not run");
  });
});

describe("the query budget", () => {
  /*
   * WHAT THIS ASSERTION USED TO BE, AND WHY IT MOVED RATHER THAN LOOSENED.
   *
   * It read `expect(queries).toBeLessThanOrEqual(45)` against a report built over
   * the WHOLE registry, because both callers -- the admin page and the tick --
   * computed everything in one Cloudflare Worker invocation, under a 50
   * subrequest cap. That was correct and it caught real attempts to grow the
   * registry, twice on 2026-08-20.
   *
   * **It also capped the product at about 13 watchable capabilities, against 36
   * scheduled jobs**, which is why coverage stalled at 2 of 36. The number was
   * never the problem; computing the whole registry per invocation was.
   *
   * NO CALLER DOES THAT ANY MORE. `cron.liveness-tick` checks the six
   * least-recently-checked entries and stores the verdicts; the admin page reads
   * those rows and probes only what is missing, within a costed budget
   * (`planLiveFill`). Both pass explicit subsets. A full-registry build is now a
   * thing only a test asks for.
   *
   * So the total moved to where the total is actually decided, and is asserted in
   * `rotation.test.ts` ("a fresh table defers the overflow instead of blowing the
   * cap"), where it holds at ANY registry size rather than up to thirteen. What
   * stays here is the input that feeds it: **one entry must remain cheap.** If a
   * probe starts costing more, every budget downstream is wrong, and this is
   * where that shows.
   *
   * This is not the "bigger number" the old comment warned against. The old
   * comment said the fix is a cheaper probe rather than a bigger number; the fix
   * turned out to be asking for fewer probes, and the number is not in this file
   * any more.
   */
  it("keeps a single capability probe at two queries, which every budget assumes", async () => {
    let queries = 0;
    const counting = makeClient((call) => {
      queries += 1;
      if (call.head) return { count: 10 };
      const orderColumn = call.ops.find(([op]) => op === "order")?.[1] as string | undefined;
      return orderColumn ? { data: [{ [orderColumn]: ago(MINUTE) }] } : { count: 10 };
    });

    await buildLivenessReport(counting, {
      now: NOW,
      windowDays: 7,
      capabilities: [TRACKED_CAPABILITIES[0]],
      integrityChecks: [],
      vocabularyChecks: [],
    });

    // A windowed count and an all-time latest. They are different filters and
    // cannot be merged, which is why `probeCost` in rotation.ts says two.
    expect(queries).toBe(2);
  });

  it("still fits the whole registry today, so nothing has silently got expensive", async () => {
    let queries = 0;
    const counting = makeClient((call) => {
      queries += 1;
      if (call.head) return { count: 10 };
      const orderColumn = call.ops.find(([op]) => op === "order")?.[1] as string | undefined;
      return orderColumn ? { data: [{ [orderColumn]: ago(MINUTE) }] } : { count: 10 };
    });

    await buildLivenessReport(counting, { now: NOW, windowDays: 7 });

    /*
     * A canary rather than a cap. No caller builds the full registry, so this
     * failing does not mean the page is broken -- it means per-entry cost grew,
     * and every budget that trusts `probeCost` needs re-measuring. Raise it only
     * alongside a registry that genuinely grew; investigate it if the registry
     * did not.
     */
    expect(queries).toBeLessThanOrEqual(60);
  });
});

describe("the registry itself", () => {
  /*
   * A PROBE THAT NAMES A JOB NOTHING WRITES REPORTS "DEAD" FOREVER.
   *
   * `job_runs.job_name` is a string in two places that must agree: the label a
   * hook passes to `withJobRun`/`withJobRunHttp`, and the `jobName` a registry
   * probe asks for. Nothing connects them, so a typo in either produces a
   * capability that is permanently dead on the health page while the job runs
   * perfectly.
   *
   * That is the worst failure this file can have. A missed alarm is bad; **a
   * false alarm in the alarm system is worse**, because it teaches the reader to
   * discount the page, and this page exists precisely because five features died
   * unnoticed.
   *
   * Added 2026-08-20 after registering three capabilities by copying job names
   * out of a census. They were right. Nothing would have said so if they were not.
   */
  it("probes a job name that some hook actually writes", async () => {
    const { readdirSync, readFileSync } = await import("node:fs");
    const dir = "src/routes/api/public/hooks";

    const written = new Set<string>();
    for (const file of readdirSync(dir)) {
      if (!file.endsWith(".ts") || file.endsWith(".test.ts") || file.startsWith("-")) continue;
      const src = readFileSync(`${dir}/${file}`, "utf8");
      const call = src.match(/withJobRun(?:Http)?\(\s*([^,]+?)\s*,/);
      if (!call) continue;
      const arg = call[1].trim();
      if (arg.startsWith('"') || arg.startsWith("'")) {
        written.add(arg.slice(1, -1));
        continue;
      }
      // The label is a local constant, which about half the hooks use.
      const bound = src.match(
        new RegExp(`(?:const|let)\\s+${arg}\\s*(?::[^=]+)?=\\s*["']([^"']+)["']`),
      );
      if (bound) written.add(bound[1]);
    }

    // The harness itself has to be working, or this test passes by finding
    // nothing to check. Same reason `fake-postgrest` tests its own operators.
    expect(written.size).toBeGreaterThan(10);

    const probed = TRACKED_CAPABILITIES.flatMap((c) =>
      c.probe.source === "job_runs" ? [{ id: c.id, jobName: c.probe.jobName }] : [],
    );
    expect(probed.length).toBeGreaterThan(0);

    const orphans = probed.filter((p) => !written.has(p.jobName));
    expect(orphans).toEqual([]);
  });


  it("gives every entry a stable unique id", () => {
    const ids = [
      ...TRACKED_CAPABILITIES.map((c) => c.id),
      ...TRACKED_INTEGRITY_CHECKS.map((c) => c.id),
      ...TRACKED_VOCABULARY_CHECKS.map((c) => c.id),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("makes every entry say what proves it ran, in words an operator can read", () => {
    for (const c of TRACKED_CAPABILITIES) {
      expect(c.title.length).toBeGreaterThan(0);
      expect(c.proof.length).toBeGreaterThan(0);
      expect(c.title).not.toBe(c.proof);
    }
    for (const c of TRACKED_INTEGRITY_CHECKS) {
      expect(c.readBy.length).toBeGreaterThan(0);
    }
    for (const c of TRACKED_VOCABULARY_CHECKS) {
      expect(c.declaredBy.length).toBeGreaterThan(0);
      expect(c.probe.declared.length).toBeGreaterThan(0);
    }
  });

  it("still carries all five of the cases it was built from", () => {
    const ids = new Set([
      ...TRACKED_CAPABILITIES.map((c) => c.id),
      ...TRACKED_INTEGRITY_CHECKS.map((c) => c.id),
      ...TRACKED_VOCABULARY_CHECKS.map((c) => c.id),
    ]);
    for (const seeded of [
      "signals-embedding",
      "themes-embedding",
      "lineage-child-kind",
      "agent-memory-embedding",
      "product-pulse-capture",
    ]) {
      expect(ids.has(seeded)).toBe(true);
    }
  });
});
