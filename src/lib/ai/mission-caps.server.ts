/**
 * The ceiling a mission inherits when nobody set one.
 *
 * WHY THIS EXISTS. `mission_spend_cap_usd` was enforced fail-closed in
 * `checkMissionCaps` from the day it was written, and it never stopped
 * anything, because every writer passed `?? null`: `handoff.server.ts:419`,
 * `loop.server.ts:491` and `loop.server.ts:523`. The enforcement was real; the
 * value was always absent. A ceiling nobody sets is not a ceiling.
 *
 * The founder's governance canon names this "the one indefensible default" and
 * says why it matters more than it looks: the product's whole argument is that
 * agents should run without asking permission for every step, and *arguing for
 * more autonomy without a ceiling is the one version of that a risk officer
 * will refuse.* So the cap is not a brake on the autonomy story. It is what
 * makes the autonomy story sayable.
 *
 * THE FAIL DIRECTION IS THE WHOLE DESIGN. If the workspace read fails, this
 * returns the built-in default rather than `null`. `null` means "no ceiling",
 * so falling back to `null` on an error would mean a database hiccup silently
 * removes the spending limit, which is exactly backwards for a safety control.
 * An unreadable workspace gets the conservative number, and the run continues.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Dollars one mission may spend across ALL of its runs before the loop halts.
 *
 * Deliberately generous. Observed single runs cost well under a dollar, so this
 * is roughly an order of magnitude of headroom: it stops a runaway loop and
 * should never interrupt real work. It is also a default the user never chose,
 * which by the governance canon's fourth floor makes it our decision rather
 * than their policy, so it must stay visible and changeable rather than quietly
 * correct.
 */
export const DEFAULT_MISSION_SPEND_CAP_USD = 10.0;

/**
 * The spend ceiling for a run about to be created.
 *
 * `explicit` wins when a dispatcher genuinely chose a number, including when it
 * chose `null` to mean "no ceiling on this one". That distinction is why the
 * parameter is `number | null | undefined` and not `number | null`: `undefined`
 * is "nobody said", `null` is "somebody said none".
 */
export async function resolveMissionSpendCap(
  supabase: SupabaseClient,
  workspaceId: string | null | undefined,
  explicit: number | null | undefined,
): Promise<number | null> {
  if (explicit !== undefined) return explicit;
  if (!workspaceId) return DEFAULT_MISSION_SPEND_CAP_USD;

  try {
    const { data, error } = await supabase
      .from("workspaces")
      .select("default_mission_spend_cap_usd")
      .eq("id", workspaceId)
      .maybeSingle();

    // A failed read must not read as "no ceiling". See THE FAIL DIRECTION above.
    if (error || !data) return DEFAULT_MISSION_SPEND_CAP_USD;

    const raw = (data as { default_mission_spend_cap_usd: number | string | null })
      .default_mission_spend_cap_usd;

    // A workspace that has deliberately cleared its ceiling gets no ceiling.
    // That is a human decision on the record, not an accident, so it is obeyed.
    if (raw === null) return null;

    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_MISSION_SPEND_CAP_USD;
  } catch {
    return DEFAULT_MISSION_SPEND_CAP_USD;
  }
}
