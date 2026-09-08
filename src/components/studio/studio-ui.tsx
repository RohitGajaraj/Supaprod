import type { CSSProperties } from "react";
import { StatusBadge, StepDot } from "@/components/supaprod/Primitives";
import { changesetColor, changesetLabel, statusLabel } from "./studio-format";

/**
 * The shared raised-card treatment for the Build spine.
 *
 * ── PORTED TO MERIDIAN 2026-08-18, TOKEN FOR TOKEN ──────────────────────
 * It was three `--ds-*` tokens: the Tempo v5 `material-medium` preset, from a
 * system retired on 2026-08-14. Each has an exact Meridian counterpart and the
 * shape does not move a pixel:
 *
 *   --ds-background-100     the card ground        -> --mrd-sheet
 *   --ds-radius-medium      12px                   -> --mrd-r-card (12px)
 *   --ds-shadow-border-medium  a 1px ring plus a soft drop
 *                                                  -> the ring written as an
 *                              inset, plus --mrd-shadow-card
 *
 * The ring is an `inset 0 0 0 1px` rather than a `border`, deliberately: this
 * is a STYLE OBJECT spread onto callers who already own their own box model,
 * and adding a real border would move every one of them by a pixel. An inset
 * shadow draws the same line and costs no layout.
 *
 * Kept as a style object (not a className) so every existing `{...LOOM_CARD}`
 * spread picks the port up with no call-site change. Three files outside the
 * studio folder spread it, and this is the whole of what they needed.
 */
export const LOOM_CARD: CSSProperties = {
  background: "var(--mrd-sheet)",
  borderRadius: "var(--mrd-r-card)",
  boxShadow: "inset 0 0 0 1px var(--mrd-line), var(--mrd-shadow-card)",
};

/**
 * Build (engine: F-STUDIO) shared status components — screen 9 Ember port.
 * StatusChip adapts the studio status vocabulary onto the canonical
 * StatusBadge (live-state law: badge + pulse, never a VerdictChip);
 * `waiting_approval` maps to the badge's `gate` state (an approval IS a
 * gate — ember, pulsing). `halted` has no badge state and Primitives is
 * frozen across parallel sessions, so it renders the same pill anatomy
 * file-locally in madder — LOGGED for consolidation into StatusBadge.
 * StatusIcon is the screen-4 mission-row StepDot.
 */

const BADGE_STATE: Record<string, string> = {
  waiting_approval: "gate",
  running: "running",
  queued: "queued",
  completed: "completed",
  failed: "failed",
};

const DOT_STATE: Record<string, string> = {
  completed: "completed",
  running: "running",
  queued: "planned",
  waiting_approval: "gate",
  failed: "failed",
  halted: "failed",
};
