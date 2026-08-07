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

import { CSSProperties, useState } from "react";

interface FramedVisualProps {
  src: string;
  alt: string;
  /** Optional aspect ratio, e.g., "16 / 10" or "4 / 3". Defaults to "16 / 10". */
  aspectRatio?: string;
  /** Optional: dim the image slightly (0.85) to keep headline brightest */
  dimmed?: boolean;
}

export function FramedVisual({
  src,
  alt,
  aspectRatio = "16 / 10",
  dimmed = false,
}: FramedVisualProps) {
  const [failed, setFailed] = useState(false);
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
        const glow = (e.currentTarget as HTMLElement).querySelector(
          ".replay-frame-glow",
        ) as HTMLElement;
        if (glow) glow.style.opacity = "1";
      }}
      onMouseLeave={(e) => {
        const glow = (e.currentTarget as HTMLElement).querySelector(
          ".replay-frame-glow",
        ) as HTMLElement;
        if (glow) glow.style.opacity = "0";
      }}
    >
      {/* Image, DROPPED IF IT DOES NOT DECODE.
       *
       * Found live on 2026-08-07: all six /product screenshots
       * (/images/{discover,decide,define,build,ship,learn}.png) return HTTP 200
       * with content-type text/html and about 30KB of the SPA shell, because
       * public/images/ does not exist in the repo and unknown paths soft-404
       * into the app. So /product was shipping six broken images to every
       * visitor, and paying roughly 180KB of transfer for HTML it then threw
       * away.
       *
       * The 200 is what makes this worth guarding rather than ignoring: a real
       * 404 would at least be visible in logs and to a crawler. A 200 of the
       * wrong content type is invisible everywhere except the rendered page.
       *
       * onError fires when the decoder rejects the bytes, which is exactly this
       * case, so the frame falls back to its own premium empty panel: the
       * #0d0d0e ground and hairline border are already drawn by the container.
       * An empty frame reads as deliberate. A broken-image glyph does not.
       *
       * THIS IS A GUARD, NOT THE FIX. The real fix is six product screenshots
       * in public/images/. Note docs/screenshots/ is gitignored, so they cannot
       * simply be moved from there; they have to be committed to public/. */}
      {!failed && (
        <img src={src} alt={alt} style={imgStyle} loading="lazy" onError={() => setFailed(true)} />
      )}

      {/* Pre-rendered edge-light glow, toggled via opacity */}
      <div className="replay-frame-glow" style={glowStyle} aria-hidden="true" />
    </div>
  );
}
