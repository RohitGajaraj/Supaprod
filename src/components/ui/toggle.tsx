import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Pressable segment button -- ported against Geist's "Switch" anatomy (the segmented,
// pill-style SwitchControl selector), since Geist's own "Toggle" component is the
// boolean on/off track+thumb control already covered by switch.tsx (see
// tempo-v5/research/switch.md's naming note for the source of the crossed naming).
// tempo-v5/research/switch.md
const toggleVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-2 rounded-[var(--ds-radius-small)] cursor-pointer",
    "text-[var(--ds-gray-900)] transition-colors duration-150 motion-reduce:transition-none",
    "hover:bg-[var(--ds-gray-200)] hover:text-[var(--ds-gray-1000)]",
    "data-[state=on]:bg-[var(--ds-gray-1000)] data-[state=on]:text-[var(--ds-background-100)] data-[state=on]:hover:bg-[var(--ds-gray-900)]",
    "focus-visible:outline-none focus-visible:shadow-[var(--ds-focus-ring)]",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ),
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border border-[var(--ds-gray-400)] bg-[var(--ds-background-100)]",
      },
      size: {
        default: "h-[var(--ds-size-medium)] px-2 min-w-[var(--ds-size-medium)] text-button-14",
        sm: "h-[var(--ds-size-small)] px-1.5 min-w-[var(--ds-size-small)] text-button-12",
        lg: "h-[var(--ds-size-large)] px-2.5 min-w-[var(--ds-size-large)] text-button-16",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
));

Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle, toggleVariants };
