import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

// Neutral/tertiary interaction ramp: transparent at rest, tinted on hover/active
// (contract §2 role model: 100-300 = component background default/hover/active).
const neutralInteractive =
  "bg-transparent text-mrd-ink hover:bg-mrd-hover active:bg-mrd-lift";

// UNIFIED TEMPO GRAMMAR (DESIGN-TEMPO.md §2 + obsidian compat layer)
// Maps legacy obsidian variants to Tempo semantics with deprecation warnings.
// Legacy obsidian variants: "primary" | "secondary" | "tertiary" | "link" | "quiet"
// Tempo variants (correct): "accent" | "default" | "secondary" | "tertiary" | "ghost" | "outline" | "link" | "destructive" | "warning"
//
// Mapping rules:
//   obsidian "primary" → Tempo "accent" (solid ember, the ONE main CTA per view)
//   obsidian "secondary" → Tempo "secondary" (raised surface, visible border)
//   obsidian "tertiary" → Tempo "tertiary" (transparent, low-emphasis)
//   obsidian "link" → Tempo "link" (inline text navigation)
//   obsidian "quiet" → Tempo "tertiary" (was alias of tertiary in obsidian, now explicit)
type TempoVariant =
  | "accent"
  | "default"
  | "secondary"
  | "tertiary"
  | "ghost"
  | "outline"
  | "link"
  | "destructive"
  | "warning";
type LegacyObsidianVariant = "primary" | "quiet";

function mapLegacyVariant(variant: string | undefined): TempoVariant | undefined {
  if (variant === "primary") {
    if (typeof window !== "undefined" && import.meta.env.DEV) {
      console.warn(
        "Button: variant='primary' is legacy obsidian syntax. Use variant='accent' instead (DESIGN-TEMPO.md §2). This will be removed in a future release.",
      );
    }
    return "accent";
  }
  if (variant === "quiet") {
    if (typeof window !== "undefined" && import.meta.env.DEV) {
      console.warn(
        "Button: variant='quiet' is legacy obsidian syntax. Use variant='tertiary' instead (DESIGN-TEMPO.md §2). This will be removed in a future release.",
      );
    }
    return "tertiary";
  }
  return variant as TempoVariant | undefined;
}

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md cursor-pointer select-none transition-[background-color,color,border-color,opacity,box-shadow,transform] duration-150 ease-(--mrd-ease) active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--mrd-focus) disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    // COLOR GRAMMAR (contract §2 · founder ruling 2026-07-14) — a button's
    // color states its role, one rule platform-wide:
    //   accent (ember)  = the SINGLE primary "needs-human" CTA per view.
    //   default (neutral invert) = ordinary confirmations (Save, Apply, Add).
    //   secondary / tertiary / ghost / outline = supporting, low-emphasis.
    //   link (blue)     = navigation / the machine's voice (blue = data/machine).
    //   destructive (red) / warning (amber) = risk + caution.
    // At most ONE accent button per screen; everything else stays neutral.
    variants: {
      variant: {
        // default = neutral high-contrast invert (contract §2 ember-on-forms ruling):
        // --primary/--primary-foreground are already re-pointed to gray-1000/background-100.
        default: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80",
        // accent = the one ember primary CTA per view. Prefer this over ad-hoc
        // inline ember styles so the brand action is consistent everywhere.
        accent: "bg-[var(--mrd-you)] text-white hover:brightness-110 active:brightness-95",
        secondary:
          "bg-mrd-lift text-mrd-ink hover:bg-mrd-hover active:bg-mrd-lift-hover",
        // tertiary is the spec name (button.md); ghost is the existing API name for the
        // same treatment — kept as an alias so call sites using either keep working.
        tertiary: neutralInteractive,
        ghost: neutralInteractive,
        outline:
          "border border-mrd-edge bg-transparent text-mrd-ink hover:border-mrd-field-focus hover:bg-mrd-hover active:bg-mrd-lift",
        // error, per spec naming, exposed under the existing `destructive` key
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80",
        warning:
          "bg-mrd-hold text-mrd-bg hover:bg-mrd-hold active:bg-(--mrd-hold-dim)",
        link: "bg-transparent text-mrd-body underline-offset-4 hover:underline hover:text-mrd-ink",
      },
      size: {
        default: "h-9 px-4 text-button-14",
        sm: "h-8 px-3 text-button-12",
        lg: "h-10 px-5 text-button-16",
        icon: "h-9 w-9 text-button-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<VariantProps<typeof buttonVariants>, "variant"> {
  asChild?: boolean;
  /** Shows a spinner and marks the button busy while keeping it focusable and labeled. */
  loading?: boolean;
  /** Icon-only rendering (square hit target, no label). Requires `aria-label`. */
  svgOnly?: boolean;
  /** Tempo variant (accent/default/secondary/tertiary/ghost/outline/link/destructive/warning)
   * or legacy obsidian variants (primary/quiet) for backward compatibility. */
  variant?:
    | "accent"
    | "default"
    | "secondary"
    | "tertiary"
    | "ghost"
    | "outline"
    | "link"
    | "destructive"
    | "warning"
    | "primary"
    | "quiet"
    | null;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant: rawVariant,
      size,
      asChild = false,
      loading = false,
      svgOnly = false,
      children,
      ...props
    },
    ref,
  ) => {
    // Map legacy obsidian variant names to Tempo grammar, with deprecation warnings
    const variant = mapLegacyVariant(rawVariant as any);

    if (import.meta.env.DEV && svgOnly && !props["aria-label"]) {
      console.warn(
        'Button: svgOnly requires an aria-label naming the action and its target (e.g. "Copy deployment URL", not "Copy").',
      );
    }

    const Comp = asChild ? Slot : "button";
    const content = asChild ? (
      children
    ) : (
      <>
        {loading ? (
          <Loader2
            aria-hidden="true"
            className="size-4 shrink-0 animate-spin motion-reduce:animate-none"
          />
        ) : null}
        {children}
      </>
    );

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          svgOnly && !asChild && "aspect-square px-0",
          loading && !asChild && "pointer-events-none",
        )}
        ref={ref}
        aria-busy={!asChild && loading ? true : undefined}
        {...props}
      >
        {content}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
