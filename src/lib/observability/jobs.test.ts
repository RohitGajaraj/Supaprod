import { describe, it, expect, beforeEach } from "bun:test";
import { withJobRun, withJobRunHttp } from "./jobs";
import { resetErrorStormGuardForTests } from "./errors";

/**
 * These tests exist because of one defect: withJobRun called any RESOLVED value
 * a success, and at least twelve tick handlers answer a failure with
 * `return json({...}, 500)` from inside the callback. Returning a Response is
 * resolving, so a tick failing on every invocation wrote an unbroken run of
 * status='ok' rows on schedule and the watchdog (which only checks recency) was
 * satisfied. Everything below pins the shape that makes that impossible.
 */

type LedgerRow = Record<string, unknown> & { id: number };

/**
 * Fake of the narrow client surface withJobRun touches: `job_runs` insert +
 * update, and the `error_events` insert the error floor writes through. Modeled
 * on fakeClient in errors.test.ts.
 *
 * `insertFails` reproduces the supabase-js house rule that matters here: a
 * refused write RESOLVES as { data: null, error }, it does not throw.
 */
function fakeLedger(opts: { insertFails?: boolean; updateFails?: boolean } = {}) {
  const rows: LedgerRow[] = [];
  const errorEvents: Record<string, unknown>[] = [];
  let nextId = 1;

  const client = {
    rows,
    errorEvents,
    from(table: string) {
      if (table === "error_events") {
        return {
          insert(values: Record<string, unknown>) {
            errorEvents.push(values);
            return Promise.resolve({ error: null });
          },
        };
      }
      return {
        insert(values: Record<string, unknown>) {
          return {
            select(_columns: string) {
              return {
                single() {
                  if (opts.insertFails) {
                    return Promise.resolve({
                      data: null,
                      error: { message: "permission denied for table job_runs" },
                    });
                  }
                  const row = { ...values, id: nextId++ } as LedgerRow;
                  rows.push(row);
                  return Promise.resolve({ data: { id: row.id }, error: null });
                },
              };
            },
          };
        },
        update(values: Record<string, unknown>) {
          return {
            eq(_column: string, value: unknown) {
              if (opts.updateFails) {
                return Promise.resolve({ error: { message: "update refused" } });
              }
              const row = rows.find((r) => r.id === value);
              if (row) Object.assign(row, values);
              return Promise.resolve({ error: null });
            },
          };
        },
      };
    },
  };
  return client;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("withJobRun ledger verdict", () => {
  beforeEach(() => {
    resetErrorStormGuardForTests();
  });

  it("records a returned non-2xx Response as an error, not as ok", async () => {
    // THE REGRESSION TEST. This is the exact shape twelve handlers shipped: the
    // callback resolves, so the old wrapper wrote 'ok' and pinged the 'ok'
    // heartbeat while the job had done nothing.
    const client = fakeLedger();
    const res = await withJobRun("cron.credit-tick", async () => json({ ok: false }, 500), {
      client,
    });

    expect(res.status).toBe(500);
    expect(client.rows).toHaveLength(1);
    expect(client.rows[0].status).toBe("error");
  });

  it("keeps the failing Response byte for byte, because pg_cron still has to get it", async () => {
    const client = fakeLedger();
    const res = await withJobRun(
      "cron.credit-tick",
      async () => json({ ok: false, error: "boom" }, 503),
      { client },
    );

    expect(res.status).toBe(503);
    expect(res.headers.get("Content-Type")).toBe("application/json");
    // The body must still be readable: the guard clones before reading it.
    expect(await res.json()).toEqual({ ok: false, error: "boom" });
  });

  it("puts the status and the body into error_message, so the row names the failure", async () => {
    const client = fakeLedger();
    await withJobRun(
      "cron.retention-tick",
      async () => json({ ok: false, error: "no grant" }, 500),
      {
        client,
      },
    );

    expect(client.rows[0].error_kind).toBe("JobHttpFailure");
    expect(String(client.rows[0].error_message)).toContain("HTTP 500");
    expect(String(client.rows[0].error_message)).toContain("no grant");
  });

  it("still records a thrown failure as an error", async () => {
    const client = fakeLedger();
    await expect(
      withJobRun(
        "ambient.house-rules-tick",
        async () => {
          throw new Error("learnings read failed");
        },
        { client },
      ),
    ).rejects.toThrow("learnings read failed");

    expect(client.rows[0].status).toBe("error");
    expect(client.rows[0].error_message).toBe("learnings read failed");
  });

  it("still records a 2xx Response as ok", async () => {
    const client = fakeLedger();
    const res = await withJobRun("cron.indexer-tick", async () => json({ ok: true }), { client });

    expect(res.status).toBe(200);
    expect(client.rows[0].status).toBe("ok");
    expect(typeof client.rows[0].duration_ms).toBe("number");
  });

  it("treats a non-Response resolved value as ok, so non-route callers are unaffected", async () => {
    const client = fakeLedger();
    const out = await withJobRun("cron.embed-tick", async () => ({ embedded: 4 }), { client });

    expect(out).toEqual({ embedded: 4 });
    expect(client.rows[0].status).toBe("ok");
  });

  it("records an error event when the job_runs insert is refused", async () => {
    // supabase-js resolves a refused write as { data: null, error }, so the old
    // empty catch never fired: runId stayed null and the ENTIRE invocation went
    // unrecorded, which the watchdog reads as "has not run yet".
    const client = fakeLedger({ insertFails: true });
    const res = await withJobRun("cron.uptime-tick", async () => json({ ok: true }), { client });

    expect(res.status).toBe(200); // the work itself must not be blocked
    expect(client.rows).toHaveLength(0);
    expect(client.errorEvents).toHaveLength(1);
    expect(String(client.errorEvents[0].error_message)).toContain("job_runs insert failed");
    expect(String(client.errorEvents[0].surface)).toBe("cron:cron.uptime-tick");
  });

  it("records an error event when the terminal update is refused", async () => {
    // Otherwise the row sits at 'running' forever and reads as in-flight.
    const client = fakeLedger({ updateFails: true });
    await withJobRun("cron.memory-tick", async () => json({ ok: true }), { client });

    expect(client.rows[0].status).toBe("running");
    expect(
      client.errorEvents.some((e) => String(e.error_message).includes("job_runs update failed")),
    ).toBe(true);
  });
});

describe("withJobRunHttp", () => {
  beforeEach(() => {
    resetErrorStormGuardForTests();
  });

  it("records the throw as an error AND answers non-2xx, both at once", async () => {
    // The two properties a tick has to keep. The throw is what makes the ledger
    // honest; the 500 is what pg_cron and the founder's curl see.
    const client = fakeLedger();
    const res = await withJobRunHttp(
      "cron.trigger-tick",
      async () => {
        throw new Error("workspaces read failed: permission denied");
      },
      { client },
    );

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      ok: false,
      error: "workspaces read failed: permission denied",
    });
    expect(client.rows[0].status).toBe("error");
    expect(String(client.rows[0].error_message)).toContain("permission denied");
  });

  it("passes a successful Response straight through", async () => {
    const client = fakeLedger();
    const res = await withJobRunHttp("cron.trigger-tick", async () => json({ ok: true, n: 3 }), {
      client,
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, n: 3 });
    expect(client.rows[0].status).toBe("ok");
  });
});
