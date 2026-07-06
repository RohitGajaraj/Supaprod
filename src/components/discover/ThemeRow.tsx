import { ArrowUpRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { relTimeCaps, traceRef } from "./format";

export interface ThemeRowProps {
  themeId: string;
  title: string;
  /** 1-based rank in the corroboration leaderboard (1 = strongest). */
  rank: number;
  /** Member-signal count (theme.frequency). The score the rank is based on. */
  signalCount: number;
  /** Distinct sources among the member signals. */
  sourceCount: number;
  /** Newest member's created_at, or null when the theme has no members yet. */
  newestCreatedAt: string | null;
  /** The theme's own `created_at` (when Cadence clustered it), source of the
   * quiet "clustered ..." caption on the trace tail. Themes carry no
   * `updated_at`, so this is the honest freshness stamp; omit and it is
   * skipped rather than fabricated. */
  createdAt?: string | null;
  onOpenDetail: (themeId: string) => void;
  onPromote: () => void;
  onDraftSpec: () => void;
  /** Mirrors OpportunityRow: any in-flight mutation disables the row actions. */
  actionsPending?: boolean;
}

const plural = (n: number) => (n === 1 ? "" : "s");

/**
 * One corroboration-ranked theme, the left-column sibling of `OpportunityRow`.
 * Same card shell (card fill, hairline, card radius, top-light + ambient
 * shadow), the same left metric-block anatomy as the ICE numeral, and the same
 * trailing overflow menu. The block leads with the explicit rank (the top one
 * in ember) over the signal count it is scored on. The whole row is a button
 * that opens `ThemeDetail`; the menu stops propagation so a menu press never
 * also opens the drawer.
 */
export function ThemeRow({
  themeId,
  title,
  rank,
  signalCount,
  sourceCount,
  newestCreatedAt,
  createdAt,
  onOpenDetail,
  onPromote,
  onDraftSpec,
  actionsPending = false,
}: ThemeRowProps) {
  const sub =
    `${sourceCount} source${plural(sourceCount)}` +
    (newestCreatedAt ? ` · newest ${relTimeCaps(newestCreatedAt)}` : "");
  const topRanked = rank === 1;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open theme: ${title}`}
      onClick={() => onOpenDetail(themeId)}
      onKeyDown={(event) => {
        if (
          (event.key === "Enter" || event.key === " ") &&
          event.target === event.currentTarget
        ) {
          event.preventDefault();
          onOpenDetail(themeId);
        }
      }}
      className="relative flex cursor-pointer items-center outline-none transition-[background-color,box-shadow] [box-shadow:var(--top-light),var(--shadow-ambient)] hover:[background-color:var(--raised)] hover:[box-shadow:var(--top-light-hover),var(--shadow-ambient)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-card)",
        padding: "16px 18px",
        gap: "16px",
        transitionDuration: "var(--dur-control)",
        transitionTimingFunction: "var(--ease)",
      }}
    >
      <div className="flex-none text-center" style={{ width: "60px" }}>
        <div
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "23px",
            fontWeight: 460,
            color: topRanked ? "var(--ember-text)" : "var(--text-primary)",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {`#${rank}`}
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            letterSpacing: "0.06em",
            color: "var(--text-subtle)",
            marginTop: "3px",
            whiteSpace: "nowrap",
          }}
        >
          {signalCount} signal{plural(signalCount)}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div
          style={{
            fontSize: "var(--text-base)",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: "3px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: "12px", lineHeight: 1.5, color: "var(--text-subtle)" }}>{sub}</div>
        <div className="flex flex-wrap items-center" style={{ marginTop: "5px" }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "9.5px",
              letterSpacing: "0.06em",
              color: "var(--text-faint)",
            }}
          >
            THM·{traceRef(themeId)}
          </span>
          {createdAt ? (
            <>
              <span
                aria-hidden="true"
                style={{ margin: "0 8px", fontSize: "9.5px", color: "var(--text-faint)" }}
              >
                ·
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9.5px",
                  letterSpacing: "0.04em",
                  color: "var(--text-subtle)",
                }}
              >
                clustered {relTimeCaps(createdAt)}
              </span>
            </>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        title="Promote to opportunity"
        aria-label="Promote to opportunity"
        disabled={actionsPending}
        onClick={(event) => {
          event.stopPropagation();
          if (!actionsPending) onPromote();
        }}
        className="loom-press outline-none transition-colors [color:var(--text-subtle)] hover:[color:var(--ember-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
        style={{
          flexShrink: 0,
          display: "inline-flex",
          alignItems: "center",
          background: "none",
          border: "none",
          cursor: actionsPending ? "default" : "pointer",
          opacity: actionsPending ? 0.5 : 1,
          padding: "2px 4px",
        }}
      >
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Theme actions"
            disabled={actionsPending}
            onClick={(event) => event.stopPropagation()}
            className="loom-press"
            style={{
              flexShrink: 0,
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
          <DropdownMenuItem onClick={onPromote}>Promote to opportunity</DropdownMenuItem>
          <DropdownMenuItem onClick={onDraftSpec}>Draft spec</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
