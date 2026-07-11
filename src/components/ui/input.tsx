import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Anatomy: tempo-v5/research/input.md. Same three-tier control height as
// selectTriggerVariants in select.tsx (32/36/40px), medium default, with the
// horizontal padding stepping alongside the height.
const inputVariants = cva(
  "flex w-full min-w-0 rounded-(--ds-radius-small) border border-(--ds-gray-400) bg-(--ds-background-100) text-label-14 text-(--ds-gray-1000) outline-none transition-[border-color,box-shadow] duration-150 ease-(--ds-motion-timing-swift) motion-reduce:transition-none placeholder:text-(--ds-gray-700) file:border-0 file:bg-transparent file:text-label-14 file:font-medium file:text-(--ds-gray-1000) hover:border-(--ds-gray-500) focus-visible:border-(--ds-gray-1000) focus-visible:shadow-(--ds-focus-ring) disabled:cursor-not-allowed disabled:border-(--ds-gray-400) disabled:bg-(--ds-gray-100) disabled:text-(--ds-gray-700) disabled:placeholder:text-(--ds-gray-700) disabled:opacity-100 disabled:hover:border-(--ds-gray-400) aria-invalid:border-(--ds-red-700) aria-invalid:hover:border-(--ds-red-700) aria-invalid:focus-visible:border-(--ds-red-700) aria-invalid:focus-visible:shadow-(--ds-focus-ring)",
  {
    variants: {
      size: {
        sm: "h-(--ds-size-small) px-2.5",
        default: "h-(--ds-size-medium) px-3",
        lg: "h-(--ds-size-large) px-3.5",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

const Input = React.forwardRef<
  HTMLInputElement,
  // Omit the native size attribute (a character-width number) so the cva size
  // variant can own the prop name, matching select.tsx.
  Omit<React.ComponentProps<"input">, "size"> & VariantProps<typeof inputVariants>
>(({ className, type, size, ...props }, ref) => {
  return (
    <input type={type} className={cn(inputVariants({ size }), className)} ref={ref} {...props} />
  );
});
Input.displayName = "Input";

export { Input };
