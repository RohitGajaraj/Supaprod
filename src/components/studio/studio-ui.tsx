import type { CSSProperties } from "react";
import { StatusBadge, StepDot } from "@/components/supaprod/Primitives";
import { changesetColor, changesetLabel, statusLabel } from "./studio-format";

/**
 * Tempo v5: the shared raised-card treatment for the Build spine, values
 * matching the `material-medium` preset (contract SS4). Kept as a style
 * object (not a className) so every existing `{...LOOM_CARD}` spread across
 * the surface picks up the fix with no call-site changes.
 * PENDING VISUAL QA (2026-07-11): background here is material-medium's
 * --ds-background-100, which may not match the legacy --card tone under
 * [data-obsidian] scope - see DESIGN-TEMPO.md pending-issues note.
 */
export const LOOM_CARD: CSSProperties = {
  background: "var(--ds-background-100)",
  borderRadius: "var(--ds-radius-medium)",
  boxShadow: "var(--ds-shadow-border-medium)",
};

/**
 * Loading skeleton block (DESIGN-LOOM §9: shimmer skeletons that match the
 * real layout, never spinners for primary content). Radius matches LOOM_CARD
 * (material-medium) so the placeholder traces the shape of the card it
 * stands in for. Pure presentation.
 */
export function SkeletonBlock({ height, style }: { height: number; style?: CSSProperties }) {
  return (
    <div
      aria-hidden="true"
      style={{
        height,
        borderRadius: "var(--ds-radius-medium)",
        background: "var(--surface-raised)",
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
  // halted (kill switch / engine stop) — madder pill, no pulse. Madder is the
  // failure-outcome role; --rose is a data color under Obsidian and may not
  // carry a failure meaning (role-color law).
  const c = status === "halted" ? "var(--madder)" : "var(--text-faint)";
  return (
    <span
      className="mono-label"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
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
