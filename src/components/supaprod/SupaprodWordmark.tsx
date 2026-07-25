import { SupaprodMark } from "./SupaprodMark";

/**
 * SupaprodWordmark — the canonical header/nav brand lockup: the seven-petal
 * mark + the "Supaprod" wordmark. One component so the lockup never drifts page
 * to page (founder 2026-07-24: some pages showed the mark with no name).
 *
 * Wordmark is Geist Sans (semibold), NOT Geist Pixel — a deliberate call the
 * founder delegated ("take the right call"): Tempo reserves Pixel for hero
 * brand moments and caps it at one element per screen, and Pixel reads cramped
 * at nav sizes. Persistent chrome uses the UI font; the Pixel brand face still
 * leads where it belongs (the landing hero, the /brief deck, the auth headline).
 * Keeping Pixel out of the chrome is what keeps those moments feeling like ones.
 *
 * Theme-agnostic: the wordmark inherits currentColor and the mark is theme-aware
 * via --text-primary, so it reads correctly on the dark public pages and the
 * light /proof parchment alike. Wrap it in the caller's own link (Link to "/").
 */
export function SupaprodWordmark({
  size = 22,
  textSize,
  gap = 8,
}: {
  /** Diameter of the mark in px. */
  size?: number;
  /** Wordmark font size in px. Defaults to a balanced ratio of the mark size. */
  textSize?: number;
  /** Space between mark and wordmark in px. */
  gap?: number;
}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap, lineHeight: 1 }}>
      <SupaprodMark size={size} />
      <span
        style={{
          fontFamily: 'var(--font-sans, "Geist", ui-sans-serif, system-ui, sans-serif)',
          fontWeight: 600,
          fontSize: textSize ?? Math.round(size * 0.64),
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
