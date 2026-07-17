import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

// Neutral/tertiary interaction ramp: transparent at rest, tinted on hover/active
// (contract §2 role model: 100-300 = component background default/hover/active).
const neutralInteractive =
  "bg-transparent text-foreground hover:bg-[var(--ds-gray-100)] active:bg-[var(--ds-gray-200)]";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md cursor-pointer select-none transition-[background-color,color,border-color,opacity,box-shadow,transform] duration-150 ease-[var(--ds-motion-timing-swift)] active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-[var(--ds-focus-ring)] disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
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
        accent: "bg-[var(--ember)] text-white hover:brightness-110 active:brightness-95",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[var(--ds-gray-200)] active:bg-[var(--ds-gray-300)]",
        // tertiary is the spec name (button.md); ghost is the existing API name for the
        // same treatment — kept as an alias so call sites using either keep working.
        tertiary: neutralInteractive,
        ghost: neutralInteractive,
        outline:
          "border border-[var(--ds-gray-400)] bg-transparent text-foreground hover:border-[var(--ds-gray-500)] hover:bg-[var(--ds-gray-100)] active:bg-[var(--ds-gray-200)]",
        // error, per spec naming, exposed under the existing `destructive` key
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80",
        warning:
          "bg-[var(--ds-amber-700)] text-[var(--ds-black)] hover:bg-[var(--ds-amber-600)] active:bg-[var(--ds-amber-800)]",
        link: "bg-transparent text-[var(--ds-blue-700)] underline-offset-4 hover:underline hover:text-[var(--ds-blue-800)]",
      },
      size: {
        default: "h-[var(--ds-size-medium)] px-4 text-button-14",
        sm: "h-[var(--ds-size-small)] px-3 text-button-12",
        lg: "h-[var(--ds-size-large)] px-5 text-button-16",
        icon: "h-[var(--ds-size-medium)] w-[var(--ds-size-medium)] text-button-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Shows a spinner and marks the button busy while keeping it focusable and labeled. */
  loading?: boolean;
  /** Icon-only rendering (square hit target, no label). Requires `aria-label`. */
  svgOnly?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      svgOnly = false,
      children,
      ...props
    },
    ref,
  ) => {
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
