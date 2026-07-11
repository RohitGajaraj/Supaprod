// RPT-17: the NAMED per-agent trust ladder — a pure labeling layer over the
// arc the engine already computes and stores (agent_autonomy.arc, dialed by
// setAgentArc in trust.functions.ts, composed with each tool's own mode via
// resolveApprovalMode in ai/trust.server.ts). No new data model: the four
// Arc values ARE the four rungs, this file just gives them the names a human
// reads on the ladder instead of the internal enum word.
//
// Honest note on "never vendor-relaxed": the ladder's TOP rung (ambient /
// Autonomous) is never set by auto_advance_agent_arc (the pre-existing SW-4
// background nudge only ever promotes observing -> proving -> trusted on a
// clean streak, per its own guard `current_arc NOT IN ('observing','proving')`
// returning early otherwise — see supabase/migrations/20260708150000_founder_
// autonomy_defaults.sql). Reaching Autonomous is always an explicit human
// click through setAgentArc; that click is this ladder's "one promotion
// moment", not something a background job can produce.
import type { Arc } from "@/lib/ai/trust.server";

export type { Arc };

/** The four rungs, floor to ceiling — the same order as the Arc enum. */
export const TRUST_LADDER_ORDER: readonly Arc[] = [
  "observing",
  "proving",
  "trusted",
  "ambient",
] as const;

/** The name a human sees for each rung. The Arc value underneath never
 *  changes — this is presentation only. */
export const TRUST_LADDER_LABEL: Record<Arc, string> = {
  observing: "Supervised",
  proving: "Reviewed",
  trusted: "Trusted",
  ambient: "Autonomous",
};

/** The named chain, for headers/copy that want to show the whole ladder at
 *  once (e.g. "Supervised -> Reviewed -> Trusted -> Autonomous"). */
export const TRUST_LADDER_CHAIN = TRUST_LADDER_ORDER.map((a) => TRUST_LADDER_LABEL[a]).join(" → ");

/** PURE. The named label for one arc, falling back to the raw value for any
 *  arc this map has not been told about (keeps this forward-compatible with
 *  a future Arc addition rather than throwing). */
export function ladderLabel(arc: Arc): string {
  return TRUST_LADDER_LABEL[arc] ?? arc;
}

/** 0-based rung index, floor (Supervised) = 0. */
export function ladderIndex(arc: Arc): number {
  const i = TRUST_LADDER_ORDER.indexOf(arc);
  return i < 0 ? 0 : i;
}
