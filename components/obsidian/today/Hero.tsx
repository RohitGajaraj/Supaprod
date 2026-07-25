import * as React from "react";

/**
 * PURE: the hero's two-part sentence. heroA is the one ember/moss emphasis
 * phrase per screen (rendered in Geist Pixel, Today's one brand moment);
 * heroB is the plain tail. Exported standalone so the count->copy mapping is
 * unit-tested without mounting React (OBS-04.md §9, exact copy).
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

/** The Today ritual's opening line. Geist Sans heading (text-heading-32);
 * the lead phrase renders in Geist Pixel with the ember (or moss at
 * all-clear) role color, the rest plain. */
export function Hero({ greeting, userName, pendingCalls }: HeroProps) {
  const { heroA, heroB } = computeHero(pendingCalls);
  const allClear = pendingCalls <= 0;
  // Tempo brand moment (DESIGN-TEMPO §3/§8, U7 founder emphasis 2026-07-11):
  // the hero's lead phrase (heroA) is Today's ONE Geist Pixel element, on
  // EVERY state. The old digits-only rule left spelled counts (One/Two/Three)
  // and the all-clear line with no Pixel at all, so the hero face was
  // invisible most of the time; now the whole lead phrase pixelates and the
  // plain tail (heroB) stays Geist Sans. Pixel is a fixed 400 display face
  // with no italic, so the emphasis <em> keeps its role color (ember, moss
  // at all-clear) but drops the slant. ColdStartOnramp (which replaces this
  // hero on a cold workspace, never co-renders) carries the Pixel budget in
  // that state instead. (LoopStrip itself was retired and deleted 2026-07-11.)
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
        <em
          style={{
            fontFamily: "var(--font-pixel)",
            fontWeight: 400,
            fontStyle: "normal",
            fontVariantNumeric: "tabular-nums",
            color: allClear ? "var(--moss)" : "var(--ember)",
          }}
        >
          {heroA}
        </em>
        {heroB}
      </h1>
    </div>
  );
}
