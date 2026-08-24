// AI-PULSE (founder ruling 2026-07-08, SW-7; recalibrated 2026-07-11 per
// founder ruling B): the live machine-activity line. ONE thing - the machine
// is working - shown in ONE place (the top bar). It shows the ACTION
// ("Drafting changes"), never the mission title. The shimmer follows the
// platform AI-presence signature: working = glacier gloss, waiting = ember
// gloss (the CSS maps both). The mark is the SupaprodMark (seven-petal loop),
// animated when the machine is working. Motion guards ride the styles.css classes.
import * as React from "react";
import { SupaprodMark } from "@/components/supaprod/SupaprodMark";

export function AiPulse({
  label,
  state = "working",
  size = 12,
  style,
}: {
  /** The short action, e.g. "Drafting changes". Never the mission title. */
  label: string;
  /** working = glacier gloss (the machine runs); waiting = ember gloss + a
   *  calm attention pulse on the mark (a pending action catches the eye). */
  state?: "working" | "waiting";
  /** Font size in px; kept small and readable. */
  size?: number;
  style?: React.CSSProperties;
}) {
  const waiting = state === "waiting";
  // The pixel C's cap height is ~70% of its font size, so 1.5x the label size
  // optically matches the old size*1.2 mark box.
  const mark = Math.round(size * 1.5);
  return (
    <span
      className="flex items-center"
      role="status"
      aria-live="polite"
      style={{ gap: 7, minWidth: 0, ...style }}
    >
      <span aria-hidden="true" className="shrink-0 inline-flex" style={{ lineHeight: 1 }}>
        <SupaprodMark size={mark} animated glow={false} />
      </span>
      <span
        className={waiting ? "ai-pulse-text waiting" : "ai-pulse-text"}
        style={{
          fontFamily: "var(--mrd-font)",
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
