import * as React from "react";
import { cn } from "@/lib/utils";
import { rgba } from "./primitives";

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
  hex: string;
  text: string;
}

// components.md: SHIP/VALIDATED/KEPT moss (#8FD9A0 text) · KILL/MISSED madder
// (#EE7A6C) · REVISE ember (#FF8B52, a distinct lighter shade from
// --ember/--ember-deep, verbatim from the anatomy) · CRITIC REVIEW/WATCH
// marigold · DRAFTING glacier. PENDING is handled separately (no hue).
const VERDICT_HUE: Record<Exclude<VerdictTone, "PENDING">, VerdictHue> = {
  SHIP: { hex: "#7FBF8E", text: "#8FD9A0" },
  VALIDATED: { hex: "#7FBF8E", text: "#8FD9A0" },
  KEPT: { hex: "#7FBF8E", text: "#8FD9A0" },
  KILL: { hex: "#E06557", text: "#EE7A6C" },
  MISSED: { hex: "#E06557", text: "#EE7A6C" },
  REVISE: { hex: "#FF6B2C", text: "#FF8B52" },
  "CRITIC REVIEW": { hex: "#E8B44C", text: "#E8B44C" },
  WATCH: { hex: "#E8B44C", text: "#E8B44C" },
  DRAFTING: { hex: "#84b3ec", text: "#84b3ec" },
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
          backgroundColor: hue ? rgba(hue.hex, 0.12) : "transparent",
          // PENDING: spec says "faint hairline border" - --hairline-faint
          // (5%, doc-commented "faint dividers" in the token layer) is the
          // literal match for that word, not the general --hairline (7%).
          border: hue ? `1px solid ${rgba(hue.hex, 0.45)}` : "1px solid var(--hairline-faint)",
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
