/**
 * ── THE LEDGER DRIFTS BECAUSE MIGRATIONS STAMP EACH OTHER AND NEVER THEMSELVES ─
 *
 * Measured on production 2026-09-10, chasing why `check-migrations.sh` would
 * report applied migrations as pending.
 *
 * **22 migrations in this repo write rows into
 * `supabase_migrations.schema_migrations` on behalf of OTHER migrations** --
 * catch-up files, written after a lane applies a batch by hand. Between them they
 * stamp 112 distinct versions. **NOT ONE OF THE 22 STAMPS ITS OWN VERSION.**
 * Zero for twenty-two is a property, not a tendency.
 *
 * That is the entire cause of the drift. Lovable records the catch-up file under
 * its own apply-time version, so the catch-up's FILE version never lands in the
 * ledger, and a gate comparing filenames to that ledger calls it pending. On
 * 2026-09-10 that was **22 files, every one of them verified applied by hand** --
 * three indexes, a table, nine columns, three constraints, four function bodies
 * compared character-for-character, and six data migrations checked by their
 * rows. A gate that cries 22 and means zero is a gate somebody switches off.
 *
 * ── WHY NOT A SCHEMA ORACLE, WHICH IS THE OBVIOUS FIX ────────────────────────
 *
 * Stop trusting the ledger; assert the objects each migration creates. It does
 * not survive contact with the data: six of the 22 are DATA migrations -- seeding
 * 2,225 lineage rows, flagging 283, reserving a slug, tightening a constraint,
 * writing ledger rows -- and **you cannot derive from arbitrary SQL which object
 * to assert.** An object oracle needs a hand-written expectation per migration,
 * which is a fifth hand-maintained second source in a repo that retired four of
 * them in one night for exactly that failure.
 *
 * The ledger is not unreliable in principle. It is unreliable because 22 files
 * write it by hand and none writes its own row. This closes the cause.
 */
import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { lintMigrationSql, LEDGER_STAMP_RULE_FROM } from "./migration-lint";

const DIR = "supabase/migrations";
const files = readdirSync(DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort();

/**
 * THE 22, BY NAME AND NOT BY COUNT.
 *
 * The rule has an effective date, so these are grandfathered. Pinning them as a
 * LIST rather than a number is what stops the date being nudged forward to bless
 * a new offender: a 23rd file dated before the cutoff fails this test even though
 * the linter is silent about it, and the failure names it.
 */
const LEGACY_STAMPERS = [
  "20260707051857_fcd7691c-6ee5-4b9f-9a81-35f0797abf3f.sql",
  "20260708070544_ce230037-bc3d-42d2-9b02-aff461643d25.sql",
  "20260717150025_cd8136b9-18c7-4cfc-8d67-149d9ed75718.sql",
  "20260723073726_d7afc8c1-7065-4dcf-a7da-f29d200e1a16.sql",
  "20260729175152_f36b043e-fbac-41b2-bc32-a1a86877e9a9.sql",
  "20260729192514_d725f469-2739-4132-8a2a-9648c71f64a1.sql",
  "20260730101539_b93c82aa-df10-4ebb-9a19-646527f662dc.sql",
  "20260801162819_6c778043-a810-4863-a7de-c4f12f89cba7.sql",
  "20260802100538_0d446511-ee71-426b-8624-c0446d4af929.sql",
  "20260802103946_67960938-b450-4455-be64-23b4c47a7509.sql",
  "20260803095327_16e86b3c-4c5c-436a-a5af-a3194d788892.sql",
  "20260805135025_7d0e2bb8-aeed-475f-b133-a24ffc343f1b.sql",
  "20260806032326_17db77d1-6c11-4f78-9597-cd2be02bbe9d.sql",
  "20260811113210_0e7122c8-b397-46d9-8cd6-6f2c80b917f4.sql",
  "20260811113406_518fc4f1-397f-4363-9d1b-c52280e410c7.sql",
  "20260811113609_e6556122-0063-42d1-b1b8-b6ad304044f2.sql",
  "20260811113936_d8d735f6-81ae-4d81-a95c-7c2bf5a56722.sql",
  "20260811114123_a0be1e16-ee8f-4354-a17a-d6e62a53fb63.sql",
  "20260811114541_a2757fc4-bbf9-4cd8-b557-8f215c7651f9.sql",
  "20260811114942_b147ac5e-6583-4de3-b679-c83336afd8ef.sql",
  "20260812171150_5c7cd74e-1ea3-4ac9-9493-4f6ae8b50721.sql",
  "20260815055949_f8eada3f-1dcd-4ad8-b131-1982ae4d53cc.sql",
];

/** Every file that writes ledger rows without including its own version. */
function stampersOmittingSelf(): string[] {
  const out: string[] = [];
  for (const f of files) {
    const sql = readFileSync(join(DIR, f), "utf8");
    // The rule keys on the filename's date, so ask it as if the rule had always
    // been in force: strip the prefix's guard by testing the raw condition here.
    if (!/insert\s+into\s+supabase_migrations\.schema_migrations/i.test(sql)) continue;
    const own = /^([0-9]+)/.exec(f)?.[1] ?? "";
    const stamped = new Set<string>();
    for (const m of sql.matchAll(/insert\s+into\s+supabase_migrations\.schema_migrations/gi)) {
      const end = sql.indexOf(";", m.index);
      const stmt = sql.slice(m.index, end === -1 ? undefined : end);
      for (const v of stmt.matchAll(/'([0-9]{8,20})'/g)) stamped.add(v[1]);
    }
    if (stamped.size > 0 && !stamped.has(own)) out.push(f);
  }
  return out;
}

describe("a migration that records the ledger records itself", () => {
  it("finds the migrations, so it cannot pass by scanning nothing", () => {
    expect(files.length).toBeGreaterThan(500);
  });

  /*
   * THE HISTORICAL SET IS CLOSED. This is the mirror on the effective date: the
   * linter is deliberately silent before the cutoff, so without this the date
   * could be moved forward and a new offender would pass in silence.
   */
  it("the grandfathered stampers are exactly the 22 measured on 2026-09-10", () => {
    expect(stampersOmittingSelf().sort()).toEqual([...LEGACY_STAMPERS].sort());
  });

  it("all 22 predate the rule, so the cutoff covers exactly what it claims", () => {
    for (const f of LEGACY_STAMPERS) {
      expect(f.slice(0, 14) < LEDGER_STAMP_RULE_FROM).toBe(true);
    }
  });

  /*
   * AND THE RULE ITSELF FIRES. The set above is about what is forgiven; this is
   * about what is forbidden, and without it the whole file could pass while the
   * linter did nothing at all.
   */
  it("flags a new catch-up migration that stamps others and not itself", () => {
    const sql = `insert into supabase_migrations.schema_migrations (version, name) values
        ('20260101000000','a'), ('20260102000000','b') on conflict (version) do nothing;`;
    const findings = lintMigrationSql(sql, "20260911120000_a_catch_up.sql");
    expect(findings.map((f) => f.rule)).toContain("ledger-stamp-omits-self");
    expect(findings.find((f) => f.rule === "ledger-stamp-omits-self")?.severity).toBe("error");
  });

  it("passes the same migration once it includes its own version", () => {
    const sql = `insert into supabase_migrations.schema_migrations (version, name) values
        ('20260101000000','a'), ('20260911120000','a_catch_up') on conflict (version) do nothing;`;
    const findings = lintMigrationSql(sql, "20260911120000_a_catch_up.sql");
    expect(findings.map((f) => f.rule)).not.toContain("ledger-stamp-omits-self");
  });

  it("says nothing about a migration that never touches the ledger", () => {
    const sql = `alter table public.things add column if not exists note text;`;
    const findings = lintMigrationSql(sql, "20260911120000_ordinary.sql");
    expect(findings.map((f) => f.rule)).not.toContain("ledger-stamp-omits-self");
  });

  /*
   * AND IT READS CODE, NOT PROSE. Sixth instance of this trap in one night
   * across two lanes, so it is asserted rather than assumed: a migration whose
   * COMMENT discusses stamping the ledger is not stamping the ledger.
   */
  it("does not fire on a comment that merely discusses the ledger", () => {
    const sql = `-- insert into supabase_migrations.schema_migrations ('20260101000000','x')
      alter table public.things add column if not exists note text;`;
    const findings = lintMigrationSql(sql, "20260911120000_ordinary.sql");
    expect(findings.map((f) => f.rule)).not.toContain("ledger-stamp-omits-self");
  });
});
