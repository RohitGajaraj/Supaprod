// AI-PULSE (founder ruling 2026-07-08, SW-7; recolored to brand + logo mark
// 2026-07-08): whenever the machine is working, every surface says so with a
// small, readable, continuously moving one-liner. The mark is the Cadence
// butterfly fluttering (a logo in motion, the Anthropic/Kiro pattern - not a
// generic blinking dot). Two tones on the brand's warm register (founder call:
// the AI-blue read as generic slop):
//   working = amber/gold shimmer (the machine humming);
//   human   = rose/fuchsia (a decision that needs YOU - a distinct hue).
// Motion guards ride the .ai-pulse-text / .ai-pulse-mark classes in styles.css.
import * as React from "react";

export function AiPulse({
  label,
  size = 11,
  tone = "working",
  style,
}: {
  /** The one-liner: what the machine is doing right now. Keep it short. */
  label: string;
  /** Font size in px; stays small and readable per the ruling. */
  size?: number;
  /** working = the machine (amber). human = a gate that needs you (rose). */
  tone?: "working" | "human";
  style?: React.CSSProperties;
}) {
  return (
    <span
      className="flex items-center"
      role="status"
      aria-live="polite"
      style={{ gap: 6, minWidth: 0, ...style }}
    >
      <img
        src={tone === "human" ? "/assets/butterfly-idle.svg" : "/assets/butterfly-ember.svg"}
        alt=""
        aria-hidden="true"
        className="ai-pulse-mark shrink-0"
        width={Math.round(size * 1.25)}
        height={Math.round(size * 1.25)}
        style={{ opacity: 0.95 }}
      />
      <span
        className={tone === "human" ? "ai-pulse-text human" : "ai-pulse-text"}
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: size,
          letterSpacing: "0.02em",
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
