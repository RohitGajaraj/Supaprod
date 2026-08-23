import { cn } from "@/lib/utils";

/**
 * VerdictChip - a rendered judgment annotating content (never live state).
 * Mono caps outline pill; the word + the voice carry the whole meaning.
 * StatusGlyph - live state (running, queued, at gate); never a judgment.
 * The distinction keeps the system honest: judgments annotate, state pulses.
 */

export type VerdictTone = "pass" | "fail" | "human" | "machine" | "neutral";

const VERDICT_COLOR: Record<VerdictTone, string> = {
  pass: "var(--verdict-pass)",
  fail: "var(--verdict-fail)",
  human: "var(--voice-human)",
  machine: "var(--voice-machine)",
  neutral: "var(--ink-subtle)",
};

export function VerdictChip({
  tone,
  children,
  className,
}: {
  tone: VerdictTone;
  children: string;
  className?: string;
}) {
  const color = VERDICT_COLOR[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-px font-mono text-mrd-nano font-semibold uppercase leading-4 tracking-[0.1em]",
        className,
      )}
      style={{ color, borderColor: `color-mix(in oklab, ${color} 45%, transparent)` }}
    >
      {children}
    </span>
  );
}

export type LiveState = "running" | "queued" | "gate" | "paused" | "idle";

const STATE_META: Record<LiveState, { color: string; word: string; pulse?: boolean }> = {
  running: { color: "var(--voice-machine)", word: "running", pulse: true },
  queued: { color: "var(--ink-subtle)", word: "queued" },
  gate: { color: "var(--voice-human)", word: "needs you" },
  paused: { color: "var(--voice-machine-dim)", word: "paused" },
  idle: { color: "var(--ink-faint)", word: "idle" },
};

export function StatusGlyph({
  state,
  label,
  className,
}: {
  state: LiveState;
  /** Override the default state word (keep it honest and plain). */
  label?: string;
  className?: string;
}) {
  const meta = STATE_META[state];
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        aria-hidden
        className={cn("h-1.5 w-1.5 rounded-full", meta.pulse && "ink-working")}
        style={{ background: meta.color }}
      />
      <span className="ink-mono text-mrd-tiny" style={{ color: meta.color }}>
        {label ?? meta.word}
      </span>
    </span>
  );
}
