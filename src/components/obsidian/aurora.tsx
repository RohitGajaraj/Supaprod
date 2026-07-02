import * as React from "react";
import { cn } from "@/lib/utils";
import { MonoLabel } from "./primitives";

export type AuroraHue = "healthy" | "attention" | "failing";

// "healthy" bg is the exact prototype literal (#0F1B12). The contract
// describes attention/failing only qualitatively ("ember-forward",
// "madder-forward") with no literal hex, so those are derived via
// color-mix() from the real ember/madder tokens rather than an invented hex.
const AURORA_HUE_BG: Record<AuroraHue, string> = {
  healthy: "#0F1B12",
  attention: "color-mix(in oklab, var(--ember) 12%, var(--surface-card-deep))",
  failing: "color-mix(in oklab, var(--madder) 12%, var(--surface-card-deep))",
};

export interface AuroraCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  note: string;
  hue?: AuroraHue;
}

/** Loop Health-class score card. Restraint budget: at most ONE per screen
 * (enforced at the call site, not here: the primitive cannot know page
 * context). */
export const AuroraCard = React.forwardRef<HTMLDivElement, AuroraCardProps>(
  ({ label, value, note, hue = "healthy", className, style, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      style={{
        borderRadius: "var(--radius-aurora)",
        backgroundColor: hue === "healthy" ? AURORA_HUE_BG.healthy : undefined,
        background: hue === "healthy" ? undefined : AURORA_HUE_BG[hue],
        boxShadow: "0 0 55px rgba(127,191,142,0.09)",
        padding: "var(--density-card-pad-lg)",
        ...style,
      }}
      {...props}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(circle at 22% 28%, rgba(232,180,76,0.34), transparent 55%)",
          animation: "cadDriftA 9s ease-in-out infinite",
        }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(circle at 78% 72%, rgba(127,191,142,0.4), transparent 55%)",
          animation: "cadDriftB 12s ease-in-out infinite",
        }}
      />
      <div className="relative flex flex-col gap-2">
        <MonoLabel>{label}</MonoLabel>
        <span
          style={{
            fontFamily: "var(--font-dotted)",
            fontSize: "var(--text-score)",
            color: "var(--text-primary)",
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        <MonoLabel>{note}</MonoLabel>
      </div>
    </div>
  ),
);
AuroraCard.displayName = "AuroraCard";
