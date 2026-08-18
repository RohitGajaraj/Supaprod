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
 * Loading skeleton block: a shimmer that matches the real layout, never a
 * spinner for primary content. Radius matches LOOM_CARD so the placeholder
 * traces the shape of the card it stands in for. Pure presentation.
 *
 * The ground is `--mrd-lift` and not `--surface-raised`, which aliased the
 * retired `--raised`. A placeholder must read as a raised blank rather than as
 * a recess, and lift is the one stop on the Meridian ladder that says so.
 */
export function SkeletonBlock({ height, style }: { height: number; style?: CSSProperties }) {
  return (
    <div
      aria-hidden="true"
      style={{
        height,
        borderRadius: "var(--mrd-r-card)",
        background: "var(--mrd-lift)",
        animation: "cadGlow 1.8s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

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

export function StatusChip({ status }: { status: string }) {
  const mapped = BADGE_STATE[status];
  if (mapped) return <StatusBadge status={mapped} />;
  // halted (kill switch / engine stop) — no pulse, because nothing is running.
  //
  // `--madder` was the Obsidian failure-outcome role and `--text-faint` its
  // quietest ink; both are retired. Meridian says the same two things in its own
  // five words: a halted engine is an OUTCOME and outcomes are `--mrd-fail`,
  // and an unrecognised status is not an outcome at all, so it stays at the
  // faintest ink rather than borrowing a meaning.
  const c = status === "halted" ? "var(--mrd-fail)" : "var(--mrd-faint)";
  return (
    <span
      className="mono-label"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontWeight: 600,
        color: c,
        border: `1px solid color-mix(in oklab, ${c} 35%, transparent)`,
        borderRadius: 99,
        padding: "2px 8px",
        whiteSpace: "nowrap",
      }}
    >
      <span className="dot" style={{ width: 5, height: 5, background: c }} />
      {statusLabel(status)}
    </span>
  );
}

const DOT_STATE: Record<string, string> = {
  completed: "completed",
  running: "running",
  queued: "planned",
  waiting_approval: "gate",
  failed: "failed",
  halted: "failed",
};

export function StatusIcon({ s }: { s: string }) {
  return <StepDot status={DOT_STATE[s] ?? "planned"} />;
}

/** Changeset ladder chip — staged · committed · PR open (live, indigo) ·
 *  merged (outcome, moss) · abandoned. Mono outline pill, no dot. */
export function ChangesetChip({ status, fileCount }: { status: string; fileCount?: number }) {
  const c = changesetColor(status);
  return (
    <span
      className="mono-label tabular-nums"
      style={{
        color: c,
        border: `1px solid color-mix(in oklab, ${c} 35%, transparent)`,
        borderRadius: 99,
        padding: "1px 8px",
        whiteSpace: "nowrap",
      }}
    >
      {changesetLabel(status)}
      {fileCount != null ? ` · ${fileCount} file${fileCount === 1 ? "" : "s"}` : ""}
    </span>
  );
}
