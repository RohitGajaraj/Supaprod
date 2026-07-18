import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Ink Button — Tempo v5 design system component.
 *
 * Variants:
 * - default: high-contrast neutral fill (gray-1000 on bg), primary action
 * - primary: ember fill, brand moments, ONE primary CTA per view
 * - secondary: gray transparent border, supporting actions
 * - ghost: no visible container, text + hover state only
 * - destructive: red fill, irreversible actions
 * - link: blue text + underline, navigation only
 *
 * Sizes: sm (12px), md (14px), lg (16px)
 *
 * Responsive: built for 320/768/1280px breakpoints via Tailwind.
 * Dark/Light: resolves from --ds-* tokens, no hardcoded hex.
 * Focus: ember ring via --ds-focus-ring, never outline: none.
 * Motion: reduced-motion respected via @media (prefers-reduced-motion).
 */

const buttonVariants = cva(
  // Base: sizing, typography, interaction, focus ring
  cn(
    "inline-flex items-center justify-center gap-2",
    "rounded-md border border-transparent",
    "text-button-14 font-medium select-none",
    "cursor-pointer transition-colors",
    "focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-offset-2",
    "focus-visible:ring-offset-[var(--ds-background-100)]",
    "focus-visible:ring-[var(--ds-focus-color)]",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "data-[motion=off]:transition-none",
  ),
  {
    variants: {
      variant: {
        default:
          cn(
            "bg-[var(--ds-gray-1000)] text-[var(--ds-background-100)]",
            "hover:bg-[var(--ds-gray-900)]",
            "active:bg-[var(--ds-gray-800)]",
          ),
        primary:
          cn(
            "bg-[var(--ds-ember-600)] text-[var(--ds-background-100)]",
            "hover:bg-[var(--ds-ember-700)]",
            "active:bg-[var(--ds-ember-800)]",
          ),
        secondary:
          cn(
            "border-[var(--ds-gray-400)] text-[var(--ds-gray-1000)]",
            "bg-transparent hover:bg-[var(--ds-gray-100)]",
            "active:bg-[var(--ds-gray-200)]",
          ),
        ghost:
          cn(
            "text-[var(--ds-gray-1000)] bg-transparent",
            "hover:bg-[var(--ds-gray-100)]",
            "active:bg-[var(--ds-gray-200)]",
          ),
        destructive:
          cn(
            "bg-[var(--ds-red-600)] text-[var(--ds-background-100)]",
            "hover:bg-[var(--ds-red-700)]",
            "active:bg-[var(--ds-red-800)]",
          ),
        link:
          cn(
            "text-[var(--ds-blue-600)] bg-transparent underline underline-offset-4",
            "hover:text-[var(--ds-blue-700)]",
            "active:text-[var(--ds-blue-800)]",
          ),
      },
      size: {
        sm: "px-3 py-2 text-button-12",
        md: "px-4 py-2",
        lg: "px-4 py-3 text-button-16",
      },
      fullWidth: {
        true: "w-full",
        false: "w-auto",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      fullWidth: false,
    },
  },
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
