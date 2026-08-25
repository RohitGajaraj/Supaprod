import { createFileRoute } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireHookCaller } from "./-_auth.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  withJobRunHttp,
  isMissingDatabaseObject,
  type PostgrestLikeError,
} from "@/lib/observability";

/**
 * memory-tick — F-AGENT-2.
 *
 * Decay low-importance, stale agent memories so recallMemory() doesn't
 * eventually drown in noise. Rule:
 *   importance <= 2  AND  COALESCE(last_used_at, created_at) < now() - 30d
 * is deleted. We never touch high-importance reflections (>=3) or recently
 * used memories regardless of importance.
 *
 * Poked by pg_cron (daily). Idempotent — repeating it is a no-op.
 */
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** Why the expiry pass deleted nothing, when it did not run at all. */
export type ExpirySkipReason = "expiry-disabled" | "pending-migration" | "flag-unreadable";

export type MemorySweepResult = {
  /** Low-importance stale rows removed by the decay passes (ungated hygiene). */
  decayed: number;
  /** Rows removed because their plan-based retention window passed (gated). */
  expired: number;
  /**
   * null = the expiry pass ran. Otherwise the stated reason it did not, carried
   * into the tick's JSON so a skipped purge is SAID, never silent: a founder
   * reading `{ expired: 0 }` alone cannot tell "the gate is off" from "the
   * sweep found nothing", and those lead to opposite actions.
   */
  expirySkipped: ExpirySkipReason | null;
  errors: string[];
};

/**
 * The whole sweep, injectable for tests (same shape as approvals-tick's
 * exported passes). `nowMs` pins the clock so cutoffs are deterministic.
 *
 * THE EXPIRY PASS CONSULTS `memory_expiry_enabled()` FIRST (Queue 61 / F-53).
 * It used to delete every row with a past `expires_at` unconditionally, which
 * looked safe — while the flag is off the trigger stamps nothing, so there is
 * nothing to delete — but wired the admin switch to the label instead of the
 * machine: rows stamped during an ON period kept being deleted after the
 * founder turned the switch OFF, while the settings page said "Nothing the
 * machine learns for a free-tier user ever fades." Every artifact of record
 * says the flag governs enforcement, not just stamping: migration
 * 20260616210000 ("the recall filter + the memory-tick sweep are automatic
 * no-ops" while false), migration 20260810160120 ("the trigger is INERT
 * today"), and the G1.1 BLOCKER test in entitlements.test.ts (turning it on
 * without founder approval "would silently start deleting"). So:
 *
 *   - flag true          → today's behaviour, delete expired rows;
 *   - flag false         → skip, and say "expiry-disabled";
 *   - flag not built yet → skip, and say "pending-migration" (the honest skip:
 *                          the same migration family creates `expires_at`, so
 *                          there is nothing stamped to sweep);
 *   - flag unreadable    → skip AND report the error. Deleting on an unknown
 *                          flag would be deleting on a guess, and the guess is
 *                          irreversible; but a sweep that quietly stops because
 *                          its gate stopped answering is the retention-tick
 *                          incident again, so the failure must reach job_runs.
 */
export async function sweepAgentMemory(
  db: SupabaseClient,
  nowMs: number,
): Promise<MemorySweepResult> {
  const cutoff = new Date(nowMs - THIRTY_DAYS_MS).toISOString();

  // Two passes: delete by last_used_at when present, else by created_at.
  // Splitting the predicate avoids a COALESCE that can't use the index.
  // Deliberately NOT behind the expiry flag: decay is noise hygiene for
  // recallMemory(), not the monetization expiry the flag governs.
  const usedRes = await db
    .from("agent_memory")
    .delete({ count: "exact" })
    .lte("importance", 2)
    .not("last_used_at", "is", null)
    .lt("last_used_at", cutoff);

  const unusedRes = await db
    .from("agent_memory")
    .delete({ count: "exact" })
    .lte("importance", 2)
    .is("last_used_at", null)
    .lt("created_at", cutoff);

  // M-C: hard-delete memory whose plan-based retention window has passed —
  // only while the founder's expiry gate reads true. `=== true` on purpose:
  // anything else the RPC could answer must read as "not enabled".
  const gate = await db.rpc("memory_expiry_enabled");

  let expired = 0;
  let expirySkipped: ExpirySkipReason | null = null;
  let expiryError: PostgrestLikeError = null;
  if (gate.error) {
    expirySkipped = isMissingDatabaseObject(gate.error) ? "pending-migration" : "flag-unreadable";
    if (expirySkipped === "flag-unreadable") expiryError = gate.error;
  } else if (gate.data !== true) {
    expirySkipped = "expiry-disabled";
  } else {
    // Free-tier rows carry expires_at (stamped on insert by the gated
    // trigger); pro/team rows carry NULL and are never swept. Pre-migration
    // tolerant: if the column does not exist yet, the missing-column error is
    // ignored (counts as 0).
    const expiredRes = await db
      .from("agent_memory")
      .delete({ count: "exact" })
      .not("expires_at", "is", null)
      .lt("expires_at", new Date(nowMs).toISOString());
    expired = expiredRes.error ? 0 : (expiredRes.count ?? 0);
    expiryError = expiredRes.error;
  }

  const decayed = (usedRes.count ?? 0) + (unusedRes.count ?? 0);
  const errors = [usedRes.error, unusedRes.error, expiryError]
    .filter((e): e is NonNullable<PostgrestLikeError> => Boolean(e && !isMissingDatabaseObject(e)))
    .map((e) => e.message ?? String(e));

  return { decayed, expired, expirySkipped, errors };
}

export const Route = createFileRoute("/api/public/hooks/memory-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauth = await requireHookCaller(request);
        if (unauth) return unauth;
        return withJobRunHttp("cron.memory-tick", async () => {
          const { decayed, expired, expirySkipped, errors } = await sweepAgentMemory(
            supabaseAdmin as unknown as SupabaseClient,
            Date.now(),
          );

          // THROWN, not answered with a 500 from inside the wrapper. This tick
          // already knew how to tell a real failure from a pre-migration one and
          // set status 500 for the real ones -- and every one of those 500s was
          // written into job_runs as status='ok', because returning a Response
          // resolves. A decay pass refused by RLS could run nightly forever while
          // agent_memory grew without bound and the ledger stayed green.
          //
          // The counts ride along in the message so nothing the old JSON body
          // carried is lost: the ledger row names what was purged before it
          // failed, not just that it failed.
          if (errors.length > 0) {
            throw new Error(
              `agent_memory sweep failed after decayed=${decayed} expired=${expired}` +
                `${expirySkipped ? ` expirySkipped=${expirySkipped}` : ""}: ${errors.join("; ")}`,
            );
          }

          return new Response(
            JSON.stringify({ ok: true, decayed, expired, expirySkipped, errors: [] }),
            { headers: { "Content-Type": "application/json" } },
          );
        });
      },
    },
  },
});
