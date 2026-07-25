import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Ink Select — Tempo v5 design system, built on Radix Select.
 *
 * Dropdown selection control for form inputs and filters.
 *
 * Structure:
 * - Select: root provider
 * - SelectTrigger: button that opens the dropdown
 * - SelectValue: displays the selected item
 * - SelectContent: dropdown menu (portal)
 * - SelectItem: individual option
 * - SelectGroup: grouped options with label
 *
 * Usage:
 *   <Select defaultValue="apple">
 *     <SelectTrigger>
 *       <SelectValue placeholder="Choose..." />
 *     </SelectTrigger>
 *     <SelectContent>
 *       <SelectItem value="apple">Apple</SelectItem>
 *       <SelectItem value="banana">Banana</SelectItem>
 *     </SelectContent>
 *   </Select>
 *
 * Keyboard: Arrow keys navigate, Enter/Space select, ESC closes.
 * Focus: ember ring on trigger. Accessibility: ARIA listbox, roles.
 * Responsive: dropdown positions intelligently (above/below viewport).
 */

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md",
      "border border-[var(--ds-gray-400)]",
      "bg-[var(--ds-background-100)] px-3 py-2",
      "text-label-14 text-[var(--ds-gray-1000)]",
      "placeholder:text-[var(--ds-gray-600)]",
      "focus-visible:outline-none focus-visible:ring-2",
      "focus-visible:ring-[var(--ds-focus-color)]",
      "focus-visible:ring-offset-2",
      "focus-visible:ring-offset-[var(--ds-background-100)]",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "hover:border-[var(--ds-gray-500)]",
      "transition-colors",
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-60 min-w-[8rem] overflow-hidden rounded-md",
        "border border-[var(--ds-gray-400)]",
        "bg-[var(--ds-background-100)]",
        "text-[var(--ds-gray-1000)]",
        "shadow-md",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-2",
        "data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2",
        "data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className,
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      "py-1.5 pl-8 pr-2 text-label-12 font-semibold",
      "text-[var(--ds-gray-600)]",
      className,
    )}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2",
      "text-label-14",
      "focus:outline-none",
      "focus:bg-[var(--ds-gray-100)]",
      "focus:text-[var(--ds-gray-1000)]",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      "hover:bg-[var(--ds-gray-100)]",
      "transition-colors",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-[var(--ds-ember-600)]" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-[var(--ds-gray-400)]", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
};
