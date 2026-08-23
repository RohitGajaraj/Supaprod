"use client";

import * as React from "react";
import { type DialogProps } from "@radix-ui/react-dialog";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-(--ds-background-100) text-(--ds-gray-1000)",
      className,
    )}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName;

const CommandDialog = ({ children, ...props }: DialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0">
        {/* No layout overrides needed: heights, icon sizes, heading type, and the 6px
            popover container padding all come from CommandInput/CommandList/
            CommandGroup/CommandItem themselves per the popover anatomy law. */}
        <Command>{children}</Command>
      </DialogContent>
    </Dialog>
  );
};

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center border-b border-(--ds-gray-400) px-3" cmdk-input-wrapper="">
    {/* Leading search icon reads gray-700 per patterns/command-palette.md. */}
    <Search className="mr-2 h-4 w-4 shrink-0 text-(--ds-gray-700)" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-(--ds-size-large) w-full rounded-md bg-transparent py-3 text-label-14 outline-none placeholder:text-(--ds-gray-700) disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  </div>
));

CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    // 6px container padding: the shared popover anatomy (6px pad, 36px rows).
    className={cn(
      "max-h-[300px] overflow-y-auto overflow-x-hidden p-(--ds-popover-padding)",
      className,
    )}
    {...props}
  />
));

CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-6 text-center text-copy-13 text-(--ds-gray-900)"
    {...props}
  />
));

CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      // Heading type matches SelectLabel/DropdownMenuLabel (text-label-12 + medium,
      // gray-700). text-label-12 is a plain CSS class, not a Tailwind utility, so it
      // cannot ride an arbitrary variant; text-mrd-small leading-4 mirrors its 12px/16px.
      "overflow-hidden text-(--ds-gray-1000) [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-mrd-small [&_[cmdk-group-heading]]:leading-4 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-(--ds-gray-700)",
      className,
    )}
    {...props}
  />
));

CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    // -mx-1.5 bleeds the hairline through the 6px list padding, same as
    // SelectSeparator/DropdownMenuSeparator.
    className={cn("-mx-1.5 my-1 h-px bg-(--ds-gray-400)", className)}
    {...props}
  />
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      // Row anatomy matches the popover-menu-row convention used by dropdown-menu/
      // context-menu/menubar/select (tempo-v5/research/command-menu.md is the same
      // "menu row" pattern): 36px row height, 6px row radius, and the same
      // gray-200 highlight step so the palette reads as a sibling of those menus.
      "relative flex h-(--ds-popover-row-height) cursor-default gap-2 select-none items-center rounded-(--ds-popover-row-radius) px-2 text-label-14 text-(--ds-gray-1000) outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-(--ds-gray-200) data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      className,
    )}
    {...props}
  />
));

CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      // Same shortcut treatment as DropdownMenuShortcut: mono label, gray-700.
      className={cn("ml-auto text-label-12-mono text-(--ds-gray-700)", className)}
      {...props}
    />
  );
};
CommandShortcut.displayName = "CommandShortcut";

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
