import { cn } from "@/lib/utils";
import type { ApprovalFilter } from "@/lib/approvals-queue.functions";

const TABS: { id: ApprovalFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "proposals", label: "Proposals" },
  { id: "gates", label: "Gates" },
  { id: "memory", label: "Memory" },
  { id: "spend", label: "Spend" },
];

/**
 * Quiet filter row (architecture §5, point 3): text tabs, not buttons - the
 * restraint budget applies to the queue's own furniture too.
 */
export function FilterTabs({
  value,
  onChange,
  counts,
}: {
  value: ApprovalFilter;
  onChange: (v: ApprovalFilter) => void;
  counts: Record<ApprovalFilter, number>;
}) {
  return (
    <div role="tablist" aria-label="Filter approvals" className="flex items-center gap-5">
      {TABS.map((t) => {
        const active = value === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={cn(
              "ink-focus rounded-sm py-1 text-[13px] transition-colors duration-150",
              active
                ? "font-medium text-[var(--ink-text)]"
                : "text-[var(--ink-subtle)] hover:text-[var(--ink-body)]",
            )}
          >
            {t.label}
            {counts[t.id] > 0 ? (
              <span className="ink-mono ml-1.5 text-[10px] text-[var(--ink-faint)]">
                {counts[t.id]}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
