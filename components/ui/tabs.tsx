import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // rounded-(--ds-radius-small) = 6px (materials.css); rounded-lg was an off-grid 8px value.
      // gray-100/gray-900 = component background + secondary text roles (contract section 2).
      "inline-flex h-9 items-center justify-center rounded-(--ds-radius-small) bg-(--ds-gray-100) p-1 text-(--ds-gray-900)",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // Focus ring standardized to the --ds-focus-ring box-shadow pattern (matches every
      // other primitive -- button/input/checkbox/etc); the old ring-offset utility diverged.
      // Active trigger lifts via the small border shadow preset, not a raw Tailwind shadow,
      // and transitions only the properties that actually change (swift easing, reduced-motion gated).
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-label-14 cursor-pointer transition-[background-color,color,box-shadow] duration-150 ease-(--ds-motion-timing-swift) motion-reduce:transition-none focus-visible:outline-none focus-visible:shadow-(--ds-focus-ring) disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed data-[state=active]:bg-(--ds-background-100) data-[state=active]:text-(--ds-gray-1000) data-[state=active]:shadow-(--ds-shadow-border-small)",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 focus-visible:outline-none focus-visible:shadow-(--ds-focus-ring)",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
