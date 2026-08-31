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
 *
 * ── CORRECTED 2026-08-31, AND THE ALARM WAS FIRING BACKWARDS ──────────────
 * The paragraph above claimed the two surfaces agree. They did not, and the
 * disagreement inverted the only warning on this component.
 *
 * `LOW_CREDITS_WARN` is 100 and it is a REMAINING-credits threshold: BillingBanner
 * applies it as `balance <= threshold` (`shouldWarnLowCredits`). This component
 * applied the same constant to CONSUMPTION -- `used <= LOW_CREDITS_WARN` -- and the
 * one caller passes `monthlyGrantCredits - balanceCredits`, which is genuinely
 * spend. **So the low-credit colour appeared while somebody had barely spent
 * anything and switched OFF as they approached the limit**, which is the opposite
 * of a warning. Now derived from what is left.
 *
 * AND THE ALARM HAD NO COLOUR TO FIRE IN. The normal bar drew
 * `var(--action-blue, ...)` and the track drew
 * `var(--surface-recessed, rgba(0,0,0,0.08))`. **Both resolve into the RETIRED
 * `--ds-*` family** -- `--action-blue: var(--ds-blue-600)` at styles.css:1177 and
 * `--surface-recessed: var(--ds-background-200)` at :2025. This is the defect
 * `BillingBanner`'s own header describes and was ported off, left behind in its
 * sibling: *"an indirection hides the retired token behind a friendly name"*, so
 * the Meridian ratchet cannot see it. Mapped by MEANING, the same rule that port
 * used: consumption driven by the crew is `--mrd-agent`, a bar that needs YOU is
 * `--mrd-you`, and the track behind them is `--mrd-faint`. The raw
 * `rgba(0,0,0,0.08)` fallback went with it; it ignored the theme entirely.
 *
 * TWO MORE THINGS THAT DISAGREED WITH THE CAPTION. The bar filled with
 * `(1 - used/allowance)`, so it depicted what REMAINED while the caption beside
 * it read "{used} of {allowance} this month", which is consumption: bar and
 * number described opposite quantities and moved in opposite directions. And
 * `usageRemainingFraction` returned `used / allowance`, the consumed share, under
 * a name promising the remainder. The prop's own doc comment said "Current
 * balance", contradicting its only caller. **Four statements about one number and
 * three of them were wrong**; the caller was the one that was right, so the
 * caller is what everything now agrees with.
 */
import { LOW_CREDITS_WARN } from "@/lib/entitlements";

export type UsageIndicatorProps = {
  /**
   * Credits CONSUMED this cycle, which is what the caption states. The one
   * caller computes it as `monthlyGrantCredits - balanceCredits`; a doc comment
   * here used to call it the balance, which is its complement.
   */
  used: number;
  /** The monthly allowance this balance is measured against. */
  allowance: number;
  /** Compact renders just the bar + count (app shell); false adds a caption line. */
  compact?: boolean;
};

/**
 * Pure: the share of the allowance CONSUMED, clamped to [0, 1].
 *
 * Renamed from `usageRemainingFraction`, which is what it was called while
 * returning `used / allowance`. Nothing outside this file and its test imported
 * the old name. A helper whose name is the complement of its value is how the
 * bar came to move opposite to the number beside it.
 *
 * An absent or nonsensical allowance returns 1, and the component renders
 * nothing in that case rather than drawing a full bar.
 */
/**
 * Is this account near the end of its allowance?
 *
 * EXPORTED SO THE ALARM CAN BE TESTED AT ALL. Forty-four tests covered this
 * component and not one asserted the colour, which is how an inverted warning
 * survived. Asserting on the rendered colour is the wrong instrument: it is a
 * `var()` chain Meridian owns and may re-map, and a nested fallback does not
 * survive the test DOM's style parser. The RULE is the thing worth pinning, so
 * it is a predicate.
 *
 * Takes what is LEFT, never what is spent. `LOW_CREDITS_WARN` is the same
 * threshold `shouldWarnLowCredits` applies to the balance in BillingBanner, so
 * the two surfaces genuinely agree on "running low".
 */
export function isRunningLow(used: number, allowance: number): boolean {
  if (!Number.isFinite(allowance) || allowance <= 0) return false;
  return Math.max(0, allowance - used) <= LOW_CREDITS_WARN;
}

export function usedFraction(used: number, allowance: number): number {
  if (!Number.isFinite(allowance) || allowance <= 0) return 1;
  return Math.max(0, Math.min(1, used / allowance));
}

export function UsageIndicator({ used, allowance, compact = false }: UsageIndicatorProps) {
  if (!Number.isFinite(allowance) || allowance <= 0) return null;
  const consumed = usedFraction(used, allowance);
  /*
   * FROM WHAT IS LEFT, never from what is spent. `LOW_CREDITS_WARN` is the same
   * remaining-credits threshold `shouldWarnLowCredits` applies to the balance in
   * BillingBanner, so the two surfaces now genuinely agree, which the header
   * above always claimed they did.
   */
  const low = isRunningLow(used, allowance);
  const barColor = low ? "var(--mrd-you)" : "var(--mrd-agent)";

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
          background: "var(--mrd-faint)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            /* Fills as the allowance is spent, so it moves with the number
               beside it. It used to render `1 - consumed`, which drained while
               the caption counted up. */
            width: `${Math.round(consumed * 100)}%`,
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
