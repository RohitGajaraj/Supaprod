import React from "react";

const TONES = {
  moss: {
    c: "var(--moss-bright)",
    bc: "rgba(127,191,142,0.45)",
    bg: "rgba(127,191,142,0.12)",
    sh: "0 0 12px rgba(127,191,142,0.15)",
  },
  madder: {
    c: "var(--madder-bright)",
    bc: "rgba(224,101,87,0.45)",
    bg: "rgba(224,101,87,0.12)",
    sh: "0 0 12px rgba(224,101,87,0.15)",
  },
  ember: {
    c: "#FF8B52",
    bc: "rgba(255,107,44,0.45)",
    bg: "rgba(255,107,44,0.12)",
    sh: "0 0 12px rgba(255,107,44,0.15)",
  },
  glacier: {
    c: "var(--glacier)",
    bc: "rgba(127,209,220,0.45)",
    bg: "rgba(127,209,220,0.12)",
    sh: "0 0 12px rgba(127,209,220,0.15)",
  },
  blossom: {
    c: "var(--blossom)",
    bc: "rgba(229,189,223,0.45)",
    bg: "rgba(229,189,223,0.12)",
    sh: "0 0 12px rgba(229,189,223,0.15)",
  },
  marigold: {
    c: "var(--marigold)",
    bc: "rgba(232,180,76,0.45)",
    bg: "rgba(232,180,76,0.12)",
    sh: "0 0 12px rgba(232,180,76,0.15)",
  },
};

const VERDICT_TONES = {
  VALIDATED: "moss",
  SHIP: "moss",
  KEPT: "moss",
  SHIPPED: "moss",
  MISSED: "madder",
  KILL: "madder",
  FAILED: "madder",
  REVISE: "ember",
  "BY AGENT": "glacier",
  "EVIDENCE THIN": "blossom",
  "IN REVIEW": "marigold",
  "CRITIC REVIEW": "marigold",
  PENDING: "slate",
  DRAFTING: "glacier",
};

/** Mono-caps verdict chip. Tinted 12% fill, soft glow. The machine's judgment. */
export function VerdictChip({ verdict = "VALIDATED", tone, style }) {
  const t = TONES[tone || VERDICT_TONES[verdict] || "glacier"] || {
    c: "var(--text-subtle)",
    bc: "rgba(255,255,255,0.14)",
    bg: "transparent",
    sh: "none",
  };
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "9.5px",
        letterSpacing: "0.1em",
        fontWeight: 600,
        color: t.c,
        background: t.bg,
        border: `1px solid ${t.bc}`,
        borderRadius: 99,
        padding: "2px 9px",
        boxShadow: t.sh,
        display: "inline-flex",
        alignItems: "center",
        ...style,
      }}
    >
      {verdict}
    </span>
  );
}
