import { memo, type CSSProperties } from "react";
import { Button, PencilNote, VerdictChip } from "@/components/obsidian";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AskInContext } from "@/components/obsidian/AskInContext";
import { relTimeCaps, traceRef, type VerdictWord } from "./format";
import type { Designation } from "./ranking";

export const OPPORTUNITY_STATUSES = [
  "backlog",
  "now",
  "next",
  "later",
  "shipped",
  "dropped",
] as const;
export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

/** The six lane statuses, each mapped to a semantic token tone and a
 * sentence-case label. Tokened tones only (ember stays reserved for the one
 * Capture CTA): glacier for the active lanes, moss for shipped, madder for
 * dropped, quiet text tones for the parked ends. Shared by the row and the
 * detail sheet so a status reads the same wherever it appears. */
export const STATUS_META: Record<OpportunityStatus, { color: string; label: string }> = {
  backlog: { color: "var(--text-faint)", label: "Backlog" },
  now: { color: "var(--glacier)", label: "Now" },
  next: { color: "var(--glacier)", label: "Next" },
  later: { color: "var(--text-muted)", label: "Later" },
  shipped: { color: "var(--moss)", label: "Shipped" },
  dropped: { color: "var(--madder)", label: "Dropped" },
};

/** A sentence-case label for a lane status, safe for an unknown value. */
export function statusLabel(status: string): string {
  return STATUS_META[status as OpportunityStatus]?.label ?? status;
}

/** A small tokened pill naming the current lane status, so the stage is
 * visible without opening the Move-to menu. Rounded, hairline, mono 10px,
 * sentence-case. */
export function StatusPill({ status, className }: { status: string; className?: string }) {
  const meta = STATUS_META[status as OpportunityStatus] ?? {
    color: "var(--text-faint)",
    label: status,
  };
  return (
    <span
      className={className}
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "10px",
        letterSpacing: "0.02em",
        color: meta.color,
        border: "1px solid var(--hairline)",
        borderRadius: "999px",
        padding: "2px 8px",
        flexShrink: 0,
        lineHeight: 1.4,
      }}
    >
      {meta.label}
    </span>
  );
}

/** The pencil-ink color for each non-best designation. The best bet is the one
 * lime pencil wink (rendered as a PencilNote, not a tag), so it is not here;
 * the others read as quiet tags in their own ink: needs validation in blossom,
 * quick win in moss, heavy lift in apricot, watch this week in a quiet muted
 * tone. Semantic tokens only; ember stays reserved for the single Capture CTA. */
export const DESIGNATION_INK: Record<Exclude<NonNullable<Designation>, "best bet">, string> = {
  "needs validation": "var(--pencil-blossom)",
  "quick win": "var(--moss)",
  "heavy lift": "var(--pencil-apricot)",
  "watch this week": "var(--text-muted)",
};

/** The one-line meaning behind each non-best designation, so hovering the tag
 * (and the detail sheet) tells a human or an agent what to do about the bet. */
export const DESIGNATION_MEANING: Record<Exclude<NonNullable<Designation>, "best bet">, string> = {
  "needs validation": "High appeal, thin evidence. Let the Critic weigh in before you commit.",
  "quick win": "Low effort for real impact. A fast, safe ship.",
  "heavy lift": "Large effort for the expected return. Consider slicing it smaller.",
  "watch this week": "Gaining signals, not yet the top bet. Keep it in view.",
};

/** A quiet system designation tag for a non-best bet: small mono text on a
 * rounded hairline chip, colored by its pencil ink, low emphasis so it informs
 * without shouting. The best bet is the single loud pencil wink (a PencilNote),
 * never a tag; and `null` / "best bet" render nothing here. */
export function DesignationTag({
  designation,
  className,
}: {
  designation?: Designation;
  className?: string;
}) {
  if (!designation || designation === "best bet") return null;
  return (
    <span
      className={className}
      title={DESIGNATION_MEANING[designation]}
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "10px",
        letterSpacing: "0.02em",
        color: DESIGNATION_INK[designation],
        border: "1px solid var(--hairline)",
        borderRadius: "999px",
        padding: "2px 8px",
        lineHeight: 1.4,
        flexShrink: 0,
      }}
    >
      {designation}
    </span>
  );
}

/** A quiet mono trace chip, `OPP·XXXXXX`, so every bet carries a stable,
 * human-quotable reference. Display-only on the card (the sheet adds copy). */
function TraceChip({ id }: { id: string }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "9.5px",
        letterSpacing: "0.06em",
        color: "var(--text-faint)",
      }}
    >
      OPP·{traceRef(id)}
    </span>
  );
}

/** The rank spotlight: a small solid badge that reads the queue position in
 * plain language, so a layman gets the priority even though ICE is expert-only.
 * Rank 1 is a filled glacier pill (dark canvas text for contrast, bold); ranks
 * 2 to 3 are a lighter glacier tint pill; deeper ranks are a quiet outline pill.
 * Semantic tokens only; ember stays reserved for the single Capture CTA, so it
 * is never used here. */
function RankBadge({ rank }: { rank: number }) {
  const isTop = rank === 1;
  const isHigh = rank >= 2 && rank <= 3;
  const tone: CSSProperties = isTop
    ? {
        background: "var(--glacier)",
        color: "var(--canvas)",
        border: "1px solid transparent",
        fontWeight: 700,
      }
    : isHigh
      ? {
          background: "color-mix(in srgb, var(--glacier) 16%, transparent)",
          color: "var(--glacier)",
          border: "1px solid color-mix(in srgb, var(--glacier) 26%, transparent)",
          fontWeight: 600,
        }
      : {
          background: "transparent",
          color: "var(--text-muted)",
          border: "1px solid var(--hairline)",
          fontWeight: 500,
        };
  return (
    <span
      title={`Priority rank ${rank} of the queue`}
      aria-label={`Priority rank ${rank} of the queue`}
      style={{
        marginTop: "6px",
        fontFamily: "var(--font-mono)",
        fontSize: "10px",
        letterSpacing: "0.04em",
        borderRadius: "999px",
        padding: "1px 7px",
        lineHeight: 1.4,
        fontVariantNumeric: "tabular-nums",
        ...tone,
      }}
    >
      #{rank}
    </span>
  );
}

export interface OpportunityRowProps {
  ice: number;
  title: string;
  sub: string;
  verdict: VerdictWord;
  /** The system-derived bet designation (from ranking.ts). Drives the single
   * marker on the card: "best bet" renders the one lime pencil wink; the other
   * designations render a quiet tag; null renders nothing. */
  designation?: Designation;
  onChallenge: () => void;
  challengePending: boolean;
  /** OBS-10: write actions ported from the retired /product Opportunities
   * tab. Omit any handler to hide it entirely rather than disabling it. */
  onDraftSpec?: () => void;
  /** The spec draft is in flight for this row: the Draft spec button shows
   * its spinner. */
  draftPending?: boolean;
  onLineage?: () => void;
  onDelete?: () => void;
  onSetStatus?: (status: OpportunityStatus) => void;
  actionsPending?: boolean;
  /** Click-to-open: a single click (or Enter/Space) on the card body opens the
   * detail sheet. Every action control stops propagation so it never also
   * fires this. */
  onOpen?: () => void;
  /** The current lane status, shown as a pill on the card. */
  status?: string;
  /** The real opportunity id, source of the trace ref chip. */
  id?: string;
  /** Last-change timestamp, shown as a quiet "updated ..." caption. */
  updatedAt?: string;
  /** The 1-based deterministic queue position (from ranking.ts), shown as a
   * quiet mono ordering index next to the ICE anchor, distinct from the
   * colored ICE numeral. */
  rank?: number;
}

/**
 * One ICE-ranked opportunity. Reuses the canonical `VerdictChip` (its 4
 * scored hues match this row's literal spec values exactly; PENDING keeps
 * VerdictChip's own neutral rather than forking a second PENDING style) and
 * `PencilNote` (the app's one pencil-annotation anatomy) rather than
 * hand-rolling row-local variants, per the "one object, one anatomy" law.
 * The card body is a single-click affordance that opens the detail sheet.
 * "Draft spec" is promoted to the one clear primary action; the `⋯` overflow
 * (lineage / move-to / delete) holds the secondary actions, matching
 * `BuildMissionRow`'s and `SignalCard`'s established pattern. The anatomy is
 * the standard for every object card: a tier-colored strength anchor, the
 * title as the primary read, quiet spaced meta, colored status and verdict
 * chips for state, a faint trace-and-time tail, and one primary action.
 * Memoized to prevent re-renders when parent re-renders but props unchanged
 * (OpportunityQueue.tsx renders one of these per opportunity in the ranked
 * queue).
 */
export const OpportunityRow = memo(function OpportunityRow({
  ice,
  title,
  sub,
  verdict,
  designation,
  onChallenge,
  challengePending,
  onDraftSpec,
  draftPending = false,
  onLineage,
  onDelete,
  onSetStatus,
  actionsPending = false,
  onOpen,
  status,
  id,
  updatedAt,
  rank,
}: OpportunityRowProps) {
  const hasMenuActions = Boolean(onLineage || onDelete || onSetStatus);
  const clickable = Boolean(onOpen);
  const hasMeta = Boolean(id || updatedAt);
  // The score tier is the one meaningful color on the anchor: strong bets read
  // moss, mid glacier, weak a quiet muted tone. It is the at-a-glance priority
  // cue, so the numeral and its bar share the same tone.
  const tier = ice >= 7 ? "var(--moss)" : ice >= 4 ? "var(--glacier)" : "var(--text-muted)";
  // The caller joins provenance with a middle dot; split it back so each fact
  // reads as its own spaced item rather than a cramped run-on.
  const subParts = sub.split(" · ").filter(Boolean);
  return (
    <div
      className={`relative flex items-center transition-[background-color,box-shadow,transform] [box-shadow:var(--top-light),var(--shadow-ambient)] hover:[background-color:var(--raised)] hover:[box-shadow:var(--top-light-hover),var(--shadow-ambient)]${
        clickable
          ? " loom-press cursor-pointer outline-none hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]"
          : ""
      }`}
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-card)",
        padding: "16px 18px",
        gap: "16px",
        transitionDuration: "var(--dur-control)",
        transitionTimingFunction: "var(--ease)",
      }}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? `Open ${title}` : undefined}
      onClick={clickable ? () => onOpen?.() : undefined}
      onKeyDown={
        clickable
          ? (event) => {
              if (event.target !== event.currentTarget) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOpen?.();
              }
            }
          : undefined
      }
    >
      {designation === "best bet" ? (
        <PencilNote
          ink="best-bet"
          style={{ position: "absolute", top: "-11px", right: "14px", fontSize: "17px" }}
        >
          best bet
        </PencilNote>
      ) : null}

      <div className="flex flex-none flex-col items-center" style={{ width: "54px" }}>
        <div
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "23px",
            fontWeight: 460,
            color: tier,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {ice.toFixed(1)}
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
          ICE
        </div>
        <div
          aria-hidden="true"
          style={{
            width: "22px",
            height: "3px",
            borderRadius: "999px",
            backgroundColor: tier,
            marginTop: "4px",
          }}
        />
        {rank != null ? <RankBadge rank={rank} /> : null}
      </div>

      <div className="min-w-0 flex-1">
        <div
          style={{
            fontSize: "var(--text-base)",
            fontWeight: 600,
            color: "var(--text-primary)",
            lineHeight: 1.35,
          }}
        >
          {title}
        </div>
        {subParts.length > 0 ? (
          <div
            className="flex flex-wrap items-center"
            style={{
              marginTop: "4px",
              fontSize: "11.5px",
              lineHeight: 1.5,
              color: "var(--text-subtle)",
            }}
          >
            {subParts.map((part, idx) => (
              <span key={idx} className="inline-flex items-center">
                {idx > 0 ? (
                  <span aria-hidden="true" style={{ margin: "0 9px", color: "var(--text-faint)" }}>
                    ·
                  </span>
                ) : null}
                {part}
              </span>
            ))}
          </div>
        ) : null}
        {hasMeta ? (
          <div className="flex flex-wrap items-center" style={{ marginTop: "6px" }}>
            {id ? <TraceChip id={id} /> : null}
            {id && updatedAt ? (
              <span
                aria-hidden="true"
                style={{ margin: "0 8px", fontSize: "9.5px", color: "var(--text-faint)" }}
              >
                ·
              </span>
            ) : null}
            {updatedAt ? (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9.5px",
                  letterSpacing: "0.04em",
                  color: "var(--text-subtle)",
                }}
              >
                updated {relTimeCaps(updatedAt)}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-none flex-col items-end" style={{ gap: "8px" }}>
        <div className="flex items-center" style={{ gap: "6px" }}>
          {designation && designation !== "best bet" ? (
            <DesignationTag designation={designation} />
          ) : null}
          {status ? <StatusPill status={status} /> : null}
          <VerdictChip tone={verdict} />
        </div>
        <div className="flex items-center" style={{ gap: "6px" }}>
          {onDraftSpec ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                onDraftSpec();
              }}
              loading={draftPending}
              disabled={actionsPending}
              title="Draft the cited spec from this bet"
            >
              Draft spec
            </Button>
          ) : null}
          <Button
            variant="tertiary"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              onChallenge();
            }}
            loading={challengePending}
            disabled={actionsPending}
            title="The Critic red-teams this bet · receipts attached"
          >
            Challenge
          </Button>
          {hasMenuActions ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Opportunity actions"
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
                {onLineage ? (
                  <DropdownMenuItem
                    onClick={(event) => {
                      event.stopPropagation();
                      onLineage();
                    }}
                  >
                    Where this came from
                  </DropdownMenuItem>
                ) : null}
                {onSetStatus ? (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger onClick={(event) => event.stopPropagation()}>
                      Move to…
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {OPPORTUNITY_STATUSES.map((s) => (
                        <DropdownMenuItem
                          key={s}
                          onClick={(event) => {
                            event.stopPropagation();
                            onSetStatus(s);
                          }}
                        >
                          {STATUS_META[s].label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                ) : null}
                {onDelete ? (
                  <DropdownMenuItem
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete();
                    }}
                    className="text-[var(--madder)]"
                  >
                    Delete
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          {/* PC-29 layer 6: the one contextual delegation verb for a bet. */}
          {id ? (
            <AskInContext stationOrKind="opportunity" targetId={id} targetTitle={title} />
          ) : null}
        </div>
      </div>
    </div>
  );
});
