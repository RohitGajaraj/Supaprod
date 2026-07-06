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
import { relTimeCaps, traceRef, type VerdictWord } from "./format";

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

export interface OpportunityRowProps {
  ice: number;
  title: string;
  sub: string;
  verdict: VerdictWord;
  hasPencil: boolean;
  onChallenge: () => void;
  challengePending: boolean;
  /** OBS-10: write actions ported from the retired /product Opportunities
   * tab. Omit any handler to hide it entirely rather than disabling it. */
  onDraftSpec?: () => void;
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
}

/**
 * One ICE-ranked opportunity. Reuses the canonical `VerdictChip` (its 4
 * scored hues match this row's literal spec values exactly; PENDING keeps
 * VerdictChip's own neutral rather than forking a second PENDING style) and
 * `PencilNote` (the app's one pencil-annotation anatomy) rather than
 * hand-rolling row-local variants, per the "one object, one anatomy" law.
 * The card body is a single-click affordance that opens the detail sheet; the
 * `⋯` overflow (draft spec / lineage / status / delete) matches
 * `BuildMissionRow`'s and `SignalCard`'s established secondary-actions
 * pattern rather than crowding a third button onto the row.
 */
export function OpportunityRow({
  ice,
  title,
  sub,
  verdict,
  hasPencil,
  onChallenge,
  challengePending,
  onDraftSpec,
  onLineage,
  onDelete,
  onSetStatus,
  actionsPending = false,
  onOpen,
  status,
  id,
  updatedAt,
}: OpportunityRowProps) {
  const hasActions = onDraftSpec || onLineage || onDelete || onSetStatus;
  const clickable = Boolean(onOpen);
  const hasMeta = Boolean(id || updatedAt);
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
      {hasPencil ? (
        <PencilNote
          ink="best-bet"
          style={{ position: "absolute", top: "-11px", right: "14px", fontSize: "17px" }}
        >
          best bet
        </PencilNote>
      ) : null}

      <div className="flex-none text-center" style={{ width: "56px" }}>
        <div
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "23px",
            fontWeight: 460,
            color: "var(--text-primary)",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {ice.toFixed(1)}
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10.5px",
            letterSpacing: "0.14em",
            color: "var(--text-subtle)",
            marginTop: "3px",
          }}
        >
          ICE
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div
          style={{
            fontSize: "var(--text-base)",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: "3px",
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: "12.5px", lineHeight: 1.5, color: "var(--text-subtle)" }}>
          {sub}
        </div>
        {hasMeta ? (
          <div className="flex items-center" style={{ gap: "10px", marginTop: "6px" }}>
            {id ? <TraceChip id={id} /> : null}
            {updatedAt ? (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9.5px",
                  letterSpacing: "0.04em",
                  color: "var(--text-faint)",
                }}
              >
                updated {relTimeCaps(updatedAt)}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {status ? <StatusPill status={status} className="flex-none" /> : null}

      <VerdictChip tone={verdict} className="flex-none" />

      <Button
        variant="secondary"
        className="flex-none"
        style={{ fontSize: "12px", padding: "6px 13px", borderRadius: "7px" }}
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

      {hasActions ? (
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
            {onDraftSpec ? (
              <DropdownMenuItem
                onClick={(event) => {
                  event.stopPropagation();
                  onDraftSpec();
                }}
              >
                Draft spec
              </DropdownMenuItem>
            ) : null}
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
    </div>
  );
}
