import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "group relative flex w-full touch-none select-none items-center data-[disabled]:cursor-not-allowed",
      className,
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-[var(--ds-gray-300)] group-data-[disabled]:opacity-50">
      <SliderPrimitive.Range className="absolute h-full bg-[var(--ds-gray-1000)]" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className={cn(
        "block size-4 rounded-full border border-[var(--ds-gray-700)] bg-[var(--ds-background-100)] shadow-[var(--ds-shadow-small)]",
        "transition-colors duration-150 motion-reduce:transition-none",
        "hover:border-[var(--ds-gray-900)] active:border-[var(--ds-gray-1000)]",
        "focus-visible:outline-none focus-visible:shadow-[var(--ds-focus-ring)]",
        "disabled:pointer-events-none group-data-[disabled]:pointer-events-none group-data-[disabled]:opacity-50",
      )}
    />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
