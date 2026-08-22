/**
 * A SPEND CEILING MUST ONLY EVER TIGHTEN.
 *
 * Measured against production on 2026-08-22, impersonating the account's own owner
 * over an RLS-live session: `UPDATE credit_caps SET cap_credits = 999999999` took a
 * 5,000 cap to 999,999,999 and held, `enabled = false` held, `target_id` could be
 * re-pointed, and `DELETE` removed the row. The only trigger on the table was
 * `set_updated_at`. So the control that bounds a runaway-spend incident could be
 * removed by the person who benefits from removing it.
 *
 * `protect_credit_cap_ceiling` closes that, and the shape of the fix is the whole
 * point: an owner LOWERING their own cap is legitimate and must keep working, so
 * this is a ratchet rather than a column freeze. That asymmetry is easy to lose in
 * a later "simplify the guard" edit, which is what this file exists to catch.
 *
 * Pinned against the migration corpus rather than a running database, the way
 * `money-migrations.test.ts` and `credit-grant-sql-parity.test.ts` pin their
 * invariants: none of this can be enforced from application code, so none of it can
 * be reached by a unit test of a function.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

/** The last migration text that defines `needle` — migrations apply in timestamp order. */
function latestDefining(needle: string): string {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  const hits = files.filter((f) => readFileSync(join(MIGRATIONS_DIR, f), "utf8").includes(needle));
  const hit = hits[hits.length - 1];
  if (!hit) {
    throw new Error(
      `No migration defines ${needle} — the credit-cap guard moved or was removed. ` +
        "If it was removed, an account owner can raise or delete their own spend ceiling again.",
    );
  }
  return readFileSync(join(MIGRATIONS_DIR, hit), "utf8");
}

/** Just the plpgsql body of the guard, so header prose cannot satisfy a check. */
function guardBody(): string {
  const sql = latestDefining("function public.protect_credit_cap_ceiling");
  const start = sql.indexOf("function public.protect_credit_cap_ceiling");
  const end = sql.indexOf("comment on function public.protect_credit_cap_ceiling", start);
  return sql.slice(start, end > start ? end : undefined);
}

describe("the credit_caps ceiling only moves one way", () => {
  test("cap_credits is CLAMPED, not frozen, so an owner can still lower their own cap", () => {
    const body = guardBody();
    // The ratchet: whichever of the two is smaller wins, so lowering lands and
    // raising is a no-op. A plain `NEW.cap_credits := OLD.cap_credits` would also
    // stop the attack, and would break the legitimate half of the feature.
    expect(
      /NEW\.cap_credits\s*:=\s*least\s*\(\s*NEW\.cap_credits\s*,\s*OLD\.cap_credits\s*\)/i.test(
        body,
      ),
    ).toBe(true);
    expect(/NEW\.cap_credits\s*:=\s*OLD\.cap_credits\s*;/i.test(body)).toBe(false);
  });

  test("a cap that is currently binding cannot be switched off", () => {
    const body = guardBody();
    // Disabling is removal by another name: assertCreditCaps only reads enabled caps.
    expect(/if\s+OLD\.enabled\s+then/i.test(body)).toBe(true);
    expect(/NEW\.enabled\s*:=\s*true\s*;/i.test(body)).toBe(true);
  });

  test("the columns that decide WHAT a cap binds are frozen", () => {
    const body = guardBody();
    // Re-pointing a cap at another target, scope, account or window removes it from
    // the thing it was bounding — a DELETE wearing an UPDATE's clothes.
    for (const col of ["account_id", "scope", "target_id", "window_kind"]) {
      expect(new RegExp(`NEW\\.${col}\\s*:=\\s*OLD\\.${col}\\s*;`, "i").test(body)).toBe(true);
    }
  });

  test("DELETE is refused, and silently, matching the two billing guards", () => {
    const body = guardBody();
    const delBranch = /if\s+TG_OP\s*=\s*'DELETE'\s+then\s+return\s+null\s*;/i;
    expect(delBranch.test(body)).toBe(true);
  });

  test("service_role is the only exemption, worded as protect_account_billing_columns words it", () => {
    const body = guardBody();
    expect(/coalesce\s*\(\s*auth\.role\(\)\s*,\s*''\s*\)\s*=\s*'service_role'/i.test(body)).toBe(
      true,
    );
    // auth.role() reads the REQUEST, not the database role, so an unclaimed psql
    // session is guarded too. Anything broader here (current_user, session_user)
    // would hand the exemption to every connection that is not PostgREST.
    expect(/current_user|session_user/i.test(body)).toBe(false);
  });

  test("the trigger fires on UPDATE and DELETE, and never on INSERT", () => {
    const sql = latestDefining("function public.protect_credit_cap_ceiling");
    expect(
      /create trigger trg_protect_credit_cap_ceiling\s+before update or delete on public\.credit_caps/i.test(
        sql,
      ),
    ).toBe(true);
    // On INSERT there is no OLD row, so the identity assignments would fail at
    // runtime — and an INSERT never needs guarding (see the enforcement test below).
    expect(/before insert/i.test(sql)).toBe(false);
  });

  test("it is idempotent, so a re-run of the corpus is safe", () => {
    const sql = latestDefining("function public.protect_credit_cap_ceiling");
    expect(/create or replace function public\.protect_credit_cap_ceiling/i.test(sql)).toBe(true);
    expect(
      /drop trigger if exists trg_protect_credit_cap_ceiling on public\.credit_caps/i.test(sql),
    ).toBe(true);
  });
});

describe("the reason INSERT needs no guard still holds", () => {
  /**
   * The migration leaves INSERT alone because an extra cap can only ever tighten:
   * `assertCreditCaps` evaluates EVERY enabled cap matching the call and throws on
   * the first one exceeded. If enforcement ever changed to pick a single winner —
   * the highest cap, the newest row — then inserting a second cap becomes the
   * bypass the trigger closes on every other path.
   */
  const runtime = readFileSync(
    join(process.cwd(), "src", "lib", "ai", "runtime.server.ts"),
    "utf8",
  );
  const fnStart = runtime.indexOf("async function assertCreditCaps");
  const enforcement = fnStart < 0 ? "" : runtime.slice(fnStart, fnStart + 4000);

  test("assertCreditCaps is still where cap enforcement lives", () => {
    expect(fnStart).toBeGreaterThan(-1);
  });

  test("every matching cap is evaluated, rather than one being chosen", () => {
    expect(/for\s*\(\s*const\s+\w+\s+of\s+caps\s*\)/.test(enforcement)).toBe(true);
    expect(/throw new CreditCapError/.test(enforcement)).toBe(true);
    // No "pick the loosest and ignore the rest".
    expect(/Math\.max\s*\(\s*\.\.\.\s*caps/.test(enforcement)).toBe(false);
    expect(/caps\s*\.\s*sort\s*\(/.test(enforcement)).toBe(false);
    expect(/caps\s*\[\s*0\s*\]/.test(enforcement)).toBe(false);
  });
});
