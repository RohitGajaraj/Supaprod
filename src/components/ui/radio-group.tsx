import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";

import { cn } from "@/lib/utils";

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return <RadioGroupPrimitive.Root className={cn("grid gap-3", className)} {...props} ref={ref} />;
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        // Anatomy: 16px dot, hairline ring, filled center on select. tempo-v5/research/radio.md
        "group inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full border bg-[var(--ds-background-100)]",
        "transition-colors duration-200 ease-in motion-reduce:transition-none",
        "[--radio-color:var(--ds-gray-700)] border-[var(--radio-color)]",
        "data-[state=unchecked]:hover:bg-[var(--ds-gray-200)] data-[state=unchecked]:hover:[--radio-color:var(--ds-gray-900)]",
        "active:[--radio-color:var(--ds-gray-600)]",
        "data-[state=checked]:[--radio-color:var(--ds-gray-1000)]",
        "focus-visible:outline-none focus-visible:shadow-[var(--ds-focus-ring)]",
        "disabled:cursor-not-allowed disabled:pointer-events-none disabled:[--radio-color:var(--ds-gray-500)]",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator forceMount className="flex items-center justify-center">
        <span
          className={cn(
            "block size-2 scale-0 rounded-full bg-[var(--radio-color)] transition-transform duration-150 ease-in motion-reduce:transition-none",
            "group-data-[state=checked]:scale-100",
          )}
        />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
