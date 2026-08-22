import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { needsEscalationResolve } from "@/lib/reliability/gate-state";
import { isMissingColumnError } from "@/lib/ai/run-attempt.server";
import { sampleWorkspaceIds } from "@/lib/ticks/real-workspaces.server";
import { type ExpiryDefault, expiryDefaultFor, expiryNote } from "@/lib/ai/approval-expiry";
import { withJobRun } from "@/lib/observability";
import { dispatchInstantEmail } from "@/lib/notifications.functions";

const EXPIRY_WARNING_MINUTES = 60;

/** What a mailer must look like. Injected so the send path is testable. */
export type InstantEmailSender = (
  db: SupabaseClient,
  userId: string,
  notification: { kind: "approval"; severity: "action"; title: string; detail: string },
) => Promise<{ sent: boolean; reason: string }>;

/**
 * What runs a call that expired into `proceed`. Injected for the same reason the
 * mailer is: the default reaches into the whole tool registry, and a unit test of
 * the sweep must be able to assert "this one ran, that one did not" without it.
 */
export type ApprovalExecutor = (
  db: SupabaseClient,
  userId: string,
  approvalId: string,
) => Promise<unknown>;

/**
 * Loaded on demand rather than at module scope so importing this route does not
 * drag in TOOL_REGISTRY and everything behind it. The tick calls it at most once
 * per proceeding row, and only after a claim has already been won.
 */
const defaultExecutor: ApprovalExecutor = async (db, userId, approvalId) => {
  const { executeApproval } = await import("@/lib/ai/loop.server");
  return executeApproval(db, userId, approvalId);
};

/** The shape the sweep reads. `expiry_default` is absent until the migration lands. */
type OverdueRow = {
  id: string;
  tool_name: string;
  user_id: string;
  status: string;
  escalation_state: string;
  expires_at: string;
  workspace_id: string | null;
  expiry_default?: string | null;
};

const OVERDUE_COLUMNS =
  "id,trace_id,tool_name,status,escalation_state,expires_at,user_id,workspace_id";

/**
 * Every pending call whose deadline has passed — read once, tolerant of a
 * database the `expiry_default` migration has not reached yet.
 *
 * NO `escalation_state` FILTER, and that omission is the larger half of the fix.
 * The old select carried `.eq("escalation_state","pending")`, which made
 * escalation a one-way exit from the clock: 28 of the 38 stuck rows measured on
 * 2026-08-22 sat at `status='pending'` with escalation_state 'expired' (21) or
 * 'escalated' (7), so the expiry pass would not look at them and
 * `resolveStaleEscalations` would not either (it only clears a DECIDED row).
 * `status` is the column every queue actually reads — `getNeedsYou`,
 * `approvals-queue`, `ApprovalsPanel` and `extendApprovalTtl` all agree on that —
 * so `status='pending'` is the whole definition of an unanswered call, and
 * escalation_state is a flag on one, never a reason to stop counting the hours.
 */
async function readOverdue(
  db: SupabaseClient,
  nowIso: string,
): Promise<{ rows: OverdueRow[]; declaredColumnPresent: boolean }> {
  const withDeclared = await db
    .from("agent_approvals")
    .select(`${OVERDUE_COLUMNS},expiry_default`)
    .lt("expires_at", nowIso)
    .eq("status", "pending")
    .limit(500);
  if (!withDeclared.error)
    return { rows: (withDeclared.data ?? []) as OverdueRow[], declaredColumnPresent: true };
  if (!isMissingColumnError(withDeclared.error)) throw withDeclared.error;

  // Pre-migration. Fall back rather than refuse: a sweep that stops sweeping
  // because a column is missing leaves the queue exactly as it was found.
  const plain = await db
    .from("agent_approvals")
    .select(OVERDUE_COLUMNS)
    .lt("expires_at", nowIso)
    .eq("status", "pending")
    .limit(500);
  if (plain.error) throw plain.error;
  return { rows: (plain.data ?? []) as OverdueRow[], declaredColumnPresent: false };
}

/**
 * Expire calls nobody answered before their clock ran out — each into the default
 * it declared when it was raised.
 *
 * TWO LANES, NOT ONE. Until now every unanswered call died the same death, which
 * made expiry a punishment rather than an answer and is why the honest thing for
 * the product to do was leave the queue standing. A reversible call that stays
 * inside the workspace PROCEEDS on silence and the record says it proceeded
 * unasked; everything irreversible, everything crossing the boundary, everything
 * only partly undoable and everything uncatalogued is CANCELLED unrun and the
 * record says which of those it was. `approval-expiry.ts` holds the argument and
 * both clocks; this function only carries it out.
 *
 * THE DECLARED DEFAULT WINS OVER THE COMPUTED ONE. A row that was raised carrying
 * `expiry_default` expires into what it promised the person who saw it, even if
 * the catalogue has moved since. Re-deriving from `tool_name` is the fallback for
 * rows raised before the column existed, and it is recorded as a derivation in
 * the row's own note rather than passed off as a declaration.
 *
 * THE PRECONDITION TRAVELS WITH THE WRITE, unchanged from the fix that put it
 * here. The select finds rows that were pending when it ran; an update filtered
 * by id alone overwrote anything that happened in between (a human approving, the
 * tool merging a pull request, executeApproval stamping 'executed') with
 * `status: 'expired'` and an error asserting no decision was made. That row then
 * told resume-runs the run was unblocked and told the resumed agent "Tool X was
 * NOT executed", and the agent merged the PR a second time. On supabaseAdmin, so
 * RLS narrowed nothing. Both halves of what the select established are now
 * repeated as WHERE clauses — including escalation_state, which the select no
 * longer pins to one value and so must be carried per row.
 *
 * The zero-row case is COUNTED rather than treated as success, because with
 * supabase-js the two are otherwise the same value: a refused or zero-row write
 * resolves as `{ data: null, error: null }`.
 */
export async function expireOverdueApprovals(
  db: SupabaseClient,
  nowIso: string,
  execute: ApprovalExecutor = defaultExecutor,
): Promise<{
  expired: number;
  proceeded: number;
  lost: number;
  derived: number;
  onFixtures: number;
  failures: string[];
}> {
  const { rows, declaredColumnPresent } = await readOverdue(db, nowIso);

  /* PROCEEDING SPENDS MONEY, SO IT MAY NOT HAPPEN ON A DEMO FIXTURE.
   *
   * Every one of the 38 stuck calls measured on 2026-08-22 belongs to a sample
   * workspace — not one is real customer work — so this is the whole population
   * of the first sweep, not an edge case. `ticks-do-not-run-on-sample-workspaces`
   * caught it the moment this file started importing an executor, which is
   * exactly what that guard is for: 89% of a day's AI spend once went on demo
   * fixtures, and the shape was always a tick that could reach a model without
   * asking whose workspace it was.
   *
   * A fixture's gate is CANCELLED rather than skipped. Skipping would leave it
   * pending forever, which is the queue this work exists to end; cancelling
   * clears it, spends nothing, and says on the row why it did not run.
   *
   * Read once per sweep, not per row. `sampleWorkspaceIds` answers [] on an
   * unreadable list, which for a selecting tick means "do the work" and here
   * means one tick's worth of fixture spend on reversible internal tools before
   * the next minute's tick gets the list. That is a bounded, self-correcting
   * direction; refusing to sweep at all is not. */
  const fixtures = new Set(rows.length > 0 ? await sampleWorkspaceIds(db as never) : []);

  let expired = 0;
  let proceeded = 0;
  let lost = 0;
  let derived = 0;
  let onFixtures = 0;
  const failures: string[] = [];
  for (const a of rows) {
    const declared = a.expiry_default === "proceed" || a.expiry_default === "cancel";
    const wanted: ExpiryDefault = declared
      ? (a.expiry_default as ExpiryDefault)
      : expiryDefaultFor(a.tool_name);
    if (!declared) derived++;
    const isFixture = wanted === "proceed" && !!a.workspace_id && fixtures.has(a.workspace_id);
    if (isFixture) onFixtures++;
    const onExpiry: ExpiryDefault = isFixture ? "cancel" : wanted;

    /* The note is built from what the call DECLARED, with the override stated as
     * an override. Writing it from the outcome instead produced a row that read
     * "declared default is to cancel because it can be undone" — the outcome's
     * verb attached to the declaration's reason, which is a sentence that argues
     * against itself. */
    const note =
      expiryNote(
        a.tool_name,
        wanted,
        a.expires_at,
        isFixture
          ? {
              actual: "cancel",
              because: "this is a sample workspace, and proceeding would spend on a demo fixture",
            }
          : undefined,
      ) +
      (declared
        ? ""
        : ` (Raised before this call could declare its own default${
            declaredColumnPresent ? "" : "; the expiry_default migration has not applied yet"
          }, so the default was read from the consequence catalogue at expiry.)`);

    if (onExpiry === "cancel") {
      const { data: written, error: upErr } = await db
        .from("agent_approvals")
        .update({
          escalation_state: "expired",
          escalated_at: nowIso,
          status: "expired",
          error: note,
        })
        .eq("id", a.id)
        .eq("status", "pending")
        .eq("escalation_state", a.escalation_state)
        .select("id");
      if (upErr) {
        failures.push(`${a.id}: ${upErr.message}`);
        continue;
      }
      if (!written || written.length === 0) {
        // Someone answered it between the read and here. Nothing went wrong.
        lost++;
        continue;
      }
      expired++;
      continue;
    }

    /* PROCEEDING IS A DECISION, SO IT IS TAKEN AS ONE. The same
     * compare-and-swap `claimApprovalDecision` uses, for the same reason: the
     * winner is the only caller allowed to run the tool, and a human deciding in
     * the same second must beat the sweeper rather than race it.
     *
     * `decided_by` STAYS NULL, deliberately. It is the column that means a person
     * pressed the button (trust-ledger reads it that way), and nobody did. A
     * timestamp with no hand behind it is exactly what happened, and writing our
     * own id there would put a decision in someone's name that they never made. */
    const { data: claimed, error: claimErr } = await db
      .from("agent_approvals")
      .update({
        status: "approved",
        escalation_state: "resolved",
        decided_at: nowIso,
        decision_reason: note,
      })
      .eq("id", a.id)
      .eq("status", "pending")
      .eq("escalation_state", a.escalation_state)
      .select("id");
    if (claimErr) {
      failures.push(`${a.id}: ${claimErr.message}`);
      continue;
    }
    if (!claimed || claimed.length === 0) {
      lost++;
      continue;
    }

    /* The tool runs AFTER the claim, and a failure here leaves the row at
     * 'approved' with the reason recorded — which is where a crashed
     * executeApproval has always left a row, and is the honest state: the call
     * was allowed, and the run of it did not finish. executeApproval takes its
     * own execution claim, so winning the decision above is not mistaken for
     * permission to run twice. */
    try {
      await execute(db, a.user_id, a.id);
      proceeded++;
    } catch (e) {
      proceeded++;
      failures.push(`${a.id}: proceeded but the tool failed (${asMessage(e)})`);
    }
  }
  return { expired, proceeded, lost, derived, onFixtures, failures };
}

const asMessage = (e: unknown): string => (e instanceof Error ? e.message : String(e));

/**
 * One email per gate about to expire, in the last hour before it does.
 *
 * CLAIM FIRST, THEN SEND. The old order was send, then stamp
 * `expiry_notified_at` filtered by id with no `.is(..., null)` guard, on a
 * sequential batch of 100. So roughly ninety-nine email round trips separated
 * row 100's read from its stamp, and the next minute's tick re-read the
 * un-stamped tail and mailed the same person again. Claiming first inverts the
 * failure: at worst one email is lost to a worker eviction, instead of a
 * customer being mailed the same warning every minute.
 *
 * AND THE SEND'S ANSWER IS READ. dispatchInstantEmail returns { sent: false }
 * WITHOUT throwing when Resend answers 429 or 500, so the discarded return
 * value meant a rate-limited send was recorded as delivered and never retried:
 * the one email a person gets before their gate expires, silently dropped. A
 * send that did not happen hands the claim back so the next tick, still inside
 * the warning window, can try again.
 */
export async function notifyExpiringApprovals(
  db: SupabaseClient,
  nowIso: string,
  send: InstantEmailSender = dispatchInstantEmail as unknown as InstantEmailSender,
): Promise<{ notified: number; lost: number; failures: string[] }> {
  const soonIso = new Date(Date.parse(nowIso) + EXPIRY_WARNING_MINUTES * 60 * 1000).toISOString();
  const { data: expiringSoon } = await db
    .from("agent_approvals")
    .select("id,agent_slug,tool_name,rationale,user_id,expires_at")
    .eq("escalation_state", "pending")
    .eq("status", "pending")
    .not("expires_at", "is", null)
    .gt("expires_at", nowIso)
    .lte("expires_at", soonIso)
    .is("expiry_notified_at", null)
    .limit(100);

  let notified = 0;
  let lost = 0;
  const failures: string[] = [];
  for (const a of (expiringSoon ?? []) as {
    id: string;
    agent_slug: string;
    tool_name: string;
    rationale: string | null;
    user_id: string;
    expires_at: string;
  }[]) {
    // expiry_notified_at predates the generated Supabase types (not yet
    // regenerated against the live schema); same eslint-disabled `as any`
    // escape hatch derive-tick.ts already uses for this exact situation.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mailer = db as any;
    const { data: claimed, error: claimErr } = await mailer
      .from("agent_approvals")
      .update({ expiry_notified_at: nowIso })
      .eq("id", a.id)
      .is("expiry_notified_at", null)
      .select("id");
    if (claimErr) {
      failures.push(`${a.id}: claim ${claimErr.message}`);
      continue;
    }
    if (!claimed || claimed.length === 0) {
      // Another tick is already mailing this one. Not an error, and not a send.
      lost++;
      continue;
    }

    let outcome: { sent: boolean; reason: string };
    try {
      outcome = await send(db, a.user_id, {
        kind: "approval",
        severity: "action",
        title: `Approval expiring soon: ${a.tool_name}`,
        detail: a.rationale ?? `${a.agent_slug} is waiting on your decision before it expires.`,
      });
    } catch (e) {
      outcome = { sent: false, reason: e instanceof Error ? e.message : String(e) };
    }
    if (outcome.sent) {
      notified++;
      continue;
    }

    failures.push(`${a.id}: not sent (${outcome.reason})`);
    // Hand the claim back, guarded on our own stamp so a release can never
    // clear a delivery some other tick has since recorded.
    const { error: relErr } = await mailer
      .from("agent_approvals")
      .update({ expiry_notified_at: null })
      .eq("id", a.id)
      .eq("expiry_notified_at", nowIso);
    if (relErr) failures.push(`${a.id}: release ${relErr.message}`);
  }
  return { notified, lost, failures };
}

/**
 * Clear the Needs-You flag left on calls that have already been decided.
 *
 * Same shape as the expiry sweep and the same fix: the decision to clear the
 * flag is made from a row read earlier, so the write carries the exact status
 * and flag it was made against. The row this protects is the one
 * `extendApprovalTtl` revives: a call put back on the clock is pending and
 * genuinely undecided again, and clearing its escalation flag would delete a
 * live gate from every surface a person looks at while leaving it live in the
 * database.
 */
export async function resolveStaleEscalations(
  db: SupabaseClient,
): Promise<{ resolved: number; lost: number; failures: string[] }> {
  const { data: flagged } = await db
    .from("agent_approvals")
    .select("id,status,escalation_state,decided_at")
    .in("escalation_state", ["pending", "expired"])
    .neq("status", "pending")
    .limit(500);

  let resolved = 0;
  let lost = 0;
  const failures: string[] = [];
  for (const a of (flagged ?? []) as {
    id: string;
    status: string;
    escalation_state: string;
    decided_at: string | null;
  }[]) {
    if (
      !needsEscalationResolve({
        status: a.status,
        escalationState: a.escalation_state,
        decidedAt: a.decided_at,
      })
    )
      continue;
    const { data: written, error: rErr } = await db
      .from("agent_approvals")
      .update({ escalation_state: "resolved" })
      .eq("id", a.id)
      // The two values `needsEscalationResolve` was asked about. If either has
      // moved, the answer it gave is about a row that no longer exists.
      .eq("status", a.status)
      .eq("escalation_state", a.escalation_state)
      .select("id");
    if (rErr) {
      failures.push(`${a.id}: ${rErr.message}`);
      continue;
    }
    if (!written || written.length === 0) {
      lost++;
      continue;
    }
    resolved++;
  }
  return { resolved, lost, failures };
}

/**
 * Approvals tick — resolves pending agent_approvals whose `expires_at` has
 * passed, each into the default it declared when it was raised: a reversible
 * internal call goes ahead unasked, everything else is cancelled unrun. Designed
 * to be called by pg_cron once per minute.
 *
 * FS-03: also fires the one instant-email trigger reserved for "expiring
 * gates" — a pending approval within EXPIRY_WARNING_MINUTES of its own
 * expiry gets a single email (expiry_notified_at dedups so it fires once,
 * not every minute of that final hour).
 *
 * BLD-GATE-SYNC: also reconciles stale escalation flags — an approval that
 * reached a decided/terminal status (failed/executed/denied/cancelled/
 * approved, or any row with `decided_at` set) but was left
 * `escalation_state` 'pending'/'expired' is a phantom in every Needs-You
 * surface (today/governance read `escalation_state`, not `status`). Clear it
 * to 'resolved' so the operator's list only shows genuinely-undecided gates.
 */
export const Route = createFileRoute("/api/public/hooks/approvals-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireHookCaller(request);
        if (unauth) return unauth;
        return withJobRun("cron.approvals-tick", async () => {
          try {
            const nowIso = new Date().toISOString();
            const db = supabaseAdmin as unknown as SupabaseClient;
            const expiry = await expireOverdueApprovals(db, nowIso);
            const mail = await notifyExpiringApprovals(db, nowIso);
            const escalation = await resolveStaleEscalations(db);

            return new Response(
              JSON.stringify({
                ok: true,
                expired: expiry.expired,
                proceeded: expiry.proceeded,
                // Rows too old to carry their own declaration. Reported so the
                // number visibly falls to zero as the backlog drains, rather
                // than the fallback becoming permanent and unnoticed.
                derived: expiry.derived,
                // Calls that would have proceeded and were cancelled instead because
                // they belong to a demo workspace. Nonzero here is not a fault;
                // it is the fixture backlog draining without spending.
                onFixtures: expiry.onFixtures,
                resolved: escalation.resolved,
                notified: mail.notified,
                lost: expiry.lost + mail.lost + escalation.lost,
                failures: [...expiry.failures, ...mail.failures, ...escalation.failures],
              }),
              { headers: { "Content-Type": "application/json" } },
            );
          } catch (e) {
            return new Response(
              JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }),
              { status: 500, headers: { "Content-Type": "application/json" } },
            );
          }
        });
      },
    },
  },
});
