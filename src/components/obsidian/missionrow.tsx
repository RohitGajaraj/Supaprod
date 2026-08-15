import * as React from "react";
import { cn } from "@/lib/utils";
import { StatusDot, STATUS_STYLES, STATUS_WORD, type StatusState } from "./status";
import { VerdictChip, type VerdictTone } from "./verdict";
import { AutoChip } from "@/components/supaprod/AutoChip";

export type MissionRowStatus = Extract<
  StatusState,
  "working" | "gate" | "done" | "blocked" | "queued"
>;

export interface MissionRowProps {
  status: MissionRowStatus;
  title: string;
  /** When true, a small "Auto" chip marks the row as a loop-raised mission. */
  isAuto?: boolean;
  verdict?: VerdictTone;
  stepLabel: string;
  cost: string;
  /** Dim 17 trace-and-time tail (both optional so existing callers are
   * unaffected): the mono relative time (present, --text-subtle) over the
   * faint mono trace ref (--text-faint). */
  time?: string;
  traceLabel?: string;
  onOpen: () => void;
  className?: string;
}

/** Full-width real `<button>` row (README §5.12: every acting row is a
 * `<button>`). Hover is tonal (background fill), never spatial. */
export const MissionRow = React.forwardRef<HTMLButtonElement, MissionRowProps>(
  (
    { status, title, isAuto, verdict, stepLabel, cost, time, traceLabel, onOpen, className },
    ref,
  ) => (
    <button
      ref={ref}
      type="button"
      onClick={onOpen}
      className={cn(
        "flex w-full items-center gap-3 text-left outline-none",
        "hover:[background-color:var(--hover)]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]",
        className,
      )}
      style={{
        padding: "14px 18px",
        borderBottom: "1px solid var(--hairline)",
        transitionProperty: "background-color",
        transitionDuration: "var(--dur-control)",
        transitionTimingFunction: "var(--ease)",
      }}
    >
      <StatusDot state={status} word={STATUS_WORD[status]} className="shrink-0" />
      <span
        className="min-w-0 flex-1 truncate"
        style={{
          fontFamily: "var(--font-sans)",
          fontWeight: 600,
          color: "var(--text-primary)",
        }}
      >
        {title}
      </span>
      {isAuto ? <AutoChip /> : null}
      {(status === "done" || status === "blocked") && verdict ? (
        <VerdictChip tone={verdict} />
      ) : null}
      <span
        className="shrink-0 text-right uppercase"
        title={stepLabel}
        style={{
          width: "96px",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.11em",
          color: STATUS_STYLES[status].color,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {stepLabel}
      </span>
      {time || traceLabel ? (
        <span
          className="shrink-0 text-right"
          style={{ width: "104px", display: "flex", flexDirection: "column", gap: "2px" }}
        >
          {time ? (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.06em",
                color: "var(--text-subtle)",
              }}
            >
              {time}
            </span>
          ) : null}
          {traceLabel ? (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.06em",
                color: "var(--text-faint)",
              }}
            >
              {traceLabel}
            </span>
          ) : null}
        </span>
      ) : null}
      <span
        className="shrink-0 text-right"
        style={{
          width: "44px",
          fontFamily: "var(--font-mono)",
          color: "var(--text-faint)",
        }}
      >
        {cost}
      </span>
    </button>
  ),
);
MissionRow.displayName = "MissionRow";
