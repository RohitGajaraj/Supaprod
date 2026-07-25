import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, checked, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    checked={checked}
    className={cn(
      // Anatomy: 16px box, hairline border, small radius. tempo-v5/research/checkbox.md
      "peer group inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-[var(--ds-radius-small)] border transition-colors duration-200 motion-reduce:transition-none",
      // Unchecked / indeterminate: outlined, not filled.
      "data-[state=unchecked]:border-[var(--ds-gray-700)] data-[state=unchecked]:bg-[var(--ds-background-100)]",
      "data-[state=indeterminate]:border-[var(--ds-gray-700)] data-[state=indeterminate]:bg-[var(--ds-background-100)]",
      // Checked: solid high-contrast fill (neutral, not ember -- forms use the neutral fill per DESIGN-TEMPO.md ember-on-forms ruling).
      "data-[state=checked]:border-[var(--ds-gray-1000)] data-[state=checked]:bg-[var(--ds-gray-1000)]",
      // Hover (enabled, not checked solid).
      "data-[state=unchecked]:hover:bg-[var(--ds-gray-200)] data-[state=indeterminate]:hover:bg-[var(--ds-gray-200)]",
      // Focus.
      "focus-visible:outline-none focus-visible:shadow-[var(--ds-focus-ring)]",
      // Disabled, per value state.
      "disabled:cursor-not-allowed disabled:pointer-events-none",
      "disabled:data-[state=unchecked]:border-[var(--ds-gray-500)] disabled:data-[state=unchecked]:bg-[var(--ds-gray-100)]",
      "disabled:data-[state=indeterminate]:border-[var(--ds-gray-500)] disabled:data-[state=indeterminate]:bg-[var(--ds-gray-100)]",
      "disabled:data-[state=checked]:border-[var(--ds-gray-600)] disabled:data-[state=checked]:bg-[var(--ds-gray-600)]",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn(
        "grid place-content-center",
        // Checkmark knocks out against the solid fill; the dash reads as a neutral mark on the outlined box.
        checked === "indeterminate"
          ? "text-[var(--ds-gray-700)] group-disabled:text-[var(--ds-gray-500)]"
          : "text-[var(--ds-background-100)]",
      )}
    >
      {checked === "indeterminate" ? (
        <Minus className="size-3.5" strokeWidth={2.5} />
      ) : (
        <Check className="size-3.5" strokeWidth={2.5} />
      )}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
