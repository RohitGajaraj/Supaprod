import { createFileRoute } from "@tanstack/react-router";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { needsEscalationResolve } from "@/lib/reliability/gate-state";
import { withJobRun } from "@/lib/observability";
import { dispatchInstantEmail } from "@/lib/notifications.functions";

const EXPIRY_WARNING_MINUTES = 60;

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
            const { data: stale, error } = await supabaseAdmin
              .from("agent_approvals")
              .select("id,trace_id,tool_name,status,escalation_state,expires_at,user_id")
              .lt("expires_at", nowIso)
              .eq("escalation_state", "pending")
              .in("status", ["pending"])
              .limit(500);
            if (error) throw error;

            let expired = 0;
            for (const a of stale ?? []) {
              const { error: upErr } = await supabaseAdmin
                .from("agent_approvals")
                .update({
                  escalation_state: "expired",
                  escalated_at: nowIso,
                  status: "expired",
                  error: `Auto-expired after TTL (no decision before ${a.expires_at}).`,
                })
                .eq("id", a.id);
              if (upErr) {
                console.error("approval expire failed:", upErr);
                continue;
              }
              expired++;
            }

            // FS-03: expiring-gate instant email. Narrow window (not yet expired, but
            // close), never notified before. One email, not a spam loop.
            let notified = 0;
            const soonIso = new Date(Date.now() + EXPIRY_WARNING_MINUTES * 60 * 1000).toISOString();
            const { data: expiringSoon } = await supabaseAdmin
              .from("agent_approvals")
              .select("id,agent_slug,tool_name,rationale,user_id,expires_at")
              .eq("escalation_state", "pending")
              .eq("status", "pending")
              .not("expires_at", "is", null)
              .gt("expires_at", nowIso)
              .lte("expires_at", soonIso)
              .is("expiry_notified_at", null)
              .limit(100);
            for (const a of (expiringSoon ?? []) as {
              id: string;
              agent_slug: string;
              tool_name: string;
              rationale: string | null;
              user_id: string;
              expires_at: string;
            }[]) {
              try {
                await dispatchInstantEmail(supabaseAdmin, a.user_id, {
                  kind: "approval",
                  severity: "action",
                  title: `Approval expiring soon: ${a.tool_name}`,
                  detail:
                    a.rationale ??
                    `${a.agent_slug} is waiting on your decision before it expires.`,
                });
              } catch (e) {
                console.error("expiring-gate email failed (non-fatal):", e);
              }
              // expiry_notified_at predates the generated Supabase types (not yet
              // regenerated against the live schema); same eslint-disabled `as any`
              // escape hatch derive-tick.ts already uses for this exact situation.
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await (supabaseAdmin as any)
                .from("agent_approvals")
                .update({ expiry_notified_at: nowIso })
                .eq("id", a.id);
              notified++;
            }

            // BLD-GATE-SYNC: clear stale escalation flags on already-decided approvals so they
            // stop haunting the Needs-You surfaces. `needsEscalationResolve` is the source of
            // truth; the DB filter just narrows candidates (a genuinely-pending gate has
            // status='pending' and is excluded). Auto-expired rows (status='expired') are left
            // alone — the function returns false for them.
            let resolved = 0;
            const { data: flagged } = await supabaseAdmin
              .from("agent_approvals")
              .select("id,status,escalation_state,decided_at")
              .in("escalation_state", ["pending", "expired"])
              .neq("status", "pending")
              .limit(500);
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
              const { error: rErr } = await supabaseAdmin
                .from("agent_approvals")
                .update({ escalation_state: "resolved" })
                .eq("id", a.id);
              if (rErr) {
                console.error("escalation reconcile failed:", rErr);
                continue;
              }
              resolved++;
            }

            return new Response(JSON.stringify({ ok: true, expired, resolved, notified }), {
              headers: { "Content-Type": "application/json" },
            });
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
