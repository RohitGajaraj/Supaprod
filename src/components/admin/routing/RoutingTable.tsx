/**
 * The routing console table (architecture §10, brief §11): one row per real
 * CallSurface. Geist Mono carries every number (cost, latency, eval score)
 * so operators trust them at a glance (taste commitment 7). Zero vendor
 * names hardcoded - every model shown comes from the live registry data
 * the server function returns.
 */
import { useState } from "react";
import { VerdictChip } from "@/components/ink";
import type { RoutingRow, RoutingSurface } from "@/lib/routing-console.functions";

type LiveModel = { id: string; label: string; provider: string; tier: string };

function committedValue(row: RoutingRow): string {
  return row.setting.kind === "pinned" ? row.setting.modelId : "";
}

function modelLabel(models: LiveModel[], id: string | null): string {
  if (!id) return "-";
  return models.find((m) => m.id === id)?.label ?? id;
}

function th(): React.CSSProperties {
  return {
    padding: "8px 12px",
    fontFamily: "var(--font-mono)",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    textAlign: "left",
    color: "var(--ink-subtle)",
    fontWeight: 500,
    whiteSpace: "nowrap",
  };
}

function td(): React.CSSProperties {
  return {
    padding: "10px 12px",
    verticalAlign: "middle",
    color: "var(--ink-body)",
    borderTop: "1px solid var(--ink-hairline)",
  };
}

function mono(): React.CSSProperties {
  return {
    fontFamily: "var(--font-mono)",
    color: "var(--ink-text)",
    fontVariantNumeric: "tabular-nums",
  };
}

function fmtCost(v: number | null): string {
  if (v === null) return "-";
  return `$${v < 0.01 ? v.toFixed(4) : v.toFixed(3)}`;
}

function fmtLatency(v: number | null): string {
  if (v === null) return "-";
  return v >= 1000 ? `${(v / 1000).toFixed(1)}s` : `${Math.round(v)}ms`;
}

function fmtEval(v: number | null): string {
  return v === null ? "-" : v.toFixed(0);
}

function SurfaceRow({
  row,
  liveModels,
  onPin,
  onApplyRecommendation,
  pending,
}: {
  row: RoutingRow;
  liveModels: LiveModel[];
  onPin: (surface: RoutingSurface, modelId: string | null) => void;
  onApplyRecommendation: (surface: RoutingSurface, modelId: string) => void;
  pending: boolean;
}) {
  const committed = committedValue(row);
  const [draft, setDraft] = useState(committed);
  const noModel = row.setting.kind === "no-model";
  const dirty = !noModel && draft !== committed;

  return (
    <tr>
      <td style={{ ...td(), fontFamily: "var(--font-mono)", color: "var(--ink-text)" }}>
        {row.surface}
      </td>
      <td style={td()}>
        {noModel ? (
          <VerdictChip tone="neutral">NO MODEL</VerdictChip>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--geist-space-2x)", flexWrap: "wrap" }}>
            <select
              className="ink-focus ink-input-focus"
              aria-label={`Model setting for ${row.surface}`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={pending}
              style={{
                fontFamily: "var(--font-sans)",
                background: "var(--ink-raised)",
                color: "var(--ink-text)",
                border: "1px solid var(--ink-hairline)",
                borderRadius: "var(--ink-radius-control)",
                padding: "6px 8px",
                minWidth: 160,
              }}
            >
              <option value="">Auto ({modelLabel(liveModels, row.autoModelId)})</option>
              {liveModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            {dirty ? (
              <button
                type="button"
                className="ink-focus"
                disabled={pending}
                onClick={() => onPin(row.surface, draft || null)}
                style={{
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--voice-human)",
                  border: "1px solid var(--voice-human-border)",
                  borderRadius: "var(--ink-radius-control)",
                  padding: "6px 10px",
                  background: "var(--voice-human-soft)",
                  cursor: pending ? "default" : "pointer",
                }}
              >
                Apply
              </button>
            ) : row.setting.kind === "pinned" ? (
              <VerdictChip tone="human">PINNED</VerdictChip>
            ) : (
              <VerdictChip tone="machine">AUTO</VerdictChip>
            )}
          </div>
        )}
      </td>
      <td style={{ ...td(), ...mono() }}>{fmtCost(row.costPerTaskUsd7d)}</td>
      <td style={{ ...td(), ...mono() }}>{fmtLatency(row.latencyP50Ms7d)}</td>
      <td style={{ ...td(), ...mono() }}>
        {fmtEval(row.evalScore)}
        <span style={{ marginLeft: 6, color: "var(--ink-subtle)", fontFamily: "var(--font-sans)" }}>
          ({row.callCount7d} calls, 7d)
        </span>
      </td>
      <td style={td()}>
        {row.recommendation ? (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--geist-space-2x)", flexWrap: "wrap" }}>
            <span style={{ color: "var(--ink-text)" }}>
              {modelLabel(liveModels, row.recommendation.modelId)}
            </span>
            <button
              type="button"
              className="ink-focus"
              disabled={pending}
              onClick={() =>
                row.recommendation && onApplyRecommendation(row.surface, row.recommendation.modelId)
              }
              style={{
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--voice-machine)",
                border: "1px solid var(--ink-hairline)",
                borderRadius: "var(--ink-radius-control)",
                padding: "6px 10px",
                background: "transparent",
                cursor: pending ? "default" : "pointer",
              }}
            >
              Apply
            </button>
          </div>
        ) : (
          <span style={{ color: "var(--ink-faint)" }}>
            {row.recommendationReason ?? "no eval data yet"}
          </span>
        )}
      </td>
    </tr>
  );
}

export function RoutingTable({
  rows,
  liveModels,
  onPin,
  onApplyRecommendation,
  pending,
}: {
  rows: RoutingRow[];
  liveModels: LiveModel[];
  onPin: (surface: RoutingSurface, modelId: string | null) => void;
  onApplyRecommendation: (surface: RoutingSurface, modelId: string) => void;
  pending: boolean;
}) {
  return (
    <div className="ink-panel" style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={th()}>Surface</th>
            <th style={th()}>Setting</th>
            <th style={th()}>Cost / task</th>
            <th style={th()}>Latency (p50)</th>
            <th style={th()}>Eval</th>
            <th style={th()}>Recommendation</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <SurfaceRow
              key={`${row.surface}-${committedValue(row)}`}
              row={row}
              liveModels={liveModels}
              onPin={onPin}
              onApplyRecommendation={onApplyRecommendation}
              pending={pending}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
