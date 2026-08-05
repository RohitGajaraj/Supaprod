// GateChip (comprehension primitive 6.3, design-language-spec).
// Chips wear slate silver (founder ruling 2026-07-19, Addendum 1.3); ember
// marks only the primary action inside the card. A gate renders as a
// chip (Spine, rows) and a card (Thread, tray); both are the same object with
// one count from one source, so approving from any rendering clears all.
// The copy contract is binding: every ember string answers what waits, why it
// is your call, and what approving sets in motion.
// The four verbs are fixed (canonical action registry): Approve and run (1),
// Send back (2), Decline (3), Open the evidence (Enter). Snooze (H) defers.
// Costs never render here (spec 7).

import { cn } from "@/lib/utils";
import { AgentChip } from "./SurfaceHeader";

/** Inline keyboard hint: shortcuts teach themselves. */
export function Kbd({ children, onAccent }: { children: string; onAccent?: boolean }) {
  return (
    <span
      className="inline-flex h-4 min-w-4 items-center justify-center rounded px-1 font-mono text-[10px]"
      style={
        onAccent
          ? { border: "1px solid rgba(10, 10, 10, 0.35)", color: "rgba(10, 10, 10, 0.7)" }
          : { border: "1px solid var(--ink-hairline)", color: "var(--ink-subtle)" }
      }
    >
      {children}
    </span>
  );
}

export interface GateReceipt {
  /** Mono receipt label: an evidence link or the agent's track record ("Draft: 12 of 14 approved"). */
  label: string;
  onOpen?: () => void;
}

export interface GateChipPillProps {
  variant: "chip";
  /** What waits, compressed for a row or Spine node ("Your call" / "Needs you"). */
  label: string;
  /** The one count from the one source; omit when the chip marks a single gate. */
  count?: number;
  onOpen?: () => void;
  className?: string;
}

export interface GateChipCardProps {
  variant?: "card";
  /** What waits: "The spec is ready for you." */
  headline: string;
  /** The agent's recommendation, with why it is your call. */
  recommendation: string;
  /** The recommending agent; renders the attribution atom. */
  agentSlug?: string;
  receipts?: GateReceipt[];
  /** What approving sets in motion: "Agents start the build the moment you approve." */
  consequence: string;
  /** Soft gates only: the visible countdown ("Runs in 30s unless you pause"). Hard gates show none. */
  countdown?: string;
  onApprove: () => void;
  /** Optional: only wired where a distinct "return for revision" path exists.
   *  Omitted, the Send back verb does not render (claim never outruns wiring). */
  onSendBack?: () => void;
  onDecline: () => void;
  /** Expands the gate into the Canvas. */
  onOpenEvidence?: () => void;
  /** Defers with a resurface condition. */
  onSnooze?: () => void;
  className?: string;
}

export type GateChipProps = GateChipPillProps | GateChipCardProps;

const GATE_BTN =
  "ink-focus inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg px-[9px] text-xs font-medium transition-colors";

export function GateChip(props: GateChipProps) {
  if (props.variant === "chip") {
    return (
      <button
        type="button"
        onClick={props.onOpen}
        className={cn(
          "ink-focus inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-[11px] border px-[9px] font-mono text-[10.5px] tracking-[0.03em]",
          props.className,
        )}
        style={{
          color: "var(--chip-fg)",
          background: "var(--chip-faint)",
          borderColor: "var(--chip-border)",
        }}
      >
        {typeof props.count === "number" ? (
          <span className="tabular-nums">{props.count}</span>
        ) : null}
        {props.label}
      </button>
    );
  }

  const {
    headline,
    recommendation,
    agentSlug,
    receipts,
    consequence,
    countdown,
    onApprove,
    onSendBack,
    onDecline,
    onOpenEvidence,
    onSnooze,
    className,
  } = props;

  return (
    <div
      className={cn("relative rounded-xl border p-3", className)}
      style={{
        background:
          "linear-gradient(180deg, var(--voice-human-faint), transparent 70%), var(--ink-panel)",
        borderColor: "var(--voice-human-border)",
      }}
    >
      {/* Source recognition (founder pick 2026-07-19: Option B faint voice wash
          + Option C corner mark). The wash above tints the whole card in the
          voice's faint tier; this dot marks the voice at a glance. A gate is the
          human's move, so both are ember. Never an edge strip. */}
      <span
        aria-hidden
        className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full"
        style={{ background: "var(--voice-human)" }}
      />
      <div className="mb-1.5 flex items-center gap-2 pr-3">
        <div className="text-[13.5px] font-semibold" style={{ color: "var(--ink-text)" }}>
          {headline}
        </div>
        {agentSlug ? <AgentChip slug={agentSlug} className="ml-auto" /> : null}
      </div>
      <div className="text-[12.5px] leading-[1.55]" style={{ color: "var(--ink-body)" }}>
        {recommendation}
      </div>
      {receipts && receipts.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {receipts.map((receipt) => (
            <button
              key={receipt.label}
              type="button"
              onClick={receipt.onOpen}
              className="ink-focus rounded-[5px] border px-[7px] py-[2px] font-mono text-[10px] tracking-[0.03em] transition-colors hover:bg-[var(--ink-raised)]"
              style={{ borderColor: "var(--ink-hairline)", color: "var(--ink-subtle)" }}
            >
              {receipt.label}
            </button>
          ))}
        </div>
      ) : null}
      {countdown ? (
        <div
          className="mt-2.5 font-mono text-[11px] tabular-nums"
          style={{ color: "var(--voice-human-dim)" }}
        >
          {countdown}
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={onApprove}
          className={cn(GATE_BTN, "hover:brightness-105")}
          style={{ background: "var(--voice-human)", color: "#0a0a0a" }}
        >
          Approve and run <Kbd onAccent>1</Kbd>
        </button>
        {onSendBack ? (
          <button
            type="button"
            onClick={onSendBack}
            className={cn(GATE_BTN, "border hover:bg-[var(--ink-raised)]")}
            style={{
              background: "var(--ink-raised)",
              borderColor: "var(--ink-hairline)",
              color: "var(--ink-text)",
            }}
          >
            Send back <Kbd>2</Kbd>
          </button>
        ) : null}
        <button
          type="button"
          onClick={onDecline}
          className={cn(GATE_BTN, "hover:bg-[var(--ink-raised)]")}
          style={{ color: "var(--ink-subtle)" }}
        >
          Decline <Kbd>3</Kbd>
        </button>
        {onSnooze ? (
          <button
            type="button"
            onClick={onSnooze}
            className={cn(GATE_BTN, "hover:bg-[var(--ink-raised)]")}
            style={{ color: "var(--ink-subtle)" }}
          >
            Snooze <Kbd>H</Kbd>
          </button>
        ) : null}
      </div>
      <div className="mt-2.5 flex items-baseline gap-2.5">
        <span
          className="flex-1 text-[11.5px] leading-normal"
          style={{ color: "var(--ink-subtle)" }}
        >
          {consequence}
        </span>
        {onOpenEvidence ? (
          <button
            type="button"
            onClick={onOpenEvidence}
            className="ink-focus inline-flex flex-none items-center gap-1.5 text-xs transition-colors hover:text-[var(--ink-body)]"
            style={{ color: "var(--ink-subtle)" }}
          >
            Open the evidence <Kbd>{"⏎"}</Kbd>
          </button>
        ) : null}
      </div>
    </div>
  );
}
