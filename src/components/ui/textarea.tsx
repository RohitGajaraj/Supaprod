import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full resize-none rounded-(--ds-radius-small) border border-(--ds-gray-400) bg-(--ds-background-100) px-3 py-2.5 text-label-14 text-(--ds-gray-1000) outline-none transition-[border-color,box-shadow] duration-150 ease-(--ds-motion-timing-swift) motion-reduce:transition-none placeholder:text-(--ds-gray-700) hover:border-(--ds-gray-500) focus-visible:border-(--ds-gray-1000) focus-visible:shadow-(--ds-focus-ring) disabled:cursor-not-allowed disabled:border-(--ds-gray-400) disabled:bg-(--ds-gray-100) disabled:text-(--ds-gray-700) disabled:placeholder:text-(--ds-gray-700) disabled:opacity-100 disabled:hover:border-(--ds-gray-400) aria-invalid:border-(--ds-red-700) aria-invalid:hover:border-(--ds-red-700) aria-invalid:focus-visible:border-(--ds-red-700) aria-invalid:focus-visible:shadow-(--ds-focus-ring)",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
