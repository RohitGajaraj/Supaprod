/**
 * P-58 (A-QUEUE.md). This guard reads the migration TEXT (no database, no
 * credentials -- it has to run in CI) and asserts the keep-warm job targets
 * the real `/health` route with an explicit deadline, and reserves the
 * route's own first URL segment in the same file -- the two invariants
 * `the-cron-migration-s-host-matches-the-deployed-one.test.ts` already pins
 * for the tick jobs, applied to this one.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATION = join(
  import.meta.dir,
  "..",
  "..",
  "supabase",
  "migrations",
  "20260909070000_a_ping_every_four_minutes_keeps_the_isolate_warm.sql",
);

/** Strips `-- ...` line comments so a comment EXPLAINING the ban does not
 *  itself trip the guard checking for it. */
function code(sql: string): string {
  return sql.replace(/--.*$/gm, "");
}

describe("the health-warm-tick migration", () => {
  const sql = readFileSync(MIGRATION, "utf8");

  it("reserves 'health' as a workspace slug", () => {
    expect(sql).toContain("insert into public.reserved_workspace_slugs");
    expect(sql).toContain("('health', 'route')");
  });

  it("schedules health-warm-tick every four minutes", () => {
    expect(sql).toContain("'health-warm-tick'");
    expect(sql).toContain("'*/4 * * * *'");
  });

  it("calls the /health route by GET, not POST -- the route defines no other handler", () => {
    expect(sql).toContain("net.http_get(");
    expect(sql).not.toContain("net.http_post(");
  });

  it("targets the production host and route, never a preview host", () => {
    expect(code(sql)).not.toContain("lovable.app");
    expect(sql).toContain("https://supaprod.ai/health");
  });

  it("carries an explicit deadline rather than pg_net's 5s default", () => {
    expect(sql).toContain("timeout_milliseconds := 10000");
  });

  it("carries the guard that fails loudly on a bad apply, not silently", () => {
    expect(sql).toContain("RAISE EXCEPTION");
    expect(sql).toContain("did not schedule");
    expect(sql).toContain("does not target the production /health route");
    expect(sql).toContain("no explicit timeout");
  });
});
