import * as React from "react";
import { CadenceLoader } from "@/components/cadence/CadenceMark";
import { ShimmerText } from "@/components/cadence/ShimmerText";

// AiWorking — the standard "the machine is working" indicator (founder ruling
// 2026-07-14: the brand personality should be felt wherever AI is doing
// something — thinking, drafting, shaping). Pairs the animated CadenceMark
// (the loop turning around a pulsing core) with the shared glacier ShimmerText
// label, so every AI-working moment across the platform reads the same and
// carries the brand. Use this in place of ad-hoc spinners for AI actions;
// honor the one-shimmer-per-screen yield rule.
export function AiWorking({
  label,
  size = 16,
  style,
}: {
  /** The short action, e.g. "Drafting the spec". Never a title. */
  label: string;
  size?: number;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className="inline-flex items-center"
      role="status"
      aria-live="polite"
      style={{ gap: 8, minWidth: 0, ...style }}
    >
      <CadenceLoader size={size} title={label} />
      <ShimmerText style={{ fontSize: 12 }}>{label}</ShimmerText>
    </span>
  );
}
