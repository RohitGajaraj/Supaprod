import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Ink Badge — Tempo v5 design system component.
 *
 * Status indicators, tags, and categorical labels.
 *
 * Variants:
 * - default: gray neutral, secondary info
 * - primary: ember brand accent (live/active states)
 * - success: green (completed outcomes)
 * - warning: amber (queued/in-progress)
 * - destructive: red (error/failed)
 * - info: blue (machine/agent states, narrow usage per §2 narrowing)
 *
 * Sizes: sm (12px text) / md (14px text)
 * Shape: pill (rounded-full) / rectangle (rounded-md)
 *
 * Per DESIGN-TEMPO.md §2 narrowing:
 * - Badges report literal status only (a "Live" badge, a "Running" badge)
 * - NOT decorative tints or "this is AI-related" indicators
 * - Blue may ONLY appear for status badges (literal running state, machine at work)
 * - Do not use as a generic container (use Card for that)
 */

const badgeVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-1",
    "px-2 py-1 rounded-md",
    "text-label-12 font-medium",
    "whitespace-nowrap",
    "border",
  ),
  {
    variants: {
      variant: {
        default: cn(
          "bg-[var(--ds-gray-100)] border-[var(--ds-gray-400)]",
          "text-[var(--ds-gray-1000)]",
        ),
        primary: cn(
          "bg-[var(--ds-ember-100)] border-[var(--ds-ember-400)]",
          "text-[var(--ds-ember-900)]",
        ),
        success: cn(
          "bg-[var(--ds-green-100)] border-[var(--ds-green-400)]",
          "text-[var(--ds-green-900)]",
        ),
        warning: cn(
          "bg-[var(--ds-amber-100)] border-[var(--ds-amber-400)]",
          "text-[var(--ds-amber-900)]",
        ),
        destructive: cn(
          "bg-[var(--ds-red-100)] border-[var(--ds-red-400)]",
          "text-[var(--ds-red-900)]",
        ),
        info: cn(
          "bg-[var(--ds-blue-100)] border-[var(--ds-blue-400)]",
          "text-[var(--ds-blue-900)]",
        ),
      },
      size: {
        sm: "px-2 py-1 text-label-12",
        md: "px-3 py-1.5 text-label-13",
      },
      shape: {
        rectangle: "rounded-md",
        pill: "rounded-full px-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
      shape: "rectangle",
    },
  },
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  /**
   * Optional icon component (e.g., a lucide icon).
   * Rendered before text content.
   */
  icon?: React.ReactNode;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, shape, icon, children, ...props }, ref) => (
    <div ref={ref} className={cn(badgeVariants({ variant, size, shape }), className)} {...props}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </div>
  ),
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
