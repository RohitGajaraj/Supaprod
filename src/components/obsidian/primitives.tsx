import * as React from "react";
import { cn } from "@/lib/utils";
import { fireFeedback } from "@/lib/interaction-feedback";

/** Hex -> rgba string. Used to derive tinted fills/borders from the real
 * Obsidian hue tokens (never an invented hex) at the exact alpha the
 * contract specifies. */
export function rgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export type MonoLabelTone =
  "ember" | "glacier" | "blossom" | "moss" | "madder" | "marigold" | "muted" | "faint";

export const MONO_LABEL_TONE_COLOR: Record<MonoLabelTone, string> = {
  ember: "var(--ember)",
  glacier: "var(--glacier)",
  blossom: "var(--blossom)",
  moss: "var(--moss)",
  madder: "var(--madder)",
  marigold: "var(--marigold)",
  muted: "var(--text-muted)",
  faint: "var(--text-faint)",
};

export interface MonoLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: MonoLabelTone;
}

/** Mono-caps metadata row. No icon prop: the Obsidian iconography law is
 * that there is no icon set, only unicode affordances the caller inlines
 * (`->`, middot) as part of children. */
export const MonoLabel = React.forwardRef<HTMLSpanElement, MonoLabelProps>(
  ({ tone, className, style, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn("inline-flex items-center uppercase", className)}
      style={{
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.11em",
        // LOOM W4 contrast floor: the default mono label reads at --text-muted
        // (subtle fell below arm's-length readability on dark). Callers that
        // pass an explicit tone are untouched.
        color: tone ? MONO_LABEL_TONE_COLOR[tone] : "var(--text-muted)",
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  ),
);
MonoLabel.displayName = "MonoLabel";

// LEGACY OBSIDIAN TYPE SIGNATURES (for backward compatibility)
// DO NOT USE IN NEW CODE. Use Tempo Button from @/components/ui/button instead.
// These types are preserved only so existing code doesn't break at import time.
export type ButtonVariant = "primary" | "secondary" | "tertiary" | "link" | "quiet";
export type ButtonSize = "sm" | "md";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant | string;
  size?: ButtonSize;
  loading?: boolean;
}

// ============================================================================
// UNIFIED BUTTON COMPONENT (re-exported from Tempo)
//
// This re-exports the Tempo Button which now accepts BOTH:
// 1. Tempo variant names (accent, default, secondary, tertiary, ghost, outline, link, destructive, warning)
// 2. Legacy obsidian variant names (primary, secondary, tertiary, link, quiet)
//
// Legacy names are mapped to Tempo semantics with dev-time deprecation warnings:
//   obsidian "primary" → Tempo "accent" (solid ember primary CTA)
//   obsidian "secondary" → Tempo "secondary" (raised, visible border)
//   obsidian "tertiary" → Tempo "tertiary" (transparent, low-emphasis)
//   obsidian "link" → Tempo "link" (inline navigation)
//   obsidian "quiet" → Tempo "tertiary" (same as tertiary)
//
// IMPORTANT: The Tempo Button does NOT include the obsidian interaction-feedback
// layer (haptic/sound via fireFeedback). If you need that, use the deprecated
// inline obsidian Button component below (will be removed in a future release).
// ============================================================================
import { Button as TempoButton } from "@/components/ui/button";
export const Button = TempoButton;
