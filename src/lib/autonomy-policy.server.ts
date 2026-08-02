/**
 * Reading a workspace's autonomy policy, and never failing louder than it must.
 *
 * The rule is in ./autonomy-policy.ts and is pure. This is the one read, shared
 * by the two sweeps that act on it (the cluster tick, which promotes, and the
 * outcome review, which settles) and by the boundary surface that sets it.
 *
 * PRE-MIGRATION TOLERANCE IS NOT OPTIONAL HERE. Migrations are committed in this
 * repo and applied on publish, so there is a real window where the code is live
 * and the columns are not. A read that threw in that window would stop the
 * cluster tick and the outcome sweep outright, which is a far worse outcome than
 * running on the numbers the product already shipped with. So a failed read
 * returns nothing and every caller falls back to `SHIPPED_AUTONOMY_POLICY`,
 * which is exactly today's behaviour.
 *
 * It still says so out loud. A silent fallback is how a policy that was set and
 * never applied looks identical to one nobody set, and this codebase has spent
 * a day removing exactly that shape, so the failure reaches the log with the
 * reason attached.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  resolveAutonomyPolicy,
  SHIPPED_AUTONOMY_POLICY,
  type AutonomyPolicy,
  type AutonomyPolicyRow,
} from "./autonomy-policy";

/** Every policy column, plus the id the rows are keyed back by. */
export const AUTONOMY_SELECT =
  "id,promotion_min_frequency,promotion_min_severity,promotion_min_confidence,settle_evidence_floor,settle_stakes_span,never_settle_above_impact";

type Row = AutonomyPolicyRow & { id: string };

/**
 * One workspace's policy. A null id, an unreadable row or a column that does not
 * exist yet all resolve to what the product ships with.
 */
export async function loadAutonomyPolicy(
  db: SupabaseClient,
  workspaceId: string | null | undefined,
): Promise<AutonomyPolicy> {
  if (!workspaceId) return SHIPPED_AUTONOMY_POLICY;
  const found = await loadAutonomyPolicies(db, [workspaceId]);
  return found.get(workspaceId) ?? SHIPPED_AUTONOMY_POLICY;
}

/**
 * Several at once, for a sweep that walks many workspaces in one tick. Only the
 * workspaces that answered appear in the map; a caller reads a miss as "the
 * shipped default", which is the same answer a missing row means.
 */
export async function loadAutonomyPolicies(
  db: SupabaseClient,
  workspaceIds: Array<string | null | undefined>,
): Promise<Map<string, AutonomyPolicy>> {
  const out = new Map<string, AutonomyPolicy>();
  const ids = [...new Set(workspaceIds.filter((v): v is string => !!v))];
  if (ids.length === 0) return out;

  const { data, error } = await db.from("workspaces").select(AUTONOMY_SELECT).in("id", ids);
  if (error) {
    console.error(
      `autonomy-policy: could not read the workspace policy, running on the shipped defaults: ${error.message}`,
    );
    return out;
  }

  for (const row of (data ?? []) as Row[]) {
    if (!row?.id) continue;
    out.set(row.id, resolveAutonomyPolicy(row));
  }
  return out;
}
