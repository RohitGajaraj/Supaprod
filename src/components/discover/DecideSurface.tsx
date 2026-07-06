import { OpportunityQueue } from "./OpportunityQueue";

/**
 * The decide stage of the loop (2026-07-07). The ranked opportunity queue used
 * to be the cramped third column of Discover; it now owns its own destination
 * between Discover (sense) and Plan (define). Promoting a theme on Discover
 * sends its bet here, where the Critic red-teams it and the human decides what
 * is worth building. Reuses OpportunityQueue as-is in one readable column.
 */
export function DecideSurface() {
  return (
    <div
      className="mx-auto animate-[cadRise_260ms_var(--ease)_both]"
      style={{
        maxWidth: "var(--container-standard)",
        width: "100%",
        padding: "36px 32px 64px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Loom §2b glow field: the one ambient wash behind the hero. */}
      <div aria-hidden="true" className="loom-glow-field" />
      <h1
        style={{
          fontFamily: "var(--font-serif)",
          fontWeight: 430,
          fontSize: "var(--text-h1)",
          letterSpacing: "-0.015em",
          lineHeight: 1.2,
          color: "var(--text-primary)",
          margin: 0,
        }}
      >
        Decide. <em style={{ color: "var(--ember-text)" }}>The bets worth making.</em>
      </h1>
      {/* Loom v4 §6: the hero underline, the maker's mark, static, 24px. */}
      <div
        aria-hidden="true"
        style={{
          width: "24px",
          height: "1px",
          background: "var(--thread-gradient)",
          opacity: 0.4,
          margin: "10px 0 24px",
        }}
      />
      <p
        style={{
          fontSize: "var(--text-base)",
          color: "var(--text-muted)",
          margin: "0 0 24px",
          maxWidth: "640px",
          lineHeight: 1.6,
        }}
      >
        The ranked opportunities, red-teamed by the Critic. Promote what is worth building and it
        moves to Plan.
      </p>

      <div
        className="grid grid-cols-1 items-start lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]"
        style={{ gap: "28px" }}
      >
        <div>
          <OpportunityQueue />
        </div>
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--top-light), var(--shadow-ambient)",
            padding: "18px 20px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: "var(--font-ui)",
              fontSize: 15,
              fontWeight: 600,
              color: "var(--text-primary)",
              lineHeight: 1.3,
            }}
          >
            How deciding works
          </h2>
          <ol
            style={{
              listStyle: "none",
              margin: "14px 0 0",
              padding: 0,
              display: "grid",
              gap: "12px",
            }}
          >
            {[
              "Every promoted theme lands here as a ranked bet.",
              "Challenge any bet and the Critic red-teams it with receipts, never vibes.",
              "Promote what is worth building and it moves to Define.",
            ].map((line, i) => (
              <li key={i} style={{ display: "flex", gap: "10px", alignItems: "baseline" }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    fontVariantNumeric: "tabular-nums",
                    color: "var(--glacier)",
                    flexShrink: 0,
                  }}
                >
                  {i + 1}.
                </span>
                <span style={{ fontSize: "12.5px", lineHeight: 1.6, color: "var(--text-body)" }}>
                  {line}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
