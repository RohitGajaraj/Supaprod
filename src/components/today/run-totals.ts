import type { StudioSessionListItem } from "@/lib/studio.functions";

/**
 * THE FACTS `/runs` CARRIED THAT NO OTHER SURFACE DOES.
 *
 * ── WHY THIS EXISTS ────────────────────────────────────────────────────────
 * `/runs` folds into the board (S0's ruling A-005), and the rule the whole
 * sequencing exists to enforce is that **the fold removes a door, not a
 * capability**. So before the redirect flips, every fact only `/runs` showed has
 * to land somewhere. Its footer carried four, and the board carries none of
 * them: checked 2026-08-27, `_authenticated.today.tsx` contains no spend figure
 * at all.
 *
 * This is the derivation half. It is pure and it is deliberately separate from
 * any placement decision, because where these belong on the board is a design
 * question and this is arithmetic.
 *
 * ── EVERY FIELD, AND WHO WRITES IT ─────────────────────────────────────────
 * My brief's rule is that a number without its query is not evidence, so:
 *
 *   `cost_usd`        per session, AGGREGATED BY `listStudioSessions`, not a
 *                     column. `agent_runs` has no `cost_usd` at all, verified
 *                     against the live schema (42703, column does not exist).
 *                     Anyone who tries to re-derive this straight from
 *                     `agent_runs` will get an error, not a wrong number, which
 *                     is the good outcome.
 *   `changeset.status` per session, `"merged"` is the shipped state.
 *   `spend_used_usd`  per TRACK on `spine_tracks`. Measured 2026-08-27: $3.4734
 *                     across 37 of 47 visible tracks.
 *
 * **Sessions and tracks are two engines and their spend is NOT added together
 * here.** A mission dispatched to studio and a track walking the seven stations
 * are different objects, C2-003 established that `/start` creates a track and no
 * mission, and summing them would invent a total nobody can check against either
 * source. They are returned side by side and the surface may say both.
 *
 * ── WHY MONEY IS RETURNED AS A NUMBER AND NOT A STRING ─────────────────────
 * Formatting is the caller's, because the board and a footer round differently
 * and a shared formatter would force one of them to be wrong. What this file
 * guarantees is that the number is a sum of values that exist, with missing
 * costs treated as absent rather than as zero spend.
 */

/** A session as this module reads it. Narrow on purpose. */
type SessionLike = Pick<StudioSessionListItem, "cost_usd" | "changeset" | "status">;

/** A track as this module reads it. */
interface TrackLike {
  spend_used_usd?: number | null;
}

export interface RunTotals {
  /** Sessions whose changeset reached `merged`. The one checkable claim. */
  shipped: number;
  /** Sum of session `cost_usd`. Null when NO session reported one. */
  sessionSpendUsd: number | null;
  /** Sum of track `spend_used_usd`. Null when no track reported one. */
  trackSpendUsd: number | null;
  /** How many sessions reported no cost, so a total can say what it omits. */
  sessionsWithoutCost: number;
}

/** Finite and non-negative, or it is not a cost. Guards NaN and a bad payload. */
function usable(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0;
}

/**
 * Totals over the two reads the board ALREADY makes, so this costs no request.
 *
 * NULL RATHER THAN ZERO when nothing reported a cost, and the difference is the
 * point: "$0.00 spent" is a claim that work was free, and "no cost reported" is
 * a statement about our knowledge. A surface that prints the first when it means
 * the second is the failure this repo keeps paying for.
 */
export function runTotals(
  sessions: readonly SessionLike[] | undefined,
  tracks: readonly TrackLike[] | undefined,
): RunTotals {
  const s = sessions ?? [];
  const t = tracks ?? [];

  const costs = s.map((x) => x.cost_usd).filter(usable);
  const trackCosts = t.map((x) => x.spend_used_usd).filter(usable);

  return {
    shipped: s.filter((x) => x.changeset?.status === "merged").length,
    sessionSpendUsd: costs.length > 0 ? costs.reduce((a, b) => a + b, 0) : null,
    trackSpendUsd: trackCosts.length > 0 ? trackCosts.reduce((a, b) => a + b, 0) : null,
    sessionsWithoutCost: s.length - costs.length,
  };
}

/**
 * Money, in the words a person uses.
 *
 * Under a cent is "under $0.01" rather than "$0.00", because a run that cost
 * something must never round to a claim that it cost nothing.
 */
export function spendWords(usd: number | null): string | null {
  if (usd === null) return null;
  if (usd > 0 && usd < 0.01) return "under $0.01";
  return `$${usd.toFixed(2)}`;
}
