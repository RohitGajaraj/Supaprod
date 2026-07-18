import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Ink Input — Tempo v5 design system component.
 *
 * Text input, textarea, and select-like surfaces supporting:
 * - Placeholder text (gray-600)
 * - Error state (red border + hint text)
 * - Disabled state (opacity, cursor)
 * - Focus ring (ember, via --ds-focus-ring)
 * - Dark/Light themes (--ds-* tokens)
 * - Responsive width (default full-width inside flex container)
 *
 * Integrates with shadcn/ui Form + React Hook Form for validation.
 */

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      // Base: sizing, typography, border, background
      "flex h-10 w-full",
      "rounded-md border border-[var(--ds-gray-400)]",
      "bg-[var(--ds-background-100)]",
      "px-3 py-2",
      "text-label-14",
      "text-[var(--ds-gray-1000)]",
      "placeholder:text-[var(--ds-gray-600)]",
      // Interaction states
      "hover:border-[var(--ds-gray-500)]",
      "focus-visible:outline-none",
      "focus-visible:ring-[2px] focus-visible:ring-offset-2",
      "focus-visible:ring-offset-[var(--ds-background-100)]",
      "focus-visible:ring-[var(--ds-focus-color)]",
      "focus-visible:border-[var(--ds-gray-600)]",
      // Disabled state
      "disabled:cursor-not-allowed disabled:opacity-50",
      "disabled:bg-[var(--ds-gray-100)]",
      // Error state (use aria-invalid for accessibility)
      "aria-invalid:border-[var(--ds-red-600)]",
      "aria-invalid:focus-visible:ring-[var(--ds-red-600)]",
      // Motion
      "transition-colors",
      "data-[motion=off]:transition-none",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[80px] w-full rounded-md border border-[var(--ds-gray-400)]",
      "bg-[var(--ds-background-100)] px-3 py-2",
      "text-label-14 text-[var(--ds-gray-1000)]",
      "placeholder:text-[var(--ds-gray-600)]",
      "focus-visible:outline-none focus-visible:ring-2",
      "focus-visible:ring-[var(--ds-focus-color)]",
      "focus-visible:ring-offset-2",
      "focus-visible:ring-offset-[var(--ds-background-100)]",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "aria-invalid:border-[var(--ds-red-600)]",
      "aria-invalid:focus-visible:ring-[var(--ds-red-600)]",
      "transition-colors data-[motion=off]:transition-none",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Input, Textarea };
