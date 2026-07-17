import * as React from "react";
import type { PencilInk } from "./pencil";

// OBS-15 - the pencil layer: rough-SVG human annotations, the reciprocal
// half of chart.tsx's exact machine grammar. The deterministic jitter
// engine (mulberry32 + a one-pass rough walk) is copied from
// src/components/supaprod/Sketch.tsx's sketchPath, reduced to a single pass
// (no second stroke, no fill) since a pencil mark is one hand's single
// motion, not the two-pass graphite of a machine-data sketch.

const PENCIL_INK_COLOR: Record<PencilInk, string> = {
  "best-bet": "var(--pencil-lime)",
  "pet-feature": "var(--pencil-blossom)",
  "scope-creep": "var(--pencil-apricot)",
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedOf(...nums: number[]): number {
  let s = 17;
  for (const n of nums) s = (s * 31 + Math.round(n * 100)) | 0;
  return s;
}

/** One rough pass over a polyline: subdivide each segment into ~`step`px
 * pieces and nudge every interior point. Single pass, no fill - a pencil
 * mark is one motion of the hand. */
function roughPath(pts: [number, number][], rnd: () => number, amp: number, step = 7): string {
  let d = "";
  const jig = (a: number) => (rnd() - 0.5) * 2 * a;
  for (let s = 0; s < pts.length - 1; s++) {
    const [x0, y0] = pts[s]!;
    const [x1, y1] = pts[s + 1]!;
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

export interface PencilCircleProps {
  cx: number;
  cy: number;
  r: number;
  ink?: PencilInk;
  seed?: number;
}

/** A rough near-circle: a jittered arc that slightly overshoots its start,
 * one pass, no fill. */
export function PencilCircle({ cx, cy, r, ink = "best-bet", seed }: PencilCircleProps) {
  const s = seed ?? seedOf(cx, cy, r);
  const rnd = mulberry32(s);
  const steps = 20;
  const overshoot = steps + 2; // slightly overshoots its start, hand-drawn
  const pts: [number, number][] = [];
  for (let i = 0; i <= overshoot; i++) {
    const a = (i / steps) * Math.PI * 2;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return (
    <path
      role="presentation"
      d={roughPath(pts, rnd, r * 0.06, 6)}
      fill="none"
      stroke={PENCIL_INK_COLOR[ink]}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

export interface PencilArrowProps {
  from: [number, number];
  to: [number, number];
  ink?: PencilInk;
  seed?: number;
}

/** A hand arrow: one rough shaft, two short rough barbs at the head. */
export function PencilArrow({ from, to, ink = "best-bet", seed }: PencilArrowProps) {
  const s = seed ?? seedOf(from[0], from[1], to[0], to[1]);
  const rnd = mulberry32(s);
  const color = PENCIL_INK_COLOR[ink];
  const angle = Math.atan2(to[1] - from[1], to[0] - from[0]);
  const barbLen = 8;
  const barbAngle = 2.6; // ~150deg from the shaft
  const barb1: [number, number] = [
    to[0] + barbLen * Math.cos(angle + barbAngle),
    to[1] + barbLen * Math.sin(angle + barbAngle),
  ];
  const barb2: [number, number] = [
    to[0] + barbLen * Math.cos(angle - barbAngle),
    to[1] + barbLen * Math.sin(angle - barbAngle),
  ];
  const shaft = roughPath([from, to], rnd, 1, 8);
  const barbA = roughPath([to, barb1], rnd, 0.8, 6);
  const barbB = roughPath([to, barb2], rnd, 0.8, 6);
  return (
    <g role="presentation" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round">
      <path d={shaft} />
      <path d={barbA} />
      <path d={barbB} />
    </g>
  );
}

export interface PencilUnderlineProps {
  x1: number;
  x2: number;
  y: number;
  ink?: PencilInk;
  seed?: number;
}

/** A wavy underline - a jittered horizontal path. */
export function PencilUnderline({ x1, x2, y, ink = "best-bet", seed }: PencilUnderlineProps) {
  const s = seed ?? seedOf(x1, x2, y);
  const rnd = mulberry32(s);
  const d = roughPath(
    [
      [x1, y],
      [x2, y],
    ],
    rnd,
    1.4,
    6,
  );
  return (
    <path
      role="presentation"
      d={d}
      fill="none"
      stroke={PENCIL_INK_COLOR[ink]}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  );
}

export interface PencilLabelProps {
  x: number;
  y: number;
  children: React.ReactNode;
  ink?: PencilInk;
  rotate?: number;
}

/** The PM's own handwritten label. Caveat, ~17px, rotated. Not
 * `aria-hidden` - a pencil mark is content, `role="note"` (matching
 * `PencilNote` in pencil.tsx). */
export function PencilLabel({ x, y, children, ink = "best-bet", rotate = -2 }: PencilLabelProps) {
  return (
    <text
      role="note"
      x={x}
      y={y}
      transform={`rotate(${rotate} ${x} ${y})`}
      fontFamily="var(--font-pencil)"
      fontSize={17}
      fill={PENCIL_INK_COLOR[ink]}
    >
      {children}
    </text>
  );
}
