// PulseLine (comprehension primitive 6.2, design-language-spec).
// The single way "the machine is working" is written anywhere: Working strip,
// Thread live items, Spine hover, drawer. Anatomy: [agent chip] [verb phrase]
// [object] [honest time]. Machine ramp only; the pulse rides the live locus,
// never the ambient tier. Never a fake countdown, never a percentage bar.
// Reduced motion: ink-working and ink-caret resolve to static frames in
// ink.css.

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { AgentChip } from "./SurfaceHeader";

export type PulseLineState = "working" | "queued" | "bridging" | "idle";

interface PulseLineBaseProps {
  className?: string;
}

export interface PulseLineActiveProps extends PulseLineBaseProps {
  /**
   * working: the live locus (solid machine hue + pulse).
   * queued: dim tier, no pulse. bridging: between steps, no owner yet.
   */
  state?: Exclude<PulseLineState, "idle">;
  agentSlug: string;
  /** The verb phrase + object, lowercase predicate ("writing the spec for checkout autofill"). */
  line: string;
  /** Honest time only: an estimate the engine has, elapsed time, or "Nearly done". */
  time?: string;
  /** Streaming text: appends the machine caret. */
  streaming?: boolean;
}

export interface PulseLineIdleProps extends PulseLineBaseProps {
  /** The idle strip summary, e.g. "3 agents working, 1 waiting on you". Clickable. */
  state: "idle";
  summary: string;
  onClick?: () => void;
}

export type PulseLineProps = PulseLineActiveProps | PulseLineIdleProps;

const STATE_COLOR: Record<Exclude<PulseLineState, "idle">, string> = {
  working: "var(--voice-machine)",
  queued: "var(--ink-faint)",
  bridging: "var(--ink-subtle)",
};

export function PulseLine(props: PulseLineProps) {
  if (props.state === "idle") {
    return (
      <button
        type="button"
        onClick={props.onClick}
        className={cn(
          "ink-focus inline-flex items-center gap-2 font-mono text-[11px] transition-colors",
          props.className,
        )}
        style={{ color: "var(--ink-subtle)" }}
      >
        {props.summary}
      </button>
    );
  }

  const state = props.state ?? "working";
  const color = STATE_COLOR[state];
  const dotStyle: CSSProperties =
    state === "bridging"
      ? { background: "transparent", border: "1px dashed var(--ink-subtle)" }
      : { background: state === "working" ? "var(--voice-machine)" : "var(--ink-faint)" };

  return (
    <div className={cn("flex items-center gap-2 text-[12.5px]", props.className)} style={{ color }}>
      <span
        aria-hidden
        className={cn(
          "h-[7px] w-[7px] flex-none rounded-full",
          state === "working" && "ink-working",
        )}
        style={dotStyle}
      />
      <AgentChip slug={props.agentSlug} />
      <span className={cn("min-w-0 truncate", props.streaming && "ink-caret")}>{props.line}</span>
      {props.time ? (
        <span
          className="flex-none font-mono text-[11px] tabular-nums"
          style={{ color: "var(--ink-subtle)" }}
        >
          {props.time}
        </span>
      ) : null}
    </div>
  );
}
