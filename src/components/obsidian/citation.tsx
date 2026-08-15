import * as React from "react";
import { cn } from "@/lib/utils";

export interface CitationProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  index: number;
  source: string;
  quote: string;
}

/**
 * Superscript link-role `[n]` chip. Keyboard-focusable `<button>`; the popover
 * opens on hover AND focus (CSS `group-focus-within`, not a Radix HoverCard,
 * which does not reliably open on keyboard focus).
 */
export const Citation = React.forwardRef<HTMLButtonElement, CitationProps>(
  ({ index, source, quote, className, ...props }, ref) => {
    const popoverId = React.useId();
    return (
      <span className="group relative inline-block">
        <button
          ref={ref}
          type="button"
          aria-describedby={popoverId}
          className={cn(
            "align-super outline-none focus-visible:outline-2 focus-visible:outline-offset-2",
            "focus-visible:[outline-color:var(--focus-ring)]",
            className,
          )}
          style={{
            fontFamily: "var(--font-mono)",
            // U6 link-role ruling (DESIGN-TEMPO §2): citation/source chips
            // speak the one link role; blossom is retired from citations.
            color: "var(--link)",
            cursor: "pointer",
          }}
          {...props}
        >
          [{index}]
        </button>
        <span
          id={popoverId}
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-64 -translate-x-1/2 opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
          style={{
            backgroundColor: "var(--raised)",
            border: "1px solid var(--hairline-strong)",
            borderRadius: "var(--radius-panel)",
            padding: "12px 14px",
            backdropFilter: "blur(20px)",
            boxShadow: "var(--shadow-overlay)",
            transitionProperty: "opacity",
            transitionDuration: "var(--dur-control)",
            transitionTimingFunction: "var(--ease)",
          }}
        >
          <span
            className="block"
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            {source}
          </span>
          <span
            className="mt-1 block"
            style={{
              fontFamily: "var(--font-sans)",
              color: "var(--text-body)",
              lineHeight: 1.5,
            }}
          >
            {quote}
          </span>
        </span>
      </span>
    );
  },
);
Citation.displayName = "Citation";
