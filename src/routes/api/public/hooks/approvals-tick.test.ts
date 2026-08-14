/**
 * THE SWEEPER COULD UN-EXECUTE A CALL, AND THE MAILER COULD SEND TWICE.
 *
 * Three defects live in this one tick, and all three are the same sentence: a
 * SELECT that establishes a fact, an await, and then a write filtered by id
 * alone.
 *
 * (1) EXPIRY OVERWROTE EXECUTION. The tick selected pending rows past their
 * expiry, then updated each by id with `status: 'expired'` and a fabricated
 * "no decision before ..." error. If a human approved and the tool ran in
 * between -- a window that is the whole duration of a merge -- the executed row
 * was rewritten as never answered. resume-runs then unblocked the run and the
 * loop told the agent "Tool X was NOT executed", so the agent ran it again.
 * That is a double merge that needs no second person and no double click, just
 * one sweeper tick landing in the wrong second. It runs on supabaseAdmin, so
 * RLS narrowed nothing either.
 *
 * (2) THE SAME SHAPE IN THE ESCALATION RECONCILE. It clears the Needs-You flag
 * on decided rows; filtered by id alone, it also cleared the flag on a call
 * that extendApprovalTtl had just put back on the clock, which deletes a live
 * gate from every surface a person looks at.
 *
 * (3) DUPLICATE CUSTOMER EMAIL, AND SILENTLY DROPPED EMAIL, FROM ONE BLOCK.
 * The batch is 100 rows, read once, then sent sequentially, so roughly 99 email
 * round trips separate row 100's read from its stamp. The next minute's tick
 * re-read the un-stamped tail and mailed it again. And the stamp sat outside
 * the try/catch while the send's return value was discarded -- dispatchInstantEmail
 * returns { sent: false } WITHOUT throwing on a Resend 429 or 500 -- so a
 * rate-limited send was recorded as delivered and never retried.
 */
import { describe, expect, mock, test } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { makeFakeDb, type FakeRow } from "@/lib/ai/fake-postgrest.test";
import {
  expireOverdueApprovals,
  notifyExpiringApprovals,
  resolveStaleEscalations,
} from "./approvals-tick";

const NOW = "2026-08-14T12:00:00.000Z";
const PAST = "2026-08-14T11:00:00.000Z";
const SOON = "2026-08-14T12:30:00.000Z";
const USER = "11111111-1111-1111-1111-111111111111";

const pending = (id: string, over: FakeRow = {}): FakeRow => ({
  id,
  user_id: USER,
  agent_slug: "builder",
  tool_name: "studio.pr.merge",
  rationale: "merge the PR",
  trace_id: null,
  status: "pending",
  escalation_state: "pending",
  expires_at: PAST,
  expiry_notified_at: null,
  decided_at: null,
  ...over,
});

describe("expireOverdueApprovals", () => {
  test("a call approved and executed mid-sweep is left alone", async () => {
    // The interleaving, planted at the instruction where it happens: the row is
    // read as pending, and the human's decision plus the tool run land before
    // the sweeper's write.
    const db = makeFakeDb(
      { agent_approvals: [pending("a")] },
      {
        beforeStatement: (info, tables) => {
          if (info.mode !== "update") return;
          const row = tables.agent_approvals[0];
          if (row.status === "pending") {
            row.status = "executed";
            row.decided_at = "2026-08-14T11:59:59.000Z";
            row.result = { merged: true };
          }
        },
      },
    );
    const out = await expireOverdueApprovals(db as unknown as SupabaseClient, NOW);
    const row = db.tables.agent_approvals[0];
    expect(row.status).toBe("executed");
    expect(row.error ?? null).toBeNull();
    expect(out.expired).toBe(0);
    // Reported, not swallowed: a sweep that touched nothing because the world
    // moved is a different fact from a sweep that found nothing.
    expect(out.lost).toBe(1);
  });

  test("a genuinely unanswered call still expires", async () => {
    const db = makeFakeDb({ agent_approvals: [pending("a")] });
    const out = await expireOverdueApprovals(db as unknown as SupabaseClient, NOW);
    expect(out.expired).toBe(1);
    expect(db.tables.agent_approvals[0].status).toBe("expired");
    expect(db.tables.agent_approvals[0].escalation_state).toBe("expired");
  });

  test("two overlapping ticks expire one call once", async () => {
    const db = makeFakeDb({ agent_approvals: [pending("a")] });
    const [x, y] = await Promise.all([
      expireOverdueApprovals(db as unknown as SupabaseClient, NOW),
      expireOverdueApprovals(db as unknown as SupabaseClient, NOW),
    ]);
    expect(x.expired + y.expired).toBe(1);
  });
});

describe("resolveStaleEscalations", () => {
  test("a call put back on the clock mid-sweep keeps its Needs-You flag", async () => {
    // extendApprovalTtl revives an expired call to status 'pending' with a new
    // expiry. If the reconcile clears escalation_state on it, the gate is
    // invisible on every surface a person reads while still being live.
    const db = makeFakeDb(
      {
        agent_approvals: [
          pending("a", { status: "failed", escalation_state: "pending", decided_at: PAST }),
        ],
      },
      {
        beforeStatement: (info, tables) => {
          if (info.mode !== "update") return;
          const row = tables.agent_approvals[0];
          if (row.status === "failed") {
            row.status = "pending";
            row.decided_at = null;
            row.expires_at = SOON;
          }
        },
      },
    );
    const out = await resolveStaleEscalations(db as unknown as SupabaseClient);
    expect(db.tables.agent_approvals[0].escalation_state).toBe("pending");
    expect(out.resolved).toBe(0);
    expect(out.lost).toBe(1);
  });

  test("a genuinely decided call has its stale flag cleared", async () => {
    const db = makeFakeDb({
      agent_approvals: [
        pending("a", { status: "executed", escalation_state: "pending", decided_at: PAST }),
      ],
    });
    const out = await resolveStaleEscalations(db as unknown as SupabaseClient);
    expect(out.resolved).toBe(1);
    expect(db.tables.agent_approvals[0].escalation_state).toBe("resolved");
  });
});

describe("notifyExpiringApprovals", () => {
  const expiringSoon = (id: string, over: FakeRow = {}) =>
    pending(id, { expires_at: SOON, ...over });

  test("two overlapping ticks send one email per call", async () => {
    const db = makeFakeDb({
      agent_approvals: [expiringSoon("a"), expiringSoon("b")],
    });
    const sent: string[] = [];
    // A STUB OF A SLOW OPERATION, not a wait for one. The latency is the defect:
    // a 100-row sequential batch puts ninety-nine email round trips between row
    // 100's read and its stamp, which is the whole reason the next tick re-read
    // and re-sent the tail. Remove it and the test can no longer overlap.
    const send = mock(async (_db: unknown, userId: string) => {
      sent.push(userId);
      await new Promise((r) => setTimeout(r, 5));
      return { sent: true, reason: "ok" };
    });
    await Promise.all([
      notifyExpiringApprovals(db as unknown as SupabaseClient, NOW, send),
      notifyExpiringApprovals(db as unknown as SupabaseClient, NOW, send),
    ]);
    expect(sent.length).toBe(2);
    expect(db.tables.agent_approvals.every((r) => r.expiry_notified_at === NOW)).toBe(true);
  });

  test("a send the provider refused is not recorded as delivered", async () => {
    const db = makeFakeDb({ agent_approvals: [expiringSoon("a")] });
    const out = await notifyExpiringApprovals(db as unknown as SupabaseClient, NOW, async () => ({
      sent: false,
      reason: "resend 429",
    }));
    expect(out.notified).toBe(0);
    expect(out.failures.length).toBe(1);
    // The claim is handed back, so the next tick can try again inside the same
    // warning window. Stamping it here is how a rate-limited send became a
    // person never hearing that their gate was about to expire.
    expect(db.tables.agent_approvals[0].expiry_notified_at).toBeNull();
  });

  test("a send that throws is not recorded as delivered either", async () => {
    const db = makeFakeDb({ agent_approvals: [expiringSoon("a")] });
    const out = await notifyExpiringApprovals(db as unknown as SupabaseClient, NOW, async () => {
      throw new Error("network down");
    });
    expect(out.notified).toBe(0);
    expect(db.tables.agent_approvals[0].expiry_notified_at).toBeNull();
  });

  test("a call already notified is never re-sent", async () => {
    const db = makeFakeDb({
      agent_approvals: [expiringSoon("a", { expiry_notified_at: "2026-08-14T11:45:00.000Z" })],
    });
    let calls = 0;
    const out = await notifyExpiringApprovals(db as unknown as SupabaseClient, NOW, async () => {
      calls++;
      return { sent: true, reason: "ok" };
    });
    expect(calls).toBe(0);
    expect(out.notified).toBe(0);
  });
});
