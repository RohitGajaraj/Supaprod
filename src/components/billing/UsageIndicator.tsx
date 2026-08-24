/**
 * G-PRICE PR-A4 — the quiet usage indicator.
 *
 * pricing-architecture.md §2 Rule 3: the meter is shown at most as a simple
 * "120 of your 300 this month" bar — NEVER a per-action dollar, NEVER a mid-flow cost
 * confirmation. This component is the ONE place usage renders; it deliberately has no
 * per-action variant and takes no dollar amount as a prop, so it cannot be misused into
 * a cost popup. The dollar/COGS math (credit-policy.ts, pricing.ts) stays server-internal
 * and never reaches a prop here.
 *
 * Calm by design: a slim bar + "X of Y this month", no color alarm until genuinely low
 * (reuses the same LOW_CREDITS_WARN threshold BillingBanner already warns at, so the two
 * surfaces agree on what "running low" means).
 */
import { LOW_CREDITS_WARN } from "@/lib/entitlements";

export type UsageIndicatorProps = {
  /** Current balance (included + top-up combined) — never split out for the user. */
  used: number;
  /** The monthly allowance this balance is measured against. */
  allowance: number;
  /** Compact renders just the bar + count (app shell); false adds a caption line. */
  compact?: boolean;
};

/** Pure: the fraction of the allowance remaining, clamped to [0, 1]. */
export function usageRemainingFraction(used: number, allowance: number): number {
  if (!Number.isFinite(allowance) || allowance <= 0) return 1;
  return Math.max(0, Math.min(1, used / allowance));
}

export function UsageIndicator({ used, allowance, compact = false }: UsageIndicatorProps) {
  if (!Number.isFinite(allowance) || allowance <= 0) return null;
  const fraction = usageRemainingFraction(used, allowance);
  const low = used <= LOW_CREDITS_WARN;
  const barColor = low ? "var(--mrd-you)" : "var(--action-blue, var(--mrd-you))";

  return (
    <div
      role="group"
      aria-label={`${used} of ${allowance} credits used this month`}
      style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 96 }}
    >
      <div
        style={{
          height: 4,
          borderRadius: 99,
          background: "var(--surface-recessed, rgba(0,0,0,0.08))",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.round((1 - fraction) * 100)}%`,
            background: barColor,
            borderRadius: 99,
            transition: "width 0.2s ease",
          }}
        />
      </div>
      <span className="mono-label" style={{ color: "var(--mrd-mute)", letterSpacing: "0.02em" }}>
        {used} of {allowance} this month
      </span>
      {!compact && (
        <span style={{ color: "var(--mrd-mute)" }}>
          Everyday actions are free. Only missions and builds draw from this.
        </span>
      )}
    </div>
  );
}
