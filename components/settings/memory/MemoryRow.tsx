import { useState } from "react";
import { cn } from "@/lib/utils";
import { VerdictChip, type VerdictTone } from "@/components/ink";

/**
 * MemoryRow - one entry in the workspace memory ledger (settings §11 research).
 * Anatomy: snippet · source · date, plus an optional delete affordance for
 * entries with a real backing delete function. Entries with no delete/edit
 * function render read-only with a short honest note instead of a dead button.
 */
export function MemoryRow({
  snippet,
  source,
  date,
  verdict,
  onDelete,
  deleteLabel = "Forget",
  readOnlyNote,
  className,
}: {
  snippet: string;
  source: string;
  date: string;
  verdict?: { tone: VerdictTone; label: string };
  onDelete?: () => void | Promise<void>;
  deleteLabel?: string;
  /** Shown instead of a delete button when no backing fn exists yet. */
  readOnlyNote?: string;
  className?: string;
}) {
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!onDelete || pending) return;
    setPending(true);
    try {
      await onDelete();
    } finally {
      setPending(false);
    }
  }

  const dateLabel = (() => {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return date;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  })();

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 border-b border-[var(--ink-hairline-soft)] py-3 last:border-b-0",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] leading-6 text-[var(--ink-text)]">{snippet}</p>
        <div className="ink-mono mt-1 flex flex-wrap items-center gap-2 text-[10.5px] text-[var(--ink-subtle)]">
          {verdict ? <VerdictChip tone={verdict.tone}>{verdict.label}</VerdictChip> : null}
          <span>{source}</span>
          <span aria-hidden>·</span>
          <span>{dateLabel}</span>
        </div>
      </div>
      {onDelete ? (
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={pending}
          className={cn(
            "ink-focus shrink-0 rounded-md border border-[var(--ink-hairline)] px-2.5 py-1 text-[12px] text-[var(--ink-subtle)] transition-colors duration-150 hover:border-[var(--ink-subtle)] hover:text-[var(--ink-text)]",
            pending && "opacity-60",
          )}
        >
          {pending ? "Forgetting…" : deleteLabel}
        </button>
      ) : readOnlyNote ? (
        <span
          className="ink-mono shrink-0 text-[10.5px] text-[var(--ink-faint)]"
          title={readOnlyNote}
        >
          read only
        </span>
      ) : null}
    </div>
  );
}
