// AI-PULSE (founder ruling 2026-07-08, SW-7; v3): the live machine-activity
// line. It shows the ACTION ("Drafting changes"), never the mission title, in
// ONE place (the top bar). The shimmer is the landing page's exact ember sheen
// and it passes through the butterfly too (the mark is masked by the same
// moving gradient). Working = ember, moving. The human gate = a calm STEADY
// glacier (stillness is the signal). Motion guards ride the styles.css classes.
import * as React from "react";

export function AiPulse({
  label,
  state = "working",
  size = 12,
  style,
}: {
  /** The short action, e.g. "Drafting changes". Never the mission title. */
  label: string;
  /** working = the machine (ember shimmer). waiting = your gate (glacier, still). */
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
