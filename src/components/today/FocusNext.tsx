// SF-FOCUS (Signal Fabric Phase 1) — the one calm "Focus on this next" card,
// re-homed on the My-day strip (Loom W2-TODAY). Renders the single
// highest-ranked emerging theme as a proactive recommendation: name the
// outcome (the headline), let the operator Start it (HITL) or expand Why
// (the evidence). Calm-front: when there is no clear next (insight is null),
// it renders NOTHING. Restyled from the parchment-era Tailwind theme to the
// Obsidian/Loom tokens; logic and API unchanged.
import { useState } from "react";
import { Button, MonoLabel } from "@/components/obsidian";
import type { FocusInsight } from "@/lib/brain/insights.functions";

export function FocusNext({
  insight,
  onStart,
  isStarting,
  onFocusThis,
}: {
  insight: FocusInsight | null;
  onStart: (goal: string) => void;
  isStarting: boolean;
  /** PM Desk: adopt the suggestion as a focus-block intent (prefills the composer). */
  onFocusThis?: (headline: string) => void;
}) {
  const [showWhy, setShowWhy] = useState(false);
  if (!insight) return null;

  const ev = insight.evidence;
  return (
    <section>
      <MonoLabel style={{ fontSize: 9.5 }}>Cadence suggests</MonoLabel>
      <h3
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: 17,
          fontWeight: 460,
          lineHeight: 1.3,
          color: "var(--text-primary)",
          margin: "6px 0 0",
        }}
      >
        {insight.headline}
      </h3>
      {insight.detail ? (
        <p
          style={{
            fontSize: 13,
            lineHeight: 1.55,
            color: "var(--text-muted)",
            margin: "4px 0 0",
          }}
        >
          {insight.detail}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center" style={{ gap: 10, marginTop: 10 }}>
        {onFocusThis ? (
          <Button
            variant="tertiary"
            onClick={() => onFocusThis(insight.headline)}
            style={{ fontSize: 12, padding: "6px 14px" }}
          >
            Focus on this
          </Button>
        ) : null}
        {insight.recommendedAction ? (
          <Button
            variant={onFocusThis ? "tertiary" : "secondary"}
            loading={isStarting}
            onClick={() => onStart(insight.recommendedAction!.goal)}
            style={{ fontSize: 12, padding: "6px 14px" }}
          >
            {isStarting ? "Starting" : "Send to an agent"}
          </Button>
        ) : null}
        {/* Loom §0.1.1 correction on sight: the Why toggle was a banned bare
            text-button; it is now a real tertiary control. */}
        <Button
          variant="tertiary"
          onClick={() => setShowWhy((v) => !v)}
          style={{ fontSize: 12, padding: "6px 14px" }}
        >
          {showWhy ? "Hide why" : "Why"}
        </Button>
      </div>

      {showWhy ? (
        <div className="flex flex-wrap" style={{ gap: 6, marginTop: 10 }}>
          <Chip label="theme" value={ev.title} />
          <Chip label="severity" value={`${ev.severity}/5`} />
          <Chip label="confidence" value={ev.confidence.toFixed(2)} />
          <Chip label="novelty" value={ev.novelty == null ? "new" : ev.novelty.toFixed(2)} />
          <Chip label="recency" value={`${Math.round(ev.recencyHours)}h`} />
          <Chip label="score" value={ev.score.toFixed(3)} />
        </div>
      ) : null}
    </section>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span
      className="inline-flex items-center"
      style={{
        gap: 5,
        fontFamily: "var(--font-mono)",
        fontSize: 10.5,
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-pill)",
        padding: "2px 8px",
        color: "var(--text-muted)",
      }}
    >
      <span style={{ color: "var(--text-subtle)" }}>{label}</span>
      <span className="max-w-[16rem] truncate" style={{ color: "var(--text-body)" }}>
        {value}
      </span>
    </span>
  );
}
