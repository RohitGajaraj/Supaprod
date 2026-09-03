/**
 * P-39 (A-QUEUE.md). The founder deleted an empty workspace, was told it
 * worked, and it was still there: `deleteWorkspace` ran `.delete().eq("id")`
 * and returned `{ ok: true }` whatever happened, and PostgREST answers a
 * delete RLS blocked (0 rows, no error) exactly the same as one that
 * succeeded. `deleteWorkspaceCore`/`leaveWorkspaceCore`
 * (`workspaces.functions.ts`) fix it the same way `removeWorkspaceMember`
 * already does: select the row back, and when nothing came back, throw.
 *
 * Tests the CORE functions directly against a fake `SupabaseClient`, not the
 * `createServerFn`-wrapped exports -- those need a real request's middleware
 * context to resolve, which is exactly why the logic was pulled into an
 * explicitly-`SupabaseClient`-typed function in the first place (the same
 * shape `captureDeploymentsCore` in `deployments.functions.ts` already uses).
 */
import { describe, test, expect } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { deleteWorkspaceCore, leaveWorkspaceCore } from "./workspaces.functions";

/** Every call in both functions ends in `.select()` or `.single()`, and
 *  every step before that is `.eq()` -- one recursive shape covers both a
 *  single-`.eq()` delete and a double-`.eq()` one. */
function chain(result: unknown): {
  eq: () => ReturnType<typeof chain>;
  select: () => Promise<unknown>;
  single: () => Promise<unknown>;
} {
  return {
    eq: () => chain(result),
    select: () => Promise.resolve(result),
    single: () => Promise.resolve(result),
  };
}

function fakeSupabase(opts: {
  deleteResult: { data: unknown[] | null; error: { message: string } | null };
  ownerRow?: { owner_id: string } | null;
}): SupabaseClient {
  return {
    from: () => ({
      delete: () => chain(opts.deleteResult),
      select: () => chain({ data: opts.ownerRow ?? null }),
    }),
  } as unknown as SupabaseClient;
}

describe("deleteWorkspaceCore", () => {
  test("a delete that matches a row returns ok", async () => {
    const db = fakeSupabase({ deleteResult: { data: [{ id: "ws-1" }], error: null } });
    expect(await deleteWorkspaceCore(db, "ws-1")).toEqual({ ok: true });
  });

  test("a delete that matches nothing throws the sentence, not a phantom ok", async () => {
    const db = fakeSupabase({ deleteResult: { data: [], error: null } });
    await expect(deleteWorkspaceCore(db, "ws-1")).rejects.toThrow(
      "Nothing was deleted: this workspace wasn't found, or you don't have permission to delete it.",
    );
  });

  test("null data (not just an empty array) is treated the same as zero rows", async () => {
    const db = fakeSupabase({ deleteResult: { data: null, error: null } });
    await expect(deleteWorkspaceCore(db, "ws-1")).rejects.toThrow("Nothing was deleted");
  });

  test("a genuine database error is raised, not swallowed into the same sentence", async () => {
    const db = fakeSupabase({
      deleteResult: { data: null, error: { message: "connection reset" } },
    });
    await expect(deleteWorkspaceCore(db, "ws-1")).rejects.toThrow("connection reset");
  });
});

describe("leaveWorkspaceCore", () => {
  test("the owner cannot leave", async () => {
    const db = fakeSupabase({
      deleteResult: { data: [{ user_id: "u-1" }], error: null },
      ownerRow: { owner_id: "u-1" },
    });
    await expect(leaveWorkspaceCore(db, "u-1", "ws-1")).rejects.toThrow(
      "Owners can't leave. Delete the workspace or transfer it first.",
    );
  });

  test("a member who is removed leaves cleanly", async () => {
    const db = fakeSupabase({
      deleteResult: { data: [{ user_id: "u-2" }], error: null },
      ownerRow: { owner_id: "u-1" },
    });
    expect(await leaveWorkspaceCore(db, "u-2", "ws-1")).toEqual({ ok: true });
  });

  test("a non-member's delete matches nothing and says so, not a phantom ok", async () => {
    const db = fakeSupabase({
      deleteResult: { data: [], error: null },
      ownerRow: { owner_id: "u-1" },
    });
    await expect(leaveWorkspaceCore(db, "u-3", "ws-1")).rejects.toThrow(
      "You aren't a member of this workspace, so there's nothing to leave.",
    );
  });
});
