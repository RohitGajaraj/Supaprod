import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Ink Checkbox — Tempo v5 design system, built on Radix Checkbox.
 *
 * Checkbox input for binary (yes/no) selections.
 *
 * Usage:
 *   <Checkbox checked={isChecked} onCheckedChange={setIsChecked} />
 *   <Checkbox id="terms" />
 *   <label htmlFor="terms">I agree to terms</label>
 *
 * Keyboard: Space to toggle, Tab to navigate.
 * Focus: ember ring. Accessibility: aria-checked, disabled, indeterminate states.
 * States: unchecked, checked, indeterminate (tri-state).
 */

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-[var(--ds-gray-400)]",
      "bg-[var(--ds-background-100)]",
      "focus-visible:outline-none focus-visible:ring-2",
      "focus-visible:ring-[var(--ds-focus-color)]",
      "focus-visible:ring-offset-2",
      "focus-visible:ring-offset-[var(--ds-background-100)]",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-[var(--ds-ember-600)]",
      "data-[state=checked]:border-[var(--ds-ember-600)]",
      "data-[state=indeterminate]:bg-[var(--ds-ember-600)]",
      "data-[state=indeterminate]:border-[var(--ds-ember-600)]",
      "hover:border-[var(--ds-gray-500)]",
      "hover:data-[state=checked]:bg-[var(--ds-ember-700)]",
      "hover:data-[state=checked]:border-[var(--ds-ember-700)]",
      "transition-colors",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-3 w-3 text-[var(--ds-background-100)]" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
