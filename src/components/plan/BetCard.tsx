import { useState } from "react";
import { MonoLabel, VerdictChip } from "@/components/obsidian";
import type { RoadmapBucket } from "@/lib/roadmap.functions";
import { RoadmapHistory } from "@/components/product/RoadmapHistory";
import { relTimeCaps, traceRef } from "@/components/discover/format";
import { measureCaps, decisionOptionLabel } from "./format";

export interface BetCardProps {
  id: string;
  title: string;
  measure: string | null;
  outcome: string | null;
  column: RoadmapBucket;
  iceScore: number | null;
  hasOutcome: boolean;
  updatedAt: string | null;
  selected: boolean;
  onToggleSelect: (selected: boolean) => void;
  onMoveTo: (bucket: RoadmapBucket) => void;
  onEditOutcome: (values: { outcome: string; measure: string }) => void;
  editPending?: boolean;
}

// LOOM W2: v4 card treatment (DESIGN-LOOM §2) — every raised bet card
// carries the top-light + ambient shadow; NOW keeps its ember border via the
// layered --ember-line token (a line role, never a fill).
const COLUMN_STYLE: Record<RoadmapBucket, { border: string; background: string; ink: string }> = {
  now: {
    border: "1px solid var(--ember-line)",
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

const QUIET_MONO_STYLE = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-mono-label)",
  letterSpacing: "0.11em",
  textTransform: "uppercase" as const,
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer" as const,
};

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

/**
 * OBS-07 §7 "Bet card anatomy" + OBS-10 write parity: title + mono measure
 * line + Needs-outcome chip + move controls, plus a multi-select checkbox, an
 * inline outcome/measure editor for an already-committed bet (not just at
 * commit time), and the "why is this here" audit trail (RoadmapHistory,
 * reused unchanged).
 */
export function BetCard({
  id,
  title,
  measure,
  outcome,
  column,
  iceScore: _iceScore,
  hasOutcome,
  updatedAt,
  selected,
  onToggleSelect,
  onMoveTo,
  onEditOutcome,
  editPending = false,
}: BetCardProps) {
  const style = COLUMN_STYLE[column];
  const capped = measureCaps(measure);
  const [editing, setEditing] = useState(false);
  const [outcomeVal, setOutcomeVal] = useState(outcome ?? "");
  const [measureVal, setMeasureVal] = useState(measure ?? "");

  const startEdit = () => {
    setOutcomeVal(outcome ?? "");
    setMeasureVal(measure ?? "");
    setEditing(true);
  };
  const saveEdit = () => {
    const nextOutcome = outcomeVal.trim();
    const nextMeasure = measureVal.trim();
    if (!nextOutcome || !nextMeasure) return;
    onEditOutcome({ outcome: nextOutcome, measure: nextMeasure });
    setEditing(false);
  };

  return (
    <div
      style={{
        borderRadius: "var(--radius-card)",
        padding: "16px 18px",
        border: style.border,
        background: style.background,
        boxShadow: "var(--shadow-elevated)",
        transitionProperty: "box-shadow",
        transitionDuration: "var(--dur-press)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
      onMouseEnter={(e) => {
        // Hover catches the light: the top-light brightens one step (§2).
        e.currentTarget.style.boxShadow = "var(--top-light-hover), var(--shadow-ambient)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-elevated)";
      }}
    >
      {/* REVISE resolves to the ember hex (#FF6B2C) — the primitive's existing ember-tone
          slot; reused here rather than inventing a new VerdictTone for one chip. */}
      {!hasOutcome && <VerdictChip tone="REVISE">NEEDS OUTCOME</VerdictChip>}
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="checkbox"
          aria-label={`Select ${title}`}
          checked={selected}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onToggleSelect(e.target.checked)}
          style={{
            flexShrink: 0,
            width: 12,
            height: 12,
            cursor: "pointer",
            accentColor: "var(--ember)",
          }}
        />
        <span
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: 600,
            color: style.ink,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {decisionOptionLabel(title)}
        </span>
      </span>
      {capped && (
        <MonoLabel style={{ fontSize: "var(--text-mono-floor)", color: "var(--text-subtle)" }}>
          <MeasureLine measure={capped} />
        </MonoLabel>
      )}

      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
          <input
            autoFocus
            value={outcomeVal}
            onChange={(e) => setOutcomeVal(e.target.value)}
            placeholder="Outcome: what changes"
            maxLength={500}
            style={{
              fontSize: 11,
              padding: "5px 8px",
              border: "1px solid var(--hairline)",
              borderRadius: "var(--radius-control)",
              background: "var(--surface-raised)",
              color: "var(--text-primary)",
            }}
          />
          <input
            value={measureVal}
            onChange={(e) => setMeasureVal(e.target.value)}
            placeholder="Measure: how you'll know"
            maxLength={500}
            style={{
              fontSize: 11,
              padding: "5px 8px",
              border: "1px solid var(--hairline)",
              borderRadius: "var(--radius-control)",
              background: "var(--surface-raised)",
              color: "var(--text-primary)",
            }}
          />
          <span style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="loom-press"
              style={{ ...QUIET_MONO_STYLE, color: "var(--text-subtle)" }}
            >
              cancel
            </button>
            <button
              type="button"
              disabled={editPending || !outcomeVal.trim() || !measureVal.trim()}
              onClick={saveEdit}
              className="loom-press"
              style={{
                ...QUIET_MONO_STYLE,
                color: "var(--glacier)",
                opacity: editPending ? 0.5 : 1,
              }}
            >
              save
            </button>
          </span>
        </div>
      ) : (
        <span
          style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, flexWrap: "wrap" }}
        >
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
                className="loom-press outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
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
          <button
            type="button"
            onClick={startEdit}
            className="loom-press"
            style={{ ...QUIET_MONO_STYLE, color: "var(--text-subtle)" }}
          >
            {hasOutcome ? "EDIT OUTCOME" : "+ OUTCOME"}
          </button>
          <RoadmapHistory opportunityId={id} />
        </span>
      )}

      {/* Dim 17 trace-and-time tail: the bet is a first-class, auditable
          object (it is an opportunity, prefix OPP). The time reads a touch more
          present (--text-subtle) than the faint trace ref. */}
      <span
        style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2, flexWrap: "wrap" }}
      >
        {updatedAt ? (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-mono-floor)",
              letterSpacing: "0.06em",
              color: "var(--text-subtle)",
            }}
          >
            {relTimeCaps(updatedAt)}
          </span>
        ) : null}
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-mono-floor)",
            letterSpacing: "0.06em",
            color: "var(--text-faint)",
          }}
        >
          OPP·{traceRef(id)}
        </span>
      </span>
    </div>
  );
}
