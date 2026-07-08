// AI-PULSE (founder ruling 2026-07-08, SW-7 live-run): whenever the machine is
// working, every surface says so with a small, readable, continuously moving
// one-liner - the landing page's flowing sheen rebuilt on the AZURE working
// voice (founder call: not ember, which reads as Claude Code; not glacier),
// with --violet-shimmer as the moving highlight (the one place the contract
// allows it). Motion guards ride the .ai-pulse-text class in styles.css.
import * as React from "react";

export function AiPulse({
  label,
  size = 11,
  style,
}: {
  /** The one-liner: what the machine is doing right now. Keep it short. */
  label: string;
  /** Font size in px; stays small and readable per the ruling. */
  size?: number;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className="flex items-center"
      role="status"
      aria-live="polite"
      style={{ gap: 7, minWidth: 0, ...style }}
    >
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: "#6f9bff",
          animation: "pulse-dot 1.6s ease-in-out infinite",
          flexShrink: 0,
        }}
      />
      <span
        className="ai-pulse-text"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: size,
          letterSpacing: "0.05em",
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
