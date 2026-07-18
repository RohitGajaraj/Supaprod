import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Ink Spinner — Tempo v5 design system loading indicator.
 *
 * Animated rotation indicator for async operations.
 * Sizes: sm (16px), md (24px), lg (32px).
 * Color: defaults to gray-600, supports color override via className.
 *
 * Motion-gated: respects prefers-reduced-motion and data-motion="off".
 * If motion disabled, renders as a static gray circle.
 *
 * Usage:
 *   <Spinner /> — medium default
 *   <Spinner size="lg" /> — large
 *   <div className="flex items-center gap-2">
 *     <Spinner size="sm" />
 *     <span>Loading...</span>
 *   </div>
 */

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ size = "md", className, ...props }, ref) => {
    const sizeClasses = {
      sm: "h-4 w-4 border-2",
      md: "h-6 w-6 border-2",
      lg: "h-8 w-8 border-3",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "inline-block",
          "rounded-full border border-[var(--ds-gray-400)]",
          "border-t-[var(--ds-gray-600)]",
          "animate-spin",
          "data-[motion=off]:animate-none data-[motion=off]:border-t-[var(--ds-gray-400)]",
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Spinner.displayName = "Spinner";

export { Spinner };
