import * as React from "react";

// SupaprodMark — the product brand mark (founder ruling 2026-07-14: premium,
// billion-dollar brand). The meaning is the product:
//   • SEVEN petals = the seven loop stages (01 Discover → 07 Learn), one
//     continuous epitrochoid so the lifecycle reads as a single journey.
//   • A glowing CORE = the intelligence the loop revolves around: the Brain
//     (what it knows) keeping the Pulse (the beat). In the loader the petals
//     rotate + energy flows along the curve (the loop turning) and the core
//     pulses (the beat).
// Curve u(t) = ((R-r)cos t + d cos((R-r)t/r), (R-r)sin t - d sin((R-r)t/r)),
// R=7, r=1, d=3 → K=6 → seven petals. Strokes text-primary (ink), core glows
// with ember accent (human work flowing through machine execution).

const R = 7;
const r = 1;
const d = 3;
const K = (R - r) / r; // 6 → seven petals
const MAX = R - r + d; // 9

function buildPath(steps = 420, pad = 10): string {
  const scale = (50 - pad) / MAX;
  let out = "";
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const bx = (R - r) * Math.cos(t) + d * Math.cos(K * t);
    const by = (R - r) * Math.sin(t) - d * Math.sin(K * t);
    out += `${i === 0 ? "M" : "L"} ${(50 + bx * scale).toFixed(2)} ${(50 + by * scale).toFixed(2)} `;
  }
  return out.trim() + " Z";
}

const PATH = buildPath();

/** The exact epitrochoid path (viewBox 0 0 100 100) for treatments that trace
 * the stroke, e.g. the landing hero's specular glint. */
export const SUPAPROD_MARK_PATH = PATH;

export function SupaprodMark({
  size = 26,
  animated = false,
  strokeWidth = 3.2,
  glow = true,
  mono = false,
  title = "Supaprod",
}: {
  size?: number;
  /** Loader mode: the loop rotates + energy flows + the core pulses. */
  animated?: boolean;
  strokeWidth?: number;
  glow?: boolean;
  /** Monochrome watermark: silver/gray spiral + core, no ember/gold. */
  mono?: boolean;
  title?: string;
}) {
  const id = React.useId().replace(/[:]/g, "");
  return (
    <span
      role="img"
      aria-label={animated ? `${title} is working` : title}
      className="inline-flex items-center justify-center"
      style={{ width: size, height: size, lineHeight: 0 }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        fill="none"
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id={`pet-${id}`} x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="var(--text-primary, #f2f0ed)" />
            <stop offset="52%" stopColor="var(--text-subtle, #7d786f)" />
            <stop offset="100%" stopColor="var(--text-primary, #f2f0ed)" />
          </linearGradient>
          <radialGradient id={`core-${id}`} cx="42%" cy="36%" r="72%">
            <stop
              offset="0%"
              stopColor="color-mix(in oklab, #fff 60%, var(--brand-mark-ember, #ff6b2c))"
            />
            <stop offset="56%" stopColor="var(--brand-mark-ember, #ff6b2c)" />
            <stop
              offset="100%"
              stopColor="color-mix(in oklab, var(--brand-mark-ember, #ff6b2c) 82%, #000)"
            />
          </radialGradient>
        </defs>
        {/* Petals = the loop; rotates in loader mode. */}
        <g
          className={animated ? "supaprod-spin" : undefined}
          style={{
            transformBox: "fill-box",
            transformOrigin: "center",
            filter: glow
              ? "drop-shadow(0 0 3.5px color-mix(in oklab, #fff 24%, transparent))"
              : undefined,
          }}
        >
          {/* THE MARK ITSELF MUST STAY LEGIBLE WHILE IT LOADS. This track used to
              be `--hairline-strong` (about 0.09 alpha) at `opacity 0.22`, an
              effective alpha near 0.02, which is invisible: all a person saw was
              the comet, so the loader read as an abstract squiggle rather than as
              our mark. A brand loader whose brand cannot be recognised is doing
              the one job it has badly. The full seven-petal curve now reads at all
              times and the comet is a highlight travelling along it. */}
          {animated ? (
            <path
              d={PATH}
              stroke="var(--text-subtle, #7d786f)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.38}
            />
          ) : null}
          {/* THE RECORD, following the work. A second comet on the same curve,
              dimmer and a beat behind the bright one. It is the product's claim
              said in two marks rather than in copy: the loop runs, and the record
              keeps up with it. Loader mode only, and it sits UNDER the leading
              comet so the bright head always reads as the thing in front. */}
          {animated ? (
            <path
              d={PATH}
              stroke="var(--brand-mark-ember, #ff6b2c)"
              strokeWidth={strokeWidth * 0.7}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="supaprod-flow supaprod-flow-trail"
              pathLength={100}
              opacity={0.4}
            />
          ) : null}
          <path
            d={PATH}
            stroke="var(--text-primary, #f2f0ed)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={animated ? "supaprod-flow" : undefined}
            pathLength={animated ? 100 : undefined}
          />
        </g>
        {/* Core = Brain + Pulse: an ember centre with a small GOLD bead (the
            tilak / diya). Mono renders it in the metallic instead (watermark). */}
        {mono ? (
          <circle cx="50" cy="50" r="6.2" fill="var(--text-subtle, #7d786f)" />
        ) : (
          <g
            className={animated ? "supaprod-core" : undefined}
            style={{
              transformBox: "fill-box",
              transformOrigin: "center",
              filter:
                "drop-shadow(0 0 4px color-mix(in oklab, var(--brand-mark-ember, #ff6b2c) 55%, transparent))",
            }}
          >
            <circle cx="50" cy="50" r="6.2" fill={`url(#core-${id})`} />
            <circle
              cx="50"
              cy="50"
              r="2.15"
              fill="var(--brand-mark-gold, #e8b44c)"
              style={{
                filter:
                  "drop-shadow(0 0 2px color-mix(in oklab, var(--brand-mark-gold, #e8b44c) 70%, transparent))",
              }}
            />
          </g>
        )}
      </svg>
    </span>
  );
}

/** Convenience alias for loader usage. */
export function SupaprodLoader({ size = 24, title }: { size?: number; title?: string }) {
  return <SupaprodMark size={size} animated title={title} />;
}
