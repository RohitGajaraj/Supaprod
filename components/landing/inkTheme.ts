import type { CSSProperties } from "react";

/**
 * The landing canvas, mapped onto the public pages' CSS-variable vocabulary
 * (founder ruling 2026-07-15: every page a landing link reaches speaks the
 * same language as the landing). Spread onto a page's root style so its
 * parchment-era var fallbacks resolve to ink instead.
 */
export const PUBLIC_INK_THEME = {
  "--paper": "#0a0a0a",
  "--canvas": "#0d0d0e",
  "--soft-stone": "#18181b",
  "--ink": "#f4f4f5",
  "--ink-subtle": "#a1a1aa",
  "--ink-muted": "#8f959e",
  "--ink-faint": "#565c66",
  "--text-primary": "#f4f4f5",
  "--text-body": "#a1a1aa",
  "--text-subtle": "#71717a",
  "--hairline": "rgba(255,255,255,0.09)",
  "--ember": "#FF6B2C",
  "--moss-success": "#4ac26b",
  "--emerald": "#4ac26b",
  "--madder": "#e5534b",
  "--rose": "#e5534b",
} as CSSProperties;
