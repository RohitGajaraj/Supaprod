/**
 * A SIGNUP DOES NOT LOWER THE BILLING GUARD FOR EVERYONE (P-34, A-QUEUE.md).
 *
 * `ensure_user_default_workspace` used to set a fresh workspace's `plan_tier`
 * by running `ALTER TABLE public.workspaces DISABLE TRIGGER
 * trg_protect_workspace_billing_columns`, taking an ACCESS EXCLUSIVE lock on
 * the whole table and turning the billing guard off for every concurrent
 * writer, not just this one row, for the statement's duration. Fixed by a
 * transaction-local `set_config(..., is_local := true)` bypass the trigger
 * itself checks -- no lock, and invisible to every other session.
 *
 * Verified live against production (2026-09-03, rolled back, no data
 * changed): a non-service-role UPDATE to `plan_tier` without the bypass GUC
 * still reverts silently, exactly as before; the same UPDATE WITH the bypass
 * GUC set goes through. This guard is the durable half -- it fails if the
 * table-lock pattern comes back inside a live function, which is the one
 * thing a bun test run with no database can actually check.
 *
 * `20260709100000_temp_all_workspaces_team_tier.sql` still carries the
 * pattern as a plain top-level statement, backfilling existing rows once at
 * apply time -- that already ran, is not a function anyone calls again, and
 * is the "standard, safe pattern for a deliberate, reviewed schema migration
 * to touch a protected column" its own comment names. It is the one migration
 * this guard allows; nothing else may add a second entry.
 */
import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = join(import.meta.dir, "../../supabase/migrations");

/** The one historical, already-applied, one-time backfill. May shrink; must never grow. */
const KNOWN_HISTORICAL = new Set(["20260709100000_temp_all_workspaces_team_tier.sql"]);

describe("no live function disables the billing guard table-wide", () => {
  it("finds the pattern only where it is known and historical", () => {
    const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql"));
    const offenders: string[] = [];
    for (const f of files) {
      if (KNOWN_HISTORICAL.has(f)) continue;
      const sql = readFileSync(join(MIGRATIONS_DIR, f), "utf8");
      if (/DISABLE TRIGGER\s+trg_protect_workspace_billing_columns/i.test(sql)) {
        offenders.push(f);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("the known historical file is real and still on disk, so the allowlist is not covering for a deleted one", () => {
    const files = new Set(readdirSync(MIGRATIONS_DIR));
    for (const f of KNOWN_HISTORICAL) {
      expect(files.has(f)).toBe(true);
    }
  });
});

describe("the current definition reads the bypass GUC, not a table-wide switch", () => {
  it("ensure_user_default_workspace sets the transaction-local bypass rather than disabling the trigger", () => {
    const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql"));
    const defining = files
      .filter((f) => {
        const sql = readFileSync(join(MIGRATIONS_DIR, f), "utf8");
        return /CREATE OR REPLACE FUNCTION public\.ensure_user_default_workspace/i.test(sql);
      })
      .sort();
    // File names are timestamp-prefixed, so the last one alphabetically is the
    // live definition -- the same ordering Postgres replays migrations in.
    const latest = defining[defining.length - 1];
    expect(latest).toBeTruthy();
    const sql = readFileSync(join(MIGRATIONS_DIR, latest), "utf8");
    expect(sql).toContain("set_config('app.workspace_billing_bypass', 'on', true)");
    expect(sql).not.toMatch(/DISABLE TRIGGER\s+trg_protect_workspace_billing_columns/i);
  });

  it("protect_workspace_billing_columns's latest definition checks the bypass GUC", () => {
    const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql"));
    const defining = files
      .filter((f) => {
        const sql = readFileSync(join(MIGRATIONS_DIR, f), "utf8");
        return /CREATE OR REPLACE FUNCTION public\.protect_workspace_billing_columns/i.test(sql);
      })
      .sort();
    const latest = defining[defining.length - 1];
    expect(latest).toBeTruthy();
    const sql = readFileSync(join(MIGRATIONS_DIR, latest), "utf8");
    expect(sql).toContain("current_setting('app.workspace_billing_bypass', true)");
  });
});
