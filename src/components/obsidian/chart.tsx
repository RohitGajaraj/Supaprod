import * as React from "react";

// OBS-15 - the precise machine-data chart grammar. Obsidian reverses the
// parchment "hand-sketched data marks" law (founder directive 2026-06-12,
// src/components/cadence/Sketch.tsx): the machine draws exact vectors, and
// only a PM's own annotation is rough graphite (see pencil-mark.tsx). No
// jitter, no wobble, anywhere in this file.

export interface ChartFrameProps {
  w: number;
  h: number;
  children: React.ReactNode;
  pad?: number;
}

/** The `<svg>` canvas. No border, no fill of its own - the caller's `--card`
 * is the frame. Decoration layers (axes, series) mark themselves
 * `aria-hidden`; the caller supplies the accessible label for the data. */
export function ChartFrame({ w, h, children }: ChartFrameProps) {
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ display: "block", maxWidth: "100%" }}
    >
      {children}
    </svg>
  );
}

export interface AxesProps {
  w: number;
  h: number;
  xTicks?: string[];
  yTicks?: string[];
  pad?: number;
}

/** Grid + axis lines, slate at 40% opacity, 1px; mono 8.5px caps tick labels
 * in ash. Purely decorative. */
export function Axes({ w, h, xTicks = [], yTicks = [], pad = 20 }: AxesProps) {
  return (
    <g aria-hidden="true">
      <line
        x1={pad}
        y1={h - pad}
        x2={w - 4}
        y2={h - pad}
        stroke="var(--slate)"
        strokeOpacity={0.4}
        strokeWidth={1}
      />
      <line
        x1={pad}
        y1={4}
        x2={pad}
        y2={h - pad}
        stroke="var(--slate)"
        strokeOpacity={0.4}
        strokeWidth={1}
      />
      {yTicks.map((label, i) => (
        <text
          key={label}
          x={pad - 6}
          y={4 + (i / Math.max(1, yTicks.length - 1)) * (h - pad - 4)}
          textAnchor="end"
          fontFamily="var(--font-mono)"
          fontSize={8.5}
          letterSpacing="0.10em"
          fill="var(--ash)"
        >
          {label}
        </text>
      ))}
      {xTicks.map((label, i) => (
        <text
          key={label}
          x={pad + (i / Math.max(1, xTicks.length - 1)) * (w - pad - 4)}
          y={h - pad + 12}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize={8.5}
          letterSpacing="0.10em"
          fill="var(--ash)"
        >
          {label}
        </text>
      ))}
    </g>
  );
}

function points(data: number[], w: number, h: number, pad: number): [number, number][] {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const px = (i: number) => pad + i * ((w - pad - 6) / Math.max(1, data.length - 1));
  const py = (v: number) => h - pad - ((v - min) / span) * (h - pad - 6);
  return data.map((v, i) => [px(i), py(v)]);
}

function polylinePoints(pts: [number, number][]): string {
  return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

export interface SeriesLineProps {
  data: number[];
  w: number;
  h: number;
  color?: string;
  pad?: number;
}

/** The machine's own series: one exact `<polyline>`, straight segments, no
 * jitter. Default teal - the machine-measured family. */
export function SeriesLine({ data, w, h, color = "var(--teal)", pad = 20 }: SeriesLineProps) {
  if (data.length < 2) return null;
  const pts = points(data, w, h, pad);
  return (
    <polyline
      points={polylinePoints(pts)}
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );
}

export interface BenchmarkProps {
  data: number[];
  value: number;
  w: number;
  h: number;
  color?: string;
  pad?: number;
}

/** A dashed baseline (an eval gate, a drift-zero reference) - an
 * instrument, not an observation, so it stays perfectly straight. */
export function Benchmark({
  data,
  value,
  w,
  h,
  color = "var(--cornflower)",
  pad = 20,
}: BenchmarkProps) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  if (value < min || value > max) return null;
  const span = max - min || 1;
  const y = h - pad - ((value - min) / span) * (h - pad - 6);
  return (
    <line x1={pad} y1={y} x2={w - 6} y2={y} stroke={color} strokeWidth={1} strokeDasharray="4 3" />
  );
}

export interface NeedsHumanPointProps {
  x: number;
  y: number;
}

/** The ONE ember marker a chart may ever carry - a data point that needs a
 * human. At most one per chart (enforced at the call site). */
export function NeedsHumanPoint({ x, y }: NeedsHumanPointProps) {
  return (
    <circle
      cx={x}
      cy={y}
      r={3}
      fill="var(--ember)"
      style={{ filter: "drop-shadow(0 0 10px rgba(255,107,44,0.55))" }}
    />
  );
}

export interface SparklineProps {
  data: number[];
  color?: string;
  w?: number;
  h?: number;
  /** Optional reference line (eval gate, drift zero), drawn dashed and
   * straight - kept as the one prop `SketchLine` also carried, so a call
   * site swaps the import without touching its props. */
  baseline?: number;
}

/** The obsidian replacement for `SketchLine` on machine data: a single
 * exact series, no axes, a dot only on the last value. Same prop shape as
 * `SketchLine` by design. */
export function Sparkline({
  data,
  color = "var(--teal)",
  w = 210,
  h = 42,
  baseline,
}: SparklineProps) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const px = (i: number) => 5 + i * ((w - 10) / Math.max(1, data.length - 1));
  const py = (v: number) => h - 6 - ((v - min) / span) * (h - 12);
  const pts = data.map((v, i): [number, number] => [px(i), py(v)]);
  const baseY = baseline != null && baseline >= min && baseline <= max ? py(baseline) : null;
  const [endX, endY] = pts[pts.length - 1]!;
  return (
    <svg width={w} height={h} aria-hidden="true" style={{ display: "block", maxWidth: "100%" }}>
      {baseY != null ? (
        <line x1={5} x2={w - 5} y1={baseY} y2={baseY} stroke="var(--slate)" strokeDasharray="4 3" />
      ) : null}
      <polyline
        points={polylinePoints(pts)}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={endX} cy={endY} r={3} fill={color} />
    </svg>
  );
}

export interface ChartTooltipRow {
  label: string;
  value: string;
}

export interface ChartTooltipProps {
  x: number;
  y: number;
  rows: ChartTooltipRow[];
}

/** A quiet `--raised` card at a data point. No glow. */
export function ChartTooltip({ x, y, rows }: ChartTooltipProps) {
  return (
    <div
      role="tooltip"
      style={{
        position: "absolute",
        left: x,
        top: y,
        background: "var(--raised)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-control)",
        padding: "6px 10px",
        pointerEvents: "none",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
      }}
    >
      {rows.map((r) => (
        <div key={r.label} style={{ color: "var(--text-subtle)" }}>
          {r.label} · {r.value}
        </div>
      ))}
    </div>
  );
}
