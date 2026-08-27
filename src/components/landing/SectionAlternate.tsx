/**
 * SectionAlternate — the reusable marketing section unit
 *
 * Implements the Vercel-inspired alternating showcase pattern for product pages.
 * Each section: headline (Geist Pixel) + body copy + visual (screenshot/replay).
 * Sides alternate on even/odd index. Follows all Tempo design rules.
 *
 * Usage:
 * <SectionAlternate
 *   index={0}
 *   headline="Discover what matters"
 *   body="Your signals feed a Brain that learns. Human gate always stays."
 *   visual={<FramedVisual src="/images/discover.png" alt="..." />}
 *   capabilities={["LIVE SIGNALS", "THEME CLUSTERING", "HUMAN GATE", "PRECEDENT CHECK"]}
 * />
 */

import { ReactNode } from "react";

interface SectionAlternateProps {
  /** Zero-indexed; odd = text left/visual right, even = visual left/text right */
  index: number;
  /** Geist Pixel Square, 64px, white, one line ideally */
  headline: string;
  /** Geist Sans, 16px, zinc-400, max 240 chars. Plain English. */
  body: string;
  /** Rendered visual: FramedVisual or similar component */
  visual: ReactNode;
  /** 4 mono items, uppercase, hover to ember. e.g. ["LIVE SIGNALS", "HUMAN GATE"] */
  capabilities: string[];
  /** Optional: highlight index (0-3) as ember on hover, e.g., 1 highlights the second item */
  highlightCapability?: number;
}

export function SectionAlternate({
  index,
  headline,
  body,
  visual,
  capabilities,
  highlightCapability,
}: SectionAlternateProps) {
  const isOdd = index % 2 === 1;
  const isTextLeft = isOdd;

  return (
    <section
      data-index={index}
      className="relative py-32"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "96px",
        alignItems: "center",
        maxWidth: "1280px",
        marginLeft: "auto",
        marginRight: "auto",
        paddingLeft: "96px",
        paddingRight: "96px",
      }}
    >
      {/* Text zone */}
      <div
        style={{
          order: isTextLeft ? 0 : 1,
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* Headline */}
        <h2
          style={{
            fontFamily: "var(--font-pixel, 'Geist Pixel Square')",
            fontWeight: 400,
            lineHeight: 1,
            color: "#f4f4f5",
            whiteSpace: "balance", // CSS Text Module Level 4
            // Fallback for browsers that don't support text-wrap
            wordWrap: "break-word",
          }}
        >
          {headline}
        </h2>

        {/* Body copy */}
        <p
          style={{
            fontFamily: "var(--mrd-font, system-ui)",
            lineHeight: 1.6,
            color: "#a1a1aa", // zinc-400
            /*
             * 340px until 2026-08-28. See the note on product.tsx's hero
             * paragraph: a pixel cap stops tracking the type scale, so the day
             * 14px becomes 15px the measure silently changes its character
             * count and nothing says so.
             *
             * 38.5ch is THIS block's current width, measured by S4 in the
             * browser with a probe span in the element's own font: 14px,
             * 1ch = 8.83px, so 340px is 38.51ch. This component draws six times
             * on /product and all six measured identically.
             *
             * Not rounded: 38ch is 3px narrower and 40ch is 13px wider, and
             * either would be a design change smuggled in under a unit change.
             */
            maxWidth: "38.5ch",
          }}
        >
          {body}
        </p>

        {/* Capability list */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginTop: "12px",
          }}
        >
          {capabilities.map((cap, idx) => (
            <div
              key={cap}
              className="cap-item"
              style={{
                fontFamily: "var(--mrd-mono, monospace)",
                fontWeight: 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: highlightCapability === idx ? "#FF6B2C" : "#a1a1aa", // zinc-400: #71717a measured 4.07:1, under the AA floor
                transition: "color 0.25s ease",
                cursor: "default",
              }}
            >
              {cap}
            </div>
          ))}
        </div>
      </div>

      {/* Visual zone */}
      <div
        style={{
          order: isTextLeft ? 1 : 0,
        }}
      >
        {visual}
      </div>
    </section>
  );
}
