import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface SignalCardProps {
  src: string;
  when: string;
  quote: string;
  theme: string | null;
  /** Last card in the feed omits the divider (OBS-06.md §7). */
  isLast?: boolean;
  /** OBS-10: the write actions ported from the retired /product Signals tab.
   * Omit any handler to hide that menu item entirely (e.g. no promote/draft-
   * spec once a signal already has an opportunity) rather than disabling it. */
  onPromote?: () => void;
  onDraftSpec?: () => void;
  onLineage?: () => void;
  onDelete?: () => void;
  actionsPending?: boolean;
}

/** One verbatim signal: source pill, timestamp, quote, theme line, and the
 * quiet `⋯` action menu (promote / draft spec / provenance / delete) ported
 * from the retired /product Signals tab — same overflow pattern
 * `BuildMissionRow` already established for a row's secondary actions. */
export function SignalCard({
  src,
  when,
  quote,
  theme,
  isLast = false,
  onPromote,
  onDraftSpec,
  onLineage,
  onDelete,
  actionsPending = false,
}: SignalCardProps) {
  const hasActions = onPromote || onDraftSpec || onLineage || onDelete;
  return (
    <div
      style={{
        display: "grid",
        gap: "5px",
        paddingBottom: "13px",
        borderBottom: isLast ? undefined : "1px solid var(--hairline-faint)",
      }}
    >
      <div className="flex items-center gap-2">
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10.5px",
            letterSpacing: "0.08em",
            color: "var(--blossom)",
            border: "1px solid color-mix(in srgb, var(--blossom) 35%, transparent)",
            borderRadius: "var(--radius-pill)",
            padding: "1px 7px",
          }}
        >
          {src}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10.5px",
            letterSpacing: "0.08em",
            color: "var(--text-subtle)",
          }}
        >
          {when}
        </span>
        {hasActions ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Signal actions"
                disabled={actionsPending}
                className="loom-press"
                style={{
                  marginLeft: "auto",
                  fontFamily: "var(--font-mono)",
                  fontSize: "14px",
                  color: "var(--text-subtle)",
                  background: "none",
                  border: "none",
                  cursor: actionsPending ? "default" : "pointer",
                  opacity: actionsPending ? 0.5 : 1,
                  padding: "2px 6px",
                }}
              >
                ⋯
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onPromote ? (
                <DropdownMenuItem onClick={onPromote}>
                  Promote · becomes an opportunity
                </DropdownMenuItem>
              ) : null}
              {onDraftSpec ? (
                <DropdownMenuItem onClick={onDraftSpec}>Draft spec</DropdownMenuItem>
              ) : null}
              {onLineage ? (
                <DropdownMenuItem onClick={onLineage}>Where this came from</DropdownMenuItem>
              ) : null}
              {onDelete ? (
                <DropdownMenuItem onClick={onDelete} className="text-[var(--madder)]">
                  Delete
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
      <p
        style={{
          fontSize: "var(--text-base)",
          lineHeight: 1.55,
          color: "var(--text-body)",
          margin: 0,
        }}
      >
        {quote}
      </p>
      {theme ? (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10.5px",
            letterSpacing: "0.08em",
            color: "var(--text-subtle)",
          }}
        >
          {theme}
        </span>
      ) : null}
    </div>
  );
}
