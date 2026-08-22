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

/**
 * The executor, for cases that must not reach it. Passed explicitly rather than
 * left to default: the real one dynamically imports the whole tool registry, and
 * a unit test of a sweep should fail loudly if the sweep tries to run something,
 * not quietly load a few hundred kilobytes of product to find out.
 */
const neverRuns = async (): Promise<never> => {
  throw new Error("the sweeper ran a tool it should not have");
};

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
    const out = await expireOverdueApprovals(db as unknown as SupabaseClient, NOW, neverRuns);
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
    const out = await expireOverdueApprovals(db as unknown as SupabaseClient, NOW, neverRuns);
    expect(out.expired).toBe(1);
    expect(db.tables.agent_approvals[0].status).toBe("expired");
    expect(db.tables.agent_approvals[0].escalation_state).toBe("expired");
  });

  test("two overlapping ticks expire one call once", async () => {
    const db = makeFakeDb({ agent_approvals: [pending("a")] });
    const [x, y] = await Promise.all([
      expireOverdueApprovals(db as unknown as SupabaseClient, NOW, neverRuns),
      expireOverdueApprovals(db as unknown as SupabaseClient, NOW, neverRuns),
    ]);
    expect(x.expired + y.expired).toBe(1);
  });
});

/**
 * THE QUEUE THAT ONLY GREW.
 *
 * Measured in production 2026-08-22: 38 approvals pending, oldest 696 hours, at
 * zero real users, with this tick running every minute throughout. Nothing was
 * broken in the sense of throwing — the sweep swept, and swept nothing, for two
 * separate reasons that each have a test below.
 *
 *   (1) ESCALATION WAS A ONE-WAY EXIT FROM THE CLOCK. The select carried
 *       `.eq("escalation_state","pending")`, so the 21 rows at (pending, expired)
 *       and the 7 at (pending, escalated) were outside it — and outside
 *       `resolveStaleEscalations` too, which only clears a DECIDED row. Twenty-
 *       eight rows in a state no sweeper would look at.
 *
 *   (2) EXPIRY WAS A PUNISHMENT, SO IT COULD NOT BE THE ANSWER. Every unanswered
 *       call died the same death whatever it was, which is why the flat deadline
 *       was seven days and why nothing was allowed to act on it. A call now
 *       declares what silence means before the silence starts: reversible and
 *       internal goes ahead, everything else is cancelled unrun.
 */
describe("expireOverdueApprovals — the two lanes", () => {
  /** A reversible internal tool: 10 of the 38 stuck rows were this one. */
  const reversibleInternal = (id: string, over: FakeRow = {}): FakeRow =>
    pending(id, { tool_name: "cluster.trigger", agent_slug: "researcher", ...over });

  test("a reversible internal call goes ahead unasked, and the tool actually runs", async () => {
    const db = makeFakeDb({ agent_approvals: [reversibleInternal("a")] });
    const ran: string[] = [];
    const out = await expireOverdueApprovals(
      db as unknown as SupabaseClient,
      NOW,
      async (_db, _user, id) => {
        ran.push(id);
        return { ok: true };
      },
    );

    expect(out.proceeded).toBe(1);
    expect(out.expired).toBe(0);
    // Not just marked. A gate that flips to 'approved' and never runs is the
    // seven `approved`-and-never-executed rows already sitting in production.
    expect(ran).toEqual(["a"]);
    const row = db.tables.agent_approvals[0];
    expect(row.status).toBe("approved");
    expect(row.escalation_state).toBe("resolved");
    expect(String(row.decision_reason)).toContain("Proceeded unasked");
  });

  test("nobody is recorded as having decided it", async () => {
    /* `decided_by` is the column that means a person pressed the button, and no
     * person did. Writing an id there would put a decision in someone's name
     * that they never made, in a product whose claim is that the record holds. */
    const db = makeFakeDb({ agent_approvals: [reversibleInternal("a")] });
    await expireOverdueApprovals(db as unknown as SupabaseClient, NOW, async () => ({}));
    const row = db.tables.agent_approvals[0];
    expect(row.decided_by ?? null).toBeNull();
    expect(row.decided_at).toBe(NOW);
  });

  test("a reversible call that leaves the workspace is cancelled, not run", async () => {
    // The axis reversibility alone would lose. `calendar.create` is undoable and
    // still puts something in front of another person: 7 raised, 7 rejected.
    const db = makeFakeDb({
      agent_approvals: [pending("a", { tool_name: "calendar.create" })],
    });
    const out = await expireOverdueApprovals(db as unknown as SupabaseClient, NOW, neverRuns);
    expect(out.expired).toBe(1);
    expect(out.proceeded).toBe(0);
    expect(db.tables.agent_approvals[0].status).toBe("expired");
    expect(String(db.tables.agent_approvals[0].error)).toContain("leaves the workspace");
  });

  test("a call that would proceed is cancelled instead when the workspace is a fixture", async () => {
    /* NOT AN EDGE CASE — IT IS THE WHOLE FIRST SWEEP. All 38 calls stuck in
     * production on 2026-08-22 belong to sample workspaces; not one is real
     * customer work. Proceeding runs a tool, and running a tool on a demo
     * fixture is how 89% of a day's AI spend once disappeared.
     *
     * Cancelled rather than skipped: skipping leaves it pending forever, which
     * is the queue this whole change exists to end. */
    const db = makeFakeDb({
      workspaces: [
        { id: "ws-demo", is_sample: true },
        { id: "ws-real", is_sample: false },
      ],
      agent_approvals: [
        reversibleInternal("demo", { workspace_id: "ws-demo" }),
        reversibleInternal("real", { workspace_id: "ws-real" }),
      ],
    });
    const ran: string[] = [];
    const out = await expireOverdueApprovals(
      db as unknown as SupabaseClient,
      NOW,
      async (_db, _u, id) => {
        ran.push(id);
        return {};
      },
    );

    expect(ran).toEqual(["real"]);
    expect(out.onFixtures).toBe(1);
    expect(out.proceeded).toBe(1);
    expect(out.expired).toBe(1);
    const demo = db.tables.agent_approvals.find((r) => r.id === "demo")!;
    expect(demo.status).toBe("expired");
    expect(String(demo.error)).toContain("sample workspace");
    expect(db.tables.agent_approvals.find((r) => r.id === "real")!.status).toBe("approved");
  });

  test("an escalated call is still on the clock", async () => {
    // The 7 rows at (pending, escalated), stuck 684 hours. Escalating a call
    // raises its urgency; it cannot also be what stops anyone counting.
    const db = makeFakeDb({
      agent_approvals: [reversibleInternal("a", { escalation_state: "escalated" })],
    });
    const out = await expireOverdueApprovals(
      db as unknown as SupabaseClient,
      NOW,
      async () => ({}),
    );
    expect(out.proceeded).toBe(1);
    expect(db.tables.agent_approvals[0].status).toBe("approved");
  });

  test("a call already flagged expired but still pending is still on the clock", async () => {
    // The 21 rows at (pending, expired), stuck 696 hours: flagged by one writer,
    // invisible to every reader, decidable by nothing.
    const db = makeFakeDb({
      agent_approvals: [pending("a", { escalation_state: "expired" })],
    });
    const out = await expireOverdueApprovals(db as unknown as SupabaseClient, NOW, neverRuns);
    expect(out.expired).toBe(1);
    expect(db.tables.agent_approvals[0].status).toBe("expired");
  });

  test("the default the row declared beats the one the catalogue would compute now", async () => {
    /* A person was shown "this is cancelled if you do nothing". The catalogue
     * moving afterwards must not turn that into an action they never agreed to.
     * cluster.trigger computes to `proceed`; the row says otherwise and wins. */
    const db = makeFakeDb({
      agent_approvals: [reversibleInternal("a", { expiry_default: "cancel" })],
    });
    const out = await expireOverdueApprovals(db as unknown as SupabaseClient, NOW, neverRuns);
    expect(out.expired).toBe(1);
    expect(out.derived).toBe(0);
    expect(db.tables.agent_approvals[0].status).toBe("expired");
  });

  test("before the migration lands the sweep still sweeps, and says the default was derived", async () => {
    // A sweep that refuses because a column is missing leaves the queue exactly
    // as it found it, which is the state this whole change exists to end.
    const db = makeFakeDb(
      { agent_approvals: [reversibleInternal("a")] },
      { missingColumns: { agent_approvals: ["expiry_default"] } },
    );
    const out = await expireOverdueApprovals(
      db as unknown as SupabaseClient,
      NOW,
      async () => ({}),
    );
    expect(out.proceeded).toBe(1);
    expect(out.derived).toBe(1);
    expect(String(db.tables.agent_approvals[0].decision_reason)).toContain(
      "migration has not applied yet",
    );
  });

  test("a call answered between the read and the claim is not run by the sweeper too", async () => {
    const db = makeFakeDb(
      { agent_approvals: [reversibleInternal("a")] },
      {
        beforeStatement: (info, tables) => {
          if (info.mode !== "update") return;
          const row = tables.agent_approvals[0];
          if (row.status === "pending") {
            row.status = "executed";
            row.decided_at = "2026-08-14T11:59:59.000Z";
          }
        },
      },
    );
    const ran: string[] = [];
    const out = await expireOverdueApprovals(
      db as unknown as SupabaseClient,
      NOW,
      async (_db, _u, id) => {
        ran.push(id);
        return {};
      },
    );
    expect(out.proceeded).toBe(0);
    expect(out.lost).toBe(1);
    expect(ran).toEqual([]);
    expect(db.tables.agent_approvals[0].status).toBe("executed");
  });

  test("a tool that fails leaves the call allowed and the failure reported", async () => {
    /* The claim is what authorised the run, and it was taken. Rolling the row
     * back to pending would offer the same call again with no record that it
     * had already been let through once. */
    const db = makeFakeDb({ agent_approvals: [reversibleInternal("a")] });
    const out = await expireOverdueApprovals(db as unknown as SupabaseClient, NOW, async () => {
      throw new Error("no unclustered signals");
    });
    expect(out.proceeded).toBe(1);
    expect(out.failures.length).toBe(1);
    expect(out.failures[0]).toContain("no unclustered signals");
    expect(db.tables.agent_approvals[0].status).toBe("approved");
  });

  test("a call whose deadline has not passed is left alone in both lanes", async () => {
    // The whole 38-row backlog is in exactly this state today: every deadline is
    // in the future. Deploying the sweep must decide none of them.
    const db = makeFakeDb({
      agent_approvals: [
        reversibleInternal("a", { expires_at: SOON }),
        pending("b", { expires_at: SOON }),
      ],
    });
    const out = await expireOverdueApprovals(db as unknown as SupabaseClient, NOW, neverRuns);
    expect(out.proceeded + out.expired).toBe(0);
    expect(db.tables.agent_approvals.every((r) => r.status === "pending")).toBe(true);
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
