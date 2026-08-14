/**
 * THIS TICK PUSHED DUPLICATE MERGE COMMITS TO CUSTOMER BRANCHES.
 *
 * WHY IT COLLIDES RATHER THAN DIVERGES. github-webhook.ts calls runCiPollTick()
 * UNAWAITED, and pg_cron calls it every two minutes. Concurrent sweeps read the
 * same `.limit(20)` set ordered `updated_at ASC`, so they do not spread out
 * across different work, they start on the same changeset at the same instant.
 *
 * Then: read `branch_sync_attempts`, write `attempts + 1` filtered by id, POST
 * to api.github.com/repos/{repo}/merges. Both sweeps read 0, both write 1, both
 * merge, and the customer's branch gets the same sync commit twice.
 * BRANCH_SYNC_BUDGET = 2 silently bought four.
 *
 * The counter is now the claim: the increment is conditional on the value it
 * was read at, and only the sweep whose write matched a row may merge.
 *
 * The two INSERTS in the same file had the same shape with a count-read in
 * front of them, and a count-read is not a mutual-exclusion primitive: it is a
 * read, and two readers both see zero. A duplicate merge-gate approval is a
 * duplicate human decision AND a duplicate customer email; a duplicate builder
 * dispatch is a second paid agent run committing to the same branch. Both now
 * take a claim in `idempotency_keys`, whose UNIQUE (scope, key) the database
 * enforces however many workers ask at once.
 */
import { describe, expect, test } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { makeFakeDb } from "@/lib/ai/fake-postgrest.test";
import { claimBranchSyncAttempt, claimOnce, releaseClaim } from "./ci-poll-tick";

const changeset = (over: Record<string, unknown> = {}) => ({
  id: "cs-1",
  branch: "feat/x",
  branch_sync_attempts: 0,
  ...over,
});

describe("claimBranchSyncAttempt", () => {
  test("two sweeps reading the same attempt count produce one merge", async () => {
    const db = makeFakeDb({ studio_changesets: [changeset()] });
    const cs = changeset();
    const both = await Promise.all([
      claimBranchSyncAttempt(db as unknown as SupabaseClient, cs),
      claimBranchSyncAttempt(db as unknown as SupabaseClient, cs),
    ]);
    expect(both.filter((c) => c.claimed).length).toBe(1);
    // And the budget is honest: one attempt spent, not two, and not two merges.
    expect(db.tables.studio_changesets[0].branch_sync_attempts).toBe(1);
  });

  test("the shape this replaces let both sweeps through", async () => {
    // Not a test of production code: a test of the claim's NECESSITY, kept so
    // the difference is visible rather than asserted. This is the statement
    // that shipped, run against the same fake. Both sweeps read 0, both writes
    // match a row, and in production both would have POSTed to /merges.
    const db = makeFakeDb({ studio_changesets: [changeset()] });
    const unguarded = async () => {
      const { data } = await db
        .from("studio_changesets")
        .update({ branch_sync_attempts: 1 })
        .eq("id", "cs-1")
        .select("id");
      return (data?.length ?? 0) > 0;
    };
    const both = await Promise.all([unguarded(), unguarded()]);
    expect(both.filter(Boolean).length).toBe(2);
  });

  test("sequential sweeps each spend one attempt", async () => {
    const db = makeFakeDb({ studio_changesets: [changeset()] });
    const first = await claimBranchSyncAttempt(db as unknown as SupabaseClient, changeset());
    const second = await claimBranchSyncAttempt(
      db as unknown as SupabaseClient,
      changeset({ branch_sync_attempts: 1 }),
    );
    expect([first.claimed, second.claimed]).toEqual([true, true]);
    expect(db.tables.studio_changesets[0].branch_sync_attempts).toBe(2);
  });

  test("a row written before the column had a default is still claimable", async () => {
    // `.eq(col, 0)` never matches NULL in Postgres, so a naive compare-and-swap
    // would refuse these rows forever and no stale branch would ever be synced.
    const db = makeFakeDb({ studio_changesets: [changeset({ branch_sync_attempts: null })] });
    const claim = await claimBranchSyncAttempt(
      db as unknown as SupabaseClient,
      changeset({ branch_sync_attempts: null }),
    );
    expect(claim.claimed).toBe(true);
    expect(db.tables.studio_changesets[0].branch_sync_attempts).toBe(1);
  });
});

describe("claimOnce", () => {
  const opts = { unique: { idempotency_keys: [["scope", "key"]] } };

  test("two concurrent claims on one key, one winner", async () => {
    const db = makeFakeDb({ idempotency_keys: [] }, opts);
    const both = await Promise.all([
      claimOnce(db as unknown as SupabaseClient, "ci-merge-gate", "mission-1", "user-1"),
      claimOnce(db as unknown as SupabaseClient, "ci-merge-gate", "mission-1", "user-1"),
    ]);
    expect(both.filter((c) => c.claimed).length).toBe(1);
  });

  test("different keys never block each other", async () => {
    const db = makeFakeDb({ idempotency_keys: [] }, opts);
    const a = await claimOnce(db as unknown as SupabaseClient, "ci-fix", "cs-1:sha-a", "user-1");
    const b = await claimOnce(db as unknown as SupabaseClient, "ci-fix", "cs-1:sha-b", "user-1");
    expect([a.claimed, b.claimed]).toEqual([true, true]);
  });

  test("a released claim can be won again, so a failed insert is retried", async () => {
    // Claim and release are one mechanism. Without the release, an insert that
    // failed after the claim would retire that head sha forever: the red build
    // never gets its fix run and every later sweep reports a clean pass.
    const db = makeFakeDb({ idempotency_keys: [] }, opts);
    const first = await claimOnce(db as unknown as SupabaseClient, "ci-fix", "k", "user-1");
    await releaseClaim(db as unknown as SupabaseClient, "ci-fix", "k");
    const again = await claimOnce(db as unknown as SupabaseClient, "ci-fix", "k", "user-1");
    expect([first.claimed, again.claimed]).toEqual([true, true]);
  });

  test("an unreadable failure refuses the work rather than doubling it", async () => {
    // Fails CLOSED, unlike the resume lease. Everything guarded here is retried
    // by the next sweep two minutes later, so skipping costs a short delay,
    // while proceeding costs a second merge commit on a customer's branch.
    const db = makeFakeDb({}, { missingColumns: { idempotency_keys: ["scope"] } });
    const claim = await claimOnce(db as unknown as SupabaseClient, "ci-fix", "k", "user-1");
    expect(claim.claimed).toBe(false);
    expect(claim.reason).toContain("does not exist");
  });
});
