import * as React from "react";
import { cn } from "@/lib/utils";
import { MonoLabel } from "./primitives";

/**
 * SpotlightCard (Loom v4.1 — the PROMINENCE primitive).
 *
 * The design system's answer to "what deserves the spotlight, and is it
 * getting it?" A key insight, summary, takeaway, or brief must NOT submerge
 * into body text - it earns a lifted, gradient-lit container that reads as
 * "this is the thing to notice." Prominence is decoupled from restraint: a
 * calm screen may still spotlight its one important message.
 *
 * Anatomy:
 *  - a raised surface with an elevated shadow + top-light (catches the light)
 *  - an ultra-subtle role-colored glow field behind the content (aria-hidden)
 *  - a fading gradient hairline on the top edge (the light on the rim)
 *  - an optional mono kicker, the message in a confident readable voice, and
 *    an optional actions slot
 *
 * Tone maps the glow to meaning (glacier = the machine's read · ember =
 * needs-a-human · moss = a healthy/positive takeaway · blossom = information).
 * Use SPARINGLY: at most one or two spotlights per screen (the restraint
 * budget governs how many spotlights, never whether an insight is allowed one).
 */
export type SpotlightTone = "glacier" | "ember" | "moss" | "blossom" | "neutral";

const SPOTLIGHT_GLOW: Record<SpotlightTone, string> = {
  glacier: "rgba(127, 209, 220, 0.07)",
  ember: "rgba(255, 107, 44, 0.06)",
  moss: "rgba(127, 191, 142, 0.07)",
  blossom: "rgba(229, 189, 223, 0.06)",
  neutral: "rgba(255, 255, 255, 0.03)",
};

const SPOTLIGHT_KICKER_COLOR: Record<SpotlightTone, string> = {
  glacier: "var(--glacier)",
  ember: "var(--ember-text)",
  moss: "var(--moss-bright)",
  blossom: "var(--blossom)",
  neutral: "var(--text-muted)",
};

export interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional mono kicker above the message (e.g. "WHAT THE DATA SUGGESTS"). */
  kicker?: React.ReactNode;
  /** The tone tints the glow + kicker to the meaning. */
  tone?: SpotlightTone;
  /** Optional actions row rendered at the bottom (buttons, links). */
  actions?: React.ReactNode;
  /** When true, uses the tighter inset padding for a denser spotlight. */
  compact?: boolean;
}

export const SpotlightCard = React.forwardRef<HTMLDivElement, SpotlightCardProps>(
  (
    { kicker, tone = "glacier", actions, compact = false, className, style, children, ...props },
    ref,
  ) => (
    <div
      ref={ref}
      className={cn("loom-hairline-fade relative overflow-hidden", className)}
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--hairline-strong)",
        borderRadius: "var(--radius-panel, 14px)",
        boxShadow: "var(--shadow-elevated, var(--top-light))",
        padding: compact ? "16px 18px" : "20px 22px",
        ...style,
      }}
      {...props}
    >
      {/* Glow field: one soft role-colored radial wash behind the hero zone.
          aria-hidden, reads as light not color, passes the grayscale test. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          top: "-60%",
          right: "-30%",
          width: "90%",
          height: "180%",
          borderRadius: "99px",
          background: `radial-gradient(closest-side, ${SPOTLIGHT_GLOW[tone]}, transparent 72%)`,
        }}
      />
      <div className="relative flex flex-col" style={{ gap: 10 }}>
        {kicker ? (
          <MonoLabel style={{ color: SPOTLIGHT_KICKER_COLOR[tone] }}>{kicker}</MonoLabel>
        ) : null}
        <div>{children}</div>
        {actions ? (
          <div className="flex flex-wrap items-center" style={{ gap: 10, marginTop: 4 }}>
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  ),
);
SpotlightCard.displayName = "SpotlightCard";
