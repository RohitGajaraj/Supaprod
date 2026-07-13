import * as React from "react";
import { ArrowRight } from "lucide-react";
import { computeHero } from "@/components/obsidian/today/Hero";
import { CadenceMark } from "@/components/cadence/CadenceMark";

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
      {/* Brand watermark (founder 2026-07-14): a large monochrome mark bleeding
          into the empty bottom-right, cropped by the card, very faint and
          turning very slowly. A subtle brand touch, never overpowering. */}
      <div
        aria-hidden="true"
        className="hero-watermark-spin"
        style={{
          position: "absolute",
          right: -66,
          bottom: -84,
          width: 248,
          height: 248,
          opacity: 0.07,
          pointerEvents: "none",
        }}
      >
        <CadenceMark size={248} mono glow={false} />
      </div>

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
              fontFamily: "var(--font-pixel)",
              fontWeight: 400,
              fontSize: 18,
              letterSpacing: "0.02em",
              color: "var(--text-primary)",
              textShadow: `0 0 20px color-mix(in oklab, ${accent} 45%, transparent)`,
            }}
          >
            {userName}
          </span>
        </div>
        <h1
          style={{
            fontFamily: "var(--font-pixel)",
            fontWeight: 400,
            fontVariantNumeric: "tabular-nums",
            color: "var(--text-primary)",
            margin: 0,
            textWrap: "balance",
            maxWidth: "17ch",
            fontSize: "clamp(26px, 3vw, 38px)",
            lineHeight: 1.18,
            letterSpacing: "-0.005em",
          }}
        >
          <span
            style={{
              color: accent,
              textShadow: `0 0 28px color-mix(in oklab, ${accent} 48%, transparent)`,
            }}
          >
            {heroA}
          </span>
          <span style={{ color: "var(--text-primary)" }}>{heroB}</span>
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
