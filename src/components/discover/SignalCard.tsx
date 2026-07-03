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
 * quiet `⋯` action menu (promote / draft spec / lineage / delete) ported
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
        borderBottom: isLast ? undefined : "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex items-center gap-2">
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "8.5px",
            letterSpacing: "0.08em",
            color: "#E5BDDF",
            border: "1px solid rgba(229,189,223,0.35)",
            borderRadius: "99px",
            padding: "1px 7px",
          }}
        >
          {src}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "8.5px",
            letterSpacing: "0.08em",
            color: "#55524C",
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
                style={{
                  marginLeft: "auto",
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px",
                  color: "var(--text-faint)",
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
              {onLineage ? <DropdownMenuItem onClick={onLineage}>Lineage</DropdownMenuItem> : null}
              {onDelete ? (
                <DropdownMenuItem onClick={onDelete} className="text-[var(--madder)]">
                  Delete
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
      <p style={{ fontSize: "13px", lineHeight: 1.6, color: "#B5AFA6", margin: 0 }}>{quote}</p>
      {theme ? (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "8.5px",
            letterSpacing: "0.08em",
            color: "#7D786F",
          }}
        >
          {theme}
        </span>
      ) : null}
    </div>
  );
}
