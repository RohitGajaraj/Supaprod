// AI-PULSE (founder ruling 2026-07-08, SW-7; v3.1): the live machine-activity
// line. ONE thing - the machine is working - shown in ONE place (the top bar).
// It shows the ACTION ("Drafting changes"), never the mission title. The
// shimmer is an ember-orange sheen (the landing register), flowing through the
// text AND the butterfly (the mark is masked by the same moving gradient), with
// a warm glow. Motion guards ride the styles.css classes. No human-gate tone:
// a paused run isn't "active work", so the pulse simply goes idle.
import * as React from "react";

export function AiPulse({
  label,
  state = "working",
  size = 12,
  style,
}: {
  /** The short action, e.g. "Drafting changes". Never the mission title. */
  label: string;
  /** working = ember shimmer + flutter; waiting = glacier + a calm attention
   *  pulse on the butterfly (so a pending action still catches the eye). */
  state?: "working" | "waiting";
  /** Font size in px; kept small and readable. */
  size?: number;
  style?: React.CSSProperties;
}) {
  const waiting = state === "waiting";
  const mark = Math.round(size * 1.2);
  return (
    <span
      className="flex items-center"
      role="status"
      aria-live="polite"
      style={{ gap: 7, minWidth: 0, ...style }}
    >
      <span
        aria-hidden="true"
        className={waiting ? "ai-pulse-mark waiting" : "ai-pulse-mark"}
        style={{ width: mark, height: mark }}
      />
      <span
        className={waiting ? "ai-pulse-text waiting" : "ai-pulse-text"}
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: size,
          fontWeight: 500,
          letterSpacing: "0.01em",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </span>
    </span>
  );
}
