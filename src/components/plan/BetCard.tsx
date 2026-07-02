import { MonoLabel, VerdictChip } from "@/components/obsidian";
import type { RoadmapBucket } from "@/lib/roadmap.functions";
import { measureCaps } from "./format";

export interface BetCardProps {
  title: string;
  measure: string | null;
  outcome: string | null;
  column: RoadmapBucket;
  iceScore: number | null;
  hasOutcome: boolean;
  onMoveTo: (bucket: RoadmapBucket) => void;
}

const COLUMN_STYLE: Record<RoadmapBucket, { border: string; background: string; ink: string }> = {
  now: {
    border: "1px solid rgba(255, 107, 44, 0.25)",
    background: "var(--card)",
    ink: "var(--text-primary)",
  },
  next: {
    border: "1px solid var(--hairline)",
    background: "var(--card)",
    ink: "var(--text-primary)",
  },
  later: {
    border: "1px solid var(--hairline-faint)",
    background: "var(--surface-card-deep)",
    ink: "var(--text-muted)",
  },
};

const MOVE_TARGETS: { bucket: RoadmapBucket; label: string }[] = [
  { bucket: "now", label: "NOW" },
  { bucket: "next", label: "NEXT" },
  { bucket: "later", label: "LATER" },
];

/** Highlight number-like tokens in the mono measure line in glacier; the rest stays faint. */
function MeasureLine({ measure }: { measure: string }) {
  const parts = measure.split(/(-?\d[\d.,%]*)/g).filter((p) => p.length > 0);
  return (
    <span>
      {parts.map((part, i) => (
        <span key={i} style={{ color: /^-?\d/.test(part) ? "var(--glacier)" : undefined }}>
          {part}
        </span>
      ))}
    </span>
  );
}

/** OBS-07 §7 "Bet card anatomy": title + mono measure line + Needs-outcome chip + move controls. */
export function BetCard({
  title,
  measure,
  outcome: _outcome,
  column,
  iceScore: _iceScore,
  hasOutcome,
  onMoveTo,
}: BetCardProps) {
  const style = COLUMN_STYLE[column];
  const capped = measureCaps(measure);

  return (
    <div
      style={{
        borderRadius: "var(--radius-card)",
        padding: "16px 18px",
        border: style.border,
        background: style.background,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {/* REVISE resolves to the ember hex (#FF6B2C) — the primitive's existing ember-tone
          slot; reused here rather than inventing a new VerdictTone for one chip. */}
      {!hasOutcome && <VerdictChip tone="REVISE">NEEDS OUTCOME</VerdictChip>}
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: style.ink,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </span>
      {capped && (
        <MonoLabel style={{ fontSize: 8, color: "var(--text-faint)" }}>
          <MeasureLine measure={capped} />
        </MonoLabel>
      )}
      <span style={{ display: "flex", gap: 10, marginTop: 4 }}>
        {MOVE_TARGETS.map((t) => {
          const isCurrent = t.bucket === column;
          return (
            <button
              key={t.bucket}
              type="button"
              disabled={isCurrent}
              onClick={(e) => {
                e.stopPropagation();
                onMoveTo(t.bucket);
              }}
              className="outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-mono-label)",
                letterSpacing: "0.11em",
                textTransform: "uppercase",
                color: isCurrent ? "var(--text-faint)" : "var(--text-subtle)",
                background: "none",
                border: "none",
                padding: 0,
                cursor: isCurrent ? "default" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (!isCurrent) e.currentTarget.style.color = "var(--glacier)";
              }}
              onMouseLeave={(e) => {
                if (!isCurrent) e.currentTarget.style.color = "var(--text-subtle)";
              }}
            >
              {t.label}
            </button>
          );
        })}
      </span>
    </div>
  );
}
