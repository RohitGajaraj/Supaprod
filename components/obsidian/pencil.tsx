import * as React from "react";
import { cn } from "@/lib/utils";

export type PencilInk = "best-bet" | "pet-feature" | "scope-creep";

const PENCIL_INK_COLOR: Record<PencilInk, string> = {
  "best-bet": "var(--pencil-lime)",
  "pet-feature": "var(--pencil-blossom)",
  "scope-creep": "var(--pencil-apricot)",
};

export interface PencilNoteProps extends React.HTMLAttributes<HTMLSpanElement> {
  ink: PencilInk;
}

/**
 * The PM's own handwritten annotation. Positioned by the caller (typically
 * absolute, top-right -11px per the anatomy). NOT `aria-hidden`: it is
 * content, marked `role="note"` instead. Restraint budget: at most two per
 * screen (enforced at the call site).
 */
export const PencilNote = React.forwardRef<HTMLSpanElement, PencilNoteProps>(
  ({ ink, className, style, children, ...props }, ref) => (
    <span
      ref={ref}
      role="note"
      className={cn("inline-block", className)}
      style={{
        fontFamily: "var(--font-pencil)",
        fontSize: "17px",
        color: PENCIL_INK_COLOR[ink],
        transform: "rotate(-2deg)",
        textDecoration: "underline",
        textDecorationColor: PENCIL_INK_COLOR[ink],
        textUnderlineOffset: "3px",
        filter: `drop-shadow(0 0 4px ${PENCIL_INK_COLOR[ink]})`,
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  ),
);
PencilNote.displayName = "PencilNote";
