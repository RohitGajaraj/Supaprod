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
import type { VerdictWord } from "./format";

export const OPPORTUNITY_STATUSES = [
  "backlog",
  "now",
  "next",
  "later",
  "shipped",
  "dropped",
] as const;
export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

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
}

/**
 * One ICE-ranked opportunity. Reuses the canonical `VerdictChip` (its 4
 * scored hues match this row's literal spec values exactly; PENDING keeps
 * VerdictChip's own neutral rather than forking a second PENDING style) and
 * `PencilNote` (the app's one pencil-annotation anatomy) rather than
 * hand-rolling row-local variants, per the "one object, one anatomy" law.
 * The `⋯` overflow (draft spec / lineage / status / delete) matches
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
}: OpportunityRowProps) {
  const hasActions = onDraftSpec || onLineage || onDelete || onSetStatus;
  return (
    <div
      className="relative flex items-center transition-colors hover:[background-color:#141416]"
      style={{
        backgroundColor: "#111113",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "var(--radius-card)",
        padding: "16px 18px",
        gap: "16px",
        transitionDuration: "var(--dur-control)",
        transitionTimingFunction: "var(--ease)",
      }}
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
          }}
        >
          {ice.toFixed(1)}
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "7.5px",
            letterSpacing: "0.14em",
            color: "var(--text-faint)",
            marginTop: "3px",
          }}
        >
          ICE
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div
          style={{
            fontSize: "13.5px",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: "3px",
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: "12px", lineHeight: 1.5, color: "var(--text-subtle)" }}>{sub}</div>
      </div>

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
              style={{
                flexShrink: 0,
                fontFamily: "var(--font-mono)",
                fontSize: "14px",
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
            {onDraftSpec ? (
              <DropdownMenuItem onClick={onDraftSpec}>Draft spec</DropdownMenuItem>
            ) : null}
            {onLineage ? <DropdownMenuItem onClick={onLineage}>Lineage</DropdownMenuItem> : null}
            {onSetStatus ? (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Move to…</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {OPPORTUNITY_STATUSES.map((s) => (
                    <DropdownMenuItem key={s} onClick={() => onSetStatus(s)}>
                      {s}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
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
  );
}
