import React from "react";

const STATES = {
  working: {
    dot: "var(--glacier)",
    glow: "0 0 8px 1px rgba(127,209,220,0.6)",
    anim: "cadPulse 2s ease-in-out infinite",
    color: "var(--glacier)",
    label: "WORKING",
  },
  thinking: {
    dot: "var(--blossom)",
    glow: "0 0 8px 1px rgba(229,189,223,0.55)",
    anim: "cadGlow 2.4s ease-in-out infinite",
    color: "var(--blossom)",
    label: "THINKING",
  },
  waiting: {
    dot: "var(--ember)",
    glow: "0 0 10px 2px rgba(255,107,44,0.55)",
    anim: "cadGlow 1.8s ease-in-out infinite",
    color: "var(--ember)",
    label: "WAITING ON YOU",
  },
  review: {
    dot: "var(--marigold)",
    glow: "0 0 8px 1px rgba(232,180,76,0.5)",
    anim: "none",
    color: "var(--marigold)",
    label: "IN REVIEW",
  },
  shipped: {
    dot: "var(--moss)",
    glow: "0 0 8px 1px rgba(127,191,142,0.5)",
    anim: "none",
    color: "var(--moss)",
    label: "SHIPPED",
  },
  blocked: {
    dot: "var(--madder)",
    glow: "0 0 8px 1px rgba(224,101,87,0.5)",
    anim: "none",
    color: "var(--madder)",
    label: "BLOCKED",
  },
  queued: {
    dot: "var(--text-faint)",
    glow: "none",
    anim: "none",
    color: "var(--text-subtle)",
    label: "QUEUED",
  },
};

/** Status dot + word. The word is never omitted (grayscale test). */
export function StatusDot({ status = "queued", label, showLabel = true, style }) {
  const s = STATES[status] || STATES.queued;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, ...style }}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 99,
          background: s.dot,
          boxShadow: s.glow,
          animation: s.anim,
          flex: "none",
        }}
      />
      {showLabel && (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "9.5px",
            letterSpacing: "0.1em",
            color: s.color,
          }}
        >
          {label || s.label}
        </span>
      )}
    </span>
  );
}
