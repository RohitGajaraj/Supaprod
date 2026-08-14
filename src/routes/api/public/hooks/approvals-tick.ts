import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { needsEscalationResolve } from "@/lib/reliability/gate-state";
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
 * Expire calls nobody answered before their clock ran out.
 *
 * THE PRECONDITION TRAVELS WITH THE WRITE, and that is the whole fix. The
 * select below finds rows that were pending when it ran; the update used to be
 * filtered by id alone, so anything that happened in between (a human
 * approving, the tool merging a pull request, executeApproval stamping
 * 'executed') was overwritten with `status: 'expired'` and an error message
 * asserting no decision was made. That row then told resume-runs the run was
 * unblocked and told the resumed agent "Tool X was NOT executed", and the agent
 * merged the PR a second time. On supabaseAdmin, so RLS narrowed nothing.
 *
 * The zero-row case is COUNTED rather than treated as success, because with
 * supabase-js the two are otherwise the same value: a refused or zero-row write
 * resolves as `{ data: null, error: null }`.
 */
export async function expireOverdueApprovals(
  db: SupabaseClient,
  nowIso: string,
): Promise<{ expired: number; lost: number; failures: string[] }> {
  const { data: stale, error } = await db
    .from("agent_approvals")
    .select("id,trace_id,tool_name,status,escalation_state,expires_at,user_id")
    .lt("expires_at", nowIso)
    .eq("escalation_state", "pending")
    .in("status", ["pending"])
    .limit(500);
  if (error) throw error;

  let expired = 0;
  let lost = 0;
  const failures: string[] = [];
  for (const a of (stale ?? []) as { id: string; expires_at: string }[]) {
    const { data: written, error: upErr } = await db
      .from("agent_approvals")
      .update({
        escalation_state: "expired",
        escalated_at: nowIso,
        status: "expired",
        error: `Auto-expired after TTL (no decision before ${a.expires_at}).`,
      })
      .eq("id", a.id)
      // Both halves of what the select established. Either one moving means
      // this row is no longer an unanswered call and must not be stamped as one.
      .eq("status", "pending")
      .eq("escalation_state", "pending")
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
  }
  return { expired, lost, failures };
}

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
 * Approvals tick — flips pending agent_approvals whose `expires_at` has
 * passed to `escalation_state='expired'` and marks the parent run halted
 * if applicable. Designed to be called by pg_cron once per minute.
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
