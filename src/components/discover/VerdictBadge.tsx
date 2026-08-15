import * as React from "react";
import { Badge } from "@/components/ui/badge";
import type { VerdictWord } from "@/components/discover/format";

/**
 * VerdictBadge: Displays Critic's red-team verdict prominently.
 *
 * Shows the verdict word (SHIP/REVISE/KILL) with color coding and optional
 * confidence score. Used on Decide surface to make the reviewer's conclusion
 * visible in the Gate headline.
 */
export function VerdictBadge({
  verdict,
  confidence,
}: {
  verdict: VerdictWord;
  confidence?: number | null;
}) {
  // Map verdicts to appropriate badge colors and labels
  const variantMap: Record<
    VerdictWord,
    { variant: "green" | "amber" | "red" | "gray" | "teal"; label: string }
  > = {
    SHIP: { variant: "green", label: "Ship" },
    REVISE: { variant: "amber", label: "Revise" },
    KILL: { variant: "red", label: "Kill" },
    WATCH: { variant: "teal", label: "Watch" },
    PENDING: { variant: "gray", label: "Pending" },
  };

  const { variant, label } = variantMap[verdict];
  const confidencePercent = typeof confidence === "number" ? Math.round(confidence * 100) : null;

  return (
    <Badge variant={variant} contrast="solid" size="md">
      {label}
      {confidencePercent ? ` · ${confidencePercent}%` : ""}
    </Badge>
  );
}
