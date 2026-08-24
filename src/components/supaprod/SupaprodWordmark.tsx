import { SupaprodMark } from "./SupaprodMark";

/**
 * SupaprodWordmark, the canonical brand lockup: the seven-petal mark plus the
 * "Supaprod" wordmark. One component so the lockup never drifts page to page
 * (founder 2026-07-24: some pages showed the mark with no name).
 *
 * TYPEFACE: Geist Sans, everywhere, no exceptions. Founder ruling 2026-07-25.
 * An earlier version of this comment proposed a hybrid ("Pixel where the
 * wordmark is the hero, Sans where it is chrome"). The founder rejected it, and
 * he was right: a wordmark is a BRAND ASSET, and a brand asset that changes
 * typeface by context is the definition of inconsistency. Pixel remains the
 * special-occasion face for HEADLINES (landing hero, auth headline, legal page
 * titles), which is a different job and still capped at one per screen. The
 * lockup itself never changes. Sans is the right single choice because the
 * lockup has to survive at 13px in a dense top bar, where a pixel face reads
 * cramped.
 *
 * SIZE: pick a tier, do not pass numbers by eye. Before this existed there were
 * FOUR sizes in the codebase (26/17 landing, 22/14 demo and proof, 20/13 legal,
 * 18/13 room), so the legal pages rendered about a quarter smaller than the
 * landing and it read as a mistake, because it was one.
 *
 * Theme-agnostic: the wordmark inherits currentColor and the mark is theme-aware
 * via --text-primary, so it reads correctly on the dark public pages and the
 * light /proof parchment alike. Wrap it in the caller's own link (Link to "/").
 */

/** The two legitimate sizes. Add a third only with a reason worth writing down. */
const TIERS = {
  /** Public marketing surfaces: landing, security, updates, privacy, terms, demo, proof. */
  public: { size: 22, textSize: 14, gap: 9 },
  /** App chrome: the room top bar, sharing space with a product switcher, four doors and the account menu. */
  chrome: { size: 18, textSize: 13, gap: 10 },
} as const;

export type WordmarkTier = keyof typeof TIERS;

export function SupaprodWordmark({
  tier = "public",
  size,
  textSize,
  gap,
}: {
  /** Which surface this sits on. Prefer this over raw numbers. */
  tier?: WordmarkTier;
  /** Escape hatch: diameter of the mark in px. Overrides the tier. */
  size?: number;
  /** Escape hatch: wordmark font size in px. Overrides the tier. */
  textSize?: number;
  /** Escape hatch: space between mark and wordmark in px. Overrides the tier. */
  gap?: number;
}) {
  const t = TIERS[tier];
  const markSize = size ?? t.size;
  const wordSize = textSize ?? t.textSize;
  const space = gap ?? t.gap;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: space, lineHeight: 1 }}>
      <SupaprodMark size={markSize} />
      <span
        style={{
          fontFamily: 'var(--mrd-font, "Geist", ui-sans-serif, system-ui, sans-serif)',
          fontWeight: 600,
          fontSize: wordSize,
          letterSpacing: "-0.01em",
          lineHeight: 1,
          color: "currentColor",
        }}
      >
        Supaprod
      </span>
    </span>
  );
}
