/**
 * Governance panel shared utilities and pure functions.
 * These are extracted from ApprovalsPanel to enable unit testing and reuse
 * across multiple governance surfaces.
 */

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
export const RESOLVED_LINE: Record<string, { text: string; color: string } | undefined> = {
  approved: { text: "approved · agent resumed", color: "var(--moss)" },
  executed: { text: "approved · agent resumed", color: "var(--moss)" },
  rejected: { text: "rejected · nothing ran", color: "var(--text-muted)" },
  failed: { text: "failed · the tool errored", color: "var(--madder)" },
  cancelled: { text: "cancelled · nothing ran", color: "var(--text-faint)" },
  expired: { text: "expired · nothing ran", color: "var(--text-faint)" },
};

/**
 * Risk level to semantic tone mapping.
 * Used to color-code risk chips in approval cards.
 *
 * Mapping:
 * - low: moss (safe outcome)
 * - medium: marigold (caution, never ember which is reserved for primary CTA)
 * - high: madder (alert/danger)
 *
 * Unknown risk levels default to marigold (conservative caution).
 */
export const RISK_TONE: Record<string, string> = {
  low: "var(--moss)",
  medium: "var(--marigold)",
  high: "var(--madder)",
};

/**
 * Gets the semantic tone for a risk level, with safe default.
 * @param risk - Risk level string ("low", "medium", "high", or unknown)
 * @returns CSS color variable string
 */
export function toneForRisk(risk: string): string {
  return RISK_TONE[risk] ?? "var(--marigold)";
}
