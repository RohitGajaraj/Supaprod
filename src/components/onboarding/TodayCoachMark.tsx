import { useEffect, useState } from "react";

const DISMISSED_KEY = "supaprod.coachmark.today-badge";

function anchorRect(): DOMRect | null {
  const el =
    document.querySelector('[data-coach-anchor="today-badge"]') ??
    document.querySelector('[data-coach-anchor="today-badge-row"]');
  return el ? el.getBoundingClientRect() : null;
}

/**
 * OBS-14 - the one coach mark the whole product shows. Anchors to the Today
 * nav badge (falling back to the row itself when the badge is not currently
 * rendered, e.g. zero pending calls at the moment of landing) and dismisses
 * forever via a localStorage flag - there is no tour and no second mark.
 */
export function TodayCoachMark({ onDismiss }: { onDismiss: () => void }) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    setRect(anchorRect());
    const onResize = () => setRect(anchorRect());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!rect) return null;

  function dismiss() {
    window.localStorage.setItem(DISMISSED_KEY, "1");
    onDismiss();
  }

  return (
    <div
      role="status"
      className="material-menu"
      style={{
        // Tempo v5 materials law (DESIGN-TEMPO.md section 4): the floating
        // mark wears the menu preset (12px radius, background-100, menu
        // shadow) instead of a hand-rolled dark-glass trio, so it resolves
        // in both themes from the same tokens.
        position: "fixed",
        top: rect.top,
        left: rect.right + 14,
        zIndex: "var(--ds-z-toast)",
        width: 240,
        padding: "12px 14px",
        animation: "cadRise 260ms var(--ds-motion-timing-swift) both",
      }}
    >
      <p style={{ color: "var(--text-body)", lineHeight: 1.5, margin: 0 }}>
        Your teardown is here. New calls will find you at this badge.
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="loom-press text-button-12 outline-none transition-colors hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
        style={{
          marginTop: 10,
          color: "var(--text-muted)",
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        Got it
      </button>
    </div>
  );
}

export function todayCoachMarkDismissed(): boolean {
  return window.localStorage.getItem(DISMISSED_KEY) === "1";
}

/**
 * Pure decision, extracted so it is testable without a DOM/localStorage
 * shim: the mark shows only on the one landing right after onboarding hands
 * off, and never again once "Got it" has been clicked.
 */
export function shouldShowCoachMark(justLanded: boolean, dismissedBefore: boolean): boolean {
  return justLanded && !dismissedBefore;
}
