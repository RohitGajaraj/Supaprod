/**
 * ── A COUNT NAMES THE QUEUE'S FAMILIES ───────────────────────────────────────
 *
 * `approvals_queue_counts` (migration 20260909100500) answers the Inbox's
 * "N waiting in X" line with one round trip, counting the queue's families
 * in SQL. Two lists of family names now exist, one in TypeScript and one in
 * a migration, and a family added to the queue without a row in the function
 * would be waiting on the page and missing from the line. This reads both.
 *
 * Trust graduation is the one deliberate absence: it carries no workspace
 * and would be repeated per row, which the function's own comment says.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { APPROVAL_KINDS } from "./approvals-queue.functions";

const SQL = readFileSync("supabase/migrations/20260909100500_approvals_queue_counts.sql", "utf8");
const UNSCOPED = new Set(["trust_graduation"]);

describe("a count names the queue's families", () => {
  it("every workspace-bound family the queue federates is a row in the function", () => {
    for (const kind of APPROVAL_KINDS) {
      if (UNSCOPED.has(kind)) continue;
      expect(SQL).toContain(`'${kind}'`);
    }
  });

  it("the unscoped family is left out on purpose, and says so", () => {
    expect(SQL).not.toContain("'trust_graduation'");
    expect(SQL).toContain("carry no workspace and are counted in none");
  });

  it("the function runs as the caller, so it counts what the caller can see", () => {
    expect(SQL).toContain("security invoker");
    expect(SQL).toContain(
      "grant execute on function public.approvals_queue_counts(uuid) to authenticated",
    );
  });

  it("the snoozed items are left out the way the queue leaves them out", () => {
    expect(SQL).toContain("snoozed_until > now()");
    expect(SQL).toMatch(/s\.kind = f\.kind and s\.source_id = f\.sid/);
  });
});
