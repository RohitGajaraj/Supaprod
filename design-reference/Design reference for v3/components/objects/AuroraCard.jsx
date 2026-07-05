import React from "react";

const STATES = {
  healthy: {
    bg: "#0F1B12",
    blobA: "rgba(232,180,76,0.38)",
    blobB: "rgba(120,200,150,0.42)",
    glow: "0 0 55px rgba(127,209,220,0.10), 0 0 90px rgba(232,180,76,0.07)",
  },
  attention: {
    bg: "#180F15",
    blobA: "rgba(229,189,223,0.36)",
    blobB: "rgba(255,107,44,0.30)",
    glow: "0 0 55px rgba(229,189,223,0.10), 0 0 90px rgba(255,107,44,0.07)",
  },
  failing: {
    bg: "#1A0F0E",
    blobA: "rgba(224,101,87,0.36)",
    blobB: "rgba(255,107,44,0.24)",
    glow: "0 0 55px rgba(224,101,87,0.12)",
  },
};

/** Aurora score card: the only sanctioned gradient. Score moments only. */
export function AuroraCard({ label, score, note, state = "healthy", style }) {
  const s = STATES[state] || STATES.healthy;
  return (
    <div
      style={{
        borderRadius: "var(--radius-aurora)",
        padding: "20px 22px",
        position: "relative",
        overflow: "hidden",
        background: s.bg,
        border: "1px solid var(--hairline-strong)",
        boxShadow: s.glow,
        fontFamily: "var(--font-ui)",
        ...style,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "-40%",
          left: "-25%",
          width: "110%",
          height: "110%",
          borderRadius: 99,
          background: `radial-gradient(closest-side, ${s.blobA}, transparent 70%)`,
          animation: "cadDriftA 9s ease-in-out infinite",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "-45%",
          left: "-15%",
          width: "130%",
          height: "120%",
          borderRadius: 99,
          background: `radial-gradient(closest-side, ${s.blobB}, transparent 70%)`,
          animation: "cadDriftB 12s ease-in-out infinite",
        }}
      />
      <div style={{ position: "relative" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "8.5px",
            letterSpacing: "0.14em",
            color: "rgba(242,240,237,0.75)",
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: "var(--font-dotted)",
            fontSize: "52px",
            lineHeight: 1.1,
            color: "var(--text-primary)",
            letterSpacing: "0.04em",
            margin: "4px 0 0",
          }}
        >
          {score}
        </div>
        {note && (
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "8.5px",
              letterSpacing: "0.12em",
              color: "rgba(242,240,237,0.65)",
              textTransform: "uppercase",
            }}
          >
            {note}
          </div>
        )}
      </div>
    </div>
  );
}
