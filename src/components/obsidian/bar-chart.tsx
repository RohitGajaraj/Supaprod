"use client";

import * as React from "react";

/**
 * BarChart - the modern interactive bar chart, the sibling of GraphSlider
 * (founder ruling 2026-07-07). Same interaction language as the graph slider:
 * clean exact bars in a data-palette color, a per-bar hover / focus readout,
 * an always-visible peak (top number) and floor (bottom number), and an
 * optional dashed baseline the bars are measured against. Non-active bars dim
 * so the read is unambiguous. Keyboard reachable; reduced motion handled by
 * the global CSS.
 *
 * This is the APP standard for bar data (the machine draws exact, per the
 * chart.tsx grammar). The hand-drawn pencil bar (cadence/Sketch SketchBar)
 * is reserved for the marketing landing page and the PM's own annotation
 * layer, never machine data on an app surface.
 */

export interface BarChartDatum {
  label: string;
  value: number;
}

export interface BarChartProps {
  data: BarChartDatum[];
  /** Series color from the DATA palette (never a role color). */
  color?: string;
  formatValue?: (v: number) => string;
  /** A reference the bars are measured against (a gate, target, or prior). */
  baseline?: number;
  baselineLabel?: string;
  ariaLabel?: string;
  /** Bar track height in px. */
  h?: number;
}

export function BarChart({
  data,
  color = "var(--teal)",
  formatValue = (v) => String(Math.round(v)),
  baseline,
  baselineLabel,
  ariaLabel,
  h = 96,
}: BarChartProps) {
  const [hover, setHover] = React.useState<number | null>(null);
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value), baseline ?? 0, 1);
  const activeIdx = hover ?? data.length - 1;
  const active = data[activeIdx]!;
  const baselinePct =
    baseline != null && baseline > 0 ? Math.min(100, (baseline / max) * 100) : null;

  return (
    <div role="group" aria-label={ariaLabel ?? "Bar chart"}>
      {/* Top axis: the active bar's readout + the peak it is measured against. */}
      <div
        className="mono-label tabular-nums"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 8,
          marginBottom: 6,
          fontSize: 9.5,
        }}
      >
        <span>
          <span style={{ color }}>{formatValue(active.value)}</span>
          <span style={{ color: "var(--text-subtle)" }}> · {active.label}</span>
        </span>
        <span style={{ color: "var(--text-faint)" }}>peak {formatValue(max)}</span>
      </div>

      {/* Bars: clean exact fills; hover or focus a bar to read it. */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "flex-end",
          gap: 4,
          height: h,
        }}
      >
        {baselinePct != null ? (
          <div
            aria-hidden="true"
            title={baselineLabel ?? "baseline"}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: `${baselinePct}%`,
              borderTop: "1px dashed var(--cornflower)",
            }}
          />
        ) : null}
        {data.map((d, i) => {
          const on = i === activeIdx;
          const pct = Math.max(2, (d.value / max) * 100);
          return (
            <button
              key={`${d.label}-${i}`}
              type="button"
              aria-label={`${d.label}: ${formatValue(d.value)}`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover((v) => (v === i ? null : v))}
              onFocus={() => setHover(i)}
              onBlur={() => setHover((v) => (v === i ? null : v))}
              className="outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
              style={{
                flex: 1,
                minWidth: 0,
                height: "100%",
                display: "flex",
                alignItems: "flex-end",
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  display: "block",
                  width: "100%",
                  height: `${pct}%`,
                  borderRadius: "3px 3px 0 0",
                  background: on ? color : `color-mix(in oklab, ${color} 42%, transparent)`,
                  transition:
                    "height 220ms var(--ease), background-color 160ms var(--ease)",
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Bottom axis: the floor (0 or the named baseline) + the range ends. */}
      <div
        className="mono-label"
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          marginTop: 6,
          fontSize: 8.5,
          color: "var(--text-faint)",
        }}
      >
        <span>{baselineLabel ?? "0"}</span>
        <span>
          {data.length > 1 ? `${data[0]!.label} · ${data[data.length - 1]!.label}` : data[0]!.label}
        </span>
      </div>
    </div>
  );
}
