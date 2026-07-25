import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

/**
 * Ink Tabs — Tempo v5 design system, built on Radix Tabs.
 *
 * Interface for switching between related content sections.
 * Used on Project surface for stage selector (Plan/Design/Build/Ship/Launch/Grow).
 *
 * Structure:
 * - Tabs: root container
 * - TabsList: horizontal tab bar
 * - TabsTrigger: individual tab button (click to select)
 * - TabsContent: content panel (only active one renders)
 *
 * Usage:
 *   <Tabs defaultValue="plan">
 *     <TabsList>
 *       <TabsTrigger value="plan">Plan</TabsTrigger>
 *       <TabsTrigger value="build">Build</TabsTrigger>
 *     </TabsList>
 *     <TabsContent value="plan">Plan content</TabsContent>
 *     <TabsContent value="build">Build content</TabsContent>
 *   </Tabs>
 *
 * Keyboard support: Arrow keys to navigate, Enter/Space to select.
 * Focus: ember ring on active trigger. Accessibility: ARIA roles.
 */

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md",
      "bg-[var(--ds-gray-100)] p-1",
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
      "inline-flex items-center justify-center whitespace-nowrap",
      "rounded-sm px-3 py-2",
      "text-label-14 font-medium",
      "ring-offset-[var(--ds-background-100)]",
      "focus-visible:outline-none focus-visible:ring-2",
      "focus-visible:ring-[var(--ds-focus-color)] focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      // Unselected state
      "text-[var(--ds-gray-600)]",
      "hover:text-[var(--ds-gray-900)]",
      "transition-colors duration-200",
      // Selected state
      "data-[state=active]:bg-[var(--ds-background-100)]",
      "data-[state=active]:text-[var(--ds-gray-1000)]",
      "data-[state=active]:shadow-sm",
      // No animation when motion disabled
      "data-[motion=off]:transition-none",
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
      "mt-2 ring-offset-[var(--ds-background-100)]",
      "focus-visible:outline-none focus-visible:ring-2",
      "focus-visible:ring-[var(--ds-focus-color)]",
      "focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
