import * as React from "react";

/**
 * PURE — the hero's two-part sentence. heroA is the one ember/moss italic
 * word per screen (README law: one italic emotional word max); heroB is the
 * plain tail. Exported standalone so the count->copy mapping is unit-tested
 * without mounting React (OBS-04.md §9, exact copy).
 */
export function computeHero(pendingCalls: number): { heroA: string; heroB: string } {
  if (pendingCalls <= 0) {
    return { heroA: "All clear.", heroB: " The loop is running itself." };
  }
  const heroA =
    pendingCalls === 1
      ? "One call"
      : pendingCalls === 2
        ? "Two calls"
        : pendingCalls === 3
          ? "Three calls"
          : `${pendingCalls} calls`;
  return { heroA, heroB: " need your judgment today." };
}

export interface HeroProps {
  greeting: string;
  userName: string;
  pendingCalls: number;
}

/** The Today ritual's opening line. Newsreader 34px, one ember (or moss at
 * all-clear) italic word, the rest plain. */
export function Hero({ greeting, userName, pendingCalls }: HeroProps) {
  const { heroA, heroB } = computeHero(pendingCalls);
  const allClear = pendingCalls <= 0;
  // Loom W2-TODAY: tightened vertical rhythm so the hero + the featured call
  // + the My-day strip + the machine pulse all land above the fold at 1440px
  // (DESIGN-LOOM §8b's 1.5-screen budget).
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9.5,
          letterSpacing: "0.14em",
          color: "var(--text-subtle)",
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        {greeting}, {userName}
      </div>
      <h1
        style={{
          fontFamily: "var(--font-serif)",
          fontWeight: 430,
          fontSize: "var(--text-hero)",
          lineHeight: 1.15,
          letterSpacing: "-0.015em",
          color: "var(--text-primary)",
          margin: 0,
          textWrap: "balance",
        }}
      >
        <em style={{ fontStyle: "italic", color: allClear ? "var(--moss)" : "var(--ember)" }}>
          {heroA}
        </em>
        {heroB}
      </h1>
    </div>
  );
}
