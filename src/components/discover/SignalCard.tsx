import { ExternalLink, Radio } from "lucide-react";
import { ProviderLogo } from "@/components/connections/ProviderLogo";
import { CONNECTOR_REGISTRY, type ProviderId } from "@/lib/connectors/registry";
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
 * detail. */
export function SignalCard({
  src,
  when,
  quote,
  theme,
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
          ? "loom-press outline-none transition-colors hover:[background-color:var(--surface-raised)] focus-visible:outline-2 focus-visible:[outline-offset:-2px] focus-visible:[outline-color:var(--glacier)]"
          : undefined
      }
      style={{
        display: "grid",
        gap: "5px",
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
            color: "var(--blossom)",
            border: "1px solid color-mix(in srgb, var(--blossom) 35%, transparent)",
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
            className="loom-press inline-flex items-center outline-none transition-colors hover:[color:var(--glacier)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
            style={{ color: "var(--text-subtle)" }}
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
