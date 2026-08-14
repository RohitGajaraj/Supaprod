/**
 * TWO MONEY INVARIANTS THAT ONLY THE DATABASE CAN HOLD.
 *
 * Neither of these can be enforced from application code, so neither can be
 * pinned by a unit test of a function. They are pinned here against the
 * migration corpus instead, the way `credit-grant-sql-parity.test.ts` pins the
 * per-tier grant numbers.
 *
 * (1) WEBHOOK IDEMPOTENCY NEEDS A TABLE. Verified live on 2026-08-14: no
 * `stripe_events` or `webhook_events` table existed anywhere in the production
 * schema, so the Stripe adapter had nowhere to record that it had already seen
 * an event id. A redelivered renewal invoice therefore re-ran
 * `reset_subscription_cycle`, which unconditionally sets `balance_credits` back
 * to the monthly grant.
 *
 * (2) ONE OWNER, ONE ACCOUNT. Verified live the same day: zero unique indexes
 * on `accounts.owner_id`, sixteen accounts, zero duplicates, which is luck and
 * not a guarantee. `ensure_user_default_account` runs on every billing and
 * credits read and did SELECT-finds-nothing then INSERT, so two parallel page
 * loads at signup could each create an account. Two accounts means two credit
 * pools, two monthly grants, and spend split across both so every cap
 * under-counts.
 *
 * The tests read the LATEST definition of each object, because migrations are
 * applied in timestamp order and a later CREATE OR REPLACE is the live one.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

function migrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

/** The whole corpus, oldest first, so "does anything create X" is answerable. */
function allSql(): string {
  return migrationFiles()
    .map((f) => readFileSync(join(MIGRATIONS_DIR, f), "utf8"))
    .join("\n");
}

/** The last migration text that defines `needle`, which is the definition the DB runs. */
function latestDefining(needle: string): string {
  const hits = migrationFiles().filter((f) =>
    readFileSync(join(MIGRATIONS_DIR, f), "utf8").includes(needle),
  );
  const hit = hits[hits.length - 1];
  if (!hit) throw new Error(`No migration defines ${needle}`);
  return readFileSync(join(MIGRATIONS_DIR, hit), "utf8");
}

describe("stripe webhook idempotency has a home in the schema", () => {
  test("a stripe_events table is created, keyed by the Stripe event id", () => {
    const sql = allSql();
    expect(sql).toContain("public.stripe_events");
    expect(/create table if not exists public\.stripe_events/i.test(sql)).toBe(true);
    expect(/event_id\s+text\s+primary key/i.test(sql)).toBe(true);
  });

  test("the table carries RLS, so no client can forge or erase a processed marker", () => {
    const sql = latestDefining("create table if not exists public.stripe_events");
    expect(/alter table public\.stripe_events enable row level security/i.test(sql)).toBe(true);
  });

  test("the claim uses the repo's proven insert-and-count idiom, not a read-then-write", () => {
    const sql = latestDefining("function public.claim_stripe_event");
    // The same shape as apply_topup_credits: a read-then-write claim is exactly
    // the race the claim exists to close.
    expect(/on conflict\s*\(\s*event_id\s*\)\s*do nothing/i.test(sql)).toBe(true);
    expect(/get diagnostics\s+\w+\s*=\s*row_count/i.test(sql)).toBe(true);
  });

  test("a claim can be released, so a failed handler does not swallow the Stripe retry", () => {
    expect(allSql()).toContain("function public.release_stripe_event");
  });
});

describe("accounts.owner_id is unique", () => {
  test("a unique index exists on accounts(owner_id)", () => {
    const sql = allSql();
    expect(
      /create unique index if not exists \w+\s+on public\.accounts\s*\(\s*owner_id\s*\)/i.test(sql),
    ).toBe(true);
  });

  test("the migration refuses to run against a database that already has duplicates", () => {
    // Creating the index on dirty data fails with a bare "could not create
    // unique index" and a duplicate key value, which tells an operator nothing
    // about which owner to merge.
    const sql = latestDefining("on public.accounts (owner_id)");
    expect(/raise exception/i.test(sql)).toBe(true);
    expect(/having count\(\*\)\s*>\s*1/i.test(sql)).toBe(true);
  });

  test("ensure_user_default_account inserts with ON CONFLICT and re-selects the winner", () => {
    const sql = latestDefining("function public.ensure_user_default_account");
    const fnStart = sql.indexOf("function public.ensure_user_default_account");
    const body = sql.slice(fnStart, sql.indexOf("$$;", fnStart));

    expect(
      /insert into public\.accounts[\s\S]{0,120}on conflict\s*\(\s*owner_id\s*\)\s*do nothing/i.test(
        body,
      ),
    ).toBe(true);
    // The loser of the race gets null back from RETURNING and must read the
    // winner's row rather than carrying a null account id forward.
    expect(/if\s+created_id\s+is\s+null/i.test(body)).toBe(true);
  });
});
