import { useEffect, useState } from "react";

const DISMISSED_KEY = "cadence.coachmark.today-badge";

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
      style={{
        position: "fixed",
        top: rect.top,
        left: rect.right + 14,
        zIndex: 60,
        width: 240,
        padding: "12px 14px",
        borderRadius: "var(--radius-panel, 14px)",
        background: "rgba(17,17,19,0.72)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderLeft: "2px solid var(--hairline-strong)",
        animation: "cadRise 260ms var(--ease) both",
      }}
    >
      <p style={{ fontSize: 13, color: "var(--text-body)", lineHeight: 1.5, margin: 0 }}>
        Your first teardown is being built. This badge is where decisions find you.
      </p>
      <button
        type="button"
        onClick={dismiss}
        style={{
          marginTop: 10,
          fontFamily: "var(--font-ui)",
          fontSize: 12,
          color: "var(--text-muted)",
          background: "transparent",
          border: "none",
          padding: 0,
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
