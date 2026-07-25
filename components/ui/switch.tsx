import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

// Boolean on/off control -- ported against Geist's "Toggle" anatomy (track + thumb),
// since Geist's own "Switch" component is actually a segmented multi-option selector
// (see tempo-v5/research/switch.md's naming note); this file's Radix primitive
// (@radix-ui/react-switch, a single checked boolean) matches the Toggle spec's shape.
// tempo-v5/research/toggle.md
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full p-0.5",
      "transition-colors duration-200 motion-reduce:transition-none",
      "data-[state=unchecked]:bg-[var(--ds-gray-300)] data-[state=checked]:bg-[var(--ds-gray-1000)]",
      "focus-visible:outline-none focus-visible:shadow-[var(--ds-focus-ring)]",
      "disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block size-4 rounded-full bg-[var(--ds-background-100)] shadow-[var(--ds-shadow-small)]",
        "transition-transform duration-200 motion-reduce:transition-none",
        "data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0",
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
