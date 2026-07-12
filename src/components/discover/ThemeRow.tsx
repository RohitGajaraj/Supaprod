import { memo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ThemeRowProps {
  themeId: string;
  title: string;
  /** 1-based rank in the corroboration leaderboard (1 = strongest). */
  rank: number;
  /** Member-signal count (theme.frequency). The score the rank is based on. */
  signalCount: number;
  /** Distinct sources among the member signals. */
  sourceCount: number;
  onOpenDetail: (themeId: string) => void;
  onPromote: () => void;
  onDraftSpec: () => void;
  /** PC-29 layer 6: the theme's one delegation verb ("Frame the bet"), now a
   * menu item instead of an inline trigger so the row stays quiet. */
  onAsk: () => void;
  /** Mirrors OpportunityRow: any in-flight mutation disables the row actions. */
  actionsPending?: boolean;
}

const plural = (n: number) => (n === 1 ? "" : "s");

/**
 * One corroboration-ranked theme, the left-column sibling of `OpportunityRow`.
 * Same card shell (card fill, hairline, card radius, top-light + ambient
 * shadow) and the same left metric-block anatomy as the ICE numeral. Rows go
 * quiet (2026-07-11): rank, title, and "N signals · M sources" only. The
 * trace ref and "clustered ..." stamp live in ThemeDetail, and every action
 * lives in the one overflow menu (Promote / Draft spec / Frame the bet); the
 * row itself is the open affordance. Memoized to prevent re-renders when
 * parent re-renders but props unchanged.
 */
export const ThemeRow = memo(function ThemeRow({
  themeId,
  title,
  rank,
  signalCount,
  sourceCount,
  onOpenDetail,
  onPromote,
  onDraftSpec,
  onAsk,
  actionsPending = false,
}: ThemeRowProps) {
  const sub = `${signalCount} signal${plural(signalCount)} · ${sourceCount} source${plural(sourceCount)}`;
  const topRanked = rank === 1;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open theme: ${title}`}
      onClick={() => onOpenDetail(themeId)}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && event.target === event.currentTarget) {
          event.preventDefault();
          onOpenDetail(themeId);
        }
      }}
      className="loom-press relative flex cursor-pointer items-center outline-none transition-[background-color,box-shadow] [background-color:var(--card)] [box-shadow:var(--top-light),var(--shadow-ambient)] hover:[background-color:var(--raised)] hover:[box-shadow:var(--top-light-hover),var(--shadow-ambient)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
      style={{
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
            letterSpacing: "0.14em",
            color: "var(--text-faint)",
            marginTop: "3px",
          }}
        >
          RANK
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
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Theme actions"
            disabled={actionsPending}
            onClick={(event) => event.stopPropagation()}
            title={actionsPending ? "Working on this theme…" : undefined}
            className="loom-press outline-none transition-colors [color:var(--text-subtle)] hover:[color:var(--text-body)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
            style={{
              flexShrink: 0,
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
          <DropdownMenuItem onClick={onPromote}>Promote to opportunity</DropdownMenuItem>
          <DropdownMenuItem onClick={onDraftSpec}>Draft spec</DropdownMenuItem>
          <DropdownMenuItem onClick={onAsk}>Frame the bet</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});
