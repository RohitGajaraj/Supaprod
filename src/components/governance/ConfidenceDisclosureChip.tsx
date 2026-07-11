// RPT-08: disclosed confidence, always visible, on every Critic verdict and
// bet score -- distinct from PC-11's `ConfidenceChip` (src/components/cadence),
// which deliberately renders NOTHING above "low" (a gate, not a disclosure).
// This one always shows a number: a flat "SHIP"/"REVISE" chip with no
// confidence reads as uniform certainty, and disclosed confidence (even when
// it is high) is the honest posture the receipts thesis requires. No new
// scoring model -- renders the Critic's own already-computed `confidence`
// (0-1), tiered via the shared `ConfidenceTier` vocabulary.
import type { CSSProperties } from "react";
import type { ConfidenceTier } from "@/lib/confidence";

const TIER_TONE: Record<ConfidenceTier, string> = {
  high: "var(--emerald)",
  medium: "var(--text-muted)",
  low: "var(--ember)",
};

const TIER_LABEL: Record<ConfidenceTier, string> = {
  high: "confident",
  medium: "moderate",
  low: "unsure",
};

export function ConfidenceDisclosureChip({
  confidence,
  tier,
  style,
}: {
  /** The raw 0-1 probability, shown as a rounded percent. */
  confidence: number;
  tier: ConfidenceTier;
  style?: CSSProperties;
}) {
  const fg = TIER_TONE[tier];
  const pct = Math.round(Math.min(1, Math.max(0, confidence)) * 100);
  return (
    <span
      title={`Cadence discloses its own confidence in this verdict: ${pct}%`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontFamily: "var(--font-mono)",
        fontSize: 9.5,
        letterSpacing: "0.06em",
        fontWeight: 600,
        color: fg,
        border: `1px solid color-mix(in oklab, ${fg} 40%, transparent)`,
        borderRadius: 99,
        padding: "2px 8px",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {pct}% {TIER_LABEL[tier]}
    </span>
  );
}
