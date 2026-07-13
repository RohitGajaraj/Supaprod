import * as React from "react";
import { ArrowRight } from "lucide-react";
import { computeHero } from "@/components/obsidian/today/Hero";

// TodayHeroCard — the daily-landing hero, rethought (founder addendum
// 2026-07-13). A single card-based "command" band that grounds the user and
// asks ONE question. Modern treatment within Tempo: a soft ember-tinted
// gradient wash + glass border while a call pends (calm/moss when the loop is
// running itself), a faint constellation motif for delight, the greeting in
// the mono voice, the count headline with its Geist Pixel lead phrase (the
// screen's ONE brand moment), the overnight machine line, and — when a call
// waits — the single primary action that moves the day forward.

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
  const accent = allClear ? "var(--moss)" : "var(--ember)";

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "var(--radius-panel, 16px)",
        border: "1px solid var(--hairline)",
        // Soft depth + a glass read; the tinted wash is layered on top.
        background: "color-mix(in oklab, var(--card) 82%, transparent)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        boxShadow: "var(--shadow-elevated, 0 12px 32px -18px rgba(0,0,0,0.55))",
        padding: "26px 28px",
        marginBottom: 18,
      }}
    >
      {/* Ambient wash — a single directional gradient in the day's tone. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(120% 140% at 88% -20%, color-mix(in oklab, ${accent} 16%, transparent) 0%, transparent 55%)`,
          pointerEvents: "none",
        }}
      />
      {/* Faint constellation motif — grid-born delight, ember/moss threaded. */}
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
        <circle cx="140" cy="16" r="2.5" fill="var(--text-subtle)" />
        <circle cx="14" cy="52" r="2" fill="var(--text-faint)" />
        <circle cx="100" cy="44" r="2" fill="var(--text-faint)" />
        <circle cx="184" cy="38" r="2" fill="var(--text-subtle)" />
      </svg>

      <div style={{ position: "relative" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--text-subtle)",
            marginBottom: 12,
          }}
        >
          {greeting}, {userName}
        </div>
        <h1
          className="text-heading-32"
          style={{ color: "var(--text-primary)", margin: 0, textWrap: "balance", maxWidth: "22ch" }}
        >
          <em
            style={{
              fontFamily: "var(--font-pixel)",
              fontWeight: 400,
              fontStyle: "normal",
              fontVariantNumeric: "tabular-nums",
              color: accent,
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
              margin: "12px 0 0",
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
              padding: "9px 16px",
              borderRadius: "var(--radius-control, 8px)",
              background: "var(--ember)",
              color: "#fff",
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 6px 18px -8px color-mix(in oklab, var(--ember) 70%, transparent)",
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
