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
  // SW-7 live-run copy fix: singular subject takes "needs" ("One call needs
  // your judgment"), plural stays "need".
  return {
    heroA,
    heroB: pendingCalls === 1 ? " needs your judgment today." : " need your judgment today.",
  };
}

export interface HeroProps {
  greeting: string;
  userName: string;
  pendingCalls: number;
}

/** The Today ritual's opening line. Geist Sans heading (text-heading-32),
 * one ember (or moss at all-clear) italic word, the rest plain. */
export function Hero({ greeting, userName, pendingCalls }: HeroProps) {
  const { heroA, heroB } = computeHero(pendingCalls);
  const allClear = pendingCalls <= 0;
  // Tempo brand moment (DESIGN-TEMPO §3/§8): the pending-calls numeral is
  // Today's ONE Geist Pixel element (pattern: MissionOrchestratorDetail's
  // compounding count). Only leading digits pixelate; the ember word itself
  // stays Geist Sans, so spelled counts (One/Two/Three) and the all-clear
  // line carry no Pixel at all. LoopStrip counts stay Geist Mono.
  const numeral = /^(\d+)([\s\S]*)$/.exec(heroA);
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
      {/* Migrated off the legacy --font-serif alias onto the Tempo heading
          class system (DESIGN-TEMPO §3): text-heading-32 is the closest step
          to the old 34px hero size. */}
      <h1
        className="text-heading-32"
        style={{
          color: "var(--text-primary)",
          margin: 0,
          textWrap: "balance",
        }}
      >
        <em style={{ fontStyle: "italic", color: allClear ? "var(--moss)" : "var(--ember)" }}>
          {numeral ? (
            <>
              <span
                style={{
                  fontFamily: "var(--font-pixel)",
                  fontWeight: 400,
                  fontStyle: "normal",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {numeral[1]}
              </span>
              {numeral[2]}
            </>
          ) : (
            heroA
          )}
        </em>
        {heroB}
      </h1>
    </div>
  );
}
