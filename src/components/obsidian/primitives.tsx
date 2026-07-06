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

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "link" | "quiet";
export type ButtonSize = "sm" | "md";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const BUTTON_BASE_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-ui)",
  borderRadius: "var(--radius-control)",
  lineHeight: 1.2,
  whiteSpace: "nowrap",
  transitionProperty: "background-color, border-color, color, box-shadow, transform, opacity",
  transitionDuration: "var(--dur-control)",
  transitionTimingFunction: "var(--ease)",
};

// Sizing: comfortable, finger-friendly hit areas. sm for dense rows, md default.
const BUTTON_SIZE_STYLE: Record<ButtonSize, React.CSSProperties> = {
  sm: { fontSize: "12.5px", padding: "6px 13px" },
  md: { fontSize: "13.5px", padding: "9px 18px" },
};

// AFFORDANCE DOCTRINE (Loom v4.1): affordance is decoupled from emphasis.
// Every button carries structural affordance (a shape: padding + radius, and
// either a fill or a border) so it can never be mistaken for a label. Emphasis
// (color/weight) rides on top. Sentence case in the UI voice, never uppercase
// mono - mono-caps is metadata, not an action.
const BUTTON_VARIANT_STYLE: Record<ButtonVariant, React.CSSProperties> = {
  // Primary: the ONE main action per view. Solid top-lit ember gradient.
  primary: {
    background: "linear-gradient(180deg, var(--cta-grad-top), var(--cta-grad-bottom))",
    color: "var(--cta-ink)",
    fontWeight: 600,
    border: "1px solid transparent",
    boxShadow: "var(--top-light), 0 1px 2px rgba(0,0,0,0.3)",
  },
  // Secondary: the workhorse. A raised surface with a visible border - quiet
  // but unmistakably a button. Unlimited per screen.
  secondary: {
    backgroundColor: "var(--surface-raised)",
    color: "var(--text-primary)",
    fontWeight: 500,
    border: "1px solid var(--hairline-strong)",
    boxShadow: "var(--top-light)",
  },
  // Tertiary: lowest-emphasis action. Transparent resting fill but ALWAYS a
  // border + padding + radius, so it reads as a control, never as text.
  tertiary: {
    backgroundColor: "transparent",
    color: "var(--text-body)",
    fontWeight: 500,
    border: "1px solid var(--hairline-strong)",
  },
  // Link: genuine inline text navigation only (never a primary action).
  // Glacier ink, underline affordance on hover.
  link: {
    backgroundColor: "transparent",
    color: "var(--glacier)",
    fontFamily: "var(--font-ui)",
    fontWeight: 500,
    padding: 0,
    border: "none",
  },
  // Quiet: retained as an alias of tertiary for back-compat. Now a real
  // bordered control, no longer borderless mono text.
  quiet: {
    backgroundColor: "transparent",
    color: "var(--text-body)",
    fontWeight: 500,
    border: "1px solid var(--hairline-strong)",
  },
};

const BUTTON_VARIANT_HOVER_CLASS: Record<ButtonVariant, string> = {
  primary: "hover:brightness-[1.08]",
  secondary: "hover:[background-color:var(--hover)] hover:[border-color:var(--text-faint)]",
  tertiary: "hover:[background-color:var(--hover)] hover:[color:var(--text-primary)]",
  link: "hover:underline hover:[color:#EAF6FF]",
  quiet: "hover:[background-color:var(--hover)] hover:[color:var(--text-primary)]",
};

/**
 * Press feedback is a CSS transition (not a keyframe) so a rapid double-click
 * retargets smoothly instead of restarting from zero (emil-design-eng).
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className,
      style,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = Boolean(disabled) || loading;
    const isLink = variant === "link";
    return (
      <button
        ref={ref}
        type="button"
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 outline-none",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]",
          !isDisabled && !isLink && "active:scale-[0.985]",
          !isDisabled && BUTTON_VARIANT_HOVER_CLASS[variant],
          isDisabled ? "cursor-default opacity-45" : "cursor-pointer",
          className,
        )}
        style={{
          ...BUTTON_BASE_STYLE,
          ...(isLink ? {} : BUTTON_SIZE_STYLE[size]),
          ...BUTTON_VARIANT_STYLE[variant],
          ...style,
        }}
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
              backgroundColor: variant === "primary" ? "var(--cta-ink)" : "var(--glacier)",
              animation: "cadPulse 2s ease-in-out infinite",
            }}
          />
        )}
      </button>
    );
  },
);
Button.displayName = "Button";
