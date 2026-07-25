import * as React from "react";
import { cn } from "@/lib/utils";

export type VerdictTone =
  | "SHIP"
  | "VALIDATED"
  | "KEPT"
  | "KILL"
  | "MISSED"
  | "REVISE"
  | "CRITIC REVIEW"
  | "WATCH"
  | "DRAFTING"
  | "PENDING";

interface VerdictHue {
  /** Token-traced base hue: derives the 12% tinted fill and 45% border. */
  color: string;
  /** Text step: the brighter -bright/-text variant of the same role hue. */
  text: string;
}

// Token-traced (2026-07-11): SHIP/VALIDATED/KEPT moss · KILL/MISSED madder ·
// REVISE ember · CRITIC REVIEW/WATCH marigold · DRAFTING glacier. Vars over
// literals so both themes resolve from the same role tokens (the old hexes
// only held in dark). PENDING is handled separately (no hue).
const VERDICT_HUE: Record<Exclude<VerdictTone, "PENDING">, VerdictHue> = {
  SHIP: { color: "var(--moss)", text: "var(--moss-bright)" },
  VALIDATED: { color: "var(--moss)", text: "var(--moss-bright)" },
  KEPT: { color: "var(--moss)", text: "var(--moss-bright)" },
  KILL: { color: "var(--madder)", text: "var(--madder-bright)" },
  MISSED: { color: "var(--madder)", text: "var(--madder-bright)" },
  REVISE: { color: "var(--ember)", text: "var(--ember-text, var(--ember))" },
  "CRITIC REVIEW": { color: "var(--marigold)", text: "var(--marigold)" },
  WATCH: { color: "var(--marigold)", text: "var(--marigold)" },
  DRAFTING: { color: "var(--glacier)", text: "var(--glacier)" },
};

export interface VerdictChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone: VerdictTone;
}

/** Mono pill, 12% tinted fill + 45%-alpha border of the same hue. Static
 * (non-interactive): the tone color is the meaning, not a status live-state. */
export const VerdictChip = React.forwardRef<HTMLSpanElement, VerdictChipProps>(
  ({ tone, className, style, children, ...props }, ref) => {
    const hue = tone === "PENDING" ? null : VERDICT_HUE[tone];
    return (
      <span
        ref={ref}
        className={cn("inline-flex items-center uppercase", className)}
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-mono-micro)",
          fontWeight: 600,
          letterSpacing: "0.11em",
          borderRadius: "var(--radius-pill)",
          padding: "3px 10px",
          // color-mix instead of the rgba() helper: the hues are now var()
          // references, which a hex parser cannot derive alphas from.
          backgroundColor: hue
            ? `color-mix(in oklab, ${hue.color} 12%, transparent)`
            : "transparent",
          // PENDING: spec says "faint hairline border" - --hairline-faint
          // (5%, doc-commented "faint dividers" in the token layer) is the
          // literal match for that word, not the general --hairline (7%).
          border: hue
            ? `1px solid color-mix(in oklab, ${hue.color} 45%, transparent)`
            : "1px solid var(--hairline-faint)",
          color: hue ? hue.text : "var(--text-faint)",
          ...style,
        }}
        {...props}
      >
        {children ?? tone}
      </span>
    );
  },
);
VerdictChip.displayName = "VerdictChip";
