import { memo } from "react";
import { ExternalLink, Radio } from "lucide-react";
import { ProviderLogo } from "@/components/connections/ProviderLogo";
import { CONNECTOR_REGISTRY, type ProviderId } from "@/lib/connectors/registry";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AskInContext } from "@/components/obsidian/AskInContext";
import { signalPreview } from "./format";
import { AuditTag } from "@/components/cadence/AuditTag";

export interface SignalCardProps {
  src: string;
  when: string;
  quote: string;
  theme: string | null;
  /** The real signal id, source of the faint `SIG·XXXXXX` trace tail so every
   * captured signal carries a stable, human-quotable reference that ties it to
   * the rest of the loop. Omit and the tail is skipped (never fabricated). */
  id?: string;
  /** The raw source string (e.g. 'github', 'stripe', 'intercom'), used to pick
   * the origin glyph. `src` above is the pre-capitalized display label. */
  sourceId?: string;
  /** The single source reference URL when the signal has one, wired straight
   * from the signals row's `url` column. */
  url?: string | null;
  /** Last card in the feed omits the divider (OBS-06.md §7). */
  isLast?: boolean;
  /** Click-to-open (platform principle): opens this signal's rich detail
   * directly. When present the whole card becomes a button; the `⋯` menu
   * stops propagation so a menu press never also opens the detail. */
  onOpen?: () => void;
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
 * quiet `⋯` action menu (promote / draft spec / provenance / delete). The
 * whole card is click-to-open (opens the signal's rich detail); the menu is
 * for secondary actions only and stops propagation so it never also opens the
 * detail. Memoized to prevent re-renders when parent re-renders but props
 * unchanged. */
export const SignalCard = memo(function SignalCard({
  src,
  when,
  quote,
  theme,
  id,
  sourceId,
  url,
  isLast = false,
  onOpen,
  onPromote,
  onDraftSpec,
  onLineage,
  onDelete,
  actionsPending = false,
}: SignalCardProps) {
  const hasActions = onPromote || onDraftSpec || onLineage || onDelete;
  const clickable = Boolean(onOpen);
  // A known connector gets its brand mark; anything else (manual capture, web
  // research, an unmapped source) still shows a neutral origin glyph.
  const knownProvider = Boolean(sourceId && sourceId in CONNECTOR_REGISTRY);
  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? "Open signal detail" : undefined}
      onClick={clickable ? onOpen : undefined}
      onKeyDown={
        clickable
          ? (event) => {
              if (
                (event.key === "Enter" || event.key === " ") &&
                event.target === event.currentTarget
              ) {
                event.preventDefault();
                onOpen?.();
              }
            }
          : undefined
      }
      className={
        clickable
          ? "loom-press outline-none transition-colors hover:[background-color:var(--surface-raised)] focus-visible:outline-2 focus-visible:[outline-offset:-2px] focus-visible:[outline-color:var(--focus-ring)]"
          : undefined
      }
      style={{
        display: "grid",
        gap: "5px",
        minWidth: 0,
        padding: clickable ? "10px" : undefined,
        margin: clickable ? "0 -10px" : undefined,
        borderRadius: clickable ? "var(--radius-control)" : undefined,
        paddingBottom: "13px",
        borderBottom: isLast ? undefined : "1px solid var(--hairline-faint)",
        cursor: clickable ? "pointer" : undefined,
      }}
    >
      <div className="flex items-center gap-2">
        {knownProvider ? (
          <ProviderLogo provider={sourceId as ProviderId} size={16} />
        ) : (
          <Radio className="h-3.5 w-3.5" aria-hidden style={{ color: "var(--text-subtle)" }} />
        )}
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10.5px",
            letterSpacing: "0.08em",
            color: "var(--text-muted)",
            border: "1px solid color-mix(in srgb, var(--text-muted) 35%, transparent)",
            borderRadius: "var(--radius-pill)",
            padding: "1px 7px",
          }}
        >
          {src}
        </span>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            title="Open source"
            aria-label="Open source"
            onClick={(event) => event.stopPropagation()}
            className="loom-press inline-flex items-center outline-none transition-colors [color:var(--text-subtle)] hover:[color:var(--ds-gray-1000)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : null}
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
                onClick={(event) => event.stopPropagation()}
                title={actionsPending ? "Working on this signal…" : undefined}
                className="loom-press outline-none transition-colors [color:var(--text-subtle)] hover:[color:var(--text-body)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
                style={{
                  marginLeft: "auto",
                  fontFamily: "var(--font-mono)",
                  fontSize: "14px",
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
        {/* PC-29 layer 6: the one contextual delegation verb for a signal. */}
        {id ? (
          <span style={{ marginLeft: hasActions ? undefined : "auto" }}>
            <AskInContext stationOrKind="signal" targetId={id} targetTitle={quote} />
          </span>
        ) : null}
      </div>
      <p
        style={{
          fontSize: "var(--text-base)",
          lineHeight: 1.55,
          color: "var(--text-body)",
          margin: 0,
          minWidth: 0,
          overflowWrap: "anywhere",
          wordBreak: "break-word",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {signalPreview(quote)}
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
      {id ? <AuditTag kind="signal" id={id} /> : null}
    </div>
  );
});
