import * as React from "react";
import { ArrowRight } from "lucide-react";
import { computeHero } from "@/components/obsidian/today/Hero";

// TodayHeroCard — the daily-landing hero, rethought (founder addendum
// 2026-07-13). A single card-based "command" band that grounds the user and
// asks ONE question. A LIVING aurora carries the day's tone (ember + maroon
// when a call needs you, moss + gold when the loop runs itself, brought back
// from Loom); the greeting spotlights the person by name; the count headline
// leads in Geist Pixel (the screen's ONE brand moment); the overnight machine
// line and the single primary action follow.

export function TodayHeroCard({
  greeting,
  userName,
  pendingCalls,
  pulseLine,
  onAnswer,
}: {
  greeting: string;
  userName: string;
  pendingCalls: number;
  /** The 24h loop-pulse sentence (what the machine did while you were away). */
  pulseLine?: string;
  /** Opens the single highest-stakes call; shown only when one pends. */
  onAnswer?: () => void;
}) {
  const { heroA, heroB } = computeHero(pendingCalls);
  const allClear = pendingCalls <= 0;
  // The two aura tones per state: the lead accent + its warm partner. Pending
  // = ember warmed by maroon (the "needs you" aura); all-clear = moss lifted
  // by gold (the calm "running itself" aura).
  const accent = allClear ? "var(--moss)" : "var(--ember)";
  const accent2 = allClear ? "var(--marigold)" : "var(--madder)";

  return (
    <div
      className="glass-panel"
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "var(--radius-panel, 16px)",
        padding: "28px 30px",
        marginBottom: 18,
      }}
    >
      {/* Living aurora — two slow, offset radial blooms that drift (paused
          under prefers-reduced-motion). The tone tells the day's state. */}
      <div
        aria-hidden="true"
        className="hero-aurora hero-aurora-a"
        style={{
          background: `radial-gradient(58% 92% at 84% 2%, color-mix(in oklab, ${accent} 32%, transparent) 0%, transparent 70%)`,
        }}
      />
      <div
        aria-hidden="true"
        className="hero-aurora hero-aurora-b"
        style={{
          background: `radial-gradient(52% 84% at 8% 34%, color-mix(in oklab, ${accent2} 26%, transparent) 0%, transparent 72%)`,
        }}
      />
      {/* Faint constellation motif — grid-born delight, threaded in the tone. */}
      <svg
        aria-hidden="true"
        width="200"
        height="72"
        viewBox="0 0 200 72"
        fill="none"
        style={{ position: "absolute", right: 20, top: 18, opacity: 0.5, pointerEvents: "none" }}
      >
        <path d="M14 52 L58 24 L100 44 L140 16 L184 38" stroke="var(--hairline-strong)" strokeWidth="1" />
        <circle cx="58" cy="24" r="2.5" fill={accent} opacity="0.7" />
        <circle cx="140" cy="16" r="2.5" fill={accent2} opacity="0.6" />
        <circle cx="14" cy="52" r="2" fill="var(--text-faint)" />
        <circle cx="100" cy="44" r="2" fill="var(--text-faint)" />
        <circle cx="184" cy="38" r="2" fill="var(--text-subtle)" />
      </svg>

      <div style={{ position: "relative" }}>
        {/* Spotlighted greeting: the localized hello (Namaste / Buenos días /
            Good evening) in a warm voice, the PERSON named in a bright, larger
            weight so the day opens with them, not with chrome. */}
        <div
          style={{
            fontSize: 15,
            lineHeight: 1.2,
            color: "var(--text-muted)",
            marginBottom: 14,
            letterSpacing: "0.01em",
          }}
        >
          {greeting},{" "}
          <span
            style={{
              fontWeight: 680,
              fontSize: 17,
              color: "var(--text-primary)",
              textShadow: `0 0 22px color-mix(in oklab, ${accent} 40%, transparent)`,
            }}
          >
            {userName}
          </span>
        </div>
        <h1
          style={{
            color: "var(--text-primary)",
            margin: 0,
            textWrap: "balance",
            maxWidth: "20ch",
            fontSize: "clamp(30px, 3.4vw, 42px)",
            lineHeight: 1.08,
            letterSpacing: "-0.015em",
            fontWeight: 600,
          }}
        >
          <em
            style={{
              fontFamily: "var(--font-pixel)",
              fontWeight: 400,
              fontStyle: "normal",
              fontVariantNumeric: "tabular-nums",
              color: accent,
              marginRight: "0.12em",
              textShadow: `0 0 26px color-mix(in oklab, ${accent} 45%, transparent)`,
            }}
          >
            {heroA}
          </em>
          {heroB}
        </h1>

        {pulseLine ? (
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.5,
              color: "var(--text-muted)",
              margin: "14px 0 0",
              maxWidth: "60ch",
            }}
          >
            {pulseLine}
          </p>
        ) : null}

        {!allClear && onAnswer ? (
          <button
            type="button"
            onClick={onAnswer}
            className="loom-press inline-flex items-center outline-none transition-transform duration-150 ease-(--ds-motion-timing-swift) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
            style={{
              gap: 8,
              marginTop: 18,
              padding: "10px 17px",
              borderRadius: "var(--radius-control, 8px)",
              background: "var(--ember)",
              color: "#fff",
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 6px 20px -8px color-mix(in oklab, var(--ember) 72%, transparent)",
            }}
          >
            Answer the first call
            <ArrowRight size={15} strokeWidth={2} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
