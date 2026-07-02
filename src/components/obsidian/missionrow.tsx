import * as React from "react";
import { cn } from "@/lib/utils";
import { StatusDot, STATUS_STYLES, STATUS_WORD, type StatusState } from "./status";
import { VerdictChip, type VerdictTone } from "./verdict";

export type MissionRowStatus = Extract<StatusState, "working" | "gate" | "done" | "queued">;

export interface MissionRowProps {
  status: MissionRowStatus;
  title: string;
  verdict?: VerdictTone;
  stepLabel: string;
  cost: string;
  onOpen: () => void;
  className?: string;
}

/** Full-width real `<button>` row (README §5.12: every acting row is a
 * `<button>`). Hover is tonal (background fill), never spatial. */
export const MissionRow = React.forwardRef<HTMLButtonElement, MissionRowProps>(
  ({ status, title, verdict, stepLabel, cost, onOpen, className }, ref) => (
    <button
      ref={ref}
      type="button"
      onClick={onOpen}
      className={cn(
        "flex w-full items-center gap-3 text-left outline-none",
        "hover:[background-color:#141416]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]",
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
          fontFamily: "var(--font-ui)",
          fontSize: "13.5px",
          fontWeight: 600,
          color: "var(--text-primary)",
        }}
      >
        {title}
      </span>
      {status === "done" && verdict ? <VerdictChip tone={verdict} /> : null}
      <span
        className="shrink-0 text-right uppercase"
        style={{
          width: "96px",
          fontFamily: "var(--font-mono)",
          fontSize: "9px",
          letterSpacing: "0.11em",
          color: STATUS_STYLES[status].color,
        }}
      >
        {stepLabel}
      </span>
      <span
        className="shrink-0 text-right"
        style={{
          width: "44px",
          fontFamily: "var(--font-mono)",
          fontSize: "9px",
          color: "var(--text-faint)",
        }}
      >
        {cost}
      </span>
    </button>
  ),
);
MissionRow.displayName = "MissionRow";
