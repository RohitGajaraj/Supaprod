/**
 * The spend meters add up, and they do it in one statement.
 *
 * WHY THIS FILE EXISTS. `incrementBudget` and `incrementSurfaceBudget` read the
 * current usage, added to it in JavaScript, and blind-wrote the sum. Two
 * concurrent AI calls both read 10.00 and both wrote 10.50, so one call's spend
 * disappeared. A lost update on a balance check is corrected by the next true
 * read; a lost update on a LEDGER is permanent, because the number IS the record
 * and nothing recomputes it, so the cap under-reports for the rest of the day and
 * the month. The agent loop makes these calls in parallel by design.
 *
 * The correct shape had been in this schema since June: `record_mission_usage`
 * does the same job as one atomic `SET x = x + n`.
 *
 * These are SHAPE tests rather than behaviour tests, deliberately. The defect is
 * not something a unit test with a fake database can see: a read-modify-write
 * passes every single-threaded test ever written for it, which is exactly why it
 * survived. What can be checked without a live Postgres is that the increment is
 * expressed as an accumulation in SQL and that the runtime reaches it, which is
 * the property that was missing.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..", "..", "..");
const MIGRATION = join(
  ROOT,
  "supabase/migrations/20260814190000_a_meter_that_loses_updates_undercounts_forever.sql",
);
const RUNTIME = join(ROOT, "src/lib/ai/runtime.server.ts");

const sql = () => readFileSync(MIGRATION, "utf8");
const runtime = () => readFileSync(RUNTIME, "utf8");

describe("the meters accumulate in SQL rather than in JavaScript", () => {
  it("adds to the stored value instead of writing a computed one", () => {
    const s = sql();
    // The accumulation, for all four counters. `coalesce(col, 0) + delta` is the
    // shape; a bare assignment would be the defect returning.
    expect(s).toContain("coalesce(b.daily_usd_used, 0) else 0 end");
    expect(s).toContain("coalesce(b.monthly_usd_used, 0) else 0 end");
    expect(s).toContain("coalesce(b.daily_tokens_used, 0) else 0 end");
    expect(s).toContain("coalesce(b.monthly_tokens_used, 0) else 0 end");
  });

  it("decides the window roll inside the statement that takes the lock", () => {
    // THE SUBTLE HALF. The increment is an addition OR a reset, depending on
    // whether the stored window has moved on. That decision used to be made in
    // JavaScript from the row it had just read, which is a read-modify-write with
    // an extra branch. Moving it into the CASE is what makes it atomic.
    const s = sql();
    expect(s).toContain("case when b.day_window = _today");
    expect(s).toContain("case when b.month_window = _month");
    // And the caller must no longer be computing windows for the write path.
    expect(runtime()).not.toContain('thisMonth = today.slice(0, 7) + "-01";\n  // The spend ledger');
  });

  it("creates the first row without letting two first calls create two", () => {
    // An upsert on the UNIQUE user_id, so the row lock serialises the racers.
    // A SELECT-then-INSERT here is the accounts.owner_id defect in another table.
    const s = sql();
    expect(s).toContain("on conflict (user_id) do update set");
  });

  it("leaves an unbudgeted surface unmetered, rather than inventing a budget", () => {
    // The per-surface function is an UPDATE and not an upsert on purpose: the old
    // code returned early on a missing row, and creating one here would start
    // metering surfaces nobody configured, which is a behaviour change rather
    // than a race fix.
    const s = sql();
    const surfaceFn = s.slice(s.indexOf("record_ai_surface_usage"));
    expect(surfaceFn).toContain("update public.ai_surface_budgets");
    expect(surfaceFn).not.toContain("on conflict");
  });

  it("is executable by the service role only", () => {
    // A SECURITY DEFINER meter granted to `authenticated` would hand a user the
    // power the column restrictions exist to deny: resetting their own usage or
    // rolling their own window forward to dodge a cap.
    const s = sql();
    for (const fn of ["record_ai_budget_usage", "record_ai_surface_usage"]) {
      expect(s).toContain(`grant execute on function public.${fn}`);
      expect(s).toMatch(new RegExp(`revoke all on function public\\.${fn}[^;]*from public`));
    }
    expect(s).not.toMatch(/grant execute on function public\.record_ai_[a-z_]+\([^)]*\) to authenticated/);
  });
});

describe("the runtime reaches the atomic meters", () => {
  it("calls both RPCs", () => {
    const code = runtime();
    expect(code).toContain('rpc("record_ai_budget_usage"');
    expect(code).toContain('rpc("record_ai_surface_usage"');
  });

  it("no longer writes either usage ledger from the client", () => {
    // THE REACHABILITY HALF. An RPC that exists beside a surviving table write is
    // the same defect with an extra function, so this asserts the old path is
    // gone rather than merely that the new one is present.
    const code = runtime();
    expect(code).not.toContain('.from("ai_budgets")\n    .update(');
    expect(code).not.toContain('.from("ai_budgets")\n    .insert(');
    expect(code).not.toContain('.from("ai_surface_budgets")\n    .update(');
  });

  it("derives the alert threshold from its own delta, not from a shared read", () => {
    // Under concurrency the old before-value was one stale read shared by every
    // racing caller, so a soft-cap crossing fired several times or not at all.
    // Subtracting your own contribution from the authoritative new total means
    // exactly one caller sees the crossing.
    const code = runtime();
    expect(code).toContain("const prevDaily = newDailyUsd - usd;");
    expect(code).toContain("const prevMonthly = newMonthlyUsd - usd;");
  });

  it("reports a meter failure instead of throwing away a paid-for answer", () => {
    // The model call already happened and already cost money. Turning a
    // bookkeeping failure into a caller-visible error would discard an answer the
    // user has been charged for; swallowing it silently would hide a money bug.
    const code = runtime();
    expect(code).toContain("[budget] account meter did not record:");
    expect(code).toContain("[budget] surface meter did not record for");
  });
});

describe("the RPCs the runtime calls exist in the live schema, with these argument names", () => {
  /**
   * ADDED AFTER THE MIGRATION WAS APPLIED, 2026-08-15, and this is the one check
   * that could not be written before.
   *
   * `tsc` cannot see a wrong RPC name or a misspelled argument: `supabase.rpc()`
   * takes strings, so `record_ai_budget_usage` and `record_ai_budgets_usage`
   * typecheck identically and only one of them exists. That is the runtime-fatal
   * class this repo's own trap list opens with, and a meter that silently fails
   * every call would look exactly like a meter with nothing to record.
   *
   * `integrations/supabase/types.ts` is REGENERATED FROM THE LIVE DATABASE by
   * Lovable when a migration is applied, so it is ground truth here rather than a
   * hand-kept mirror. Asserting the runtime's call against it is asserting against
   * the real schema.
   *
   * WHY THE ARGUMENT NAMES AND NOT JUST THE FUNCTION NAME. PostgREST matches
   * named arguments, so a correct function name with one wrong key returns a
   * "function not found" against a function that plainly exists. Both halves have
   * to agree, so both are pinned.
   */
  const TYPES = readFileSync(join(ROOT, "src/integrations/supabase/types.ts"), "utf8");

  const declared = (fn: string): string => {
    const i = TYPES.indexOf(`      ${fn}: {`);
    expect(i, `${fn} is absent from the generated types, so it is not in the database`).toBeGreaterThan(-1);
    return TYPES.slice(i, i + 500);
  };

  it("record_ai_budget_usage takes the three arguments the runtime sends", () => {
    const d = declared("record_ai_budget_usage");
    for (const arg of ["_user_id", "_tokens", "_usd"]) expect(d).toContain(arg);
    // And the runtime sends exactly those keys.
    const call = runtime().slice(runtime().indexOf('rpc("record_ai_budget_usage"'));
    for (const arg of ["_user_id:", "_tokens:", "_usd:"]) expect(call.slice(0, 300)).toContain(arg);
  });

  it("record_ai_surface_usage takes the three arguments the runtime sends", () => {
    const d = declared("record_ai_surface_usage");
    for (const arg of ["_user_id", "_surface", "_usd"]) expect(d).toContain(arg);
    const call = runtime().slice(runtime().indexOf('rpc("record_ai_surface_usage"'));
    for (const arg of ["_user_id:", "_surface:", "_usd:"]) expect(call.slice(0, 300)).toContain(arg);
  });

  it("both return a SET, which is why the runtime unwraps the first row", () => {
    // A plpgsql function `returns table (...)` comes back as an array. Reading it
    // as an object would leave every field undefined, the caps would read as zero,
    // and the soft-cap alert would silently never fire.
    for (const fn of ["record_ai_budget_usage", "record_ai_surface_usage"]) {
      expect(declared(fn)).toContain("}[]");
    }
    expect(runtime()).toContain("Array.isArray(metered) ? metered[0] : metered");
  });

  it("returns the fields the alert logic reads, by these exact names", () => {
    const d = declared("record_ai_budget_usage");
    for (const col of [
      "new_daily_usd",
      "new_monthly_usd",
      "daily_usd_cap",
      "monthly_usd_cap",
      "alert_at_pct",
    ]) {
      expect(d, `the runtime reads ${col} off this RPC`).toContain(col);
    }
  });

  it("the connector cap's SQL side is in the database too, and still dormant", () => {
    // Applied in the same batch. `connector_limit_enabled` returning false is
    // what makes the trigger a no-op, and flipping it is a pricing decision, so
    // its presence here is worth confirming and its VALUE is not this test's to
    // assert (the migration holds that).
    for (const fn of ["connector_limit_enabled", "tier_connector_limit", "connected_source_count"]) {
      expect(TYPES).toContain(fn);
    }
  });
});
