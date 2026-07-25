"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils";

// tempo-v5/research/tooltip.md: entry delay is ~150ms (Radix ships 700ms, far too
// slow for the spec), so the exported provider defaults delayDuration to 150.
const TooltipProvider = ({
  delayDuration = 150,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) => (
  <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />
);

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

// Semantic status variants (tempo-v5/research/tooltip.md "Custom type"): the whole
// surface takes the 700-step solid fill with contrast foreground, and the arrow
// follows the surface color. The bg utilities need "!" because .material-tooltip
// sets background in unlayered CSS, which beats layered Tailwind utilities.
const tooltipTypeStyles = {
  success: {
    content: "bg-(--ds-green-700)! text-(--ds-contrast-fg)",
    arrow: "fill-(--ds-green-700)",
  },
  error: {
    content: "bg-(--ds-red-700)! text-(--ds-contrast-fg)",
    arrow: "fill-(--ds-red-700)",
  },
  warning: {
    content: "bg-(--ds-amber-700)! text-(--ds-contrast-fg)",
    arrow: "fill-(--ds-amber-700)",
  },
} as const;

type TooltipType = keyof typeof tooltipTypeStyles;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
    /** Semantic status recolor; undefined keeps the neutral material-tooltip surface. */
    type?: TooltipType;
  }
>(({ className, sideOffset = 4, type, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "material-tooltip z-(--ds-z-tooltip) overflow-hidden px-3 py-1.5 text-label-13 duration-(--ds-motion-popover-duration) ease-(--ds-motion-timing-swift) motion-reduce:duration-150 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 motion-reduce:zoom-in-100 motion-reduce:data-[state=closed]:zoom-out-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-tooltip-content-transform-origin)",
        // Neutral text lives here (not in the base string) so typed variants swap
        // both surface and foreground without fighting utility cascade order.
        type ? tooltipTypeStyles[type].content : "text-(--ds-gray-1000)",
        className,
      )}
      {...props}
    >
      {props.children}
      <TooltipPrimitive.Arrow
        className={type ? tooltipTypeStyles[type].arrow : "fill-(--ds-background-100)"}
        height={5}
        width={11}
      />
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
