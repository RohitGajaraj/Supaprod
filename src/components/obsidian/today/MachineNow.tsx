import * as React from "react";
import {
  StatusDot,
  STATUS_STYLES,
  STATUS_WORD,
  type StatusState,
} from "@/components/obsidian/status";

export type MachineNowStatus = Extract<StatusState, "working" | "queued">;

export interface MachineNowRow {
  id: string;
  title: string;
  status: MachineNowStatus;
  step: string;
  cost: string;
  onOpen: () => void;
  /** Dim 17: the MIS trace ref (faint) + relative start time (a touch more
   * present), shown as a quiet second line. Optional. */
  traceRef?: string;
  time?: string;
}

export interface MachineNowProps {
  rows: MachineNowRow[];
  onOpenAll: () => void;
}

/** "The machine right now" — up to four live/queued agent runs, each a real
 * button that opens Build. Idle state is an instruction with a time
 * estimate, never a blank card. */
export function MachineNow({ rows, onOpenAll }: MachineNowProps) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-card)",
        padding: "16px 18px",
        boxShadow: "var(--top-light)",
      }}
    >
      <div className="flex items-center" style={{ gap: 8, marginBottom: rows.length ? 4 : 0 }}>
        <span
          className="flex-1"
          style={{
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.12em",
            color: "var(--text-subtle)",
            textTransform: "uppercase",
          }}
        >
          The machine right now
        </span>
        <button
          type="button"
          onClick={onOpenAll}
          className="outline-none transition-colors [color:var(--text-subtle)] hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
          style={{
            fontFamily: "var(--font-mono)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          OPEN →
        </button>
      </div>
      {rows.length === 0 ? (
        <p style={{ lineHeight: 1.5, color: "var(--text-muted)", marginTop: 10 }}>
          The cockpit is idle. Send something worth building from Discover · about two minutes.
        </p>
      ) : (
        <div className="flex flex-col" style={{ gap: 9, marginTop: 8 }}>
          {rows.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={r.onOpen}
              className="flex w-full items-center text-left outline-none transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
              style={{ gap: 9, background: "transparent", border: "none", padding: 0 }}
            >
              <StatusDot state={r.status} word={STATUS_WORD[r.status]} className="shrink-0" />
              <span className="min-w-0 flex-1">
                <span
                  className="block truncate"
                  style={{
                    fontFamily: "var(--font-sans)",
                    color: "var(--text-primary)",
                  }}
                >
                  {r.title}
                </span>
                {r.traceRef || r.time ? (
                  <span
                    className="block truncate"
                    style={{
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.04em",
                      color: "var(--text-faint)",
                    }}
                  >
                    {[r.traceRef, r.time].filter(Boolean).join(" · ")}
                  </span>
                ) : null}
              </span>
              <span
                className="shrink-0 text-right uppercase"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: STATUS_STYLES[r.status].color,
                }}
              >
                {r.step}
              </span>
              <span
                className="shrink-0 text-right"
                style={{ fontFamily: "var(--font-mono)", color: "var(--text-faint)" }}
              >
                {r.cost}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
