import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "./primitives";

export interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * The a11y-carrying primitive (README §5.12): `role="dialog"` + `aria-modal`,
 * focus trap, restore-on-close, Esc + scrim-click close. Built on
 * `@radix-ui/react-dialog` (already vendored for `ui/sheet.tsx`) rather than
 * a hand-rolled trap: the prototype omits the trap and production must add
 * it, and Radix's implementation is the audited, battle-tested one.
 */
export function SlideOver({ open, onClose, title, footer, children }: SlideOverProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-40"
          style={{ backgroundColor: "rgba(4,4,5,0.6)", backdropFilter: "blur(3px)" }}
        />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 right-0 z-50 flex flex-col outline-none"
          style={{
            width: "480px",
            maxWidth: "92vw",
            backgroundColor: "#101013",
            borderLeft: "1px solid var(--hairline-strong)",
            boxShadow: "-30px 0 60px rgba(0,0,0,0.5)",
            animation: "cadSlideIn 240ms var(--ease)",
          }}
        >
          <div
            className="flex items-center justify-between gap-4"
            style={{ padding: "20px 24px", borderBottom: "1px solid var(--hairline)" }}
          >
            <DialogPrimitive.Title
              style={{
                fontFamily: "var(--font-serif)",
                // components.md "Mission slide-over": title Newsreader
                // 21px/460 - the one literal size given for this exact
                // header, distinct from CallCard's 20px --text-card-title.
                fontSize: "21px",
                fontWeight: 460,
                lineHeight: 1.3,
                color: "var(--text-primary)",
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <Button variant="quiet">CLOSE</Button>
            </DialogPrimitive.Close>
          </div>
          <div className="flex-1 overflow-y-auto" style={{ padding: "24px" }}>
            {children}
          </div>
          {footer ? (
            <div
              style={{
                padding: "14px 24px",
                borderTop: "1px solid var(--hairline)",
                // OBS-03.md step 9: "Footer strip helper: 11px --text-faint"
                // - 11px is a literal, no matching token (--text-helper is 11.5px).
                fontSize: "11px",
                color: "var(--text-faint)",
              }}
            >
              {footer}
            </div>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
