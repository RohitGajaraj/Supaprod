// Hand-sketched data marks — founder directive 2026-06-12: graphs of data
// points read like pencil on paper, not system-generated vectors. Two light
// passes of a jittered stroke give the double-line graphite feel; bars get a
// jittered outline with diagonal hatch shading. Jitter is DETERMINISTIC —
// seeded from the data itself — so a chart never wobbles between renders,
// and it collapses to honest geometry: the underlying points are exact.
//
// TUNING IS LAW: the amplitudes/steps/opacities here are founder-approved
// ("calm amplitude: clearly hand-drawn, never cartoon-loose") and documented
// in DESIGN.md "Hand-sketched data marks". Do not retune without a founder
// ruling; new mark types extend this file and reuse these metrics.
// SCOPE (2026-07-07): the PENCIL family. SketchBarChart (below) is the APP
// bar-chart standard: hand-drawn bars, interactive, the value shown on hover
// (the founder wants bars warm + human, not machined). SketchLine is the
// landing page + PM annotation layer only; app line/area TRENDS use the modern
// exact GraphSlider ("@/components/obsidian"). See design-anatomy.md section 7
// and the DESIGN-LOOM Infographic Law.
import { useMemo, useState } from "react";

/* Tiny seeded PRNG (mulberry32) — stable jitter per data series. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedOf(data: number[], salt: number) {
  let s = salt + data.length * 7919;
  for (let i = 0; i < data.length; i++) s = (s * 31 + Math.round(data[i] * 100) + i) | 0;
  return s;
}

/* Walk a polyline, subdividing each segment into ~`step`px pieces and
   nudging every interior point — the pencil wobble. */
export function sketchPath(
  pts: [number, number][],
  rnd: () => number,
  amp: number,
  step = 7,
): string {
  let d = "";
  const jig = (a: number) => (rnd() - 0.5) * 2 * a;
  for (let s = 0; s < pts.length - 1; s++) {
    const [x0, y0] = pts[s];
    const [x1, y1] = pts[s + 1];
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step));
    for (let i = s === 0 ? 0 : 1; i <= n; i++) {
      const t = i / n;
      let x = x0 + (x1 - x0) * t;
      let y = y0 + (y1 - y0) * t;
      const endpoint = (s === 0 && i === 0) || (s === pts.length - 2 && i === n);
      if (!endpoint) {
        x += jig(amp * 0.5);
        y += jig(amp);
      }
      d += d === "" ? `M${x.toFixed(1)} ${y.toFixed(1)}` : ` L${x.toFixed(1)} ${y.toFixed(1)}`;
    }
  }
  return d;
}

/* SketchLine — drop-in for the old straight Sparkline: no axes, jittered
   double stroke, hand-set dot on the last point. */
export function SketchLine({
  data,
  color = "var(--text-muted)",
  w = 210,
  h = 42,
  baseline,
  animate = false,
}: {
  data: number[];
  color?: string;
  w?: number;
  h?: number;
  /** Optional reference line (eval gate, drift zero). Drawn as a clean
   *  dashed hairline — an instrument, not an observation, so it is the one
   *  mark here the sketch law leaves straight. Rendered only when it falls
   *  inside the data's range (reference Sparkline contract). */
  baseline?: number;
  /** Opt-in: pen the stroke in once on mount (CSS `.sketch-draw`, 260ms).
   *  Off by default so the existing eval/drift charts stay static. Honors
   *  data-motion="off" and reduced-motion (both render it fully drawn). */
  animate?: boolean;
}) {
  const { passA, passB, endX, endY, baseY } = useMemo(
    () => sketchLineGeometry(data, w, h, baseline),
    [data, w, h, baseline],
  );
  if (data.length < 2) return null;
  return (
    <svg width={w} height={h} aria-hidden="true" style={{ display: "block", maxWidth: "100%" }}>
      {baseY != null && (
        <line
          x1="5"
          x2={w - 5}
          y1={baseY}
          y2={baseY}
          stroke="var(--mrd-edge)"
          strokeDasharray="3 3"
        />
      )}
      <path
        d={passA}
        className={animate ? "sketch-draw" : undefined}
        pathLength={animate ? 1 : undefined}
        fill="none"
        stroke={color}
        strokeWidth="1.3"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d={passB}
        className={animate ? "sketch-draw" : undefined}
        pathLength={animate ? 1 : undefined}
        fill="none"
        stroke={color}
        strokeWidth="0.9"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.45"
      />
      <circle
        cx={endX + 0.4}
        cy={endY - 0.3}
        r="2.4"
        fill={color}
        className={animate ? "sketch-dot" : undefined}
        opacity="0.9"
      />
    </svg>
  );
}

/* SketchBar — one hand-drawn bar: jittered outline (corners overshoot a
   touch, like pencil strokes crossing) + diagonal hatch shading. Rendered
   in a fixed-unit viewBox; vector-effect keeps strokes uniform when the
   bar stretches. */
export function SketchBar({
  pct,
  color = "var(--mrd-you)",
  seed,
  trackH = 72,
}: {
  /** 0–100 fill height. */
  pct: number;
  color?: string;
  /** Vary per bar so neighbours don't share the same wobble. */
  seed: number;
  trackH?: number;
}) {
  const W = 60; // nominal units; the svg stretches to the flex cell
  const { outline, hatch } = useMemo(
    () => sketchBarGeometry(pct, seed, trackH),
    [pct, seed, trackH],
  );
  return (
    <svg
      width="100%"
      height={trackH}
      viewBox={`0 0 ${W} ${trackH}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path
        d={hatch}
        stroke={color}
        strokeWidth="1"
        opacity="0.38"
        fill="none"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={outline}
        stroke={color}
        strokeWidth="1.4"
        opacity="0.85"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export interface SketchBarDatum {
  label: string;
  value: number;
}

export function capFirst(s: string): string {
  return s.length === 0 ? s : s[0]!.toUpperCase() + s.slice(1);
}

/* Extract geometry computation from SketchLine useMemo for testability. */
export interface SketchLineGeometry {
  passA: string;
  passB: string;
  endX: number;
  endY: number;
  baseY: number | null;
}

export function sketchLineGeometry(
  data: number[],
  w: number,
  h: number,
  baseline?: number,
): SketchLineGeometry {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const px = (i: number) => 5 + i * ((w - 10) / Math.max(1, data.length - 1));
  const py = (v: number) => h - 6 - ((v - min) / span) * (h - 12);
  const pts: [number, number][] = data.map((v, i) => [px(i), py(v)]);
  return {
    passA: sketchPath(pts, mulberry32(seedOf(data, 1)), 1.7),
    passB: sketchPath(pts, mulberry32(seedOf(data, 2)), 1.1),
    endX: px(data.length - 1),
    endY: py(data[data.length - 1]),
    baseY: baseline != null && baseline >= min && baseline <= max ? py(baseline) : null,
  };
}

/* Extract geometry computation from SketchBar useMemo for testability. */
export interface SketchBarGeometry {
  outline: string;
  hatch: string;
}

export function sketchBarGeometry(pct: number, seed: number, trackH: number): SketchBarGeometry {
  const W = 60; // nominal units; the svg stretches to the flex cell
  const rnd = mulberry32((seed * 2654435761) | 0);
  const top = trackH - Math.max(3, (pct / 100) * (trackH - 2));
  const corners: [number, number][] = [
    [2, trackH],
    [2, top],
    [W - 2, top],
    [W - 2, trackH],
  ];
  const outline = sketchPath(corners, rnd, 1.2, 9);
  // Diagonal hatch — bottom-left to top-right, clipped by hand to the bar.
  let hatch = "";
  const gap = 8.5;
  for (let x = 4 - trackH; x < W - 4; x += gap) {
    const x0 = Math.max(3, x);
    const y0 = trackH - 1 - Math.max(0, x0 - x);
    const x1 = Math.min(W - 3, x + (trackH - top));
    const y1 = top + 1 + Math.max(0, x + (trackH - top) - x1);
    if (y0 <= top + 2 || x1 <= x0) continue;
    const j = () => (rnd() - 0.5) * 1.6;
    hatch += `M${(x0 + j()).toFixed(1)} ${(y0 + j()).toFixed(1)} L${(x1 + j()).toFixed(1)} ${(Math.max(top + 1, y1) + j()).toFixed(1)} `;
  }
  return { outline, hatch };
}

/* barInsight: a short, honest, plain-language takeaway derived from a bar
   series, for humans AND agents (it also rides the chart's aria-label so an
   agent reading the accessible tree gets the read, not just the raw bars).
   Real numbers only: the direction + magnitude of the change across the
   window, and where the peak sits. No fabrication, no claim the data does not
   support. */
export function barInsight(data: SketchBarDatum[], fmt: (v: number) => string): string {
  if (data.length === 0) return "";
  if (data.length === 1) return `One reading: ${fmt(data[0]!.value)} (${data[0]!.label}).`;
  const first = data[0]!;
  const last = data[data.length - 1]!;
  const peak = data.reduce((a, b) => (b.value > a.value ? b : a), first);
  const delta = last.value - first.value;
  const base = Math.abs(first.value);
  const pct = base > 0 ? Math.round((delta / base) * 100) : null;
  const flat = delta === 0 || (pct != null && Math.abs(pct) < 5);
  if (flat) {
    return `About flat across the window; peak ${fmt(peak.value)} on ${peak.label}.`;
  }
  const dir =
    pct != null
      ? `${pct > 0 ? "up" : "down"} ${Math.abs(pct)}%`
      : `${delta > 0 ? "up" : "down"} to ${fmt(last.value)}`;
  return `${capFirst(dir)} since ${first.label}; peak ${fmt(peak.value)} on ${peak.label}.`;
}

/* SketchBarChart: the pencil bar chart, interactive and interpretable
   (founder ruling 2026-07-07, restored as the app bar-chart standard). Keeps
   the hand-drawn SketchBar aesthetic (this is the warm, human look the founder
   wants for bars, NOT a machined rectangle), and answers the questions a bare
   bar row could not: the peak (top number), the floor (bottom number), what it
   is measured against (an optional dashed baseline), and each bar's value
   (hover or focus a bar to read its value + label, shown in the pencil hand).
   Non-active bars dim so the read is unambiguous. Keyboard reachable; reduced
   motion handled globally. Bars are the pencil exception to the modern chart
   rule: line/area TRENDS use the exact GraphSlider, bars stay pencil here. */
export function SketchBarChart({
  data,
  color = "var(--mrd-you)",
  formatValue = (v: number) => String(Math.round(v)),
  baseline,
  baselineLabel,
  ariaLabel,
  trackH = 88,
  insight,
  showInsight = true,
}: {
  data: SketchBarDatum[];
  color?: string;
  formatValue?: (v: number) => string;
  /** A reference the bars are measured against (a gate, a target, a prior). */
  baseline?: number;
  baselineLabel?: string;
  ariaLabel?: string;
  trackH?: number;
  /** Override the auto-derived plain-language takeaway with a domain-specific one. */
  insight?: string;
  /** Off only for a decorative sparkline with no room for a takeaway line. */
  showInsight?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value), baseline ?? 0, 1);
  // Clamp activeIdx to valid bounds in case data shrinks while a bar is hovered.
  // Without this, accessing data[activeIdx] could throw when activeIdx > data.length - 1.
  const activeIdx = Math.min(hover ?? data.length - 1, data.length - 1);
  const active = data[activeIdx]!;
  const baselinePct =
    baseline != null && baseline > 0 ? Math.min(100, (baseline / max) * 100) : null;
  // The insight (founder ruling 2026-07-07): not just the data points, a
  // plain-language read of them, for humans AND agents. Auto-derived from the
  // real series unless the caller passes a domain-specific one; it also rides
  // the group aria-label below so an agent reads the takeaway, not just bars.
  const insightText = showInsight ? (insight ?? barInsight(data, formatValue)) : "";

  return (
    <div
      role="group"
      aria-label={`${ariaLabel ?? "Bar chart"}${insightText ? `. ${insightText}` : ""}`}
    >
      {insightText ? (
        <div
          style={{
            fontFamily: "var(--font-pencil)",
            color: "var(--text-body)",
            lineHeight: 1.3,
            marginBottom: 8,
          }}
        >
          {insightText}
        </div>
      ) : null}
      {/* Peak reference (the scale), right-aligned and quiet. The ACTIVE bar's
          value floats directly above that bar below, not here at an edge. */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          fontFamily: "var(--font-pencil)",
          color: "var(--text-faint)",
          marginBottom: 6,
        }}
      >
        peak {formatValue(max)}
      </div>

      {/* Bars: the pencil aesthetic, kept. Hover or focus a bar to read it. */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "flex-end",
          gap: 3,
          height: trackH,
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
              borderTop: "1px dashed var(--mrd-edge)",
            }}
          />
        ) : null}
        {data.map((d, i) => {
          const on = i === activeIdx;
          return (
            <button
              key={`${d.label}-${i}`}
              type="button"
              aria-label={`${d.label}: ${formatValue(d.value)}`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover((h) => (h === i ? null : h))}
              onFocus={() => setHover(i)}
              onBlur={() => setHover((h) => (h === i ? null : h))}
              className="outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
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
                opacity: hover == null || on ? 1 : 0.42,
                filter: on
                  ? `drop-shadow(0 0 7px color-mix(in srgb, ${color} 60%, transparent))`
                  : "none",
                transition:
                  "opacity 160ms var(--ds-motion-timing-swift), filter 160ms var(--ds-motion-timing-swift)",
              }}
            >
              <SketchBar
                pct={Math.max(3, (d.value / max) * 100)}
                seed={i + 1}
                color={color}
                trackH={trackH}
              />
            </button>
          );
        })}
        {/* The active bar's value, floating directly ABOVE that bar (founder
            ruling 2026-07-07): the readout appears where the eye is, not at an
            edge. Follows hover/focus; the glow spotlights the selection. */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: `${((activeIdx + 0.5) / data.length) * 100}%`,
            bottom: `${Math.min(90, Math.max(3, (active.value / max) * 100))}%`,
            transform: "translate(-50%, -4px)",
            pointerEvents: "none",
            fontFamily: "var(--font-pencil)",
            lineHeight: 1.15,
            textAlign: "center",
            color,
            background: "var(--raised)",
            border: "1px solid var(--mrd-edge)",
            borderRadius: 6,
            padding: "3px 8px",
            whiteSpace: "nowrap",
            boxShadow: `0 0 10px color-mix(in srgb, ${color} 32%, transparent)`,
            transitionProperty: "left, bottom",
            transitionDuration: "160ms",
            transitionTimingFunction: "var(--ds-motion-timing-swift)",
            zIndex: 2,
          }}
        >
          <span style={{ display: "block" }}>{formatValue(active.value)}</span>
          <span style={{ display: "block", color: "var(--text-subtle)" }}>{active.label}</span>
        </div>
      </div>

      {/* Bottom axis: the floor (0 or the named baseline) + the range ends. */}
      <div
        className="mono-label"
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "var(--geist-space-2x)",
          marginTop: 6,
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
