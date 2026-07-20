// ComposerOverlay (Mission Control, front-end reimagining Phase 2): the
// centered summon for the shortcut keys (the TopBar Ask button and its key
// open the SAME composer, Addendum 1.1 rule 4). The shell opens this with
// the docked composer collapsed, so exactly one input box exists on screen.
// Escape or the backdrop closes it. Same ComposerSurface as the dock: one
// input model, one behavior contract.

import * as React from "react";
import { ComposerSurface, type ComposerSurfaceProps } from "./Composer";

export interface ComposerOverlayProps extends Omit<
  ComposerSurfaceProps,
  "onEscape" | "autoFocus" | "className"
> {
  open: boolean;
  onClose: () => void;
  /** Rendered above the surface (the global summon shows the answer thread
   *  here on old-app surfaces; the room leaves it empty - its Thread is the
   *  column behind). */
  children?: React.ReactNode;
}

export function ComposerOverlay({ open, onClose, children, ...surface }: ComposerOverlayProps) {
  // Escape closes even when focus sits outside the textarea (the popover,
  // a journey chip); the surface's own Escape handles the textarea case.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      data-testid="composer-overlay"
      className="fixed inset-0 z-50 overflow-y-auto p-4"
      style={{ background: "rgba(9, 9, 11, 0.6)" }}
      onMouseDown={(e) => {
        // Backdrop only; clicks inside the panel never close.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Ask Supaprod"
        className="mx-auto mt-[16vh] w-full max-w-[640px] rounded-xl border p-3"
        style={{ background: "var(--ink-raised)", borderColor: "var(--ink-hairline)" }}
      >
        {children}
        <ComposerSurface {...surface} onEscape={onClose} />
      </div>
    </div>
  );
}
