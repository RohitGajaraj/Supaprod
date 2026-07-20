// ReceiptLine (comprehension primitive 6.4, design-language-spec).
// The done state: past-tense proof, receipt tone. Kills every "Success!" and
// every silent completion. Copy shape: artifact + what is in it + the one
// next step, counts in mono, believable timestamps always.
// The blocked variant is the only error shape outside the Engine Room:
// plain reason + recovery verb, no apology theater.
// Costs are quiet (spec 7): no cost prop exists here; cost, drivers, and
// trace links live behind the kebab (onDetails), one deliberate gesture
// deeper.

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Mono count inside a receipt sentence: "9 requirements, 2 open questions". */
export function ReceiptCount({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-xs tabular-nums" style={{ color: "var(--ink-text)" }}>
      {children}
    </span>
  );
}

export interface ReceiptLineProps {
  /** The past-tense sentence (done) or the plain reason (blocked). Wrap counts in ReceiptCount. */
  children: ReactNode;
  /** done: check glyph, receipt tone. blocked: plain reason + recovery verb. */
  variant?: "done" | "blocked";
  /** The one next step (done) or the recovery verb (blocked): "Review it" / "Reconnect to resume". */
  actionLabel?: string;
  onAction?: () => void;
  /** Opens the kebab affordance (Details: cost, driver, trace links). */
  onDetails?: () => void;
  /** Only where a restore point is wired: renders "Revert" behind a dry confirm. */
  onRevert?: () => void;
  /** What the revert restores, for the dry confirm line. Default keeps it generic. */
  revertConfirmLine?: string;
  /** Slot for the NextLine journey chips (primitive 6.5). */
  next?: ReactNode;
  className?: string;
}

export function ReceiptLine({
  children,
  variant = "done",
  actionLabel,
  onAction,
  onDetails,
  onRevert,
  revertConfirmLine = "This restores the previous revision. Continue?",
  next,
  className,
}: ReceiptLineProps) {
  const [confirmingRevert, setConfirmingRevert] = useState(false);
  const blocked = variant === "blocked";

  return (
    <div className={cn("text-[12.5px] leading-normal", className)}>
      <div className="flex items-baseline gap-[9px]" style={{ color: "var(--ink-body)" }}>
        <span
          aria-hidden
          className="flex-none text-[11px]"
          style={{ color: blocked ? "var(--ink-subtle)" : "var(--verdict-pass)" }}
        >
          {"✓"}
        </span>
        <span className="min-w-0">
          {children}
          {actionLabel ? (
            <>
              {" "}
              <button
                type="button"
                onClick={onAction}
                className="ink-focus cursor-pointer border-b transition-colors"
                style={{ color: "var(--ink-text)", borderColor: "var(--ink-hairline)" }}
              >
                {actionLabel}
              </button>
            </>
          ) : null}
        </span>
        <span className="ml-auto flex flex-none items-center gap-1">
          {onRevert && !confirmingRevert ? (
            <button
              type="button"
              onClick={() => setConfirmingRevert(true)}
              className="ink-focus text-[11px] transition-colors hover:text-[var(--ink-body)]"
              style={{ color: "var(--ink-subtle)" }}
            >
              Revert
            </button>
          ) : null}
          {onDetails ? (
            <button
              type="button"
              onClick={onDetails}
              title="Details"
              aria-label="Details"
              className="ink-focus inline-flex h-[22px] w-[22px] items-center justify-center rounded-md text-sm transition-colors hover:bg-[var(--ink-raised)]"
              style={{ color: "var(--ink-subtle)" }}
            >
              {"⋮"}
            </button>
          ) : null}
        </span>
      </div>
      {confirmingRevert ? (
        <div
          className="mt-1.5 flex items-center gap-2 pl-5 text-[11.5px]"
          style={{ color: "var(--ink-subtle)" }}
        >
          <span>{revertConfirmLine}</span>
          <button
            type="button"
            onClick={() => {
              setConfirmingRevert(false);
              onRevert?.();
            }}
            className="ink-focus border-b transition-colors"
            style={{ color: "var(--ink-text)", borderColor: "var(--ink-hairline)" }}
          >
            Revert
          </button>
          <button
            type="button"
            onClick={() => setConfirmingRevert(false)}
            className="ink-focus transition-colors hover:text-[var(--ink-body)]"
          >
            Cancel
          </button>
        </div>
      ) : null}
      {next ? <div className="pl-5">{next}</div> : null}
    </div>
  );
}
