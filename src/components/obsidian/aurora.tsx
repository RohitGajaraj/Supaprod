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

/** The hue's card background; exported for tests and non-component callers. */
export function auroraBackground(hue: AuroraHue): string {
  return AURORA_HUE_BG[hue];
}

export interface AuroraCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  note: string;
  hue?: AuroraHue;
}

/** Loop Health-class score card. Restraint budget: at most ONE per screen
 * (enforced at the call site, not here: the primitive cannot know page
 * context).
 *
 * v4.1 quality bar (matches the v3 prototype's Loop Health card): the aurora
 * is TWO large soft orbs (110-130% of the card, positioned partly outside it,
 * pill-radius, closest-side radial) that drift with translate+scale - a
 * genuine flowing light, not a flat pinned wash. The card carries an outer
 * glow. Hue picks the orb palette by state. */
const AURORA_ORBS: Record<AuroraHue, { a: string; b: string; glow: string }> = {
  healthy: {
    a: "rgba(232, 180, 76, 0.30)", // marigold
    b: "rgba(127, 191, 142, 0.38)", // moss
    glow: "rgba(127, 191, 142, 0.10)",
  },
  attention: {
    a: "rgba(255, 138, 80, 0.34)", // ember-warm
    b: "rgba(232, 180, 76, 0.30)", // marigold
    glow: "rgba(255, 107, 44, 0.10)",
  },
  failing: {
    a: "rgba(224, 101, 87, 0.34)", // madder
    b: "rgba(255, 138, 80, 0.26)", // ember-warm
    glow: "rgba(224, 101, 87, 0.10)",
  },
};

export const AuroraCard = React.forwardRef<HTMLDivElement, AuroraCardProps>(
  ({ label, value, note, hue = "healthy", className, style, ...props }, ref) => {
    const orbs = AURORA_ORBS[hue];
    return (
      <div
        ref={ref}
        className={cn("relative overflow-hidden", className)}
        style={{
          borderRadius: "var(--radius-aurora, 16px)",
          backgroundColor: hue === "healthy" ? AURORA_HUE_BG.healthy : undefined,
          background: hue === "healthy" ? undefined : AURORA_HUE_BG[hue],
          border: "1px solid var(--hairline-strong)",
          boxShadow: `0 0 55px ${orbs.glow}, var(--top-light)`,
          padding: "var(--density-card-pad-lg, 20px 22px)",
          ...style,
        }}
        {...props}
      >
        {/* Orb A: large soft orb, top-left, drifting. Positioned partly
            outside the card so it reads as flowing light. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={{
            top: "-40%",
            left: "-25%",
            width: "110%",
            height: "110%",
            borderRadius: "99px",
            background: `radial-gradient(closest-side, ${orbs.a}, transparent 70%)`,
            animation: "cadDriftA 9s ease-in-out infinite",
          }}
        />
        {/* Orb B: larger soft orb, bottom-left, slower counter-drift. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={{
            bottom: "-45%",
            left: "-15%",
            width: "130%",
            height: "120%",
            borderRadius: "99px",
            background: `radial-gradient(closest-side, ${orbs.b}, transparent 70%)`,
            animation: "cadDriftB 12s ease-in-out infinite",
          }}
        />
        <div className="relative flex flex-col gap-2">
          <MonoLabel>{label}</MonoLabel>
          {/* LOOM section 4 / v3 section 5: Codystar is aurora-DECORATIVE only.
              These numerals carry meaning (a score, a spend, a pass rate), so
              they render legibly in the serif display voice with tabular
              figures; the aurora washes stay the decoration. */}
          <span
            className="tabular-nums"
            style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 460,
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
    );
  },
);
AuroraCard.displayName = "AuroraCard";
