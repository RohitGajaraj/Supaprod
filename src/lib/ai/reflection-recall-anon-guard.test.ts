/**
 * Guard the fix in
 * supabase/migrations/20260805140000_reflection_recall_is_not_anon_readable.sql.
 *
 * WHAT THIS PREVENTS. `recent_agent_reflections` is SECURITY DEFINER and resolves the
 * asking user as `coalesce(auth.uid(), for_user)`. That is required for the service-side
 * agent loop, where `auth.uid()` is null and the user must be named. It also means that
 * whenever `auth.uid()` is null the `for_user` argument is simply believed. So the ONLY
 * thing separating "a teammate can recall this" from "any visitor can recall this" is
 * that untrusted roles cannot call the function at all. Reproduced live before the fix:
 * as role `anon`, passing an arbitrary user uuid returned 20 of that user's reflections.
 *
 * Two invariants are pinned here because both have already failed in production once:
 *
 *   1. anon is revoked BY NAME. This database sets `ALTER DEFAULT PRIVILEGES ... GRANT
 *      EXECUTE ON FUNCTIONS TO anon, ...`, so functions are born anon-executable, and
 *      `REVOKE ... FROM PUBLIC` does NOT strip an explicit role grant. Three earlier
 *      migrations revoked only PUBLIC and left the hole open.
 *
 *   2. The signature is not changed. Postgres identifies a function by argument TYPES;
 *      a CREATE OR REPLACE with a shifted list FORKS a second overload rather than
 *      replacing, and every caller then fails PGRST203 ("could not choose a best
 *      candidate function") while swallowing the error. That exact outage killed
 *      match_signals, match_themes and match_agent_memory earlier in this repo's life.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "bun:test";
import { hasBlockingError, lintMigrationSql } from "../migration-lint";

const MIGRATION = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260805140000_reflection_recall_is_not_anon_readable.sql",
);

const sql = readFileSync(MIGRATION, "utf8");

/**
 * The live identity signature, read from pg_get_function_arguments(oid 24490) against
 * production on 2026-08-05. `for_agent_slug` deliberately carries NO default. If this
 * ever needs updating, the function was re-signed and every caller must be re-checked.
 */
const LIVE_ARGS = [
  "for_user uuid",
  "for_agent_slug text",
  "match_count integer DEFAULT 5",
  "for_workspace uuid DEFAULT NULL",
  "for_account uuid DEFAULT NULL",
];

/** Strip `--` line comments so assertions never match the (long) rationale header. */
function code(text: string): string {
  return text
    .split("\n")
    .filter((l) => !l.trimStart().startsWith("--"))
    .join("\n");
}

/** Pull the argument list out of the CREATE OR REPLACE statement. */
function declaredArgs(text: string): string[] {
  const m = text.match(
    /CREATE OR REPLACE FUNCTION\s+public\.recent_agent_reflections\s*\(([\s\S]*?)\)\s*\n\s*RETURNS/i,
  );
  if (!m) throw new Error("could not find the CREATE OR REPLACE for recent_agent_reflections");
  return m[1]
    .split(",")
    .map((s) => s.trim().replace(/\s+/g, " "))
    .filter(Boolean);
}

describe("recent_agent_reflections is not readable by anon", () => {
  const body = code(sql);

  it("revokes EXECUTE from anon BY NAME, not merely from PUBLIC", () => {
    // The whole defect was that revoking PUBLIC leaves an explicit anon grant intact.
    expect(body).toMatch(
      /REVOKE ALL ON FUNCTION public\.recent_agent_reflections\(uuid, text, integer, uuid, uuid\)\s*\n?\s*FROM anon;/i,
    );
  });

  it("still revokes PUBLIC as well", () => {
    expect(body).toMatch(/FROM PUBLIC;/i);
  });

  it("re-grants the two roles the real callers connect as", () => {
    // memory.server.ts and agents.functions.ts run as authenticated or service_role.
    // A revoke that also took these out would take recall dark, which is the failure
    // mode this repo calls "capability built, door missing".
    expect(body).toMatch(/GRANT EXECUTE ON FUNCTION public\.recent_agent_reflections/i);
    expect(body).toMatch(/TO authenticated, service_role;/i);
  });

  it("carries the in-body fail-closed guard, since a REVOKE does not survive DROP+CREATE", () => {
    expect(body).toContain("auth.role() is distinct from 'anon'");
  });

  it("uses IS DISTINCT FROM, so a null role (cron, psql, direct connection) still passes", () => {
    // `auth.role() <> 'anon'` evaluates to NULL outside a request context, which would
    // fail closed against the cron fleet and take legitimate recall down with it.
    expect(body).not.toMatch(/auth\.role\(\)\s*<>\s*'anon'/);
    expect(body).not.toMatch(/auth\.role\(\)\s*!=\s*'anon'/);
  });
});

describe("the replace does not fork the function", () => {
  it("declares exactly the live argument list", () => {
    expect(declaredArgs(sql)).toEqual(LIVE_ARGS);
  });

  it("does not DROP the function (a drop re-arms the anon default privilege)", () => {
    expect(code(sql)).not.toMatch(/DROP FUNCTION[^;]*recent_agent_reflections/i);
  });

  it("keeps SECURITY DEFINER and the pinned search_path", () => {
    const body = code(sql);
    expect(body).toMatch(/LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'/i);
  });

  it("asserts exactly one overload survives", () => {
    expect(code(sql)).toContain("expected exactly 1");
  });
});

describe("the migration is apply-safe", () => {
  it("trips no apply-fatal lint rule", () => {
    const findings = lintMigrationSql(sql);
    expect(hasBlockingError(findings)).toBe(false);
    expect(findings.filter((f) => f.severity === "error")).toEqual([]);
  });
});
