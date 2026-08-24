import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Anatomy: tempo-v5/research/input.md. Same three-tier control height as
// selectTriggerVariants in select.tsx (32/36/40px), medium default, with the
// horizontal padding stepping alongside the height.
const inputVariants = cva(
  // Focus draws NO ring: meridian.css suppresses focus-visible outlines on text
  // entry by design (the caret plus the border step to --mrd-field-focus answer
  // "where is the keyboard"), and the focus-ring-is-inherited guard fails any
  // non-exempt file that declares its own ring. The border steps carry focus,
  // including under aria-invalid.
  "flex w-full min-w-0 rounded-mrd-chip border border-mrd-field bg-mrd-bg text-mrd-base text-mrd-ink outline-none transition-[border-color,box-shadow] duration-150 ease-(--mrd-ease) motion-reduce:transition-none placeholder:text-mrd-faint file:border-0 file:bg-transparent file:text-mrd-base file:font-medium file:text-mrd-ink hover:border-mrd-field-focus focus-visible:border-mrd-field-focus disabled:cursor-not-allowed disabled:border-mrd-field disabled:bg-mrd-sink disabled:text-mrd-faint disabled:placeholder:text-mrd-faint disabled:opacity-100 disabled:hover:border-mrd-field aria-invalid:border-mrd-fail aria-invalid:hover:border-mrd-fail aria-invalid:focus-visible:border-mrd-fail",
  {
    variants: {
      size: {
        sm: "h-8 px-2.5",
        default: "h-9 px-3",
        lg: "h-10 px-3.5",
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
