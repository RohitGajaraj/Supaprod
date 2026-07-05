import React from "react";

const INKS = {
  lime: { c: "var(--pencil-lime)", glow: "rgba(205,224,122,0.4)", under: "rgba(205,224,122,0.75)" },
  blossom: {
    c: "var(--pencil-blossom)",
    glow: "rgba(229,189,223,0.4)",
    under: "rgba(229,189,223,0.75)",
  },
  apricot: {
    c: "var(--pencil-apricot)",
    glow: "rgba(255,178,122,0.4)",
    under: "rgba(255,178,122,0.75)",
  },
};

/** Pencil annotation: the PM's own handwriting. Max two per screen. */
export function Pencil({ ink = "lime", rotate = -2, children, style }) {
  const t = INKS[ink] || INKS.lime;
  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        fontFamily: "var(--font-pencil)",
        fontSize: "19px",
        fontWeight: 600,
        color: t.c,
        transform: `rotate(${rotate}deg)`,
        textShadow: `0 0 14px ${t.glow}`,
        borderBottom: `2px solid ${t.under}`,
        padding: "0 2px",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
