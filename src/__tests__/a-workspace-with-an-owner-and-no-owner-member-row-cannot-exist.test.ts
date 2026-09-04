/**
 * P-65 (A-QUEUE.md). This guard reads the migration TEXT (no database, no
 * credentials -- it has to run in CI) and asserts the safety-net trigger
 * exists, is idempotent against a writer that already ran (the exact concern
 * `workspaces.functions.ts`'s own `createWorkspace` comment raises against a
 * trigger here), and that the migration backfills existing rows rather than
 * only guarding new ones.
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
  "20260909090000_p65_owner_member_row_guaranteed.sql",
);

/** Strips `--` line comments so a comment explaining the design does not
 *  itself trip a guard checking for what the code actually does. */
function code(sql: string): string {
  return sql.replace(/--.*$/gm, "");
}

describe("the owner-member-row migration", () => {
  const sql = readFileSync(MIGRATION, "utf8");

  it("fires after insert on workspaces", () => {
    expect(code(sql)).toContain("after insert on public.workspaces");
  });

  it("is a backstop, not a second writer: ON CONFLICT DO NOTHING against the real unique key", () => {
    // The exact concern `createWorkspace`'s own comment raises against a
    // trigger here ("two writers for one row is how the second one comes to
    // be wrong") -- this is the same guard shape ensure_user_default_workspace
    // already uses for the identical reason, not a competing writer.
    expect(code(sql)).toContain("on conflict (workspace_id, user_id) do nothing");
  });

  it("inserts the owner's row with the owner role, keyed off the new workspace's own columns", () => {
    expect(code(sql)).toContain(
      "insert into public.workspace_members (workspace_id, user_id, role)",
    );
    expect(code(sql)).toContain("values (new.id, new.owner_id, 'owner')");
  });

  it("backfills existing workspaces, not only ones created after this migration", () => {
    const backfillAt = sql.indexOf("-- Backfill");
    expect(backfillAt).toBeGreaterThan(-1);
    const backfill = code(sql.slice(backfillAt, sql.indexOf("-- Fail-loud", backfillAt)));
    expect(backfill).toContain("from public.workspaces w");
    expect(backfill).toContain("where not exists");
  });

  it("verifies loudly rather than reporting success over a row it did not actually fix", () => {
    expect(sql).toContain("raise exception 'trg_ensure_owner_member_row was not created'");
    expect(sql).toContain(
      "raise exception 'a workspace still has an owner with no member row after backfill'",
    );
  });
});
