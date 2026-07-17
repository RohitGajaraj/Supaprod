// PC-11: the one UI signal for confidence-gated execution. Renders ONLY for
// low confidence -- a medium or high draft looks exactly like it always
// did, per the row's own "high-confidence flow unchanged" acceptance line.
import type { ConfidenceTier } from "@/lib/confidence";

export function ConfidenceChip({ tier }: { tier: ConfidenceTier | null | undefined }) {
  if (tier !== "low") return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 11,
        fontWeight: 550,
        color: "var(--ember, #fb7100)",
        background: "var(--ember-dim, rgba(251,113,0,0.1))",
        border: "1px solid var(--ember-border, rgba(251,113,0,0.3))",
        borderRadius: 99,
        padding: "2px 9px",
      }}
    >
      Supaprod is unsure, review first
    </span>
  );
}
