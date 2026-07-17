/**
 * FramedVisual — screenshot/replay frame wrapper
 *
 * Wraps product screenshots, replay frames, or any visual artifact in a premium frame.
 * Design: #0d0d0e base, 1px hairline border, 12px radius, opacity-toggled edge light on hover.
 * Never animates box-shadow (rauno.me craft rule); uses pre-rendered ::after glow toggled via opacity.
 *
 * Usage:
 * <FramedVisual src="/images/screenshot.png" alt="The Decide surface" />
 */

import { CSSProperties } from "react";

interface FramedVisualProps {
  src: string;
  alt: string;
  /** Optional aspect ratio, e.g., "16 / 10" or "4 / 3". Defaults to "16 / 10". */
  aspectRatio?: string;
  /** Optional: dim the image slightly (0.85) to keep headline brightest */
  dimmed?: boolean;
}

export function FramedVisual({ src, alt, aspectRatio = "16 / 10", dimmed = false }: FramedVisualProps) {
  const containerStyle: CSSProperties = {
    position: "relative",
    borderRadius: "12px",
    aspectRatio,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.10)",
    backgroundColor: "#0d0d0e",
  };

  const imgStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    opacity: dimmed ? 0.85 : 1,
    transition: "opacity 0.3s ease",
  };

  // Pre-rendered glow (::after), toggled via opacity on hover.
  // Never animate box-shadow; instead toggle the glow's opacity.
  const glowStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius: "12px",
    boxShadow: "inset 0 0 40px rgba(255,255,255,0.08)",
    opacity: 0,
    transition: "opacity 0.3s ease",
    pointerEvents: "none",
  };

  return (
    <div
      style={containerStyle}
      className="replay-frame"
      onMouseEnter={(e) => {
        const glow = (e.currentTarget as HTMLElement).querySelector(".replay-frame-glow") as HTMLElement;
        if (glow) glow.style.opacity = "1";
      }}
      onMouseLeave={(e) => {
        const glow = (e.currentTarget as HTMLElement).querySelector(".replay-frame-glow") as HTMLElement;
        if (glow) glow.style.opacity = "0";
      }}
    >
      {/* Image */}
      <img src={src} alt={alt} style={imgStyle} loading="lazy" />

      {/* Pre-rendered edge-light glow, toggled via opacity */}
      <div className="replay-frame-glow" style={glowStyle} aria-hidden="true" />
    </div>
  );
}
