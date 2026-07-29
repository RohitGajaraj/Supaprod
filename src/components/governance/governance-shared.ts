/**
 * Governance panel shared utilities and pure functions.
 * These are extracted from ApprovalsPanel to enable unit testing and reuse
 * across multiple governance surfaces.
 *
 * PORTED 2026-07-29. The tone maps used to hand back raw CSS variables from the
 * retired palette (`var(--moss)`, `var(--madder)`, `var(--marigold)`), which is
 * how a panel ends up drawing its own colour instead of asking a primitive for
 * one. They now hand back the `Value` tone vocabulary from
 * `src/components/shell/primitives.tsx`, so the stylesheet owns every mix and a
 * governance surface owns none.
 */

/** The `Value` primitive's tone vocabulary. A governance fact is quiet unless
 *  it is itself an outcome, which is the one case where colour carries
 *  information rather than decorating one. */
export type GovTone = "quiet" | "pass" | "warn" | "fail";

/**
 * Formats milliseconds as a relative expiry string: "expires in 2h" or "expired 3h ago".
 * Used for displaying approval TTLs in human-readable format.
 *
 * @param iso - ISO timestamp string of when something expires, or null
 * @returns Object with text and expired flag, or null if no timestamp provided
 */
export function relExpiry(iso: string | null): { text: string; expired: boolean } | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(ms);
  const m = Math.max(1, Math.round(abs / 60_000));
  const h = Math.round(abs / 3_600_000);
  const d = Math.round(abs / 86_400_000);
  const v = d >= 1 ? `${d}d` : h >= 1 ? `${h}h` : `${m}m`;
  return ms >= 0
    ? { text: `expires in ${v}`, expired: false }
    : { text: `expired ${v} ago`, expired: true };
}

/**
 * Formats milliseconds as median response time string: "<1m", "15m", or "2h".
 * Used for displaying the median approval response time in the panel header.
 *
 * Rules:
 * - Under 1 minute rounds up to "<1m" (never "0m")
 * - 1-90 minutes displays in minutes
 * - 90+ minutes displays in hours
 *
 * @param ms - Time in milliseconds
 * @returns Formatted string like "15m" or "2h"
 */
export function fmtMedian(ms: number): string {
  const m = Math.round(ms / 60_000);
  if (m < 1) return "<1m";
  if (m < 90) return `${m}m`;
  return `${Math.round(ms / 3_600_000)}h`;
}

/**
 * Semantic display for resolved approval statuses.
 * Maps approval outcomes to human-readable text + color for display.
 *
 * Status meanings:
 * - approved/executed: gate was approved and tool ran successfully
 * - rejected: human declined the request; nothing ran
 * - failed: approval executed but the tool hit an error
 * - cancelled/expired: approval was invalidated before decision
 */
export const RESOLVED_LINE: Record<string, { text: string; tone: GovTone } | undefined> = {
  approved: { text: "approved, the agent resumed", tone: "pass" },
  executed: { text: "approved, the agent resumed", tone: "pass" },
  rejected: { text: "rejected, nothing ran", tone: "quiet" },
  failed: { text: "failed, the tool errored", tone: "fail" },
  cancelled: { text: "cancelled, nothing ran", tone: "quiet" },
  expired: { text: "expired, nothing ran", tone: "quiet" },
};

/**
 * Risk level to the `Value` tone vocabulary.
 *
 * Mapping:
 * - low: pass (safe, and undoable from inside the product)
 * - medium: warn (it reaches outside, and it can be walked back)
 * - high: fail (hard to walk back)
 *
 * Unknown risk levels default to warn, which is the conservative read.
 */
export const RISK_TONE: Record<string, GovTone> = {
  low: "pass",
  medium: "warn",
  high: "fail",
};

/**
 * Gets the tone for a risk level, with safe default.
 * @param risk - Risk level string ("low", "medium", "high", or unknown)
 * @returns a `Value` tone
 */
export function toneForRisk(risk: string): GovTone {
  return RISK_TONE[risk] ?? "warn";
}

/** What the risk level would actually touch, in plain words. Second-line
 *  information, never a restatement of the word the chip beside it shows.
 *  Same vocabulary as the Crew surface, so a risk reads the same in both. */
export const RISK_NOTE: Record<string, string> = {
  low: "Stays in this workspace, and you can undo it.",
  medium: "Reaches outside, and it can be walked back.",
  high: "Hard to walk back.",
};
