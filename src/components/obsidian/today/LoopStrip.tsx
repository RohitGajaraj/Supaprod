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
  glacier: { border: rgba("#7FD1DC", 0.35), color: "var(--glacier)", shadow: "none" },
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
  onGo,
}: {
  label: string;
  tone: PillTone;
  pulse?: boolean;
  onGo: () => void;
}) {
  const s = TONE_STYLE[tone];
  return (
    <button
      type="button"
      onClick={onGo}
      className="inline-flex items-center outline-none transition-colors hover:[background-color:#141416] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
      style={{
        gap: 7,
        border: `1px solid ${s.border}`,
        borderRadius: "var(--radius-pill)",
        padding: "6px 13px",
        background: "transparent",
        color: s.color,
        fontFamily: "var(--font-mono)",
        fontSize: 9.5,
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
            background: "#7FD1DC",
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
}

/** The five-pill loop strip: SENSE -> DECIDE -> DEFINE -> BUILD -> LEARN,
 * each a jump to its surface. DECIDE and BUILD read live state (pending
 * calls / working agents); SENSE, DEFINE, LEARN read the 24h loop pulse. */
export function LoopStrip({ counts, pendingCalls, workingCount, onGo }: LoopStripProps) {
  const pills: { key: LoopSurface; label: string; tone: PillTone; pulse?: boolean }[] = [
    { key: "discover", label: `SENSE · ${counts.sense}`, tone: "quiet" },
    {
      key: "today",
      label: `DECIDE · ${pendingCalls} CALL${pendingCalls === 1 ? "" : "S"}`,
      tone: decideTone(pendingCalls),
    },
    { key: "define", label: `DEFINE · ${counts.define}`, tone: "quiet" },
    { key: "build", label: `BUILD · ${workingCount}`, tone: "glacier", pulse: true },
    { key: "brain", label: `LEARN · ${counts.learn}`, tone: "quiet" },
  ];
  return (
    <div className="flex flex-wrap items-center" style={{ gap: 8, marginBottom: 28 }}>
      {pills.map((p, i) => (
        <React.Fragment key={p.key}>
          {i > 0 && (
            <span aria-hidden="true" style={{ color: "var(--text-faint)", fontSize: 11 }}>
              →
            </span>
          )}
          <Pill label={p.label} tone={p.tone} pulse={p.pulse} onGo={() => onGo(p.key)} />
        </React.Fragment>
      ))}
    </div>
  );
}
