import React from "react";

/** Bottom-center toast pill. Moss hairline for good news, plain for neutral. */
export function Toast({ tone = "moss", children, style }) {
  const border = tone === "moss" ? "rgba(127,191,142,0.4)" : "var(--hairline-strong)";
  const glow = tone === "moss" ? ", 0 0 18px rgba(127,191,142,0.12)" : "";
  return (
    <div
      style={{
        position: "fixed",
        bottom: 26,
        left: "50%",
        transform: "translateX(-50%)",
        background: "var(--raised)",
        border: `1px solid ${border}`,
        borderRadius: 99,
        padding: "9px 20px",
        fontFamily: "var(--font-ui)",
        fontSize: "13px",
        color: "var(--text-primary)",
        boxShadow: `0 8px 30px rgba(0,0,0,0.5)${glow}`,
        animation: "cadRise 200ms var(--ease) both",
        zIndex: 60,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
