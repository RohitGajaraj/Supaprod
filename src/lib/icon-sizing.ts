/**
 * DESIGN-TEMPO.md §8 Icon Sizing Rules
 *
 * Standardized icon sizing convention for all Supaprod surfaces.
 * Base: Lucide icons, consistent stroke weight by size tier.
 *
 * Usage:
 *   import { iconSize } from '@/lib/icon-sizing';
 *   <ChevronDown size={iconSize.nav} strokeWidth={1.5} />
 */

/** Icon sizing tiers following Vercel Geist baseline */
export const iconSize = {
  /** 14px — compact metadata, badges, small densities. Stroke: 1.8–1.9 */
  compact: 14,

  /** 16px — standard inline, text baseline pairing, default everywhere. Stroke: 1.5 */
  standard: 16,

  /** 20px — navigation, section headers, prominent labels. Stroke: 1.5 */
  nav: 20,

  /** 24px — CTAs, large interactive surfaces, emphasis. Stroke: 1.5 */
  large: 24,
};

/** Stroke width by size tier (Lucide's strokeWidth prop) */
export const iconStroke = {
  compact: 1.8, // 14px and below for legibility
  standard: 1.5, // 16px+ standard
  large: 1.5, // 24px+ same as standard
};

/**
 * Per-context icon size guide (derive from the tiers above):
 *
 * Navigation: nav (20px)
 * Page headers: nav (20px)
 * Inline with text: standard (16px)
 * Metadata badges: compact (14px)
 * CTA buttons: large (24px) or standard (16px) depending on button size
 * Empty states: large (24px)
 * Display/hero moments: >24px (size case-by-case, e.g., 48px, 64px)
 *
 * Rule: Never hardcode size={X}. Use the iconSize.* tier, pair with correct stroke.
 * Exception: Display/hero moments (SupaprodMark, MarkGlint, etc.) can use custom sizes.
 */

export type IconSizeTier = keyof typeof iconSize;
