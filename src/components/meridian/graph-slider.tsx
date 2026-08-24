"use client";

import * as React from "react";

/**
 * GraphSlider - the interactive trend graph (founder ruling 2026-07-07,
 * reference rauno.me/craft/graph-slider). A trend that goes up or down is
 * drawn once here and reused everywhere: a grayscale base line + a colored
 * layer revealed by a clip up to a moving cursor, a dot on the cursor point,
 * a value readout that tracks it, and always-on peak / low markers plus an
 * optional baseline (what it is measured against). Scrub with the pointer,
 * or focus and use the arrow keys.
 *
 * The machine draws exact vectors (chart.tsx grammar); this component adds
 * the interaction + the smooth trend read. Colors come from the data palette
 * (never role colors): the caller passes the family (tangerine for spend,
 * teal for the machine series, and so on).
 */

const PAD_X = 12;
const PAD_TOP = 22;
const PAD_BOTTOM = 24;

/** y for a value on the same scale the points use (single source, shared by
 * the points and the baseline). */
export function graphY(value: number, data: readonly number[], h: number): number {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const innerH = h - PAD_TOP - PAD_BOTTOM;
  return PAD_TOP + innerH - ((value - min) / span) * innerH;
}

/** x for a point index across the plot width. */
export function graphX(i: number, n: number, w: number): number {
  const innerW = w - PAD_X * 2;
  return PAD_X + (n <= 1 ? 0 : (i / (n - 1)) * innerW);
}

export function graphPoints(data: readonly number[], w: number, h: number): [number, number][] {
  return data.map((v, i) => [graphX(i, data.length, w), graphY(v, data, h)]);
}

/** A smooth line through every point using horizontal-midpoint cubic control
 * points: gentle, no overshoot beyond the data's own range. */
export function smoothLinePath(pts: readonly [number, number][]): string {
  if (pts.length === 0) return "";
  let d = `M ${pts[0]![0].toFixed(2)} ${pts[0]![1].toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]!;
    const [x1, y1] = pts[i]!;
    const cx = (x0 + x1) / 2;
    d += ` C ${cx.toFixed(2)} ${y0.toFixed(2)}, ${cx.toFixed(2)} ${y1.toFixed(2)}, ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  }
  return d;
}

/** The data index nearest a pointer x (already scaled into viewBox coords). */
export function nearestIndex(relX: number, w: number, n: number): number {
  if (n <= 1) return 0;
  const innerW = w - PAD_X * 2;
  const t = (relX - PAD_X) / innerW;
  return Math.max(0, Math.min(n - 1, Math.round(t * (n - 1))));
}

export function indexOfExtreme(data: readonly number[], kind: "max" | "min"): number {
  let best = 0;
  for (let i = 1; i < data.length; i++) {
    if (kind === "max" ? data[i]! > data[best]! : data[i]! < data[best]!) best = i;
  }
  return best;
}

export interface GraphSliderProps {
  data: number[];
  /** Optional x-axis label per point (e.g. a date); shown in the readout. */
  labels?: string[];
  w?: number;
  h?: number;
  /** Series color from the DATA palette (never a role color). */
  color?: string;
  /** How the value reads in the cursor + marker labels. */
  formatValue?: (v: number) => string;
  /** A reference line the trend is measured against (cap, eval gate, zero). */
  baseline?: number;
  baselineLabel?: string;
  /** Accessible description of what the series is. */
  ariaLabel?: string;
}

/** A single readout chip drawn in-SVG (scales with the viewBox, so it never
 * drifts from the dot the way an HTML overlay would on a responsive svg). */
function Readout({
  x,
  value,
  sub,
  w,
  color,
}: {
  x: number;
  value: string;
  sub: string | null;
  w: number;
  color: string;
}) {
  const cw = Math.max(value.length, sub?.length ?? 0) * 6.6 + 16;
  const cx = Math.max(2, Math.min(w - cw - 2, x - cw / 2));
  const ch = sub ? 30 : 18;
  return (
    <g aria-hidden="true" style={{ pointerEvents: "none" }}>
      <rect
        x={cx}
        y={2}
        width={cw}
        height={ch}
        rx={6}
        fill="var(--mrd-lift)"
        stroke="var(--mrd-edge)"
      />
      <text
        x={cx + cw / 2}
        y={sub ? 13 : 14}
        textAnchor="middle"
        fontFamily="var(--mrd-mono)"
        fontSize={11}
        fontWeight={600}
        fill={color}
      >
        {value}
      </text>
      {sub ? (
        <text
          x={cx + cw / 2}
          y={25}
          textAnchor="middle"
          fontFamily="var(--mrd-mono)"
          fontSize={8.5}
          letterSpacing="0.08em"
          fill="var(--mrd-mute)"
        >
          {sub}
        </text>
      ) : null}
    </g>
  );
}

export function GraphSlider({
  data,
  labels,
  w = 300,
  h = 140,
  color = "var(--teal)",
  formatValue = (v) => String(Math.round(v)),
  baseline,
  baselineLabel,
  ariaLabel,
}: GraphSliderProps) {
  const n = data.length;
  const [cursor, setCursor] = React.useState(Math.max(0, n - 1));
  const [active, setActive] = React.useState(false);
  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const rid = React.useId().replace(/:/g, "");
  const clipId = `gs-clip-${rid}`;
  const colorGrad = `gs-color-${rid}`;
  const grayGrad = `gs-gray-${rid}`;

  React.useEffect(() => {
    setCursor((c) => Math.max(0, Math.min(n - 1, c)));
  }, [n]);

  if (n < 2) {
    return (
      <div
        style={{
          fontFamily: "var(--mrd-mono)",
          color: "var(--mrd-mute)",
          padding: "8px 0",
        }}
      >
        {n === 1 ? formatValue(data[0]!) : "Not enough points to draw a trend yet."}
      </div>
    );
  }

  const pts = graphPoints(data, w, h);
  const line = smoothLinePath(pts);
  const floor = h - PAD_BOTTOM;
  const area = `${line} L ${pts[n - 1]![0].toFixed(2)} ${floor} L ${pts[0]![0].toFixed(2)} ${floor} Z`;
  const idxMax = indexOfExtreme(data, "max");
  const idxMin = indexOfExtreme(data, "min");
  const cur = pts[cursor]!;
  const baseY = baseline != null ? graphY(baseline, data, h) : null;

  const moveTo = (clientX: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const relX = ((clientX - rect.left) / rect.width) * w;
    setCursor(nearestIndex(relX, w, n));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      setActive(true);
      setCursor((c) => Math.max(0, Math.min(n - 1, c + (e.key === "ArrowRight" ? 1 : -1))));
    } else if (e.key === "Home") {
      e.preventDefault();
      setCursor(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setCursor(n - 1);
    }
  };

  const curLabel = labels?.[cursor] ?? null;

  return (
    <svg
      ref={svgRef}
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      role="slider"
      tabIndex={0}
      aria-label={ariaLabel ?? "Trend"}
      aria-valuemin={Math.min(...data)}
      aria-valuemax={Math.max(...data)}
      aria-valuenow={data[cursor]!}
      aria-valuetext={`${formatValue(data[cursor]!)}${curLabel ? `, ${curLabel}` : ""}`}
      style={{
        display: "block",
        maxWidth: "100%",
        touchAction: "none",
        cursor: "ew-resize",
        // No outline:none: the global focus-visible ring is
        // this slider's keyboard focus indicator (Tempo: never removed).
        borderRadius: "var(--radius-control)",
      }}
      onPointerMove={(e) => {
        setActive(true);
        moveTo(e.clientX);
      }}
      onPointerDown={(e) => {
        (e.target as Element).setPointerCapture?.(e.pointerId);
        setActive(true);
        moveTo(e.clientX);
      }}
      onPointerLeave={() => {
        setActive(false);
        setCursor(n - 1);
      }}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      onKeyDown={onKeyDown}
    >
      <defs>
        <linearGradient id={colorGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
        <linearGradient id={grayGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--slate)" stopOpacity={0.16} />
          <stop offset="100%" stopColor="var(--slate)" stopOpacity={0} />
        </linearGradient>
        <clipPath id={clipId}>
          <rect x={0} y={0} width={cur[0]} height={h} />
        </clipPath>
      </defs>

      {/* Baseline: the instrument line the trend is measured against. */}
      {baseY != null ? (
        <g aria-hidden="true">
          <line
            x1={PAD_X}
            y1={baseY}
            x2={w - PAD_X}
            y2={baseY}
            stroke="var(--cornflower)"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
          {baselineLabel ? (
            <text
              x={w - PAD_X}
              y={baseY - 4}
              textAnchor="end"
              fontFamily="var(--mrd-mono)"
              fontSize={8.5}
              letterSpacing="0.08em"
              fill="var(--cornflower)"
            >
              {baselineLabel}
            </text>
          ) : null}
        </g>
      ) : null}

      {/* Base (grayscale) area + line: the full series, de-emphasized. */}
      <path d={area} fill={`url(#${grayGrad})`} aria-hidden="true" />
      <path
        d={line}
        fill="none"
        stroke="var(--slate)"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      />

      {/* Colored layer, revealed up to the cursor via the clip. */}
      <g clipPath={`url(#${clipId})`} aria-hidden="true">
        <path d={area} fill={`url(#${colorGrad})`} />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Peak and low markers: always on, so the range is legible at rest. */}
      {[idxMax, idxMin].map((idx, k) => {
        const p = pts[idx]!;
        const isMax = k === 0;
        if (idx === cursor) return null;
        return (
          <g key={isMax ? "max" : "min"} aria-hidden="true">
            <circle cx={p[0]} cy={p[1]} r={2.5} fill="var(--mrd-mute)" />
            <text
              x={Math.max(14, Math.min(w - 14, p[0]))}
              y={isMax ? p[1] - 6 : p[1] + 13}
              textAnchor="middle"
              fontFamily="var(--mrd-mono)"
              fontSize={8.5}
              letterSpacing="0.06em"
              fill="var(--mrd-faint)"
            >
              {formatValue(data[idx]!)}
            </text>
          </g>
        );
      })}

      {/* Cursor: vertical guide + dot + the tracking readout. */}
      <line
        x1={cur[0]}
        y1={PAD_TOP - 4}
        x2={cur[0]}
        y2={floor}
        stroke="var(--mrd-edge)"
        strokeWidth={1}
        aria-hidden="true"
      />
      <circle
        cx={cur[0]}
        cy={cur[1]}
        r={active ? 4.5 : 3.5}
        fill="var(--canvas)"
        stroke={color}
        strokeWidth={1.5}
      />
      <Readout x={cur[0]} value={formatValue(data[cursor]!)} sub={curLabel} w={w} color={color} />
    </svg>
  );
}
