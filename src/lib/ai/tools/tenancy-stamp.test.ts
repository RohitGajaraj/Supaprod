/**
 * Every agent write into a workspace-scoped table must stamp `workspace_id`.
 *
 * WHY THIS TEST EXISTS. Migration `20260530120200_tenancy_c_tighten_policies.sql`
 * made `workspace_id` NOT NULL on twenty-two tables and bridged existing callers
 * with `DEFAULT public.current_user_default_workspace()`. That default resolves
 * off `auth.uid()`, which is present for a browser request and ABSENT for an
 * agent running server-side. So for agent tools the bridge does not bridge: the
 * default resolves NULL, the NOT NULL constraint rejects the row, and the write
 * dies. The migration's own header said so — "Once request-context plumbing
 * lands, set workspace_id + product_id explicitly in server functions" — and
 * four tools were duly updated while two were missed.
 *
 * WHAT THE TWO MISSES COST, found 2026-08-03 by walking the live product rather
 * than by reading code. `signals.log` could not write, so no agent could file
 * evidence. Fourteen consecutive runs on one track reported "finished, filing
 * nothing", one of them naming the error outright. Three tracks sat at Discover
 * with every later station "not reached", Plan read "Nothing is committed yet",
 * and the sandbox had never executed because no mission ever reached Build to
 * stage a changeset. One missing field, six empty stations.
 *
 * WHY IT IS A STATIC SCAN. `registry.server.ts` is worker-only: importing it
 * pulls in the Supabase client, the AI runtime and every connector adapter, so
 * `defaults.test.ts` already reads this file as source for the same reason. A
 * type could not catch this either — the Supabase insert type accepts a partial
 * row precisely BECAUSE the column has a default, so omitting it typechecks
 * clean and fails at runtime. That is the same shape as the known trap where a
 * wrong column name in a `.select()` string typechecks and fails live. Text is
 * the only place the guarantee can be asserted before it ships.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The tables migration C put under NOT NULL workspace_id, verbatim from its
 * `ws_tables` array. Kept as a literal list rather than parsed from the SQL: if
 * a later migration adds a table, this list should be updated by a human who has
 * decided the new table is genuinely workspace-scoped.
 */
const WORKSPACE_SCOPED_TABLES = new Set([
  "projects",
  "signals",
  "themes",
  "opportunities",
  "prds",
  "docs",
  "doc_versions",
  "tasks",
  "decisions",
  "artifact_lineage",
  "rag_chunks",
  "ai_events",
  "ai_evals",
  "ai_feedback",
  "guardrail_hits",
  "tool_calls",
  "prompt_runs",
  "ai_budgets",
  "ai_surface_budgets",
  "ai_budget_alerts",
  "conversations",
  "messages",
]);

const SOURCE = readFileSync(join(import.meta.dir, "registry.server.ts"), "utf8");

/** One `.insert({ … })` call: the table it targets and the object literal body. */
type InsertSite = { table: string; body: string; line: number };

/**
 * Find every `.insert({ … })` and the table it writes to.
 *
 * Walks BACKWARD from each insert to the nearest preceding `.from("x")` rather
 * than matching a single regex across both, because the two are routinely split
 * across lines and sometimes separated by a comment block. Forward, it counts
 * braces to find the end of the object literal, so a nested object (`tags: {…}`)
 * does not truncate the body and hide a field that follows it.
 */
function insertSites(src: string): InsertSite[] {
  const sites: InsertSite[] = [];
  const INSERT = ".insert({";
  for (let at = src.indexOf(INSERT); at !== -1; at = src.indexOf(INSERT, at + 1)) {
    const before = src.slice(0, at);
    const from = before.lastIndexOf('.from("');
    if (from === -1) continue;
    const table = before.slice(from + '.from("'.length, before.indexOf('"', from + 7));

    // Balance braces from the `{` that opens the inserted row.
    let depth = 0;
    let end = at + INSERT.length - 1;
    for (; end < src.length; end++) {
      if (src[end] === "{") depth++;
      else if (src[end] === "}") {
        depth--;
        if (depth === 0) break;
      }
    }
    sites.push({
      table,
      body: src.slice(at, end + 1),
      line: before.split("\n").length,
    });
  }
  return sites;
}

describe("agent tool writes stamp the tenant", () => {
  it("finds insert sites to check, so a parse failure cannot pass as a clean run", () => {
    // Without this, a broken scanner returns [] and every assertion below
    // vacuously passes — the exact false-green this file exists to prevent.
    const sites = insertSites(SOURCE);
    expect(sites.length).toBeGreaterThan(8);
    // `tasks` stands in for the anchor `signals` used to provide. signals.log
    // stopped inserting inline on 2026-08-15 when it moved onto the sink; see the
    // block below, which checks the tenant is stamped on BOTH shapes.
    expect(sites.some((s) => s.table === "tasks")).toBe(true);
  });

  it("sets workspace_id on every insert into a workspace-scoped table", () => {
    const missing = insertSites(SOURCE)
      .filter((s) => WORKSPACE_SCOPED_TABLES.has(s.table))
      .filter((s) => !/\bworkspace_id\s*:/.test(s.body))
      .map((s) => `${s.table} (registry.server.ts:${s.line})`);

    expect(missing).toEqual([]);
  });

  it("keeps the two tools that caused the 2026-08-03 outage stamped", () => {
    // Named explicitly so a refactor that drops the field is reported as the
    // regression it is, rather than as an anonymous entry in the list above.
    //
    // `tasks` still inserts inline. `signals` no longer does: on 2026-08-15
    // `signals.log` moved onto `writeSignals` to gain the `stage_events` trail row
    // that loop-state renders "New signals came in" from, so its tenant is stamped
    // by the sink instead. The property this file protects is unchanged, so the
    // assertion below asks for the PROPERTY on whichever shape is present rather
    // than for one shape.
    const byTable = (t: string) => insertSites(SOURCE).filter((s) => s.table === t);
    const sites = byTable("tasks");
    expect(sites.length).toBeGreaterThan(0);
    for (const site of sites) expect(site.body).toContain("workspace_id");
  });

  it("stamps the tenant on the sink path too, which cannot omit it", () => {
    /**
     * THE SINK IS A STRONGER GUARANTEE THAN AN INLINE INSERT, not a gap in this
     * file's coverage, and stating why is the point of this test.
     *
     * `writeSignals(userId, workspaceId, candidates)` takes the tenant as a
     * REQUIRED POSITIONAL ARGUMENT, so omitting it is a type error rather than a
     * runtime surprise. That is the opposite of the shape that caused the
     * 2026-08-03 outage, where the Supabase insert type accepted a partial row
     * precisely BECAUSE the column has a default, so leaving `workspace_id` out
     * typechecked clean and failed only in production.
     *
     * What still has to be checked is that the tool passes a REAL workspace rather
     * than a fallback, and that it refuses when it has none. Filing evidence into
     * the wrong tenant is worse than filing none.
     */
    const at = SOURCE.indexOf('name: "signals.log"');
    expect(at, "signals.log has left the registry").toBeGreaterThan(-1);
    // 7,000 rather than a tighter window: the tool carries a long header
    // explaining why it files through the sink, and the call itself sits 4,300
    // characters past its own name. A window that clipped it would fail for the
    // wrong reason and read as a missing tenant stamp.
    const body = SOURCE.slice(at, at + 7000);
    expect(body).toContain("writeSignals(userId, workspaceId");
    // And it still refuses loudly rather than guessing a tenant.
    expect(body).toContain("if (!workspaceId)");
    expect(body).toContain("nowhere to file this signal");
    // No default or coalesce on the tenant anywhere in the call.
    expect(body).not.toMatch(/workspaceId\s*(\?\?|\|\|)/);
  });
});
