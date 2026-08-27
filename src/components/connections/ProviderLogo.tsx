import { ProviderMark } from "@/components/meridian/source-marks";
import type { ProviderId } from "@/lib/connectors/registry";

// The brand mark for a connector, on a subtle tile. Judgment 2026-08-24: draws
// Meridian's own marks -- `source-marks.tsx`, which renders the generated
// official brand geometry (BRAND_GLYPHS) first and falls back to the drawn
// set where none is published -- per the founder's 2026-08-23 ruling to use
// the original logos "across the platform", which supersedes the monotone
// simple-icons paths this file previously inlined by hand.
export function ProviderLogo({ provider, size = 34 }: { provider: ProviderId; size?: number }) {
  const glyph = Math.round(size * 0.56);

  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-flex",
        width: size,
        height: size,
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: Math.max(8, Math.round(size * 0.26)),
        // Monotone tile, kept: the ground stays quiet so the official mark
        // carries the recognition. `--surface-raised` resolved through
        // styles.css into --ds-gray-200; `--mrd-lift` is this system's raised
        // ground and every neighbouring line here is already Meridian.
        background: "var(--mrd-lift)",
        boxShadow: "inset 0 0 0 1px var(--mrd-edge)",
        // Ink for the drawn fallbacks; official geometry ignores it.
        color: "var(--mrd-body)",
      }}
    >
      <ProviderMark provider={provider} size={glyph} />
    </span>
  );
}
