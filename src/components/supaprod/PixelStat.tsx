import * as React from "react";

// PixelStat — the one way to render a metric numeral in the app (founder
// ruling 2026-07-13: all numbers align to Geist Pixel with a deliberate,
// consistent shape + tone). Tabular figures so counts don't jitter; an
// optional glow gives a count the "spotlight" the founder asked for. Use this
// wherever a number is the point (counts, scores, deltas), so the numeric
// voice is identical on every surface.

export type PixelTone = "neutral" | "primary" | "ember" | "moss" | "blue" | "madder";

const TONE_COLOR: Record<PixelTone, string> = {
  neutral: "var(--mrd-faint)",
  primary: "var(--mrd-ink)",
  ember: "var(--mrd-you)",
  moss: "var(--mrd-pass)",
  blue: "var(--action-blue)",
  madder: "var(--mrd-fail)",
};

export function PixelStat({
  value,
  tone = "neutral",
  size = 13,
  glow = false,
  title,
  style,
}: {
  value: React.ReactNode;
  tone?: PixelTone;
  /** Font size in px. */
  size?: number;
  /** Soft halo behind the numeral, for the "spotlight" counts. */
  glow?: boolean;
  title?: string;
  style?: React.CSSProperties;
}) {
  const color = TONE_COLOR[tone];
  return (
    <span
      title={title}
      style={{
        fontFamily: "var(--font-pixel)",
        fontVariantNumeric: "tabular-nums",
        fontWeight: 400,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: "0.01em",
        color,
        textShadow: glow ? `0 0 11px color-mix(in oklab, ${color} 48%, transparent)` : undefined,
        ...style,
      }}
    >
      {value}
    </span>
  );
}
