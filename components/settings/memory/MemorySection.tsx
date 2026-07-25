import type { ReactNode } from "react";

/**
 * MemorySection - one titled group in the Memory view (decisions, learnings,
 * agent reflections, pending conventions), with its own loading / error /
 * empty states so a slow or failed source never blanks the whole page.
 */
export function MemorySection({
  title,
  count,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  emptyLine,
  children,
}: {
  title: string;
  count?: number;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  emptyLine: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <h2 className="ink-kicker">{title}</h2>
        {typeof count === "number" && count > 0 ? (
          <span className="ink-mono text-[10.5px] text-[var(--ink-faint)]">{count}</span>
        ) : null}
        <div className="h-px flex-1 bg-[var(--ink-hairline)]" />
      </div>
      {isLoading ? (
        <div
          className="flex flex-col gap-2 py-1"
          role="status"
          aria-label={`Loading ${title.toLowerCase()}`}
        >
          <div className="ink-skeleton h-4 w-2/3" />
          <div className="ink-skeleton h-4 w-1/2" />
        </div>
      ) : isError ? (
        <div className="py-1">
          <p className="text-[13px] text-[var(--ink-body)]">
            {`This didn't load. ${errorMessage ?? "The request failed."}`}
          </p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="ink-focus mt-2 rounded-md border border-[var(--ink-hairline)] px-2.5 py-1 text-[12px] text-[var(--ink-body)] hover:border-[var(--ink-subtle)] hover:text-[var(--ink-text)]"
            >
              Try again
            </button>
          ) : null}
        </div>
      ) : count === 0 ? (
        <p className="py-1 text-[13px] text-[var(--ink-subtle)]">{emptyLine}</p>
      ) : (
        <div className="flex flex-col">{children}</div>
      )}
    </section>
  );
}
