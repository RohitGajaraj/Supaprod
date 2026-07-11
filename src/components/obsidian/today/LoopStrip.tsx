import * as React from "react";
import { rgba } from "@/components/obsidian/primitives";

export type LoopSurface = "discover" | "today" | "define" | "build" | "brain";

export type PillTone = "ember" | "glacier" | "quiet";

const TONE_STYLE: Record<PillTone, { border: string; color: string; shadow: string }> = {
  ember: {
    border: rgba("#FF6B2C", 0.5),
    color: "var(--ember)",
    shadow: "0 0 14px rgba(255,107,44,0.15)",
  },
  glacier: { border: rgba("#84b3ec", 0.35), color: "var(--glacier)", shadow: "none" },
  quiet: { border: "rgba(255,255,255,0.12)", color: "var(--text-muted)", shadow: "none" },
};

/** PURE — DECIDE goes ember only when calls pend (README law 2: ember is
 * reserved exclusively for the one attention queue). */
export function decideTone(pendingCalls: number): PillTone {
  return pendingCalls > 0 ? "ember" : "quiet";
}

function Pill({
  label,
  tone,
  pulse,
  title,
  compact,
  onGo,
}: {
  label: string;
  tone: PillTone;
  pulse?: boolean;
  title?: string;
  compact?: boolean;
  onGo: () => void;
}) {
  const s = TONE_STYLE[tone];
  return (
    <button
      type="button"
      onClick={onGo}
      title={title}
      className="inline-flex items-center outline-none transition-colors hover:[background-color:#141416] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--ember)]"
      style={{
        gap: 7,
        border: `1px solid ${s.border}`,
        borderRadius: "var(--radius-pill)",
        padding: compact ? "4px 10px" : "6px 13px",
        background: "transparent",
        color: s.color,
        fontFamily: "var(--font-mono)",
        fontSize: compact ? 9 : 9.5,
        letterSpacing: "0.10em",
        boxShadow: s.shadow,
        transitionDuration: "140ms",
      }}
    >
      {pulse && (
        <span
          aria-hidden="true"
          style={{
            width: 5,
            height: 5,
            borderRadius: "var(--radius-pill)",
            background: "#84b3ec",
            animation: "cadPulse 2s ease-in-out infinite",
          }}
        />
      )}
      {label}
    </button>
  );
}

export interface LoopStripProps {
  counts: { sense: number; define: number; learn: number };
  pendingCalls: number;
  workingCount: number;
  onGo: (surface: LoopSurface) => void;
  /** PC-32 block 6: folded into the hero row — smaller pills, no caption. */
  compact?: boolean;
}

/** The five-pill loop strip: SENSE -> DECIDE -> DEFINE -> BUILD -> LEARN,
 * each a jump to its surface. DECIDE and BUILD read live state (pending
 * calls / working agents); SENSE, DEFINE, LEARN read the 24h loop pulse. */
export function LoopStrip({ counts, pendingCalls, workingCount, onGo, compact }: LoopStripProps) {
  const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  const pills: {
    key: LoopSurface;
    label: string;
    tone: PillTone;
    pulse?: boolean;
    title: string;
  }[] = [
    {
      key: "discover",
      label: `SENSE · ${counts.sense}`,
      tone: "quiet",
      title: `${count(counts.sense, "signal", "signals")} sensed in the last 24 hours`,
    },
    {
      key: "today",
      label: `DECIDE · ${pendingCalls} CALL${pendingCalls === 1 ? "" : "S"}`,
      tone: decideTone(pendingCalls),
      title:
        pendingCalls > 0
          ? `${count(pendingCalls, "call", "calls")} waiting on you right now`
          : "No calls waiting on you right now",
    },
    {
      key: "define",
      label: `DEFINE · ${counts.define}`,
      tone: "quiet",
      title: `${count(counts.define, "spec", "specs")} drafted in the last 24 hours`,
    },
    {
      key: "build",
      label: `BUILD · ${workingCount}`,
      tone: "glacier",
      pulse: true,
      title:
        workingCount > 0
          ? `${count(workingCount, "mission", "missions")} building right now`
          : "Nothing building right now",
    },
    {
      key: "brain",
      label: `LEARN · ${counts.learn}`,
      tone: "quiet",
      title: `${count(counts.learn, "outcome", "outcomes")} recorded in the last 24 hours`,
    },
  ];
  return (
    <div style={{ marginBottom: compact ? 18 : 28 }}>
      <div className="flex flex-wrap items-center" style={{ gap: compact ? 6 : 8 }}>
        {pills.map((p, i) => (
          <React.Fragment key={p.key}>
            {i > 0 && (
              <span
                aria-hidden="true"
                style={{ color: "var(--text-faint)", fontSize: compact ? 10 : 11 }}
              >
                →
              </span>
            )}
            <Pill
              label={p.label}
              tone={p.tone}
              pulse={p.pulse}
              title={p.title}
              compact={compact}
              onGo={() => onGo(p.key)}
            />
          </React.Fragment>
        ))}
      </div>
      {!compact ? (
        <p style={{ margin: "9px 0 0", fontSize: 11, lineHeight: 1.4, color: "var(--text-faint)" }}>
          Sensed, defined, and learned in the last 24 hours. Calls and builds are live now.
        </p>
      ) : null}
    </div>
  );
}
