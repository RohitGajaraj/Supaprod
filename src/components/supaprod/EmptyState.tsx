import type { ReactNode } from "react";

/**
 * Canonical EmptyState component — unified empty-state rendering across all surfaces.
 *
 * Spec (DESIGN-TEMPO):
 * - Centered flex column, spacing via CSS variables
 * - Icon (optional): 24px, gray-600
 * - Headline (optional): Geist Pixel font, 18-20px, gray-1000 (body color if no headline)
 * - Body: Geist Sans 14px, gray-700
 * - Action (optional): Button or link CTA, padded top
 * - Responsive: spacing adjusts on mobile
 * - a11y: semantic div, headline in Pixel so screen readers see it
 *
 * NO REFERENCE SURFACE ANY MORE, deliberately. This block used to name the
 * command palette's empty state as "the gold standard". That palette was
 * retired on 2026-08-21 (docs/decisions/palette-retired-2026-08.md) and it
 * spoke a retired design vocabulary -- nineteen Obsidian-era tokens against
 * zero Meridian ones -- so the pointer was sending the next author to copy
 * exactly what the ratchet exists to stop. The anatomy above is the contract;
 * Meridian is the vocabulary. Do not re-add a "copy this file" line here.
 */
export function EmptyState({
  icon,
  headline,
  body,
  action,
  className,
}: {
  icon?: React.ReactNode; // lucide icon (24px)
  headline?: React.ReactNode; // Geist Pixel, optional
  body: React.ReactNode; // Geist Sans 14px
  action?: React.ReactNode; // Button or link CTA, optional
  className?: string; // wrapper class override
}) {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: `var(--space-4)`,
        gap: `var(--space-3)`,
      }}
    >
      {/* Icon: 24px, gray-600 background tile (12px radius) */}
      {icon ? (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: 8,
            backgroundColor: "var(--ds-gray-100)",
            color: "var(--ds-gray-600)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            {icon}
          </div>
        </div>
      ) : null}

      {/* Headline: Pixel font, 18-20px, gray-1000 */}
      {headline ? (
        <h2
          style={{
            fontFamily: "var(--font-pixel)",
            fontWeight: 400,
            lineHeight: 1.2,
            color: "var(--ds-gray-1000)",
            margin: 0,
            maxWidth: 360,
          }}
        >
          {headline}
        </h2>
      ) : null}

      {/* Body: Sans 14px, gray-700 */}
      <p
        style={{
          fontFamily: "var(--mrd-font)",
          fontWeight: 400,
          lineHeight: 1.5,
          color: "var(--ds-gray-700)",
          margin: 0,
          maxWidth: 360,
        }}
      >
        {body}
      </p>

      {/* Action: optional Button or link, padded top */}
      {action ? (
        <div
          style={{
            paddingTop: `var(--space-4)`,
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: `var(--space-2)`,
          }}
        >
          {action}
        </div>
      ) : null}
    </div>
  );
}
