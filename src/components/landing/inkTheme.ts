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
  // Text ramp, RE-PITCHED 2026-08-07 so every tier clears WCAG AA.
  //
  // This object overrides the global ink.css ramp for the public pages, which
  // means fixing the global tokens alone would have left the marketing site,
  // the surface launch traffic actually lands on, still failing. Measured
  // against --paper #0a0a0a, which is the ground these are always used on:
  //
  //                  was            is
  //   ink-subtle     #a1a1aa 7.72   unchanged, already passed
  //   ink-muted      #8f959e 6.56   unchanged, already passed
  //   ink-faint      #565c66 2.94   #7a8089 4.97   FAILED, below even the
  //                                                 3:1 large-text floor
  //   text-subtle    #71717a 4.10   #8b8b93 5.86   FAILED
  //
  // `--ink-faint` is the one that mattered. Despite the name it is a text
  // colour in practice, and on these pages it sets the footer column headings,
  // all 24 capability tags across /product, the copy in the waitlist form that
  // explains what joining gets you, and the inactive label on the machine-view
  // toggle that sits in every public footer.
  "--ink-subtle": "#a1a1aa",
  "--ink-muted": "#8f959e",
  "--ink-faint": "#7a8089",
  "--text-primary": "#f4f4f5",
  "--text-body": "#a1a1aa",
  "--text-subtle": "#8b8b93",
  "--hairline": "rgba(255,255,255,0.09)",
  "--ember": "#FF6B2C",
  "--moss-success": "#4ac26b",
  "--emerald": "#4ac26b",
  "--madder": "#e5534b",
  "--rose": "#e5534b",
} as CSSProperties;
