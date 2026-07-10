import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-(--ds-size-medium) w-full min-w-0 rounded-(--ds-radius-small) border border-(--ds-gray-400) bg-(--ds-background-100) px-3 text-label-14 text-(--ds-gray-1000) outline-none transition-[border-color,box-shadow] duration-150 ease-(--ds-motion-timing-swift) motion-reduce:transition-none placeholder:text-(--ds-gray-700) file:border-0 file:bg-transparent file:text-label-14 file:font-medium file:text-(--ds-gray-1000) hover:border-(--ds-gray-500) focus-visible:border-(--ds-gray-1000) focus-visible:shadow-(--ds-focus-ring) disabled:cursor-not-allowed disabled:border-(--ds-gray-400) disabled:bg-(--ds-gray-100) disabled:text-(--ds-gray-700) disabled:placeholder:text-(--ds-gray-700) disabled:opacity-100 disabled:hover:border-(--ds-gray-400) aria-invalid:border-(--ds-red-700) aria-invalid:hover:border-(--ds-red-700) aria-invalid:focus-visible:border-(--ds-red-700) aria-invalid:focus-visible:shadow-(--ds-focus-ring)",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
