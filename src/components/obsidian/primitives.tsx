import * as React from "react";
import { cn } from "@/lib/utils";

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
  | "ember"
  | "glacier"
  | "blossom"
  | "moss"
  | "madder"
  | "marigold"
  | "muted"
  | "faint";

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
        fontSize: "var(--text-mono-label)",
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

export type ButtonVariant = "primary" | "secondary" | "quiet";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
}

const BUTTON_BASE_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-ui)",
  borderRadius: "var(--radius-control)",
  transitionProperty: "background-color, color, transform, opacity",
  transitionDuration: "var(--dur-control)",
  transitionTimingFunction: "var(--ease)",
};

const BUTTON_VARIANT_STYLE: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: "var(--ember)",
    color: "var(--cta-ink)",
    fontSize: "13px",
    fontWeight: 600,
    padding: "9px 18px",
    border: "none",
  },
  secondary: {
    backgroundColor: "var(--hover)",
    color: "var(--text-primary)",
    fontSize: "13px",
    fontWeight: 500,
    padding: "8px 18px",
    border: "1px solid var(--hairline-strong)",
  },
  quiet: {
    backgroundColor: "transparent",
    color: "var(--glacier)",
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-mono-label)",
    letterSpacing: "0.11em",
    padding: 0,
    border: "none",
  },
};

// Hover fills are literal prototype values with no matching token (--hover
// itself is the secondary button's *resting* fill, not its hover fill), so
// they're expressed as arbitrary-value classes rather than invented tokens.
const BUTTON_VARIANT_HOVER_CLASS: Record<ButtonVariant, string> = {
  primary: "hover:[background-color:var(--ember-deep)]",
  secondary: "hover:[background-color:#242429]",
  quiet: "hover:[color:#EAF6FF]",
};

/**
 * Press feedback is a CSS transition (not a keyframe) so a rapid double-click
 * retargets smoothly instead of restarting from zero (emil-design-eng).
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", loading = false, disabled, className, style, children, ...props },
    ref,
  ) => {
    const isDisabled = Boolean(disabled) || loading;
    return (
      <button
        ref={ref}
        type="button"
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 outline-none",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]",
          variant === "quiet" && "uppercase",
          !isDisabled && variant !== "quiet" && "active:scale-[0.985]",
          !isDisabled && BUTTON_VARIANT_HOVER_CLASS[variant],
          isDisabled ? "cursor-default opacity-45" : "cursor-pointer",
          className,
        )}
        style={{ ...BUTTON_BASE_STYLE, ...BUTTON_VARIANT_STYLE[variant], ...style }}
        {...props}
      >
        <span
          style={{
            transitionProperty: "opacity",
            transitionDuration: "var(--dur-control)",
            transitionTimingFunction: "var(--ease)",
            opacity: loading ? 0 : 1,
          }}
        >
          {children}
        </span>
        {loading && (
          <span
            aria-hidden="true"
            className="absolute h-[6px] w-[6px] rounded-full"
            style={{
              backgroundColor: "var(--glacier)",
              animation: "cadPulse 2s ease-in-out infinite",
            }}
          />
        )}
      </button>
    );
  },
);
Button.displayName = "Button";
